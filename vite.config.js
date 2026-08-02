import { defineConfig } from "vite";

/** Legacy script-tag globals → globalThis for ESM migration. */
const GLOBAL_NAMES = [
  "utils",
  "GameObject", "Person", "HashimonStone", "Sprite",
  "DirectionInput", "KeyPressListener", "KeyboardMenu", "RevealingText",
  "TextMessage", "SceneTransition", "Overworld", "OverworldMap", "OverworldEvent",
  "MapGenerator", "PersonGenerator", "Progress", "SaveManager", "QuestManager",
  "TitleScreen", "Hud", "ObjectiveHud", "MapLabel", "PauseMenu",
  "HashimonCollection", "HashimonAlbumExport", "CraftingMenu",
  "Battle", "Combatant", "Team", "SubmissionMenu", "ReplacementMenu",
  "BattleEvent", "TurnCycle",
  "HashimonSystem", "HashimonCompiler", "HashimonDNA", "Hashimons", "HashimonNames",
  "HashimonMoves", "Actions", "Enemies", "Quests", "HashimonPrompt", "HashimonAlbum",
  "HashimonAlbumBridge", "HashimonSprite", "HashimonMining", "HashimonZones",
  "HashimonEncounters", "MapThemes", "MapLoader", "HashimonConfig",
  "playerState", "questManager", "saveManager",
];

const CONSTRUCTORS = GLOBAL_NAMES.filter(n => /^[A-Z]/.test(n));

function definedGlobals(code, id) {
  const defined = new Set();
  const classMatch = code.match(/class (\w+)/);
  if (classMatch) { defined.add(classMatch[1]); }
  if (id.endsWith("/utils.js")) { defined.add("utils"); }
  for (const m of code.matchAll(/(?:window|globalThis)\.(\w+)\s*=/g)) {
    defined.add(m[1]);
  }
  return defined;
}

function legacyGlobalsPlugin() {
  return {
    name: "hashimon-legacy-globals",
    transform(code, id) {
      if (!id.includes("/src/")) { return null; }
      if (id.endsWith("/main.js")) { return null; }
      if (id.includes(".data.js")) { return null; }

      let out = code;
      const defined = definedGlobals(out, id);

      out = out.replace(/extends GameObject\b/g, "extends globalThis.GameObject");

      for (const name of CONSTRUCTORS) {
        if (defined.has(name)) { continue; }
        out = out.replace(new RegExp(`\\bnew ${name}\\(`, "g"), `new globalThis.${name}(`);
      }

      for (const name of GLOBAL_NAMES) {
        if (defined.has(name)) { continue; }
        if (!new RegExp(`\\b${name}\\b`).test(out)) { continue; }
        out = out.replace(new RegExp(`\\b${name}\\.`, "g"), `globalThis.${name}.`);
        out = out.replace(new RegExp(`\\b${name}\\[`, "g"), `globalThis.${name}[`);
      }

      const classDef = out.match(/class (\w+)/);
      if (classDef && !new RegExp(`globalThis\\.${classDef[1]}\\s*=`).test(out)) {
        out += `\nglobalThis.${classDef[1]} = ${classDef[1]};\n`;
      }

      if (id.endsWith("/utils.js") && !out.includes("globalThis.utils = utils")) {
        out += "\nglobalThis.utils = utils;\n";
      }

      return { code: out, map: null };
    },
  };
}

export default defineConfig({
  root: ".",
  publicDir: "public",
  plugins: [legacyGlobalsPlugin()],
  server: {
    port: 8081,
    open: "/index.html",
  },
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        album: "album/index.html",
      },
    },
  },
});
