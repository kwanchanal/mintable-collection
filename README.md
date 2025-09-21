# mintable-collection — generative art

**mintable-collection** is the web app + smart contract powering *kwanchanal geographic*, a personal, code‑driven generative art collection.

Visitors pick a **Collection** (the rendering algorithm), choose or randomize a **seed**, and instantly get a unique artwork. If they **mint**, that `(collection, seed)` pair is recorded on‑chain and publicly represents ownership of that exact configuration.

> Stack: p5.js preview, on‑chain HTML ERC‑721, Base L2, EIP‑2981 royalty, IBM Plex Mono

---

## Concept
- Every output = `(collection, seed)` → same algorithm, different seeds → different composition.
- Minting stores both values on‑chain; tokens expose `animation_url` as **on‑chain HTML**, so marketplaces can render the live canvas without IPFS.
- The site includes a 📖 tooltip (hover/tap) next to **Collection** explaining the idea for new visitors.

---

## Features
- **Collections (starter)**  
  - *Organic Rings* — layered hand‑drawn‑like rings  
  - *Flow Lines* — field‑driven flowing strokes
- **Seed controls**  
  - `Randomize` generates a new seed **on every click**  
  - Type any seed + `Apply` for deterministic re‑render  
  - Share via `?seed=...` permalink
- **Mint on Base**  
  - Mint price **0.1 ETH** (adjustable)  
  - **10% royalty** (EIP‑2981) to the artist  
  - Fully **on‑chain HTML** metadata/artwork (no IPFS)
- **Creator‑only (UI gate)**  
  The **Mint** button is enabled only for the artist wallet `0x0df214be853caE6f646c9929EAfF857cb3452EFd`.  
  *Note:* this is front‑end gating for demos; enforce on‑chain if needed (see *Security*).

Typography: **IBM Plex Mono** everywhere (including buttons/dropdowns).

---

## Project structure
```
index.html         # UI — Collection / Randomize / Seed / Apply | Save / Mint / Connect (+ tooltip)
style.css          # Dark theme + IBM Plex Mono + tooltip styles
sketch.js          # p5.js preview before mint
mint.js            # MetaMask & contract calls (Base)
contracts/
  MintableCollectionOnchain.sol  # ERC‑721 + EIP‑2981 + on‑chain HTML + 0.1 ETH mint
```

---

## Getting started (Base Sepolia testnet)
1) **Deploy the contract** (Remix)
   - Compile `contracts/MintableCollectionOnchain.sol`
   - Deploy to **Base Sepolia** (`chainId 84532`)
   - Constructor:
     - `royaltyReceiver` = your wallet
     - `royaltyBps` = `1000` (10%)
   - Copy your **contract address**
2) **Configure the web app**
   - Edit `mint.js`:
     ```js
     const CONTRACT_ADDRESS = "0x...";  // your deployed address
     const CHAIN_ID = 84532;            // Base Sepolia
     ```
3) **Run the site**
   - Open `index.html` (or Live Server)
   - **Connect** → choose a Collection → `Randomize` or type seed → `Apply`
   - `Save` downloads PNG; `Mint` mints (needs test ETH)
4) **Verify**
   - On Basescan read `tokenURI(tokenId)` → JSON with `animation_url = data:text/html;base64,...`
   - Decode to see the embedded HTML that renders the artwork

> Mainnet later? Switch `CHAIN_ID` and network params in `mint.js` to **Base (8453)**.

---

## Contract summary
- Name: `MintableCollectionOnchain`  
- Standards: **ERC‑721** + **EIP‑2981**  
- Core:
  - `mint(string collection, string seed)` — **payable**, requires `msg.value >= mintPrice` (default `0.1 ether`)
  - `tokenURI(uint256 tokenId)` — returns `data:application/json` with `animation_url` as on‑chain HTML
  - `setMintPrice(uint256 weiPrice)`, `withdraw(address payable to)` — owner only
- Stores `collection` + `seed` per token

### Seed uniqueness (optional)
By default, duplicates are allowed (ownership is tied to the token). To **enforce unique `(collection,seed)`**, add:
```solidity
mapping(bytes32 => bool) public taken;
function mint(string memory collection, string memory seed) external payable returns (uint256) {
    bytes32 key = keccak256(abi.encodePacked(collection, seed));
    require(!taken[key], "seed already minted");
    taken[key] = true;
    // proceed with mint...
}
```

### Security (on‑chain enforcement)
To enforce **creator‑only** minting on‑chain:
```solidity
require(msg.sender == owner(), "creator only");
```
Or implement an **allowlist** / per‑wallet limits as needed.

---

## Deploy to GitHub Pages
1) Push files at repo root.  
2) Settings → Pages → Source: *Deploy from a branch* → `main` / `/ (root)`  
3) Visit `https://<username>.github.io/<repo>/`

---

## Roadmap (suggested)
- Gallery grid with thumbnails + **Copy permalink**
- New collections (e.g., cellular noise, pointillism, on‑chain SVG)
- Open sale / allowlist / per‑wallet limits
- High‑res export & batch rendering
- PWA “Add to Home Screen”

---

## Thanks
- [p5.js](https://p5js.org/) • OpenZeppelin Contracts • Base (L2)

---

## Copyright
Artwork and brand belong to **kwanchanal geographic**. Code samples are provided for this project; license can be adjusted per the artist’s preference.
