# mintable-collection — generative art

**mintable-collection** is the web app + smart contract powering *kwanchanal geographic*, a personal, code‑driven generative art collection.

Visitors pick a **Collection** (the rendering algorithm), choose or randomize a **seed**, and instantly get a unique artwork. If they **mint**, that `(collection, seed)` pair is recorded on‑chain and publicly represents ownership of that exact configuration.

> Stack: p5.js preview, on‑chain HTML ERC‑721, Base L2, EIP‑2981 royalty, IBM Plex Mono

---

## Features
- Collections: Leh Ladakh (single active collection key = `leh`)
- Seed: Randomize (new seed each click), Apply, `?seed=` permalink
- Mint on Base: 0.1 ETH, 10% royalty (EIP‑2981), on‑chain HTML
- Connect toggle: shows short address, click again to disconnect
- Creator‑only (UI gate) wallet: `0x0df214be853caE6f646c9929EAfF857cb3452EFd`

Background: continuous grey trail (`bg.js`) behind the artwork.  
Typography: IBM Plex Mono for all controls.

---

## Quick start (Base Sepolia)
1) Deploy `contracts/MintableCollectionOnchain.sol` (Remix) → chainId **84532**  
2) In `mint.js` set:
```js
const CONTRACT_ADDRESS = "0x...";
const CHAIN_ID = 84532;
```
3) Open `index.html` → Connect → Randomize/Apply → Mint.

---

## Deploy to GitHub Pages
Push files at repo root → Settings → Pages → Deploy from a branch → `main` / `/`.

---

## How to Add a New Collection

You can extend this project by adding new **collections** (generative art styles).

### 1. Add option in `index.html`
Inside the `<select id="styleSelect">` block, add a new `<option>`:

```html
<select id="styleSelect" aria-label="Collection">
  <option value="leh">Leh Ladakh</option>
  <option value="sandworm">Sandworm</option>
  <option value="newcollection">New Collection</option> <!-- add this -->
</select>
```

The `value="newcollection"` will be the key used in `sketch.js`.

### 2. Update `sketch.js`
- In the main `draw()` function, add a case for your new collection:

```js
function draw() {
  if (CANVAS_TRANSPARENT_BG) { clear(); } else { background(0); }
  if (currentStyle === "leh") {
    drawLeh();
  } else if (currentStyle === "sandworm") {
    drawSandworm();
  } else if (currentStyle === "newcollection") {
    drawNewCollection();
  }
}
```

- Implement the new renderer:

```js
function drawNewCollection() {
  // Your p5.js code here
  // Use seedStr, rng, palette, noise, etc.
}
```

### 3. Test locally
Open `index.html` in browser or via `VSCode Live Server`.

- Select your new collection from the dropdown.
- Press **Randomize** or enter a seed → verify output.

### 4. Commit & Push
```bash
git add .
git commit -m "Add NewCollection generative art"
git push origin main
```

Visit your GitHub Pages site to see it live.

### Tips
- Reuse helper functions (`rand`, `irange`, `pick`, etc.) for consistency.
- Keep palette defined in `setup()` or inside your draw function.
- To tune density/shape → adjust step size, noise parameters, or loops.
