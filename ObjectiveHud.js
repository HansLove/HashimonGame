class ObjectiveHud {
  createElement() {
    this.element = document.createElement("div");
    this.element.classList.add("ObjectiveHud");
    this.element.innerHTML = (`
      <div class="ObjectiveHud_title"></div>
      <div class="ObjectiveHud_text"></div>
    `);
  }

  update() {
    const objective = window.questManager.getCurrentObjective();
    if (!objective) {
      this.element.classList.add("hidden");
      return;
    }
    this.element.classList.remove("hidden");
    this.element.querySelector(".ObjectiveHud_title").textContent = objective.questTitle;
    this.element.querySelector(".ObjectiveHud_text").textContent = objective.stepText;
  }

  init(container) {
    this.createElement();
    container.appendChild(this.element);
    this.update();

    document.addEventListener("QuestUpdated", () => this.update());
    document.addEventListener("PlayerStateUpdated", () => this.update());
  }
}
