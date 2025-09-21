// dynamic-styles.js — load admin-added collections onto index without changing core code
// It reads localStorage.mc_collections [{name, code}] and registers them.
// It also extends the <select id="styleSelect"> with new options.
// It softly intercepts p5 draw() to support custom styles while keeping originals intact.

(function(){
  const REG = {}; // name -> draw(p)
  function addOption(name){
    const sel = document.getElementById('styleSelect');
    if (!sel) return;
    const exists = Array.from(sel.options).some(o => o.value.toLowerCase() === name.toLowerCase());
    if (!exists){
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      sel.appendChild(opt);
    }
  }

  function register(name, fn){
    REG[name] = fn;
    addOption(name);
  }

  function loadCollections(){
    let list = [];
    try{ list = JSON.parse(localStorage.getItem('mc_collections')||'[]'); }catch{ list=[]; }
    list.forEach(({name, code})=>{
      try{
        const api = { add: (n, fn)=>register(n, fn) };
        // Execute user code in a limited scope (no global "this").
        (new Function("api", code))(api);
        if (name && !REG[name]){
          // If user added under some other name in code, still add the provided name mapping if available.
          if (REG[Object.keys(REG)[0]]){
            REG[name] = REG[Object.keys(REG)[0]];
            addOption(name);
          }
        }
      }catch(e){
        console.warn("Failed to load collection:", name, e);
      }
    });
  }

  function interceptDraw(){
    if (!window.draw) { // sketch.js hasn't defined yet; try again shortly
      setTimeout(interceptDraw, 60);
      return;
    }
    const originalDraw = window.draw;
    window.draw = function(){
      try{
        // currentStyle is defined in sketch.js (global)
        if (window.currentStyle && REG[window.currentStyle]){
          if (typeof window.CANVAS_TRANSPARENT_BG !== 'undefined' && !window.CANVAS_TRANSPARENT_BG){
            // background will be done by the user style if needed; keep consistent with existing behavior
          }
          REG[window.currentStyle](window); // pass p5 instance via global (instance mode uses globals)
          return;
        }
      }catch(e){
        console.warn("custom style draw failed", e);
      }
      // Fallback to original rings/lines
      originalDraw();
    };
  }


  // --- Hide core collections + URL style selection ---
  function getHiddenCore(){
    try { return JSON.parse(localStorage.getItem('mc_hide_core')||'[]'); } catch { return []; }
  }
  function setHiddenCore(arr){
    localStorage.setItem('mc_hide_core', JSON.stringify(arr||[]));
  }
  function applyHiddenCore(){
    const sel = document.getElementById('styleSelect');
    if (!sel) return;
    const hidden = getHiddenCore().map(s=> (s||'').toLowerCase());
    if (!hidden.length) return;
    // If selected is hidden, we'll switch later
    const toRemove = [];
    for (const opt of Array.from(sel.options)){
      if (hidden.includes((opt.textContent||opt.value||'').toLowerCase())){
        toRemove.push(opt);
      }
    }
    toRemove.forEach(opt => opt.remove());
    // Ensure a valid selection
    if (sel.selectedIndex < 0 && sel.options.length){
      sel.selectedIndex = 0;
      sel.dispatchEvent(new Event('change'));
    }
  }
  function selectByURLParam(){
    try{
      const url = new URL(window.location.href);
      const name = url.searchParams.get('style');
      if (!name) return;
      const sel = document.getElementById('styleSelect');
      if (!sel) return;
      const target = Array.from(sel.options).find(o => (o.textContent||o.value).toLowerCase() === name.toLowerCase());
      if (target){
        sel.value = target.value;
        sel.dispatchEvent(new Event('change'));
      }
    }catch(e){ /* ignore */ }
  }

  window.addEventListener('DOMContentLoaded', ()=>{
    loadCollections();
    interceptDraw();
    applyHiddenCore();
    selectByURLParam();
  });
})();