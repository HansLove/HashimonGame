class PauseMenu {
  constructor({progress, onComplete}) {
    this.progress = progress;
    this.onComplete = onComplete;
  }

  getOptions(pageKey) {

    //Case 1: Show the first page of options
    if (pageKey === "root") {
      const lineupHashimons = playerState.lineup.map(id => {
        const hashimon = playerState.hashimons[id];
        return {
          label: hashimon.name,
          description: `${hashimon.description} (stage ${hashimon.stage}/${hashimon.maxStage})`,
          handler: () => {
            this.keyboardMenu.setOptions( this.getOptions(id) )
          }
        }
      })
      return [
        ...lineupHashimons,
        {
          label: "My Collection",
          description: "Your captured Hashimons",
          handler: () => {
            if (!playerState.storyFlags.OPENED_COLLECTION) {
              playerState.storyFlags.OPENED_COLLECTION = true;
              window.questManager?.advanceIfComplete("OPENED_COLLECTION");
              playerState.save();
            }
            //Hand control over to the collection overlay; resume the game when it closes
            this.esc?.unbind();
            this.keyboardMenu.end();
            this.element.remove();
            const collection = new HashimonCollection({
              onComplete: () => {
                this.onComplete();
              }
            });
            collection.init(document.querySelector(".game-container"));
          }
        },
        {
          label: "Save",
          description: "Save your map position (your party saves automatically)",
          handler: () => {
            this.progress.save();
            this.close();
          }
        },
        {
          label: "Close",
          description: "Close the pause menu",
          handler: () => {
            this.close();
          }
        }
      ]
    }

    //Case 2: Show the options for just one Hashimon (by id).
    //Anything you caught and haven't equipped shows up here.
    const unequipped = Object.keys(playerState.hashimons).filter(id => {
      return playerState.lineup.indexOf(id) === -1;
    }).map(id => {
      const hashimon = playerState.hashimons[id];
      return {
        label: `Swap for ${hashimon.name}`,
        description: `${hashimon.description} (stage ${hashimon.stage}/${hashimon.maxStage})`,
        handler: () => {
          playerState.swapLineup(pageKey, id);
          this.keyboardMenu.setOptions( this.getOptions("root") );
        }
      }
    })

    return [
      ...unequipped,
      {
        label: "Move to front",
        description: "Put this Hashimon first in the list",
        handler: () => {
          playerState.moveToFront(pageKey);
          this.keyboardMenu.setOptions( this.getOptions("root") );
        }
      },
      {
        label: "Back",
        description: "Back to root menu",
        handler: () => {
          this.keyboardMenu.setOptions( this.getOptions("root") );
        }
      }
    ];
  }

  createElement() {
    this.element = document.createElement("div");
    this.element.classList.add("PauseMenu");
    this.element.classList.add("overlayMenu");
    this.element.innerHTML = (`
      <h2>Pause Menu</h2>
    `)
  }

  close() {
    this.esc?.unbind();
    this.keyboardMenu.end();
    this.element.remove();
    this.onComplete();
  }

  async init(container) {
    this.createElement();
    this.keyboardMenu = new KeyboardMenu({
      descriptionContainer: container
    })
    this.keyboardMenu.init(this.element);
    this.keyboardMenu.setOptions(this.getOptions("root"));

    container.appendChild(this.element);

    utils.wait(200);
    this.esc = new KeyPressListener("Escape", () => {
      this.close();
    })
  }

}