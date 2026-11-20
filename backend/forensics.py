import os
import sys
import json
from typing import Dict, List, Any, Optional

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHARED_DIR = os.path.join(BASE_DIR, "shared")
VAULT_DIR = os.path.join(BASE_DIR, "vault")
DATA_DIR = os.path.join(BASE_DIR, "data")
LOG_FILE = os.path.join(DATA_DIR, "server.log")

if SHARED_DIR not in sys.path:
    sys.path.insert(0, SHARED_DIR)

from crypto_engine import (
    build_merkle_tree,
    decrypt_vault_batch,
    get_or_create_vault_key
)

def get_vault_batches() -> List[int]:
    """Returns sorted list of batch IDs present in vault."""
    if not os.path.exists(VAULT_DIR):
        return []
    batch_ids = []
    for fname in os.listdir(VAULT_DIR):
        if fname.startswith("batch_") and fname.endswith(".enc"):
            try:
                bid = int(fname.replace("batch_", "").replace(".enc", ""))
                batch_ids.append(bid)
            except ValueError:
                pass
    return sorted(batch_ids)

def load_vault_batch(batch_id: int) -> Optional[dict]:
    enc_path = os.path.join(VAULT_DIR, f"batch_{batch_id}.enc")
    if not os.path.exists(enc_path):
        return None
    try:
        with open(enc_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None

def load_batch_metadata(batch_id: int) -> Optional[dict]:
    meta_path = os.path.join(VAULT_DIR, f"batch_{batch_id}.meta.json")
    if not os.path.exists(meta_path):
        return None
    try:
        with open(meta_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None

def read_current_server_logs() -> List[str]:
    if not os.path.exists(LOG_FILE):
        return []
    try:
        with open(LOG_FILE, "r", encoding="utf-8") as f:
            return [l for l in f.read().splitlines() if l.strip()]
    except Exception:
        return []

def decrypt_batch_logs(batch_id: int) -> Optional[List[str]]:
    vault_rec = load_vault_batch(batch_id)
    if not vault_rec:
        return None
    try:
        key = get_or_create_vault_key()
        return decrypt_vault_batch(vault_rec, key)
    except Exception as e:
        print(f"[Forensics] Decrypt error for batch {batch_id}: {e}")
        return None

def analyze_batch_integrity(batch_id: int, on_chain_root: str, all_current_lines: List[str], batch_start_index: int) -> dict:
    """
    Performs Pinpoint Forensics for a batch.
    Compares slice of current server.log lines against the batch's decrypted vault backup and on-chain Merkle root.
    """
    original_lines = decrypt_batch_logs(batch_id)
    meta = load_batch_metadata(batch_id)

    if original_lines is None:
        return {
            "batch_id": batch_id,
            "status": "VAULT_MISSING",
            "tampered": False,
            "on_chain_root": on_chain_root,
            "computed_root": None,
            "mismatches": []
        }

    expected_count = len(original_lines)
    current_slice = all_current_lines[batch_start_index : batch_start_index + expected_count]

    # Compute Merkle Root of current slice in log file
    computed_root, _, _ = build_merkle_tree(current_slice)
    is_tampered = (computed_root.lower() != on_chain_root.lower())

    mismatches = []
    if is_tampered:
        # Pinpoint exact line discrepancies
        max_len = max(len(original_lines), len(current_slice))
        for idx in range(max_len):
            orig_text = original_lines[idx] if idx < len(original_lines) else "<LINE DELETED/TRUNCATED>"
            curr_text = current_slice[idx] if idx < len(current_slice) else "<LINE MISSING>"

            if orig_text != curr_text:
                mismatches.append({
                    "relative_index": idx,
                    "global_line_index": batch_start_index + idx + 1,
                    "original_text": orig_text,
                    "current_text": curr_text,
                    "type": "MODIFIED" if (idx < len(original_lines) and idx < len(current_slice)) else ("DELETED" if idx >= len(current_slice) else "INSERTED")
                })

    return {
        "batch_id": batch_id,
        "status": "TAMPERED" if is_tampered else "VERIFIED_ON_CHAIN",
        "tampered": is_tampered,
        "on_chain_root": on_chain_root,
        "computed_root": computed_root,
        "log_count": expected_count,
        "current_slice_count": len(current_slice),
        "mismatches": mismatches,
        "meta": meta
    }

def restore_tampered_logs(batch_id: Optional[int] = None) -> dict:
    """
    Restores erased/tampered logs using decrypted vault backups.
    If batch_id is None, recovers ALL batches sequentially.
    """
    batch_ids = get_vault_batches()
    if not batch_ids:
        return {"success": False, "message": "No vault backups found to restore."}

    all_restored_lines = []
    for bid in batch_ids:
        lines = decrypt_batch_logs(bid)
        if lines:
            all_restored_lines.extend(lines)

    # Overwrite data/server.log with verified original lines
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(LOG_FILE, "w", encoding="utf-8") as f:
        for line in all_restored_lines:
            f.write(line + "\n")

    return {
        "success": True,
        "message": f"Successfully restored {len(all_restored_lines)} log entries from AES-256-GCM vault backups.",
        "restored_batches": batch_ids,
        "total_lines": len(all_restored_lines)
    }
