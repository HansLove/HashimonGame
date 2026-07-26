//Deterministic nicknames from DNA. Catalog names become speciesLabel; each
//individual gets its own name derived from its hash identity.
window.HashimonNames = {

  CORE_SYLLABLES: [
    "nex", "hex", "volt", "byte", "node", "link", "shard", "core",
    "nix", "rax", "zen", "flux", "bit", "chain", "hash", "mint",
    "nyx", "arc", "pulse", "wire", "sync", "proof", "relay", "mine",
  ],

  PREFIX_BY_TYPE: {
    fuego:    ["Ember", "Blaze", "Cinder", "Forge"],
    agua:     ["Tide", "Aqua", "Ripple", "Deep"],
    onda:     ["Echo", "Wave", "Phase", "Signal"],
    electrico:["Volt", "Spark", "Amp", "Charge"],
    tierra:   ["Stone", "Root", "Clay", "Fault"],
    aire:     ["Gust", "Zephyr", "Drift", "Sky"],
    astro:    ["Star", "Nova", "Orbit", "Cosmo"],
    pixel:    ["Glitch", "Pixel", "Render", "Frame"],
    sueno:    ["Dream", "Mist", "Dusk", "Veil"],
    magia:    ["Rune", "Sigil", "Arcane", "Spell"],
    metal:    ["Alloy", "Steel", "Plate", "Iron"],
    robot:    ["Bot", "Servo", "Gear", "Unit"],
    plasma:   ["Plasma", "Ion", "Fusion", "Core"],
    vegetal:  ["Leaf", "Moss", "Vine", "Bloom"],
    hongo:    ["Spore", "Cap", "Myco", "Fungal"],
    mental:   ["Psi", "Mind", "Thought", "Neural"],
  },

  SUFFIX_BY_ARCHETYPE: {
    feline:     ["pup", "claw", "tail", "kit"],
    canine:     ["pup", "fang", "hound", "byte"],
    lion:       ["cub", "mane", "roar", "pride"],
    rodent:     ["kit", "nib", "scurry", "bit"],
    ursine:     ["bear", "bulk", "guard", "core"],
    primate:    ["hand", "swing", "kin", "link"],
    chiropteran: ["wing", "bat", "flit", "echo"],
    bird:       ["wing", "beak", "sky", "feather"],
    deer:       ["fawn", "antler", "step", "grace"],
    insect:     ["moth", "wing", "hive", "byte"],
    reptile:    ["scale", "tail", "cold", "snap"],
    amphibian:  ["toad", "pond", "croak", "wet"],
    chelonian:  ["shell", "slow", "plate", "turtle"],
    cephalopod: ["ink", "tent", "deep", "wave"],
    crustacean: ["claw", "shell", "pinch", "crab"],
    serpentine: ["coil", "hiss", "scale", "slither"],
    equine:     ["hoof", "gallop", "mane", "stride"],
    fungal:     ["cap", "spore", "root", "mycel"],
    glitchpup:  ["pup", "glitch", "byte", "render"],
  },

  speciesLabel(speciesKey) {
    return Hashimons[speciesKey]?.name || speciesKey || "Hashimon";
  },

  capitalize(word) {
    if (!word) { return ""; }
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  },

  generate(hashimon) {
    const dna = hashimon.dna || HashimonDNA.forHashimon(hashimon);
    const species = Hashimons[hashimon.speciesKey] || null;
    const types = HashimonCompiler.compileTypes(dna, species);
    const archetype = species?.archetype || "feline";

    const typePool = this.PREFIX_BY_TYPE[types.primary.key] || this.PREFIX_BY_TYPE.pixel;
    const prefix = HashimonDNA.pick(dna, 28, 2, typePool);
    const core = HashimonDNA.pick(dna, 32, 2, this.CORE_SYLLABLES);
    const suffixPool = this.SUFFIX_BY_ARCHETYPE[archetype] || this.SUFFIX_BY_ARCHETYPE.feline;
    const suffix = HashimonDNA.pick(dna, 36, 1, suffixPool);

    const joiner = HashimonDNA.isEven(dna, 40) ? "-" : "";
    const name = `${this.capitalize(prefix)}${joiner}${this.capitalize(core)}${this.capitalize(suffix)}`;

    return name.slice(0, 20);
  },

  validate(name) {
    const trimmed = (name || "").trim();
    if (trimmed.length < 1 || trimmed.length > 20) {
      return { ok: false, error: "Name must be 1–20 characters." };
    }
    return { ok: true, name: trimmed };
  },
};
