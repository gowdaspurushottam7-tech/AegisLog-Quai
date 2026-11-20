import os
import sys
import time
import json

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "shared"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "agent"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

import mock_server
from crypto_engine import build_merkle_tree, encrypt_vault_batch, get_or_create_vault_key
from forensics import analyze_batch_integrity, read_current_server_logs, restore_tampered_logs
from evidence import generate_evidence_package
from watchtower import watchtower_instance
from main import (
    get_status,
    simulate_attack_edit,
    recover_all_logs,
    simulate_kill_agent,
    restore_agent,
    export_evidence
)

def run_e2e_test():
    print("=" * 65)
    print("🛡️  AEGISLOG END-TO-END VALIDATION & PINPOINT FORENSICS TEST")
    print("=" * 65)

    vault_dir = os.path.join(os.path.dirname(__file__), "vault")
    # Clean previous test batches from vault for pristine test run
    if os.path.exists(vault_dir):
        for f in os.listdir(vault_dir):
            if f.startswith("batch_"):
                try:
                    os.remove(os.path.join(vault_dir, f))
                except Exception:
                    pass

    # 1. Generate 6 realistic security log lines
    print("\n[Step 1] Generating 6 security log entries in data/server.log...")
    log_file = os.path.join(os.path.dirname(__file__), "data", "server.log")
    os.makedirs(os.path.dirname(log_file), exist_ok=True)

    generated_lines = []
    with open(log_file, "w", encoding="utf-8") as f:
        for _ in range(6):
            line = mock_server.generate_log_line()
            generated_lines.append(line)
            f.write(line + "\n")
    print(f"   ✓ Wrote {len(generated_lines)} lines to {log_file}")

    # 2. Simulate Agent sealing Batch 1
    print("\n[Step 2] Simulating Agent Sealing Batch #1 (Merkle + AES-256-GCM Vault)...")
    vault_dir = os.path.join(os.path.dirname(__file__), "vault")
    os.makedirs(vault_dir, exist_ok=True)

    key = get_or_create_vault_key()
    batch_id = 1
    merkle_root, proofs, leaves_hex = build_merkle_tree(generated_lines)
    vault_rec, vault_json = encrypt_vault_batch(batch_id, generated_lines, key)

    with open(os.path.join(vault_dir, "batch_1.enc"), "w", encoding="utf-8") as vf:
        vf.write(vault_json)

    meta_record = {
        "batch_id": batch_id,
        "merkle_root": merkle_root,
        "vault_ref": "vault/batch_1.enc",
        "ntp_timestamp": int(time.time()),
        "log_count": len(generated_lines),
        "leaves_hex": leaves_hex,
        "proofs": proofs,
        "lines": generated_lines,
        "tx_hash": "0x4e8a71b29df92a5b1c3e7d8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b"
    }
    with open(os.path.join(vault_dir, "batch_1.meta.json"), "w", encoding="utf-8") as mf:
        json.dump(meta_record, mf, indent=2)

    # Heartbeat
    with open(os.path.join(vault_dir, ".heartbeat"), "w", encoding="utf-8") as hf:
        json.dump({"timestamp": time.time(), "status": "ALIVE", "latest_batch_id": 1}, hf)

    print(f"   ✓ Sealed Batch #1. Merkle Root: {merkle_root}")
    print(f"   ✓ AES-256-GCM Vault Record saved to vault/batch_1.enc")

    # 3. Test API /api/status - Uncompromised
    print("\n[Step 3] Testing GET /api/status (Baseline Integrity Check)...")
    status_data = get_status()
    assert status_data["is_compromised"] == False
    assert len(status_data["anchors"]) == 1
    assert status_data["anchors"][0]["status"] == "VERIFIED_ON_CHAIN"
    print("   ✓ Baseline status: VERIFIED_ON_CHAIN. Tamper alert count: 0")

    # 4. Red Team Attack 1: Alter 1 Line (Covert Tamper)
    print("\n[Step 4] Executing Red Team Attack: POST /api/attack/edit...")
    res_attack = simulate_attack_edit()
    print(f"   ✓ Attack executed: {res_attack['message']}")

    # 5. Check Pinpoint Forensics
    print("\n[Step 5] Re-checking GET /api/status for Pinpoint Forensics Alarm...")
    alert_data = get_status()
    assert alert_data["is_compromised"] == True
    assert len(alert_data["tamper_alerts"]) > 0
    mismatch = alert_data["tamper_alerts"][0]["mismatches"][0]
    print(f"   🚨 ALARM TRIGGERED! Tampered Batch #{alert_data['tamper_alerts'][0]['batch_id']}")
    print(f"      Pinpointed Line Index : {mismatch['global_line_index']}")
    print(f"      Original Text         : {mismatch['original_text'][:60]}...")
    print(f"      Tampered Text         : {mismatch['current_text'][:60]}...")
    print(f"      CERT-In Timer Active  : {alert_data['incident_countdown']['countdown_active']}")
    print(f"      Remaining Window      : {alert_data['incident_countdown']['countdown_display']}")

    # 6. Test Recovery: 1-Click Restore
    print("\n[Step 6] Testing 1-Click Recovery: POST /api/recover-all...")
    res_recover = recover_all_logs()
    print(f"   ✓ {res_recover['message']}")

    # Verify restored state
    res_restored = get_status()
    assert res_restored["is_compromised"] == False
    print("   ✓ System integrity restored! Logs match on-chain root bit-for-bit.")

    # 7. Red Team Attack 2: Kill Agent (Dead Man's Switch)
    print("\n[Step 7] Testing Dead Man's Switch: POST /api/attack/kill-agent...")
    res_kill = simulate_kill_agent()

    dms_status = watchtower_instance.check_dead_man_switch()
    assert dms_status["AGENT_KILLED_ALERT"] == True
    print(f"   💀 WATCHTOWER ALARM: Agent Killed Alert = True!")
    print(f"      Killed Timestamp: {dms_status['killed_timestamp']}")
    print(f"      Reason          : {dms_status['reason']}")

    # Restore agent
    restore_agent()
    with open(os.path.join(vault_dir, ".heartbeat"), "w", encoding="utf-8") as hf:
        json.dump({"timestamp": time.time(), "status": "ALIVE", "latest_batch_id": 1}, hf)
    print("   ✓ Agent restored.")

    # 8. Test Evidence Export & BSA Sec 63(4) Certificate
    print("\n[Step 8] Testing GET /api/export-evidence/1 (Court-Ready Bundle)...")
    res_ev = export_evidence(1)
    evidence = json.loads(res_ev.body.decode("utf-8"))
    assert "bsa_section_63_certificate" in evidence
    cert = evidence["bsa_section_63_certificate"]
    assert cert["statutory_act"] == "Bharatiya Sakshya Adhiniyam, 2023 (BSA)"
    assert "part_a_system_custodian_declaration" in cert
    assert "part_b_forensic_expert_declaration" in cert
    print(f"   ✓ Generated Court-Ready Evidence Package for Batch #1")
    print(f"   ✓ Custodian Declaration : {cert['part_a_system_custodian_declaration']['title']}")
    print(f"   ✓ Forensic Declaration  : {cert['part_b_forensic_expert_declaration']['title']}")
    print(f"   ✓ Statutory Verdict     : {cert['part_b_forensic_expert_declaration']['verdict']}")

    print("\n" + "=" * 65)
    print("🎉 ALL END-TO-END PIPELINE & FORENSIC TESTS SUCCEEDED 100%!")
    print("=" * 65)

if __name__ == "__main__":
    run_e2e_test()
