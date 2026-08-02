class OverworldMap {
  constructor(config) {
    this.overworld = null;
    this.gameObjects = {};
    this.configObjects = config.configObjects;
    this.mapId = config.id || "unknown";

    
    this.cutsceneSpaces = config.cutsceneSpaces || {};
    this.walls = config.walls || {};

    //Procedurally generated maps hand us pre-drawn canvases; bespoke maps give a
    //PNG url to load. drawImage takes either, so the render path is unchanged.
    if (config.lowerImage) {
      this.lowerImage = config.lowerImage;
    } else {
      this.lowerImage = new Image();
      this.lowerImage.src = config.lowerSrc;
    }
    if (config.upperImage) {
      this.upperImage = config.upperImage;
    } else {
      this.upperImage = new Image();
      this.upperImage.src = config.upperSrc;
    }

    this.isCutscenePlaying = false;
    this.isPaused = false;

    this.isEndless = config.isEndless || false;
    this.bounds = config.bounds || null;
    this.floorColor = config.floorColor || null;
    this.biomeName = config.biomeName || null;
  }

  getDrawOffset(cameraPerson) {
    const defaultX = utils.withGrid(10.5);
    const defaultY = utils.withGrid(6);
    if (!this.isEndless) {
      return { x: defaultX, y: defaultY };
    }

    const canvasW = 352;
    const canvasH = 198;
    const mapW = this.lowerImage.width || canvasW;
    const mapH = this.lowerImage.height || canvasH;
    let ax = defaultX;
    let ay = defaultY;

    if (mapW > canvasW) {
      ax = Math.max(cameraPerson.x + canvasW - mapW, Math.min(cameraPerson.x, ax));
    }
    if (mapH > canvasH) {
      ay = Math.max(cameraPerson.y + canvasH - mapH, Math.min(cameraPerson.y, ay));
    }

    return { x: ax, y: ay };
  }

  drawLowerImage(ctx, cameraPerson, drawOffset) {
    const anchor = drawOffset || this.getDrawOffset(cameraPerson);
    const ox = anchor.x - cameraPerson.x;
    const oy = anchor.y - cameraPerson.y;

    if (this.isEndless && this.floorColor) {
      ctx.fillStyle = this.floorColor;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    const filter = window.MapThemes?.[this.mapId];
    if (filter) { ctx.filter = filter; }
    ctx.drawImage(this.lowerImage, ox, oy);
    if (filter) { ctx.filter = "none"; }
  }

  drawUpperImage(ctx, cameraPerson, drawOffset) {
    const anchor = drawOffset || this.getDrawOffset(cameraPerson);
    const ox = anchor.x - cameraPerson.x;
    const oy = anchor.y - cameraPerson.y;

    const filter = window.MapThemes?.[this.mapId];
    if (filter) { ctx.filter = filter; }
    ctx.drawImage(this.upperImage, ox, oy);
    if (filter) { ctx.filter = "none"; }
  }

  isSpaceTaken(currentX, currentY, direction) {
    const {x,y} = utils.nextPosition(currentX, currentY, direction);

    if (this.isEndless && this.bounds) {
      const { cols, rows, tile } = this.bounds;
      if (x < 0 || y < 0 || x >= cols * tile || y >= rows * tile) {
        return true;
      }
    }

    if (this.walls[`${x},${y}`]) {
      return true;
    }
    //Check for game objects at this position
    return Object.values(this.gameObjects).find(obj => {
      if (obj.x === x && obj.y === y) { return true; }
      if (obj.intentPosition && obj.intentPosition[0] === x && obj.intentPosition[1] === y ) {
        return true;
      }
      return false;
    })

  }

  mountObjects() {
    Object.keys(this.configObjects).forEach(key => {

      let object = this.configObjects[key];
      object.id = key;

      let instance;
      if (object.type === "Person") {
        if (window.PersonGenerator) {
          object.src = PersonGenerator.resolvePerson(object, this.mapId, key);
        }
        instance = new Person(object);
      }
      if (object.type === "HashimonStone") {
        instance = new HashimonStone(object);
      }
      this.gameObjects[key] = instance;
      this.gameObjects[key].id = key;
      instance.mount(this);
    })
  }

  async startCutscene(events) {
    this.isCutscenePlaying = true;

    for (let i=0; i<events.length; i++) {
      const eventHandler = new OverworldEvent({
        event: events[i],
        map: this,
      })
      const result = await eventHandler.init();
      if (result === "LOST_BATTLE") {
        break;
      }
    }
    this.isCutscenePlaying = false;
  }

  checkForActionCutscene() {
    const hero = this.gameObjects["hero"];
    const nextCoords = utils.nextPosition(hero.x, hero.y, hero.direction);
    const match = Object.values(this.gameObjects).find(object => {
      return `${object.x},${object.y}` === `${nextCoords.x},${nextCoords.y}`
    });
    if (!this.isCutscenePlaying && match && match.talking.length) {

      const relevantScenario = match.talking.find(scenario => {
        return (scenario.required || []).every(sf => {
          return playerState.storyFlags[sf]
        })
      })
      relevantScenario && this.startCutscene(relevantScenario.events)
    }
  }

  checkForFootstepCutscene() {
    const hero = this.gameObjects["hero"];
    const match = this.cutsceneSpaces[ `${hero.x},${hero.y}` ];
    if (!this.isCutscenePlaying && match) {
      //Pick the first scenario whose story flags line up, so a space can be
      //spent once (disqualify) or gated behind progress (required).
      const relevantScenario = match.find(scenario => {
        const hasRequired = (scenario.required || []).every(sf => playerState.storyFlags[sf]);
        const isDisqualified = (scenario.disqualify || []).some(sf => playerState.storyFlags[sf]);
        return hasRequired && !isDisqualified;
      })
      relevantScenario && this.startCutscene( relevantScenario.events )
    }
  }
}



window.OverworldMaps = {
  
  DemoRoom: {
    id: "DemoRoom",
    lowerSrc: "/images/maps/DemoLower.png",
    upperSrc: "/images/maps/DemoUpper.png",
    configObjects: {
      hero: {
        type: "Person",
        isPlayerControlled: true,
        x: utils.withGrid(5),
        y: utils.withGrid(6),
      },
      npcA: {
        type: "Person",
        x: utils.withGrid(10),
        y: utils.withGrid(8),
        behaviorLoop: [
          { type: "walk", direction: "left", },
          { type: "walk", direction: "down", },
          { type: "walk", direction: "right", },
          { type: "walk", direction: "up", },
          { type: "stand", direction: "up", time: 400, },
        ],
        talking: [
          {
            required: ["TALKED_TO_ERIO"],
            events: [
              { type: "textMessage", text: "Im thinking in Satoshi Nakamoto", faceHero: "npcA" },
            ]
          },
          {
            events: [
              { type: "textMessage", text: "I'm going to crush you!", faceHero: "npcA" },
              { type: "battle", enemyId: "beth" },
              { type: "addStoryFlag", flag: "DEFEATED_BETH"},
              { type: "textMessage", text: "You crushed me like weak pepper.", faceHero: "npcA" },
              { type: "textMessage", text: "Go away!"},
               //{ who: "npcB", type: "walk",  direction: "up" },
            ]
          }
        ]
      },
      npcC: {
        type: "Person",
        x: utils.withGrid(4),
        y: utils.withGrid(8),
        behaviorLoop: [
          { type: "stand", direction: "left", time: 500, },
          { type: "stand", direction: "down", time: 500, },
          { type: "stand", direction: "right", time: 500, },
          { type: "stand", direction: "up", time: 500, },
          { type: "walk", direction: "left",  },
          { type: "walk", direction: "down",  },
          { type: "walk", direction: "right",  },
          { type: "walk", direction: "up",  },
        ],
      },
      npcB: {
        type: "Person",
        x: utils.withGrid(8),
        y: utils.withGrid(5),
        template: "validator",
        talking: [
          {
            events: [
              { type: "textMessage", text: "Bahaha!", faceHero: "npcB" },
              { type: "addStoryFlag", flag: "TALKED_TO_ERIO"}
              //{ type: "battle", enemyId: "erio" }
            ]
          }
        ]
        // behaviorLoop: [
        //   { type: "walk",  direction: "left" },
        //   { type: "stand",  direction: "up", time: 800 },
        //   { type: "walk",  direction: "up" },
        //   { type: "walk",  direction: "right" },
        //   { type: "walk",  direction: "down" },
        // ]
      },
      hashimonStone: {
        type: "HashimonStone",
        x: utils.withGrid(2),
        y: utils.withGrid(7),
        storyFlag: "USED_HASHIMON_STONE",
        hashimons: ["v001", "f001"],
      },
    },
    walls: {
      [utils.asGridCoord(7,6)] : true,
      [utils.asGridCoord(8,6)] : true,
      [utils.asGridCoord(7,7)] : true,
      [utils.asGridCoord(8,7)] : true,
    },
    cutsceneSpaces: {
      [utils.asGridCoord(7,4)]: [
        {
          events: [
            { who: "npcB", type: "walk",  direction: "left" },
            { who: "npcB", type: "stand",  direction: "up", time: 500 },
            { type: "textMessage", text:"You can't be in there!"},
            { who: "npcB", type: "walk",  direction: "right" },
            { who: "hero", type: "walk",  direction: "down" },
            { who: "hero", type: "walk",  direction: "left" },
          ]
        }
      ],
      [utils.asGridCoord(5,10)]: [
        {
          events: [
            { 
              type: "changeMap", 
              map: "Kitchen",
              x: utils.withGrid(2),
              y: utils.withGrid(2), 
              direction: "down"
            }
          ]
        }
      ]
    }
  },

  Kitchen: {
    id: "Kitchen",
    lowerSrc: "/images/maps/KitchenLower.png",
    upperSrc: "/images/maps/KitchenUpper.png",
    configObjects: {
      hero: {
        type: "Person",
        isPlayerControlled: true,
        x: utils.withGrid(8),
        y: utils.withGrid(8),
      },
      kitchenNpcA: {
        type: "Person",
        x: utils.withGrid(9),
        y: utils.withGrid(5),
        direction: "up",
        talking: [
          {
            events: [
              { type: "textMessage", text: "Welcome to the Genesis Block. Press Escape anytime to open your menu and view My Collection.", faceHero: "kitchenNpcA" },
            ]
          }
        ]
      },
      kitchenNpcB: {
        type: "Person",
        x: utils.withGrid(3),
        y: utils.withGrid(6),
        talking: [
          {
            events: [
              { type: "textMessage", text: "Every validator here treats the chain like sacred code.", faceHero: "kitchenNpcB" },
            ]
          }
        ],
        behaviorLoop: [
          { type: "walk", direction: "right", },
          { type: "walk", direction: "right", },
          { type: "walk", direction: "down", },
          { type: "walk", direction: "down", },
          { type: "walk", direction: "left", },
          { type: "walk", direction: "left", },
          { type: "walk", direction: "up", },
          { type: "walk", direction: "up", },
          { type: "stand", direction: "up", time: 500 },
          { type: "stand", direction: "left", time: 500 },
        ]
      },
    },
    cutsceneSpaces: {
      [utils.asGridCoord(5,10)]: [
        {
          events: [
            { 
              type: "changeMap", 
              map: "DiningRoom",
              x: utils.withGrid(7),
              y: utils.withGrid(3),
              direction: "down"
            }
          ]
        }
      ],
      [utils.asGridCoord(10,6)]: [{
        events: [
          {
            type: "changeMap",
            map: "Street",
            x: utils.withGrid(5),
            y: utils.withGrid(10),
            direction: "down"
          },
        ]
      }]
    },
    walls: {
      [utils.asGridCoord(2,4)]: true,
      [utils.asGridCoord(3,4)]: true,
      [utils.asGridCoord(5,4)]: true,
      [utils.asGridCoord(6,4)]: true,
      [utils.asGridCoord(7,4)]: true,
      [utils.asGridCoord(8,4)]: true,
      [utils.asGridCoord(11,4)]: true,
      [utils.asGridCoord(11,5)]: true,
      [utils.asGridCoord(12,5)]: true,
      [utils.asGridCoord(1,5)]: true,
      [utils.asGridCoord(1,6)]: true,
      [utils.asGridCoord(1,7)]: true,
      [utils.asGridCoord(1,9)]: true,
      [utils.asGridCoord(2,9)]: true,
      [utils.asGridCoord(6,7)]: true,
      [utils.asGridCoord(7,7)]: true,
      [utils.asGridCoord(9,7)]: true,
      [utils.asGridCoord(10,7)]: true,
      [utils.asGridCoord(9,9)]: true,
      [utils.asGridCoord(10,9)]: true,
      [utils.asGridCoord(3,10)]: true,
      [utils.asGridCoord(4,10)]: true,
      [utils.asGridCoord(6,10)]: true,
      [utils.asGridCoord(7,10)]: true,
      [utils.asGridCoord(8,10)]: true,
      [utils.asGridCoord(11,10)]: true,
      [utils.asGridCoord(12,10)]: true,

      [utils.asGridCoord(0,8)]: true,
      [utils.asGridCoord(5,11)]: true,

      [utils.asGridCoord(4,3)]: true,
      [utils.asGridCoord(9,4)]: true,
      [utils.asGridCoord(10,4)]: true,

      [utils.asGridCoord(13,6)]: true,
      [utils.asGridCoord(13,7)]: true,
      [utils.asGridCoord(13,8)]: true,
      [utils.asGridCoord(13,9)]: true,

    }
  },

  Street: {
    id: "Street",
    lowerSrc: "/images/maps/StreetLower.png",
    upperSrc: "/images/maps/StreetUpper.png",
    configObjects: {
      hero: {
        type: "Person",
        isPlayerControlled: true,
        x: utils.withGrid(30),
        y: utils.withGrid(10),
      },
      streetNpcA: {
        type: "Person",
        x: utils.withGrid(9),
        y: utils.withGrid(11),
        behaviorLoop: [
          { type: "stand", direction: "right", time: 1400, },
          { type: "stand", direction: "up", time: 900, },
        ],
        talking: [
          {
            events: [
              { type: "textMessage", text: "Wild Hashimons hide in the grass east of here. Step on the tall patches to fight!", faceHero: "streetNpcA" },
            ]
          },
          {
            events: [
              { type: "textMessage", text: "One time i saw a 10 stars Hashimon. A wild one roams just east of here...", faceHero: "streetNpcA" },
            ]
          }
        ]
      },
      streetNpcB: {
        type: "Person",
        x: utils.withGrid(31),
        y: utils.withGrid(12),
        behaviorLoop: [
          { type: "stand", direction: "up", time: 400, },
          { type: "stand", direction: "left", time: 800, },
          { type: "stand", direction: "down", time: 400, },
          { type: "stand", direction: "left", time: 800, },
          { type: "stand", direction: "right", time: 800, },
        ],
        talking: [
          {
            events: [
              { type: "textMessage", text: "I can't decide which node rig to run.", faceHero: "streetNpcB" },
            ]
          }
        ]
      },
      streetNpcC: {
        type: "Person",
        x: utils.withGrid(22),
        y: utils.withGrid(10),
        talking: [
          {
            required: ["streetBattle"],
            events: [
              { type: "textMessage", text: "You are quite capable.", faceHero: "streetNpcC" },
            ]
          },
          {
            events: [
              { type: "textMessage", text: "You should have just stayed home!", faceHero: "streetNpcC" },
              { type: "battle", enemyId: "streetBattle" },
              { type: "addStoryFlag", flag: "streetBattle"},
            ]
          },
        ]
      },
    },
    walls: function() {
      let walls = {};
      ["4,9", "5,8", "6,9", "7,9", "8,9", "9,9", "10,9", "11,9", "12,9", "13,8", "14,8", "15,7",
        "16,7", "17,7", "18,7", "19,7", "20,7", "21,7", "22,7", "23,7", "24,7", "24,6", "24,5", "26,5", "26,6", "26,7", "27,7", "28,8", "28,9", "29,8", "30,9", "31,9", "32,9", "33,9",
        "16,9", "17,9", "25,9", "26,9", "16,10", "17,10", "25,10", "26,10", "16,11", "17,11", "25,11", "26,11",
        "18,11","19,11",
        "4,14", "5,14", "6,14", "7,14", "8,14", "9,14", "10,14", "11,14", "12,14", "13,14", "14,14", "15,14", "16,14", "17,14", "18,14", "19,14", "20,14", "21,14", "22,14", "23,14",
        "24,14", "25,14", "26,14", "27,14", "28,14", "29,14", "30,14", "31,14", "32,14", "33,14",
        "3,10", "3,11", "3,12", "3,13", "34,10", "34,11", "34,12", "34,13",
          "29,8","25,4",
      ].forEach(coord => {
        let [x,y] = coord.split(",");
        walls[utils.asGridCoord(x,y)] = true;
      })
      return walls;
    }(),
    cutsceneSpaces: {
      //Endless portal: steps the player into the infinite procedural maps.
      [utils.asGridCoord(33,10)]: [
        {
          events: [
            { type: "textMessage", text: "A Hashima gate hums with static. You step through..." },
            { type: "nextEndlessMap" },
          ]
        }
      ],
      //Wild encounter zone. Each step here rolls a Hashimon from Street's own
      //ecology (pixel / electric / metal), a unique individual every time.
      [utils.asGridCoord(13,10)]: [
        {
          events: [
            { type: "textMessage", text: "A wild Hashimon appeared!" },
            { type: "wildEncounter", zone: "street" },
          ]
        }
      ],
      [utils.asGridCoord(13,11)]: [
        {
          events: [
            { type: "textMessage", text: "A wild Hashimon appeared!" },
            { type: "wildEncounter", zone: "street" },
          ]
        }
      ],
      [utils.asGridCoord(5,9)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "DiningRoom",
              x: utils.withGrid(6),
              y: utils.withGrid(12),
              direction: "up"
            }
          ]
        }
      ],
      [utils.asGridCoord(29,9)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "Shop",
              x: utils.withGrid(5),
              y: utils.withGrid(12),
              direction: "up"
            }
          ]
        }
      ],
      [utils.asGridCoord(25,5)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "StreetNorth",
              x: utils.withGrid(7),
              y: utils.withGrid(16),
              direction: "up"
            }
          ]
        }
      ]
    }
  },

  Shop: {
    id: "Shop",
    lowerSrc: "/images/maps/PizzaShopLower.png",
    upperSrc: "/images/maps/PizzaShopUpper.png",
    configObjects: {
      hero: {
        type: "Person",
        isPlayerControlled: true,
        x: utils.withGrid(3),
        y: utils.withGrid(7),
      },
      shopNpcA: {
        type: "Person",
        x: utils.withGrid(6),
        y: utils.withGrid(5),
        talking: [
          {
            events: [
              { type: "textMessage", text: "All the validator rivalries have been good for business.", faceHero: "shopNpcA" },
            ]
          }
        ]
      },
      shopNpcB: {
        type: "Person",
        x: utils.withGrid(5),
        y: utils.withGrid(9),
        behaviorLoop: [
          { type: "stand", direction: "left", time: 400, },
        ],
        talking: [
          {
            events: [
              { type: "textMessage", text: "Which mining rig will make me a better node runner?", faceHero: "shopNpcB" },
            ]
          }
        ]
      },
      hashimonStone: {
        type: "HashimonStone",
        x: utils.withGrid(1),
        y: utils.withGrid(4),
        storyFlag: "STONE_SHOP",
        hashimons: ["v002", "f002"],
      },
    },
    cutsceneSpaces: {
      [utils.asGridCoord(5,12)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "Street",
              x: utils.withGrid(29),
              y: utils.withGrid(9),
              direction: "down"
            }
          ]
        }
      ],
    },
    walls: {
      [utils.asGridCoord(2,4)]: true,
      [utils.asGridCoord(2,5)]: true,
      [utils.asGridCoord(2,6)]: true,
      [utils.asGridCoord(3,6)]: true,
      [utils.asGridCoord(4,6)]: true,
      [utils.asGridCoord(5,6)]: true,
      [utils.asGridCoord(7,6)]: true,
      [utils.asGridCoord(8,6)]: true,
      [utils.asGridCoord(9,6)]: true,
      [utils.asGridCoord(9,5)]: true,
      [utils.asGridCoord(9,4)]: true,
      [utils.asGridCoord(3,8)]: true,
      [utils.asGridCoord(3,9)]: true,
      [utils.asGridCoord(3,10)]: true,
      [utils.asGridCoord(4,8)]: true,
      [utils.asGridCoord(4,9)]: true,
      [utils.asGridCoord(4,10)]: true,
      [utils.asGridCoord(7,8)]: true,
      [utils.asGridCoord(7,9)]: true,
      [utils.asGridCoord(8,8)]: true,
      [utils.asGridCoord(8,9)]: true,
      [utils.asGridCoord(1,12)]: true,
      [utils.asGridCoord(2,12)]: true,
      [utils.asGridCoord(3,12)]: true,
      [utils.asGridCoord(4,12)]: true,
      [utils.asGridCoord(6,12)]: true,
      [utils.asGridCoord(7,12)]: true,
      [utils.asGridCoord(8,12)]: true,
      [utils.asGridCoord(9,12)]: true,
      [utils.asGridCoord(10,12)]: true,
      [utils.asGridCoord(0,4)]: true,
      [utils.asGridCoord(0,5)]: true,
      [utils.asGridCoord(0,6)]: true,
      [utils.asGridCoord(0,7)]: true,
      [utils.asGridCoord(0,8)]: true,
      [utils.asGridCoord(0,9)]: true,
      [utils.asGridCoord(0,10)]: true,
      [utils.asGridCoord(0,11)]: true,
      [utils.asGridCoord(11,4)]: true,
      [utils.asGridCoord(11,5)]: true,
      [utils.asGridCoord(11,6)]: true,
      [utils.asGridCoord(11,7)]: true,
      [utils.asGridCoord(11,8)]: true,
      [utils.asGridCoord(11,9)]: true,
      [utils.asGridCoord(11,10)]: true,
      [utils.asGridCoord(11,11)]: true,

      [utils.asGridCoord(1,3)]: true,
      [utils.asGridCoord(2,3)]: true,
      [utils.asGridCoord(3,3)]: true,
      [utils.asGridCoord(4,3)]: true,
      [utils.asGridCoord(5,3)]: true,
      [utils.asGridCoord(6,3)]: true,
      [utils.asGridCoord(7,3)]: true,
      [utils.asGridCoord(8,3)]: true,
      [utils.asGridCoord(9,3)]: true,
      [utils.asGridCoord(10,3)]: true,

      [utils.asGridCoord(5,13)]: true,
    }
  },

  GreenKitchen: {
    id: "GreenKitchen",
    lowerSrc: "/images/maps/GreenKitchenLower.png",
    upperSrc: "/images/maps/GreenKitchenUpper.png",
    configObjects: {
      hero: {
        type: "Person",
        isPlayerControlled: true,
        x: utils.withGrid(3),
        y: utils.withGrid(8),
      },
      greenKitchenNpcA: {
        type: "Person",
        x: utils.withGrid(8),
        y: utils.withGrid(8),
        behaviorLoop: [
          { type: "stand", direction: "up", time: 400, },
          { type: "stand", direction: "left", time: 800, },
          { type: "stand", direction: "down", time: 400, },
          { type: "stand", direction: "left", time: 800, },
        ],
        talking: [
          {
            events: [
              { type: "textMessage", text: "Rootie runs the best validation protocol in the gardens.", faceHero: "greenKitchenNpcA" },
            ]
          }
        ]
      },
      greenKitchenNpcB: {
        type: "Person",
        x: utils.withGrid(1),
        y: utils.withGrid(8),
        behaviorLoop: [
          { type: "stand", direction: "up", time: 900, },
          { type: "walk", direction: "down"},
          { type: "walk", direction: "down"},
          { type: "stand", direction: "right", time: 800, },
          { type: "stand", direction: "down", time: 400, },
          { type: "stand", direction: "right", time: 800, },
          { type: "walk", direction: "up"},
          { type: "walk", direction: "up"},
          { type: "stand", direction: "up", time: 600, },
          { type: "stand", direction: "right", time: 900, },
        ],
        talking: [
          {
            events: [
              { type: "textMessage", text: "Finally... a Hashimon lab that speaks my language!", faceHero: "greenKitchenNpcB" },
            ]
          }
        ]
      },
      greenKitchenNpcC: {
        type: "Person",
        x: utils.withGrid(3),
        y: utils.withGrid(5),
        template: "boss",
        talking: [
          {
            required: ["chefRootie"],
            events: [ {type: "textMessage", faceHero:["greenKitchenNpcC"], text: "My data seeds need more growth cycles."} ]
          },
          {
            events: [
              { type: "textMessage", text: "Organic data is the fuel for the heart and soul!", faceHero: "greenKitchenNpcC" },
              { type: "battle", enemyId: "chefRootie", arena: "mempool-gardens" },
              { type: "addStoryFlag", flag: "chefRootie"},
            ]
          }
        ]
      },
    },
    cutsceneSpaces: {
      [utils.asGridCoord(5,12)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "StreetNorth",
              x: utils.withGrid(7),
              y: utils.withGrid(5),
              direction: "down"
            }
          ]
        }
      ],
    },
    walls: {
      [utils.asGridCoord(1,4)]: true,
      [utils.asGridCoord(3,4)]: true,
      [utils.asGridCoord(4,4)]: true,
      [utils.asGridCoord(6,4)]: true,
      [utils.asGridCoord(7,4)]: true,
      [utils.asGridCoord(8,5)]: true,
      [utils.asGridCoord(9,4)]: true,
      [utils.asGridCoord(1,6)]: true,
      [utils.asGridCoord(2,6)]: true,
      [utils.asGridCoord(3,6)]: true,
      [utils.asGridCoord(4,6)]: true,
      [utils.asGridCoord(5,6)]: true,
      [utils.asGridCoord(6,6)]: true,
      [utils.asGridCoord(3,7)]: true,
      [utils.asGridCoord(4,7)]: true,
      [utils.asGridCoord(6,7)]: true,
      [utils.asGridCoord(2,9)]: true,
      [utils.asGridCoord(3,9)]: true,
      [utils.asGridCoord(4,9)]: true,
      [utils.asGridCoord(7,10)]: true,
      [utils.asGridCoord(8,10)]: true,
      [utils.asGridCoord(9,10)]: true,
      [utils.asGridCoord(1,12)]: true,
      [utils.asGridCoord(2,12)]: true,
      [utils.asGridCoord(3,12)]: true,
      [utils.asGridCoord(4,12)]: true,
      [utils.asGridCoord(6,12)]: true,
      [utils.asGridCoord(7,12)]: true,
      [utils.asGridCoord(8,12)]: true,
      [utils.asGridCoord(9,12)]: true,
      [utils.asGridCoord(0,5)]: true,
      [utils.asGridCoord(0,6)]: true,
      [utils.asGridCoord(0,7)]: true,
      [utils.asGridCoord(0,8)]: true,
      [utils.asGridCoord(0,9)]: true,
      [utils.asGridCoord(0,10)]: true,
      [utils.asGridCoord(0,11)]: true,
      [utils.asGridCoord(10,5)]: true,
      [utils.asGridCoord(10,6)]: true,
      [utils.asGridCoord(10,7)]: true,
      [utils.asGridCoord(10,8)]: true,
      [utils.asGridCoord(10,9)]: true,
      [utils.asGridCoord(10,10)]: true,
      [utils.asGridCoord(10,11)]: true,
      [utils.asGridCoord(5,13)]: true,
    }
  },

  StreetNorth: {
    id: "StreetNorth",
    lowerSrc: "/images/maps/StreetNorthLower.png",
    upperSrc: "/images/maps/StreetNorthUpper.png",
    configObjects: {
      hero: {
        type: "Person",
        isPlayerControlled: true,
        x: utils.withGrid(3),
        y: utils.withGrid(8),
      },
      streetNorthNpcA: {
        type: "Person",
        x: utils.withGrid(9),
        y: utils.withGrid(6),
        behaviorLoop: [
          { type: "walk", direction: "left", },
          { type: "walk", direction: "down", },
          { type: "walk", direction: "right", },
          { type: "stand", direction: "right", time: 800, },
          { type: "walk", direction: "up", },
          { type: "stand", direction: "up", time: 400, },
        ],
        talking: [
          {
            events: [
              { type: "textMessage", text: "This place is famous for block branch Hashimons!", faceHero: "streetNorthNpcA" },
            ]
          }
        ]
      },
      streetNorthNpcB: {
        type: "Person",
        x: utils.withGrid(4),
        y: utils.withGrid(12),
        behaviorLoop: [
          { type: "stand", direction: "up", time: 400, },
          { type: "stand", direction: "left", time: 800, },
          { type: "stand", direction: "down", time: 400, },
          { type: "stand", direction: "left", time: 800, },
          { type: "stand", direction: "right", time: 800, },
        ],
        talking: [
          {
            events: [
              { type: "textMessage", text: "I love the fresh hum of relay towers in the air.", faceHero: "streetNorthNpcB" },
            ]
          }
        ]
      },
      streetNorthNpcC: {
        type: "Person",
        x: utils.withGrid(12),
        y: utils.withGrid(9),
        talking: [
          {
            required: ["streetNorthBattle"],
            events: [
              { type: "textMessage", text: "Could you be the Legendary one?", faceHero: "streetNorthNpcC" },
            ]
          },
          {
            events: [
              { type: "textMessage", text: "This is my turf!", faceHero: "streetNorthNpcC" },
              { type: "battle", enemyId: "streetNorthBattle" },
              { type: "addStoryFlag", flag: "streetNorthBattle"},
            ]
          },
        ]
      },
      hashimonStone: {
        type: "HashimonStone",
        x: utils.withGrid(2),
        y: utils.withGrid(9),
        storyFlag: "STONE_STREET_NORTH",
        hashimons: ["v001", "f001"],
      },
    },
    walls: {
      [utils.asGridCoord(2,7)]: true,
      [utils.asGridCoord(3,7)]: true,
      [utils.asGridCoord(3,6)]: true,
      [utils.asGridCoord(4,5)]: true,
      [utils.asGridCoord(5,5)]: true,
      [utils.asGridCoord(6,5)]: true,
      [utils.asGridCoord(8,5)]: true,
      [utils.asGridCoord(9,5)]: true,
      [utils.asGridCoord(10,5)]: true,
      [utils.asGridCoord(11,6)]: true,
      [utils.asGridCoord(12,6)]: true,
      [utils.asGridCoord(13,6)]: true,
      [utils.asGridCoord(7,8)]: true,
      [utils.asGridCoord(8,8)]: true,
      [utils.asGridCoord(7,9)]: true,
      [utils.asGridCoord(8,9)]: true,
      [utils.asGridCoord(7,10)]: true,
      [utils.asGridCoord(8,10)]: true,
      [utils.asGridCoord(9,10)]: true,
      [utils.asGridCoord(10,10)]: true,
      [utils.asGridCoord(2,15)]: true,
      [utils.asGridCoord(3,15)]: true,
      [utils.asGridCoord(4,15)]: true,
      [utils.asGridCoord(5,15)]: true,
      [utils.asGridCoord(6,15)]: true,
      [utils.asGridCoord(6,16)]: true,
      [utils.asGridCoord(8,16)]: true,
      [utils.asGridCoord(8,15,)]: true,
      [utils.asGridCoord(9,15)]: true,
      [utils.asGridCoord(10,15)]: true,
      [utils.asGridCoord(11,15)]: true,
      [utils.asGridCoord(12,15)]: true,
      [utils.asGridCoord(13,15)]: true,

      [utils.asGridCoord(1,8)]: true,
      [utils.asGridCoord(1,9)]: true,
      [utils.asGridCoord(1,10)]: true,
      [utils.asGridCoord(1,11)]: true,
      [utils.asGridCoord(1,12)]: true,
      [utils.asGridCoord(1,13)]: true,
      [utils.asGridCoord(1,14)]: true,

      [utils.asGridCoord(14,7)]: true,
      [utils.asGridCoord(14,8)]: true,
      [utils.asGridCoord(14,9)]: true,
      [utils.asGridCoord(14,10)]: true,
      [utils.asGridCoord(14,11)]: true,
      [utils.asGridCoord(14,12)]: true,
      [utils.asGridCoord(14,13)]: true,
      [utils.asGridCoord(14,14)]: true,

      [utils.asGridCoord(7,17)]: true,
      [utils.asGridCoord(7,4)]: true,
    },
    cutsceneSpaces: {
      [utils.asGridCoord(7,5)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "GreenKitchen",
              x: utils.withGrid(5),
              y: utils.withGrid(12),
              direction: "up"
            }
          ]
        }
      ],
      [utils.asGridCoord(7,16)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "Street",
              x: utils.withGrid(25),
              y: utils.withGrid(5),
              direction: "down"
            }
          ]
        }
      ],
    }
  },

  DiningRoom: {
    id: "DiningRoom",
    lowerSrc: "/images/maps/DiningRoomLower.png",
    upperSrc: "/images/maps/DiningRoomUpper.png",
    configObjects: {
      hero: {
        type: "Person",
        isPlayerControlled: true,
        x: utils.withGrid(5),
        y: utils.withGrid(8),
      },
      diningRoomNpcA: {
        type: "Person",
        x: utils.withGrid(12),
        y: utils.withGrid(8),
        talking: [
          {
            required: ["diningRoomBattle"],
            events: [
              { type: "textMessage", text: "Maybe I am not ready for this place.", faceHero: "diningRoomNpcA" },
            ]
          },
          {
            events: [
              { type: "textMessage", text: "You think you have what it takes to access the vault?!", faceHero: "diningRoomNpcA" },
              { type: "battle", enemyId: "diningRoomBattle", arena: "archive-vault" },
              { type: "addStoryFlag", flag: "diningRoomBattle"},
            ]
          },
        ]
      },
      diningRoomNpcB: {
        type: "Person",
        x: utils.withGrid(9),
        y: utils.withGrid(5),
        talking: [
          {
            events: [
              { type: "textMessage", text: "Explorers come from all over to archive their Hashimons here.", faceHero: "diningRoomNpcB" },
            ]
          },
        ]
      },
      diningRoomNpcC: {
        type: "Person",
        x: utils.withGrid(2),
        y: utils.withGrid(8),
        behaviorLoop: [
          { type: "stand", direction: "right", time: 800, },
          { type: "stand", direction: "down", time: 700, },
          { type: "stand", direction: "right", time: 800, },
        ],
        talking: [
          {
            events: [
              { type: "textMessage", text: "I was so lucky to score a vault slot!", faceHero: "diningRoomNpcC" },
            ]
          },
        ]
      },
      diningRoomNpcD: {
        type: "Person",
        x: utils.withGrid(8),
        y: utils.withGrid(9),
        behaviorLoop: [
          { type: "stand", direction: "right", time: 1200, },
          { type: "stand", direction: "down", time: 900, },
          { type: "stand", direction: "left", time: 800, },
          { type: "stand", direction: "down", time: 700, },
          { type: "stand", direction: "right", time: 400, },
          { type: "stand", direction: "up", time: 800, },
        ],
        talking: [
          {
            events: [
              { type: "textMessage", text: "I've been dreaming of this Hashimon for weeks!", faceHero: "diningRoomNpcD" },
            ]
          },
        ]
      },
    },
    cutsceneSpaces: {
      [utils.asGridCoord(7,3)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "Kitchen",
              x: utils.withGrid(5),
              y: utils.withGrid(10),
              direction: "up"
            }
          ]
        }
      ],
      [utils.asGridCoord(6,12)]: [
        {
          events: [
            {
              type: "changeMap",
              map: "Street",
              x: utils.withGrid(5),
              y: utils.withGrid(9),
              direction: "down"
            }
          ]
        }
      ],
    },
    walls: {
      [utils.asGridCoord(6,3)]: true,
      [utils.asGridCoord(7,2)]: true,
      [utils.asGridCoord(6,13)]: true,
      [utils.asGridCoord(1,5)]: true,
      [utils.asGridCoord(2,5)]: true,
      [utils.asGridCoord(3,5)]: true,
      [utils.asGridCoord(4,5)]: true,
      [utils.asGridCoord(4,4)]: true,
      [utils.asGridCoord(5,3)]: true,
      [utils.asGridCoord(6,4)]: true,
      [utils.asGridCoord(6,5)]: true,
      [utils.asGridCoord(8,3)]: true,
      [utils.asGridCoord(9,4)]: true,
      [utils.asGridCoord(10,5)]: true,
      [utils.asGridCoord(11,5)]: true,
      [utils.asGridCoord(12,5)]: true,
      [utils.asGridCoord(11,7)]: true,
      [utils.asGridCoord(12,7)]: true,
      [utils.asGridCoord(2,7)]: true,
      [utils.asGridCoord(3,7)]: true,
      [utils.asGridCoord(4,7)]: true,
      [utils.asGridCoord(7,7)]: true,
      [utils.asGridCoord(8,7)]: true,
      [utils.asGridCoord(9,7)]: true,
      [utils.asGridCoord(2,10)]: true,
      [utils.asGridCoord(3,10)]: true,
      [utils.asGridCoord(4,10)]: true,
      [utils.asGridCoord(7,10)]: true,
      [utils.asGridCoord(8,10)]: true,
      [utils.asGridCoord(9,10)]: true,
      [utils.asGridCoord(1,12)]: true,
      [utils.asGridCoord(2,12)]: true,
      [utils.asGridCoord(3,12)]: true,
      [utils.asGridCoord(4,12)]: true,
      [utils.asGridCoord(5,12)]: true,
      [utils.asGridCoord(7,12)]: true,
      [utils.asGridCoord(8,12)]: true,
      [utils.asGridCoord(9,12)]: true,
      [utils.asGridCoord(10,12)]: true,
      [utils.asGridCoord(11,12)]: true,
      [utils.asGridCoord(12,12)]: true,
      [utils.asGridCoord(0,4)]: true,
      [utils.asGridCoord(0,5)]: true,
      [utils.asGridCoord(0,6)]: true,
      [utils.asGridCoord(0,8)]: true,
      [utils.asGridCoord(0,9)]: true,
      [utils.asGridCoord(0,10)]: true,
      [utils.asGridCoord(0,11)]: true,
      [utils.asGridCoord(13,4)]: true,
      [utils.asGridCoord(13,5)]: true,
      [utils.asGridCoord(13,6)]: true,
      [utils.asGridCoord(13,8)]: true,
      [utils.asGridCoord(13,9)]: true,
      [utils.asGridCoord(13,10)]: true,
      [utils.asGridCoord(13,11)]: true,
    }
  },
  
}