//Target adapter: image model driven by the player.
//The whitepaper's compilers emit into a digital ecosystem. This one emits into
//whichever AI the player already uses. The player is the renderer, which is why
//V1 needs no artwork pipeline of its own.
//
//IDENTITY IS STABLE, MATURITY EVOLVES. The species, type and exact colour never
//change once born, so the creature is always recognizable. What changes as it
//mines is the maturity block (§ toPrompt): stage drives its body from baby to
//monster, and rarity (stars) amplifies how monstrous and ornate it becomes.
window.HashimonPrompt = {

  STYLES: {
    creature: {
      label: "Creature (default)",
      directive: "Fantasy creature illustration, full body, three-quarter view, plain neutral background, soft studio lighting, flat saturated colors, clean defined outline, readable and memorable design, collectible-monster aesthetic.",
    },
    pixel: {
      label: "Pixel art",
      directive: "Pixel-art sprite, 32x32 pixels, limited palette, 1-pixel dark outline, front view, transparent background, 16-bit RPG style, no blur or antialiasing.",
    },
    card: {
      label: "Trading card",
      directive: "Trading-card art, centered heroic portrait, dramatic lighting, an energy background matching the element, high detail, glossy finish.",
    },
  },

  //--- Maturity: the part of the prompt that evolves ----------------------
  //Body plan from stage; monstrousness gated by stage AND amplified by rarity.
  //A low-stage creature stays a cute baby no matter how rare; only as it matures
  //does its rarity express as full "monster mode".
  //Evolution is slow: a hatchling stays a small child for many ranks; an adult
  //arrives only around rank 12-13, and the full monster near rank 15.
  MORPHOLOGY: [
    { at: 0.00, form: "Hatchling",     body: "just hatched: an oversized head on a tiny body, stubby limbs, huge eyes, extremely cute and small." },
    { at: 0.33, form: "Child form",    body: "still a small child: big-headed and round, soft playful proportions, clearly very young." },
    { at: 0.55, form: "Juvenile form", body: "a growing juvenile: limbs lengthening, features settling in, an adolescent build." },
    { at: 0.75, form: "Adult form",    body: "fully grown and confident, balanced adult proportions and defined musculature." },
    { at: 0.90, form: "Mythic form",   body: "majestic and ornate, an imposing, elaborated presence." },
    { at: 1.00, form: "Monster form",  body: "the apex: towering, heavily armored and spiked, overwhelming and dangerous." },
  ],

  monsterLine(score) {
    if (score < 0.15) { return "Keep it gentle and unthreatening: rounded shapes, nothing sharp."; }
    if (score < 0.35) { return "A few bold, confident features are beginning to show."; }
    if (score < 0.55) { return "Clearly capable, with some sharp edges and a hint of menace."; }
    if (score < 0.75) { return "Imposing: aggressive silhouette cues — spurs, ridges, a heavier jaw."; }
    if (score < 0.90) { return "Fearsome: extra spikes, battle-worn plating, a predatory stance."; }
    return "Full monster mode: oversized and many-featured, awe-inspiring and dangerous, the kind of creature myths warn about.";
  },

  //Stars ARE the tier (earned leading-zero nibbles). Tier 0 is an unhatched egg;
  //the form then evolves slowly with proven work, full monster only near rank 15.
  maturityBlock(stage, maxStage, stars) {
    if (stars <= 0) {
      return {
        form: "Egg",
        text: "Unhatched egg (0 stars): render ONLY a smooth 3D egg tinted in the creature's own colours, with faint speckles and a soft top-left sheen — no limbs, no face, not yet hatched.",
      };
    }
    const ratio = Math.min(1, stars / 15);
    let morph = this.MORPHOLOGY[0];
    this.MORPHOLOGY.forEach(m => { if (ratio >= m.at) { morph = m; } });

    return {
      form: morph.form,
      text: `${morph.form} (rank ${stars}, stage ${stage} of ${maxStage}): ${morph.body} ${this.monsterLine(Math.max(0, (stars - 10) / 5))}`,
    };
  },

  //PoW as visible intensity rather than trivia: the earned part of the creature.
  powFlavor(pow) {
    if (pow.foundBlock) { return "This specimen mined a valid block: it wears a crown of solid light no other can fake, and should read as legendary."; }
    if (pow.zeros >= 10) { return "Its proof of work is exceptional: the energy around it is dense, bright and clearly visible."; }
    if (pow.zeros >= 7)  { return "Its proof of work is notable: a faint but steady halo surrounds it."; }
    if (pow.zeros >= 5)  { return "Its proof of work is modest: only a weak glow at the edges."; }
    return "It has not yet proven its work: no halo, a raw and unpolished look.";
  },

  typeLine(types) {
    if (types.fusion) {
      const variant = types.subtype ? `, ${types.subtype} variant` : "";
      return `${types.fusion} type (fusion of ${types.primary.name} + ${types.secondary.name})${variant}`;
    }
    if (types.secondary) {
      return `dual ${types.primary.name}/${types.secondary.name} type, ${types.subtype} variant`;
    }
    return `${types.primary.name} type, ${types.subtype} variant`;
  },

  typeFlavor(types) {
    if (types.fusionFlavor) { return types.fusionFlavor; }
    if (types.fusion && types.secondary) {
      const def = HashimonTypeUtils.resolveFusion(types.primary.key, types.secondary.key);
      if (def?.flavor) { return def.flavor; }
    }
    return HashimonTypeUtils.subtypeFlavor(types.primary.key, types.subtype);
  },

  //"a" vs "an" from the following word's first sound (letter heuristic is enough
  //for our controlled vocabulary).
  article(word) {
    return /^[aeiou]/i.test(word) ? "an" : "a";
  },

  starLine(stars) {
    return "★".repeat(stars) + "☆".repeat(Math.max(0, 5 - stars)) + ` (${stars}-star rarity)`;
  },

  //Preview a Hashimon at a specific earned tier (for album slot prompts).
  toPromptAtTier(hashimon, tier, styleKey = "creature") {
    const clone = JSON.parse(JSON.stringify(hashimon));
    const bits = tier * HashimonConfig.bitsPerStar;
    clone.pow = { ...clone.pow, bestShareBits: bits };
    const tail = (clone.pow.bestShareHash || "abcd1234").replace(/^0+/, "") || "a";
    clone.pow.bestShareHash = "0".repeat(tier) + tail;
    clone.stage = Math.max(1, tier);
    return this.toPrompt(clone, styleKey);
  },

  //--- Prose prompt -------------------------------------------------------
  toPrompt(hashimon, styleKey = "creature") {
    const c = HashimonCompiler.compile(hashimon);
    const {look, types, pow} = c;
    const style = this.STYLES[styleKey] || this.STYLES.creature;
    const maturity = this.maturityBlock(c.stage, c.maxStage, c.stars);

    return [
`Generate an image of "${c.name}", a creature called a Hashimon.`,
``,
`SPECIES & BODY`,
`${this.article(look.archetype) === "an" ? "An" : "A"} ${look.archetype}, ${look.posture}, ${look.build}, ${look.size}.`,
`${maturity.text}`,
``,
`ELEMENT`,
`It is ${this.article(this.typeLine(types))} ${this.typeLine(types)}. ${this.typeFlavor(types)} Its body shows ${look.material}, and it stands out for ${look.feature}. Around it: ${look.aura}.`,
``,
`COLOR (exact, do not substitute)`,
`Dominant color ${look.color.base.name} ${look.color.base.hex} (HSL ${look.color.base.h}, ${look.color.base.s}%, ${look.color.base.l}%).`,
`Accent color ${look.color.accent.name} ${look.color.accent.hex}, in a ${look.color.relation} scheme.`,
`The accent appears in the eyes and in ${look.feature}.`,
``,
`TRAITS`,
`It has ${look.eyes}. Its skin shows ${look.marking}. Its manner is ${look.temperament}.`,
`Rarity: ${this.starLine(c.stars)} — the rarer it is, the more ornate and detailed.`,
``,
`PROOF OF WORK`,
`${this.powFlavor(pow)}`,
``,
`STYLE`,
`${style.directive}`,
``,
`Do not include any text, watermark or signature in the image.`,
``,
`— DNA ${c.dna.slice(0, 16)}… · ${maturity.form} · ${c.stars}★`,
    ].join("\n");
  },

  //--- Values sheet -------------------------------------------------------
  toValues(hashimon) {
    const c = HashimonCompiler.compile(hashimon);
    return JSON.stringify({
      Name: c.name,
      DNA: c.dna,
      Stars: c.stars,
      Type: c.types.fusion
        ? c.types.fusion
        : (c.types.secondary ? [c.types.primary.name, c.types.secondary.name] : c.types.primary.name),
      Subtype: c.types.subtype,
      Stage: `${c.stage}/${c.maxStage}`,
      Look: {
        archetype: c.look.archetype,
        build: c.look.build,
        posture: c.look.posture,
        size: c.look.size,
        eyes: c.look.eyes,
        markings: c.look.marking,
        manner: c.look.temperament,
        material: c.look.material,
        feature: c.look.feature,
        aura: c.look.aura,
        baseColor: c.look.color.base.hex,
        accentColor: c.look.color.accent.hex,
        scheme: c.look.color.relation,
      },
      Stats: c.stats,
      PoW: {
        template: c.pow.templateId,
        nonce: c.pow.birthNonce,
        bestShare: c.pow.bestShareDifficulty,
        shares: c.pow.validShares,
        blockMined: c.pow.foundBlock,
      },
    }, null, 2);
  },

}
