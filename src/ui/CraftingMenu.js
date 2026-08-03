class CraftingMenu {
  constructor({ hashimons, onComplete}) {
    this.hashimons = hashimons;
    this.onComplete = onComplete;
  }

  getOptions() {
    return this.hashimons.map(speciesKey => {
      const species = Hashimons[speciesKey];
      return {
        label: species.name,
        description: species.description,
        handler: async () => {
          try {
            await playerState.craftHashimon(speciesKey);
          } catch (e) {
            console.warn("Craft emit failed:", e);
          }
          this.close();
        }
      }
    })
  }

  createElement() {
    this.element = document.createElement("div");
    this.element.classList.add("CraftingMenu");
    this.element.classList.add("overlayMenu");
    this.element.innerHTML = (`
      <h2>Create a Hashimon</h2>
    `)
  }

  close() {
    this.keyboardMenu.end();
    this.element.remove();
    this.onComplete();
  }


  init(container) {
    this.createElement();
    this.keyboardMenu = new KeyboardMenu({
      descriptionContainer: container
    })
    this.keyboardMenu.init(this.element)
    this.keyboardMenu.setOptions(this.getOptions())

    container.appendChild(this.element);
  }
}
