//Server-authoritative bound-mode PoW: fetch job → grind → POST share.
import { mineBurst } from "../lib/mineBurst.js";
import { DEFAULT_SHARE_TARGET_BITS, deriveExtranonce1, leadingZeroBits } from "../lib/pow.js";
import HashimonApi from "../net/hashimonApi.js";

function applyServerPow(hashimon, serverBody) {
  const h = serverBody.hashimon || serverBody;
  const pow = hashimon.pow;
  if (h.pow) {
    pow.extranonce2 = h.pow.extranonce2 ?? pow.extranonce2;
    pow.bestShareBits = h.pow.bestShareBits ?? pow.bestShareBits;
    pow.bestShareHash = h.pow.bestShareHash ?? pow.bestShareHash;
    pow.bestShareNonce = h.pow.bestShareNonce ?? pow.bestShareNonce;
    pow.bestShareExtranonce2 = h.pow.bestShareExtranonce2 ?? pow.bestShareExtranonce2;
    pow.validShares = h.pow.validShares ?? pow.validShares;
    pow.totalHashes = h.pow.totalHashes ?? pow.totalHashes;
    pow.foundBlock = h.pow.foundBlock ?? pow.foundBlock;
    if (pow.bestShareBits != null) {
      pow.bestShareDifficulty = Math.pow(2, pow.bestShareBits);
    }
  }
  hashimon.verified = serverBody.verified === true;
  globalThis.HashimonSystem.refreshEvolution(hashimon);
}

window.HashimonMining = {

  shareTargetBits: DEFAULT_SHARE_TARGET_BITS,
  blockTargetBits: 64,
  budgetMs: 260,

  hashOnce(str) { return SHA256(SHA256(str)); },

  leadingZeroBits(hex) {
    return leadingZeroBits(hex);
  },

  /**
   * Mine one burst against the authoritative server job.
   * Requires hashimon.serverId and an active session.
   */
  async mine(hashimon, opts = {}) {
    if (!hashimon.serverId) {
      return { ok: false, error: "not_synced", verified: false };
    }

    const burstMs = opts.budgetMs != null ? opts.budgetMs : this.budgetMs;
    let job;

    try {
      job = await HashimonApi.fetchJob(hashimon.serverId);
    } catch (e) {
      return { ok: false, error: String(e.message || e), verified: false };
    }

    const dna = job.header?.merkleRoot || hashimon.dna;
    const extranonce1 = job.extranonce1 || deriveExtranonce1(dna);
    const extranonce2Start = hashimon.pow.extranonce2 ?? job.extranonce2Start ?? 0;
    const shareTargetBits = job.shareTargetBits ?? DEFAULT_SHARE_TARGET_BITS;

    const t0 = performance.now();
    const burst = mineBurst({
      dna,
      extranonce1,
      extranonce2Start,
      shareTargetBits,
      burstMs,
    });
    const seconds = (performance.now() - t0) / 1000;

    hashimon.pow.extranonce2 = burst.nextExtranonce2;
    hashimon.pow.totalHashes = (hashimon.pow.totalHashes || 0) + burst.hashes;
    hashimon.pow.miningSeconds = +((hashimon.pow.miningSeconds || 0) + seconds).toFixed(1);

    if (!burst.found || !burst.share) {
      return {
        ok: true,
        found: false,
        hashes: burst.hashes,
        seconds,
        hashrate: Math.round(burst.hashes / Math.max(seconds, 0.001)),
        best: burst.best,
        verified: hashimon.verified ?? null,
        localOnly: true,
      };
    }

    try {
      const res = await HashimonApi.submitShare(hashimon.serverId, {
        jobId: job.jobId,
        extranonce2: burst.share.extranonce2,
        nonce: burst.share.nonce,
        hash: burst.share.hash,
        totalHashesAttempted: burst.hashes,
      });
      applyServerPow(hashimon, res);
      const evolution = globalThis.HashimonSystem.refreshEvolution(hashimon);
      return {
        ok: true,
        found: true,
        verified: res.verified === true,
        bits: res.bits,
        bestBits: res.bestShareBits ?? burst.share.bits,
        bestHash: res.bestShareHash ?? burst.share.hash,
        tier: res.progression?.tier ?? evolution.tier,
        newBest: true,
        stageUp: evolution.stageUp,
        newStage: evolution.newStage,
        hashes: burst.hashes,
        seconds,
        hashrate: Math.round(burst.hashes / Math.max(seconds, 0.001)),
        share: burst.share,
        ...evolution,
      };
    } catch (e) {
      if (e.code === "stale_job" || e.status === 409) {
        return {
          ok: false,
          error: "stale_job",
          share: burst.share,
          verified: false,
          retry: true,
        };
      }
      return {
        ok: false,
        error: String(e.message || e),
        share: burst.share,
        verified: false,
      };
    }
  },

  verify(hashimon) {
    if (hashimon.verified === true) { return true; }
    if (hashimon.verified === false) { return false; }
    if (hashimon.pow.bestShareNonce == null) { return null; }
    const dna = HashimonDNA.forHashimon(hashimon);
    if (hashimon.pow.bestShareExtranonce2 != null) {
      const recomputed = this.hashOnce(
        `${dna}:${deriveExtranonce1(dna)}:${hashimon.pow.bestShareExtranonce2}:${hashimon.pow.bestShareNonce}`
      );
      return recomputed === hashimon.pow.bestShareHash;
    }
    return this.hashOnce(`${dna}:${hashimon.pow.bestShareNonce}`) === hashimon.pow.bestShareHash;
  },

};

export default window.HashimonMining;
