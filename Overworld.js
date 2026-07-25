class Overworld {
 constructor(config) {
   this.element = config.element;
   this.canvas = this.element.querySelector(".game-canvas");
   this.ctx = this.canvas.getContext("2d");
   this.map = null;
 }

  startGameLoop() {
    const step = () => {
      //Clear off the canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      //Establish the camera person
      const cameraPerson = this.map.gameObjects.hero;

      //Update all objects
      Object.values(this.map.gameObjects).forEach(object => {
        object.update({
          arrow: this.directionInput.direction,
          map: this.map,
        })
      })

      //Draw Lower layer
      this.map.drawLowerImage(this.ctx, cameraPerson);

      //Draw Game Objects
      Object.values(this.map.gameObjects).sort((a,b) => {
        return a.y - b.y;
      }).forEach(object => {
        object.sprite.draw(this.ctx, cameraPerson);
      })

      //Draw Upper layer
      this.map.drawUpperImage(this.ctx, cameraPerson);
      
      if (!this.map.isPaused) {
        requestAnimationFrame(() => {
          step();   
        })
      }
    }
    step();
 }

 bindActionInput() {
   new KeyPressListener("Enter", () => {
     //Is there a person here to talk to?
     this.map.checkForActionCutscene()
   })
   new KeyPressListener("Escape", () => {
     if (!this.map.isCutscenePlaying) {
      this.map.startCutscene([
        { type: "pause" }
      ])
     }
   })
 }

 bindHeroPositionCheck() {
   document.addEventListener("PersonWalkingComplete", e => {
     if (e.detail.whoId === "hero") {
       //Hero's position has changed
       this.map.checkForFootstepCutscene()
     }
   })
 }

 startMap(mapConfig, heroInitialState=null) {
  this.map = new OverworldMap(mapConfig);
  this.map.overworld = this;
  this.map.mountObjects();

  if (heroInitialState) {
    const {hero} = this.map.gameObjects;
    hero.x = heroInitialState.x;
    hero.y = heroInitialState.y;
    hero.direction = heroInitialState.direction;
  }

  this.progress.mapId = mapConfig.id;
  this.progress.startingHeroX = this.map.gameObjects.hero.x;
  this.progress.startingHeroY = this.map.gameObjects.hero.y;
  this.progress.startingHeroDirection = this.map.gameObjects.hero.direction;

  this.mapLabel?.show(
    window.questManager.getMapLabel(mapConfig.id),
    document.querySelector(".game-container")
  );

  this.scheduleMapOnboarding(mapConfig.id);
 }

 scheduleMapOnboarding(mapId) {
  const events = window.questManager.getMapOnboarding(mapId);
  if (!events?.length) {
    return;
  }

  const run = () => {
    if (this.map.isCutscenePlaying) {
      requestAnimationFrame(run);
      return;
    }
    this.map.startCutscene(events);
  };
  run();
 }

 async init() {

  const container = document.querySelector(".game-container");

  //Create a new Progress tracker
  this.progress = new Progress();

  //Show the title screen
  this.titleScreen = new TitleScreen({
    progress: this.progress
  })
  const useSaveFile = await this.titleScreen.init(container);

  //Potentially load saved data
  let initialHeroState = null;
  if (useSaveFile) {
    this.progress.load();
    //A save made inside an endless run points at a generated map id that no
    //longer exists on reload; fall back to the start map rather than crash.
    if (!window.OverworldMaps[this.progress.mapId]) {
      this.progress.mapId = "Kitchen";
    } else {
      initialHeroState = {
        x: this.progress.startingHeroX,
        y: this.progress.startingHeroY,
        direction: this.progress.startingHeroDirection,
      }
    }
  } else {
    window.playerState.reset();
  }

  window.questManager.syncCompletedSteps();
  utils.emitEvent("QuestUpdated");

  //Load the HUD
  this.hud = new Hud();
  this.hud.init(container);

  this.objectiveHud = new ObjectiveHud();
  this.objectiveHud.init(container);

  this.mapLabel = new MapLabel();

  //Start the first map
  this.startMap(window.OverworldMaps[this.progress.mapId], initialHeroState );

  //Create controls
  this.bindActionInput();
  this.bindHeroPositionCheck();

  this.directionInput = new DirectionInput();
  this.directionInput.init();

  //Kick off the game!
  this.startGameLoop();


  // this.map.startCutscene([
  //   { type: "battle", enemyId: "beth" }
  //   // { type: "changeMap", map: "DemoRoom"}
  //   // { type: "textMessage", text: "This is the very first message!"}
  // ])

 }
}