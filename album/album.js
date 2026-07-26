(function () {
  const Bridge = window.HashimonAlbumBridge;

  let manifest = null;
  const artUrls = new Map();
  let refreshTimer = null;
  let selectedCreatureId = null;
  let lastManifestSig = "";

  const $ = (sel) => document.querySelector(sel);

  function toast(msg) {
    const el = $("#album-toast");
    el.textContent = msg;
    el.classList.add("visible");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("visible"), 2400);
  }

  function dropArtUrl(artFile) {
    Bridge?.revokeArtUrl(artFile);
    artUrls.delete(artFile);
  }

  async function ensureArtUrl(artFile) {
    const blob = await Bridge.getArt(artFile);
    if (!blob) {
      if (artUrls.has(artFile)) { dropArtUrl(artFile); }
      return null;
    }
    if (artUrls.has(artFile)) { return artUrls.get(artFile); }
    const url = await Bridge.getArtUrl(artFile);
    if (url) { artUrls.set(artFile, url); }
    return url || null;
  }

  async function loadArtUrls() {
    if (!manifest || !Bridge) { return; }
    const active = new Set();

    for (const creature of manifest.creatures) {
      for (const slot of creature.slots) {
        active.add(slot.artFile);
        await ensureArtUrl(slot.artFile);
      }
    }

    for (const artFile of [...artUrls.keys()]) {
      if (!active.has(artFile)) { dropArtUrl(artFile); }
    }
  }

  function manifestSignature(data) {
    if (!data?.creatures?.length) { return ""; }
    return data.creatures.map(creature => [
      creature.id,
      creature.name,
      creature.currentStars,
      creature.stats?.hp,
      creature.stats?.maxHp,
      creature.stats?.power,
      creature.stats?.defense,
      creature.stats?.bestShareBits,
      creature.stats?.evolutionProgress,
    ].join(":")).join("|");
  }

  function countSlots() {
    if (!manifest) { return { filled: 0, total: 0 }; }
    let total = 0;
    let filled = 0;
    manifest.creatures.forEach(c => {
      c.slots.forEach(s => {
        total++;
        if (artUrls.has(s.artFile)) { filled++; }
      });
    });
    return { filled, total };
  }

  function updateProgress() {
    const { filled, total } = countSlots();
    $("#album-progress").textContent = `${filled} / ${total} filled`;
  }

  function updateHeader() {
    if (!manifest) { return; }
    $("#album-title").textContent = manifest.title || "Hashimon Album";
    const date = manifest.exportedAt
      ? new Date(manifest.exportedAt).toLocaleString()
      : "";
    $("#album-meta").textContent = `${manifest.creatures.length} creatures · exported ${date}`;
    updateProgress();
  }

  function updateBanner(linked) {
    const intro = $("#album-intro");
    if (linked) {
      intro.innerHTML = `
        <p class="AlbumIntro_linked">Linked to game save — stats sync automatically.</p>
        <p>Open the album from the game (Esc → My Collection → Open Album) so images and names stay on the same origin.</p>
        <ol>
          <li>Copy each tier prompt and generate art in your AI.</li>
          <li>Upload PNGs here — they appear in My Collection thumbnails.</li>
          <li>Rename or mine in the game — this album updates live.</li>
        </ol>`;
    }
  }

  async function copyPrompt(artFile) {
    const slot = findSlot(artFile);
    if (!slot?.prompt) {
      toast("Prompt not found.");
      return;
    }
    try {
      await navigator.clipboard.writeText(slot.prompt);
      toast("Prompt copied!");
    } catch (e) {
      toast("Copy failed — use prompts/ folder.");
    }
  }

  function findCreature(creatureId) {
    return manifest?.creatures?.find(c => c.id === creatureId) || null;
  }

  function slotFillCount(creature) {
    let filled = 0;
    creature.slots.forEach(s => {
      if (artUrls.has(s.artFile)) { filled++; }
    });
    return { filled, total: creature.slots.length };
  }

  function getBestPreview(creature) {
    const slots = [...creature.slots].sort((a, b) => b.tier - a.tier);
    for (const slot of slots) {
      const url = artUrls.get(slot.artFile);
      if (url) { return { url, tier: slot.tier }; }
    }
    return null;
  }

  function escapeHtml(text) {
    return String(text ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function openDetail(creatureId) {
    const creature = findCreature(creatureId);
    if (!creature) { return; }
    selectedCreatureId = creatureId;
    const shell = $("#album-detail");
    const content = $("#album-detail-content");
    content.innerHTML = renderDetailContent(creature);
    shell.hidden = false;
    shell.setAttribute("aria-hidden", "false");
    bindSlotEvents(content);
    document.body.style.overflow = "hidden";
  }

  function closeDetail() {
    selectedCreatureId = null;
    const shell = $("#album-detail");
    shell.hidden = true;
    shell.setAttribute("aria-hidden", "true");
    $("#album-detail-content").innerHTML = "";
    document.body.style.overflow = "";
  }

  function bindCardEvents() {
    document.querySelectorAll("[data-creature-id]").forEach(card => {
      card.addEventListener("click", () => openDetail(card.dataset.creatureId));
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openDetail(card.dataset.creatureId);
        }
      });
    });
  }

  function bindDetailEvents() {
    document.querySelectorAll("[data-close-detail]").forEach(el => {
      el.addEventListener("click", closeDetail);
    });
    document.addEventListener("keydown", onDetailKeydown);
  }

  function onDetailKeydown(e) {
    if (e.key === "Escape" && selectedCreatureId) {
      closeDetail();
    }
  }

  function renderDetailStats(creature) {
    const stats = creature.stats || {};
    const speciesLine = creature.speciesLabel || creature.species || "";
    const dnaShort = (creature.dna || "").slice(0, 16);
    const evo = stats.evolutionProgress != null ? `${stats.evolutionProgress} bits toward next star` : "—";

    return `
      <div class="AlbumDetail_stats">
        <div class="AlbumDetail_stat">
          <span class="AlbumDetail_stat-label">Species</span>
          <span class="AlbumDetail_stat-value">${escapeHtml(speciesLine)}</span>
        </div>
        <div class="AlbumDetail_stat">
          <span class="AlbumDetail_stat-label">Type</span>
          <span class="AlbumDetail_stat-value">${escapeHtml(formatTypes(creature))}</span>
        </div>
        <div class="AlbumDetail_stat">
          <span class="AlbumDetail_stat-label">Stars</span>
          <span class="AlbumDetail_stat-value">${creature.currentStars}★ now</span>
        </div>
        <div class="AlbumDetail_stat">
          <span class="AlbumDetail_stat-label">HP</span>
          <span class="AlbumDetail_stat-value">${stats.hp ?? "—"} / ${stats.maxHp ?? "—"}</span>
        </div>
        <div class="AlbumDetail_stat">
          <span class="AlbumDetail_stat-label">Power / Def</span>
          <span class="AlbumDetail_stat-value">${stats.power ?? "—"} / ${stats.defense ?? "—"}</span>
        </div>
        <div class="AlbumDetail_stat">
          <span class="AlbumDetail_stat-label">Best share</span>
          <span class="AlbumDetail_stat-value">${stats.bestShareBits ?? 0} bits</span>
        </div>
        <div class="AlbumDetail_stat">
          <span class="AlbumDetail_stat-label">Evolution</span>
          <span class="AlbumDetail_stat-value">${escapeHtml(evo)}</span>
        </div>
        <div class="AlbumDetail_stat">
          <span class="AlbumDetail_stat-label">DNA</span>
          <span class="AlbumDetail_stat-value">${escapeHtml(dnaShort)}…</span>
        </div>
      </div>`;
  }

  function renderDetailContent(creature) {
    const { filled, total } = slotFillCount(creature);
    const speciesLine = creature.speciesLabel || creature.species || "";
    const slots = creature.slots.map(renderSlot).join("");

    return `
      <h2 class="AlbumDetail_title" id="album-detail-title">${escapeHtml(creature.name)}</h2>
      <p class="AlbumDetail_subtitle">${escapeHtml(speciesLine)} · ${escapeHtml(formatStats(creature))} · ${filled}/${total} evolutions filled</p>
      ${renderDetailStats(creature)}
      <section class="AlbumDetail_section">
        <h3>Evolutions</h3>
        <div class="AlbumDetail_slots">${slots}</div>
      </section>`;
  }

  function renderGridCard(creature) {
    const preview = getBestPreview(creature);
    const { filled, total } = slotFillCount(creature);
    const speciesLine = creature.speciesLabel || creature.species || "";

    const previewHtml = preview
      ? `<img src="${preview.url}" alt="${escapeHtml(creature.name)}" />`
      : `<div class="AlbumCard_preview-empty">No art yet</div>`;

    return `
      <article class="AlbumCard" data-creature-id="${escapeHtml(creature.id)}" tabindex="0" role="button" aria-label="View ${escapeHtml(creature.name)} details">
        <div class="AlbumCard_preview">
          ${previewHtml}
          <span class="AlbumCard_stars">${creature.currentStars}★</span>
        </div>
        <div class="AlbumCard_head">
          <h2 class="AlbumCard_name">${escapeHtml(creature.name)}</h2>
          <p class="AlbumCard_meta">${escapeHtml(speciesLine)} · ${escapeHtml(formatStats(creature))}</p>
          <p class="AlbumCard_fill">${filled} / ${total} evolutions</p>
          <p class="AlbumCard_hint">Click to view details</p>
        </div>
      </article>`;
  }
  function findSlot(artFile) {
    if (!manifest) { return null; }
    for (const creature of manifest.creatures) {
      const slot = creature.slots.find(s => s.artFile === artFile);
      if (slot) { return slot; }
    }
    return null;
  }

  async function attachImage(artFile, file) {
    if (!Bridge) {
      toast("Album bridge not loaded.");
      return;
    }
    if (!file || !file.type.startsWith("image/")) {
      toast("Please choose a PNG or JPG image.");
      return;
    }
    await Bridge.putArt(artFile, file);
    const url = await Bridge.refreshArtUrl(artFile);
    if (url) {
      artUrls.set(artFile, url);
    } else {
      artUrls.delete(artFile);
    }
    lastManifestSig = "";
    renderAlbum();
    toast("Image saved locally!");
  }

  async function removeImage(artFile) {
    if (!Bridge) { return; }
    await Bridge.deleteArt(artFile);
    dropArtUrl(artFile);
    lastManifestSig = "";
    renderAlbum();
    toast("Image removed.");
  }

  function bindSlotEvents(scope = document) {
    scope.querySelectorAll("[data-pick]").forEach(input => {
      input.addEventListener("change", (e) => {
        const file = e.target.files?.[0];
        if (file) { attachImage(input.dataset.pick, file); }
        input.value = "";
      });
    });

    scope.querySelectorAll("[data-copy]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        copyPrompt(btn.dataset.copy);
      });
    });

    scope.querySelectorAll("[data-remove]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        removeImage(btn.dataset.remove);
      });
    });

    scope.querySelectorAll("[data-replace]").forEach(input => {
      input.addEventListener("change", (e) => {
        e.stopPropagation();
        const file = e.target.files?.[0];
        if (file) { attachImage(input.dataset.replace, file); }
        input.value = "";
      });
    });

    scope.querySelectorAll(".AlbumSlot_frame[data-drop]").forEach(frame => {
      frame.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.stopPropagation();
        frame.classList.add("dragover");
      });
      frame.addEventListener("dragleave", () => frame.classList.remove("dragover"));
      frame.addEventListener("drop", (e) => {
        e.preventDefault();
        e.stopPropagation();
        frame.classList.remove("dragover");
        const file = e.dataTransfer.files?.[0];
        if (file) { attachImage(frame.dataset.drop, file); }
      });
    });
  }

  function formatTypes(creature) {
    const types = creature.types;
    if (!types) { return creature.species || ""; }
    if (types.fusion) { return types.fusion; }
    if (types.secondary) {
      return `${types.primary.name} / ${types.secondary.name}`;
    }
    return types.primary?.name || creature.species || "";
  }

  function formatStats(creature) {
    const stats = creature.stats;
    if (!stats) {
      return `${creature.currentStars}★ · ${formatTypes(creature)}`;
    }
    const hp = stats.maxHp != null ? `HP ${stats.hp}/${stats.maxHp}` : "";
    const stars = `${creature.currentStars}★`;
    const types = formatTypes(creature);
    return [hp, stars, types].filter(Boolean).join(" · ");
  }

  function renderSlot(slot) {
    const filled = artUrls.has(slot.artFile);
    const url = artUrls.get(slot.artFile);

    if (filled) {
      return `
        <div class="AlbumSlot">
          <div class="AlbumSlot_label">${slot.tier}★</div>
          <div class="AlbumSlot_frame filled" data-drop="${slot.artFile}">
            <img src="${url}" alt="${slot.tier} star form" />
            <div class="AlbumSlot_filled-actions">
              <label>
                Replace
                <input type="file" accept="image/*" data-replace="${slot.artFile}" hidden>
              </label>
              <button type="button" data-remove="${slot.artFile}">Remove</button>
            </div>
          </div>
        </div>`;
    }

    return `
      <div class="AlbumSlot">
        <div class="AlbumSlot_label">${slot.tier}★</div>
        <div class="AlbumSlot_frame" data-drop="${slot.artFile}">
          <span class="AlbumSlot_empty">Empty slot</span>
          <div class="AlbumSlot_actions">
            <button type="button" data-copy="${slot.artFile}">Copy prompt</button>
            <label>
              Add image
              <input type="file" accept="image/*" data-pick="${slot.artFile}" hidden>
            </label>
          </div>
        </div>
      </div>`;
  }

  function renderAlbum() {
    const grid = $("#album-grid");
    if (!manifest || !manifest.creatures?.length) {
      grid.innerHTML = `<p class="AlbumEmpty">No album loaded. Play the game on localhost, export a pack, or load album.json.</p>`;
      closeDetail();
      return;
    }

    grid.innerHTML = manifest.creatures.map(renderGridCard).join("");
    bindCardEvents();
    updateProgress();

    if (selectedCreatureId) {
      const creature = findCreature(selectedCreatureId);
      if (creature) {
        const content = $("#album-detail-content");
        content.innerHTML = renderDetailContent(creature);
        bindSlotEvents(content);
      } else {
        closeDetail();
      }
    }
  }

  async function refreshManifest() {
    if (!Bridge) { return false; }
    const next = await Bridge.getManifest();
    if (!next?.creatures?.length) { return false; }

    const sig = manifestSignature(next);
    const statsOnly = manifest && sig === lastManifestSig;

    manifest = next;
    if (!statsOnly) {
      await loadArtUrls();
      lastManifestSig = sig;
    }

    updateHeader();
    renderAlbum();
    return true;
  }

  async function setManifest(data) {
    manifest = data;
    await loadArtUrls();
    lastManifestSig = manifestSignature(data);
    updateHeader();
    renderAlbum();
  }

  async function loadManifestFromUrl(url) {
    const res = await fetch(url);
    if (!res.ok) { throw new Error(`Could not load ${url}`); }
    return setManifest(await res.json());
  }

  async function syncFromGame() {
    if (!Bridge) { return false; }
    try {
      const result = await Bridge.syncFromGame();
      if (result.ok) { updateBanner(true); }
      return refreshManifest();
    } catch (e) {
      console.error(e);
      return refreshManifest();
    }
  }

  function hasGameSave() {
    try {
      return !!localStorage.getItem("Hashimon_PlayerState");
    } catch (e) {
      return false;
    }
  }

  function startLiveRefresh() {
    window.addEventListener("storage", (e) => {
      if (e.key === "Hashimon_PlayerState") {
        refreshManifest();
      }
    });
    document.addEventListener("PlayerStateUpdated", () => {
      refreshManifest();
    });
    refreshTimer = setInterval(() => {
      if (document.visibilityState === "visible") {
        refreshManifest();
      }
    }, 5000);
  }

  $("#load-json").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) { return; }
    try {
      const text = await file.text();
      await setManifest(JSON.parse(text));
      toast("Album loaded!");
    } catch (err) {
      toast("Invalid album.json");
    }
    e.target.value = "";
  });

  $("#import-pack")?.addEventListener("change", async (e) => {
    const files = e.target.files;
    if (!files?.length || !Bridge) { return; }
    try {
      const result = await Bridge.importPack(files);
      await refreshManifest();
      toast(`Imported ${result.artCount} image(s)${result.hasManifest ? " + manifest" : ""}.`);
    } catch (err) {
      toast("Import failed.");
    }
    e.target.value = "";
  });

  async function init() {
    bindDetailEvents();

    if (!Bridge) {
      renderAlbum();
      toast("Bridge not loaded — open via localhost:8081/album/");
      return;
    }

    if (hasGameSave()) {
      await Bridge.syncFromGame().catch(() => {});
    }

    const loaded = await refreshManifest();
    if (loaded) {
      if (hasGameSave()) { updateBanner(true); }
      startLiveRefresh();
      return;
    }

    const paths = ["../album.json", "./album.json", "/album.json"];
    for (const path of paths) {
      try {
        await loadManifestFromUrl(path);
        return;
      } catch (e) { /* try next */ }
    }

    if (hasGameSave()) {
      toast("Save found but album could not load. Click Sync Album in the game.");
    }
    renderAlbum();
  }

  init();
})();
