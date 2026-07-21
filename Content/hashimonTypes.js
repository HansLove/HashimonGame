//The sixteen types from the whitepaper, with the sub-types it lists under each.
//`name` is the English display label; the KEY stays the whitepaper's Spanish
//canon so nothing downstream breaks. `visual` is what the compiler feeds an
//image model: how the element shows up on a body.
window.HashimonTypes = {
  fuego: {
    name: "Fire",
    subtypes: ["Volcano", "Plasma"],
    hues: [[8, 42]],
    visual: {
      material: ["cracked skin with living embers", "hot obsidian scales", "smoke-stained fur"],
      feature: ["a mane of open flame", "glowing fissures down the spine", "horns of burning coal"],
      aura: "heat that warps the air around it",
    },
  },
  agua: {
    name: "Water",
    subtypes: ["Vapor", "Ice"],
    hues: [[175, 235]],
    visual: {
      material: ["translucent wet skin", "pearlescent scales", "a body of contained water"],
      feature: ["membranous fins", "a current flowing inside its torso", "ice crystals along its back"],
      aura: "suspended droplets orbiting slowly",
    },
  },
  onda: {
    name: "Wave",
    subtypes: ["Light", "Shadow", "Vibration", "Sound"],
    hues: [[40, 60], [260, 290]],
    visual: {
      material: ["an outline that vibrates and doubles", "a silhouette made of interference", "a body with a visible echo"],
      feature: ["concentric rings around its head", "tuning-fork ears", "a trailing after-image"],
      aura: "visible waves rippling out from its chest",
    },
  },
  electrico: {
    name: "Electric",
    subtypes: ["Plus", "Minus"],
    hues: [[45, 65]],
    visual: {
      material: ["bristling static fur", "skin with conductive veins", "a body of contained charge"],
      feature: ["arcs leaping between its antennae", "a lightning-rod tail", "glowing circuit markings"],
      aura: "sparks jumping to the ground",
    },
  },
  tierra: {
    name: "Earth",
    subtypes: ["Plant", "Crystal"],
    hues: [[20, 45]],
    visual: {
      material: ["a mineral crust", "dry clay skin", "a shell of sedimentary rock"],
      feature: ["stone plates across its back", "an open geode in its chest", "claws of fossil root"],
      aura: "dust and pebbles hovering around it",
    },
  },
  aire: {
    name: "Air",
    subtypes: ["Storm"],
    hues: [[190, 220]],
    visual: {
      material: ["weightless fur", "a body dispersing at the edges", "cloud down"],
      feature: ["wings of pure current", "a spiraling tail", "wind vortices along its flanks"],
      aura: "a constant swirl beneath its feet",
    },
  },
  astro: {
    name: "Astro",
    subtypes: ["Star", "Nova", "Chaos"],
    hues: [[230, 280]],
    visual: {
      material: ["deep-sky skin with stars inside it", "a body of contained void", "a nebula mantle"],
      feature: ["a tilted planetary ring", "a constellation etched on its side", "eclipse eyes"],
      aura: "stardust falling upward",
    },
  },
  pixel: {
    name: "Pixel",
    subtypes: ["Glitch", "Satoshi", "Crypto"],
    hues: [[120, 160]],
    visual: {
      material: ["a body of visible voxels", "a deliberately low-resolution texture", "digital-grid skin"],
      feature: ["edges breaking into squares", "a compression-artifact tail", "two-pixel eyes"],
      aura: "sprite fragments flaking off and regenerating",
    },
  },
  sueno: {
    name: "Dream",
    subtypes: ["Nightmare", "Specter"],
    hues: [[275, 320]],
    visual: {
      material: ["a body of dense mist", "skin that blurs at the edges", "a half-remembered silhouette"],
      feature: ["pupil-less eyes", "a dissolving tail", "a floating mask before its face"],
      aura: "slow trailing wisps of smoke",
    },
  },
  magia: {
    name: "Magic",
    subtypes: ["Psychic", "Monster", "Fae"],
    hues: [[290, 330]],
    visual: {
      material: ["iridescent fur", "skin with runes under the surface", "a body woven from enchanted thread"],
      feature: ["a sigil floating over its brow", "spiraling horns", "stained-glass wings"],
      aura: "glyphs turning in orbit",
    },
  },
  metal: {
    name: "Metal",
    subtypes: ["Robot", "Magneto"],
    hues: [[200, 220]],
    visual: {
      material: ["polished steel plating", "worn chrome", "riveted armor"],
      feature: ["exposed joints", "a chain tail", "a chest plate with a serial number"],
      aura: "iron filings floating along field lines",
    },
  },
  robot: {
    name: "Robot",
    subtypes: ["Magneto"],
    hues: [[195, 215]],
    visual: {
      material: ["a segmented shell", "a matte alloy chassis", "a hull with service panels"],
      feature: ["a single optical eye", "a glowing vent in its torso", "telescoping limbs"],
      aura: "diagnostic holograms flickering",
    },
  },
  plasma: {
    name: "Plasma",
    subtypes: ["Nova"],
    hues: [[300, 340]],
    visual: {
      material: ["a body of contained ionized gas", "self-lit skin", "matter between liquid and light"],
      feature: ["a visible core pulsing in its chest", "discharge limbs", "a crown of energy"],
      aura: "filaments snaking outward",
    },
  },
  vegetal: {
    name: "Plant",
    subtypes: ["Plant"],
    hues: [[85, 145]],
    visual: {
      material: ["living bark", "moss fur", "thick leaf skin"],
      feature: ["shoots along its back", "a closed flower on its head", "tendrils instead of a tail"],
      aura: "spores and seeds drifting",
    },
  },
  hongo: {
    name: "Fungus",
    subtypes: ["Specter"],
    hues: [[15, 40], [280, 310]],
    visual: {
      material: ["mycelium skin", "a spongy damp texture", "a fungal-cap body"],
      feature: ["a spotted cap", "bioluminescent gills beneath it", "a colony growing on its back"],
      aura: "a cloud of glowing spores",
    },
  },
  mental: {
    name: "Mental",
    subtypes: ["Psychic"],
    hues: [[250, 285]],
    visual: {
      material: ["smooth featureless skin", "cold porcelain", "a surface that reflects the viewer"],
      feature: ["an exposed glowing skull", "a third eye", "appendages that move without touching the ground"],
      aura: "small objects levitating in a ring",
    },
  },
}

//Type pairs the whitepaper calls out. When a Hashimon carries both parents, the
//compiler names the fusion instead of listing two types.
window.HashimonFusions = [
  { parents: ["metal", "pixel"],     name: "Robot" },
  { parents: ["electrico", "fuego"], name: "Plasma" },
  { parents: ["tierra", "agua"],     name: "Plant" },
  { parents: ["astro", "aire"],      name: "Cosmic Dust" },
  { parents: ["onda", "metal"],      name: "Rock" },
]
