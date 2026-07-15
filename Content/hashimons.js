window.PizzaTypes = {
  normal: "normal",
  spicy: "spicy",
  veggie: "veggie",
  fungi: "fungi",
  chill: "chill",
}

window.Pizzas = {
  "lion001": {
    name: "Solar Cub",
    description: "Un Hashimon salvaje de la rama solar",
    type: PizzaTypes.spicy,
    src: "/images/characters/pizzas/hashimon_1.png",
    icon: "/images/icons/spicy.png",
    actions: [ "scratch", "hashPulse" ],
  },
  "s001": {
    name: "Hashimon",
    description: "Pizza desc here",
    type: PizzaTypes.spicy,
    src: "/images/characters/pizzas/hashimon_1.png",
    // src: "/images/characters/pizzas/hashimon28x28.png",
    icon: "/images/icons/spicy.png",
    actions: [ "saucyStatus", "clumsyStatus", "damage1" ],
  },

  "s002": {
    name: "Bacon Brigade",
    description: "A salty warrior who fears nothing",
    type: PizzaTypes.spicy,
    src: "/images/characters/pizzas/hashimon_2.png",
    icon: "/images/icons/spicy.png",
    actions: [ "damage1", "saucyStatus", "clumsyStatus" ],
  },

  "v001": {
    name: "Call Me Kale",
    description: "Pizza desc here",
    type: PizzaTypes.veggie,
    src: "/images/characters/pizzas/v001.png",
    icon: "/images/icons/veggie.png",
    actions: [ "damage1" ],
  },
  "v002": {
    name: "Archie Artichoke",
    description: "Pizza desc here",
    type: PizzaTypes.veggie,
    src: "/images/characters/pizzas/v001.png",
    icon: "/images/icons/veggie.png",
    actions: [ "damage1" ],
  },
  "f001": {
    name: "Portobello Express",
    description: "Pizza desc here",
    type: PizzaTypes.fungi,
    src: "/images/characters/pizzas/f001.png",
    icon: "/images/icons/fungi.png",
    actions: [ "damage1" ],
  },

  "f002": {
    name: "Ninzauu",
    description: "Speed and ninja moves",
    type: PizzaTypes.fungi,
    src: "/images/characters/pizzas/hashimon_2.png",
    icon: "/images/icons/fungi.png",
    actions: [ "damage1" ],
  }
}