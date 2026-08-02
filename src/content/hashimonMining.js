//Real proof of work. This is the seam the whole game turns on: where the lab
//used to roll a fake share with Math.random, the player's device now genuinely
//computes double SHA-256 over a dataset bound to the creature, and the best hash
//it actually finds is recorded on that creature.
//
//The mapping to real mining, made literal:
//   extranonce1  = the creature's DNA  (fixed identity / search context)
//   extranonce2  = pow.extranonce2     (the counter this device grinds)
//   share        = a hash with enough leading zero bits
//   best share   = the rarest hash ever found for this creature = its proof of effort
//
//Sovereign and self-contained: it runs locally, contacts no pool, promises no
//reward. A share is real, recomputable work — anyone can re-hash DNA + nonce and
//confirm it. Connecting this to a live Bitcoin block template (so a share meeting
//network difficulty is a real block) is the later gateway phase; the grinder here
//is exactly the client that phase reuses.
window.HashimonMining = {

  //Tuning. A "share" is any hash clearing shareTargetBits leading zeros; a block
  //is the (astronomically unlikely) jackpot. Browser hashrate is tiny vs the real
  //network, so evolution is driven by accumulated shares, never by blocks.
  shareTargetBits: 10,
  blockTargetBits: 64,
  budgetMs: 260,        //one "Mine" burst grinds real hashes for ~this long

  //Bitcoin's PoW is double SHA-256; we hash DNA:nonce twice.
  hashOnce(str) { return SHA256(SHA256(str)); },

  //How many leading zero BITS a hex digest has — its share difficulty.
  leadingZeroBits(hex) {
    let bits = 0;
    for (let i = 0; i < hex.length; i++) {
      const v = parseInt(hex[i], 16);
      if (v === 0) { bits += 4; continue; }
      bits += Math.clz32(v) - 28;   //leading zero bits inside this nibble (0..3)
      break;
    }
    return bits;
  },

  //Grind a real burst for one creature, folding the genuine result into its PoW
  //record. Resumes from the creature's own extranonce2 so effort accumulates
  //across sessions and never repeats work.
  mine(hashimon, opts = {}) {
    const budgetMs = opts.budgetMs != null ? opts.budgetMs : this.budgetMs;
    const maxHashes = opts.maxHashes || Infinity;
    const dna = HashimonDNA.forHashimon(hashimon);
    const pow = hashimon.pow;

    let n = pow.extranonce2 || 0;
    let bestBits = pow.bestShareBits != null
      ? pow.bestShareBits
      : Math.floor(Math.log2(Math.max(1, pow.bestShareDifficulty || 1)));
    let bestHash = pow.bestShareHash, bestNonce = pow.bestShareNonce != null ? pow.bestShareNonce : null;
    let newBest = false, newShares = 0, foundBlock = false, count = 0;

    const t0 = performance.now();
    while (count < maxHashes) {
      const h = this.hashOnce(dna + ":" + n);
      const bits = this.leadingZeroBits(h);
      if (bits >= this.shareTargetBits) { newShares++; }
      if (bits > bestBits) {
        bestBits = bits; bestHash = h; bestNonce = n; newBest = true;
        if (bits >= this.blockTargetBits) { foundBlock = true; }
      }
      n++; count++;
      if ((count & 1023) === 0 && performance.now() - t0 >= budgetMs) { break; }
    }
    const seconds = (performance.now() - t0) / 1000;

    pow.extranonce2 = n;
    pow.totalHashes = (pow.totalHashes || 0) + count;
    pow.validShares += newShares;
    pow.miningSeconds = +((pow.miningSeconds || 0) + seconds).toFixed(1);
    if (newBest) {
      pow.bestShareBits = bestBits;
      pow.bestShareDifficulty = Math.pow(2, bestBits);   //keeps the evolution formula intact
      pow.bestShareHash = bestHash;
      pow.bestShareNonce = bestNonce;
    }
    if (foundBlock) { pow.foundBlock = true; }

    const evolution = HashimonSystem.refreshEvolution(hashimon);
    return {
      hashes: count, seconds,
      hashrate: Math.round(count / Math.max(seconds, 0.001)),
      newShares, bestBits, bestHash, newBest, foundBlock, ...evolution,
    };
  },

  //Recompute a creature's claimed best share from its DNA + nonce. Because the
  //work is real, this must match — it's how anyone verifies the effort.
  verify(hashimon) {
    if (hashimon.pow.bestShareNonce == null) { return null; }   //nothing mined yet
    const dna = HashimonDNA.forHashimon(hashimon);
    return this.hashOnce(dna + ":" + hashimon.pow.bestShareNonce) === hashimon.pow.bestShareHash;
  },

}
