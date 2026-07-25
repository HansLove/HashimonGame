class MapLabel {
  show(label, container) {
    if (this.element) {
      this.element.remove();
    }

    this.element = document.createElement("div");
    this.element.classList.add("MapLabel");
    this.element.textContent = label;
    container.appendChild(this.element);

    requestAnimationFrame(() => {
      this.element.classList.add("visible");
    });

    setTimeout(() => {
      this.element.classList.remove("visible");
      setTimeout(() => this.element?.remove(), 400);
    }, 1800);
  }
}
