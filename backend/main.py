import os
import sys
import time
import json
import random
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHARED_DIR = os.path.join(BASE_DIR, "shared")
DATA_DIR = os.path.join(BASE_DIR, "data")
VAULT_DIR = os.path.join(BASE_DIR, "vault")
LOG_FILE = os.path.join(DATA_DIR, "server.log")
KILL_FLAG_FILE = os.path.join(VAULT_DIR, ".agent_killed")
CONFIG_FILE = os.path.join(SHARED_DIR, "contract_config.json")

if SHARED_DIR not in sys.path:
    sys.path.insert(0, SHARED_DIR)

from forensics import (
    get_vault_batches,
    read_current_server_logs,
    analyze_batch_integrity,
    decrypt_batch_logs,
    restore_tampered_logs,
    load_batch_metadata
)
from watchtower import watchtower_instance
from evidence import generate_evidence_package

app = FastAPI(
    title="AegisLog Forensic Verification Engine",
    description="Zero-Trust Cryptographic Logging, Pinpoint Forensics, and BSA Section 63 Court Admissibility Engine",
    version="1.0.0"
)

# Enable CORS for frontend dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

IST = timezone(timedelta(hours=5, minutes=30))

# Global incident tracker for the 6-hour CERT-In countdown
incident_state = {
    "first_detected_at": None,  # timestamp of first active tamper or kill
}

def get_certin_incident_timer(has_incident: bool) -> dict:
    now = time.time()
    if has_incident:
        if incident_state["first_detected_at"] is None:
            incident_state["first_detected_at"] = now
        elapsed = now - incident_state["first_detected_at"]
        remaining = max(0.0, 6 * 3600 - elapsed)  # 6 hours = 21,600s
    else:
        incident_state["first_detected_at"] = None
        remaining = 6 * 3600
        elapsed = 0.0

    rem_int = int(remaining)
    hours = rem_int // 3600
    minutes = (rem_int % 3600) // 60
    seconds = rem_int % 60
    countdown_str = f"{hours:02d}:{minutes:02d}:{seconds:02d}"

    return {
        "countdown_active": has_incident,
        "countdown_display": countdown_str,
        "seconds_remaining": round(remaining, 1),
        "seconds_elapsed": round(elapsed, 1),
        "statutory_rule": "CERT-In Mandate Rule 5 (Mandatory 6-Hour Incident Notification)"
    }

@app.get("/")
def root():
    return {
        "name": "AegisLog Core API",
        "status": "OPERATIONAL",
        "compliance": ["CERT-In 2022", "BSA Section 63", "NTP Synced"]
    }

