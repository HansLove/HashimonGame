#!/usr/bin/env node
/** Smoke test for SaveManager unified persistence. */
import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const storage = {};
const ctx = vm.createContext({
  window: {
    localStorage: {
      getItem(k) { return storage[k] ?? null; },
      setItem(k, v) { storage[k] = String(v); },
      removeItem(k) { delete storage[k]; },
    },
  },
});
ctx.window = ctx.window;

function load(file) {
  let code = fs.readFileSync(path.join(root, file), "utf8");
  code = code.replace(/^export\s+(const\s+\w+\s*=.*|{[^}]+});?\s*$/gm, "");
  vm.runInContext(code, ctx, { filename: file });
}

load("src/state/SaveManager.js");

const SaveManager = ctx.window.SaveManager;

SaveManager.persist({
  schemaVersion: 0,
  progress: { mapId: "Kitchen", startingHeroX: 16, startingHeroY: 32, startingHeroDirection: "up" },
  player: { hashimons: {}, lineup: [], items: [], storyFlags: {}, questProgress: {}, personSeed: "x" },
});

const loaded = SaveManager.load();
if (!loaded?.progress || loaded.progress.mapId !== "Kitchen") {
  throw new Error("unified save missing progress");
}
if (!loaded?.player) {
  throw new Error("unified save missing player");
}
if (loaded.schemaVersion !== SaveManager.SCHEMA_VERSION) {
  throw new Error("schema version not migrated");
}

delete storage[SaveManager.UNIFIED_KEY];
storage[SaveManager.LEGACY_PROGRESS_KEY] = JSON.stringify({
  mapId: "Street",
  startingHeroX: 0,
  startingHeroY: 0,
  startingHeroDirection: "down",
});
storage[SaveManager.LEGACY_PLAYER_KEY] = JSON.stringify({
  hashimons: { a: { id: "a" } },
  lineup: ["a"],
  items: [],
  storyFlags: {},
  questProgress: {},
  personSeed: "legacy",
});

const migrated = SaveManager.load();
if (migrated.progress.mapId !== "Street") {
  throw new Error("legacy progress migration failed");
}
if (!migrated.player.lineup.includes("a")) {
  throw new Error("legacy player migration failed");
}
if (!storage[SaveManager.UNIFIED_KEY]) {
  throw new Error("legacy migration should write unified key");
}

console.log("OK: SaveManager unified + legacy migration");
