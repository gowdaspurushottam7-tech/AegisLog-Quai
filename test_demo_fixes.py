import sys
import os
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "shared"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from watchtower import watchtower_instance
from main import (
    get_status,
    simulate_attack_edit,
    simulate_kill_agent,
    restore_agent,
    reset_demo
)

def test_demo_fixes():
    print("=" * 65)
    print("🧪 TESTING DEMO FIXES (HEARTBEAT HALTED + RESET DEMO)")
    print("=" * 65)

    # 1. Test Bug 1: Kill agent and verify display_status is HEARTBEAT HALTED
    print("\n[Test 1] Simulating manual kill agent...")
    res_kill = simulate_kill_agent()
    assert res_kill["success"] == True

    dms = watchtower_instance.check_dead_man_switch()
    print(f"   AGENT_KILLED_ALERT   : {dms['AGENT_KILLED_ALERT']}")
    print(f"   Heartbeat Age        : {dms['heartbeat_age_seconds']}s")
    print(f"   Display Status       : {dms['display_status']}")

    assert dms["AGENT_KILLED_ALERT"] == True
    assert dms["display_status"] == "HEARTBEAT HALTED", f"Expected HEARTBEAT HALTED, got {dms['display_status']}"
    print("   ✓ Verified: Display status shows 'HEARTBEAT HALTED' when elapsed < 15s!")

    # 2. Test Resume Agent Heartbeat
    print("\n[Test 2] Testing Resume Agent Heartbeat...")
    res_restore = restore_agent()
    assert res_restore["success"] == True

    dms_after = watchtower_instance.check_dead_man_switch()
    print(f"   AGENT_KILLED_ALERT   : {dms_after['AGENT_KILLED_ALERT']}")
    print(f"   Display Status       : {dms_after['display_status']}")
    assert dms_after["AGENT_KILLED_ALERT"] == False
    assert dms_after["display_status"] == "HEARTBEAT ACTIVE"
    print("   ✓ Verified: Alert clears cleanly upon clicking Resume Agent Heartbeat!")

    # 3. Test Bug 2: Reset Demo
    print("\n[Test 3] Simulating log attack then testing Reset Demo button...")
    simulate_attack_edit()
    status_attacked = get_status()
    print(f"   Pre-reset is_compromised : {status_attacked['is_compromised']}")
    print(f"   Pre-reset tamper alerts  : {len(status_attacked['tamper_alerts'])}")
    assert status_attacked["is_compromised"] == True

    # Call Reset Demo
    res_reset = reset_demo()
    print(f"\n   Reset Demo result: {res_reset['message']}")
    assert res_reset["success"] == True
    assert res_reset["is_compromised"] == False

    status_clean = get_status()
    print(f"   Post-reset is_compromised : {status_clean['is_compromised']}")
    print(f"   Post-reset tamper alerts  : {len(status_clean['tamper_alerts'])}")
    print(f"   Post-reset CERT-In Timer  : {status_clean['incident_countdown']['countdown_display']}")
    print(f"   Post-reset Timer Active   : {status_clean['incident_countdown']['countdown_active']}")
    print(f"   Post-reset DMS Status     : {status_clean['dead_man_switch']['AGENT_KILLED_ALERT']}")

    assert status_clean["is_compromised"] == False
    assert len(status_clean["tamper_alerts"]) == 0
    assert status_clean["incident_countdown"]["countdown_active"] == False
    assert status_clean["incident_countdown"]["countdown_display"] == "06:00:00"
    assert status_clean["dead_man_switch"]["AGENT_KILLED_ALERT"] == False

    print("\n" + "=" * 65)
    print("🎉 BOTH DEMO BUGS FIXED & VERIFIED SUCCESSFULLY 100%!")
    print("=" * 65)

if __name__ == "__main__":
    test_demo_fixes()