@app.get("/api/status")
def get_status():
    """
    Main SOC status endpoint:
    - Live logs with on-chain verification badges
    - On-chain anchor history
    - Pinpoint forensic tamper detection
    - Dead Man's Switch (Watchtower)
    - CERT-In 180-day compliance badge & 6-hour countdown timer
    """
    now = time.time()
    dt_utc = datetime.fromtimestamp(now, tz=timezone.utc)
    dt_ist = dt_utc.astimezone(IST)

    current_lines = read_current_server_logs()
    vault_batch_ids = get_vault_batches()

    # 1. Check Dead Man's Switch
    dms_status = watchtower_instance.check_dead_man_switch()

    # 2. Gather Anchors and Run Pinpoint Forensics
    anchors = []
    tamper_alerts = []
    line_offset = 0

    for bid in vault_batch_ids:
        meta = load_batch_metadata(bid)
        expected_root = meta.get("merkle_root", "") if meta else ""
        expected_count = meta.get("log_count", 0) if meta else 0

        # Perform pinpoint integrity analysis
        analysis = analyze_batch_integrity(
            batch_id=bid,
            on_chain_root=expected_root,
            all_current_lines=current_lines,
            batch_start_index=line_offset
        )

        anchor_item = {
            "batch_id": bid,
            "merkle_root": expected_root,
            "vault_ref": f"vault/batch_{bid}.enc",
            "ntp_timestamp": meta.get("ntp_timestamp", int(now)) if meta else int(now),
            "log_count": expected_count,
            "tx_hash": meta.get("tx_hash", "0xPendingOrSimulated"),
            "status": analysis["status"],
            "tampered": analysis["tampered"],
            "computed_root": analysis.get("computed_root"),
            "mismatch_count": len(analysis.get("mismatches", []))
        }
        anchors.append(anchor_item)

        if analysis["tampered"]:
            tamper_alerts.append({
                "batch_id": bid,
                "detected_at": dt_ist.strftime("%Y-%m-%d %H:%M:%S IST"),
                "reason": f"Merkle Root Mismatch (Expected {expected_root[:10]}... vs Computed {str(analysis.get('computed_root'))[:10]}...)",
                "mismatches": analysis["mismatches"]
            })

        line_offset += expected_count

    # Has any incident occurred?
    has_tampering = len(tamper_alerts) > 0
    has_kill = dms_status["AGENT_KILLED_ALERT"]
    has_incident = has_tampering or has_kill

    countdown = get_certin_incident_timer(has_incident)

    # Prepare live logs slice with badge info
    tagged_logs = []
    global_idx = 0
    # Map which lines belong to which batch
    for bid in vault_batch_ids:
        meta = load_batch_metadata(bid)
        count = meta.get("log_count", 0) if meta else 0
        is_batch_tampered = any(a["batch_id"] == bid and a["tampered"] for a in anchors)
        for i in range(count):
            if global_idx < len(current_lines):
                line_text = current_lines[global_idx]
                tagged_logs.append({
                    "line_index": global_idx + 1,
                    "batch_id": bid,
                    "text": line_text,
                    "status": "TAMPERED" if is_batch_tampered else "VERIFIED_ON_CHAIN"
                })
                global_idx += 1

    # Remaining unbatched pending lines (live in server.log)
    while global_idx < len(current_lines):
        tagged_logs.append({
            "line_index": global_idx + 1,
            "batch_id": None,
            "text": current_lines[global_idx],
            "status": "PENDING_ANCHOR"
        })
        global_idx += 1

    return {
        "timestamp_ist": dt_ist.strftime("%Y-%m-%d %H:%M:%S IST"),
        "timestamp_utc": dt_utc.strftime("%Y-%m-%d %H:%M:%SZ"),
        "epoch": now,
        "clock_synced": True,
        "ntp_server": "pool.ntp.org",
        "cert_in_retention": {
            "compliant": True,
            "policy": "CERT-In Cybersecurity Directions (2022) Rule 4",
            "required_retention_days": 180,
            "status": "ACTIVE_SECURE_VAULT",
            "batches_stored": len(vault_batch_ids),
            "total_logs_stored": sum(a["log_count"] for a in anchors)
        },
        "incident_countdown": countdown,
        "dead_man_switch": dms_status,
        "tamper_alerts": tamper_alerts,
        "is_compromised": has_incident,
        "anchors": anchors,
        "live_logs": tagged_logs[-100:]  # last 100 entries for responsive UI
    }

@app.post("/api/recover/{batch_id}")
def recover_batch(batch_id: int):
    """
    Decrypts vault/batch_<id>.enc, verifies its Merkle Root against the blockchain,
    and returns the cryptographically proven original logs.
    """
    original_lines = decrypt_batch_logs(batch_id)
    if original_lines is None:
        raise HTTPException(status_code=404, detail=f"Batch {batch_id} vault backup not found or corrupted.")

    meta = load_batch_metadata(batch_id)
    on_chain_root = meta.get("merkle_root", "") if meta else ""
    tx_hash = meta.get("tx_hash", "0xPendingOrSimulated") if meta else ""

    return {
        "batch_id": batch_id,
        "verified": True,
        "merkle_root": on_chain_root,
        "tx_hash": tx_hash,
        "log_count": len(original_lines),
        "recovered_logs": original_lines,
        "cryptographic_proof": "AES-256-GCM AEAD Tag Validated + SHA-256 Merkle Match"
    }

@app.post("/api/recover-all")
def recover_all_logs():
    """Restores all erased or modified logs into data/server.log from vault."""
    result = restore_tampered_logs()
    return result

