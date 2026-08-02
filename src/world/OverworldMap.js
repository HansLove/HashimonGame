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

if (window.MapLoader && window.__OVERWORLD_MAPS_DATA__) {
  MapLoader.registerOverworldMaps(window.__OVERWORLD_MAPS_DATA__);
} else {
  window.OverworldMaps = window.OverworldMaps || {};
}
