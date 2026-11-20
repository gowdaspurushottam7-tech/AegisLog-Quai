import os
import sys
import time
import json
import socket
import struct
from datetime import datetime, timezone, timedelta

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHARED_DIR = os.path.join(BASE_DIR, "shared")
if SHARED_DIR not in sys.path:
    sys.path.insert(0, SHARED_DIR)

from crypto_engine import (
    compute_hash_chain,
    build_merkle_tree,
    encrypt_vault_batch,
    get_or_create_vault_key
)
from eth_rpc import (
    is_node_connected,
    send_anchor_batch,
    get_transaction_receipt
)

DATA_DIR = os.path.join(BASE_DIR, "data")
VAULT_DIR = os.path.join(BASE_DIR, "vault")
LOG_FILE = os.path.join(DATA_DIR, "server.log")
KILL_FLAG_FILE = os.path.join(VAULT_DIR, ".agent_killed")
HEARTBEAT_FILE = os.path.join(VAULT_DIR, ".heartbeat")
STATE_FILE = os.path.join(VAULT_DIR, ".agent_state.json")
CONFIG_FILE = os.path.join(SHARED_DIR, "contract_config.json")

IST = timezone(timedelta(hours=5, minutes=30))

def get_ntp_timestamp(host="pool.ntp.org", timeout=2.0) -> int:
    """Returns integer unix timestamp via NTP or system clock fallback."""
    try:
        client = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        client.settimeout(timeout)
        data = b'\x1b' + 47 * b'\0'
        client.sendto(data, (host, 123))
        resp, _ = client.recvfrom(1024)
        if resp:
            unpacked = struct.unpack("!12I", resp[0:48])
            ntp_seconds = unpacked[10] - 2208988800
            return int(ntp_seconds)
    except Exception:
        pass
    return int(time.time())

def load_contract_config():
    if not os.path.exists(CONFIG_FILE):
        return None
    try:
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None

