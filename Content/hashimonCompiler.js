//El Compilador. The whitepaper: "un compilador es un algoritmo que interpreta el
//ADN de un Hashimon para dotarlo de características que le permiten ser utilizado
//en un ecosistema digital".
//
//Here the target ecosystem is an image model driven by the player. The compiler
//reads the DNA and emits (a) a trait sheet and (b) a prompt the player pastes
//into their AI of choice. Nothing is random at call time: the same DNA always
//compiles to the same creature, so two players describing the same Hashimon get
//the same description.
//
//Every decision uses one of the three methods the whitepaper names:
//  1. entra en un rango de numero   -> DNA.range / DNA.pick
//  2. par e impar (modulo)          -> DNA.isEven / DNA.modulo
//  3. seno y coseno                 -> DNA.sin / DNA.cos
//The DNA position each trait reads is fixed and documented, so the mapping is
//auditable: anyone can recompute a Hashimon's look from its hash alone.

window.CompilerTraits = {
  //Archetype (silhouette) is normally fixed by the species; this list is the
  //fallback for DNA-only creatures. Keys map to the species archetype strings.
  archetype: [
    "feline", "canine", "reptile", "bird", "insect", "amphibian", "rodent",
    "ursine", "chelonian", "cephalopod", "equine", "chiropteran",
    "crustacean", "serpentine", "primate", "deer",
  ],
  build: ["tiny and compact", "slender and elongated", "heavy and robust", "lean and angular"],
  posture: ["quadruped", "biped", "serpentine", "hovering"],
  eyes: [
    "huge round eyes", "narrow calculating eyes", "faceted compound eyes",
    "a single central eye", "half-lidded sleepy eyes", "smooth pupil-less eyes",
    "four eyes in two pairs", "cross-shaped pupils",
  ],
  temperament: [
    "curious and trusting", "wary, always on guard", "placid and slow",
    "jittery and electric", "solemn, almost ceremonial", "playful and clumsy",
    "impassive, fixed stare", "protective, defensive stance",
  ],
  marking: [
    "no markings", "asymmetric stripes", "dense speckling", "one old scar",
    "concentric spots", "a hexagonal pattern", "branching veins", "a two-tone gradient",
  ],
  size: ["cat-sized", "the size of a large dog", "horse-sized", "small enough to hold in one hand"],
}

//English display labels for the archetype keys used in the species catalog.
window.ArchetypeLabels = {
  feline: "feline", canine: "canine", reptile: "reptile", bird: "bird",
  insect: "insect", amphibian: "amphibian", rodent: "rodent", ursine: "ursine",
  chelonian: "chelonian", cephalopod: "cephalopod", equine: "equine",
  chiropteran: "bat-like", crustacean: "crustacean", serpentine: "serpentine",
  primate: "primate", deer: "deer", lion: "lion", fungal: "fungal", glitchpup: "canine",
}

