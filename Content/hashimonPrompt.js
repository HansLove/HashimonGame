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
  MORPHOLOGY: [
    { at: 0.00, form: "Newborn form", body: "an oversized head on a small body, short stubby limbs, soft and rounded, endearing." },
    { at: 0.18, form: "Juvenile form", body: "growing into its proportions, limbs lengthening, its first real features emerging." },
    { at: 0.48, form: "Adult form", body: "fully grown and self-assured, defined musculature, a confident stance." },
    { at: 0.85, form: "Mythic form", body: "majestic proportions, elaborate ornamentation, an imposing presence." },
    { at: 1.00, form: "Sovereign form", body: "the absolute final stage: towering, fully realized, overwhelming." },
  ],

  monsterLine(score) {
    if (score < 0.15) { return "Keep it gentle and unthreatening: rounded shapes, nothing sharp."; }
    if (score < 0.35) { return "A few bold, confident features are beginning to show."; }
    if (score < 0.55) { return "Clearly capable, with some sharp edges and a hint of menace."; }
    if (score < 0.75) { return "Imposing: aggressive silhouette cues — spurs, ridges, a heavier jaw."; }
    if (score < 0.90) { return "Fearsome: extra spikes, battle-worn plating, a predatory stance."; }
    return "Full monster mode: oversized and many-featured, awe-inspiring and dangerous, the kind of creature myths warn about.";
  },

  //Stars ARE the tier (earned leading-zero nibbles), so the described form
  //evolves in lockstep with proven work — full monster by ~tier 6.
  maturityBlock(stage, maxStage, stars) {
    const ratio = Math.min(1, stars / 6);
    let morph = this.MORPHOLOGY[0];
    this.MORPHOLOGY.forEach(m => { if (ratio >= m.at) { morph = m; } });

    return {
      form: morph.form,
      text: `${morph.form} (rank ${stars}, stage ${stage} of ${maxStage}): ${morph.body} ${this.monsterLine(ratio)}`,
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
    if (types.fusion) { return `${types.fusion} type (a fusion of ${types.primary.name} and ${types.secondary.name})`; }
    if (types.secondary) { return `dual ${types.primary.name}/${types.secondary.name} type, ${types.subtype} variant`; }
    return `${types.primary.name} type, ${types.subtype} variant`;
  },

  //"a" vs "an" from the following word's first sound (letter heuristic is enough
  //for our controlled vocabulary).
  article(word) {
    return /^[aeiou]/i.test(word) ? "an" : "a";
  },

  starLine(stars) {
    return "★".repeat(stars) + "☆".repeat(Math.max(0, 5 - stars)) + ` (${stars}-star rarity)`;
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
`It is ${this.article(this.typeLine(types))} ${this.typeLine(types)}. Its body shows ${look.material}, and it stands out for ${look.feature}. Around it: ${look.aura}.`,
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
