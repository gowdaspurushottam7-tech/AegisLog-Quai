import json
import urllib.request
import urllib.error
from typing import Optional, Tuple, Dict, Any
from Crypto.Hash import keccak

def keccak256(data: bytes) -> bytes:
    k = keccak.new(digest_bits=256)
    k.update(data)
    return k.digest()

def function_selector(signature: str) -> str:
    return keccak256(signature.encode("utf-8"))[:4].hex()

def rpc_call(rpc_url: str, method: str, params: list, timeout: float = 3.0) -> Any:
    payload = {
        "jsonrpc": "2.0",
        "method": method,
        "params": params,
        "id": 1
    }
    req = urllib.request.Request(
        rpc_url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=timeout) as response:
        result = json.loads(response.read().decode("utf-8"))
        if "error" in result:
            raise Exception(result["error"].get("message", "RPC Error"))
        return result.get("result")

def is_node_connected(rpc_url: str) -> bool:
    try:
        rpc_call(rpc_url, "eth_blockNumber", [], timeout=1.5)
        return True
    except Exception:
        return False

def get_accounts(rpc_url: str) -> list:
    try:
        return rpc_call(rpc_url, "eth_accounts", [])
    except Exception:
        return []

def encode_uint256(val: int) -> bytes:
    return val.to_bytes(32, byteorder="big")

def encode_bytes32(hex_str: str) -> bytes:
    clean = hex_str.replace("0x", "").strip()
    raw = bytes.fromhex(clean)
    if len(raw) < 32:
        raw = raw.ljust(32, b'\0')
    return raw[:32]

def encode_string(text: str) -> bytes:
    raw = text.encode("utf-8")
    length = len(raw)
    padded_len = (length + 31) // 32 * 32
    return encode_uint256(length) + raw.ljust(padded_len, b'\0')

def encode_anchor_batch(merkle_root_hex: str, vault_ref: str, ntp_timestamp: int, log_count: int) -> str:
    """
    Encodes anchorBatch(bytes32,string,uint256,uint256)
    Selector: 0a26a5a1
    Head:
      arg0: bytes32 (32 bytes)
      arg1: offset to string dynamic data (32 bytes, 4 * 32 = 0x80)
      arg2: uint256 ntp_timestamp (32 bytes)
      arg3: uint256 log_count (32 bytes)
    Tail:
      string length + bytes
    """
    selector = bytes.fromhex(function_selector("anchorBatch(bytes32,string,uint256,uint256)"))
    arg0 = encode_bytes32(merkle_root_hex)
    arg1_offset = encode_uint256(128)  # 4 * 32 bytes = 128
    arg2 = encode_uint256(ntp_timestamp)
    arg3 = encode_uint256(log_count)
    tail_string = encode_string(vault_ref)

    calldata = selector + arg0 + arg1_offset + arg2 + arg3 + tail_string
    return "0x" + calldata.hex()

def send_anchor_batch(rpc_url: str, contract_address: str, merkle_root_hex: str, vault_ref: str, ntp_timestamp: int, log_count: int) -> Optional[str]:
    accounts = get_accounts(rpc_url)
    if not accounts:
        return None
    from_acc = accounts[0]
    calldata = encode_anchor_batch(merkle_root_hex, vault_ref, ntp_timestamp, log_count)

    tx_params = {
        "from": from_acc,
        "to": contract_address,
        "data": calldata,
        "gas": "0x100000"
    }

    tx_hash = rpc_call(rpc_url, "eth_sendTransaction", [tx_params])
    return tx_hash

def get_transaction_receipt(rpc_url: str, tx_hash: str) -> Optional[dict]:
    try:
        return rpc_call(rpc_url, "eth_getTransactionReceipt", [tx_hash])
    except Exception:
        return None

def get_latest_batch(rpc_url: str, contract_address: str) -> Optional[dict]:
    selector = "0x" + function_selector("getLatestBatch()")
    try:
        raw_hex = rpc_call(rpc_url, "eth_call", [{"to": contract_address, "data": selector}, "latest"])
        if not raw_hex or raw_hex == "0x":
            return None
        data = bytes.fromhex(raw_hex.replace("0x", ""))
        if len(data) < 160:
            return None

        batch_id = int.from_bytes(data[0:32], byteorder="big")
        merkle_root = "0x" + data[32:64].hex()
        # string offset is at 64:96
        string_offset = int.from_bytes(data[64:96], byteorder="big")
        ntp_timestamp = int.from_bytes(data[96:128], byteorder="big")
        log_count = int.from_bytes(data[128:160], byteorder="big")

        # decode string
        str_len = int.from_bytes(data[string_offset:string_offset+32], byteorder="big")
        vault_ref = data[string_offset+32:string_offset+32+str_len].decode("utf-8", errors="ignore")

        return {
            "batch_id": batch_id,
            "merkle_root": merkle_root,
            "vault_ref": vault_ref,
            "ntp_timestamp": ntp_timestamp,
            "log_count": log_count
        }
    except Exception:
        return None

def get_total_batches(rpc_url: str, contract_address: str) -> int:
    selector = "0x" + function_selector("getTotalBatches()")
    try:
        raw_hex = rpc_call(rpc_url, "eth_call", [{"to": contract_address, "data": selector}, "latest"])
        if not raw_hex or raw_hex == "0x":
            return 0
        return int.from_bytes(bytes.fromhex(raw_hex.replace("0x", "")), byteorder="big")
    except Exception:
        return 0
