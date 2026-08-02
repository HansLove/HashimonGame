class OverworldEvent {
  constructor({ map, event}) {
    this.map = map;
    this.event = event;
  }

  stand(resolve) {
    const who = this.map.gameObjects[ this.event.who ];
    who.startBehavior({
      map: this.map
    }, {
      type: "stand",
      direction: this.event.direction,
      time: this.event.time
    })
    
    //Set up a handler to complete when correct person is done walking, then resolve the event
    const completeHandler = e => {
      if (e.detail.whoId === this.event.who) {
        document.removeEventListener("PersonStandComplete", completeHandler);
        resolve();
      }
    }
    document.addEventListener("PersonStandComplete", completeHandler)
  }

  walk(resolve) {
    const who = this.map.gameObjects[ this.event.who ];
    who.startBehavior({
      map: this.map
    }, {
      type: "walk",
      direction: this.event.direction,
      retry: true
    })

    //Set up a handler to complete when correct person is done walking, then resolve the event
    const completeHandler = e => {
      if (e.detail.whoId === this.event.who) {
        document.removeEventListener("PersonWalkingComplete", completeHandler);
        resolve();
      }
    }
    document.addEventListener("PersonWalkingComplete", completeHandler)

  }

  textMessage(resolve) {

    if (this.event.faceHero) {
      const obj = this.map.gameObjects[this.event.faceHero];
      obj.direction = utils.oppositeDirection(this.map.gameObjects["hero"].direction);
    }

    const message = new TextMessage({
      text: this.event.text,
      onComplete: () => resolve()
    })
    message.init( document.querySelector(".game-container") )
  }

  //Generates the next endless map and walks the player into it. Entry (from the
  //portal) omits a seed and starts a fresh run; each exit passes seed+1, so the
  //chain is deterministic and never ends.
  nextEndlessMap(resolve) {
    const seed = this.event.seed != null
      ? this.event.seed
      : 1 + Math.floor(Math.random() * 1e9);

    Object.values(this.map.gameObjects).forEach(obj => { obj.isMounted = false; });

    const config = MapGenerator.generate(seed);
    const sceneTransition = new SceneTransition();
    sceneTransition.init(document.querySelector(".game-container"), () => {
      this.map.overworld.startMap(config, {
        x: config.entrance.x,
        y: config.entrance.y,
        direction: "up",
      });
      resolve();
      sceneTransition.fadeOut();
    })
  }

  changeMap(resolve) {
    //Deactivate old objects
    Object.values(this.map.gameObjects).forEach(obj => {
      obj.isMounted = false;
    })

    const sceneTransition = new SceneTransition();
    sceneTransition.init(document.querySelector(".game-container"), () => {
      this.map.overworld.startMap( window.OverworldMaps[this.event.map], {
        x: this.event.x,
        y: this.event.y,
        direction: this.event.direction,
      });
      resolve();
      sceneTransition.fadeOut();
    })
  }

  battle(resolve) {
    const battle = new Battle({
      enemy: Enemies[this.event.enemyId],
      arena: this.event.arena || null,
      onComplete: (didWin) => {
        resolve(didWin ? "WON_BATTLE" : "LOST_BATTLE");
      }
    })
    battle.init(document.querySelector(".game-container"));

  }

  //A wild encounter rolls a Hashimon from the zone's ecology and fights that
  //exact individual, which is the one the player may then capture.
  wildEncounter(resolve) {
    const roll = HashimonEncounters.rollWild(this.event.zone);
    const battle = new Battle({
      enemy: HashimonEncounters.toWildEnemy(roll),
      arena: this.event.arena || null,
      onComplete: (didWin) => {
        resolve(didWin ? "WON_BATTLE" : "LOST_BATTLE");
      }
    })
    battle.init(document.querySelector(".game-container"));
  }

  pause(resolve) {
    this.map.isPaused = true;
    const menu = new PauseMenu({
      progress: this.map.overworld.progress,
      onComplete: () => {
        resolve();
        this.map.isPaused = false;
        this.map.overworld.startGameLoop();
      }
    });
    menu.init(document.querySelector(".game-container"));
  }

  addStoryFlag(resolve) {
    window.playerState.storyFlags[this.event.flag] = true;
    window.questManager?.advanceIfComplete(this.event.flag);
    window.playerState.save();
    resolve();
  }

  async playQuestCutscene(resolve) {
    const fn = window.Quests.cutscenes[this.event.cutsceneKey];
    const events = typeof fn === "function" ? fn() : fn;
    for (let i = 0; i < events.length; i++) {
      const eventHandler = new OverworldEvent({ event: events[i], map: this.map });
      await eventHandler.init();
    }
    resolve();
  }

  startQuest(resolve) {
    window.questManager.startQuest(this.event.questId);
    resolve();
  }

  craftingMenu(resolve) {
    const menu = new CraftingMenu({
      hashimons: this.event.hashimons,
      onComplete: () => {
        resolve();
      }
    })
    menu.init(document.querySelector(".game-container"))
  }

  init() {
    return new Promise(resolve => {
      this[this.event.type](resolve)      
    })
  }

}