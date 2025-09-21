// admin.js — wallet-gated admin console for adding dynamic collections
const OWNER = "0x0df214be853cae6f646c9929eaff857cb3452efd"; // admin wallet (lowercased)
const CHAIN_ID = 84532;
const NETWORK_PARAMS = { chainId:"0x14A34", chainName:"Base Sepolia", rpcUrls:["https://sepolia.base.org"], nativeCurrency:{name:"Ether",symbol:"ETH",decimals:18}, blockExplorerUrls:["https://sepolia.basescan.org"] };

let provider=null, signer=null, account=null, isConnected=false;

function shortAddr(a){ return a? (a.slice(0,4) + "…" + a.slice(-5)) : ""; }
function updateUI(){
  const empty = document.getElementById('emptyMsg');
  const editor = document.getElementById('editorSec');
  if (isConnected && account === OWNER) {
    empty.style.display = 'none';
    editor.style.display = 'grid';
  } else {
    empty.style.display = '';
    editor.style.display = 'none';
  }
  const btn = document.getElementById('connect');
  btn.textContent = isConnected? ("🦊 " + shortAddr(account)) : "🦊 Connect";
  btn.title = isConnected ? "Disconnect" : "Connect wallet";
}

async function ensureNetwork(){ 
  const net = await provider.getNetwork(); 
  if (net.chainId === CHAIN_ID) return; 
  try { await provider.send("wallet_switchEthereumChain", [{ chainId: NETWORK_PARAMS.chainId }]); } 
  catch (e) { if (e && e.code === 4902) await provider.send("wallet_addEthereumChain", [NETWORK_PARAMS]); else throw e; }
}

async function connectWallet(){
  if (!window.ethereum){ alert("Please install MetaMask"); return; }
  provider = new ethers.providers.Web3Provider(window.ethereum, "any");
  const [acc] = await provider.send("eth_requestAccounts", []);
  signer = provider.getSigner();
  account = acc.toLowerCase();
  await ensureNetwork();
  isConnected = true;
  window.ethereum.on("accountsChanged", (accs)=>{
    if (!accs || !accs.length){ disconnectWallet(); return; }
    account = accs[0].toLowerCase(); isConnected = true; updateUI();
  });
  window.ethereum.on("chainChanged", ()=>{ /* ignore, admin is UI only */ });
  updateUI();
}

function disconnectWallet(){ provider=null; signer=null; account=null; isConnected=false; updateUI(); }

async function toggleConnect(){ if (!isConnected) await connectWallet(); else disconnectWallet(); }

function getCollections(){
  try{ return JSON.parse(localStorage.getItem("mc_collections")||"[]"); }catch{ return []; }
}
function setCollections(list){ localStorage.setItem("mc_collections", JSON.stringify(list)); }

function showStatus(msg, ok=false){
  const el = document.getElementById('status');
  el.textContent = msg || "";
  el.className = "hint " + (ok? "ok":"bad");
}

function buildPreviewHTML(name, code){
  // sandbox page with p5 + simple API shim
  return `<!doctype html>
<html><head><meta charset="utf-8" />
<style>html,body{margin:0;background:#000;color:#e6e6ec;font-family:ui-monospace,Menlo,Consolas,monospace}</style>
<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.2/p5.min.js"></script>
</head><body>
<main id="holder"></main>
<script>
  (function(){
    const registry = {};
    const api = { add: (n, fn)=>{ registry[n]=fn; } };
    // run user code in Function sandbox with api available
    try{
      (new Function("api", ${JSON.stringify(code)}))(api);
    }catch(e){
      document.body.innerHTML = '<pre style="color:#EB5757;padding:12px">Error in code: '+ e.message +'</pre>';
      return;
    }
    const name = ${JSON.stringify(name)};
    const drawFn = registry[name] || registry[Object.keys(registry)[0]];
    if (!drawFn){
      document.body.innerHTML = '<pre style="color:#EB5757;padding:12px">No style registered. Use api.add("name", fn)</pre>';
      return;
    }
    new p5((p)=>{
      p.setup = ()=>{
        const size = Math.min(window.innerWidth, window.innerHeight)-20;
        const c = p.createCanvas(Math.max(280, Math.min(size, 800)), Math.max(280, Math.min(size, 800)));
        c.parent("holder");
        p.noLoop();
      };
      p.draw = ()=>{ try{ drawFn(p); }catch(e){ p.background(0); p.fill(235,87,87); p.text('Runtime error: '+e.message, 10, 20); } };
    });
  })();
</script>
</body></html>`;
}

function handlePreview(){
  const name = document.getElementById('collName').value.trim();
  const code = document.getElementById('collCode').value;
  const iframe = document.getElementById('preview');
  if (!name){ showStatus("Missing collection name", false); return; }
  if (!code.trim()){ showStatus("Missing code", false); return; }
  const blob = new Blob([buildPreviewHTML(name, code)], {type: "text/html"});
  iframe.src = URL.createObjectURL(blob);
  showStatus("Preview updated", true);
}

function handleAdd(){
  const name = document.getElementById('collName').value.trim();
  const code = document.getElementById('collCode').value;
  if (!name){ showStatus("Missing collection name", false); return; }
  if (!code.trim()){ showStatus("Missing code", false); return; }
  const list = getCollections();
  const exists = list.find(x => (x.name.toLowerCase() === name.toLowerCase()));
  if (exists){ exists.code = code; } else { list.push({name, code}); }
  setCollections(list);
  renderSavedList();
  showStatus("Saved. It will appear on home after refresh.", true);
}

function handleClear(){ document.getElementById('preview').src='about:blank'; showStatus(""); }



