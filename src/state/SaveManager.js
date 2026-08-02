/**
 * Unified save: Progress + PlayerState with schema versioning and legacy migration.
 */
class SaveManager {
  static SCHEMA_VERSION = 1;
  static UNIFIED_KEY = "Hashimon_UnifiedSave_v1";
  static LEGACY_PROGRESS_KEY = "Hashimon_SaveFile1";
  static LEGACY_PLAYER_KEY = "Hashimon_PlayerState";

  static load() {
    if (!window.localStorage) { return null; }

    const unified = window.localStorage.getItem(SaveManager.UNIFIED_KEY);
    if (unified) {
      return SaveManager.migrate(JSON.parse(unified));
    }
    return SaveManager.migrateFromLegacy();
  }

  static migrate(data) {
    const out = data || {};
    const version = out.schemaVersion || 0;

    if (version < 1) {
      out.schemaVersion = 1;
    }

    out.schemaVersion = SaveManager.SCHEMA_VERSION;
    return out;
  }

  static migrateFromLegacy() {
    const progressRaw = window.localStorage.getItem(SaveManager.LEGACY_PROGRESS_KEY);
    const playerRaw = window.localStorage.getItem(SaveManager.LEGACY_PLAYER_KEY);

    if (!progressRaw && !playerRaw) { return null; }

    const data = SaveManager.migrate({
      schemaVersion: 0,
      progress: progressRaw ? JSON.parse(progressRaw) : null,
      player: playerRaw ? JSON.parse(playerRaw) : null,
    });

    SaveManager.persist(data);
    return data;
  }

  static snapshotProgress(progress) {
    return {
      mapId: progress.mapId,
      startingHeroX: progress.startingHeroX,
      startingHeroY: progress.startingHeroY,
      startingHeroDirection: progress.startingHeroDirection,
    };
  }

  static snapshotPlayer(playerState) {
    return {
      hashimons: playerState.hashimons,
      lineup: playerState.lineup,
      items: playerState.items,
      storyFlags: playerState.storyFlags,
      questProgress: playerState.questProgress,
      personSeed: playerState.personSeed,
    };
  }

  static persist(data) {
    if (!window.localStorage) { return; }

    data.schemaVersion = SaveManager.SCHEMA_VERSION;
    window.localStorage.setItem(SaveManager.UNIFIED_KEY, JSON.stringify(data));

    if (data.progress) {
      window.localStorage.setItem(
        SaveManager.LEGACY_PROGRESS_KEY,
        JSON.stringify(data.progress),
      );
    }
    if (data.player) {
      window.localStorage.setItem(
        SaveManager.LEGACY_PLAYER_KEY,
        JSON.stringify(data.player),
      );
    }
  }

  static writeProgress(progress, playerState) {
    const data = SaveManager.load() || {
      schemaVersion: SaveManager.SCHEMA_VERSION,
      progress: null,
      player: null,
    };
    data.progress = SaveManager.snapshotProgress(progress);
    if (playerState) {
      data.player = SaveManager.snapshotPlayer(playerState);
    }
    SaveManager.persist(data);
  }

  static writePlayer(playerState, progress) {
    const data = SaveManager.load() || {
      schemaVersion: SaveManager.SCHEMA_VERSION,
      progress: null,
      player: null,
    };
    data.player = SaveManager.snapshotPlayer(playerState);
    if (progress) {
      data.progress = SaveManager.snapshotProgress(progress);
    }
    SaveManager.persist(data);
  }
}

window.SaveManager = SaveManager;
window.saveManager = SaveManager;