window.HashimonCompiler = {

  //--- Color. This is where uniqueness lives. -----------------------------
  //Types and archetypes repeat by design; colour must not. Hue reads a 4-nibble
  //window (65,536 values) instead of a single digit, and saturation/lightness
  //add two more dimensions, so the exact palette of a Hashimon is effectively
  //a fingerprint even when two share a species.
  compileColor(dna, species) {
    const typeKey = this.compileTypes(dna, species).primary.key;
    const bands = HashimonTypes[typeKey].hues;
    //Modulo picks which band of the type's palette; a wide window places the
    //hue continuously inside it. The creature reads as its type, yet its exact
    //shade is its own.
    const band = bands[HashimonDNA.modulo(dna, 9, bands.length)];
    const hue = Math.round(HashimonDNA.range(dna, 10, 4, band[0], band[1]));

    //Sine gives a non-uniform spread: more creatures land at vivid or muted
    //extremes than in a flat middle.
    const sat = Math.round(45 + HashimonDNA.sinUnit(dna, 14, 3) * 50);
    const lum = Math.round(32 + HashimonDNA.sinUnit(dna, 17, 3) * 38);

    //Cosine decides how far the accent sits from the base: complementary,
    //analogous or split. Sign of a trig function is the whitepaper's own trick.
    const spin = HashimonDNA.cos(dna, 20, 3);
    const offset = spin > 0.33 ? 180 : (spin < -0.33 ? 35 : 140);
    const accentHue = (hue + offset) % 360;
    const accentSat = Math.round(55 + HashimonDNA.sinUnit(dna, 23, 2) * 40);

    return {
      base:   { h: hue, s: sat, l: lum, hex: this.hslToHex(hue, sat, lum), name: this.colorName(hue, sat, lum) },
      accent: { h: accentHue, s: accentSat, l: 55, hex: this.hslToHex(accentHue, accentSat, 55), name: this.colorName(accentHue, accentSat, 55) },
      relation: spin > 0.33 ? "complementary" : (spin < -0.33 ? "analogous" : "split"),
    };
  },

  //--- Types. Max two, per the whitepaper. --------------------------------
  //A species fixes the primary type (and optionally a second): that is the
  //SHARED, recognizable part. If a species declares no type, the type is derived
  //from DNA as a fallback. The sub-type always varies by individual.
  compileTypes(dna, species) {
    const primaryKeys = window.HashimonPrimaryKeys || Object.keys(HashimonTypes);
    let primary, secondary;

    if (species && species.type) {
      primary = HashimonTypeUtils.normalizeTypeKey(species.type);
      secondary = species.type2 ? HashimonTypeUtils.normalizeTypeKey(species.type2) : null;
    } else {
      primary = HashimonDNA.pick(dna, 1, 2, primaryKeys);
      const wantsDual = !HashimonDNA.isEven(dna, 3) && HashimonDNA.at(dna, 4) >= 6;
      secondary = wantsDual
        ? HashimonDNA.pick(dna, 5, 2, primaryKeys.filter(k => k !== primary))
        : null;
    }

    const fusionDef = secondary ? HashimonTypeUtils.resolveFusion(primary, secondary) : null;
    const primaryDef = HashimonTypes[primary];
    const subtypePool = fusionDef?.subtypes?.length
      ? fusionDef.subtypes
      : primaryDef.subtypes;

    return {
      primary:   { key: primary, name: primaryDef.name },
      secondary: secondary ? { key: secondary, name: HashimonTypes[secondary].name } : null,
      subtype:   subtypePool[HashimonDNA.modulo(dna, 7, subtypePool.length)],
      fusion:    fusionDef ? fusionDef.name : null,
      fusionFlavor: fusionDef?.flavor || null,
    };
  },

  //--- Stats. Whitepaper: "Ataque:100-[1] / Defensa:100-[2] / HP:100-[63] /
  //Suerte:100-[64]". Nibbles are 0-15, so 100-[n] alone would leave stats in a
  //narrow 85-100 band; we keep the exact positions it names and widen the
  //spread, then hold HP inside the stated 70-100 range.
  compileStats(dna) {
    const spread = n => 100 - HashimonDNA.at(dna, n) * 4;   // 40..100
    return {
      ataque:    spread(1),
      defensa:   spread(2),
      velocidad: spread(3),
      hp:        Math.round(70 + (100 - spread(63)) / 60 * 30),  //70..100 per whitepaper
      suerte:    spread(64),
    };
  },

  //--- Stars. The Hashima interface's scarcity metric. --------------------
  //Rarer is genuinely rarer: a star is only granted while consecutive nibbles
  //keep clearing a high bar, so each extra star is roughly 1/4 as likely.
  compileStars(dna) {
    let stars = 1;
    for (let pos = 25; pos < 35 && stars < 10; pos++) {
      if (HashimonDNA.at(dna, pos) >= 12) { stars++; } else { break; }
    }
    return stars;
  },

  //--- The full look ------------------------------------------------------
  compileLook(dna, species) {
    const types = this.compileTypes(dna, species);
    const color = this.compileColor(dna, species);
    const fusionDef = types.secondary
      ? HashimonTypeUtils.resolveFusion(types.primary.key, types.secondary.key)
      : null;
    const t = fusionDef?.visual || HashimonTypes[types.primary.key].visual;

    //Archetype is the species' shared silhouette; only the fallback rolls DNA.
    const archetype = species && species.archetype
      ? (ArchetypeLabels[species.archetype] || species.archetype)
      : HashimonDNA.pick(dna, 35, 2, CompilerTraits.archetype);

    return {
      archetype,
      build:       HashimonDNA.pick(dna, 37, 2, CompilerTraits.build),
      posture:     HashimonDNA.pick(dna, 39, 2, CompilerTraits.posture),
      size:        HashimonDNA.pick(dna, 41, 2, CompilerTraits.size),
      eyes:        HashimonDNA.pick(dna, 43, 2, CompilerTraits.eyes),
      marking:     HashimonDNA.pick(dna, 45, 2, CompilerTraits.marking),
      temperament: HashimonDNA.pick(dna, 47, 2, CompilerTraits.temperament),
      material:    HashimonDNA.pick(dna, 49, 2, t.material),
      feature:     HashimonDNA.pick(dna, 51, 2, t.feature),
      aura:        t.aura,
      color,
    };
  },

  //Everything the compiler knows about one Hashimon. The species pins the shared
  //identity (type, archetype); the DNA individualizes everything else.
  compile(hashimon) {
    const dna = HashimonDNA.forHashimon(hashimon);
    const species = Hashimons[hashimon.speciesKey] || null;
    return {
      dna,
      types: this.compileTypes(dna, species),
      stats: this.compileStats(dna),
      //Stars are EARNED, not innate: how many leading zero nibbles the best real
      //share has (see HashimonSystem.tierOf). A freshly caught creature has 0.
      stars: Math.floor((hashimon.pow.bestShareBits || 0) / 4),
      look:  this.compileLook(dna, species),
      pow: {
        templateId: hashimon.pow.templateId,
        birthNonce: hashimon.pow.birthNonce,
        bestShareDifficulty: hashimon.pow.bestShareDifficulty,
        bestShareHash: hashimon.pow.bestShareHash,
        validShares: hashimon.pow.validShares,
        foundBlock: hashimon.pow.foundBlock,
        zeros: HashimonDNA.leadingZeros(hashimon.pow.bestShareHash || ""),
      },
      stage: hashimon.stage,
      maxStage: hashimon.maxStage,
      name: hashimon.name,
    };
  },

  //--- Colour naming so the prompt reads like language, not hex ----------
  colorName(h, s, l) {
    if (s < 12) { return l > 70 ? "ash white" : (l < 25 ? "charcoal black" : "grey"); }
    const names = [
      [15, "red"], [35, "orange"], [55, "amber"], [70, "yellow"], [95, "lime"],
      [145, "green"], [175, "emerald"], [200, "turquoise"], [225, "blue"],
      [255, "indigo"], [285, "violet"], [320, "magenta"], [345, "crimson"], [361, "red"],
    ];
    const base = names.find(n => h < n[0])[1];
    const light = l > 68 ? "light " : (l < 38 ? "deep " : "");
    const sat = s > 80 ? " vivid" : (s < 45 ? " muted" : "");
    return `${light}${base}${sat}`.trim();
  },

  hslToHex(h, s, l) {
    s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
    return "#" + [f(0), f(8), f(4)].map(v => v.toString(16).padStart(2, "0")).join("");
  },

}
