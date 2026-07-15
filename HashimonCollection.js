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
    const hashimons = Object.values(window.playerState.hashimons);

    const rows = hashimons.map(h => {
      const sprite = HashimonSystem.getSpriteForStage(h);
      return (`
        <div class="HashimonCollection_row">
          <img class="HashimonCollection_portrait" src="${sprite.src}" alt="${h.name}" />
          <div class="HashimonCollection_row-info">
            <p class="HashimonCollection_row-name">${h.name}</p>
            <p>${h.species} &middot; stage ${h.stage}/${h.maxStage} &middot; ${h.branch}</p>
            <p>Best share: ${h.pow.bestShareDifficulty}</p>
          </div>
          <button data-detail="${h.id}">Ver ficha</button>
        </div>
      `)
    }).join("");

    this.element.innerHTML = (`
      <h2>Mi colección</h2>
      ${hashimons.length ? rows : `<p class="HashimonCollection_empty">Aún no has capturado ningún Hashimon.</p>`}
      <div class="HashimonCollection_footer">
        <button data-close>Cerrar</button>
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
    const stageStart = (h.stage - 1) * HashimonConfig.stageStep;
    const inStage = h.evolution.progress - stageStart;
    const span = Math.max(1, h.evolution.nextThreshold - stageStart);
    const percent = h.stage >= h.maxStage ? 100 : Math.min(100, Math.round(inStage / span * 100));

    this.element.innerHTML = (`
      <h2>${h.name} &mdash; Laboratorio</h2>
      <div class="HashimonCollection_detail">
        <div class="HashimonCollection_detail-left">
          <img class="HashimonCollection_sprite" src="${sprite.src}" alt="${h.name}" />
          <p class="HashimonCollection_form">${sprite.label}</p>
        </div>
        <div class="HashimonCollection_detail-fields">
          <p><span>Especie</span> ${h.species}</p>
          <p><span>Stage</span> ${h.stage} / ${h.maxStage}</p>
          <p><span>Branch</span> ${h.branch}</p>
          <p><span>Star class</span> ${h.starClass}</p>
          <p><span>Template</span> ${h.pow.templateId}</p>
          <p><span>Birth nonce</span> ${h.pow.birthNonce}</p>
          <p><span>Valid shares</span> ${h.pow.validShares}</p>
          <p><span>Best share diff</span> ${h.pow.bestShareDifficulty}</p>
          <p><span>Best share hash</span> ${h.pow.bestShareHash.slice(0, 18)}&hellip;</p>
          <p><span>Mining</span> ${h.pow.miningSeconds}s</p>
          <p><span>Found block</span> ${h.pow.foundBlock ? "¡SÍ!" : "no"}</p>
        </div>
      </div>
      <div class="HashimonCollection_progress">
        <p>Evolución: ${h.evolution.progress} / ${h.evolution.nextThreshold}</p>
        <div class="HashimonCollection_progress-bar">
          <div class="HashimonCollection_progress-fill" style="width:${percent}%"></div>
        </div>
      </div>
      <p class="HashimonCollection_share-message">${this.lastShareMessage}</p>
      <div class="HashimonCollection_footer">
        <button data-share>Simular share</button>
        <button data-back>Volver</button>
        <button data-close>Cerrar</button>
      </div>
    `);

    this.element.querySelector("button[data-share]").addEventListener("click", () => {
      const result = HashimonSystem.simulateShare(h);
      window.playerState.saveHashimons();

      let message = `Share #${h.pow.validShares} &middot; dificultad ${result.difficulty}`;
      if (result.isNewBest) {
        message += " &middot; ¡Nuevo best share!";
      }
      if (result.stageUp) {
        message += ` &middot; ¡Subió a stage ${result.newStage}!`;
      }
      if (result.foundBlock) {
        message += " &middot; ¡¡BLOQUE ENCONTRADO!!";
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
