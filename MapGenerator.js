//Endless procedural maps. The existing map art is bespoke full scenes, not
//tiles, so we can't collage them into infinite variety. Instead this generator
//draws 16px tiles by code into the lower/upper canvases the engine already
//blits, and computes the collision + transition data around them.
//
//generate(seed) is deterministic: the same seed always yields the same map, so
//the chain of maps is reproducible per run. It is asset-agnostic — swap the
//drawTile() bodies for hand-drawn tile PNGs later and nothing else changes.
window.MapGenerator = (function () {

  const TILE = 16;

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
  }
  function hashSeed(s) {
    let h = 2166136261 >>> 0;
    s = String(s);
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  //Each biome carries its palette AND the Hashimon zone it biases encounters
  //toward, so terrain and ecology agree (a forest yields plant/earth/fungus).
  const BIOMES = {
    meadow:  { name: "Meadow",  zone: "forest",
      floor: ["#7ec850", "#77c04a"], floorDark: "#5da33a",
      path: "#cbaa6e", pathDark: "#a8873f",
      wall: ["#9a9187", "#736a60"], water: "#4aa6d6", waterLite: "#7cc7e8",
      obstacle: "tree", oc: { a: "#6b4a2b", b: "#3f9e3f", c: "#2e7a2e" }, deco: "flower" },
    circuit: { name: "Circuit", zone: "circuit",
      floor: ["#2b3350", "#252c46"], floorDark: "#1b2138",
      path: "#2f6f7a", pathDark: "#1d4a52",
      wall: ["#5a6272", "#3f4655"], water: "#7cf05a", waterLite: "#aef58a",
      obstacle: "crystal", oc: { a: "#38e0d0", b: "#1f9c92", c: "#0f5e58" }, deco: "chip" },
    tide:    { name: "Tide",    zone: "tide",
      floor: ["#e6d8a8", "#ddce98"], floorDark: "#c9b578",
      path: "#cbb682", pathDark: "#a8925c",
      wall: ["#8a8f96", "#6d7278"], water: "#3f9fd6", waterLite: "#79c4e8",
      obstacle: "coral", oc: { a: "#e8748f", b: "#c04a6a", c: "#8f3350" }, deco: "shell" },
    astral:  { name: "Astral",  zone: "astral",
      floor: ["#2a2350", "#241d48"], floorDark: "#181236",
      path: "#4a3f7a", pathDark: "#2f2752",
      wall: ["#5a4f8a", "#3f376a"], water: "#140c28", waterLite: "#3a2c66",
      obstacle: "monolith", oc: { a: "#9a8ae0", b: "#5a4a9c", c: "#e8e0ff" }, deco: "star" },
    ember:   { name: "Ember",   zone: "ember",
      floor: ["#3a2e2b", "#342927"], floorDark: "#241c1a",
      path: "#5a4a42", pathDark: "#3a2e28",
      wall: ["#4a3f3a", "#332b28"], water: "#e0642a", waterLite: "#f5a24a",
      obstacle: "basalt", oc: { a: "#6b4038", b: "#3f2420", c: "#ff8a3a" }, deco: "ember" },
  };

  //Cheap deterministic per-tile noise so tile texture doesn't depend on the
  //order layout consumed the main RNG.
  function noise(seedInt, c, r, salt) {
    let h = (c * 374761393 + r * 668265263 + salt * 2147483647 + seedInt) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    return (h >>> 0) % 1000 / 1000;
  }

  const px = (ctx, x, y, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); };

  function drawFloor(ctx, b, si, c, r, x, y) {
    px(ctx, x, y, TILE, TILE, noise(si, c, r, 1) < 0.5 ? b.floor[0] : b.floor[1]);
    //a few darker specks for texture
    for (let i = 0; i < 3; i++) {
      const n = noise(si, c, r, 10 + i);
      if (n < 0.4) px(ctx, x + Math.floor(n * 40) % TILE, y + Math.floor(n * 130) % TILE, 1, 1, b.floorDark);
    }
  }

  function drawPath(ctx, b, si, c, r, x, y) {
    px(ctx, x, y, TILE, TILE, b.path);
    for (let i = 0; i < 4; i++) {
      const n = noise(si, c, r, 20 + i);
      if (n < 0.5) px(ctx, x + Math.floor(n * 53) % TILE, y + Math.floor(n * 91) % TILE, 1, 1, b.pathDark);
    }
  }

  function drawWall(ctx, b, si, c, r, x, y) {
    px(ctx, x, y, TILE, TILE, b.wall[1]);          //dark base
    px(ctx, x, y, TILE, TILE - 4, b.wall[0]);      //lit face
    px(ctx, x, y, TILE, 2, "rgba(255,255,255,0.10)"); //top highlight
    px(ctx, x, y + TILE - 4, TILE, 4, b.wall[1]);  //shadow lip
    px(ctx, x, y, 1, TILE, "rgba(0,0,0,0.15)");    //seam
  }

  function drawWater(ctx, b, si, c, r, x, y) {
    px(ctx, x, y, TILE, TILE, b.water);
    if (noise(si, c, r, 30) < 0.6) px(ctx, x + 2, y + 5, 6, 1, b.waterLite);
    if (noise(si, c, r, 31) < 0.6) px(ctx, x + 8, y + 10, 5, 1, b.waterLite);
  }

  function drawObstacle(ctx, b, si, c, r, x, y) {
    drawFloor(ctx, b, si, c, r, x, y);
    const k = b.obstacle;
    if (k === "tree") {
      px(ctx, x + 7, y + 10, 2, 5, b.oc.a);                 //trunk
      px(ctx, x + 3, y + 2, 10, 9, b.oc.c);                 //canopy shade
      px(ctx, x + 4, y + 1, 8, 8, b.oc.b);                  //canopy
      px(ctx, x + 6, y + 3, 3, 2, "rgba(255,255,255,0.25)");//highlight
    } else if (k === "crystal") {
      px(ctx, x + 6, y + 3, 4, 11, b.oc.c);
      px(ctx, x + 7, y + 2, 3, 12, b.oc.b);
      px(ctx, x + 7, y + 4, 1, 8, b.oc.a);
    } else if (k === "coral") {
      px(ctx, x + 6, y + 6, 4, 8, b.oc.b);
      px(ctx, x + 3, y + 8, 3, 5, b.oc.a);
      px(ctx, x + 10, y + 7, 3, 6, b.oc.a);
    } else if (k === "monolith") {
      px(ctx, x + 5, y + 1, 6, 14, b.oc.b);
      px(ctx, x + 6, y + 2, 4, 12, b.oc.a);
      px(ctx, x + 7, y + 4, 2, 3, b.oc.c);                  //glowing rune
    } else { //basalt
      px(ctx, x + 3, y + 6, 10, 8, b.oc.b);
      px(ctx, x + 4, y + 5, 8, 4, b.oc.a);
      if (noise(si, c, r, 40) < 0.5) px(ctx, x + 6, y + 11, 4, 2, b.oc.c); //ember glow
    }
  }

  function drawDeco(ctx, b, si, c, r, x, y) {
    drawFloor(ctx, b, si, c, r, x, y);
    const d = b.deco, cx = x + 7, cy = y + 8;
    if (d === "flower") { px(ctx, cx, cy, 2, 2, "#f2e14a"); px(ctx, cx - 1, cy, 1, 2, "#e85a7a"); px(ctx, cx + 2, cy, 1, 2, "#e85a7a"); }
    else if (d === "chip") { px(ctx, cx - 1, cy - 1, 4, 4, b.oc.b); px(ctx, cx, cy, 2, 2, b.oc.a); }
    else if (d === "shell") { px(ctx, cx, cy, 3, 3, "#f2d0d8"); px(ctx, cx + 1, cy + 1, 1, 1, "#c07890"); }
    else if (d === "star") { px(ctx, cx, cy - 1, 1, 3, "#e8e0ff"); px(ctx, cx - 1, cy, 3, 1, "#e8e0ff"); }
    else { px(ctx, cx, cy, 2, 2, "#ff8a3a"); px(ctx, cx, cy, 1, 1, "#ffd08a"); } //ember
  }

  function drawGrass(ctx, b, si, c, r, x, y) {
    drawFloor(ctx, b, si, c, r, x, y);
    //tall-grass tufts to read as an encounter patch
    const blade = b.floorDark;
    for (let i = 0; i < 5; i++) {
      const bx = x + 1 + (i * 3);
      const h = 4 + Math.floor(noise(si, c, r, 50 + i) * 4);
      px(ctx, bx, y + TILE - h, 1, h, blade);
    }
  }

  function drawExit(ctx, b, si, c, r, x, y) {
    drawPath(ctx, b, si, c, r, x, y);
    //a little gate: two posts + a glowing lintel
    px(ctx, x + 2, y + 2, 2, 12, b.wall[0]);
    px(ctx, x + 12, y + 2, 2, 12, b.wall[0]);
    px(ctx, x + 2, y + 1, 12, 2, b.oc.a);
    px(ctx, x + 5, y + 5, 6, 8, "rgba(255,255,255,0.18)");
  }

  const BLOCKING = { wall: 1, obstacle: 1, water: 1 };

  function generate(seed) {
    const si = hashSeed("endless:" + seed);
    const rng = mulberry32(si);
    const biomeKeys = Object.keys(BIOMES);
    const biomeKey = biomeKeys[Math.floor(rng() * biomeKeys.length)];
    const biome = BIOMES[biomeKey];

    const cols = 20 + Math.floor(rng() * 7);   // 20..26
    const rows = 15 + Math.floor(rng() * 4);    // 15..18
    const mid = Math.floor(cols / 2);

    const grid = [];
    for (let r = 0; r < rows; r++) { grid.push(new Array(cols).fill("floor")); }

    //Border walls, with a gap at the bottom (entrance) and an exit gate at top.
    for (let c = 0; c < cols; c++) { grid[0][c] = "wall"; grid[rows - 1][c] = "wall"; }
    for (let r = 0; r < rows; r++) { grid[r][0] = "wall"; grid[r][cols - 1] = "wall"; }
    grid[rows - 1][mid] = "floor";
    grid[0][mid] = "exit";

    //Carve a guaranteed corridor entrance -> exit so the map is never blocked.
    let cx = mid, cy = rows - 2;
    grid[cy][cx] = "path";
    while (cy > 1) {
      cy--;
      grid[cy][cx] = "path";
      if (rng() < 0.35) {
        const dir = rng() < 0.5 ? -1 : 1;
        const len = 1 + Math.floor(rng() * 3);
        for (let k = 0; k < len; k++) {
          const nx = cx + dir;
          if (nx > 1 && nx < cols - 2) { cx = nx; grid[cy][cx] = "path"; }
        }
      }
    }
    grid[1][mid] = "path";
    { let x = cx; const step = x < mid ? 1 : -1; while (x !== mid) { x += step; grid[1][x] = "path"; } }

    const nearPath = (r, c) => {
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        if (grid[r + dr] && grid[r + dr][c + dc] === "path") { return true; }
      }
      return false;
    };

    //Scatter obstacles, keeping the corridor and its shoulders clear.
    const density = 0.12 + rng() * 0.10;
    for (let r = 2; r < rows - 1; r++) for (let c = 1; c < cols - 1; c++) {
      if (grid[r][c] !== "floor") { continue; }
      if (nearPath(r, c) && rng() < 0.75) { continue; }
      const n = rng();
      if (n < density) { grid[r][c] = rng() < 0.72 ? "obstacle" : "water"; }
      else if (n < density + 0.09) { grid[r][c] = "deco"; }
    }

    //Encounter patches on walkable ground.
    const encounters = [];
    let want = 2 + Math.floor(rng() * 3);
    let guard = 0;
    while (want > 0 && guard++ < 300) {
      const r = 2 + Math.floor(rng() * (rows - 4));
      const c = 1 + Math.floor(rng() * (cols - 2));
      if (grid[r][c] === "floor" || grid[r][c] === "deco") { grid[r][c] = "grass"; encounters.push([c, r]); want--; }
    }

    //--- Render ---
    const lower = document.createElement("canvas");
    lower.width = cols * TILE; lower.height = rows * TILE;
    const lctx = lower.getContext("2d");
    const upper = document.createElement("canvas");
    upper.width = cols * TILE; upper.height = rows * TILE;   //kept transparent

    const walls = {};
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const t = grid[r][c], x = c * TILE, y = r * TILE;
      if (t === "wall") { drawWall(lctx, biome, si, c, r, x, y); }
      else if (t === "path") { drawPath(lctx, biome, si, c, r, x, y); }
      else if (t === "water") { drawWater(lctx, biome, si, c, r, x, y); }
      else if (t === "obstacle") { drawObstacle(lctx, biome, si, c, r, x, y); }
      else if (t === "deco") { drawDeco(lctx, biome, si, c, r, x, y); }
      else if (t === "grass") { drawGrass(lctx, biome, si, c, r, x, y); }
      else if (t === "exit") { drawExit(lctx, biome, si, c, r, x, y); }
      else { drawFloor(lctx, biome, si, c, r, x, y); }

      if (BLOCKING[t]) { walls[utils.asGridCoord(c, r)] = true; }
    }

    //--- Cutscene spaces: exit -> next map, grass -> biome-biased encounter ---
    const cutsceneSpaces = {};
    cutsceneSpaces[utils.asGridCoord(mid, 0)] = [{
      events: [{ type: "nextEndlessMap", seed: seed + 1 }],
    }];
    encounters.forEach(([c, r]) => {
      cutsceneSpaces[utils.asGridCoord(c, r)] = [{
        events: [
          { type: "textMessage", text: "A wild Hashimon appeared!" },
          { type: "wildEncounter", zone: biome.zone },
        ],
      }];
    });

    const entrance = { x: utils.withGrid(mid), y: utils.withGrid(rows - 2) };
    return {
      id: "endless_" + seed,
      seed,
      biome: biomeKey,
      biomeName: biome.name,
      isEndless: true,
      lowerImage: lower,
      upperImage: upper,
      walls,
      entrance,
      configObjects: {
        hero: { type: "Person", isPlayerControlled: true, x: entrance.x, y: entrance.y, direction: "up" },
      },
      cutsceneSpaces,
    };
  }

  return { BIOMES, generate };
})();
