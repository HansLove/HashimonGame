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
    SaveManager.writeProgress(this, window.playerState);
  }

  getSaveFile() {
    const data = SaveManager.load();
    return data?.progress || null;
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
