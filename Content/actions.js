window.Actions = {
  scratch: {
    name: "Scratch",
    description: "A quick, direct swipe",
    success: [
      { type: "textMessage", text: "{CASTER} uses {ACTION}!"},
      { type: "animation", animation: "spin"},
      { type: "stateChange", damage: 10}
    ]
  },
  hashPulse: {
    name: "Hash Pulse",
    description: "A pulse of hashing energy",
    success: [
      { type: "textMessage", text: "{CASTER} uses {ACTION}!"},
      { type: "animation", animation: "glob", color: "#ffd76a" },
      { type: "stateChange", damage: 12}
    ]
  },
  strike: {
    name: "Strike",
    description: "A solid body blow",
    success: [
      { type: "textMessage", text: "{CASTER} uses {ACTION}!"},
      { type: "animation", animation: "spin"},
      { type: "stateChange", damage: 10}
    ]
  },
  overclock: {
    name: "Overclock",
    description: "Boosts hashing output for a few turns",
    targetType: "friendly",
    success: [
      { type: "textMessage", text: "{CASTER} uses {ACTION}!"},
      { type: "stateChange", status: { type: "overclock", expiresIn: 3 } }
    ]
  },
  hashGlitch: {
    name: "Hash Glitch",
    description: "Corrupts the target's timing",
    success: [
      { type: "textMessage", text: "{CASTER} uses {ACTION}!"},
      { type: "animation", animation: "glob", color: "#dafd2a" },
      { type: "stateChange", status: { type: "glitchy", expiresIn: 3 } },
      { type: "textMessage", text: "{TARGET}'s hash chain stutters!"},
    ]
  },
  //Items
  item_recoverStatus: {
    name: "Reset Pulse",
    description: "Clears status effects",
    targetType: "friendly",
    success: [
      { type: "textMessage", text: "{CASTER} uses a {ACTION}!"},
      { type: "stateChange", status: null },
      { type: "textMessage", text: "Status cleared!", },
    ]
  },
  item_recoverHp: {
    name: "Block Balm",
    description: "Restores a little HP",
    targetType: "friendly",
    success: [
      { type:"textMessage", text: "{CASTER} applies {ACTION}!", },
      { type:"stateChange", recover: 10, },
      { type:"textMessage", text: "{CASTER} recovers HP!", },
    ]
  },
}
