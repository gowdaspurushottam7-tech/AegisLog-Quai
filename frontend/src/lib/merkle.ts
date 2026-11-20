/**
 * Browser-side Zero-Trust SHA-256 Merkle Tree Engine
 * Unified Hex-String Pipeline:
 * 1. Leaf: SHA256(line.trim()) via crypto.subtle.digest('SHA-256', ...)
 * 2. Parent: SHA256(left + right) hex-string concatenation
 * 3. Odd-node: duplicate last node (right = left)
 * 4. Prefix with 0x to match on-chain LogAnchor.sol merkleRoot
 */

export async function sha256Hex(str: string): Promise<string> {
  const enc = new TextEncoder().encode(str);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', enc);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Recomputes the SHA-256 Merkle Root from raw_logs array
 */
export async function computeBrowserMerkleRoot(rawLogs: string[]): Promise<{
  merkleRoot: string;
  leafHashes: string[];
}> {
  if (!rawLogs || rawLogs.length === 0) {
    const emptyHex = await sha256Hex('AEGISLOG_EMPTY_BATCH');
    return {
      merkleRoot: '0x' + emptyHex,
      leafHashes: [],
    };
  }

  // 1. Leaf computation: SHA256(raw_log_line.trim().encode('utf-8')).hexdigest()
  const leafHashes: string[] = [];
  for (const line of rawLogs) {
    const trimmed = typeof line === 'string' ? line.trim() : String(line).trim();
    const leaf = await sha256Hex(trimmed);
    leafHashes.push(leaf);
  }

  // 2. Reduce layers using hex string concatenation: SHA256(left + right)
  let currentLayer = leafHashes;

  while (currentLayer.length > 1) {
    const nextLayer: string[] = [];
    for (let i = 0; i < currentLayer.length; i += 2) {
      const left = currentLayer[i];
      const right = i + 1 < currentLayer.length ? currentLayer[i + 1] : left; // duplicate odd node
      const parent = await sha256Hex(left + right);
      nextLayer.push(parent);
    }
    currentLayer = nextLayer;
  }

  const merkleRoot = '0x' + currentLayer[0];
  return {
    merkleRoot,
    leafHashes,
  };
}

/**
 * Verifies a single Merkle leaf proof against the expected root
 */
export async function verifyBrowserMerkleProof(
  line: string,
  proof: Array<{ sibling: string; position: 'left' | 'right' }>,
  expectedRoot: string
): Promise<boolean> {
  const trimmed = typeof line === 'string' ? line.trim() : String(line).trim();
  let current = await sha256Hex(trimmed);

  for (const step of proof) {
    const sibling = step.sibling.replace(/^0x/i, '').trim();
    if (step.position === 'left') {
      current = await sha256Hex(sibling + current);
    } else {
      current = await sha256Hex(current + sibling);
    }
  }

  const computedRoot = '0x' + current;
  return computedRoot.toLowerCase() === expectedRoot.toLowerCase();
}
