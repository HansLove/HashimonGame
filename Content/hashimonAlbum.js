//Album export manifest: evolution slots per tier with AI prompts from DNA.
window.HashimonAlbum = {
  SLOT_TIERS: [0, 2, 5],

  safeId(id) {
    return String(id).replace(/[^a-zA-Z0-9_-]/g, "_");
  },

  currentStars(hashimon) {
    return HashimonSystem.tierOf(hashimon);
  },

  slotsFor(hashimon) {
    const current = this.currentStars(hashimon);
    const tiers = [...this.SLOT_TIERS];
    if (!tiers.includes(current)) {
      tiers.push(current);
    }
    return [...new Set(tiers)].sort((a, b) => a - b);
  },

  promptAtTier(hashimon, tier, styleKey = "creature") {
    return HashimonPrompt.toPromptAtTier(hashimon, tier, styleKey);
  },

  typesFor(hashimon) {
    const dna = hashimon.dna || HashimonDNA.forHashimon(hashimon);
    const species = Hashimons[hashimon.speciesKey] || null;
    return HashimonCompiler.compileTypes(dna, species);
  },

  buildManifest(hashimons) {
    const creatures = Object.values(hashimons || {}).map(h => {
      const safe = this.safeId(h.id);
      const dna = h.dna || HashimonDNA.forHashimon(h);
      const types = this.typesFor(h);
      const slots = this.slotsFor(h).map(tier => {
        const prompt = this.promptAtTier(h, tier);
        return {
          tier,
          promptFile: `prompts/${safe}_t${tier}.txt`,
          artFile: `art/${safe}_t${tier}.png`,
          prompt,
        };
      });
      return {
        id: h.id,
        name: h.name,
        species: h.species,
        speciesLabel: h.speciesLabel || HashimonNames.speciesLabel(h.speciesKey),
        speciesKey: h.speciesKey,
        dna,
        currentStars: this.currentStars(h),
        types: {
          primary: types.primary,
          secondary: types.secondary,
          subtype: types.subtype,
          fusion: types.fusion,
        },
        stats: {
          hp: h.hp,
          maxHp: h.maxHp,
          power: h.stats?.power,
          defense: h.stats?.defense,
          bestShareBits: h.pow?.bestShareBits,
          evolutionProgress: h.evolution?.progress,
        },
        slots,
      };
    });

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      title: "My Hashimon Album",
      creatures,
    };
  },

  buildPack(hashimons) {
    const manifest = this.buildManifest(hashimons);
    const files = [];

    files.push({
      path: "album.json",
      content: JSON.stringify(manifest, null, 2),
    });

    manifest.creatures.forEach(creature => {
      creature.slots.forEach(slot => {
        files.push({
          path: slot.promptFile,
          content: slot.prompt,
        });
      });
    });

    files.push({
      path: "art/README.txt",
      content: [
        "Hashimon Album — art folder",
        "",
        "Drop PNG files here using the names from album.json, e.g.:",
        "  art/hashimon_starter_001_t0.png",
        "  art/hashimon_starter_001_t2.png",
        "  art/hashimon_starter_001_t5.png",
        "",
        "Or upload images directly in album/index.html (saved in your browser).",
      ].join("\n"),
    });

    files.push({
      path: "README.md",
      content: [
        "# Hashimon Album Pack",
        "",
        "1. Open `album/index.html` in your browser.",
        "2. For each slot, copy the prompt and generate art in your favorite AI.",
        "3. Click **Add image** on each tier slot (0★, 2★, 5★) to upload your PNG.",
        "4. Images persist locally in your browser (IndexedDB).",
        "",
        `Exported: ${manifest.exportedAt}`,
        `Creatures: ${manifest.creatures.length}`,
      ].join("\n"),
    });

    return { manifest, files };
  },
};
