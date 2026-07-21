//"Mi colección" overlay: list of captured Hashimons + ficha/laboratorio view
//with the "Simular share" proof-of-work simulation.
class HashimonCollection {
  constructor({ onComplete }) {
    this.onComplete = onComplete;
    this.lastShareMessage = "";
  }

  createElement() {
    this.element = document.createElement("div");
    this.element.classList.add("HashimonCollection");
    this.element.classList.add("overlayMenu");
  }

  renderList() {
    this.lastShareMessage = "";
    //The roster is the collection now: starter and captures live side by side.
    const hashimons = Object.values(window.playerState.hashimons);

    const rows = hashimons.map(h => {
      const sprite = HashimonSystem.getSpriteForStage(h);
      const inLineup = window.playerState.lineup.indexOf(h.id) !== -1;
      return (`
        <div class="HashimonCollection_row">
          <img class="HashimonCollection_portrait" src="${sprite.src}" alt="${h.name}" />
          <div class="HashimonCollection_row-info">
            <p class="HashimonCollection_row-name">
              ${h.name}${inLineup ? ` <span class="HashimonCollection_badge">in party</span>` : ""}
            </p>
            <p>${h.species} &middot; stage ${h.stage}/${h.maxStage} &middot; ${h.branch}</p>
            <p>Best share: ${h.pow.bestShareDifficulty}</p>
          </div>
          <button data-detail="${h.id}">View sheet</button>
        </div>
      `)
    }).join("");

    this.element.innerHTML = (`
      <h2>My Collection</h2>
      ${hashimons.length ? rows : `<p class="HashimonCollection_empty">You haven't captured any Hashimon yet.</p>`}
      <div class="HashimonCollection_footer">
        <button data-close>Close</button>
      </div>
    `);

    this.element.querySelectorAll("button[data-detail]").forEach(button => {
      button.addEventListener("click", () => {
        this.renderDetail(button.dataset.detail);
      })
    })
    this.element.querySelector("button[data-close]").addEventListener("click", () => {
      this.close();
    })
  }

  renderDetail(id) {
    const h = window.playerState.hashimons[id];
    if (!h) { return this.renderList(); }

    const sprite = HashimonSystem.getSpriteForStage(h);
    const genetics = HashimonCompiler.compile(h);
    const stageStart = (h.stage - 1) * HashimonConfig.stageStep;
    const inStage = h.evolution.progress - stageStart;
    const span = Math.max(1, h.evolution.nextThreshold - stageStart);
    const percent = h.stage >= h.maxStage ? 100 : Math.min(100, Math.round(inStage / span * 100));

    this.element.innerHTML = (`
      <h2>${h.name} &mdash; Laboratory</h2>
      <div class="HashimonCollection_detail">
        <div class="HashimonCollection_detail-left">
          <img class="HashimonCollection_sprite" src="${sprite.src}" alt="${h.name}" />
          <p class="HashimonCollection_form">${sprite.label}</p>
        </div>
        <div class="HashimonCollection_detail-fields">
          <p><span>Species</span> ${h.species}</p>
          <p><span>Stage</span> ${h.stage} / ${h.maxStage}</p>
          <p><span>Type</span> ${genetics.types.fusion || [genetics.types.primary.name, genetics.types.secondary && genetics.types.secondary.name].filter(Boolean).join(" / ")}</p>
          <p><span>Subtype</span> ${genetics.types.subtype}</p>
          <p><span>Stars</span> ${"★".repeat(genetics.stars)}${"☆".repeat(Math.max(0, 5 - genetics.stars))} (${genetics.stars})</p>
          <p><span>HP</span> ${h.hp} / ${h.maxHp}</p>
          <p><span>Power / Def</span> ${h.stats.power} / ${h.stats.defense}</p>
          <p><span>DNA</span> ${genetics.dna.slice(0, 12)}&hellip;</p>
          <p><span>Template</span> ${h.pow.templateId}</p>
          <p><span>Birth nonce</span> ${h.pow.birthNonce}</p>
          <p><span>Valid shares</span> ${h.pow.validShares}</p>
          <p><span>Best share diff</span> ${h.pow.bestShareDifficulty}</p>
          <p><span>Best share hash</span> ${h.pow.bestShareHash.slice(0, 18)}&hellip;</p>
          <p><span>Mining</span> ${h.pow.miningSeconds}s</p>
          <p><span>Found block</span> ${h.pow.foundBlock ? "YES!" : "no"}</p>
        </div>
      </div>
      <div class="HashimonCollection_progress">
        <p>Evolution: ${h.evolution.progress} / ${h.evolution.nextThreshold}</p>
        <div class="HashimonCollection_progress-bar">
          <div class="HashimonCollection_progress-fill" style="width:${percent}%"></div>
        </div>
      </div>
      <p class="HashimonCollection_share-message">${this.lastShareMessage}</p>
      <div class="HashimonCollection_footer">
        <button data-share>Simulate share</button>
        <button data-prompt>Give life</button>
        <button data-back>Back</button>
        <button data-close>Close</button>
      </div>
    `);

    this.element.querySelector("button[data-prompt]").addEventListener("click", () => {
      this.renderPrompt(id);
    })

    this.element.querySelector("button[data-share]").addEventListener("click", () => {
      const result = HashimonSystem.simulateShare(h);
      window.playerState.save();

      let message = `Share #${h.pow.validShares} &middot; difficulty ${result.difficulty}`;
      if (result.isNewBest) {
        message += " &middot; New best share!";
      }
      if (result.stageUp) {
        message += ` &middot; Evolved to stage ${result.newStage}! (+stats)`;
        utils.emitEvent("PlayerStateUpdated");
      }
      if (result.foundBlock) {
        message += " &middot; BLOCK FOUND!!";
      }
      this.lastShareMessage = message;
      this.renderDetail(id);
    })
    this.element.querySelector("button[data-back]").addEventListener("click", () => {
      this.renderList();
    })
    this.element.querySelector("button[data-close]").addEventListener("click", () => {
      this.close();
    })
  }

  //The compiler's output, ready to paste into whichever AI the player uses.
  //V1 has no artwork pipeline: the player is the renderer.
  renderPrompt(id, styleKey = "creature", tab = "prompt") {
    const h = window.playerState.hashimons[id];
    const text = tab === "values"
      ? HashimonPrompt.toValues(h)
      : HashimonPrompt.toPrompt(h, styleKey);

    const styleButtons = Object.keys(HashimonPrompt.STYLES).map(key => `
      <button data-style="${key}" ${key === styleKey ? 'class="active"' : ""}>
        ${HashimonPrompt.STYLES[key].label}
      </button>`).join("");

    this.element.innerHTML = (`
      <h2>${h.name} &mdash; Give life</h2>
      <p class="HashimonCollection_hint">
        Copy this and paste it into your favorite AI. The text comes from its DNA,
        so it always describes the same Hashimon.
      </p>
      <div class="HashimonCollection_tabs">
        <button data-tab="prompt" ${tab === "prompt" ? 'class="active"' : ""}>Prompt</button>
        <button data-tab="values" ${tab === "values" ? 'class="active"' : ""}>Values</button>
        ${tab === "prompt" ? `<span class="HashimonCollection_styles">${styleButtons}</span>` : ""}
      </div>
      <textarea class="HashimonCollection_prompt" readonly>${text
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</textarea>
      <p class="HashimonCollection_share-message" data-copied></p>
      <div class="HashimonCollection_footer">
        <button data-copy>Copy</button>
        <button data-back-detail>Back to sheet</button>
        <button data-close>Close</button>
      </div>
    `);

    const textarea = this.element.querySelector(".HashimonCollection_prompt");

    this.element.querySelector("button[data-copy]").addEventListener("click", async () => {
      textarea.select();
      let ok = false;
      try {
        await navigator.clipboard.writeText(text);
        ok = true;
      } catch (e) {
        //Clipboard API needs a secure context; fall back to the old command.
        ok = document.execCommand("copy");
      }
      this.element.querySelector("[data-copied]").innerText = ok
        ? "Copied! Paste it into your AI chat."
        : "Select the text and copy with Cmd+C.";
    })

    this.element.querySelectorAll("button[data-tab]").forEach(b => {
      b.addEventListener("click", () => this.renderPrompt(id, styleKey, b.dataset.tab));
    })
    this.element.querySelectorAll("button[data-style]").forEach(b => {
      b.addEventListener("click", () => this.renderPrompt(id, b.dataset.style, tab));
    })
    this.element.querySelector("button[data-back-detail]").addEventListener("click", () => {
      this.renderDetail(id);
    })
    this.element.querySelector("button[data-close]").addEventListener("click", () => {
      this.close();
    })
  }

  close() {
    this.esc?.unbind();
    this.element.remove();
    this.onComplete();
  }

  init(container) {
    this.createElement();
    this.renderList();
    container.appendChild(this.element);

    this.esc = new KeyPressListener("Escape", () => {
      this.close();
    })
  }
}
