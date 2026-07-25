//Single species catalog. A species is the SHARED identity of a Hashimon: its
//canonical type, its archetype (silhouette) and its home zones. Every individual
//of a species is recognizably that species, but its exact colour, sub-type,
//markings and rarity come from its own DNA (see the compiler). This is the
//Pokemon model: the species is shared, the individual is unique.
//
//  type / type2  -> one of the 16 whitepaper types (keys). Fixes what element
//                   the creature reads as. type2 makes it dual (max 2).
//  archetype     -> body plan fed to the image model.
//  zones         -> which maps this species can be encountered in.
//  branch/starClass are legacy battle-icon fields, kept so combat keeps working.
window.HashimonBranches = {
  solar: { icon: "/images/icons/spicy.png" },
  block: { icon: "/images/icons/veggie.png" },
  storm: { icon: "/images/icons/chill.png" },
  void:  { icon: "/images/icons/fungi.png" },
}

window.Hashimons = {
  //--- Starter: the genesis block made flesh ---
  s001: {
    name: "Hashimon",
    description: "Your first block. Loyal and stubborn.",
    species: "genesis",
    type: "pixel", archetype: "canine",
    branch: "solar", starClass: "yellow",
    baseHp: 50, baseStats: { power: 8, defense: 7, speed: 7, energy: 10 },
    moves: ["scratch", "hashPulse", "overclock"],
    templateId: "template_genesis_001", birthNonce: 100001,
    spriteStages: [
      { minStage: 1,  label: "Hatchling", src: "/images/characters/pizzas/hashimon_1.png" },
      { minStage: 6,  label: "Juvenile",  src: "/images/characters/pizzas/hashimon_2.png" },
      { minStage: 16, label: "Adult",     src: "/images/adult-lion.svg" },
    ],
  },

  //--- Fire / Kitchen ---
  solarCub: {
    name: "Solar Cub",
    description: "A wild ember of the solar branch.",
    species: "lion",
    type: "fuego", archetype: "lion",
    branch: "solar", starClass: "yellow",
    baseHp: 35, baseStats: { power: 8, defense: 7, speed: 6, energy: 10 },
    moves: ["scratch", "hashPulse"],
    templateId: "template_solar_001", birthNonce: 481927,
    zones: ["kitchen"],
    spriteStages: [
      { minStage: 1,  label: "Lion BB",        src: "/images/characters/pizzas/hashimon_1.png" },
      { minStage: 6,  label: "LionKid",        src: "/images/characters/pizzas/hashimon_2.png" },
      { minStage: 16, label: "Lion Adult",     src: "/images/adult-lion.svg" },
      { minStage: 28, label: "Lion Mythic",    src: "/images/adult-lion.svg" },
      { minStage: 33, label: "Lion Sovereign", src: "/images/adult-lion.svg" },
    ],
  },

  //--- Metal / Street ---
  s002: {
    name: "Bacon Brigade",
    description: "A salty warrior who fears nothing.",
    species: "brigade",
    type: "metal", archetype: "ursine",
    branch: "solar", starClass: "orange",
    baseHp: 50, baseStats: { power: 9, defense: 6, speed: 7, energy: 8 },
    moves: ["strike", "overclock", "hashGlitch"],
    templateId: "template_metal_001", birthNonce: 200002,
    zones: ["street"],
    spriteStages: [{ minStage: 1, label: "Bacon Brigade", src: "/images/characters/pizzas/hashimon_2.png" }],
  },
  //--- Pixel / Street ---
  glitchPup: {
    name: "Glitchpup",
    description: "A stray that renders in the wrong resolution.",
    species: "glitchpup",
    type: "pixel", archetype: "canine",
    branch: "solar", starClass: "green",
    baseHp: 42, baseStats: { power: 8, defense: 6, speed: 9, energy: 8 },
    moves: ["scratch", "strike"],
    templateId: "template_pixel_002", birthNonce: 707011,
    zones: ["street"],
    spriteStages: [{ minStage: 1, label: "Glitchpup", src: "/images/characters/pizzas/c001.png" }],
  },
  //--- Electric / Street ---
  voltKit: {
    name: "Voltkit",
    description: "Small, charged, and always twitching.",
    species: "voltkit",
    type: "electrico", archetype: "rodent",
    branch: "storm", starClass: "yellow",
    baseHp: 40, baseStats: { power: 9, defense: 5, speed: 10, energy: 9 },
    moves: ["hashPulse", "strike"],
    templateId: "template_electric_001", birthNonce: 303044,
    zones: ["street"],
    spriteStages: [{ minStage: 1, label: "Voltkit", src: "/images/characters/pizzas/c002.png" }],
  },

  //--- Plant / GreenKitchen ---
  v001: {
    name: "Call Me Kale",
    description: "Patient as a confirmed block.",
    species: "kale",
    type: "vegetal", archetype: "amphibian",
    branch: "block", starClass: "green",
    baseHp: 50, baseStats: { power: 7, defense: 9, speed: 5, energy: 9 },
    moves: ["strike", "overclock"],
    templateId: "template_plant_001", birthNonce: 300003,
    zones: ["greenKitchen"],
    spriteStages: [{ minStage: 1, label: "Call Me Kale", src: "/images/characters/pizzas/v001.png" }],
  },
  //--- Earth / GreenKitchen ---
  v002: {
    name: "Archie Artichoke",
    description: "Layers upon layers of defense.",
    species: "artichoke",
    type: "tierra", archetype: "chelonian",
    branch: "block", starClass: "green",
    baseHp: 50, baseStats: { power: 6, defense: 10, speed: 5, energy: 9 },
    moves: ["strike", "overclock"],
    templateId: "template_earth_001", birthNonce: 400004,
    zones: ["greenKitchen"],
    spriteStages: [{ minStage: 1, label: "Archie Artichoke", src: "/images/characters/pizzas/v003.png" }],
  },
  //--- Fungus / GreenKitchen ---
  f001: {
    name: "Portobello Express",
    description: "Grows in the dark of the mempool.",
    species: "portobello",
    type: "hongo", archetype: "fungal",
    branch: "void", starClass: "violet",
    baseHp: 50, baseStats: { power: 8, defense: 7, speed: 8, energy: 7 },
    moves: ["strike", "hashGlitch"],
    templateId: "template_fungus_001", birthNonce: 500005,
    zones: ["greenKitchen"],
    spriteStages: [{ minStage: 1, label: "Portobello Express", src: "/images/characters/pizzas/f001.png" }],
  },

  //--- Dream / StreetNorth ---
  f002: {
    name: "Ninzauu",
    description: "Speed and ninja moves.",
    species: "ninzauu",
    type: "sueno", archetype: "chiropteran",
    branch: "void", starClass: "violet",
    baseHp: 50, baseStats: { power: 8, defense: 6, speed: 10, energy: 7 },
    moves: ["scratch", "hashGlitch"],
    templateId: "template_dream_001", birthNonce: 600006,
    zones: ["streetNorth"],
    spriteStages: [{ minStage: 1, label: "Ninzauu", src: "/images/characters/pizzas/f002.png" }],
  },
  //--- Astro / StreetNorth ---
  astralFawn: {
    name: "Astral Fawn",
    description: "It walks a handspan above the road.",
    species: "astralfawn",
    type: "astro", archetype: "deer",
    branch: "storm", starClass: "violet",
    baseHp: 46, baseStats: { power: 7, defense: 7, speed: 8, energy: 10 },
    moves: ["hashPulse", "strike"],
    templateId: "template_astro_001", birthNonce: 808022,
    zones: ["streetNorth"],
    spriteStages: [{ minStage: 1, label: "Astral Fawn", src: "/images/characters/pizzas/s003.png" }],
  },
  //--- Mental / StreetNorth ---
  psyMoth: {
    name: "Psymoth",
    description: "Reads the block before it is mined.",
    species: "psymoth",
    type: "mental", archetype: "insect",
    branch: "storm", starClass: "blue",
    baseHp: 44, baseStats: { power: 7, defense: 6, speed: 9, energy: 10 },
    moves: ["hashPulse", "strike"],
    templateId: "template_mental_001", birthNonce: 909033,
    zones: ["streetNorth"],
    spriteStages: [{ minStage: 1, label: "Psymoth", src: "/images/characters/pizzas/c003.png" }],
  },

  //--- Water / DiningRoom ---
  tideKit: {
    name: "Tidekit",
    description: "Half cat, half contained tide.",
    species: "tidekit",
    type: "agua", archetype: "feline",
    branch: "block", starClass: "blue",
    baseHp: 48, baseStats: { power: 7, defense: 8, speed: 7, energy: 9 },
    moves: ["scratch", "strike"],
    templateId: "template_water_001", birthNonce: 111055,
    zones: ["diningRoom"],
    spriteStages: [{ minStage: 1, label: "Tidekit", src: "/images/characters/pizzas/v002.png" }],
  },
  //--- Air / DiningRoom ---
  gustling: {
    name: "Gustling",
    description: "It never quite touches down.",
    species: "gustling",
    type: "aire", archetype: "bird",
    branch: "storm", starClass: "blue",
    baseHp: 44, baseStats: { power: 7, defense: 6, speed: 10, energy: 9 },
    moves: ["hashPulse", "strike"],
    templateId: "template_air_001", birthNonce: 222066,
    zones: ["diningRoom"],
    spriteStages: [{ minStage: 1, label: "Gustling", src: "/images/characters/pizzas/f003.png" }],
  },
}
