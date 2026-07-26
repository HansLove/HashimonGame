# Hashimon Album App

Offline evolution sticker album for your exported Hashimons.

## Quick start

1. In the game: **Esc → My Collection → Export Album**
2. Unzip the downloaded pack
3. Open **`album/index.html`** in your browser
4. For each tier slot (0★, 2★, 5★):
   - Click **Copy prompt** and generate art in your AI tool
   - Click **Add image** and pick your PNG/JPG
5. Reload the page — your images persist in IndexedDB

## File layout (inside the ZIP)

```
album.json          — manifest with creatures and embedded prompts
prompts/            — one .txt prompt per slot (same text as in JSON)
art/                — optional: drop PNGs here manually
album/
  index.html        — this app
  album.js
  album.css
README.md
```

## Tips

- Generate the **same Hashimon** at tiers 0, 2, and 5 to show its evolution row.
- Drag and drop images onto empty slots.
- Use **Load pack** if you moved `album.json` without the rest of the folder.
