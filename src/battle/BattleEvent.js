class BattleEvent {
  constructor(event, battle) {
    this.event = event;
    this.battle = battle;
  }
  
  textMessage(resolve) {

    const text = this.event.text
    .replace("{CASTER}", this.event.caster?.name)
    .replace("{TARGET}", this.event.target?.name)
    .replace("{ACTION}", this.event.action?.name)

    const message = new TextMessage({
      text,
      onComplete: () => {
        resolve();
      }
    })
    message.init( this.battle.element )
  }

  // Here the characters takes the damage
  async stateChange(resolve) {
    const {caster, target, damage, recover, status, action} = this.event;
    let who = this.event.onCaster ? caster : target;

    if (damage) {
      //Actions carry a base damage; the caster's power and the target's defense
      //scale it, which is what makes evolving to a higher stage hit harder.
      const scaled = Math.max(1, Math.round(damage * caster.stats.power / target.stats.defense));

      target.update({
        hp: target.hp - scaled
      })

      //start blinking
      target.hashimonElement.classList.add("battle-damage-blink");
    }

    if (recover) {
      let newHp = who.hp + recover;
      if (newHp > who.maxHp) {
        newHp = who.maxHp;
      }
      who.update({
        hp: newHp
      })
    }

    if (status) {
      who.update({
        status: {...status}
      })
    }
    if (status === null) {
      who.update({
        status: null
      })
    }


    //Wait a little bit
    await utils.wait(600)

    //Update Team components
    this.battle.playerTeam.update();
    this.battle.enemyTeam.update();

    //stop blinking
    target.hashimonElement.classList.remove("battle-damage-blink");
    resolve();
  }

  submissionMenu(resolve) {
    const {caster} = this.event;
    const menu = new SubmissionMenu({
      caster: caster,
      enemy: this.event.enemy,
      items: this.battle.items,
      replacements: Object.values(this.battle.combatants).filter(c => {
        return c.id !== caster.id && c.team === caster.team && c.hp > 0
      }),
      onComplete: submission => {
        //submission { what move to use, who to use it on }
        resolve(submission)
      }
    })
    menu.init( this.battle.element )
  }

  //Shown after defeating a wild Hashimon. Resolves with the captured
  //individual (already saved in playerState) or null if released.
  captureMenu(resolve) {
    const {wildIndividual, wildSpecies, captureFlag} = this.battle.enemy;
    //Save the exact creature that was fought, with its unique DNA — not a fresh
    //roll of the species.
    const individual = wildIndividual || HashimonSystem.createInstance(wildSpecies);
    const menu = new KeyboardMenu();
    menu.init(this.battle.element);
    menu.setOptions([
      {
        label: "Capture",
        description: `Add ${individual.name} to your collection`,
        handler: () => {
          menu.end();
          const saved = window.playerState.addHashimon(individual);
          if (captureFlag) {
            window.playerState.storyFlags[captureFlag] = true;
            window.playerState.save();
          }
          resolve(saved);
        }
      },
      {
        label: "Let it go",
        description: "Set the wild Hashimon free",
        handler: () => {
          menu.end();
          resolve(null);
        }
      }
    ]);
  }

  replacementMenu(resolve) {
    const menu = new ReplacementMenu({
      replacements: Object.values(this.battle.combatants).filter(c => {
        return c.team === this.event.team && c.hp > 0
      }),
      onComplete: replacement => {
        resolve(replacement)
      }
    })
    menu.init( this.battle.element )
  }

  async replace(resolve) {
    const {replacement} = this.event;

    //Clear out the old combatant
    const prevCombatant = this.battle.combatants[this.battle.activeCombatants[replacement.team]];
    this.battle.activeCombatants[replacement.team] = null;
    prevCombatant.update();
    await utils.wait(400);

    //In with the new!
    this.battle.activeCombatants[replacement.team] = replacement.id;
    replacement.update();
    await utils.wait(400);

    //Update Team components
    this.battle.playerTeam.update();
    this.battle.enemyTeam.update();

    resolve();
  }

  giveXp(resolve) {
    let amount = this.event.xp;
    const {combatant} = this.event;
    const step = () => {
      if (amount > 0) {
        amount -= 1;
        combatant.xp += 1;

        //Check if we've hit level up point
        if (combatant.xp === combatant.maxXp) {
          combatant.xp = 0;
          combatant.maxXp = 100;
          combatant.level += 1;
        }

        combatant.update();
        requestAnimationFrame(step);
        return;
      }
      resolve();
    }
    requestAnimationFrame(step);
  }

  animation(resolve) {
    const fn = BattleAnimations[this.event.animation];
    fn(this.event, resolve);
  }

  init(resolve) {
    this[this.event.type](resolve);
  }
}