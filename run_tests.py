import sys
import os

# Ensure shared and backend are importable
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "shared"))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend"))

from crypto_engine import (
    compute_hash_chain,
    build_merkle_tree,
    verify_merkle_leaf,
    encrypt_vault_batch,
    decrypt_vault_batch,
    get_or_create_vault_key
)
from evidence import generate_bsa_certificate

def test_hash_chain():
    print("[1/5] Testing SHA-256 Hash Chaining...")
    lines = [
        "[AUTH] SSH_LOGIN SUCCESS user=admin",
        "[SEC] SUDO_EXEC user=developer cmd=systemctl",
        "[DATA] DB_ACCESS db=finance rows=10"
    ]
    hashes, final_h = compute_hash_chain(lines)
    assert len(hashes) == 3
    assert len(final_h) == 64
    print("   ✓ Hash chain computed successfully. Final H_n:", final_h[:16] + "...")

def test_merkle_tree_and_proofs():
    print("[2/5] Testing SHA-256 Merkle Tree & Audit Proofs...")
    lines = [
        "line 1: SSH_LOGIN SUCCESS",
        "line 2: SUDO_EXEC user=sysadmin",
        "line 3: FIREWALL_DROP src=203.0.113.88",
        "line 4: DB_ACCESS db=audit",
        "line 5: PRIV_ESC uid=0"
    ]
    root, proofs, leaves = build_merkle_tree(lines)
    assert root.startswith("0x")
    assert len(leaves) == 5
    assert len(proofs) == 5

    # Verify each leaf with its proof
    for i in range(len(lines)):
        valid = verify_merkle_leaf(lines[i], proofs[i], root)
        assert valid, f"Leaf {i} proof failed!"
    print(f"   ✓ Merkle Root: {root}")
    print("   ✓ All 5 Merkle proofs verified successfully against root.")

def test_aes_gcm_vault():
    print("[3/5] Testing AES-256-GCM Vault Encryption & Decryption...")
    key = get_or_create_vault_key()
    original_lines = [
        "Confidential enterprise audit log A",
        "Confidential enterprise audit log B",
        "Confidential enterprise audit log C"
    ]
    batch_id = 42
    record, json_str = encrypt_vault_batch(batch_id, original_lines, key)
    assert "ciphertext_hex" in record
    assert "nonce_hex" in record

    # Decrypt
    decrypted = decrypt_vault_batch(record, key)
    assert decrypted == original_lines
    print("   ✓ AES-256-GCM Authenticated Encryption & Decryption verified bit-for-bit.")

def test_tamper_pinpointing():
    print("[4/5] Testing Tamper Pinpointing...")
    original = ["log A", "FAILED_ROOT_LOGIN user=root", "log C"]
    tampered = ["log A", "SSH_LOGIN SUCCESS user=admin", "log C"]

    orig_root, _, _ = build_merkle_tree(original)
    tamp_root, _, _ = build_merkle_tree(tampered)

    assert orig_root != tamp_root
    print(f"   ✓ Tampered root mismatch detected: {orig_root[:12]}... != {tamp_root[:12]}...")

def test_bsa_cert():
    print("[5/5] Testing BSA Section 63(4) Certificate Generation...")
    cert = generate_bsa_certificate(
        batch_id=1,
        merkle_root="0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        log_count=50,
        ntp_timestamp=1700000000,
        tx_hash="0xabcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
        contract_address="0x5FbDB2315678afecb367f032d93F642f64180aa3"
    )
    assert cert["statutory_act"] == "Bharatiya Sakshya Adhiniyam, 2023 (BSA)"
    assert "part_a_system_custodian_declaration" in cert
    assert "part_b_forensic_expert_declaration" in cert
    print("   ✓ BSA Sec 63(4) Certificate successfully structured.")

if __name__ == "__main__":
    print("=" * 60)
    print("RUNNING AEGISLOG CRYPTOGRAPHIC & COMPLIANCE TEST SUITE")
    print("=" * 60)
    test_hash_chain()
    test_merkle_tree_and_proofs()
    test_aes_gcm_vault()
    test_tamper_pinpointing()
    test_bsa_cert()
    print("=" * 60)
    print("ALL 5 CRYPTOGRAPHIC SUITE TESTS PASSED!")
    print("=" * 60)
