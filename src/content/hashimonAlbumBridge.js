//Shared IndexedDB bridge: game + album on the same origin share art blobs and a live manifest.
window.HashimonAlbumBridge = (function () {
  const DB_NAME = "hashimon-album-v1";
  const STORE_ART = "art";
  const STORE_META = "meta";
  const META_KEY = "manifest";

  let dbPromise = null;
  const urlCache = new Map();

  function openDB() {
    if (dbPromise) { return dbPromise; }
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 2);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_ART)) {
          db.createObjectStore(STORE_ART);
        }
        if (!db.objectStoreNames.contains(STORE_META)) {
          db.createObjectStore(STORE_META);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  function idbGet(store, key) {
    return openDB().then(db => new Promise((resolve, reject) => {
      const tx = db.transaction(store, "readonly");
      const req = tx.objectStore(store).get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    }));
  }

  function idbPut(store, key, value) {
    return openDB().then(db => new Promise((resolve, reject) => {
      const tx = db.transaction(store, "readwrite");
      tx.objectStore(store).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    }));
  }

  function idbDelete(store, key) {
    return openDB().then(db => new Promise((resolve, reject) => {
      const tx = db.transaction(store, "readwrite");
      tx.objectStore(store).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    }));
  }

  function readPlayerHashimons() {
    try {
      const raw = localStorage.getItem("Hashimon_PlayerState");
      if (!raw) { return null; }
      const state = JSON.parse(raw);
      return state?.hashimons || null;
    } catch (e) {
      return null;
    }
  }

  function buildManifestFromSave() {
    const hashimons = readPlayerHashimons();
    if (!hashimons || !window.HashimonAlbum) { return null; }
    try {
      return HashimonAlbum.buildManifest(hashimons);
    } catch (e) {
      console.warn("HashimonAlbumBridge: could not build manifest from save", e);
      return null;
    }
  }

  function tierFromSave(hashimon) {
    if (window.HashimonSystem?.tierOf) {
      return HashimonSystem.tierOf(hashimon);
    }
    return hashimon.stage || 0;
  }

  function patchCreaturesFromSave(creatures) {
    const hashimons = readPlayerHashimons();
    if (!hashimons || !creatures?.length) { return creatures; }

    return creatures.map(creature => {
      const live = hashimons[creature.id];
      if (!live) { return creature; }

      return {
        ...creature,
        name: live.name,
        speciesLabel: live.speciesLabel || creature.speciesLabel,
        currentStars: tierFromSave(live),
        stats: {
          hp: live.hp,
          maxHp: live.maxHp,
          power: live.stats?.power,
          defense: live.stats?.defense,
          bestShareBits: live.pow?.bestShareBits,
          evolutionProgress: live.evolution?.progress,
        },
      };
    });
  }

  function revokeUrl(artFile) {
    const url = urlCache.get(artFile);
    if (url) {
      URL.revokeObjectURL(url);
      urlCache.delete(artFile);
    }
  }

  function slotsForCreature(creature) {
    return creature?.slots || [];
  }

  return {
    async syncFromGame() {
      const manifest = buildManifestFromSave();
      if (!manifest) { return { ok: false, reason: "no-save" }; }

      await idbPut(STORE_META, META_KEY, {
        manifest,
        syncedAt: new Date().toISOString(),
        exportId: manifest.exportedAt,
      });

      return { ok: true, creatureCount: manifest.creatures.length };
    },

    async getManifest() {
      const meta = await idbGet(STORE_META, META_KEY);
      const live = buildManifestFromSave();

      if (live?.creatures?.length) {
        return {
          ...(meta?.manifest || {}),
          ...live,
          creatures: patchCreaturesFromSave(live.creatures),
        };
      }

      if (meta?.manifest?.creatures?.length) {
        return {
          ...meta.manifest,
          creatures: patchCreaturesFromSave(meta.manifest.creatures),
        };
      }

      return null;
    },

    async getMeta() {
      return idbGet(STORE_META, META_KEY);
    },

    async getArt(artFile) {
      return idbGet(STORE_ART, artFile);
    },

    async putArt(artFile, blob) {
      revokeUrl(artFile);
      await idbPut(STORE_ART, artFile, blob);
    },

    async deleteArt(artFile) {
      revokeUrl(artFile);
      await idbDelete(STORE_ART, artFile);
    },

    async getArtUrl(artFile) {
      if (urlCache.has(artFile)) { return urlCache.get(artFile); }
      const blob = await this.getArt(artFile);
      if (!blob) { return null; }
      const url = URL.createObjectURL(blob);
      urlCache.set(artFile, url);
      return url;
    },

    async refreshArtUrl(artFile) {
      revokeUrl(artFile);
      return this.getArtUrl(artFile);
    },

    revokeArtUrl(artFile) {
      revokeUrl(artFile);
    },

    async getBestArtFor(hashimonId) {
      const manifest = await this.getManifest();
      if (!manifest) { return null; }

      const creature = manifest.creatures.find(c => c.id === hashimonId);
      if (!creature) { return null; }

      const slots = [...slotsForCreature(creature)].sort((a, b) => b.tier - a.tier);
      for (const slot of slots) {
        const blob = await this.getArt(slot.artFile);
        if (blob) {
          return {
            artFile: slot.artFile,
            tier: slot.tier,
            url: await this.getArtUrl(slot.artFile),
          };
        }
      }
      return null;
    },

    async importPack(files) {
      const fileList = Array.from(files || []);
      let artCount = 0;
      let manifest = null;

      for (const file of fileList) {
        const path = file.webkitRelativePath || file.name;
        const normalized = path.replace(/^\.?\//, "");

        if (normalized === "album.json" || normalized.endsWith("/album.json")) {
          try {
            manifest = JSON.parse(await file.text());
          } catch (e) { /* skip invalid json */ }
          continue;
        }

        const artMatch = normalized.match(/(?:^|\/)art\/(.+\.png)$/i);
        if (artMatch && file.type.startsWith("image/")) {
          const artFile = `art/${artMatch[1]}`;
          await this.putArt(artFile, file);
          artCount++;
        }
      }

      if (manifest) {
        await idbPut(STORE_META, META_KEY, {
          manifest,
          syncedAt: new Date().toISOString(),
          exportId: manifest.exportedAt || new Date().toISOString(),
        });
      }

      if (readPlayerHashimons()) {
        await this.syncFromGame();
      }

      return { artCount, hasManifest: !!manifest };
    },
  };
})();
