//Each entry under `hashimons` is instanced through HashimonSystem.createInstance,
//so speciesKey picks the species and the rest are balance overrides.
window.Enemies = {
  "wildSolarCub": {
    name: "Solar Cub salvaje",
    isWild: true,
    wildSpecies: "solarCub",
    captureFlag: "CAUGHT_SOLAR_CUB",
    hashimons: {
      "a": { speciesKey: "solarCub", level: 1 },
    }
  },
  "erio": {
    name: "Erio",
    personSeed: "trainer_erio",
    template: "validator",
    hashimons: {
      "a": { speciesKey: "s001", maxHp: 50, level: 1 },
      "b": { speciesKey: "s002", maxHp: 50, level: 1 },
    }
  },
  "beth": {
    name: "Beth",
    personSeed: "trainer_beth",
    template: "hacker",
    hashimons: {
      "a": { speciesKey: "f001", maxHp: 50, hp: 1, level: 1 },
    }
  },
  "chefRootie": {
    name: "Rootie",
    personSeed: "trainer_rootie",
    template: "boss",
    hashimons: {
      "a": { speciesKey: "f002", maxHp: 30, level: 2 },
    }
  },
  "streetNorthBattle": {
    name: "Hash Thug",
    personSeed: "trainer_street_north",
    template: "hacker",
    hashimons: {
      "a": { speciesKey: "s001", maxHp: 20, level: 1 },
    }
  },
  "diningRoomBattle": {
    name: "Hash Thug",
    personSeed: "trainer_dining_room",
    template: "node",
    hashimons: {
      "a": { speciesKey: "s001", maxHp: 15, level: 1 },
      "b": { speciesKey: "s002", maxHp: 15, level: 1 },
    }
  },
  "streetBattle": {
    name: "Hash Thug",
    personSeed: "trainer_street",
    template: "miner",
    hashimons: {
      "a": { speciesKey: "f002", maxHp: 25, level: 1 },
    }
  }
}
