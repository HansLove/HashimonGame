class Combatant {
  constructor(config, battle) {
    Object.keys(config).forEach(key => {
      this[key] = config[key];
    })
    this.hp = typeof(this.hp) === "undefined" ? this.maxHp : this.hp;
    this.battle = battle;
  }

  get hpPercent() {
    const percent = this.hp / this.maxHp * 100;
    return percent > 0 ? percent : 0;
  }

  get xpPercent() {
    return this.xp / this.maxXp * 100;
  }

  get isActive() {
    return this.battle?.activeCombatants[this.team] === this.id;
  }

  get givesXp() {
    return this.level * 20;
  }

  starLine() {
    const stars = this.stars || 0;
    return "★".repeat(Math.min(5, stars)) + "☆".repeat(Math.max(0, 5 - stars));
  }

  createBattleHud() {
    return (`
      <p class="Combatant_name">${this.name}</p>
      <div class="Combatant_meta">
        <span class="Combatant_typeLabel">${this.typeLabel || this.type || ""}</span>
        <span class="Combatant_level">Lv ${this.level}</span>
        <span class="Combatant_stars">${this.starLine()}</span>
      </div>
      <p class="Combatant_hp">${Math.ceil(this.hp)}/${this.maxHp}</p>
      <svg viewBox="0 0 26 3" class="Combatant_life-container">
        <rect x=0 y=0 width="0%" height=1 fill="#82ff71" />
        <rect x=0 y=1 width="0%" height=2 fill="#00FF00" />
      </svg>
      <p class="Combatant_status"></p>
    `);
  }

  createOverworldHud() {
    return (`
      <p class="Combatant_name">${this.name}</p>
      <p class="Combatant_level"></p>
      <svg viewBox="0 0 26 3" class="Combatant_life-container">
        <rect x=0 y=0 width="0%" height=1 fill="#82ff71" />
        <rect x=0 y=1 width="0%" height=2 fill="#00FF00" />
      </svg>
      <svg viewBox="0 0 26 2" class="Combatant_xp-container">
        <rect x=0 y=0 width="0%" height=1 fill="#ffd76a" />
        <rect x=0 y=1 width="0%" height=1 fill="#ffc934" />
      </svg>
      <p class="Combatant_status"></p>
    `);
  }

  createElement() {
    this.hudElement = document.createElement("div");
    this.hudElement.classList.add("Combatant");
    this.hudElement.setAttribute("data-combatant", this.id);
    this.hudElement.setAttribute("data-team", this.team);
    this.hudElement.innerHTML = this.battle
      ? this.createBattleHud()
      : this.createOverworldHud();

    this.hashimonElement = document.createElement("img");
    this.hashimonElement.classList.add("Hashimon");
    this.hashimonElement.setAttribute("src", this.src );
    this.hashimonElement.setAttribute("alt", this.name );
    this.hashimonElement.setAttribute("data-team", this.team );

    this.hpFills = this.hudElement.querySelectorAll(".Combatant_life-container > rect");
    this.xpFills = this.hudElement.querySelectorAll(".Combatant_xp-container > rect");
  }

  update(changes={}) {
    Object.keys(changes).forEach(key => {
      this[key] = changes[key]
    });

    this.hudElement.setAttribute("data-active", this.isActive);
    this.hashimonElement.setAttribute("data-active", this.isActive);

    this.hpFills.forEach(rect => rect.style.width = `${this.hpPercent}%`)
    this.xpFills.forEach(rect => rect.style.width = `${this.xpPercent}%`)

    if (this.battle) {
      const hpEl = this.hudElement.querySelector(".Combatant_hp");
      if (hpEl) {
        hpEl.textContent = `${Math.ceil(this.hp)}/${this.maxHp}`;
      }
      const levelEl = this.hudElement.querySelector(".Combatant_level");
      if (levelEl) {
        levelEl.textContent = `Lv ${this.level}`;
      }
      const starsEl = this.hudElement.querySelector(".Combatant_stars");
      if (starsEl) {
        starsEl.textContent = this.starLine();
      }
      const typeEl = this.hudElement.querySelector(".Combatant_typeLabel");
      if (typeEl && this.typeLabel) {
        typeEl.textContent = this.typeLabel;
      }
    } else {
      this.hudElement.querySelector(".Combatant_level").innerText = this.level;
    }

    const statusElement = this.hudElement.querySelector(".Combatant_status");
    if (this.status) {
      statusElement.innerText = this.status.type;
      statusElement.setAttribute("data-status", this.status.type);
      statusElement.style.display = "block";
    } else {
      statusElement.innerText = "";
      statusElement.removeAttribute("data-status");
      statusElement.style.display = "none";
    }
  }

  getReplacedEvents(originalEvents) {

    if (this.status?.type === "glitchy" && utils.randomFromArray([true, false, false])) {
      return [
        { type: "textMessage", text: `${this.name}'s hash chain glitched!` },
      ]
    }

    return originalEvents;
  }

  getPostEvents() {
    if (this.status?.type === "overclock") {
      return [
        { type: "textMessage", text: "Hash output surging!" },
        { type: "stateChange", recover: 5, onCaster: true }
      ]
    } 
    return [];
  }

  decrementStatus() {
    if (this.status?.expiresIn > 0) {
      this.status.expiresIn -= 1;
      if (this.status.expiresIn === 0) {
        this.update({
          status: null
        })
        return {
          type: "textMessage",
          text: "Status expired!"
        }
      }
    }
    return null;
  }

  async loadAlbumArt() {
    if (!this.hashimonId || !window.HashimonAlbumBridge) { return; }

    const art = await HashimonAlbumBridge.getBestArtFor(this.hashimonId);
    if (!art?.url) { return; }

    this.albumArtUrl = art.url;
    this.hashimonElement.src = art.url;
    this.hashimonElement.classList.add("Hashimon--album");
  }

  init(container) {
    this.createElement();
    container.appendChild(this.hudElement);
    container.appendChild(this.hashimonElement);
    this.update();
    this.loadAlbumArt();
  }

}
