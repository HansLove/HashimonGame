//Builds and downloads a ZIP album pack from the player's collection.
window.HashimonAlbumExport = {

  _jszipPromise: null,

  loadJSZip() {
    if (window.JSZip) { return Promise.resolve(window.JSZip); }
    if (this._jszipPromise) { return this._jszipPromise; }
    this._jszipPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "/lib/jszip.min.js";
      script.onload = () => resolve(window.JSZip);
      script.onerror = () => reject(new Error("Could not load JSZip"));
      document.head.appendChild(script);
    });
    return this._jszipPromise;
  },

  async fetchText(url) {
    const res = await fetch(url);
    if (!res.ok) { throw new Error(`Failed to fetch ${url}`); }
    return res.text();
  },

  async downloadZip(hashimons) {
    const JSZip = await this.loadJSZip();
    const { manifest, files } = HashimonAlbum.buildPack(hashimons);
    const zip = new JSZip();

    files.forEach(({ path, content }) => {
      zip.file(path, content);
    });

    const albumAssets = [
      ["album/index.html", "/album/index.html"],
      ["album/album.js", "/album/album.js"],
      ["album/album.css", "/album/album.css"],
      ["album/README.md", "/album/README.md"],
    ];

    for (const [zipPath, url] of albumAssets) {
      zip.file(zipPath, await this.fetchText(url));
    }

    const blob = await zip.generateAsync({ type: "blob" });
    const stamp = new Date().toISOString().slice(0, 10);
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `hashimon-album-${stamp}.zip`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(anchor.href), 5000);

    if (window.HashimonAlbumBridge) {
      await HashimonAlbumBridge.syncFromGame();
    }

    return {
      creatureCount: manifest.creatures.length,
      slotCount: manifest.creatures.reduce((n, c) => n + c.slots.length, 0),
    };
  },
};
