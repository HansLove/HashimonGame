//Hashimon core: species data, simulated proof of work, and evolution math.
//All tuning knobs live in HashimonConfig so pacing is easy to adjust.
window.HashimonConfig = {
  maxStage: 33,
  stageStep: 10,        //evolution progress required per stage
  sharePoints: 2,       //progress granted per valid share
  difficultyPoints: 3,  //progress granted per doubling of best share difficulty
  secondsPerShare: 10,  //simulated mining time added per share
  blockDifficulty: 1000000, //simulated difficulty that counts as mining a real block
}

window.HashimonSpecies = {
  solarCub: {
    name: "Solar Cub",
    species: "lion",
    branch: "solar",
    starClass: "yellow",
    baseHp: 35,
    baseStats: { power: 8, defense: 7, speed: 6, energy: 10 },
    moves: ["scratch", "hashPulse"],
    templateId: "template_demo_001",
    birthNonce: 481927,
    baseId: "hashimon_lion_001",
    //Visual milestones. The architecture supports one sprite per stage (up to 33),
    //for now we only define a few milestones.
    spriteStages: [
      { minStage: 1, label: "Lion BB", src: "/images/characters/pizzas/hashimon_1.png" },
      { minStage: 6, label: "LionKid", src: "/images/characters/pizzas/hashimon_2.png" },
      { minStage: 16, label: "Lion Adult", src: "/images/adult-lion.svg" },
      { minStage: 28, label: "Lion Mythic", src: "/images/adult-lion.svg" },
      { minStage: 33, label: "Lion Sovereign", src: "/images/adult-lion.svg" },
    ],
  }
}

window.HashimonSystem = {

  createInstance(speciesKey) {
    const species = HashimonSpecies[speciesKey];
    return {
      id: species.baseId,
      name: species.name,
      species: species.species,
      stage: 1,
      maxStage: HashimonConfig.maxStage,
      branch: species.branch,
      starClass: species.starClass,
      level: 1,
      hp: species.baseHp,
      maxHp: species.baseHp,
      stats: { ...species.baseStats },
      pow: {
        templateId: species.templateId,
        birthNonce: species.birthNonce,
        bestShareDifficulty: 1,
        bestShareHash: "0000demo",
        validShares: 0,
        miningSeconds: 0,
        foundBlock: false,
      },
      evolution: {
        progress: 0,
        nextThreshold: HashimonConfig.stageStep,
      },
      moves: [ ...species.moves ],
      speciesKey,
    }
  },

  calculateEvolutionProgress(hashimon) {
    const difficultyBonus = Math.floor(
      Math.log2(Math.max(1, hashimon.pow.bestShareDifficulty))
    ) * HashimonConfig.difficultyPoints;
    return hashimon.pow.validShares * HashimonConfig.sharePoints + difficultyBonus;
  },

  calculateStage(hashimon) {
    const progress = this.calculateEvolutionProgress(hashimon);
    return Math.min(
      hashimon.maxStage || HashimonConfig.maxStage,
      1 + Math.floor(progress / HashimonConfig.stageStep)
    );
  },

  getSpriteForStage(hashimon) {
    const species = HashimonSpecies[hashimon.speciesKey] || HashimonSpecies.solarCub;
    let result = species.spriteStages[0];
    species.spriteStages.forEach(milestone => {
      if (hashimon.stage >= milestone.minStage) {
        result = milestone;
      }
    })
    return result;
  },

  //Recalculates progress + stage from PoW data. Returns whether the stage went up.
  refreshEvolution(hashimon) {
    const oldStage = hashimon.stage;
    const newStage = this.calculateStage(hashimon);
    hashimon.evolution.progress = this.calculateEvolutionProgress(hashimon);
    hashimon.stage = newStage;
    hashimon.evolution.nextThreshold = newStage >= hashimon.maxStage
      ? hashimon.evolution.progress
      : newStage * HashimonConfig.stageStep;
    return { oldStage, newStage, stageUp: newStage > oldStage };
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

}
