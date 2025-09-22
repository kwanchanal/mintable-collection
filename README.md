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
