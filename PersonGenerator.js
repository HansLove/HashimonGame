//Procedural people. Composites an ordered stack of 128x128 sheets (4x4 grid of
//32x32 frames) and recolors each by palette zone, driven by a deterministic seed.
//
//Today the stack has a single layer: a whole hand-drawn character sheet. The
//existing art is flat (every sprite has its own silhouette and palette), so
//shape variety comes from picking a different base, and colour variety from the
//zone tinting below. When per-part art exists (body / hair / top / hat as
//separate transparent sheets on the same grid), add them to PersonLayers and
//nothing else has to change: they just composite in order.

//Deterministic RNG so a seed always yields the same person across reloads.
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

function hashSeed(seed) {
  if (typeof seed === "number") { return seed >>> 0; }
  let h = 2166136261 >>> 0;
  for (let i = 0; i < String(seed).length; i++) {
    h ^= String(seed).charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

//Splits a pixel into a tintable zone. Thresholds were derived from the actual
//palettes of the ten source sheets: the only colour all of them share is the
//near-black outline, so everything else keys off hue/saturation/luminance.
window.PersonPalette = {
  classify(r, g, b) {
    const {h, s, l} = PersonPalette.rgbToHsl(r, g, b);
    const hd = h * 360;
    if (l < 0.10) { return "outline"; }                   //the real black linework
    if (s < 0.12) { return "neutral"; }                   //greys & whites: hats, aprons
    if (hd >= 10 && hd <= 50 && l >= 0.40) { return "skin"; }
    if (hd >= 10 && hd <= 50 && l < 0.40) { return "hair"; } //dark browns
    return "outfit";
  },

  rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0, s = 0;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) { h = ((g - b) / d + (g < b ? 6 : 0)) / 6; }
      else if (max === g) { h = ((b - r) / d + 2) / 6; }
      else { h = ((r - g) / d + 4) / 6; }
    }
    return {h, s, l};
  },

  hslToRgb(h, s, l) {
    if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return [
      Math.round(hue2rgb(p, q, h + 1/3) * 255),
      Math.round(hue2rgb(p, q, h) * 255),
      Math.round(hue2rgb(p, q, h - 1/3) * 255),
    ];
  },
}

//The layer stack. `tint` maps a palette zone to how far it may drift.
//A zone left out of `tint` is passed through untouched (outline always is).
window.PersonLayers = [
  {
    name: "base",
    options: [
      "/images/characters/people/hero.png",
      "/images/characters/people/erio.png",
      "/images/characters/people/npc1.png",
      "/images/characters/people/npc2.png",
      "/images/characters/people/npc3.png",
      "/images/characters/people/npc4.png",
      "/images/characters/people/npc5.png",
      "/images/characters/people/npc7.png",
      "/images/characters/people/npc8.png",
      "/images/characters/people/secondBoss.png",
    ],
    tint: {
      //hue: absolute rotation range (0..1). sat/lum: multipliers.
      outfit:  { hue: [0, 1], sat: [0.85, 1.15], lum: [0.9, 1.1] },
      hair:    { hue: [0, 1], sat: [0.7, 1.2] },
      //Skin only drifts a little, otherwise people turn green.
      skin:    { hueDelta: [-0.03, 0.05], lum: [0.9, 1.08] },
      //Whites stay mostly white; a faint tint keeps uniforms from looking cloned.
      neutral: { hue: [0, 1], satAdd: [0, 0.18] },
    },
  },
]

window.PersonGenerator = {
  sheets: {},   //src -> HTMLImageElement
  cache: {},    //seed -> dataURL

  //Must resolve before generate() can run. Safe to call repeatedly.
  async preload() {
    const srcs = [...new Set(PersonLayers.flatMap(l => l.options).filter(Boolean))];
    await Promise.all(srcs.map(src => new Promise((resolve, reject) => {
      if (this.sheets[src]) { return resolve(); }
      const img = new Image();
      img.onload = () => { this.sheets[src] = img; resolve(); }
      img.onerror = () => reject(new Error("No se pudo cargar " + src));
      img.src = src;
    })));
    return this;
  },

  //Rolls the concrete recolor for one layer from the seeded rng.
  planFor(layer, rng) {
    const plan = {};
    Object.keys(layer.tint || {}).forEach(zone => {
      const rule = layer.tint[zone];
      const pick = (range, fallback) => range
        ? range[0] + rng() * (range[1] - range[0])
        : fallback;
      plan[zone] = {
        hue: rule.hue ? pick(rule.hue) : null,
        hueDelta: rule.hueDelta ? pick(rule.hueDelta) : 0,
        sat: pick(rule.sat, 1),
        satAdd: pick(rule.satAdd, 0),
        lum: pick(rule.lum, 1),
      };
    })
    return plan;
  },

  recolor(img, plan) {
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const px = image.data;
    for (let i = 0; i < px.length; i += 4) {
      if (px[i + 3] < 200) { continue; }
      const zone = PersonPalette.classify(px[i], px[i + 1], px[i + 2]);
      const rule = plan[zone];
      if (!rule) { continue; }   //outline and anything unlisted stays as drawn

      let {h, s, l} = PersonPalette.rgbToHsl(px[i], px[i + 1], px[i + 2]);
      //An absolute hue repaints the zone; a delta nudges it off its original.
      h = rule.hue !== null ? (rule.hue + h * 0.15) % 1 : (h + rule.hueDelta + 1) % 1;
      s = Math.min(1, Math.max(0, s * rule.sat + rule.satAdd));
      l = Math.min(1, Math.max(0, l * rule.lum));

      const [r, g, b] = PersonPalette.hslToRgb(h, s, l);
      px[i] = r; px[i + 1] = g; px[i + 2] = b;
    }
    ctx.putImageData(image, 0, 0);
    return canvas;
  },

  //Returns a 128x128 canvas: the composited, recolored spritesheet.
  build(seed) {
    const rng = mulberry32(hashSeed(seed));
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");

    const used = [];
    PersonLayers.forEach(layer => {
      const src = layer.options[Math.floor(rng() * layer.options.length)];
      if (!src) { return; }
      const img = this.sheets[src];
      if (!img) { throw new Error("PersonGenerator.preload() no se ha completado"); }
      ctx.drawImage(this.recolor(img, this.planFor(layer, rng)), 0, 0);
      used.push({ layer: layer.name, src });
    })
    return { canvas, used };
  },

  //The API: a seed in, a spritesheet dataURL out. Feed it straight to Sprite's
  //`src`, which needs no changes. Same seed -> same person, across reloads.
  generate(seed) {
    if (this.cache[seed]) { return this.cache[seed]; }
    const {canvas} = this.build(seed);
    const src = canvas.toDataURL();
    this.cache[seed] = src;
    return src;
  },

  //Convenience for populating a crowd.
  generateMany(count, seedPrefix = "person") {
    return Array.from({length: count}, (_, i) => ({
      seed: `${seedPrefix}_${i}`,
      src: this.generate(`${seedPrefix}_${i}`),
    }));
  },
}
