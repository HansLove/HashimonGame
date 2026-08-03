#!/usr/bin/env node
/** Smoke test for Hashimon type taxonomy (run from repo root). */
import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const ctx = vm.createContext({ window: {} });
ctx.window = ctx;

function load(file) {
  let code = fs.readFileSync(path.join(root, file), "utf8");
  code = code.replace(/^export\s+(const\s+\w+\s*=.*|{[^}]+});?\s*$/gm, "");
  vm.runInContext(code, ctx, { filename: file });
}

[
  "src/content/hashimons.js",
  "src/content/hashimonDNA.js",
  "src/content/hashimonTypes.data.js",
  "src/content/hashimonTypes.js",
  "src/content/hashimonCompiler.js",
].forEach(load);

const { HashimonPrimaryKeys, HashimonTypes, HashimonFusionMap, HashimonTypeUtils, HashimonCompiler, Hashimons, HashimonDNA } = ctx;

if (HashimonPrimaryKeys.length !== 13) {
  throw new Error(`expected 13 primaries, got ${HashimonPrimaryKeys.length}`);
}

HashimonPrimaryKeys.forEach(key => {
  const def = HashimonTypes[key];
  if (!def) { throw new Error(`missing primary type: ${key}`); }
  if (!def.subtypes || def.subtypes.length < 2) {
    throw new Error(`${key} needs at least 2 subtypes`);
  }
  if (!def.subtypes.includes("Pure")) {
    throw new Error(`${key} missing Pure subtype`);
  }
});

["robot", "plasma", "vegetal"].forEach(removed => {
  if (HashimonTypes[removed]) {
    throw new Error(`${removed} should not be a primary type`);
  }
});

const fusionCount = Object.keys(HashimonFusionMap).length;
if (fusionCount < 45) {
  throw new Error(`expected at least 45 fusions, got ${fusionCount}`);
}

Object.entries(HashimonFusionMap).forEach(([key, def]) => {
  const parts = key.split("|");
  if (parts.length !== 2) { throw new Error(`bad fusion key: ${key}`); }
  if (parts[0] === parts[1]) { throw new Error(`self fusion: ${key}`); }
  if (!def.name) { throw new Error(`fusion missing name: ${key}`); }
  if (!def.subtypes?.length) { throw new Error(`fusion missing subtypes: ${key}`); }
  const reversed = HashimonTypeUtils.fusionKey(parts[1], parts[0]);
  if (!HashimonFusionMap[reversed]) {
    throw new Error(`fusion not symmetric: ${key}`);
  }
});

const legacyPairs = [
  ["metal", "pixel", "Robot"],
  ["electrico", "fuego", "Plasma"],
  ["agua", "tierra", "Plant"],
  ["astro", "aire", "Cosmic Dust"],
  ["onda", "metal", "Rock"],
];
legacyPairs.forEach(([a, b, name]) => {
  const def = HashimonTypeUtils.resolveFusion(a, b);
  if (!def || def.name !== name) {
    throw new Error(`legacy fusion ${a}+${b} expected ${name}, got ${def?.name}`);
  }
});

const kale = Hashimons.v001;
const kaleDna = HashimonDNA.derive("template_plant_001", 300003, "v001");
const kaleTypes = HashimonCompiler.compileTypes(kaleDna, kale);
if (kaleTypes.fusion !== "Plant") {
  throw new Error(`v001 expected Plant fusion, got ${kaleTypes.fusion}`);
}
if (!kaleTypes.subtype) {
  throw new Error("v001 missing fusion subtype");
}

const vegetalAlias = HashimonCompiler.compileTypes(
  HashimonDNA.derive("t", 1, "x"),
  { type: "vegetal" },
);
if (vegetalAlias.primary.key !== "tierra") {
  throw new Error("vegetal alias should map to tierra");
}

const h = {
  speciesKey: "solarCub",
  pow: { templateId: "template_solar_001", birthNonce: 481927 },
};
h.dna = HashimonDNA.forHashimon(h);
const t1 = HashimonCompiler.compileTypes(h.dna, Hashimons.solarCub);
const t2 = HashimonCompiler.compileTypes(h.dna, Hashimons.solarCub);
if (t1.subtype !== t2.subtype) {
  throw new Error("subtype must be deterministic");
}
if (!t1.subtype) {
  throw new Error("mono-type missing subtype");
}

["genesis_fuego", "genesis_agua", "genesis_aire", "genesis_tierra", "genesis_electrico"].forEach(key => {
  const sp = Hashimons[key];
  if (!sp) { throw new Error(`missing genesis species: ${key}`); }
  const dna = HashimonDNA.derive(sp.templateId, 1, key);
  const types = HashimonCompiler.compileTypes(dna, sp);
  if (types.subtype !== "Pure") {
    throw new Error(`${key} expected Pure subtype, got ${types.subtype}`);
  }
  if (types.primary.key !== sp.type) {
    throw new Error(`${key} expected type ${sp.type}, got ${types.primary.key}`);
  }
});

console.log(`OK: ${HashimonPrimaryKeys.length} primaries, ${fusionCount} fusions, v001=${kaleTypes.fusion}/${kaleTypes.subtype}`);
