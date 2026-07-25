class Battle {
  constructor({ enemy, onComplete, arena }) {

    this.enemy = enemy;
    this.onComplete = onComplete;
    this.arena = arena;

    this.combatants = {}

    this.activeCombatants = {
      player: null,
      enemy: null,
    }

    //Dynamically add the Player team, straight from the roster
    window.playerState.lineup.forEach(id => {
      this.addCombatant(id, "player", window.playerState.hashimons[id])
    });
    //Enemy team. A wild encounter passes an already-minted individual (it has a
    //dna), so we field that exact creature. Trainers pass a spec to instance.
    Object.keys(this.enemy.hashimons).forEach(key => {
      const entry = this.enemy.hashimons[key];
      const instance = entry.dna
        ? entry
        : HashimonSystem.createInstance(entry.speciesKey, (({speciesKey, ...o}) => o)(entry));
      this.addCombatant("e_"+key, "enemy", instance)
    })


    //Start empty
    this.items = []

    //Add in player items
    window.playerState.items.forEach(item => {
      this.items.push({
        ...item,
        team: "player"
      })
    })

    this.usedInstanceIds = {};

  }

  addCombatant(id, team, hashimon) {
      this.combatants[id] = new Combatant({
        ...HashimonSystem.toCombatantConfig(hashimon),
        team,
        isPlayerControlled: team === "player"
      }, this)

      //Populate first active Hashimon
      this.activeCombatants[team] = this.activeCombatants[team] || id
  }

  getHeroPortraitSrc() {
    const hero = window.overworld?.map?.gameObjects?.hero;
    if (hero?.sprite?.image?.src) {
      return hero.sprite.image.src;
    }
    if (window.PersonGenerator && window.playerState?.personSeed) {
      return PersonGenerator.generate(playerState.personSeed, "explorer");
    }
    return PersonGenerator?.generate("hero_genesis", "explorer") || "";
  }

  getTrainerPortraitSrc() {
    if (this.enemy.personSeed && window.PersonGenerator) {
      return PersonGenerator.generate(this.enemy.personSeed, this.enemy.template);
    }
    return this.enemy.trainerSrc || this.enemy.src || "";
  }

  createElement() {
    this.element = document.createElement("div");
    this.element.classList.add("Battle");

    // If provided, add a CSS class for setting the arena background
    if (this.arena) {
      this.element.classList.add(this.arena);
    }

    if (this.enemy.isWild) {
      this.element.classList.add("wild-battle");
    }

    const heroPortrait = this.getHeroPortraitSrc();
    const trainerPortrait = this.enemy.isWild ? "" : (`
    <div class="Battle_enemy">
      <img src="${this.getTrainerPortraitSrc()}" alt="${this.enemy.name}" />
    </div>`);

    this.element.innerHTML = (`
    <div class="Battle_hero">
      <img src="${heroPortrait}" alt="Hero" />
    </div>
    ${trainerPortrait}
    `)
  }

  init(container) {
    this.createElement();
    container.appendChild(this.element);

    this.playerTeam = new Team("player", "Hero");
    this.enemyTeam = new Team("enemy", "Bully");

    Object.keys(this.combatants).forEach(key => {
      let combatant = this.combatants[key];
      combatant.id = key;
      combatant.init(this.element)
      
      //Add to correct team
      if (combatant.team === "player") {
        this.playerTeam.combatants.push(combatant);
      } else if (combatant.team === "enemy") {
        this.enemyTeam.combatants.push(combatant);
      }
    })

    this.playerTeam.init(this.element);
    this.enemyTeam.init(this.element);

    this.turnCycle = new TurnCycle({
      battle: this,
      onNewEvent: event => {
        return new Promise(resolve => {
          const battleEvent = new BattleEvent(event, this)
          battleEvent.init(resolve);
        })
      },
      onWinner: winner => {

        if (winner === "player") {
          const playerState = window.playerState;
          Object.keys(playerState.hashimons).forEach(id => {
            const rosterHashimon = playerState.hashimons[id];
            const combatant = this.combatants[id];
            if (combatant) {
              rosterHashimon.hp = combatant.hp;
              rosterHashimon.xp = combatant.xp;
              rosterHashimon.maxXp = combatant.maxXp;
              rosterHashimon.level = combatant.level;
              rosterHashimon.status = combatant.status;
            }
          })

          //Get rid of player used items
          playerState.items = playerState.items.filter(item => {
            return !this.usedInstanceIds[item.instanceId]
          })

          playerState.save();

          //Send signal to update
          utils.emitEvent("PlayerStateUpdated");
        }

        this.element.remove();
        this.onComplete(winner === "player");
      }
    })
    this.turnCycle.init();


  }

}