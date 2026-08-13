class Progress {
  constructor() {
    this.mapId = "Kitchen";
    this.startingHeroX = 0;
    this.startingHeroY = 0;
    this.startingHeroDirection = "down";
    this.saveFileKey = "Hashimon_SaveFile1";
  }

  //Only the world position lives here; the roster owns its own storage so that
  //captures and mined shares persist without an explicit Save.
  save() {
    window.localStorage.setItem(this.saveFileKey, JSON.stringify({
      mapId: this.mapId,
      startingHeroX: this.startingHeroX,
      startingHeroY: this.startingHeroY,
      startingHeroDirection: this.startingHeroDirection,
    }))
    playerState.save();
  }

  getSaveFile() {

    if (!window.localStorage) {
      return null;
    }

    const file = window.localStorage.getItem(this.saveFileKey);
    return file ? JSON.parse(file) : null
  }

  //Roster autosaves independently of map position. Continue should still
  //appear if you captured Hashimons but never hit Pause → Save.
  hasRosterSave() {
    if (!window.localStorage) {
      return false;
    }
    try {
      const file = window.localStorage.getItem("Hashimon_PlayerState");
      if (!file) { return false; }
      const data = JSON.parse(file);
      return Object.keys(data.hashimons || {}).length > 0;
    } catch {
      return false;
    }
  }

  canContinue() {
    return !!(this.getSaveFile() || this.hasRosterSave());
  }

  load() {
    const file = this.getSaveFile();
    if (file) {
      this.mapId = file.mapId;
      this.startingHeroX = file.startingHeroX;
      this.startingHeroY = file.startingHeroY;
      this.startingHeroDirection = file.startingHeroDirection;
    }
  }

}
