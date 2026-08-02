//Deserializes map JSON (grid markers) into runtime configs for OverworldMap.
window.MapLoader = {
  deserializeValue(v) {
    if (v && typeof v === "object" && v.__grid != null) {
      return utils.withGrid(v.__grid);
    }
    if (Array.isArray(v)) {
      return v.map(item => this.deserializeValue(item));
    }
    if (v && typeof v === "object") {
      const out = {};
      for (const [k, val] of Object.entries(v)) {
        out[k] = this.deserializeValue(val);
      }
      return out;
    }
    return v;
  },

  loadMapsFromData(rawMaps) {
    const maps = {};
    for (const [id, config] of Object.entries(rawMaps || {})) {
      maps[id] = this.deserializeValue(config);
    }
    return maps;
  },

  registerOverworldMaps(rawMaps) {
    window.OverworldMaps = this.loadMapsFromData(rawMaps);
    return window.OverworldMaps;
  },
};
