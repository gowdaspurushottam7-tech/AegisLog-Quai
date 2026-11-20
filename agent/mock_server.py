import os
import sys
import time
import random
import socket
import struct
from datetime import datetime, timezone, timedelta

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
LOG_FILE = os.path.join(DATA_DIR, "server.log")

IST = timezone(timedelta(hours=5, minutes=30))

LOG_TEMPLATES = [
    {
        "type": "SSH_LOGIN",
        "variants": [
            "[AUTH] SSH_LOGIN SUCCESS user=admin src_ip=192.168.1.{ip} port={port} session_id=s-{sess} key_type=ed25519",
            "[AUTH] SSH_LOGIN SUCCESS user=deployer src_ip=10.0.4.{ip} port={port} session_id=s-{sess} key_type=rsa-4096",
            "[AUTH] SSH_LOGIN FAILED_ROOT_LOGIN user=root src_ip=198.51.100.{ip} port={port} reason=INVALID_KEY auth_attempts=3",
            "[AUTH] SSH_LOGIN FAILED user=guest src_ip=203.0.113.{ip} port={port} reason=UNKNOWN_USER auth_attempts=1"
        ]
    },
    {
        "type": "SUDO_EXEC",
        "variants": [
            "[SEC] SUDO_EXEC user=developer cmd=\"/usr/bin/systemctl restart nginx\" status=OK pid={pid} tty=/dev/pts/2",
            "[SEC] SUDO_EXEC user=sysadmin cmd=\"/usr/sbin/iptables -A INPUT -p tcp --dport 8000 -j ACCEPT\" status=OK pid={pid}",
            "[SEC] SUDO_EXEC user=appuser cmd=\"/usr/bin/cat /etc/shadow\" status=DENIED pid={pid} alert=UNAUTHORIZED_FILE_ACCESS"
        ]
    },
    {
        "type": "DB_ACCESS",
        "variants": [
            "[DATA] DB_ACCESS db=production_customers query=\"SELECT id, email, status FROM accounts WHERE active=1\" user=app_service latency=4.2ms rows=120",
            "[DATA] DB_ACCESS db=finance_ledger query=\"INSERT INTO audit_journal (tx_id, amount, status) VALUES ('tx-{sess}', 50000, 'COMMITTED')\" user=ledger_writer latency=8.9ms",
            "[DATA] DB_ACCESS db=pki_vault query=\"SELECT cert_pem FROM client_certificates WHERE serial='A89F-{ip}'\" user=cert_manager latency=1.5ms"
        ]
    },
    {
        "type": "FIREWALL_DROP",
        "variants": [
            "[NET] FIREWALL_DROP proto=TCP src=203.0.113.{ip}:{port} dst=10.0.0.5:22 reason=RATE_LIMIT_EXCEEDED rule_id=FW-DROP-SSH",
            "[NET] FIREWALL_DROP proto=UDP src=198.51.100.{ip}:{port} dst=10.0.0.12:53 reason=DNS_AMP_SUSPECT rule_id=FW-DROP-DNS",
            "[NET] FIREWALL_DROP proto=TCP src=45.33.32.{ip}:{port} dst=10.0.0.2:443 reason=INVALID_SYN_FLAG rule_id=FW-TCP-MALFORMED"
        ]
    },
    {
        "type": "PRIV_ESC",
        "variants": [
            "[AUDIT] PRIV_ESC target_uid=0 caller_uid=1001 binary=\"/bin/su\" tty=/dev/pts/1 parent_pid={pid} result=SUCCESS",
            "[AUDIT] PRIV_ESC target_capability=CAP_NET_ADMIN caller=\"/usr/local/bin/proxy_mon\" pid={pid} result=GRANTED",
            "[AUDIT] PRIV_ESC alert=UNAUTHORIZED_SETUID binary=\"/tmp/.exploit_runner\" caller_uid=1005 result=BLOCKED_BY_APPARMOR"
        ]
    }
]

def get_ntp_time(host="pool.ntp.org", timeout=2.0):
    """Attempt NTP query; fallback to local machine time with subsecond precision."""
    try:
        client = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        client.settimeout(timeout)
        # NTP packet format: 48 bytes with 0x1b mode
        data = b'\x1b' + 47 * b'\0'
        client.sendto(data, (host, 123))
        resp, _ = client.recvfrom(1024)
        if resp:
            # Unpack transmit timestamp (offset 40)
            unpacked = struct.unpack("!12I", resp[0:48])
            ntp_seconds = unpacked[10] - 2208988800  # seconds between 1900 and 1970
            fraction = unpacked[11] / (2**32)
            return ntp_seconds + fraction
    except Exception:
        pass
    return time.time()

def generate_log_line():
    ntp_ts = get_ntp_time()
    dt_utc = datetime.fromtimestamp(ntp_ts, tz=timezone.utc)
    dt_ist = dt_utc.astimezone(IST)

    ts_iso_ist = dt_ist.strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "+05:30"
    ts_iso_utc = dt_utc.strftime("%Y-%m-%dT%H:%M:%SZ")

    category = random.choice(LOG_TEMPLATES)
    variant = random.choice(category["variants"])

    formatted_msg = variant.format(
        ip=random.randint(10, 250),
        port=random.randint(1024, 65535),
        sess=random.randint(100000, 999999),
        pid=random.randint(1000, 32000)
    )

    line = f"[{ts_iso_ist}] [UTC:{ts_iso_utc}] {formatted_msg}"
    return line

def main():
    os.makedirs(DATA_DIR, exist_ok=True)
    print(f"[MockServer] Starting Linux/Enterprise security log generator...")
    print(f"[MockServer] Appending logs to: {LOG_FILE}")
    print(f"[MockServer] Interval: 2.0s per entry (NTP UTC + IST synced)\n")

    while True:
        try:
            line = generate_log_line()
            with open(LOG_FILE, "a", encoding="utf-8") as f:
                f.write(line + "\n")
                f.flush()
            print(f"[+] {line}")
            time.sleep(2.0)
        except KeyboardInterrupt:
            print("\n[MockServer] Stopped by user.")
            break
        except Exception as e:
            print(f"[MockServer ERROR] {e}")
            time.sleep(2.0)

if __name__ == "__main__":
    main()