def update_heartbeat(batch_id=0, log_count=0):
    os.makedirs(VAULT_DIR, exist_ok=True)
    ts = int(time.time())
    data = {
        "timestamp": ts,
        "utc": datetime.fromtimestamp(ts, tz=timezone.utc).isoformat(),
        "ist": datetime.fromtimestamp(ts, tz=IST).isoformat(),
        "status": "ALIVE",
        "latest_batch_id": batch_id,
        "total_logs": log_count,
        "pid": os.getpid()
    }
    with open(HEARTBEAT_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

def main():
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(VAULT_DIR, exist_ok=True)
    key = get_or_create_vault_key()

    # Clear kill flag on fresh startup
    if os.path.exists(KILL_FLAG_FILE):
        os.remove(KILL_FLAG_FILE)

    print("=" * 70)
    print("🛡️  AegisLog Cryptographic Log Agent & Blockchain Anchorer")
    print("    Zero-Trust · CERT-In 180-Day Rule · BSA Section 63 Admissible")
    print("=" * 70)
    print(f"[Agent] Log file target: {LOG_FILE}")
    print(f"[Agent] Encrypted vault: {VAULT_DIR}")
    print(f"[Agent] Heartbeat path:  {HEARTBEAT_FILE}")

    # Load persistent state if exists
    prev_chain_hash = "0" * 64
    batch_counter = 0
    file_position = 0

    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                state = json.load(f)
                prev_chain_hash = state.get("prev_chain_hash", "0" * 64)
                batch_counter = state.get("batch_counter", 0)
                file_position = state.get("file_position", 0)
                print(f"[Agent] Resumed state: batch={batch_counter}, chain_head={prev_chain_hash[:16]}...")
        except Exception as e:
            print(f"[Agent Warning] Could not parse state file: {e}")

    pending_lines = []
    last_batch_time = time.time()
    batch_interval = 10.0  # 10 seconds per batch anchor

    # Ensure log file exists
    if not os.path.exists(LOG_FILE):
        with open(LOG_FILE, "w", encoding="utf-8") as f:
            pass

    update_heartbeat(batch_counter, 0)

    while True:
        # Check Red Team kill flag
        if os.path.exists(KILL_FLAG_FILE):
            print("\n🚨 [ALERT] Red Team Kill Flag detected (.agent_killed)!")
            print("   Agent heartbeat HALTED. Dead Man's Switch will trip in 15 seconds.")
            # Sleep and refrain from updating heartbeat or anchoring
            while os.path.exists(KILL_FLAG_FILE):
                time.sleep(1)
            print("[Agent] Kill flag removed. Resuming operations...")

        # 1. Tail log file
        try:
            with open(LOG_FILE, "r", encoding="utf-8") as f:
                f.seek(file_position)
                new_text = f.read()
                file_position = f.tell()

            if new_text:
                new_lines = [l for l in new_text.splitlines() if l.strip()]
                if new_lines:
                    # Update hash chain incrementally
                    line_hashes, prev_chain_hash = compute_hash_chain(new_lines, prev_chain_hash)
                    pending_lines.extend(new_lines)
                    print(f"[Tail] Read {len(new_lines)} new log(s). Chain head: {prev_chain_hash[:12]}...")
        except Exception as e:
            print(f"[Agent Read Error] {e}")

        # Update heartbeat continuously
        update_heartbeat(batch_counter, len(pending_lines))

        # 2. Check if 10-second batch interval elapsed
        elapsed = time.time() - last_batch_time
        if elapsed >= batch_interval:
            if pending_lines:
                batch_counter += 1
                current_batch_lines = [l.strip() for l in pending_lines if l.strip()]
                pending_lines = []
                log_count = len(current_batch_lines)
                ntp_ts = get_ntp_timestamp()

                # A. Build Merkle Tree
                merkle_root, proofs, leaves_hex = build_merkle_tree(current_batch_lines)

                # B. Encrypt batch with AES-256-GCM
                vault_record, vault_json = encrypt_vault_batch(batch_counter, current_batch_lines, key)
                vault_rel_path = f"vault/batch_{batch_counter}.enc"
                vault_abs_path = os.path.join(VAULT_DIR, f"batch_{batch_counter}.enc")

                with open(vault_abs_path, "w", encoding="utf-8") as vf:
                    vf.write(vault_json)

                # Save proof metadata for fast verification and evidence export
                meta_record = {
                    "batch_id": batch_counter,
                    "merkle_root": merkle_root,
                    "vault_ref": vault_rel_path,
                    "ntp_timestamp": ntp_ts,
                    "log_count": log_count,
                    "leaves_hex": leaves_hex,
                    "proofs": proofs,
                    "chain_head": prev_chain_hash,
                    "lines": current_batch_lines
                }
                meta_path = os.path.join(VAULT_DIR, f"batch_{batch_counter}.meta.json")
                with open(meta_path, "w", encoding="utf-8") as mf:
                    json.dump(meta_record, mf, indent=2)

                print("\n" + "-" * 70)
                print(f"📦 [Batch #{batch_counter}] Sealed {log_count} log entries")
                print(f"   Root Hash    : {merkle_root}")
                print(f"   Vault Encrypt: {vault_rel_path} (AES-256-GCM)")
                print(f"   NTP Timestamp: {ntp_ts}")

                # C. Anchor to Smart Contract
                tx_hash = "OFFLINE_SIMULATION"
                config = load_contract_config()
                rpc_url = config.get("rpcUrl", "http://127.0.0.1:8545") if config else "http://127.0.0.1:8545"
                contract_addr = config.get("address") if config else None

                if contract_addr and is_node_connected(rpc_url):
                    try:
                        tx_hash = send_anchor_batch(
                            rpc_url,
                            contract_addr,
                            merkle_root,
                            vault_rel_path,
                            ntp_ts,
                            log_count
                        )
                        receipt = get_transaction_receipt(rpc_url, tx_hash)
                        block_num = int(receipt.get("blockNumber", "0x0"), 16) if receipt else 0
                        print(f"   ⛓️  On-Chain Anchor TX: {tx_hash} (Block #{block_num})")
                        meta_record["tx_hash"] = tx_hash
                        meta_record["block_number"] = block_num
                        with open(meta_path, "w", encoding="utf-8") as mf:
                            json.dump(meta_record, mf, indent=2)
                    except Exception as e:
                        print(f"   ⚠️  On-Chain Anchor Failed: {e}")
                else:
                    print(f"   ⚠️  Hardhat node or contract not ready yet, stored in encrypted vault.")

                print("-" * 70 + "\n")

                # Save state
                with open(STATE_FILE, "w", encoding="utf-8") as sf:
                    json.dump({
                        "prev_chain_hash": prev_chain_hash,
                        "batch_counter": batch_counter,
                        "file_position": file_position,
                        "last_batch_time": time.time(),
                        "last_tx_hash": tx_hash
                    }, sf, indent=2)

            last_batch_time = time.time()

        time.sleep(1.0)

if __name__ == "__main__":
    main()
