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
  if(currentStyle === "leh"){
    drawLeh();
  } else if(currentStyle === "sandworm"){
    drawSandworm();
  }
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

// --- Sandworm collection ---
function drawSandworm() {
  background(0);

  // ชั้นรองพื้นเส้น
  push();
  stroke(255, 50);
  strokeWeight(0.8);
  noFill();
  for (let y = 0; y < height; y += 6) {
    beginShape();
    for (let x = 0; x <= width; x += 8) {
      let n = noise(x * 0.006, y * 0.008, 0.25);
      let off = map(n, 0, 1, -18, 18);
      vertex(x, y + off);
    }
    endShape();
  }
  pop();

  const cells = irange(5, 9);
  for (let i = 0; i < cells; i++) {
    const cx = rand(width * 0.12, width * 0.88);
    const cy = rand(height * 0.15, height * 0.85);
    const R  = rand(min(width, height) * 0.09, min(width, height) * 0.28);
    drawOrganicCell(cx, cy, R, i);
  }

  const holes = irange(1, 3);
  for (let i = 0; i < holes; i++) {
    let cx = rand(width * 0.15, width * 0.85);
    let cy = rand(height * 0.18, height * 0.82);
    let r  = rand(min(width, height) * 0.06, min(width, height) * 0.14);
    doughnutHole(cx, cy, r);
  }
}

function drawOrganicCell(cx, cy, R, idx) {
  const layers = irange(6, 9);
  for (let l = 0; l < layers; l++) {
    const col = pick(palette);
    const aStroke = irange(80, 180);
    const aFill   = irange(40, 120);

    noFill();
    stroke(color(red(col), green(col), blue(col), aStroke));
    strokeWeight(rand(0.8, 1.8));
    beginShape();
    const density = rand(0.06, 0.12);
    for (let ang = 0; ang < TWO_PI; ang += density) {
      const base = map(l, 0, layers - 1, R * 0.35, R * 1.25);
      const wave = sin(ang * rand(4.5, 7.5) + l * 0.7) * rand(R*0.01, R*0.03);
      const n = noise(cos(ang) * 0.9 + l * 0.12 + idx * 0.3, sin(ang) * 0.9 + l * 0.12 + idx * 0.3);
      const off = map(n, 0, 1, -R*0.08, R*0.08);
      const r = base + wave + off;
      vertex(cx + cos(ang) * r, cy + sin(ang) * r);
    }
    endShape(CLOSE);

    const dots = irange(600, 1200);
    noStroke();
    for (let i = 0; i < dots; i++) {
      const rr = rand(R * 0.2, R * 1.2) + noise(i * 0.01, l * 0.1) * R * 0.04;
      const th = rand(0, TWO_PI);
      const x = cx + cos(th) * rr + rand(-0.8, 0.8);
      const y = cy + sin(th) * rr + rand(-0.8, 0.8);
      const c = pick(palette);
      fill(red(c), green(c), blue(c), aFill);
      rect(x, y, 1, 1);
    }

    if (rand(0, 1) < 0.45) {
      noFill();
      stroke(color(255, 255, 255, irange(40, 110)));
      strokeWeight(rand(0.6, 1.2));
      const halo = R * rand(1.05, 1.4);
      roughCircle(cx + rand(-3, 3), cy + rand(-3, 3), halo);
    }
  }
}

function roughCircle(cx, cy, r) {
  beginShape();
  const step = 0.05;
  const freq = rand(3.0, 6.0);
  for (let a = 0; a < TWO_PI; a += step) {
    const jitter = sin(a * freq) * r * 0.015;
    vertex(cx + cos(a) * (r + jitter), cy + sin(a) * (r + jitter));
  }
  endShape(CLOSE);
}

function doughnutHole(cx, cy, r) {
  noStroke(); fill(0); circle(cx, cy, r * 2);
  noFill(); stroke(255, 120); strokeWeight(1.2); roughCircle(cx, cy, r * 1.05);
  stroke(255, 50); roughCircle(cx, cy, r * 1.25);
}

function rand(a=0,b=1){ return a + (b-a) * rng(); }
function irange(a,b){ return floor(rand(a,b+1)); }
