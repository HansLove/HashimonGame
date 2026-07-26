#!/usr/bin/env node
/** Smoke test for Hashimon Album pack builder (run from repo root). */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");

const required = [
  "Content/hashimonAlbum.js",
  "HashimonAlbumExport.js",
  "album/index.html",
  "album/album.js",
  "album/album.css",
  "lib/jszip.min.js",
];
required.forEach(f => {
  if (!fs.existsSync(path.join(root, f))) {
    console.error("MISSING:", f);
    process.exit(1);
  }
});

function load(file) {
  const code = fs.readFileSync(path.join(root, file), "utf8");
  vm.runInContext(code, ctx, { filename: file });
}

const ctx = vm.createContext({
  window: {},
  HashimonConfig: { bitsPerStar: 4, maxStage: 33, visualMaxTier: 6 },
  HashimonSystem: {
    tierOf(h) { return Math.floor((h.pow?.bestShareBits || 0) / 4); },
  },
  HashimonDNA: {
    forHashimon(h) { return h.dna || "abc123def456"; },
  },
  HashimonPrompt: {
    toPromptAtTier(h, tier) { return `Prompt for ${h.name} at tier ${tier}`; },
  },
  HashimonNames: {
    speciesLabel(key) { return key; },
  },
  HashimonCompiler: {
    compileTypes(dna, species) {
      const primary = species?.type || "pixel";
      const secondary = species?.type2 || null;
      const fusion = secondary === "agua" && primary === "tierra" ? "Plant" : null;
      return {
        primary: { key: primary, name: "Pixel" },
        secondary: secondary ? { key: secondary, name: "Water" } : null,
        subtype: "Pure",
        fusion,
        fusionFlavor: fusion ? "Roots drink deep." : null,
      };
    },
  },
  Hashimons: {
    s001: { type: "pixel" },
    v001: { type: "tierra", type2: "agua" },
  },
});
ctx.window = ctx;

load("Content/hashimonAlbum.js");

const sample = {
  hashimon_a: {
    id: "hashimon_a",
    name: "Testmon",
    species: "Test",
    speciesKey: "v001",
    dna: "deadbeef",
    stage: 2,
    maxStage: 33,
    pow: { bestShareBits: 8, bestShareHash: "00abcd", templateId: "t", birthNonce: 1 },
  },
};

const { manifest, files } = ctx.HashimonAlbum.buildPack(sample);

if (manifest.creatures.length !== 1) throw new Error("expected 1 creature");
if (!manifest.creatures[0].types?.primary?.key) throw new Error("missing primary type");
if (!manifest.creatures[0].types?.secondary?.key) throw new Error("missing secondary type");
if (manifest.creatures[0].types?.fusion !== "Plant") throw new Error("expected Plant fusion");
if (manifest.creatures[0].slots.length < 3) throw new Error("expected 3+ slots");
if (!files.find(f => f.path === "album.json")) throw new Error("missing album.json");
if (!files.find(f => f.path.startsWith("prompts/"))) throw new Error("missing prompts");

console.log("OK:", manifest.creatures[0].slots.map(s => s.tier + "★").join(", "));