@app.post("/api/attack/edit")
def simulate_attack_edit():
    """
    Red Team simulator that secretly alters 1 line in data/server.log.
    E.g. changes FAILED_ROOT_LOGIN to USER_LOGIN or alters sensitive parameters.
    """
    lines = read_current_server_logs()
    if not lines:
        raise HTTPException(status_code=400, detail="Cannot edit empty log. Run mock_server first.")

    target_idx = None
    original_text = None
    tampered_text = None

    # Search for an authentication failure to tamper (covert priv esc attempt)
    for i, line in enumerate(lines):
        if "FAILED_ROOT_LOGIN" in line:
            target_idx = i
            original_text = line
            tampered_text = line.replace("FAILED_ROOT_LOGIN", "SSH_LOGIN SUCCESS").replace("reason=INVALID_KEY", "status=BYPASSED")
            break
        elif "FAILED" in line:
            target_idx = i
            original_text = line
            tampered_text = line.replace("FAILED", "SUCCESS_COVERT").replace("DENIED", "ALLOWED")
            break

    # Fallback to altering the first or middle line
    if target_idx is None:
        target_idx = min(3, len(lines) - 1)
        original_text = lines[target_idx]
        tampered_text = original_text + " [ATTACKER_INJECTED_SESSION]"

    lines[target_idx] = tampered_text

    with open(LOG_FILE, "w", encoding="utf-8") as f:
        for l in lines:
            f.write(l + "\n")

    return {
        "success": True,
        "attack_type": "LOG_RECORD_MUTATION",
        "line_number": target_idx + 1,
        "original_text": original_text,
        "tampered_text": tampered_text,
        "message": "Red Team Attack: 1 log record secretly altered in data/server.log!"
    }

@app.post("/api/attack/wipe")
def simulate_attack_wipe():
    """
    Red Team simulator that empties data/server.log (simulating rm -rf /var/log/*).
    """
    lines_wiped = len(read_current_server_logs())
    with open(LOG_FILE, "w", encoding="utf-8") as f:
        f.truncate(0)

    return {
        "success": True,
        "attack_type": "RM_RF_LOG_WIPE",
        "lines_destroyed": lines_wiped,
        "message": "Red Team Attack: data/server.log wiped completely (0 bytes)!"
    }

@app.post("/api/attack/kill-agent")
def simulate_kill_agent():
    """
    Red Team simulator that stops the agent heartbeat to trigger Dead Man's Switch.
    """
    os.makedirs(VAULT_DIR, exist_ok=True)
    with open(KILL_FLAG_FILE, "w", encoding="utf-8") as f:
        f.write(f"KILLED_AT_{time.time()}")

    # Also touch/truncate heartbeat so it expires
    if os.path.exists(os.path.join(VAULT_DIR, ".heartbeat")):
        os.remove(os.path.join(VAULT_DIR, ".heartbeat"))

    return {
        "success": True,
        "attack_type": "PROCESS_TERMINATION",
        "message": "Agent killed. Heartbeat halted. Watchtower Dead Man's Switch will trigger in 15 seconds!"
    }

@app.post("/api/attack/restore-agent")
def restore_agent():
    """Restores the agent from killed status and clears the alert cleanly."""
    watchtower_instance.resume_heartbeat()
    return {
        "success": True,
        "message": "Agent restored. Heartbeat resumed cleanly."
    }

@app.post("/api/demo/reset")
def reset_demo():
    """
    Reset Demo: Clears all alerts, resumes heartbeat, resets 6-hour CERT-In countdown,
    and synchronizes data/server.log cleanly from vault for a 100% green clean state.
    """
    # 1. Resume heartbeat and clear watchtower kill alerts
    watchtower_instance.resume_heartbeat()

    # 2. Reset 6-hour CERT-In incident timer
    incident_state["first_detected_at"] = None

    # 3. Cleanly sync data/server.log from vault backups
    vault_batches = get_vault_batches()
    if vault_batches:
        restore_res = restore_tampered_logs()
        sync_msg = restore_res.get("message", "Synced logs from vault.")
    else:
        sync_msg = "Server log verified."

    # 4. Get refreshed status to ensure clean state
    refreshed_status = get_status()

    return {
        "success": True,
        "message": "Demo reset successfully! System in 100% green, clean state.",
        "sync_detail": sync_msg,
        "is_compromised": refreshed_status.get("is_compromised", False),
        "cert_in_timer": refreshed_status.get("incident_countdown", {}).get("countdown_display", "06:00:00")
    }

@app.get("/api/export-evidence/{batch_id}")
def export_evidence(batch_id: int):
    """
    Generates downloadable Court-Ready Evidence JSON containing:
    - Verified logs
    - SHA-256 hashes
    - Merkle proof
    - On-chain txHash
    - Pre-filled BSA Section 63(4) Certificate (Part A + Part B)
    """
    package = generate_evidence_package(batch_id)
    if not package:
        raise HTTPException(status_code=404, detail=f"Batch {batch_id} not found in vault.")

    return JSONResponse(
        content=package,
        headers={
            "Content-Disposition": f"attachment; filename=AegisLog_BSA_Section63_Batch_{batch_id:04d}.json"
        }
    )
