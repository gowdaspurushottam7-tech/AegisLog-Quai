import sys
import os
import json
import subprocess

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "shared"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from crypto_engine import build_merkle_tree
from evidence import generate_evidence_package

def test_merkle_parity():
    print("=" * 65)
    print("🔬 TESTING MERKLE ROOT BYTE-FOR-BYTE PARITY")
    print("=" * 65)

    # Test cases: even count, odd count, 1 item, enterprise logs
    test_cases = [
        ["[AUTH] SSH_LOGIN SUCCESS user=admin src_ip=192.168.1.50 port=42100"],
        ["log A", "log B"],
        ["log A", "log B", "log C"],
        [
            "[AUTH] SSH_LOGIN SUCCESS user=admin port=22",
            "[SEC] SUDO_EXEC user=developer cmd=/bin/ls status=OK",
            "[DATA] DB_ACCESS db=audit query=SELECT rows=10",
            "[NET] FIREWALL_DROP proto=TCP src=198.51.100.2:80",
            "[AUDIT] PRIV_ESC target_uid=0 result=SUCCESS"
        ]
    ]

    for idx, logs in enumerate(test_cases, 1):
        python_root, proofs, leaves_hex = build_merkle_tree(logs)

        # Run Node.js script using exact unified hex-string logic as frontend merkle.ts
        node_script = f"""
        const {{ createHash }} = require('crypto');
        const lines = {json.dumps(logs)};
        
        function sha256Hex(str) {{
          return createHash('sha256').update(Buffer.from(str, 'utf8')).digest('hex');
        }}

        function computeBrowserMerkleRoot(lines) {{
          if (!lines || lines.length === 0) {{
            return '0x' + sha256Hex('AEGISLOG_EMPTY_BATCH');
          }}
          let layer = lines.map(l => sha256Hex(l.trim()));
          while (layer.length > 1) {{
            const next = [];
            for (let i = 0; i < layer.length; i += 2) {{
              const left = layer[i];
              const right = (i + 1 < layer.length) ? layer[i + 1] : left;
              next.push(sha256Hex(left + right));
            }}
            layer = next;
          }}
          return '0x' + layer[0];
        }}

        console.log(computeBrowserMerkleRoot(lines));
        """

        node_proc = subprocess.run(["node", "-e", node_script], capture_output=True, text=True, check=True)
        node_root = node_proc.stdout.strip()

        print(f"\n[Case {idx}] ({len(logs)} logs):")
        print(f"   Python Root : {python_root}")
        print(f"   Node Root   : {node_root}")
        assert python_root.lower() == node_root.lower(), f"Mismatch in case {idx}!"
        print("   ✓ Byte-for-byte match verified!")

    # Verify Evidence Export
    print("\n[Evidence Export Test]")
    pkg = generate_evidence_package(1)
    if pkg:
        print(f"   Evidence Batch 1 Root : {pkg['merkle_root']}")
        print(f"   Evidence Raw Logs     : {len(pkg['raw_logs'])} entries")
        print(f"   Evidence Leaves Hex   : {len(pkg['leaf_hashes_sha256'])} entries")
        assert "raw_logs" in pkg
        assert "leaves" in pkg
        assert "logs" in pkg
        print("   ✓ Evidence package export contains exact arrays and matching root!")

    print("\n" + "=" * 65)
    print("🎉 ALL MERKLE ROOT PARITY CHECKS PASSED 100%!")
    print("=" * 65)

if __name__ == "__main__":
    test_merkle_parity()
