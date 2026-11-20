import os
import sys
import time
import json
from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHARED_DIR = os.path.join(BASE_DIR, "shared")
VAULT_DIR = os.path.join(BASE_DIR, "vault")
CONFIG_FILE = os.path.join(SHARED_DIR, "contract_config.json")
KILL_FLAG_FILE = os.path.join(VAULT_DIR, ".agent_killed")
HEARTBEAT_FILE = os.path.join(VAULT_DIR, ".heartbeat")

if SHARED_DIR not in sys.path:
    sys.path.insert(0, SHARED_DIR)

from eth_rpc import (
    is_node_connected,
    get_total_batches,
    get_latest_batch
)

IST = timezone(timedelta(hours=5, minutes=30))

class Watchtower:
    def __init__(self, deadman_threshold_seconds: float = 15.0):
        self.deadman_threshold = deadman_threshold_seconds
        self.w3 = None
        self.contract = None
        self.config = None
        self.alert_triggered_at: Optional[float] = None
        self.incident_detected_at: Optional[float] = None

    def _connect_chain(self):
        if not os.path.exists(CONFIG_FILE):
            return
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                self.config = json.load(f)
            if self.config and self.config.get("address") and self.config.get("abi"):
                rpc = self.config.get("rpcUrl", "http://127.0.0.1:8545")
                self.w3 = Web3(Web3.HTTPProvider(rpc))
                if self.w3.is_connected():
                    addr = Web3.to_checksum_address(self.config["address"])
                    self.contract = self.w3.eth.contract(address=addr, abi=self.config["abi"])
        except Exception as e:
            # chain connection can be retried
            pass

    def get_latest_anchor_info(self) -> dict:
        """Retrieves the latest anchor from smart contract or local metadata cache."""
        if not self.config and os.path.exists(CONFIG_FILE):
            try:
                with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                    self.config = json.load(f)
            except Exception:
                pass

        if self.config and self.config.get("address"):
            rpc = self.config.get("rpcUrl", "http://127.0.0.1:8545")
            addr = self.config["address"]
            if is_node_connected(rpc):
                try:
                    total = get_total_batches(rpc, addr)
                    if total > 0:
                        batch = get_latest_batch(rpc, addr)
                        if batch:
                            return {
                                "batch_id": batch["batch_id"],
                                "merkle_root": batch["merkle_root"],
                                "vault_ref": batch["vault_ref"],
                                "ntp_timestamp": batch["ntp_timestamp"],
                                "log_count": batch["log_count"],
                                "source": "SMART_CONTRACT"
                            }
                except Exception:
                    pass

        # Fallback to local vault batch metadata
        meta_files = [f for f in os.listdir(VAULT_DIR) if f.startswith("batch_") and f.endswith(".meta.json")] if os.path.exists(VAULT_DIR) else []
        if meta_files:
            # Sort by batch id
            meta_files.sort(key=lambda x: int(x.replace("batch_", "").replace(".meta.json", "")))
            latest_file = os.path.join(VAULT_DIR, meta_files[-1])
            try:
                with open(latest_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    return {
                        "batch_id": data.get("batch_id", 0),
                        "merkle_root": data.get("merkle_root", ""),
                        "vault_ref": data.get("vault_ref", ""),
                        "ntp_timestamp": data.get("ntp_timestamp", int(time.time())),
                        "log_count": data.get("log_count", 0),
                        "source": "VAULT_FALLBACK"
                    }
            except Exception:
                pass

        return {
            "batch_id": 0,
            "merkle_root": None,
            "vault_ref": None,
            "ntp_timestamp": 0,
            "log_count": 0,
            "source": "NO_BATCHES_YET"
        }

    def check_dead_man_switch(self) -> dict:
        now = time.time()
        kill_flag_exists = os.path.exists(KILL_FLAG_FILE)

        latest_anchor = self.get_latest_anchor_info()
        anchor_ts = latest_anchor.get("ntp_timestamp", 0)

        # Heartbeat check
        heartbeat_ts = 0
        heartbeat_alive = False
        if os.path.exists(HEARTBEAT_FILE):
            try:
                with open(HEARTBEAT_FILE, "r", encoding="utf-8") as f:
                    hb = json.load(f)
                    heartbeat_ts = hb.get("timestamp", 0)
                    if (now - heartbeat_ts) < self.deadman_threshold:
                        heartbeat_alive = True
            except Exception:
                pass

        # Seconds since last on-chain anchor or heartbeat
        anchor_delta = (now - anchor_ts) if anchor_ts > 0 else 0
        heartbeat_delta = (now - heartbeat_ts) if heartbeat_ts > 0 else 0

        # Trigger if kill flag is explicitly present, or if heartbeat died > 15s after having started
        is_killed = False
        reason = "NORMAL_OPERATION"

        if kill_flag_exists:
            is_killed = True
            reason = "RED_TEAM_KILL_FLAG_TRIGGERED"
        elif heartbeat_ts > 0 and (now - heartbeat_ts) > self.deadman_threshold:
            is_killed = True
            reason = f"HEARTBEAT_EXPIRED (> {self.deadman_threshold}s without signal)"
        elif heartbeat_ts == 0 and anchor_ts > 0 and (now - anchor_ts) > (self.deadman_threshold * 2):
            is_killed = True
            reason = f"ON_CHAIN_ANCHOR_STALLED (> {int(now - anchor_ts)}s without anchor)"

        killed_timestamp_str = None
        if is_killed:
            if not self.alert_triggered_at:
                self.alert_triggered_at = now
            dt_utc = datetime.fromtimestamp(self.alert_triggered_at, tz=timezone.utc)
            dt_ist = dt_utc.astimezone(IST)
            killed_timestamp_str = dt_ist.strftime("%Y-%m-%d %H:%M:%S IST") + f" ({dt_utc.strftime('%H:%M:%SZ')})"
        else:
            self.alert_triggered_at = None

        display_status = "HEARTBEAT ACTIVE"
        if is_killed:
            if kill_flag_exists or heartbeat_delta < self.deadman_threshold:
                display_status = "HEARTBEAT HALTED"
            else:
                display_status = f"Elapsed: {round(heartbeat_delta, 1)}s > {int(self.deadman_threshold)}s limit"

        return {
            "AGENT_KILLED_ALERT": is_killed,
            "reason": reason,
            "display_status": display_status,
            "killed_timestamp": killed_timestamp_str,
            "kill_flag_active": kill_flag_exists,
            "heartbeat_age_seconds": round(heartbeat_delta, 1),
            "anchor_age_seconds": round(anchor_delta, 1),
            "threshold_seconds": self.deadman_threshold,
            "latest_anchor": latest_anchor
        }

    def resume_heartbeat(self):
        if os.path.exists(KILL_FLAG_FILE):
            try:
                os.remove(KILL_FLAG_FILE)
            except Exception:
                pass
        now = time.time()
        os.makedirs(VAULT_DIR, exist_ok=True)
        with open(HEARTBEAT_FILE, "w", encoding="utf-8") as f:
            json.dump({
                "timestamp": now,
                "utc": datetime.fromtimestamp(now, tz=timezone.utc).isoformat(),
                "ist": datetime.fromtimestamp(now, tz=IST).isoformat(),
                "status": "ALIVE"
            }, f, indent=2)
        self.alert_triggered_at = None
        self.incident_detected_at = None

watchtower_instance = Watchtower(deadman_threshold_seconds=15.0)
