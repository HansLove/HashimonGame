//Combat actions. Keys are stable ids; names/descriptions are what the player sees.
//Each success chain is resolved in order by BattleEvent.
window.Actions = {

  //--- Basics (any type) ---
  scratch: {
    name: "Scratch",
    description: "A quick, direct swipe",
    category: "physical",
    success: [
      { type: "textMessage", text: "{CASTER} uses {ACTION}!" },
      { type: "animation", animation: "spin" },
      { type: "stateChange", damage: 10 },
    ],
  },
  strike: {
    name: "Strike",
    description: "A solid body blow",
    category: "physical",
    success: [
      { type: "textMessage", text: "{CASTER} uses {ACTION}!" },
      { type: "animation", animation: "spin" },
      { type: "stateChange", damage: 10 },
    ],
  },
  hashPulse: {
    name: "Hash Pulse",
    description: "A pulse of hashing energy",
    category: "special",
    success: [
      { type: "textMessage", text: "{CASTER} uses {ACTION}!" },
      { type: "animation", animation: "glob", color: "#ffd76a" },
      { type: "stateChange", damage: 12 },
    ],
  },

  //--- Status / support ---
  overclock: {
    name: "Overclock",
    description: "Boosts hash output; heals a little each turn",
    category: "support",
    targetType: "friendly",
    success: [
      { type: "textMessage", text: "{CASTER} uses {ACTION}!" },
      { type: "stateChange", status: { type: "overclock", expiresIn: 3 } },
    ],
  },
  hashGlitch: {
    name: "Hash Glitch",
    description: "Corrupts the target's timing",
    category: "status",
    success: [
      { type: "textMessage", text: "{CASTER} uses {ACTION}!" },
      { type: "animation", animation: "glob", color: "#dafd2a" },
      { type: "stateChange", status: { type: "glitchy", expiresIn: 3 } },
      { type: "textMessage", text: "{TARGET}'s hash chain stutters!" },
    ],
  },

  //--- Type signatures ---
  genesisBlock: {
    name: "Genesis Block",
    description: "The original proof, hardened into a strike",
    category: "special",
    success: [
      { type: "textMessage", text: "{CASTER} channels the genesis block!" },
      { type: "animation", animation: "glob", color: "#82ff71" },
      { type: "stateChange", damage: 13 },
    ],
  },
  pixelBurst: {
    name: "Pixel Burst",
    description: "Fragments of bad resolution cut the target",
    category: "special",
    success: [
      { type: "textMessage", text: "{CASTER} uses {ACTION}!" },
      { type: "animation", animation: "glob", color: "#7cff9a" },
      { type: "stateChange", damage: 11 },
    ],
  },
  emberClaw: {
    name: "Ember Claw",
    description: "Rakes the foe with solar heat",
    category: "physical",
    success: [
      { type: "textMessage", text: "{CASTER} uses {ACTION}!" },
      { type: "animation", animation: "spin" },
      { type: "stateChange", damage: 14 },
    ],
  },
  alloyRam: {
    name: "Alloy Ram",
    description: "A heavy charge of tempered metal",
    category: "physical",
    success: [
      { type: "textMessage", text: "{CASTER} uses {ACTION}!" },
      { type: "animation", animation: "spin" },
      { type: "stateChange", damage: 14 },
    ],
  },
  voltArc: {
    name: "Volt Arc",
    description: "A jagged bolt of stored charge",
    category: "special",
    success: [
      { type: "textMessage", text: "{CASTER} uses {ACTION}!" },
      { type: "animation", animation: "glob", color: "#fff066" },
      { type: "stateChange", damage: 13 },
    ],
  },
  tidalCrash: {
    name: "Tidal Crash",
    description: "A contained wave slams into the target",
    category: "special",
    success: [
      { type: "textMessage", text: "{CASTER} uses {ACTION}!" },
      { type: "animation", animation: "glob", color: "#6ec8ff" },
      { type: "stateChange", damage: 12 },
    ],
  },
  gustSlice: {
    name: "Gust Slice",
    description: "Air pressure sharpened into a blade",
    category: "physical",
    success: [
      { type: "textMessage", text: "{CASTER} uses {ACTION}!" },
      { type: "animation", animation: "spin" },
      { type: "stateChange", damage: 12 },
    ],
  },
  starfall: {
    name: "Starfall",
    description: "Compressed starlight detonates on impact",
    category: "special",
    success: [
      { type: "textMessage", text: "{CASTER} uses {ACTION}!" },
      { type: "animation", animation: "glob", color: "#c8a0ff" },
      { type: "stateChange", damage: 15 },
    ],
  },
  mindProbe: {
    name: "Mind Probe",
    description: "Reads the mempool and disrupts focus",
    category: "special",
    success: [
      { type: "textMessage", text: "{CASTER} uses {ACTION}!" },
      { type: "animation", animation: "glob", color: "#8899ff" },
      { type: "stateChange", damage: 11 },
      { type: "stateChange", status: { type: "glitchy", expiresIn: 2 } },
    ],
  },
  dreamStep: {
    name: "Dream Step",
    description: "Phases through reality and scrambles timing",
    category: "status",
    success: [
      { type: "textMessage", text: "{CASTER} flickers out of phase!" },
      { type: "animation", animation: "glob", color: "#b088ff" },
      { type: "stateChange", status: { type: "glitchy", expiresIn: 4 } },
    ],
  },
  sporeCloud: {
    name: "Spore Cloud",
    description: "Mempool spores clog the target's hash chain",
    category: "status",
    success: [
      { type: "textMessage", text: "{CASTER} releases {ACTION}!" },
      { type: "animation", animation: "glob", color: "#9a6bb8" },
      { type: "stateChange", status: { type: "glitchy", expiresIn: 3 } },
      { type: "textMessage", text: "{TARGET} is disoriented!" },
    ],
  },
  rootGuard: {
    name: "Root Guard",
    description: "Anchors in place and stabilizes hash output",
    category: "support",
    targetType: "friendly",
    success: [
      { type: "textMessage", text: "{CASTER} takes {ACTION}!" },
      { type: "stateChange", status: { type: "overclock", expiresIn: 4 } },
    ],
  },
  leafDrain: {
    name: "Leaf Drain",
    description: "Saps energy and feeds it back",
    category: "special",
    success: [
      { type: "textMessage", text: "{CASTER} uses {ACTION}!" },
      { type: "animation", animation: "glob", color: "#7ec850" },
      { type: "stateChange", damage: 10 },
      { type: "stateChange", recover: 4, onCaster: true },
    ],
  },

  //--- Items ---
  item_recoverStatus: {
    name: "Reset Pulse",
    description: "Clears status effects",
    category: "item",
    targetType: "friendly",
    success: [
      { type: "textMessage", text: "{CASTER} uses a {ACTION}!" },
      { type: "stateChange", status: null },
      { type: "textMessage", text: "Status cleared!" },
    ],
  },
  item_recoverHp: {
    name: "Block Balm",
    description: "Restores a little HP",
    category: "item",
    targetType: "friendly",
    success: [
      { type: "textMessage", text: "{CASTER} applies {ACTION}!" },
      { type: "stateChange", recover: 10 },
      { type: "textMessage", text: "{CASTER} recovers HP!" },
    ],
  },
}
