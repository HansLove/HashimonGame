//Draws crypto person spritesheets (128x128, 4x4 grid of 32x32 frames) and
//exports PNGs. Run once: node tools/exportCryptoPeople.js
//
//Grid matches Sprite.js: col= direction (down,right,up,left), row0=idle,
//rows1-3=walk frames for that direction.

const fs = require("fs");
const path = require("path");
const { createCanvas } = require("canvas");

const OUT = path.join(__dirname, "../images/characters/people/crypto");

const C = {
  outline: "#1a1428",
  skin: "#d4a574",
  skinLight: "#e8c49a",
  hair: "#3a2a1a",
  outfitDark: "#2a2438",
  outfitMid: "#3d3550",
  green: "#7cff9a",
  greenDark: "#4a9e62",
  orange: "#f7931a",
  purple: "#9b05a8",
  purpleDark: "#6a0475",
  cyan: "#5ad4e8",
  gold: "#ffd76a",
  grey: "#8a8498",
  white: "#e8e4f0",
  visor: "#00ff88",
  lamp: "#ffe566",
};

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function drawFrame(ctx, ox, oy, dir, walkFrame, archetype) {
  const cx = ox + 16;
  const cy = oy + 22;
  const bob = walkFrame === 1 ? -1 : walkFrame === 2 ? 0 : walkFrame === 3 ? 1 : 0;
  const y = cy + bob;

  const put = (x, yp, color, w = 1, h = 1) => {
    ctx.fillStyle = color;
    ctx.fillRect(ox + x, oy + yp, w, h);
  };

  const isUp = dir === 2;
  const isSide = dir === 1 || dir === 3;
  const flip = dir === 3;

  const drawMirrored = (lx, ly, color, w = 1, h = 1) => {
    const x = flip ? 31 - lx - w + 1 : lx;
    put(x, ly, color, w, h);
  };

  //Shadow feet
  put(12, 28, "#00000044", 8, 2);

  //Legs
  drawMirrored(13, y + 4, C.outfitDark, 2, 4);
  drawMirrored(17, y + 4, C.outfitDark, 2, 4);
  if (walkFrame % 2 === 1 && walkFrame > 0) {
    drawMirrored(13 + (walkFrame === 1 ? -1 : 1), y + 5, C.outfitMid, 2, 3);
  }

  //Body
  const bodyW = archetype === "boss" ? 12 : 10;
  const bodyX = 16 - Math.floor(bodyW / 2);
  put(bodyX, y - 2, C.outfitDark, bodyW, 8);
  put(bodyX + 1, y - 1, C.outfitMid, bodyW - 2, 6);

  //Archetype details on torso
  if (archetype === "explorer") {
    put(14, y, C.green, 4, 3);
    put(15, y + 1, C.outfitDark, 2, 1);
    put(22, y - 1, C.outfitDark, 4, 6);
    put(23, y, C.greenDark, 2, 2);
  } else if (archetype === "miner") {
    put(13, y, C.orange, 6, 5);
    put(14, y + 1, C.outfitDark, 4, 2);
  } else if (archetype === "hacker") {
    put(13, y, C.outfitDark, 6, 6);
    put(14, y + 1, C.greenDark, 4, 3);
  } else if (archetype === "node") {
    put(13, y, C.cyan, 6, 5);
    put(14, y + 1, C.outfitDark, 4, 2);
    put(12, y - 3, C.cyan, 1, 4);
    put(19, y - 3, C.cyan, 1, 4);
  } else if (archetype === "trader") {
    put(12, y - 1, C.outfitMid, 8, 7);
    put(15, y + 2, C.gold, 2, 2);
  } else if (archetype === "validator") {
    put(13, y, C.purpleDark, 6, 6);
    put(14, y + 1, C.purple, 4, 3);
    put(15, y + 2, C.gold, 2, 1);
  } else if (archetype === "boss") {
    put(11, y - 2, C.purpleDark, 10, 9);
    put(13, y, C.purple, 6, 5);
    put(15, y + 1, C.gold, 2, 2);
  }

  //Arms
  const armSwing = walkFrame === 1 ? -1 : walkFrame === 3 ? 1 : 0;
  drawMirrored(11 + armSwing, y, C.outfitMid, 2, 4);
  drawMirrored(19 - armSwing, y, C.outfitMid, 2, 4);

  if (isUp) {
    //Back view: hood/hair, no face
    put(13, y - 10, C.hair, 6, 4);
    if (archetype === "hacker") put(12, y - 11, C.outfitDark, 8, 5);
    if (archetype === "miner") {
      put(12, y - 12, C.orange, 8, 3);
      put(14, y - 13, C.lamp, 4, 2);
    }
    return;
  }

  //Head
  put(13, y - 9, C.skin, 6, 5);
  put(14, y - 10, C.skinLight, 4, 2);

  //Hair / headgear by archetype
  if (archetype === "miner") {
    put(12, y - 13, C.orange, 8, 4);
    put(14, y - 14, C.lamp, 4, 2);
    if (!isSide) put(15, y - 13, C.lamp, 2, 1);
  } else if (archetype === "hacker") {
    put(12, y - 12, C.outfitDark, 8, 4);
    put(13, y - 8, C.visor, 6, 2);
  } else if (archetype === "node") {
    put(13, y - 12, C.grey, 6, 3);
    put(11, y - 11, C.cyan, 2, 1);
    put(19, y - 11, C.cyan, 2, 1);
  } else if (archetype === "trader") {
    put(13, y - 12, C.hair, 6, 3);
    put(12, y - 11, C.outfitMid, 8, 2);
  } else if (archetype === "validator") {
    put(12, y - 12, C.purpleDark, 8, 4);
    put(14, y - 11, C.purple, 4, 2);
  } else if (archetype === "boss") {
    put(11, y - 13, C.purpleDark, 10, 5);
    put(13, y - 12, C.purple, 6, 3);
  } else {
    //explorer default
    put(13, y - 12, C.hair, 6, 3);
    put(12, y - 11, C.outfitMid, 8, 2);
  }

  //Face (front/side)
  if (!isSide) {
    put(14, y - 7, C.outline, 1, 1);
    put(17, y - 7, C.outline, 1, 1);
    put(15, y - 5, C.skin, 2, 1);
  } else {
    drawMirrored(15, y - 7, C.outline, 1, 1);
    drawMirrored(16, y - 6, C.skin, 1, 1);
  }
}

function buildSheet(archetype) {
  const canvas = createCanvas(128, 128);
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, 128, 128);

  for (let dir = 0; dir < 4; dir++) {
    for (let row = 0; row < 4; row++) {
      const walkFrame = row;
      drawFrame(ctx, dir * 32, row * 32, dir, walkFrame, archetype);
    }
  }
  return canvas;
}

const TEMPLATES = [
  "explorer", "miner", "hacker", "node", "trader", "validator", "boss",
];

if (!fs.existsSync(OUT)) {
  fs.mkdirSync(OUT, { recursive: true });
}

let ok = true;
for (const name of TEMPLATES) {
  try {
    const canvas = buildSheet(name);
    const buf = canvas.toBuffer("image/png");
    fs.writeFileSync(path.join(OUT, `${name}.png`), buf);
    console.log("Wrote", name + ".png");
  } catch (e) {
    ok = false;
    console.error("Failed", name, e.message);
  }
}

if (!ok) process.exit(1);
