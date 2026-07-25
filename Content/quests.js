window.Quests = {
  mapLabels: {
    Kitchen: "Kitchen",
    Street: "Street",
    DiningRoom: "Dining Room",
    StreetNorth: "North Street",
    Shop: "Pizza Shop",
    GreenKitchen: "Green Kitchen",
    DemoRoom: "Demo Room",
  },

  cutscenes: {
    kitchenIntro() {
      const starterId = window.playerState.lineup[0];
      const starter = window.playerState.hashimons[starterId];
      const name = starter?.name || "your Hashimon";
      return [
        { type: "textMessage", text: "Welcome to the HASH, recruit!", faceHero: "kitchenNpcA" },
        { type: "textMessage", text: `${name} is on your line today. Every block has a soul — take care of them.`, faceHero: "kitchenNpcA" },
        { type: "textMessage", text: "Arrow keys move you around. Press Enter to talk or interact.", faceHero: "kitchenNpcA" },
        { type: "textMessage", text: "Press Escape anytime to open the pause menu.", faceHero: "kitchenNpcA" },
        { type: "textMessage", text: "Head north through the door when you're ready to hit the Street.", faceHero: "kitchenNpcA" },
        { type: "addStoryFlag", flag: "SEEN_INTRO" },
      ];
    },

    streetOnboarding() {
      return [
        { type: "textMessage", text: "The Street — where the real heat is." },
        { type: "textMessage", text: "Wild Hashimons lurk in the grass patches to the east. Step on them to battle!" },
        { type: "textMessage", text: "Train up, then challenge the cook blocking the lane." },
        { type: "addStoryFlag", flag: "STREET_ONBOARDING" },
      ];
    },

    postTrainerCollection() {
      return [
        { type: "textMessage", text: "Not bad for a kitchen hand.", faceHero: "streetNpcC" },
        { type: "textMessage", text: "Press Escape to open the pause menu, then pick My Collection to see every Hashimon you've caught.", faceHero: "streetNpcC" },
        { type: "addStoryFlag", flag: "POST_TRAINER_HINT" },
      ];
    },
  },

  early_start: {
    id: "early_start",
    title: "First Shift",
    steps: [
      {
        id: "intro",
        text: "Talk to the shift chef",
        completeOnFlag: "SEEN_INTRO",
      },
      {
        id: "leave_kitchen",
        text: "Head outside to the Street",
        completeOnFlag: "LEFT_KITCHEN",
        onEnterMap: {
          map: "Street",
          seenFlag: "STREET_ONBOARDING",
          cutsceneKey: "streetOnboarding",
        },
      },
      {
        id: "wild_win",
        text: "Win a wild battle in the grass",
        completeOnFlag: "FIRST_WILD_WIN",
      },
      {
        id: "street_trainer",
        text: "Defeat the street challenger",
        completeOnFlag: "streetBattle",
      },
      {
        id: "open_collection",
        text: "Open My Collection (Esc)",
        completeOnFlag: "OPENED_COLLECTION",
      },
    ],
  },
};
