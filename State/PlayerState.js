class PlayerState {
  constructor() {
    this.pizzas = {
      "p1": {
        pizzaId: "s001",
        hp: 50,
        maxHp: 50,
        xp: 0,
        maxXp: 100,
        level: 1,
        status: null,
      },
      // "p2": {
      //   pizzaId: "v001",
      //   hp: 50,
      //   maxHp: 50,
      //   xp: 75,
      //   maxXp: 100,
      //   level: 1,
      //   status: null,
      // },
      // "p3": {
      //   pizzaId: "f001",
      //   hp: 50,
      //   maxHp: 50,
      //   xp: 75,
      //   maxXp: 100,
      //   level: 1,
      //   status: null,
      // }
    }
    this.lineup = ["p1"];
    this.items = [
      { actionId: "item_recoverHp", instanceId: "item1" },
      { actionId: "item_recoverHp", instanceId: "item2" },
      { actionId: "item_recoverHp", instanceId: "item3" },
    ]
    this.storyFlags = {
    };
    this.hashimons = {}; //Captured Hashimons, keyed by instance id
    this.loadHashimons();
  }

  addHashimon(hashimon) {
    //Avoid accidental id collisions: same species captured twice gets a suffixed id
    let id = hashimon.id;
    while (this.hashimons[id]) {
      id = `${hashimon.id}_${Date.now()}${Math.floor(Math.random() * 999)}`;
    }
    this.hashimons[id] = { ...hashimon, id };
    this.saveHashimons();
    utils.emitEvent("HashimonCollectionChanged");
    return this.hashimons[id];
  }

  saveHashimons() {
    if (!window.localStorage) { return; }
    window.localStorage.setItem("Hashimon_Collection", JSON.stringify(this.hashimons));
  }

  loadHashimons() {
    if (!window.localStorage) { return; }
    const file = window.localStorage.getItem("Hashimon_Collection");
    if (file) {
      this.hashimons = JSON.parse(file);
    }
  }

  addPizza(pizzaId) {
    const newId = `p${Date.now()}`+Math.floor(Math.random() * 99999);
    this.pizzas[newId] = {
      pizzaId,
      hp: 50,
      maxHp: 50,
      xp: 0,
      maxXp: 100,
      level: 1,
      status: null,
    }
    if (this.lineup.length < 3) {
      this.lineup.push(newId)
    }
    utils.emitEvent("LineupChanged");
  }

  swapLineup(oldId, incomingId) {
    const oldIndex = this.lineup.indexOf(oldId);
    this.lineup[oldIndex] = incomingId;
    utils.emitEvent("LineupChanged");
  }

  moveToFront(futureFrontId) {
    this.lineup = this.lineup.filter(id => id !== futureFrontId);
    this.lineup.unshift(futureFrontId);
    utils.emitEvent("LineupChanged");
  }

}
window.playerState = new PlayerState();