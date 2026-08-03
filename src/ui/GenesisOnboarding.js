const GENESIS_OPTIONS = [
  { speciesKey: "genesis_fuego", label: "Fuego", type: "fuego" },
  { speciesKey: "genesis_agua", label: "Agua", type: "agua" },
  { speciesKey: "genesis_aire", label: "Aire", type: "aire" },
  { speciesKey: "genesis_tierra", label: "Tierra", type: "tierra" },
  { speciesKey: "genesis_electrico", label: "Electricidad", type: "electrico" },
];

class GenesisOnboarding {
  static typeHue(typeKey) {
    const bands = window.HashimonTypes?.[typeKey]?.hues?.[0];
    if (!bands) { return 200; }
    return Math.round((bands[0] + bands[1]) / 2);
  }

  static createElement() {
    const el = document.createElement("div");
    el.classList.add("GenesisOnboarding");
    el.innerHTML = (`
      <div class="GenesisOnboarding_backdrop" aria-hidden="true">
        <div class="GenesisOnboarding_grid"></div>
      </div>
      <div class="GenesisOnboarding_panel">
        <h2 class="GenesisOnboarding_title">Elige tu elemento</h2>
        <p class="GenesisOnboarding_copy">
          Elige el elemento de tu primer bloque. Tu ADN individual será único; el elemento es tu elección.
        </p>
        <div class="GenesisOnboarding_actions"></div>
      </div>
    `);
    return el;
  }

  static init(container) {
    return new Promise(resolve => {
      const element = GenesisOnboarding.createElement();
      container.appendChild(element);

      const actions = element.querySelector(".GenesisOnboarding_actions");
      const keyboardMenu = new KeyboardMenu({
        descriptionContainer: actions,
      });
      keyboardMenu.init(actions);

      const options = GENESIS_OPTIONS.map(opt => {
        const hue = GenesisOnboarding.typeHue(opt.type);
        return {
          label: opt.label,
          description: Hashimons[opt.speciesKey]?.description || "",
          style: `--genesis-hue: ${hue}`,
          handler: () => {
            keyboardMenu.end();
            element.remove();
            resolve(opt.speciesKey);
          },
        };
      });

      keyboardMenu.setOptions(options);
    });
  }

  static showGiveLifeHint(container) {
    let el = document.querySelector(".GenesisOnboarding_hint");
    if (!el) {
      el = document.createElement("div");
      el.className = "GenesisOnboarding_hint";
      container.appendChild(el);
    }
    el.textContent = "Abre el menú → Mi colección → Give life para renderizar tu Hashimon.";
    el.classList.add("visible");
    clearTimeout(GenesisOnboarding._hintTimer);
    GenesisOnboarding._hintTimer = setTimeout(() => {
      el.classList.remove("visible");
    }, 8000);
  }
}

window.GenesisOnboarding = GenesisOnboarding;