function getHiddenCore(){
  try { return JSON.parse(localStorage.getItem('mc_hide_core')||'[]'); } catch { return []; }
}
function setHiddenCore(arr){
  localStorage.setItem('mc_hide_core', JSON.stringify(arr||[]));
}
const CORE_LIST = ["Organic Rings", "Flow Lines"]; // names as shown on Home's dropdown

function renderCoreList(){
  const wrap = document.getElementById('coreList');
  if (!wrap) return;
  const hidden = getHiddenCore().map(s=> (s||'').toLowerCase());
  wrap.innerHTML = '';
  CORE_LIST.forEach(name => {
    const isHidden = hidden.includes(name.toLowerCase());
    const box = document.createElement('div');
    box.className = 'saved-item';
    box.dataset.name = name;
    box.innerHTML = `
      <div class="saved-head">
        <div><strong>${name}</strong> ${isHidden? '<span class="hint bad">(hidden)</span>' : ''}</div>
        <div class="saved-actions">
          <button data-act="previewCore">Preview</button>
          <button data-act="${isHidden? 'unhideCore':'hideCore'}" class="${isHidden? '':'danger'}">${isHidden? 'Unhide on Home':'Hide from Home'}</button>
        </div>
      </div>
    `;
    wrap.appendChild(box);
  });

  wrap.onclick = (e)=>{
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const act = btn.dataset.act;
    const name = btn.closest('.saved-item')?.dataset?.name;
    if (!name) return;
    let list = getHiddenCore();
    switch(act){
      case 'previewCore': {
        const iframe = document.getElementById('preview');
        if (iframe){
          iframe.src = `index.html?style=${encodeURIComponent(name)}`;
          showStatus(`Previewing core: ${name}`, true);
        } else {
          window.open(`index.html?style=${encodeURIComponent(name)}`, '_blank');
        }
        break;
      }
      case 'hideCore': {
        if (!list.map(s=>s.toLowerCase()).includes(name.toLowerCase())) list.push(name);
        setHiddenCore(list);
        renderCoreList();
        showStatus('Hidden on Home (refresh to see).', true);
        break;
      }
      case 'unhideCore': {
        list = list.filter(s => s.toLowerCase() !== name.toLowerCase());
        setHiddenCore(list);
        renderCoreList();
        showStatus('Visible on Home again.', true);
        break;
      }
    }
  };
}

function renderSavedList(){
  const wrap = document.getElementById('savedList');
  if (!wrap) return;
  const q = (document.getElementById('searchSaved')?.value || '').trim().toLowerCase();
  const list = getCollections();
  wrap.innerHTML = '';
  const filtered = list.filter(x => !q || (x.name||'').toLowerCase().includes(q));
  if (!filtered.length){
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'No saved collections';
    wrap.appendChild(empty);
    return;
  }
  filtered.forEach((item, idx)=>{
    const box = document.createElement('div');
    box.className = 'saved-item';
    box.dataset.name = item.name;
    box.innerHTML = `
      <div class="saved-head">
        <div><strong>${item.name||'(untitled)'}</strong></div>
        <div class="saved-actions">
          <button data-act="view">View code</button>
          <button data-act="copy">Copy</button>
          <button data-act="load">Load in editor</button>
          <button data-act="preview">Preview</button>
          <button data-act="remove" class="danger">Remove from Home</button>
        </div>
      </div>
      <pre class="saved-code"><code>${(item.code||'').replace(/[<>&]/g, m => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[m]))}</code></pre>
    `;
    wrap.appendChild(box);
  });

  // delegate events
  wrap.onclick = (e)=>{
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const act = btn.dataset.act;
    const itemEl = btn.closest('.saved-item');
    const name = itemEl?.dataset?.name;
    const all = getCollections();
    const item = all.find(x => (x.name||'').toLowerCase() === (name||'').toLowerCase());
    if (!item) return;

    switch(act){
      case 'view': {
        const pre = itemEl.querySelector('.saved-code');
        pre.style.display = (pre.style.display === 'block') ? 'none' : 'block';
        break;
      }
      case 'copy': {
        navigator.clipboard.writeText(item.code||'').then(()=>showStatus('Copied!', true)).catch(()=>showStatus('Copy failed', false));
        break;
      }
      case 'load': {
        document.getElementById('collName').value = item.name||'';
        document.getElementById('collCode').value = item.code||'';
        showStatus('Loaded into editor', true);
        break;
      }
      case 'preview': {
        document.getElementById('collName').value = item.name||'';
        document.getElementById('collCode').value = item.code||'';
        handlePreview();
        break;
      }
      case 'remove': {
        if (!confirm(`Remove "${item.name}" from Home?`)) return;
        const remain = all.filter(x => (x.name||'').toLowerCase() !== (item.name||'').toLowerCase());
        setCollections(remain);
        renderSavedList();
        showStatus('Removed. Refresh Home to update.', true);
        break;
      }
    }
  };

  // live search
  const search = document.getElementById('searchSaved');
  if (search && !search._wired){
    search._wired = true;
    search.addEventListener('input', ()=>renderSavedList());
  }
}



function ensureRender(attempt=0){
  try { renderCoreList(); } catch(e){ /* ignore */ }
  try { renderSavedList(); } catch(e){ /* ignore */ }
  if (attempt < 10) setTimeout(()=>ensureRender(attempt+1), 200);
}

window.addEventListener("DOMContentLoaded", ()=>{
  document.getElementById('connect').addEventListener('click', toggleConnect);
  document.getElementById('btnPreview').addEventListener('click', handlePreview);
  document.getElementById('btnAdd').addEventListener('click', handleAdd);
  document.getElementById('btnClear').addEventListener('click', handleClear);
  renderSavedList();
  updateUI();
});