// p5.js preview with transparent background (so bg trail shows through)
const CANVAS_TRANSPARENT_BG = false;

let seedStr=null,rng,palette,currentStyle="leh";
function seededRandom(){let h=1779033703^seedStr.length;for(let i=0;i<seedStr.length;i++){h=Math.imul(h^seedStr.charCodeAt(i),3432918353);h=(h<<13)|(h>>>19)}return function(){h=Math.imul(h^(h>>>16),2246822507);h=Math.imul(h^(h>>>13),3266489909);h^=h>>>16;return (h>>>0)/4294967296}}
function srand(min=0,max=1){return min+rng()*(max-min)}function srange(a,b){return Math.floor(srand(a,b))}function pick(arr){return arr[Math.floor(srand(0,arr.length))]}function parseSeedFromURL(){const p=new URLSearchParams(window.location.search);return p.get("seed")}function hashCode(s){let h=0;for(let i=0;i<s.length;i++){h=(h<<5)-h+s.charCodeAt(i);h|=0}return h}
function computeCanvasSize(){const w=Math.min(window.innerWidth-24,1000);const panelH=document.querySelector('.panel')?.offsetHeight||0;const h=Math.min(window.innerHeight-panelH-24,1000);return Math.max(280,Math.min(w,h))}
function initSeed(optionalSeed){seedStr=optionalSeed??parseSeedFromURL()??(Date.now().toString(36));rng=seededRandom();randomSeed(int(hashCode(seedStr)&0x7fffffff));noiseSeed(int(hashCode(seedStr)&0x7fffffff));const echo=document.getElementById("seedEcho");if(echo)echo.textContent=`seed: ${seedStr}`;const seedInput=document.getElementById("seed");if(seedInput)seedInput.value=seedStr}
function setup(){const size=computeCanvasSize();const c=createCanvas(size,size);c.parent("holder");noLoop();palette=[color(240,200,210,190),color(120,155,135,200),color(245,215,120,210),color(202,122,92,200),color(220,220,230,220)];initSeed();document.getElementById("regen").addEventListener("click",()=>{const newSeed=(Date.now().toString(36)+Math.floor(Math.random()*1e6).toString(36));initSeed(newSeed);redraw();updateURLSeed(newSeed)});document.getElementById("applySeed").addEventListener("click",()=>{const v=document.getElementById("seed").value.trim();if(v){initSeed(v);redraw();updateURLSeed(v)}});document.getElementById("save").addEventListener("click",()=>{saveCanvas(`mintable_collection_${currentStyle}_${seedStr}.png`)});document.getElementById("styleSelect").addEventListener("change",e=>{currentStyle=e.target.value;redraw()})}
function windowResized(){const size=computeCanvasSize();resizeCanvas(size,size);redraw()}
function updateURLSeed(v=seedStr){const url=new URL(window.location.href);url.searchParams.set("seed",v);history.replaceState({}, "", url)}
function draw(){
  if(CANVAS_TRANSPARENT_BG){ clear(); } else { background(0); }
  drawLeh();
}

function drawLeh() {
  noFill();
  strokeWeight(1.2);
  // ใช้พาเลตสี global
  for (let layer = 0; layer < 6; layer++) {
    let zOff = layer * 500;
    let c = pick(palette);
    stroke(c);
    for (let y = 0; y < height; y += 8) {
      beginShape();
      for (let x = 0; x <= width; x += 8) {
        let n = noise(x * 0.01, y * 0.01, zOff * 0.001);
        let offset = map(n, 0, 1, -60, 60);
        vertex(x, y + offset);
      }
      endShape();
    }
  }
}
