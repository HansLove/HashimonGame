// Headless exporter: runs the SAME HashimonSprite generator under a tiny fake
// canvas, and writes real PNGs to disk. No browser round-trip.
const fs = require("fs");
const zlib = require("zlib");
const path = require("path");

const GAME = "/Users/aarontolentino/Desktop/A-Hashimon/game";
const OUT = path.join(GAME, "landing-export");
const CREAT = path.join(OUT, "creatures");
fs.mkdirSync(CREAT, { recursive: true });

//--- colour parsing ---
function parseColor(c) {
  if (Array.isArray(c)) return c;
  if (c[0] === "#") {
    let h = c.slice(1);
    if (h.length === 3) h = h.split("").map(x => x + x).join("");
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 255];
  }
  const m = c.match(/rgba?\(([^)]+)\)/);
  if (m) { const p = m[1].split(",").map(s => parseFloat(s.trim())); return [p[0], p[1], p[2], p[3] === undefined ? 255 : Math.round(p[3] * 255)]; }
  return [0, 0, 0, 255];
}

//--- fake canvas/ctx that writes to an RGBA buffer, honouring ctx.scale ---
function makeCanvas() {
  let w = 0, h = 0, buf = null;
  let fill = [0, 0, 0, 255], sx = 1, sy = 1;
  const ctx = {
    imageSmoothingEnabled: false,
    set fillStyle(v) { fill = parseColor(v); },
    get fillStyle() { return fill; },
    scale(a, b) { sx = a; sy = b; },
    fillRect(x, y, fw, fh) {
      const X = Math.round(x * sx), Y = Math.round(y * sy), W = Math.round(fw * sx), H = Math.round(fh * sy);
      const [r, g, b, a] = fill, sa = a / 255;
      for (let yy = Y; yy < Y + H; yy++) for (let xx = X; xx < X + W; xx++) {
        if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
        const i = (yy * w + xx) * 4;
        const da = buf[i + 3] / 255, oa = sa + da * (1 - sa);
        buf[i] = Math.round((r * sa + buf[i] * da * (1 - sa)) / (oa || 1));
        buf[i + 1] = Math.round((g * sa + buf[i + 1] * da * (1 - sa)) / (oa || 1));
        buf[i + 2] = Math.round((b * sa + buf[i + 2] * da * (1 - sa)) / (oa || 1));
        buf[i + 3] = Math.round(oa * 255);
      }
    },
  };
  return {
    getContext: () => ctx,
    get width() { return w; }, set width(v) { w = v; if (w && h) buf = new Uint8ClampedArray(w * h * 4); },
    get height() { return h; }, set height(v) { h = v; if (w && h) buf = new Uint8ClampedArray(w * h * 4); },
    pixels() { return { buf, w, h }; },
  };
}

global.window = {};
global.document = { createElement: () => makeCanvas() };

//--- load the real game modules (order matters for globals) ---
for (const f of ["Content/hashimonDNA.js", "Content/hashimonTypes.js", "Content/hashimons.js",
  "Content/hashimonCompiler.js", "Content/hashimonSprite.js", "Content/hashimonSystem.js"]) {
  eval(fs.readFileSync(path.join(GAME, f), "utf8"));
}
Object.assign(global, global.window);

//--- minimal PNG encoder ---
const CRC = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(buf) { let c = 0xFFFFFFFF; for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const t = Buffer.from(type);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}
function encodePNG(buf, w, h) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; for (let x = 0; x < w * 4; x++) raw[y * (w * 4 + 1) + 1 + x] = buf[y * w * 4 + x]; }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

//--- render every species' canonical individual ---
const SCALE = 5; // 32 grid -> 160px
const manifest = [];
const rendered = {};
for (const key of Object.keys(Hashimons)) {
  const h = HashimonSystem.createInstance(key);           // canonical (species birthNonce)
  const c = HashimonCompiler.compile(h);
  const cv = HashimonSprite.render(h, { scale: SCALE, stage: 8 });
  const { buf, w } = cv.pixels();
  rendered[key] = { buf, w, h: w };
  const png = encodePNG(buf, w, w);
  fs.writeFileSync(path.join(CREAT, key + ".png"), png);
  manifest.push({
    key, name: h.name, species: h.species,
    type: c.types.primary.name, subtype: c.types.subtype, stars: c.stars,
    branch: h.branch, description: h.description, dna: c.dna, file: "creatures/" + key + ".png",
  });
}

//--- compose a sheet (grid) ---
const keys = Object.keys(rendered);
const cell = 160, cols = 4, rows = Math.ceil(keys.length / cols);
const SW = cols * cell, SH = rows * cell;
const sheet = new Uint8ClampedArray(SW * SH * 4);
keys.forEach((key, i) => {
  const { buf, w } = rendered[key];
  const ox = (i % cols) * cell, oy = Math.floor(i / cols) * cell;
  for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) {
    const s = (y * w + x) * 4, d = ((oy + y) * SW + (ox + x)) * 4;
    for (let k = 0; k < 4; k++) sheet[d + k] = buf[s + k];
  }
  const m = manifest.find(m => m.key === key);
  m.sheet = { col: i % cols, row: Math.floor(i / cols), x: ox, y: oy, w: cell, h: cell };
});
fs.writeFileSync(path.join(OUT, "hashimon-bestiary.png"), encodePNG(sheet, SW, SH));
fs.writeFileSync(path.join(OUT, "bestiary.json"), JSON.stringify({ tile: cell, cols, rows, sheet: "hashimon-bestiary.png", creatures: manifest }, null, 2));

console.log("wrote " + keys.length + " creature PNGs + sheet (" + SW + "x" + SH + ") + manifest to " + OUT);
console.log(keys.join(", "));
