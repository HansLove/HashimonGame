/**
 * Bound-mode PoW helpers — sync SHA256 (matches server/src/core/sha256.ts).
 */

export const DEFAULT_SHARE_TARGET_BITS = 12;
export const BURST_MS = 260;

export function doubleSha256Hex(payload) {
  return SHA256(SHA256(payload));
}

export function leadingZeroBits(hex) {
  const normalized = hex.toLowerCase().replace(/^0x/, "");
  let bits = 0;
  for (const ch of normalized) {
    const n = parseInt(ch, 16);
    if (Number.isNaN(n)) { break; }
    if (n === 0) {
      bits += 4;
      continue;
    }
    for (let b = 3; b >= 0; b -= 1) {
      if ((n & (1 << b)) === 0) { bits += 1; }
      else { break; }
    }
    break;
  }
  return bits;
}

export function deriveExtranonce1(dna) {
  const cleaned = dna.replace(/[^0-9a-fA-F]/g, "").slice(0, 8).toLowerCase();
  return cleaned.length > 0 ? cleaned : "deadbeef";
}

export function hashShareBound(dna, extranonce1, extranonce2, nonce) {
  return doubleSha256Hex(`${dna}:${extranonce1}:${extranonce2}:${nonce}`);
}

export function progressionFromBits(bits) {
  const value = Math.min(Math.floor(bits / 4), 33);
  return { tier: value, stars: value, stage: Math.max(1, value) };
}
