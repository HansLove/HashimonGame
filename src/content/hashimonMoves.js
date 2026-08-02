//Move assignment for Hashimons. Species can set `moves` explicitly in the catalog;
//otherwise kitFor() builds a kit from type, branch, and stat bias.
//
//Design rules:
//  - 3 moves early species, up to 4 for evolved / boss-tier kits
//  - Every kit has at least one damage move and one identity move (type signature)
//  - Fast species lean physical (scratch); tanky species lean strike + support
//  - High energy species get hashPulse or a special-type move

window.HashimonMoves = {

  //Primary signature keyed by whitepaper type
  typeSignature: {
    pixel:     "pixelBurst",
    fuego:     "emberClaw",
    metal:     "alloyRam",
    electrico: "voltArc",
    agua:      "tidalCrash",
    aire:      "gustSlice",
    astro:     "starfall",
    mental:    "mindProbe",
    sueno:     "dreamStep",
    hongo:     "sporeCloud",
    vegetal:   "leafDrain",
    tierra:    "rootGuard",
  },

  //Secondary utility keyed by branch
  branchUtility: {
    solar: "overclock",
    block: "rootGuard",
    storm: "hashPulse",
    void:  "hashGlitch",
  },

  //Curated kits override auto-assignment where the species needs a specific identity
  speciesKits: {
    s001:       ["genesisBlock", "hashPulse", "overclock", "pixelBurst"],
    solarCub:   ["emberClaw", "scratch", "overclock"],
    s002:       ["alloyRam", "strike", "hashGlitch", "overclock"],
    glitchPup:  ["pixelBurst", "hashGlitch", "scratch"],
    voltKit:    ["voltArc", "hashPulse", "scratch"],
    v001:       ["leafDrain", "rootGuard", "strike"],
    v002:       ["rootGuard", "strike", "hashGlitch"],
    f001:       ["sporeCloud", "strike", "hashGlitch"],
    f002:       ["dreamStep", "scratch", "hashGlitch"],
    astralFawn: ["starfall", "hashPulse", "gustSlice"],
    psyMoth:    ["mindProbe", "hashPulse", "hashGlitch"],
    tideKit:    ["tidalCrash", "scratch", "strike"],
    gustling:   ["gustSlice", "hashPulse", "scratch"],
  },

  //Build a move list for a species key
  kitFor(speciesKey) {
    if (this.speciesKits[speciesKey]) {
      return [...this.speciesKits[speciesKey]];
    }
    return this.autoKit(Hashimons[speciesKey]);
  },

  autoKit(species) {
    if (!species) { return ["scratch", "strike", "hashPulse"]; }

    const moves = [];
    const push = id => {
      if (id && Actions[id] && !moves.includes(id)) { moves.push(id); }
    };

    push(this.typeSignature[species.type]);
    push(this.branchUtility[species.branch]);

    const stats = species.baseStats || {};
    if (stats.speed >= 9) { push("scratch"); }
    else if (stats.defense >= 9) { push("strike"); push("rootGuard"); }
    else { push("strike"); }

    if (stats.energy >= 10) { push("hashPulse"); }
    if (stats.power >= 9 && moves.length < 4) { push("hashGlitch"); }

    while (moves.length < 3) { push("hashPulse"); push("scratch"); push("strike"); }

    return moves.slice(0, 4);
  },

  //Resolve the final move list: explicit catalog > curated kit > auto
  resolve(speciesKey, species) {
    if (species.moves && species.moves.length) {
      return species.moves.filter(id => Actions[id]);
    }
    return this.kitFor(speciesKey);
  },

  //Primary move for sprite glyph (first signature or first move)
  primaryMove(speciesKey, species) {
    const moves = this.resolve(speciesKey, species);
    const sig = this.typeSignature[species.type];
    if (sig && moves.includes(sig)) { return sig; }
    return moves[0];
  },

}
