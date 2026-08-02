//Procedural people. Composites an ordered stack of 128x128 sheets (4x4 grid of
//32x32 frames) and recolors each by palette zone, driven by a deterministic seed.
//
//Base art lives in images/characters/people/crypto/ — crypto/miner aesthetic,
//not the legacy Pizza Legends chef sheets.

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

window.PersonPalette = {
  classify(r, g, b) {
    const {h, s, l} = PersonPalette.rgbToHsl(r, g, b);
    const hd = h * 360;
    if (l < 0.12) { return "outline"; }
    if (s < 0.15 && l > 0.55) { return "neutral"; }
    if (s < 0.15) { return "neutral"; }
    //Terminal greens / cyans / visors
    if (hd >= 95 && hd <= 175 && s > 0.35) { return "accent"; }
    if (hd >= 10 && hd <= 50 && l >= 0.42) { return "skin"; }
    if (hd >= 10 && hd <= 50 && l < 0.42) { return "hair"; }
    if (hd >= 25 && hd <= 45 && s > 0.5 && l > 0.45) { return "accent"; } //gold/orange badges
    if (hd >= 270 && hd <= 330 && s > 0.35) { return "accent"; }           //purple boss trim
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

const CRYPTO_TEMPLATES = [
  "/images/characters/people/crypto/explorer.png",
  "/images/characters/people/crypto/miner.png",
  "/images/characters/people/crypto/hacker.png",
  "/images/characters/people/crypto/node.png",
  "/images/characters/people/crypto/trader.png",
  "/images/characters/people/crypto/validator.png",
  "/images/characters/people/crypto/boss.png",
];

window.PersonLayers = [
  {
    name: "base",
    options: CRYPTO_TEMPLATES,
    tint: {
      outfit:  { hue: [0.28, 0.62], sat: [0.85, 1.1], lum: [0.88, 1.05] },
      accent:  { hue: [0.30, 0.55], sat: [0.9, 1.2], lum: [0.92, 1.08] },
      hair:    { hue: [0.02, 0.12], sat: [0.7, 1.1], lum: [0.85, 1.05] },
      skin:    { hueDelta: [-0.03, 0.05], lum: [0.92, 1.06] },
      neutral: { hue: [0.45, 0.65], satAdd: [0, 0.12], lum: [0.85, 0.98] },
    },
  },
]

window.PersonGenerator = {
  sheets: {},
  cache: {},

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

  seedFor(mapId, objectId) {
    return `${mapId || "map"}_${objectId || "person"}`;
  },

  //Stable template pick from seed (boss trainers can force boss template via config)
  templateForSeed(seed, forcedTemplate) {
    if (forcedTemplate) {
      const path = `/images/characters/people/crypto/${forcedTemplate}.png`;
      if (CRYPTO_TEMPLATES.includes(path)) { return path; }
    }
    const rng = mulberry32(hashSeed(seed));
    return CRYPTO_TEMPLATES[Math.floor(rng() * CRYPTO_TEMPLATES.length)];
  },

  resolvePerson(config, mapId, objectId) {
    if (config.src) { return config.src; }

    let seed = config.personSeed;
    if (config.isPlayerControlled && window.playerState?.personSeed) {
      seed = window.playerState.personSeed;
      return this.generate(seed, config.template || "explorer");
    }
    if (!seed) {
      seed = this.seedFor(mapId, objectId);
    }

    return this.generate(seed, config.template);
  },

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
      if (!rule) { continue; }

      let {h, s, l} = PersonPalette.rgbToHsl(px[i], px[i + 1], px[i + 2]);
      h = rule.hue !== null ? (rule.hue + h * 0.12) % 1 : (h + rule.hueDelta + 1) % 1;
      s = Math.min(1, Math.max(0, s * rule.sat + rule.satAdd));
      l = Math.min(1, Math.max(0, l * rule.lum));

      const [r, g, b] = PersonPalette.hslToRgb(h, s, l);
      px[i] = r; px[i + 1] = g; px[i + 2] = b;
    }
    ctx.putImageData(image, 0, 0);
    return canvas;
  },

  build(seed, forcedTemplate) {
    const rng = mulberry32(hashSeed(seed));
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");

    const used = [];
    PersonLayers.forEach(layer => {
      const src = forcedTemplate
        ? this.templateForSeed(seed, forcedTemplate)
        : CRYPTO_TEMPLATES[Math.floor(rng() * CRYPTO_TEMPLATES.length)];
      if (!src) { return; }
      const img = this.sheets[src];
      if (!img) { throw new Error("PersonGenerator.preload() no se ha completado"); }
      ctx.drawImage(this.recolor(img, this.planFor(layer, rng)), 0, 0);
      used.push({ layer: layer.name, src });
    })
    return { canvas, used };
  },

  generate(seed, forcedTemplate) {
    const key = `${seed}:${forcedTemplate || ""}`;
    if (this.cache[key]) { return this.cache[key]; }
    const {canvas} = this.build(seed, forcedTemplate);
    const src = canvas.toDataURL();
    this.cache[key] = src;
    return src;
  },

  generateMany(count, seedPrefix = "person") {
    return Array.from({length: count}, (_, i) => ({
      seed: `${seedPrefix}_${i}`,
      src: this.generate(`${seedPrefix}_${i}`),
    }));
  },
}
