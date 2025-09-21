// No-HUD version with creator-only mint gate (owner set below)
const OWNER = "0x0df214be853cae6f646c9929eaff857cb3452efd";
const CONTRACT_ADDRESS = "0xYourSepoliaContractAddress"; // set after deploy
const CHAIN_ID = 84532;
const NETWORK_PARAMS = { chainId:"0x14A34", chainName:"Base Sepolia", rpcUrls:["https://sepolia.base.org"], nativeCurrency:{name:"Ether",symbol:"ETH",decimals:18}, blockExplorerUrls:["https://sepolia.basescan.org"] };

const ABI = [
  "function mint(string collection, string seed) public payable returns (uint256)",
  "function mintPrice() external view returns (uint256)"
];

let provider, signer, account;

function setMintEnabled(enabled) { 
  const btn = document.getElementById("mint");
  if (!btn) return;
  if (enabled) { btn.classList.remove("disabled"); btn.removeAttribute("disabled"); btn.title = "Mint (creator)"; }
  else { btn.classList.add("disabled"); btn.setAttribute("disabled", "true"); btn.title = "Creator-only"; }
}

async function ensureNetwork() { 
  const net = await provider.getNetwork(); 
  if (net.chainId === CHAIN_ID) return; 
  try { await provider.send("wallet_switchEthereumChain", [{ chainId: NETWORK_PARAMS.chainId }]); } 
  catch (e) { if (e && e.code === 4902) await provider.send("wallet_addEthereumChain", [NETWORK_PARAMS]); else throw e; } 
}

async function connectWallet() { 
  if (!window.ethereum) { alert("Please install MetaMask"); return; } 
  provider = new ethers.providers.Web3Provider(window.ethereum, "any"); 
  const [acc] = await provider.send("eth_requestAccounts", []); 
  signer = provider.getSigner(); 
  account = acc.toLowerCase(); 
  await ensureNetwork(); 
  setMintEnabled(account === OWNER);
}

function getStyleAndSeed() { 
  const collection = document.getElementById("styleSelect")?.value || "rings"; 
  const seed = (document.getElementById("seed")?.value || "auto"); 
  return { collection, seed }; 
}

async function mintNFT() { 
  try { 
    if (!signer) await connectWallet(); 
    if (account !== OWNER) { alert("Creator-only mint."); return; }
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    const ask = await contract.mintPrice(); 
    const { collection, seed } = getStyleAndSeed(); 
    const tx = await contract.mint(collection, seed, { value: ask }); 
    const receipt = await tx.wait(); 
    alert("Minted! Tx: " + receipt.transactionHash); 
  } catch (e) { 
    console.error(e); alert("Mint failed: " + (e?.data?.message || e.message)); 
  }
}

window.addEventListener("DOMContentLoaded", () => { 
  document.getElementById("connect").addEventListener("click", connectWallet); 
  document.getElementById("mint").addEventListener("click", mintNFT); 
  setMintEnabled(false); 
});
