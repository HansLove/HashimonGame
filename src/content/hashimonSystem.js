//Hashimon core: instance creation, simulated proof of work, and evolution math.
//All tuning knobs live in HashimonConfig so pacing is easy to adjust.
window.HashimonConfig = {
  maxStage: 33,             //theoretical max (33 leading-zero nibbles = never reached)
  bitsPerStar: 4,           //a star/stage = one more leading-zero HEX nibble (4 bits)
  visualMaxTier: 15,        //tier at which the sprite/prompt reaches full "monster".
                            //Egg at 0 · child by ~5 (home CPU) · adult ~12-13 (mining
                            //rig) · monster ~15 (rig left running). Stretched so the
                            //transformation is SLOW, not baby->monster in 5 stars.
  statGrowthPerStage: 0.18, //+18% per stage/star over the species base
}

window.HashimonSystem = {

  //overrides lets enemies tweak balance (stage, level, maxHp, hp) without
  //needing a whole species of their own.
  createInstance(speciesKey, overrides = {}) {
    const species = Hashimons[speciesKey];
    const hashimon = {
      id: `${speciesKey}_${Date.now()}${Math.floor(Math.random() * 9999)}`,
      speciesKey,
      name: "",
      speciesLabel: species.name,
      customName: false,
      description: species.description,
      species: species.species,
      stage: 1,
      maxStage: HashimonConfig.maxStage,
      branch: species.branch,
      starClass: species.starClass,
      level: 1,
      xp: 0,
      maxXp: 100,
      status: null,
      hp: species.baseHp,
      maxHp: species.baseHp,
      stats: { ...species.baseStats },
      pow: {
        templateId: species.templateId,
        birthNonce: species.birthNonce,
        bestShareDifficulty: 1,
        bestShareBits: 0,
        bestShareHash: "0000demo",
        bestShareNonce: null,
        extranonce2: 0,        //the grind counter this creature resumes from
        totalHashes: 0,        //real hashes ever invested = proof of effort
        validShares: 0,
        miningSeconds: 0,
        foundBlock: false,
      },
      evolution: {
        progress: 0,
        nextThreshold: HashimonConfig.stageStep,
      },
      moves: [...(overrides.moves || HashimonMoves.resolve(speciesKey, species))],
    };

    //A unique birth nonce (wild catches pass one) makes every individual its own
    //creature, even within a species. Applied before deriving DNA so the DNA
    //reflects it.
    if (overrides.birthNonce !== undefined) { hashimon.pow.birthNonce = overrides.birthNonce; }
    if (overrides.templateId !== undefined) { hashimon.pow.templateId = overrides.templateId; }

    //ADN Hashiano: bound to the proof of work, so it is stable forever and can
    //be recomputed by anyone from the template and birth nonce alone.
    hashimon.dna = HashimonDNA.derive(
      hashimon.pow.templateId, hashimon.pow.birthNonce, speciesKey
    );

    hashimon.name = overrides.name || HashimonNames.generate(hashimon);
    if (overrides.customName) { hashimon.customName = true; }

    if (overrides.stage) {
      hashimon.stage = overrides.stage;
      this.applyStageScaling(hashimon);
      hashimon.hp = hashimon.maxHp;
    }
    ["level", "maxHp", "hp", "id"].forEach(key => {
      if (overrides[key] !== undefined) { hashimon[key] = overrides[key]; }
    })
    if (overrides.maxHp !== undefined && overrides.hp === undefined) {
      hashimon.hp = hashimon.maxHp;
    }
    return hashimon;
  },

  //Turns an instance into the shape Combatant expects.
  toCombatantConfig(hashimon) {
    const compiled = HashimonCompiler.compile(hashimon);
    const types = compiled.types;
    let typeLabel = types.primary.name;
    if (types.fusion) {
      typeLabel = types.fusion;
    } else if (types.secondary) {
      typeLabel = `${types.primary.name}/${types.secondary.name}`;
    }

    return {
      name: hashimon.name,
      description: hashimon.description,
      src: this.getSpriteForStage(hashimon).src,
      icon: HashimonBranches[hashimon.branch].icon,
      type: hashimon.branch,
      typeLabel,
      stars: this.tierOf(hashimon),
      actions: hashimon.moves,
      stats: { ...hashimon.stats },
      hp: hashimon.hp,
      maxHp: hashimon.maxHp,
      xp: hashimon.xp,
      maxXp: hashimon.maxXp,
      level: hashimon.level,
      status: hashimon.status,
    }
  },

  //Stage drives raw power: maxHp and every stat grow off the species base.
  //Current hp follows maxHp so evolving never feels like a downgrade.
  applyStageScaling(hashimon) {
    const species = Hashimons[hashimon.speciesKey];
    const multiplier = 1 + (hashimon.stage - 1) * HashimonConfig.statGrowthPerStage;
    const previousMaxHp = hashimon.maxHp;

    hashimon.maxHp = Math.round(species.baseHp * multiplier);
    Object.keys(species.baseStats).forEach(key => {
      hashimon.stats[key] = Math.round(species.baseStats[key] * multiplier);
    })

    const gained = hashimon.maxHp - previousMaxHp;
    if (gained > 0) { hashimon.hp = Math.min(hashimon.maxHp, hashimon.hp + gained); }
    if (hashimon.hp > hashimon.maxHp) { hashimon.hp = hashimon.maxHp; }
  },

  //A Hashimon's rank is EARNED, not counted: it is how many leading zero hex
  //nibbles its best real share has. Each extra nibble is 16x rarer, so a rank is
  //hard to reach and every one is a genuine milestone. Stars == stage == tier.
  //  best share 00001a0e...  -> 4 leading zeros -> tier 4 -> 4 stars, stage 4.
  //Reaching tier 5 (a 20-bit share) is ~1M hashes: viable at home. Tier 33 is a
  //132-bit share: the theoretical maximum nobody will ever hit.
  tierOf(hashimon) {
    return Math.floor((hashimon.pow.bestShareBits || 0) / HashimonConfig.bitsPerStar);
  },

  //0..1 evolution weight for the sprite and the prompt, full "monster" by ~tier 6.
  visualRatio(hashimon) {
    return Math.min(1, this.tierOf(hashimon) / HashimonConfig.visualMaxTier);
  },

  calculateStage(hashimon) {
    return Math.min(hashimon.maxStage || HashimonConfig.maxStage, Math.max(1, this.tierOf(hashimon)));
  },

  //Returns the form LABEL from the species' spriteStages, and the SRC from the
  //DNA-driven pixel generator (falling back to the static PNG if it's absent).
  //So the same creature is drawn from its hash everywhere it appears.
  getSpriteForStage(hashimon) {
    const species = Hashimons[hashimon.speciesKey];
    let milestone = species.spriteStages[0];
    species.spriteStages.forEach(m => {
      if (hashimon.stage >= m.minStage) { milestone = m; }
    })
    return {
      label: milestone.label,
      src: window.HashimonSprite ? HashimonSprite.toDataURL(hashimon, { scale: 4 }) : milestone.src,
    };
  },

  //Recalculates rank + stage from the best real share. Returns whether it evolved.
  refreshEvolution(hashimon) {
    const oldStage = hashimon.stage;
    const bits = hashimon.pow.bestShareBits || 0;
    const tier = Math.floor(bits / HashimonConfig.bitsPerStar);
    const newStage = Math.min(hashimon.maxStage || HashimonConfig.maxStage, Math.max(1, tier));

    hashimon.stars = tier;                                   //earned stars == stage == tier
    hashimon.stage = newStage;
    //Progress = bits already banked toward the NEXT leading zero (0..3 of 4).
    hashimon.evolution.progress = bits - tier * HashimonConfig.bitsPerStar;
    hashimon.evolution.nextThreshold = HashimonConfig.bitsPerStar;

    if (newStage !== oldStage) { this.applyStageScaling(hashimon); }
    return { oldStage, newStage, stageUp: newStage > oldStage, tier, bits };
  },

  //Share luck: heavy-tail roll, most shares are low difficulty, rare ones are huge.
  //Swap this formula freely to tune pacing.
  rollShareDifficulty() {
    return Math.max(1, Math.floor(1 / (1 - Math.random())));
  },

  //Deterministic fake hash so the UI shows something plausible for a best share
  fakeShareHash(hashimon, difficulty) {
    const zeros = "0".repeat(Math.min(12, 4 + Math.floor(Math.log2(difficulty))));
    const src = `${hashimon.id}:${hashimon.pow.validShares}:${difficulty}`;
    let seed = 0;
    for (let i = 0; i < src.length; i++) {
      seed = (seed * 31 + src.charCodeAt(i)) >>> 0;
    }
    let hex = "";
    while (hex.length < 16) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      hex += seed.toString(16).padStart(8, "0");
    }
    return zeros + hex.slice(0, 16);
  },

  simulateShare(hashimon) {
    const pow = hashimon.pow;
    pow.validShares += 1;
    pow.miningSeconds += HashimonConfig.secondsPerShare;

    const difficulty = this.rollShareDifficulty();
    const isNewBest = difficulty > pow.bestShareDifficulty;
    if (isNewBest) {
      pow.bestShareDifficulty = difficulty;
      pow.bestShareHash = this.fakeShareHash(hashimon, difficulty);
    }
    if (difficulty >= HashimonConfig.blockDifficulty) {
      pow.foundBlock = true;
    }

    const evolution = this.refreshEvolution(hashimon);
    return { difficulty, isNewBest, foundBlock: pow.foundBlock, ...evolution };
  },

};

export const HashimonSystem = window.HashimonSystem;
