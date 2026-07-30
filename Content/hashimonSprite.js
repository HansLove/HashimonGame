//The visual compiler. Where HashimonPrompt turns a Hashimon's DNA into words for
//the player's own AI, this turns the SAME DNA into pixels directly — so the game
//and the site have art today, with no external model in the loop.
//
//Every pixel is a function of the DNA: silhouette from the species archetype,
//palette from the DNA hue window, markings/eyes/features from DNA positions,
//element motif from the type, ornament from the star rating, body proportions
//from the evolution stage. The sprite therefore AGREES with the prompt — two
//renderers (the player's AI and this one) describing one verifiable creature.
//
//It is a bounded parts kit x infinite DNA variation: the parts are drawn in code
//now and are asset-agnostic — a species can later point at hand-drawn or
//AI-made art without changing any of this.
window.HashimonSprite = (function () {

  const BASE = 32;   //internal pixel grid; output is scaled from this

  //--- colour helpers ---
  const hx = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  const parse = (hex) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
  function shade(hex, f) { const [r, g, b] = parse(hex); return "#" + hx(r * f) + hx(g * f) + hx(b * f); }
  function mix(a, b, t) { const A = parse(a), B = parse(b); return "#" + hx(A[0] + (B[0] - A[0]) * t) + hx(A[1] + (B[1] - A[1]) * t) + hx(A[2] + (B[2] - A[2]) * t); }

  //Archetype -> silhouette features. Grouped so 16 archetypes share a small,
  //readable set of head/ear/tail traits.
  function features(archetype) {
    const F = {
      feline:     { ear: "pointy", tail: 1, arms: 1 },
      canine:     { ear: "pointy", tail: 1, arms: 1 },
      lion:       { ear: "round",  tail: 1, arms: 1, mane: 1 },
      rodent:     { ear: "round",  tail: 1, arms: 1 },
      ursine:     { ear: "round",  tail: 0, arms: 1 },
      primate:    { ear: "round",  tail: 1, arms: 1 },
      chiropteran:{ ear: "bat",    tail: 0, arms: 0, wings: 1 },
      bird:       { ear: "none",   tail: 1, arms: 0, beak: 1, wings: 1 },
      deer:       { ear: "antler", tail: 0, arms: 1 },
      insect:     { ear: "antennae", tail: 0, arms: 1, wings: 1 },
      reptile:    { ear: "none",   tail: 1, arms: 1 },
      amphibian:  { ear: "none",   tail: 0, arms: 1 },
      chelonian:  { ear: "none",   tail: 1, arms: 1, shell: 1 },
      cephalopod: { ear: "none",   tail: 0, arms: 0, tentacles: 1 },
      crustacean: { ear: "antennae", tail: 0, arms: 1, claws: 1 },
      serpentine: { ear: "none",   tail: 1, arms: 0 },
      equine:     { ear: "pointy", tail: 1, arms: 1 },
    };
    return F[archetype] || F.feline;
  }

  //Type -> element motif drawn in the accent colour. Sixteen types share ~a dozen
  //motifs; `where` places them (crown = above head, aura handled separately).
  const MOTIF = {
    fuego: "flame", plasma: "flame", ember: "flame",
    agua: "drop", tide: "drop",
    electrico: "spark",
    tierra: "rock",
    aire: "swirl",
    astro: "star", mental: "orb", sueno: "orb", magia: "sigil",
    pixel: "glitch",
    metal: "antenna", robot: "antenna",
    vegetal: "leaf", hongo: "cap",
    onda: "rings",
  };

  //Deterministic little int stream from the DNA so placement jitter is stable.
  function stream(dna) {
    let i = 0;
    return () => {
      const v = parseInt(dna[i % dna.length] + dna[(i + 1) % dna.length], 16);
      i += 2;
      return v / 255;
    };
  }

  function render(input, opts = {}) {
    const scale = opts.scale || 4;
    //Accept a compiled spec, or a live Hashimon (compile it).
    const spec = input.look ? input : HashimonCompiler.compile(input);
    //The creature's EARNED tier (leading-zero nibbles of its best share == stars)
    //drives its evolution, on a scale where ~tier 6 is a full monster. opts.tier
    //can force a form for previews/galleries.
    const tier = opts.tier != null ? opts.tier : (spec.stars || 0);
    const dna = spec.dna;
    const rnd = stream(dna);

    const base = spec.look.color.base.hex;
    const accent = spec.look.color.accent.hex;
    const outline = shade(base, 0.35);
    const belly = mix(base, "#ffffff", 0.28);
    const shadow = shade(base, 0.72);
    const f = features(spec.look.archetype);
    const typeKey = spec.types.primary.key;
    const motif = MOTIF[typeKey] || "orb";

    //Evolution is SLOW: an egg at tier 0, a small child by ~tier 5, an adult by
    //~12-13, a full spiky monster only near tier 15. Stretched so 5 stars is
    //still a child, not a monster.
    const evo = Math.min(1, tier / 15);              // overall growth (0..1)
    const monster = Math.max(0, Math.min(1, (tier - 10) / 5)); // spikes/fangs: tier 11..15
    const ratio = evo;

    const cv = document.createElement("canvas");
    cv.width = BASE * scale; cv.height = BASE * scale;
    const ctx = cv.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.scale(scale, scale);

    const C = 16; //horizontal centre
    //a pixel plotter with left/right mirroring for a coherent front view
    const put = (x, y, color, noMirror) => {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 1, 1);
      if (!noMirror && x !== C) { ctx.fillRect(2 * C - x - 1, y, 1, 1); }
    };
    const disc = (cx, cyy, rx, ry, color) => {
      for (let y = -ry; y <= ry; y++) {
        const hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y / ry) * (y / ry))));
        for (let x = -hw; x <= hw; x++) { put(cx + x, cyy + y, color, true); }
      }
    };

    //--- Tier 0: an unhatched egg in the creature's own colours (no creature yet) ---
    if (tier <= 0) {
      drawEgg(put, disc, C, base, accent, outline, rnd);
      return cv;
    }

    //--- body proportions from the earned tier (stretched: child small, monster huge) ---
    const growth = 0.28 + 0.72 * evo;                // small child .. towering monster
    const rx = Math.round(3 + growth * 8 + monster * 1.5 + (rnd() - 0.5) * 1.0);
    const ry = Math.round(3 + growth * 9);
    const cy = 22 - Math.round(growth * 4);
    const headBig = tier <= 6;                        // big cute head through the child years
    const eyeR = headBig ? 3 : 2;                     // children get big eyes

    //--- aura (behind), intensity from the earned tier (proven work) ---
    const auraStrength = Math.min(1, tier / 12);
    if (auraStrength > 0.05) {
      const ar = rx + 3 + Math.round(auraStrength * 2);
      for (let a = 0; a < 26; a++) {
        const ang = a / 26 * Math.PI * 2;
        const x = Math.round(C + Math.cos(ang) * ar);
        const y = Math.round(cy + Math.sin(ang) * (ar - 1));
        if (rnd() < 0.35 + auraStrength * 0.5) { put(x, y, mix(accent, "#ffffff", 0.3), true); }
      }
    }

    //--- wings / shell behind body ---
    if (f.wings) {
      disc(C - rx - 2, cy - 2, 3, 5, shade(accent, 0.8));
      disc(C + rx + 2, cy - 2, 3, 5, shade(accent, 0.8));
    }
    if (f.shell) { disc(C, cy - 1, rx + 1, ry + 1, shade(accent, 0.7)); }

    //--- body ---
    disc(C, cy, rx + 1, ry + 1, outline);   //silhouette outline
    disc(C, cy, rx, ry, base);
    disc(C, cy + ry - 4, rx - 2, 4, belly);  //belly highlight
    //rim shade on the lower flanks
    for (let y = cy; y <= cy + ry; y++) { put(C - rx + 1, y, shadow, true); }

    //--- markings ---
    const mk = spec.look.marking;
    if (/stripe/i.test(mk)) {
      for (let y = cy - ry + 2; y <= cy + ry - 2; y += 3) {
        for (let x = 1; x < rx - 1; x++) { if ((x + y) % 2 === 0) put(C - x, y, shadow, true); }
      }
    } else if (/spot|speckl/i.test(mk)) {
      for (let s = 0; s < 6; s++) { put(C - Math.round(rnd() * (rx - 2)), cy - ry + 2 + Math.round(rnd() * (2 * ry - 4)), shadow, true); }
    } else if (/vein|hex|gradient|scar/i.test(mk)) {
      for (let y = cy - ry + 3; y <= cy + ry - 3; y += 2) put(C - Math.round(rnd() * (rx - 1)), y, shade(base, 0.85), true);
    }

    //--- ears / horns / crown ---
    const top = cy - ry;
    const ex = Math.round(rx * 0.55);
    if (f.mane) { disc(C, cy - 1, rx + 2, ry, shade(accent, 0.85)); disc(C, cy, rx, ry, base); disc(C, cy + ry - 4, rx - 2, 4, belly); }
    if (f.ear === "pointy") { for (let i = 0; i < 3; i++) { put(C - ex - i, top - i, base); put(C - ex - i, top - i + 1, base); } put(C - ex - 1, top - 2, accent); }
    else if (f.ear === "round") { disc(C - ex, top, 2, 2, base); disc(C - ex, top, 1, 1, mix(base, accent, 0.4)); }
    else if (f.ear === "antennae") { for (let i = 0; i < 3; i++) put(C - 2 - i, top - i - 1, outline); put(C - 4, top - 4, accent); }
    else if (f.ear === "antler") { for (let i = 0; i < 4; i++) put(C - ex, top - i, mix(base, "#fff", 0.2)); put(C - ex - 1, top - 3, mix(base, "#fff", 0.2)); put(C - ex - 2, top - 4, mix(base, "#fff", 0.2)); }
    else if (f.ear === "bat") { for (let i = 0; i < 4; i++) { put(C - ex - i, top - i, base); } }

    //--- eyes (style from the compiled 'eyes' trait) ---
    const eyeY = cy - Math.round(ry * (headBig ? 0.15 : 0.35));
    const eoff = Math.round(rx * 0.45);
    const eyes = spec.look.eyes;
    const drawEye = (style) => {
      if (/single|central/i.test(style)) {
        disc(C, eyeY, 3, 3, "#20202e"); disc(C, eyeY, 2, 2, accent); put(C - 1, eyeY - 1, "#ffffff");
      } else if (/narrow|calculating/i.test(style)) {
        for (let x = 0; x < 3; x++) put(C - eoff - x, eyeY, "#20202e");
      } else if (/compound|faceted|four/i.test(style)) {
        for (let dx = 0; dx < 2; dx++) for (let dy = 0; dy < 2; dy++) put(C - eoff - dx, eyeY - 1 + dy, dx + dy % 2 ? accent : "#20202e");
      } else if (/pupil-less|smooth/i.test(style)) {
        disc(C - eoff, eyeY, eyeR, eyeR, mix(accent, "#fff", 0.4));
      } else { //big round default (larger for babies)
        disc(C - eoff, eyeY, eyeR, eyeR, "#20202e"); put(C - eoff, eyeY, accent); put(C - eoff - 1, eyeY - 1, "#ffffff");
      }
    };
    drawEye(eyes);

    //mouth (grim/fanged only once it's turning monster, ~tier 12+)
    if (monster > 0.4) { for (let x = -1; x <= 1; x++) put(C + x, eyeY + 4, "#20202e", true); put(C - 1, eyeY + 3, "#20202e"); }
    else { put(C, eyeY + 4, shade(base, 0.5)); }

    //--- limbs ---
    if (f.arms) { disc(C - rx, cy + 2, 1, 2, base); }
    disc(C - Math.round(rx * 0.5), cy + ry, 2, 1, shade(base, 0.8)); //feet
    if (f.tail) { for (let i = 0; i < 4; i++) put(C - rx - 1 - i, cy + ry - 1 - i, base, true); }
    if (f.tentacles) { for (let t = 0; t < 3; t++) for (let i = 0; i < 3; i++) put(C - 4 + t * 4 % (rx), cy + ry + i, base, true); }

    //--- element motif in accent ---
    drawMotif(put, disc, motif, C, top, cy, ry, rx, accent, base, rnd);

    //--- monster spikes: only in the last tiers (~11-15) ---
    if (monster > 0.15) {
      const spikeH = 1 + Math.round(monster * 3);
      for (let x = 1; x < rx - 1; x += 3) {
        for (let s = 1; s <= spikeH; s++) { put(C - x, cy - ry - s, shade(accent, 0.9), true); }
      }
    }

    //--- power glyph (primary move) bottom-left, small ---
    const speciesKey = input.speciesKey;
    const move = (window.HashimonMoves && speciesKey)
      ? HashimonMoves.primaryMove(speciesKey, Hashimons[speciesKey])
      : (input.moves && input.moves[0]);
    drawPowerGlyph(ctx, move, accent);

    return cv;
  }

  //Tier 0 = an unhatched egg: a smooth 3D-shaded egg in the creature's own base
  //colour, DNA-driven accent speckles, a top-left sheen and a soft shadow.
  function drawEgg(put, disc, C, base, accent, outline, rnd) {
    const ecy = 17, ery = 9, erx = 7;
    const rim = shade(base, 0.78), lite = mix(base, "#ffffff", 0.30), sheen = mix(base, "#ffffff", 0.55);
    //soft shadow on the ground
    disc(C, ecy + ery + 1, 5, 1, "rgba(0,0,0,0.22)");
    for (let y = -ery; y <= ery; y++) {
      const t = (y + ery) / (2 * ery);                       // 0 top .. 1 bottom
      //egg profile: pointed top, round bottom
      const w = Math.round(erx * Math.sqrt(Math.max(0, 1 - (y / ery) * (y / ery))) * (0.60 + 0.40 * t));
      for (let x = 0; x <= w; x++) {
        let col = base;
        if (y < -2 && x < w - 1) { col = lite; }              // lit upper body
        if (x >= w - 1) { col = rim; }                        // shaded rim
        put(C + x, ecy + y, col);
      }
      put(C + w + 1, ecy + y, outline);                      // outline
    }
    put(C, ecy - ery - 1, outline); put(C, ecy + ery + 1, outline);   //caps
    //3D sheen, top-left, only on one side
    disc(C - 2, ecy - 3, 2, 2, sheen);
    put(C - 3, ecy - 4, sheen, true);
    //accent speckles so eggs differ by DNA/type
    for (let i = 0; i < 6; i++) {
      const sx = Math.round((rnd() - 0.5) * erx * 1.6);
      const sy = Math.round(-1 + rnd() * (ery + 3));
      put(C + sx, ecy + sy, accent, true);
    }
  }

  function drawMotif(put, disc, motif, C, top, cy, ry, rx, accent, base, rnd) {
    const light = mix(accent, "#ffffff", 0.35);
    if (motif === "flame") { for (let i = 0; i < 3; i++) put(C, top - 1 - i, i ? accent : light); put(C - 1, top - 1, accent); }
    else if (motif === "drop") { put(C, top - 2, light); put(C, top - 1, accent); put(C - 1, top - 1, accent); }
    else if (motif === "spark") { for (let i = 0; i < 3; i++) put(C - rx - 1, cy - 3 + i * 2, i % 2 ? accent : light, true); }
    else if (motif === "rock") { disc(C - Math.round(rx * 0.6), top + 1, 1, 1, shade(base, 0.6)); disc(C, top, 1, 1, shade(base, 0.55)); }
    else if (motif === "swirl") { put(C, top - 2, light); put(C - 1, top - 2, accent); put(C - 1, top - 1, accent); }
    else if (motif === "star") { put(C, top - 3, light); put(C - 1, top - 2, accent); put(C, top - 2, light); }
    else if (motif === "orb") { disc(C, top - 2, 1, 1, light); }
    else if (motif === "sigil") { put(C, top - 3, accent); put(C - 1, top - 2, accent); put(C, top - 1, accent); }
    else if (motif === "glitch") { for (let i = 0; i < 4; i++) put(C - Math.round(rnd() * rx), cy - ry + Math.round(rnd() * ry * 2), i % 2 ? accent : light, true); }
    else if (motif === "antenna") { put(C, top - 3, "#20202e"); put(C, top - 2, "#20202e"); disc(C, top - 4, 1, 1, accent); }
    else if (motif === "leaf") { put(C, top - 2, light); put(C - 1, top - 1, accent); put(C + 1, top - 1, accent, true); }
    else if (motif === "cap") { disc(C, top, 4, 2, accent); for (let i = 0; i < 3; i++) put(C - 2 + i * 2, top - 1, light, true); }
    else if (motif === "rings") { for (let r = 3; r <= 5; r++) { const y = cy - ry - 1; put(C - r, y, accent, true); } }
  }

  function drawPowerGlyph(ctx, move, accent) {
    //A tiny 3x3 mark keyed to the primary power, bottom-left corner.
    ctx.fillStyle = accent;
    const gx = 2, gy = 27;
    const marks = {
      scratch:      [[0,0],[1,1],[2,2]],
      hashPulse:    [[1,0],[0,1],[2,1],[1,2]],
      strike:       [[0,1],[1,0],[1,1],[1,2],[2,1]],
      overclock:    [[0,0],[2,0],[1,1],[0,2],[2,2]],
      hashGlitch:   [[0,0],[1,0],[2,0],[1,1],[1,2]],
      genesisBlock: [[0,1],[1,0],[2,1],[1,2],[0,2],[2,2]],
      pixelBurst:   [[0,0],[1,0],[2,0],[0,2],[2,2]],
      emberClaw:    [[0,0],[1,1],[2,0],[1,2]],
      alloyRam:     [[0,1],[1,0],[2,1],[1,1],[2,2]],
      voltArc:      [[1,0],[0,1],[2,1],[1,2],[0,2]],
      tidalCrash:   [[0,1],[1,2],[2,1],[1,0],[2,2]],
      gustSlice:    [[0,0],[1,1],[2,2],[0,2]],
      starfall:     [[1,0],[0,1],[1,1],[2,1],[1,2]],
      mindProbe:    [[0,0],[2,0],[1,1],[0,2],[2,2]],
      dreamStep:    [[0,1],[2,1],[1,0],[1,2]],
      sporeCloud:   [[0,0],[1,0],[2,0],[0,1],[2,1]],
      rootGuard:    [[0,0],[0,2],[2,0],[2,2],[1,1]],
      leafDrain:    [[1,0],[0,1],[1,1],[2,1],[1,2]],
    };
    (marks[move] || [[1,1]]).forEach(([x, y]) => ctx.fillRect(gx + x, gy + y, 1, 1));
  }

  //Cache by DNA+stage+scale so the HUD/battle can ask repeatedly for free.
  const cache = {};
  return {
    render,
    toDataURL(input, opts = {}) {
      const key = (input.dna || "?") + ":" + (opts.stage || input.stage || 1) + ":" + (opts.scale || 4);
      if (cache[key]) { return cache[key]; }
      return (cache[key] = render(input, opts).toDataURL());
    },
  };
})();
