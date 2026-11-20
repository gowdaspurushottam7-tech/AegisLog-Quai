import os
import sys
import time
import json
import hashlib
import binascii
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

KEY_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "vault", "vault.key")

def get_or_create_vault_key(key_path=KEY_FILE) -> bytes:
    os.makedirs(os.path.dirname(key_path), exist_ok=True)
    if os.path.exists(key_path):
        with open(key_path, "rb") as f:
            key = f.read().strip()
            if len(key) == 32:
                return key
            elif len(key) == 64:
                return binascii.unhexlify(key)
    # Generate fresh 256-bit key
    key = AESGCM.generate_key(bit_length=256)
    with open(key_path, "wb") as f:
        f.write(binascii.hexlify(key))
    return key

def sha256_hex(data: str or bytes) -> str:
    if isinstance(data, str):
        data = data.encode("utf-8")
    return hashlib.sha256(data).hexdigest()

def sha256_bytes(data: bytes) -> bytes:
    return hashlib.sha256(data).digest()

def compute_hash_chain(lines: list, prev_hash: str = "0" * 64) -> tuple[list, str]:
    """
    Computes H_n = SHA256(log_line + H_{n-1}) for each line.
    Returns (list of cumulative hashes, final H_n).
    """
    hashes = []
    current_h = prev_hash
    for line in lines:
        content = (line + current_h).encode("utf-8")
        current_h = hashlib.sha256(content).hexdigest()
        hashes.append(current_h)
    return hashes, current_h

def build_merkle_tree(leaf_strings: list) -> tuple[str, list, list]:
    """
    Builds a SHA-256 Merkle Tree from a list of log lines using unified hex-string pipeline:
    1. Leaf: SHA256(raw_log_line.strip().encode('utf-8')).hexdigest()
    2. Parent: SHA256((left + right).encode('utf-8')).hexdigest()
    3. Odd-node: duplicate last node (right = left)
    Returns: (merkle_root_0xhex, proofs_for_each_leaf, leaves_hex)
    """
    if not leaf_strings:
        empty_root = "0x" + hashlib.sha256(b"AEGISLOG_EMPTY_BATCH").hexdigest()
        return empty_root, [], []

    # 1. Compute leaves as 64-char lowercase hex strings
    leaves_hex = [
        hashlib.sha256(line.strip().encode("utf-8")).hexdigest()
        if isinstance(line, str) else hashlib.sha256(str(line).strip().encode("utf-8")).hexdigest()
        for line in leaf_strings
    ]

    # 2. Build layers of hex strings
    layers = [leaves_hex]
    current_layer = leaves_hex

    while len(current_layer) > 1:
        next_layer = []
        for i in range(0, len(current_layer), 2):
            left = current_layer[i]
            right = current_layer[i + 1] if (i + 1 < len(current_layer)) else left  # Duplicate odd node
            parent = hashlib.sha256((left + right).encode("utf-8")).hexdigest()
            next_layer.append(parent)
        layers.append(next_layer)
        current_layer = next_layer

    merkle_root = "0x" + current_layer[0]

    # Generate Merkle proof for each leaf
    proofs = []
    for leaf_index in range(len(leaves_hex)):
        proof = []
        idx = leaf_index
        for layer in layers[:-1]:
            is_right = (idx % 2 == 1)
            pair_idx = idx - 1 if is_right else idx + 1
            sibling = layer[pair_idx] if pair_idx < len(layer) else layer[idx]
            proof.append({
                "sibling": "0x" + sibling,
                "position": "left" if is_right else "right"
            })
            idx = idx // 2
        proofs.append(proof)

    return merkle_root, proofs, leaves_hex

def verify_merkle_leaf(leaf_line: str, proof: list, expected_root: str) -> bool:
    """Verifies a single leaf against the Merkle Root using hex concatenation."""
    current = hashlib.sha256(leaf_line.strip().encode("utf-8")).hexdigest()
    for step in proof:
        sibling = step["sibling"].replace("0x", "").strip()
        if step["position"] == "left":
            current = hashlib.sha256((sibling + current).encode("utf-8")).hexdigest()
        else:
            current = hashlib.sha256((current + sibling).encode("utf-8")).hexdigest()
    computed_root = "0x" + current
    return computed_root.lower() == expected_root.lower()

def encrypt_vault_batch(batch_id: int, lines: list, key: bytes = None) -> tuple[dict, str]:
    """
    Encrypts lines with AES-256-GCM.
    Returns (metadata_dict, json_string_for_disk).
    """
    if key is None:
        key = get_or_create_vault_key()

    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    payload_data = {
        "batch_id": batch_id,
        "lines": lines,
        "created_at": time.time()
    }
    plaintext = json.dumps(payload_data, ensure_ascii=False).encode("utf-8")
    ciphertext_with_tag = aesgcm.encrypt(nonce, plaintext, associated_data=str(batch_id).encode("utf-8"))

    vault_record = {
        "batch_id": batch_id,
        "nonce_hex": binascii.hexlify(nonce).decode("utf-8"),
        "ciphertext_hex": binascii.hexlify(ciphertext_with_tag).decode("utf-8"),
        "log_count": len(lines),
        "timestamp": time.time()
    }
    return vault_record, json.dumps(vault_record, indent=2)

def decrypt_vault_batch(vault_record: dict, key: bytes = None) -> list:
    """
    Decrypts an AES-256-GCM vault record and returns original list of log lines.
    """
    if key is None:
        key = get_or_create_vault_key()

    aesgcm = AESGCM(key)
    nonce = binascii.unhexlify(vault_record["nonce_hex"])
    ciphertext_with_tag = binascii.unhexlify(vault_record["ciphertext_hex"])
    batch_id = vault_record.get("batch_id", 0)

    decrypted_bytes = aesgcm.decrypt(nonce, ciphertext_with_tag, associated_data=str(batch_id).encode("utf-8"))
    payload = json.loads(decrypted_bytes.decode("utf-8"))
    return payload.get("lines", [])
