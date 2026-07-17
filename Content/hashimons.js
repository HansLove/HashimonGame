//Single species catalog. Every Hashimon the player or an enemy can field
//comes from here; instances are built by HashimonSystem.createInstance().
window.HashimonBranches = {
  solar: { icon: "/images/icons/spicy.png" },
  block: { icon: "/images/icons/veggie.png" },
  storm: { icon: "/images/icons/chill.png" },
  void:  { icon: "/images/icons/fungi.png" },
}

//spriteStages drives the visual evolution. The engine supports one entry per
//stage (up to maxStage); species with a single entry simply never change look.
window.Hashimons = {
  solarCub: {
    name: "Solar Cub",
    description: "Un Hashimon salvaje de la rama solar",
    species: "lion",
    branch: "solar",
    starClass: "yellow",
    baseHp: 35,
    baseStats: { power: 8, defense: 7, speed: 6, energy: 10 },
    moves: [ "scratch", "hashPulse" ],
    templateId: "template_demo_001",
    birthNonce: 481927,
    spriteStages: [
      { minStage: 1,  label: "Lion BB",        src: "/images/characters/pizzas/hashimon_1.png" },
      { minStage: 6,  label: "LionKid",        src: "/images/characters/pizzas/hashimon_2.png" },
      { minStage: 16, label: "Lion Adult",     src: "/images/adult-lion.svg" },
      { minStage: 28, label: "Lion Mythic",    src: "/images/adult-lion.svg" },
      { minStage: 33, label: "Lion Sovereign", src: "/images/adult-lion.svg" },
    ],
  },

  s001: {
    name: "Hashimon",
    description: "Tu primer bloque. Fiel y testarudo.",
    species: "genesis",
    branch: "solar",
    starClass: "yellow",
    baseHp: 50,
    baseStats: { power: 8, defense: 7, speed: 7, energy: 10 },
    moves: [ "saucyStatus", "clumsyStatus", "damage1" ],
    templateId: "template_genesis_001",
    birthNonce: 100001,
    spriteStages: [
      { minStage: 1, label: "Hashimon", src: "/images/characters/pizzas/hashimon_1.png" },
    ],
  },
  s002: {
    name: "Bacon Brigade",
    description: "A salty warrior who fears nothing",
    species: "brigade",
    branch: "solar",
    starClass: "orange",
    baseHp: 50,
    baseStats: { power: 9, defense: 6, speed: 7, energy: 8 },
    moves: [ "damage1", "saucyStatus", "clumsyStatus" ],
    templateId: "template_brigade_001",
    birthNonce: 200002,
    spriteStages: [
      { minStage: 1, label: "Bacon Brigade", src: "/images/characters/pizzas/hashimon_2.png" },
    ],
  },
  v001: {
    name: "Call Me Kale",
    description: "Paciente como un bloque confirmado",
    species: "kale",
    branch: "block",
    starClass: "green",
    baseHp: 50,
    baseStats: { power: 7, defense: 9, speed: 5, energy: 9 },
    moves: [ "damage1" ],
    templateId: "template_kale_001",
    birthNonce: 300003,
    spriteStages: [
      { minStage: 1, label: "Call Me Kale", src: "/images/characters/pizzas/v001.png" },
    ],
  },
  v002: {
    name: "Archie Artichoke",
    description: "Capas y capas de defensa",
    species: "artichoke",
    branch: "block",
    starClass: "green",
    baseHp: 50,
    baseStats: { power: 6, defense: 10, speed: 5, energy: 9 },
    moves: [ "damage1" ],
    templateId: "template_artichoke_001",
    birthNonce: 400004,
    spriteStages: [
      { minStage: 1, label: "Archie Artichoke", src: "/images/characters/pizzas/v001.png" },
    ],
  },
  f001: {
    name: "Portobello Express",
    description: "Crece en la oscuridad de la mempool",
    species: "portobello",
    branch: "void",
    starClass: "violet",
    baseHp: 50,
    baseStats: { power: 8, defense: 7, speed: 8, energy: 7 },
    moves: [ "damage1" ],
    templateId: "template_portobello_001",
    birthNonce: 500005,
    spriteStages: [
      { minStage: 1, label: "Portobello Express", src: "/images/characters/pizzas/f001.png" },
    ],
  },
  f002: {
    name: "Ninzauu",
    description: "Speed and ninja moves",
    species: "ninzauu",
    branch: "void",
    starClass: "violet",
    baseHp: 50,
    baseStats: { power: 8, defense: 6, speed: 10, energy: 7 },
    moves: [ "damage1" ],
    templateId: "template_ninzauu_001",
    birthNonce: 600006,
    spriteStages: [
      { minStage: 1, label: "Ninzauu", src: "/images/characters/pizzas/hashimon_2.png" },
    ],
  },
}
