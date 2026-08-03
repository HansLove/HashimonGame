import { hashShareBound, leadingZeroBits } from "./pow.js";

const MAX_NONCE = 0xffffffff;

/**
 * Grind bound-mode shares for one burst (~260ms budget, sync SHA256).
 */
export function mineBurst({
  dna,
  extranonce1,
  extranonce2Start,
  shareTargetBits,
  burstMs = 260,
}) {
  const deadline = performance.now() + burstMs;
  let extranonce2 = extranonce2Start;
  let hashes = 0;
  let best = null;

  while (performance.now() < deadline) {
    for (let nonce = 0; nonce <= MAX_NONCE; nonce += 1) {
      const hash = hashShareBound(dna, extranonce1, extranonce2, nonce);
      hashes += 1;
      const bits = leadingZeroBits(hash);
      if (bits >= shareTargetBits) {
        return {
          found: true,
          share: { extranonce2, nonce, hash, bits },
          hashes,
          nextExtranonce2: extranonce2 + 1,
        };
      }
      if (bits > (best?.bits ?? 0)) {
        best = { extranonce2, nonce, hash, bits };
      }
      if (performance.now() >= deadline) { break; }
    }
    extranonce2 += 1;
  }

  return {
    found: false,
    best,
    hashes,
    nextExtranonce2: extranonce2,
  };
}
