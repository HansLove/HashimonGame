//Each entry under `hashimons` is instanced through HashimonSystem.createInstance,
//so speciesKey picks the species and the rest are balance overrides.
window.Enemies = {
  "wildSolarCub": {
    name: "Solar Cub salvaje",
    src: "/images/characters/pizzas/hashimon_1.png",
    isWild: true,
    wildSpecies: "solarCub",
    captureFlag: "CAUGHT_SOLAR_CUB",
    hashimons: {
      "a": { speciesKey: "solarCub", level: 1 },
    }
  },
  "erio": {
    name: "Erio",
    src: "/images/characters/people/erio.png",
    hashimons: {
      "a": { speciesKey: "s001", maxHp: 50, level: 1 },
      "b": { speciesKey: "s002", maxHp: 50, level: 1 },
    }
  },
  "beth": {
    name: "Beth",
    src: "/images/characters/people/npc1.png",
    hashimons: {
      "a": { speciesKey: "f001", maxHp: 50, hp: 1, level: 1 },
    }
  },
  "chefRootie": {
    name: "Rootie",
    src: "/images/characters/people/secondBoss.png",
    hashimons: {
      "a": { speciesKey: "f002", maxHp: 30, level: 2 },
    }
  },
  "streetNorthBattle": {
    name: "Hash Thug",
    src: "/images/characters/people/npc8.png",
    hashimons: {
      "a": { speciesKey: "s001", maxHp: 20, level: 1 },
    }
  },
  "diningRoomBattle": {
    name: "Hash Thug",
    src: "/images/characters/people/npc8.png",
    hashimons: {
      "a": { speciesKey: "s001", maxHp: 15, level: 1 },
      "b": { speciesKey: "s002", maxHp: 15, level: 1 },
    }
  },
  "streetBattle": {
    name: "Hash Thug",
    src: "/images/characters/people/npc8.png",
    hashimons: {
      "a": { speciesKey: "f002", maxHp: 25, level: 1 },
    }
  }
}
