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
    if (hashimon.speciesKey && window.HashimonMoves) {
      hashimon.moves = HashimonMoves.kitFor(hashimon.speciesKey);
    }
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
    if (hashimon.pow) {
      const p = hashimon.pow;
      if (p.extranonce2 == null) { p.extranonce2 = 0; }
      if (p.totalHashes == null) { p.totalHashes = 0; }
      if (p.bestShareNonce === undefined) { p.bestShareNonce = null; }
      if (p.bestShareExtranonce2 === undefined) { p.bestShareExtranonce2 = null; }
      if (p.bestShareBits == null) {
        p.bestShareBits = /^0000[^0]/.test(p.bestShareHash || "") ? 0
          : Math.max(0, Math.floor(Math.log2(Math.max(1, p.bestShareDifficulty || 1))));
      }
      if (window.HashimonSystem) { HashimonSystem.refreshEvolution(hashimon); }
    }
  }

  constructor() {
    this.hashimons = {};
    this.lineup = [];
    this.items = [
      { actionId: "item_recoverHp", instanceId: "item1" },
      { actionId: "item_recoverHp", instanceId: "item2" },
      { actionId: "item_recoverHp", instanceId: "item3" },
    ];
    this.storyFlags = {};
    this.questProgress = { activeQuestId: null, completedSteps: [] };
    this.personSeed = "hero_genesis";
    this.serverReady = false;
    this.load();
  }

  async bootstrapServer({ speciesKey } = {}) {
    if (!window.HashimonApi) {
      this.serverReady = false;
      return false;
    }
    try {
      await HashimonApi.ensureSession();
      const all = Object.values(this.hashimons);
      if (this.lineup.length === 0 || all.length === 0) {
        if (!speciesKey) {
          console.warn("Empty roster but no speciesKey — skipping starter emit.");
          this.serverReady = false;
          return false;
        }
        const server = await HashimonApi.emitHashimon(speciesKey, "starter");
        const h = HashimonApi.mapServerToLocal(server, "hashimon_starter_001");
        this.hashimons = { [h.id]: h };
        this.lineup = [h.id];
        this.storyFlags.genesisComplete = true;
        this.save();
      } else if (all.some(h => !h.serverId)) {
        console.warn("Some Hashimon lack serverId — mining disabled until re-emitted.");
      }
      this.serverReady = true;
      utils.emitEvent("PlayerStateUpdated");
      return true;
    } catch (e) {
      console.warn("Hashimon server bootstrap failed:", e);
      this.serverReady = false;
      return false;
    }
  }

  resetLocal() {
    this.hashimons = {};
    this.lineup = [];
    this.storyFlags = {};
    this.questProgress = { activeQuestId: null, completedSteps: [] };
    this.personSeed = "hero_genesis";
    this.items = [
      { actionId: "item_recoverHp", instanceId: "item1" },
      { actionId: "item_recoverHp", instanceId: "item2" },
      { actionId: "item_recoverHp", instanceId: "item3" },
    ];
  }

  async reset() {
    this.resetLocal();
    this.save();
  }

  async emitAndAdd(speciesKey, provenance = "wild", localId) {
    const server = await HashimonApi.emitHashimon(speciesKey, provenance);
    const hashimon = HashimonApi.mapServerToLocal(server, localId);
    return this.addHashimon(hashimon);
  }

  async captureWild(speciesKey) {
    return this.emitAndAdd(speciesKey, "wild");
  }

  async craftHashimon(speciesKey) {
    return this.emitAndAdd(speciesKey, "wild");
  }

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

  save() {
    if (!window.localStorage) { return; }
    const progress = window.overworld?.progress || null;
    SaveManager.writePlayer(this, progress);
  }

  load() {
    if (!window.localStorage) { return false; }

    const unified = SaveManager.load();
    const data = unified?.player;
    if (!data) { return false; }
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

    Object.values(this.hashimons).forEach(h => {
      if (!h.dna) {
        h.dna = HashimonDNA.derive(h.pow.templateId, h.pow.birthNonce, h.speciesKey);
      }
      this.migrateHashimon(h);
    });

    return this.lineup.length > 0;
  }

}
window.playerState = new PlayerState();
