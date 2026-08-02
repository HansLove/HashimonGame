#!/usr/bin/env node
/** Smoke test for map JSON + MapLoader (run from repo root). */
import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const ctx = vm.createContext({
  window: {},
  utils: {
    withGrid(n) { return n * 16; },
    asGridCoord(x, y) { return `${x},${y}`; },
  },
});
ctx.window = ctx;

function load(file) {
  vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), ctx, { filename: file });
}

load("src/world/mapLoader.js");

const index = JSON.parse(fs.readFileSync(path.join(root, "data/maps/_index.json"), "utf8"));
if (!index.maps?.length) {
  throw new Error("data/maps/_index.json has no maps");
}

const rawMaps = {};
for (const id of index.maps) {
  rawMaps[id] = JSON.parse(fs.readFileSync(path.join(root, "data/maps", `${id}.json`), "utf8"));
}

const maps = ctx.MapLoader.loadMapsFromData(rawMaps);

for (const id of index.maps) {
  const map = maps[id];
  if (!map) { throw new Error(`missing map: ${id}`); }
  if (map.id !== id) { throw new Error(`${id}: id mismatch`); }
  if (!map.configObjects?.hero) { throw new Error(`${id}: missing hero`); }
  const hx = map.configObjects.hero.x;
  const hy = map.configObjects.hero.y;
  if (typeof hx !== "number" || typeof hy !== "number") {
    throw new Error(`${id}: hero coords not deserialized`);
  }
}

const kitchen = maps.Kitchen;
const wallKeys = Object.keys(kitchen.walls || {});
if (!wallKeys.length || wallKeys.some(k => k.includes("object Object"))) {
  throw new Error("Kitchen walls: invalid coord keys");
}

console.log(`OK: ${index.maps.length} maps loaded (${index.maps.join(", ")})`);
