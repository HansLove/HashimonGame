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
    this.questProgress = { activeQuestId: "early_start", completedSteps: [] };

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
    this.questProgress = { activeQuestId: "early_start", completedSteps: [] };
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
    this.questProgress = data.questProgress || { activeQuestId: "early_start", completedSteps: [] };

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
