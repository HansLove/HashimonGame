//Type taxonomy loader — data lives in data/types/*.json (bundled as hashimonTypes.data.js).
(function () {
  const data = window.__HASHIMON_TYPES_DATA__;
  if (!data) {
    throw new Error("Load src/content/hashimonTypes.data.js before hashimonTypes.js (run: npm run build:data)");
  }

  window.HashimonPrimaryKeys = data.primaryKeys;
  window.HashimonTypes = data.types;
  window.HashimonFusionMap = data.fusionMap;

  window.HashimonFusions = Object.entries(HashimonFusionMap).map(([key, def]) => ({
    parents: key.split("|"),
    name: def.name,
  }));

  window.HashimonTypeUtils = {
    fusionKey(a, b) {
      return [a, b].sort().join("|");
    },

    resolveFusion(primary, secondary) {
      if (!primary || !secondary) { return null; }
      return HashimonFusionMap[this.fusionKey(primary, secondary)] || null;
    },

    normalizeTypeKey(key) {
      if (!key) { return null; }
      if (key === "vegetal") { return "tierra"; }
      if (key === "robot") { return "metal"; }
      if (key === "plasma") { return "fuego"; }
      return HashimonTypes[key] ? key : null;
    },

    isPrimaryKey(key) {
      return HashimonPrimaryKeys.includes(this.normalizeTypeKey(key));
    },

    typeDef(key) {
      const normalized = this.normalizeTypeKey(key);
      return normalized ? HashimonTypes[normalized] : null;
    },

    subtypeFlavor(typeKey, subtype) {
      const def = this.typeDef(typeKey);
      if (!def) { return null; }
      if (subtype === "Pure") {
        return `Classic ${def.name} expression — elemental and unmistakable.`;
      }
      return `${subtype} variant of ${def.name} — a distinct elemental flavor.`;
    },
  };
})();
