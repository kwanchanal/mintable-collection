// admin.js — console without login (no connect button)

const $ = (s, r=document)=>r.querySelector(s);
const el = (t,cls)=>{const n=document.createElement(t); if(cls) n.className=cls; return n;};

// ---------- Preview sandbox ----------
const PREBOOT = `<!doctype html><html><head><meta charset="utf-8">
<style>html,body{margin:0;height:100%;background:#000;color:#ddd}</style>
<script src="https://cdn.jsdelivr.net/npm/p5@1.9.3/lib/p5.min.js"></script></head><body></body></html>`;

function runPreview(code){
  const iframe = $('#previewFrame');
  iframe.srcdoc = PREBOOT;
  setTimeout(()=>{
    const doc = iframe.contentDocument;
    iframe.contentWindow.api = { add:(name,draw)=> new iframe.contentWindow.p5(p=>{ p.setup=()=>{p.createCanvas(520,320)}; p.draw=()=>draw(p); }) };
    const s = doc.createElement('script'); s.type='module'; s.textContent = code;
    doc.body.appendChild(s);
  }, 30);
}
$('#btnPreview')?.addEventListener('click', ()=> runPreview($('#newCode').value));
$('#btnClearPreview')?.addEventListener('click', ()=> runPreview("api.add('empty',p=>p.background(0))"));

// ---------- Saved collections ----------
const LS_KEY='mc_collections';
function getSaved(){ try{ const v = JSON.parse(localStorage.getItem(LS_KEY)||'[]'); return Array.isArray(v)?v:[]; } catch { return []; } }
function setSaved(arr){ localStorage.setItem(LS_KEY, JSON.stringify(arr)); }

function addCollectionToHome(){
  const name = ($('#newName').value||'').trim();
  const code = $('#newCode').value||'';
  if(!name) return alert('Please enter a collection name');
  if(!code) return alert('Please paste your style.js code');
  const arr = getSaved();
  const i = arr.findIndex(x => (x.name||'').toLowerCase() === name.toLowerCase());
  if(i>=0) arr[i].code = code; else arr.push({name, code});
  setSaved(arr);
  renderSaved($('#searchSaved').value||'');
  alert('Saved! Switch to Home to try it.');
}
$('#btnAddToHome')?.addEventListener('click', addCollectionToHome);

function renderSaved(filter=''){
  const box = $('#savedList'); box.innerHTML='';
  const arr = getSaved().filter(x => (x.name||'').toLowerCase().includes((filter||'').toLowerCase()));
  if(!arr.length){ box.innerHTML = '<div class="muted">No saved collections</div>'; return; }
  arr.forEach(({name, code})=>{
    const row = el('div','item');
    const left = el('div'); left.innerHTML=`<strong>${name}</strong>`;
    const right = el('div'); right.className='row';
    const bPrev = el('button','btn'); bPrev.textContent='Preview'; bPrev.onclick=()=>runPreview(code);
    const bDel = el('button','btn'); bDel.textContent='Delete'; bDel.onclick=()=>{ const a=getSaved().filter(v=>v.name!==name); setSaved(a); renderSaved(filter); };
    right.append(bPrev,bDel); row.append(left,right); box.append(row);
  });
}
$('#searchSaved')?.addEventListener('input', (e)=> renderSaved(e.target.value));

// ---------- Core collections ----------
const HIDE_KEY='mc_hide_core';
const CORE_LIST=[{name:'Organic Rings'}, {name:'Flow Lines'}];

function getHidden(){ try{ return JSON.parse(localStorage.getItem(HIDE_KEY)||'[]'); }catch{return []} }
function setHidden(v){ localStorage.setItem(HIDE_KEY, JSON.stringify(v||[])); }
function isHidden(n){ const hid=getHidden().map(s=>(s||'').toLowerCase()); return hid.includes((n||'').toLowerCase()); }

function toggleCore(name){
  const hid = getHidden();
  const idx = hid.findIndex(s => (s||'').toLowerCase() === name.toLowerCase());
  if(idx>=0) hid.splice(idx,1); else hid.push(name);
  setHidden(hid);
  renderCore();
}

function renderCore(){
  const list = $('#coreList'); list.innerHTML='';
  CORE_LIST.forEach(item=>{
    const row = el('div','item');
    const left = el('div'); left.innerHTML = `<strong>${item.name}</strong>`;
    const right = el('div'); right.className='row';
    const bPrev = el('button','btn'); bPrev.textContent='Preview'; bPrev.onclick=()=>{
      runPreview("api.add('core', p=>{ p.background(0); p.noFill(); p.stroke(255); p.circle(p.width/2,p.height/2,Math.min(p.width,p.height)*0.6); })");
    };
    const bHide = el('button','btn'); const hidden = isHidden(item.name);
    bHide.textContent = hidden ? 'Unhide on Home' : 'Hide from Home';
    bHide.onclick = ()=> toggleCore(item.name);
    right.append(bPrev,bHide); row.append(left,right); list.append(row);
  });
}

window.addEventListener('DOMContentLoaded', ()=>{
  renderCore();
  renderSaved('');
});
