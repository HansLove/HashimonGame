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
      const drawOffset = this.map.getDrawOffset(cameraPerson);

      //Update all objects
      Object.values(this.map.gameObjects).forEach(object => {
        object.update({
          arrow: this.directionInput.direction,
          map: this.map,
        })
      })

      //Draw Lower layer
      this.map.drawLowerImage(this.ctx, cameraPerson, drawOffset);

      //Draw Game Objects
      Object.values(this.map.gameObjects).sort((a,b) => {
        return a.y - b.y;
      }).forEach(object => {
        object.sprite.draw(this.ctx, cameraPerson, drawOffset);
      })

      //Draw Upper layer
      this.map.drawUpperImage(this.ctx, cameraPerson, drawOffset);
      
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
     if (this.map.isPaused) { return; }
     this.openPauseMenu();
   })
 }

 openPauseMenu() {
   this.map.isPaused = true;
   const menu = new PauseMenu({
     progress: this.progress,
     onComplete: () => {
       this.map.isPaused = false;
       this.startGameLoop();
     }
   });
   menu.init(document.querySelector(".game-container"));
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
  if (mapConfig.isEndless) {
    window.OverworldMaps[mapConfig.id] = mapConfig;
  }

  this.map = new OverworldMap(mapConfig);
  this.map.overworld = this;
  this.map.mountObjects();

  if (heroInitialState) {
    const {hero} = this.map.gameObjects;
    hero.x = heroInitialState.x;
    hero.y = heroInitialState.y;
    hero.direction = heroInitialState.direction;
    //Old saves spawned on the Kitchen exit tile; move to a safe spot.
    if (mapConfig.id === "Kitchen") {
      const oldSpawn = `${utils.withGrid(10)},${utils.withGrid(5)}`;
      const exitTile = utils.asGridCoord(10, 6);
      const pos = `${hero.x},${hero.y}`;
      if (pos === oldSpawn || pos === exitTile) {
        hero.x = utils.withGrid(8);
        hero.y = utils.withGrid(8);
      }
    }
  }

  this.progress.mapId = mapConfig.id;
  this.progress.startingHeroX = this.map.gameObjects.hero.x;
  this.progress.startingHeroY = this.map.gameObjects.hero.y;
  this.progress.startingHeroDirection = this.map.gameObjects.hero.direction;

  this.mapLabel?.show(
    mapConfig.biomeName || window.questManager.getMapLabel(mapConfig.id),
    document.querySelector(".game-container")
  );
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
      const endlessMatch = /^endless_(\d+)$/.exec(this.progress.mapId);
      if (endlessMatch) {
        window.OverworldMaps[this.progress.mapId] = MapGenerator.generate(Number(endlessMatch[1]));
      } else {
        this.progress.mapId = "Kitchen";
      }
    }
    if (window.OverworldMaps[this.progress.mapId]) {
      initialHeroState = {
        x: this.progress.startingHeroX,
        y: this.progress.startingHeroY,
        direction: this.progress.startingHeroDirection,
      }
    }
  } else {
    await window.playerState.reset();
    const speciesKey = await GenesisOnboarding.init(container);
    await window.playerState.bootstrapServer({ speciesKey });
    window.playerState.storyFlags.showGiveLifeHint = true;
    window.playerState.save();
  }

  if (useSaveFile) {
    await window.playerState.bootstrapServer();
  }

  if (window.PersonGenerator) {
    await PersonGenerator.preload();
  }

  window.questManager.syncCompletedSteps();
  utils.emitEvent("QuestUpdated");

  //Load the HUD
  this.hud = new Hud();
  this.hud.init(container);

  if (window.playerState.storyFlags.showGiveLifeHint) {
    GenesisOnboarding.showGiveLifeHint(container);
    delete window.playerState.storyFlags.showGiveLifeHint;
    window.playerState.save();
  }

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