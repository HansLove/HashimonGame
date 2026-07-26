(function () {

  const GAME_W = 352;
  const GAME_H = 198;

  function fitGameScale() {
    const hint = document.querySelector(".how-to-play");
    const hintH = hint ? hint.offsetHeight : 28;
    const pad = 16;
    const scale = Math.min(
      (window.innerWidth - pad) / GAME_W,
      (window.innerHeight - hintH - pad) / GAME_H
    );
    document.documentElement.style.setProperty(
      "--game-scale",
      String(Math.max(0.4, scale))
    );
  }

  window.addEventListener("resize", fitGameScale);
  fitGameScale();
  requestAnimationFrame(fitGameScale);

  window.overworld = new Overworld({
    element: document.querySelector(".game-container")
  });
  window.overworld.init();

})();
