/**
 * Game entry — single ESM boot replacing index.html script tags.
 * Globals shim keeps legacy window.* access during migration.
 */
import "./engine/utils.js";
import "./content/hashimons.js";
import "./content/hashimonDNA.js";
import "./content/hashimonTypes.data.js";
import "./content/hashimonTypes.js";
import "./content/hashimonCompiler.js";
import "./content/actions.js";
import "./content/hashimonMoves.js";
import "./content/hashimonNames.js";
import "./content/hashimonSystem.js";
import "./content/hashimonPrompt.js";
import "./content/hashimonAlbum.js";
import "./content/hashimonAlbumBridge.js";
import "./content/hashimonSprite.js";
import "./net/hashimonApi.js";
import "./lib/pow.js";
import "./lib/mineBurst.js";
import "./content/hashimonMining.js";
import "./content/hashimonZones.js";
import "./content/enemies.js";
import "./content/quests.js";

import "./state/SaveManager.js";
import "./state/PlayerState.js";
import "./state/QuestManager.js";

import "./engine/DirectionInput.js";
import "./engine/Sprite.js";
import "./engine/GameObject.js";
import "./engine/Person.js";
import "./engine/HashimonStone.js";
import "./engine/PersonGenerator.js";
import "./engine/Overworld.js";
import "./world/mapThemes.js";
import "./world/OverworldMaps.data.js";
import "./world/mapLoader.js";
import "./world/OverworldMap.js";
import "./engine/MapGenerator.js";
import "./engine/OverworldEvent.js";
import "./ui/RevealingText.js";
import "./ui/TextMessage.js";
import "./engine/KeyPressListener.js";
import "./ui/SceneTransition.js";
import "./ui/KeyboardMenu.js";
import "./ui/Hud.js";
import "./ui/ObjectiveHud.js";
import "./ui/MapLabel.js";
import "./ui/PauseMenu.js";
import "./ui/HashimonCollection.js";
import "./ui/HashimonAlbumExport.js";
import "./ui/CraftingMenu.js";
import "./state/Progress.js";
import "./ui/TitleScreen.js";
import "./ui/GenesisOnboarding.js";

import "./battle/Battle.js";
import "./battle/Combatant.js";
import "./battle/Team.js";
import "./battle/SubmissionMenu.js";
import "./battle/ReplacementMenu.js";
import "./battle/BattleEvent.js";
import "./battle/TurnCycle.js";
import "./battle/BattleAnimations.js";

import "./init.js";

export const HashimonSystem = window.HashimonSystem;
export const HashimonCompiler = window.HashimonCompiler;
export const HashimonDNA = window.HashimonDNA;
export const playerState = window.playerState;
export const saveManager = window.saveManager;
