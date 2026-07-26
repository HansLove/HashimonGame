#!/usr/bin/env node
/** Smoke test for HashimonNames (run from repo root). */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..");
const ctx = vm.createContext({ window: {} });
ctx.window = ctx;

function load(file) {
  vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), ctx, { filename: file });
}

load("Content/hashimons.js");
load("Content/hashimonDNA.js");
load("Content/hashimonTypes.js");
load("Content/hashimonCompiler.js");
load("Content/hashimonNames.js");

const h1 = {
  speciesKey: "glitchPup",
  pow: { templateId: "t1", birthNonce: 1001 },
};
const h2 = {
  speciesKey: "glitchPup",
  pow: { templateId: "t1", birthNonce: 2002 },
};
h1.dna = ctx.HashimonDNA.derive(h1.pow.templateId, h1.pow.birthNonce, h1.speciesKey);
h2.dna = ctx.HashimonDNA.derive(h2.pow.templateId, h2.pow.birthNonce, h2.speciesKey);

const n1 = ctx.HashimonNames.generate(h1);
const n2 = ctx.HashimonNames.generate(h2);
const n1b = ctx.HashimonNames.generate(h1);

if (n1 === n2) { throw new Error("same species should produce different nicknames"); }
if (n1 !== n1b) { throw new Error("nickname must be deterministic"); }
if (ctx.HashimonNames.speciesLabel("glitchPup") !== "Glitchpup") {
  throw new Error("speciesLabel mismatch");
}

console.log("OK:", n1, n2, "(Glitchpup species)");
