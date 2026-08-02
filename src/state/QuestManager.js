class QuestManager {
  getQuest(questId) {
    return window.Quests?.[questId] || null;
  }

  getActiveQuestId() {
    return window.playerState.questProgress?.activeQuestId || null;
  }

  getCurrentStep() {
    const questId = this.getActiveQuestId();
    if (!questId) return null;
    const quest = this.getQuest(questId);
    if (!quest?.steps) return null;

    for (const step of quest.steps) {
      if (!window.playerState.storyFlags[step.completeOnFlag]) {
        return step;
      }
    }
    return null;
  }

  startQuest(questId) {
    window.playerState.questProgress = {
      activeQuestId: questId,
      completedSteps: [],
    };
    window.playerState.save();
    utils.emitEvent("QuestUpdated");
  }

  syncCompletedSteps() {
    const questId = this.getActiveQuestId();
    if (!questId) return;
    const quest = this.getQuest(questId);
    if (!quest?.steps) return;

    const completed = window.playerState.questProgress.completedSteps || [];
    quest.steps.forEach(step => {
      if (window.playerState.storyFlags[step.completeOnFlag] && !completed.includes(step.id)) {
        completed.push(step.id);
      }
    });
    window.playerState.questProgress.completedSteps = completed;
  }

  advanceIfComplete(flag) {
    const questId = this.getActiveQuestId();
    if (!questId) return;
    const quest = this.getQuest(questId);
    if (!quest?.steps) return;

    const completed = window.playerState.questProgress.completedSteps || [];
    quest.steps.forEach(step => {
      if (step.completeOnFlag === flag && !completed.includes(step.id)) {
        completed.push(step.id);
      }
    });
    window.playerState.questProgress.completedSteps = completed;
    utils.emitEvent("QuestUpdated");
  }

  isQuestComplete(questId) {
    const quest = this.getQuest(questId);
    if (!quest?.steps) return true;
    return quest.steps.every(step => window.playerState.storyFlags[step.completeOnFlag]);
  }

  getCurrentObjective() {
    if (window.playerState.storyFlags.DISMISSED_OBJECTIVE_HUD) {
      return null;
    }
    const questId = this.getActiveQuestId();
    if (!questId) return null;

    const quest = this.getQuest(questId);
    const step = this.getCurrentStep();
    if (!step) return null;

    return {
      questTitle: quest.title,
      stepText: step.text,
    };
  }

  getMapOnboarding(mapId) {
    const questId = this.getActiveQuestId();
    if (!questId) return null;
    const quest = this.getQuest(questId);
    if (!quest?.steps) return null;

    for (const step of quest.steps) {
      if (step.onEnterMap?.map !== mapId) continue;
      if (window.playerState.storyFlags[step.onEnterMap.seenFlag]) continue;

      const fn = window.Quests.cutscenes[step.onEnterMap.cutsceneKey];
      if (!fn) continue;
      return typeof fn === "function" ? fn() : fn;
    }
    return null;
  }

  getMapLabel(mapId) {
    if (mapId.startsWith("endless_")) {
      return "Endless Zone";
    }
    return window.Quests.mapLabels[mapId] || mapId;
  }
}

window.questManager = new QuestManager();
