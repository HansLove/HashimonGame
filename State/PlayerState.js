class PlayerState {
  static MOVE_ALIASES = {
    damage1: "strike",
    saucyStatus: "overclock",
    clumsyStatus: "hashGlitch",
  };

  static STATUS_ALIASES = {
    saucy: "overclock",
    clumsy: "glitchy",
  };

  migrateHashimon(hashimon) {
    if (hashimon.moves) {
      hashimon.moves = hashimon.moves.map(move =>
        PlayerState.MOVE_ALIASES[move] || move
      );
    }
    if (hashimon.status?.type) {
      hashimon.status.type = PlayerState.STATUS_ALIASES[hashimon.status.type]
        || hashimon.status.type;
    }
    //Refresh move kits so saves pick up enriched species assignments.
    if (hashimon.speciesKey && window.HashimonMoves) {
      hashimon.moves = HashimonMoves.kitFor(hashimon.speciesKey);
    }
    //Species label + unique nickname migration for older saves.
    if (window.HashimonNames && hashimon.speciesKey) {
      if (!hashimon.speciesLabel) {
        hashimon.speciesLabel = HashimonNames.speciesLabel(hashimon.speciesKey);
      }
      if (hashimon.customName == null) { hashimon.customName = false; }
      const catalogName = Hashimons[hashimon.speciesKey]?.name;
      if (!hashimon.customName && catalogName && hashimon.name === catalogName) {
        hashimon.name = HashimonNames.generate(hashimon);
      }
    }
    //PoW fields for the real grinder (older saves predate them).
    if (hashimon.pow) {
      const p = hashimon.pow;
      if (p.extranonce2 == null) { p.extranonce2 = 0; }
      if (p.totalHashes == null) { p.totalHashes = 0; }
      if (p.bestShareNonce === undefined) { p.bestShareNonce = null; }
      if (p.bestShareBits == null) {
        //derive from any legacy bestShareDifficulty; a "demo" hash counts as 0
        p.bestShareBits = /^0000[^0]/.test(p.bestShareHash || "") ? 0
          : Math.max(0, Math.floor(Math.log2(Math.max(1, p.bestShareDifficulty || 1))));
      }
      //Rank/stage is now EARNED from the best real share — recompute so saves
      //made under the old share-count model drop to their true tier.
      if (window.HashimonSystem) { HashimonSystem.refreshEvolution(hashimon); }
    }
  }

  constructor() {
    //Single roster: everything you own lives here, whether it was your starter
    //or caught in the wild. `lineup` holds the ids you take into battle.
    this.hashimons = {};
    this.lineup = [];
    this.items = [
      { actionId: "item_recoverHp", instanceId: "item1" },
      { actionId: "item_recoverHp", instanceId: "item2" },
      { actionId: "item_recoverHp", instanceId: "item3" },
    ]
    this.storyFlags = {};
    this.questProgress = { activeQuestId: null, completedSteps: [] };
    this.personSeed = "hero_genesis";

    if (!this.load()) {
      this.seedStarter();
    }
  }

  seedStarter() {
    const starter = HashimonSystem.createInstance("s001", { id: "hashimon_starter_001" });
    this.hashimons[starter.id] = starter;
    this.lineup = [starter.id];
  }

  //Starting a new game wipes the roster. Without this the autosave would leak
  //the previous run's Hashimons into a fresh save.
  reset() {
    this.hashimons = {};
    this.lineup = [];
    this.storyFlags = {};
    this.questProgress = { activeQuestId: null, completedSteps: [] };
    this.personSeed = "hero_genesis";
    this.items = [
      { actionId: "item_recoverHp", instanceId: "item1" },
      { actionId: "item_recoverHp", instanceId: "item2" },
      { actionId: "item_recoverHp", instanceId: "item3" },
    ]
    this.seedStarter();
    this.save();
  }

  //Adds an already-built instance (wild capture, crafting). Guards against id
  //collisions so a second catch never overwrites the first one.
  addHashimon(hashimon) {
    let id = hashimon.id;
    while (this.hashimons[id]) {
      id = `${hashimon.speciesKey}_${Date.now()}${Math.floor(Math.random() * 9999)}`;
    }
    this.hashimons[id] = { ...hashimon, id };
    if (this.lineup.length < 3) {
      this.lineup.push(id);
    }
    this.save();
    utils.emitEvent("LineupChanged");
    return this.hashimons[id];
  }

  swapLineup(oldId, incomingId) {
    const oldIndex = this.lineup.indexOf(oldId);
    this.lineup[oldIndex] = incomingId;
    this.save();
    utils.emitEvent("LineupChanged");
  }

  moveToFront(futureFrontId) {
    this.lineup = this.lineup.filter(id => id !== futureFrontId);
    this.lineup.unshift(futureFrontId);
    this.save();
    utils.emitEvent("LineupChanged");
  }

  renameHashimon(id, newName) {
    const hashimon = this.hashimons[id];
    if (!hashimon) { return { ok: false, error: "Hashimon not found." }; }
    const result = HashimonNames.validate(newName);
    if (!result.ok) { return result; }
    hashimon.name = result.name;
    hashimon.customName = true;
    this.save();
    utils.emitEvent("PlayerStateUpdated");
    return { ok: true, name: result.name };
  }

  suggestName(id) {
    const hashimon = this.hashimons[id];
    if (!hashimon) { return { ok: false, error: "Hashimon not found." }; }
    hashimon.name = HashimonNames.generate(hashimon);
    hashimon.customName = false;
    this.save();
    utils.emitEvent("PlayerStateUpdated");
    return { ok: true, name: hashimon.name };
  }

  //The roster autosaves on every change so captures and mined shares survive a
  //reload without the player having to hit Save. Map position stays in Progress.
  save() {
    if (!window.localStorage) { return; }
    window.localStorage.setItem("Hashimon_PlayerState", JSON.stringify({
      hashimons: this.hashimons,
      lineup: this.lineup,
      items: this.items,
      storyFlags: this.storyFlags,
      questProgress: this.questProgress,
      personSeed: this.personSeed,
    }))
  }

  load() {
    if (!window.localStorage) { return false; }
    const file = window.localStorage.getItem("Hashimon_PlayerState");
    if (!file) { return false; }
    const data = JSON.parse(file);
    this.hashimons = data.hashimons || {};
    this.lineup = data.lineup || [];
    this.items = data.items || this.items;
    this.storyFlags = data.storyFlags || {};
    this.questProgress = data.questProgress || { activeQuestId: null, completedSteps: [] };
    if (this.questProgress.activeQuestId === "early_start") {
      this.questProgress.activeQuestId = null;
      this.questProgress.completedSteps = [];
    }
    this.personSeed = data.personSeed || "hero_genesis";

    //Hashimons captured before DNA existed get theirs derived now. It comes from
    //their unchanged PoW identity, so they end up with the DNA they always
    //would have had.
    Object.values(this.hashimons).forEach(h => {
      if (!h.dna) {
        h.dna = HashimonDNA.derive(h.pow.templateId, h.pow.birthNonce, h.speciesKey);
      }
      this.migrateHashimon(h);
    })

    return this.lineup.length > 0;
  }

}
window.playerState = new PlayerState();
