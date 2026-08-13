class TitleScreen {
  constructor({ progress }) {
    this.progress = progress;
  }

  getOptions(resolve) {
    const safeFile = this.progress.getSaveFile();
    const canContinue = this.progress.canContinue();
    return [
      { 
        label: "New Adventure",
        description: "Enter the chain. Every block has a soul.",
        handler: () => {
          this.close();
          resolve();
        }
      },
      canContinue ? {
        label: "Continue",
        description: "Resume your saved journey",
        handler: () => {
          this.close();
          resolve(safeFile || true);
        }
      } : null
    ].filter(v => v);
  }

  createElement() {
    this.element = document.createElement("div");
    this.element.classList.add("TitleScreen");
    this.element.innerHTML = (`
      <div class="TitleScreen_backdrop" aria-hidden="true">
        <div class="TitleScreen_grid"></div>
        <div class="TitleScreen_glow TitleScreen_glow--left"></div>
        <div class="TitleScreen_glow TitleScreen_glow--right"></div>
      </div>
      <div class="TitleScreen_layout">
        <div class="TitleScreen_content">
          <div class="TitleScreen_hero">
            <img class="TitleScreen_mascot" src="/landing-export/creatures/s001.png" alt="" />
            <img class="TitleScreen_mascot TitleScreen_mascot--ghost" src="/landing-export/creatures/glitchPup.png" alt="" />
          </div>
          <img class="TitleScreen_logo" src="/images/hashimon-logo.svg" alt="Hashimon" />
          <p class="TitleScreen_tagline">Catch · Mine · Evolve on the chain</p>
          <p class="TitleScreen_sub">Wild Hashimons roam the mempool. Your DNA is your proof.</p>
        </div>
        <div class="TitleScreen_actions"></div>
      </div>
    `)

  }

  close() {
    this.keyboardMenu.end();
    this.element.remove();
  }
  
  init(container) {
    return new Promise(resolve => {
      this.createElement();
      container.appendChild(this.element);

      const actions = this.element.querySelector(".TitleScreen_actions");
      this.keyboardMenu = new KeyboardMenu({
        descriptionContainer: actions,
      });
      this.keyboardMenu.init(actions);
      this.keyboardMenu.setOptions(this.getOptions(resolve));
    })
  }

}
