// p5.js preview with transparent background (so bg trail shows through)
const CANVAS_TRANSPARENT_BG = false;

let seedStr=null,rng,palette,currentStyle=null;
let renderPhase = "art";

let mgGfx = null;
let mgCell = 12;
let mgCols = 0;
let mgRows = 0;
let mgGrid = [];
let mgSeedBase = 0;

const MG_MEADOW_GREENS = [
  [26, 140, 108],
  [34, 152, 116],
  [50, 166, 126],
  [68, 182, 140],
  [92, 198, 154],
  [120, 214, 170],
  [145, 228, 184],
];

const MG_DEEP_GREENS = [
  [16, 105, 82],
  [20, 116, 90],
  [24, 126, 96],
];

const MG_LEAF_GREENS = [
  [62, 178, 132],
  [85, 196, 146],
  [110, 214, 164],
  [52, 164, 122],
];

const MG_STEM_GREENS = [
  [42, 130, 88],
  [55, 150, 102],
  [70, 170, 118],
];

const MG_WHITES = [
  [252, 251, 248],
  [248, 246, 240],
  [244, 242, 234],
];

const MG_YELLOWS = [
  [255, 235, 150],
  [250, 225, 120],
  [245, 210, 90],
];

const MG_BLUES = [
  [120, 160, 235],
  [150, 185, 255],
  [95, 135, 210],
  [70, 115, 190],
];

const MG_PINKS = [
  [245, 170, 195],
  [250, 195, 215],
  [235, 145, 185],
];

const MG_REDS = [
  [230, 60, 85],
  [200, 35, 60],
  [245, 85, 105],
];

const MG_PURPLES = [
  [170, 150, 235],
  [200, 180, 255],
  [140, 120, 210],
];

const MG_STONE_BASE = [
  [170, 172, 178],
  [150, 152, 158],
  [190, 192, 198],
  [130, 132, 138],
];

const MG_STONE_SHADOW = [
  [110, 112, 118],
  [120, 122, 128],
];

const MG_DARKS = [
  [20, 20, 20],
  [45, 45, 45],
];

function seededRandom(){
  let h = 1779033703 ^ seedStr.length;
  for(let i=0;i<seedStr.length;i++){
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h<<13) | (h>>>19);
  }
  return function(){
    h = Math.imul(h ^ (h>>>16), 2246822507);
    h = Math.imul(h ^ (h>>>13), 3266489909);
    h ^= h>>>16;
    return (h>>>0)/4294967296;
  }
}
function srand(min=0,max=1){return min + rng()*(max-min)}
function srange(a,b){return Math.floor(srand(a,b))}
function pick(arr){return arr[Math.floor(srand(0,arr.length))]}
function parseSeedFromURL(){const p=new URLSearchParams(window.location.search);return p.get("seed")}
function hashCode(s){let h=0;for(let i=0;i<s.length;i++){h=(h<<5)-h+s.charCodeAt(i);h|=0}return h}

function computeCanvasSize(){
  const w = Math.min(window.innerWidth - 24, 1000);
  const panelH = document.querySelector('.panel')?.offsetHeight || 0;
  const h = Math.min(window.innerHeight - panelH - 24, 1000);
  return Math.max(280, Math.min(w, h));
}

function initSeed(optionalSeed){
  seedStr = optionalSeed ?? parseSeedFromURL() ?? (Date.now().toString(36));
  rng = seededRandom();
  const base = int(hashCode(seedStr) & 0x7fffffff);
  randomSeed(base);
  noiseSeed(base);
  const echo = document.getElementById("seedEcho");
  if (echo) echo.textContent = `seed: ${seedStr}`;
  const seedInput = document.getElementById("seed");
  if (seedInput) seedInput.value = seedStr;
}

function setup(){
  const size = computeCanvasSize();
  const c = createCanvas(size, size);
  c.parent("holder");
  noLoop();

  
  // Sync default style to the first option in the dropdown
  const sel = document.getElementById('styleSelect');
  if (sel) { currentStyle = sel.value; }
// global palette (used by Leh, Sandworm; Bangkok has its own pastel)
  palette=[
    color(240,200,210,190),
    color(120,155,135,200),
    color(245,215,120,210),
    color(202,122,92,200),
    color(220,220,230,220)
  ];

  initSeed();

  renderPhase = "loading";
  setTimeout(() => {
    renderPhase = "art";
    redraw();
  }, 0);

  const startRenderCycle = () => {
    renderPhase = "loading";
    redraw();
    setTimeout(() => {
      renderPhase = "art";
      redraw();
    }, 0);
  };

  document.getElementById("regen").addEventListener("click",()=>{
    const newSeed = (Date.now().toString(36)+Math.floor(Math.random()*1e6).toString(36));
    initSeed(newSeed);
    startRenderCycle();
    updateURLSeed(newSeed);
  });
  document.getElementById("applySeed").addEventListener("click",()=>{
    const v = document.getElementById("seed").value.trim();
    if(v){
      initSeed(v);
      startRenderCycle();
      updateURLSeed(v);
    }
  });
  document.getElementById("save").addEventListener("click",()=>{
    saveCanvas(`mintable_collection_${currentStyle}_${seedStr}.png`);
  });
  document.getElementById("styleSelect").addEventListener("change",e=>{
    currentStyle = e.target.value;
    startRenderCycle();
  });
}

function windowResized(){
  const size = computeCanvasSize();
  resizeCanvas(size, size);
  redraw();
}

function updateURLSeed(v=seedStr){
  const url = new URL(window.location.href);
  url.searchParams.set("seed", v);
  history.replaceState({}, "", url);
}

function drawLoading(){
  if(CANVAS_TRANSPARENT_BG){ clear(); } else { background(0); }
  push();
  textAlign(CENTER, CENTER);
  textFont("IBM Plex Mono");
  textSize(16);
  textStyle(BOLD);
  fill(230, 230, 236);
  text("💭 Loading", width / 2, height / 2);
  pop();
}

function draw(){
  if (renderPhase === "loading") {
    drawLoading();
    return;
  }
  if(CANVAS_TRANSPARENT_BG){ clear(); } else { background(0); }
  if(currentStyle === "leh"){
    drawLeh();
  } else if(currentStyle === "sandworm"){
    drawSandworm();
  } else if(currentStyle === "bangkok"){
    drawBangkok();
  }
  else if(currentStyle === "mario garden"){ drawMarioGarden(); }
  else if(currentStyle === "sukhumvit"){ drawSukhumvit(); }
  else if(currentStyle === "ekk"){ drawEkkamai(); }
  else if(currentStyle === "chiangmai"){ drawChiangmai(); }
}

// ---------- LEH LADAKH ----------
function drawLeh() {
  noFill();
  strokeWeight(1.2);
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

// ---------- SANDWORM ----------
function drawSandworm() {
  // base scribble
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

// ---------- BANGKOK ----------
function drawBangkok(){
  background(240);

  const N_CRAYON = 250;
  const N_ROCKS  = 14;
  const N_ICONS  = 18;

  let pastel = [
    color(255, 180, 190), // pink
    color(235, 85, 85),   // red
    color(110, 205, 150), // mint green
    color(175, 150, 230), // purple
    color(250, 205, 85),  // yellow
    color(100, 105, 250)  // electric blue
  ];

  for (let i = 0; i < N_CRAYON; i++) {
    drawCrayonStroke_BKK();
  }
  for (let i = 0; i < N_ROCKS; i++) {
    drawRock_BKK(random(width), random(height), pastel);
  }
  for (let i = 0; i < N_ICONS; i++) {
    const x = random(0.09*width, 0.91*width);
    const y = random(0.09*height, 0.91*height);
    const s = random(min(width,height)*0.08, min(width,height)*0.14);
    drawIcon_BKK(x, y, s, int(random(6)), pastel);
  }
}

function drawCrayonStroke_BKK() {
  let colors = [
    color(0, 0, 0),
    color(255, 0, 0),
    color(0, 100, 200),
    color(0, 180, 90),
    color(255, 200, 0),
    color(255, 120, 200),
    color(150, 80, 40)
  ];

  stroke(random(colors));
  strokeWeight(random(2, 5));
  noFill();

  let style = int(random(6));

  if (style === 0) {
    let x1 = random(width), y1 = random(height);
    let x2 = x1 + random(-0.25*width, 0.25*width);
    let y2 = y1 + random(-0.25*height, 0.25*height);
    drawJitterLine_BKK(x1, y1, x2, y2);
  } else if (style === 1) {
    let x = random(width), y = random(height);
    beginShape();
    for (let i = 0; i < 10; i++) {
      vertex(x + i * random(5, 15), y + random(-5, 5));
    }
    endShape();
  } else if (style === 2) {
    let x = random(width), y = random(height);
    beginShape();
    for (let a = 0; a < TWO_PI; a += PI / random(5, 10)) {
      let r = random(10, 30);
      vertex(x + cos(a) * r + random(-3, 3), y + sin(a) * r + random(-3, 3));
    }
    endShape();
  } else if (style === 3) {
    let x = random(width), y = random(height);
    let w = random(0.07*width, 0.25*width);
    let h = random(0.05*height, 0.2*height);
    arc(x, y, w, h, random(TWO_PI), random(TWO_PI));
  } else if (style === 4) {
    let x = random(width), y = random(height);
    beginShape();
    for (let a = 0; a < TWO_PI; a += radians(15)) {
      let r = random(20, 50);
      vertex(x + cos(a) * r + random(-5, 5), y + sin(a) * r + random(-5, 5));
    }
    endShape(CLOSE);
  } else if (style === 5) {
    let x = random(width), y = random(height);
    beginShape();
    for (let i = 0; i < 8; i++) {
      vertex(x + i * 15, y + (i % 2 === 0 ? -10 : 10));
    }
    endShape();
  }
}

function drawJitterLine_BKK(x1, y1, x2, y2) {
  let steps = int(dist(x1, y1, x2, y2) / 5);
  beginShape();
  for (let i = 0; i <= steps; i++) {
    let t = i / steps;
    let x = lerp(x1, x2, t) + random(-2, 2);
    let y = lerp(y1, y2, t) + random(-2, 2);
    vertex(x, y);
  }
  endShape();
}

function drawRock_BKK(x, y, pastel) {
  push();
  translate(x, y);
  noStroke();

  const rockColors = [
    color(180,180,180),
    ...pastel.map(c => lerpColor(c, color(255), 0.15))
  ];
  fill(random(rockColors));

  const type = int(random(3));
  if (type === 0) {
    ellipse(0, 0, random(0.07*width, 0.15*width), random(0.05*height, 0.12*height));
  } else if (type === 1) {
    rectMode(CENTER);
    rect(0, 0, random(0.07*width, 0.15*width), random(0.05*height, 0.11*height), random(18, 28));
  } else {
    beginShape();
    for (let a = 0; a < TWO_PI; a += random(PI/6, PI/3)) {
      let r = random(min(width,height)*0.04, min(width,height)*0.09);
      vertex(cos(a) * r, sin(a) * r);
    }
    endShape(CLOSE);
  }
  pop();
}

function drawIcon_BKK(x, y, s, type, pastel) {
  push();
  translate(x, y);
  noStroke();
  fill(random(pastel));

  if (type === 0) { // asterisk
    for (let a = 0; a < 6; a++) {
      push(); rotate(a * PI / 3);
      rectMode(CENTER);
      rect(0, 0, s * 0.25, s);
      pop();
    }
  } else if (type === 1) { // heart
    beginShape();
    vertex(0, -s/4);
    bezierVertex(-s/2, -s/2, -s/2, s/6, 0, s/2);
    bezierVertex(s/2, s/6, s/2, -s/2, 0, -s/4);
    endShape(CLOSE);
  } else if (type === 2) { // flower
    for (let i = 0; i < 6; i++) {
      let ang = TWO_PI * i / 6;
      ellipse(cos(ang) * s/2, sin(ang) * s/2, s/2, s/2);
    }
    fill(0);
    ellipse(0, 0, s/4);
  } else if (type === 3) { // diamond
    beginShape();
    vertex(0, -s/2); vertex(s/2, 0);
    vertex(0, s/2); vertex(-s/2, 0);
    endShape(CLOSE);
  } else if (type === 4) { // hourglass
    arc(0, -s/4, s, s, 0, PI, PIE);
    arc(0,  s/4, s, s, PI, TWO_PI, PIE);
  } else if (type === 5) { // lightning
    beginShape();
    vertex(-s/6, -s/2); vertex(s/6, -s/2);
    vertex(-s/12, 0);   vertex(s/6, 0);
    vertex(-s/6, s/2);  vertex(0, 0);
    vertex(-s/6, 0);
    endShape(CLOSE);
  }
  pop();
}


// ---------- EKKAMAI ----------
function drawEkkamai() {
  background(245);
  noStroke();

  // BG split
  fill(240, 235, 220); rect(0, 0, width, height/2);
  fill(170, 210, 190); rect(0, height/2, width, height/2);

  // Red vertical circles
  fill(220, 40, 30);
  const rx = width * random(0.45, 0.58);
  let y0 = random(80, 130);
  const rSize = random(28, 36);
  const rGap  = random(38, 50);
  for (let i = 0; i < 3; i++) circle(rx, y0 + i * rGap, rSize);

  // Diamond
  push();
  translate(random(width*0.55, width*0.75), random(150, 220));
  rotate(PI/4);
  rectMode(CENTER);
  fill(240, 220, 70); rect(0, 0, 52, 52);
  fill(100, 200, 220); triangle(0, -26, 26, 0, 0, 0);
  pop();

  // Black oval
  fill(20);
  ellipse(random(width*0.18, width*0.35), random(180, 240),
          random(90, 110), random(40, 48));

  // Small dots
  fill(200, 250, 240); circle(random(60, 120), random(120, 180), 16);
  fill(255); circle(random(360, 440), random(120, 180), 8);
  fill(0);   circle(random(330, 420), random(150, 190), 4);

  // Target concentric
  drawTarget_EKK(random(width*0.38, width*0.60), random(260, 340),
             [color(240), color(190), color(150)], random(54, 64));

  // Dotted V
  const yMid = height * 0.5;
  const xL = random(70, 110);
  const xR = width - xL;
  const yTop = yMid + random(50, 75);
  const yBot = yMid + random(135, 165);
  drawDottedLine_EKK(xL, yTop, width/2, yBot, 9);
  drawDottedLine_EKK(width/2, yBot, xR, yTop, 9);

  fill(220, 40, 30);
  circle(xL, yTop, 14);
  circle(width/2, yBot, 14);
  circle(xR, yTop, 14);

  // Oval
  fill(240, 230, 210);
  ellipse(random(width*0.70, width*0.82),
          random(yMid+100, yMid+160), 44, 88);

  // misc dots
  fill(255); circle(random(width*0.50, width*0.62), yMid + random(160, 185), 6);
  fill(250, 205, 85); circle(random(55, 90), yMid + random(190, 230), 16);

  // Triangle bottom
  fill(30);
  triangle(width/2 - 60, height, width/2 + 60, height, width/2, height - 85);
}

// concentric circles
function drawTarget_EKK(x, y, cols, rStart) {
  noStroke();
  let r = rStart;
  for (let i = 0; i < cols.length; i++) {
    fill(cols[i]); circle(x, y, r);
    r -= rStart / cols.length;
  }
}

// dotted line
function drawDottedLine_EKK(x1, y1, x2, y2, num) {
  noStroke(); fill(255);
  for (let i = 0; i <= num; i++) {
    const t = i / num;
    circle(lerp(x1, x2, t), lerp(y1, y2, t), 5);
  }
}

// ---------- CHIANGMAI ----------
// Pastel fuzzy gradient flowers (clustered)
function drawChiangmai() {
  randomSeed(hashCode(seedStr));
  noiseSeed(hashCode(seedStr));

  background(252, 246, 238);
  paperGrain(0.09);
  paperFibers(1500);

  const palette = [
    color(244, 170, 176), // pink
    color(242, 205, 156), // peach
    color(244, 231, 166), // yellow
    color(186, 206, 170), // sage
    color(214, 199, 230), // lavender
    color(248, 216, 226)  // blush
  ];

  const bigCount = 12;
  const smallCount = 20;

  // pick 2-3 cluster centers
  const centers = [];
  const k = floor(random(2, 4));
  for (let i = 0; i < k; i++) {
    centers.push({
      x: random(width * 0.25, width * 0.75),
      y: random(height * 0.25, height * 0.75),
      s: random(width * 0.12, width * 0.18)
    });
  }

  // big flowers: mostly from clusters, some lightly free
  for (let i = 0; i < bigCount; i++) {
    const c = random(centers);
    const useCluster = random() < 0.88;

    const cx = useCluster ? c.x + randomGaussian(0, c.s) : random(width);
    const cy = useCluster ? c.y + randomGaussian(0, c.s) : random(height);

    const r = random(width * 0.20, width * 0.35);
    const base = random(palette);
    drawFlowerGradient(cx, cy, r, base);
  }

  // small flowers: even tighter around clusters
  for (let i = 0; i < smallCount; i++) {
    const c = random(centers);
    const cx = c.x + randomGaussian(0, c.s * 0.95);
    const cy = c.y + randomGaussian(0, c.s * 0.95);

    const r = random(width * 0.09, width * 0.18);
    const base = random(palette);
    drawFlowerGradient(cx, cy, r, base);
  }

  softVeil();
}

// ---------- CHIANGMAI HELPERS ----------
function drawFlowerGradient(cx, cy, baseR, baseCol) {
  push();
  noStroke();

  const centerCol = color(
    lerp(red(baseCol), 255, 0.10),
    lerp(green(baseCol), 250, 0.10),
    lerp(blue(baseCol), 248, 0.10),
    200
  );
  const edgeCol = color(255, 252, 250, 40);

  const petalCount = floor(random(9, 16));
  for (let p = 0; p < petalCount; p++) {
    const ang = TWO_PI * (p / petalCount) + random(-0.18, 0.18);
    const pr  = baseR * random(0.52, 0.82);
    const dx  = cos(ang) * baseR * random(0.18, 0.42);
    const dy  = sin(ang) * baseR * random(0.18, 0.42);

    const petalCenter = driftColor(centerCol, 10);
    stampCloudGradient(cx + dx, cy + dy, pr, petalCenter, edgeCol, 1100);
  }

  const innerWhiteCenter = color(255, 253, 252, 170);
  const innerWhiteEdge   = color(255, 253, 252, 20);
  stampCloudGradient(cx, cy, baseR * random(0.55, 0.75), innerWhiteCenter, innerWhiteEdge, 1300);

  if (random() < 0.65) {
    const warmA = color(244, 209, 120, 200);
    const warmB = color(238, 166, 150, 190);
    const warmBase = random() < 0.6 ? warmA : warmB;
    const warmCenter = driftColor(warmBase, 8);
    const warmEdge = color(255, 252, 250, 25);

    stampCloudGradient(
      cx + random(-baseR * 0.06, baseR * 0.06),
      cy + random(-baseR * 0.06, baseR * 0.06),
      baseR * random(0.18, 0.30),
      warmCenter,
      warmEdge,
      780
    );

    for (let i = 0; i < 26; i++) {
      fill(255, 255, 255, random(18, 55));
      const rr = baseR * random(0.010, 0.028);
      circle(
        cx + randomGaussian(0, baseR * 0.14),
        cy + randomGaussian(0, baseR * 0.14),
        rr * width * 0.0022
      );
    }
  }

  pop();
}

function stampCloudGradient(cx, cy, r, innerCol, outerCol, n) {
  const sigma = r * 0.42;

  for (let i = 0; i < n; i++) {
    const gx = randomGaussian(0, sigma);
    const gy = randomGaussian(0, sigma);

    const d = dist(0, 0, gx, gy);
    const t = constrain(d / (r * 1.2), 0, 1);

    const c = lerpColor(innerCol, outerCol, pow(t, 0.85));

    const nn = noise((cx + gx) * 0.0065, (cy + gy) * 0.0065);
    const centerBoost = (1 - t);
    const a = (alpha(c) * (0.04 + 0.16 * centerBoost) * (0.85 + 0.35 * nn));

    fill(red(c), green(c), blue(c), a);

    const s = r * random(0.07, 0.21) * (0.40 + 0.95 * centerBoost);
    ellipse(cx + gx, cy + gy, s, s * random(0.82, 1.20));
  }
}

function driftColor(c, amt) {
  const rr = constrain(red(c) + random(-amt, amt), 0, 255);
  const gg = constrain(green(c) + random(-amt, amt), 0, 255);
  const bb = constrain(blue(c) + random(-amt, amt), 0, 255);
  return color(rr, gg, bb, alpha(c));
}

function paperGrain(intensity = 0.06) {
  loadPixels();
  const d = pixelDensity();
  const w = width * d;
  const h = height * d;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = 4 * (y * w + x);
      const n = noise(x * 0.01, y * 0.01);
      const speck = (random() < 0.02) ? random(-25, 25) : 0;
      const delta = (n - 0.5) * 40 * intensity + speck * intensity;

      pixels[idx + 0] = constrain(pixels[idx + 0] + delta, 0, 255);
      pixels[idx + 1] = constrain(pixels[idx + 1] + delta, 0, 255);
      pixels[idx + 2] = constrain(pixels[idx + 2] + delta, 0, 255);
    }
  }
  updatePixels();
}

function paperFibers(count = 1200) {
  push();
  stroke(255, 255, 255, 18);
  strokeWeight(1);
  for (let i = 0; i < count; i++) {
    const x = random(width);
    const y = random(height);
    const len = random(6, 18);
    const ang = random(TWO_PI);
    line(x, y, x + cos(ang) * len, y + sin(ang) * len);
  }

  stroke(120, 90, 80, 10);
  for (let i = 0; i < count * 0.35; i++) {
    const x = random(width);
    const y = random(height);
    const len = random(4, 14);
    const ang = random(TWO_PI);
    line(x, y, x + cos(ang) * len, y + sin(ang) * len);
  }
  pop();
}

function softVeil() {
  push();
  noStroke();
  fill(255, 250, 245, 24);
  rect(0, 0, width, height);
  pop();
}


// ---------- MARIO GARDEN ----------
const MG_X_ALPHA = 55;
const MG_X_CONTRAST = 0.10;
const MG_GRID_ALPHA = 16;

const MG_LEAF_PATCHES = 34;
const MG_STONE_PATHS = 3;
const MG_STONE_PEBBLES = 12;

const MG_BIG_FLOWERS = 8;
const MG_MID_FLOWERS = 16;
const MG_TINY_FLOWERS = 140;
const MG_SPRITE_FLOWERS = 160;

const MG_BUTTERFLIES = [5, 8];
const MG_LADYBUGS = [1, 2];

function drawMarioGarden() {
  const base = int(hashCode(seedStr) & 0x7fffffff);
  mgSeedBase = base;
  randomSeed(base);
  noiseSeed(base);

  mgCell = Math.max(8, Math.floor(width / 80));
  mgCols = Math.max(10, Math.ceil(width / mgCell));
  mgRows = Math.max(10, Math.ceil(height / mgCell));

  const w = mgCols * mgCell;
  const h = mgRows * mgCell;
  if (!mgGfx || mgGfx.width !== w || mgGfx.height !== h) {
    mgGfx = createGraphics(w, h);
    mgGfx.pixelDensity(1);
  }

  mgGrid = Array.from({ length: mgCols }, () => Array(mgRows).fill(color(0)));

  mgPaintMeadowMultiGreen();
  mgAddMeadowTexture();

  for (let i = 0; i < MG_LEAF_PATCHES; i++) {
    const cx = floor(random(mgCols));
    const cy = floor(random(mgRows));
    const r = floor(random(6, 14));
    mgBlobMix(cx, cy, r, mgRgb(mgPick(MG_LEAF_GREENS)), 0.26);

    if (random() < 0.65) {
      mgBlobMix(
        cx + floor(random(-6, 6)),
        cy + floor(random(-6, 6)),
        floor(r * 0.7),
        mgRgb(mgPick(MG_DEEP_GREENS)),
        0.16
      );
    }
  }

  for (let p = 0; p < MG_STONE_PATHS; p++) mgPaintStonePath();
  for (let i = 0; i < MG_STONE_PEBBLES; i++) {
    const cx = floor(random(mgCols));
    const cy = floor(random(mgRows));
    mgPaintStoneBlob(cx, cy, floor(random(4, 8)));
  }

  for (let i = 0; i < MG_BIG_FLOWERS; i++) {
    const cx = floor(random(10, mgCols - 10));
    const cy = floor(random(10, mgRows - 10));
    mgDrawRosette(cx, cy, floor(random(6, 9)), mgPickFlowerPalette(), true);
  }
  for (let i = 0; i < MG_MID_FLOWERS; i++) {
    const cx = floor(random(8, mgCols - 8));
    const cy = floor(random(8, mgRows - 8));
    mgDrawRosette(cx, cy, floor(random(4, 6)), mgPickFlowerPalette(), false);
  }

  for (let i = 0; i < MG_SPRITE_FLOWERS; i++) {
    const cx = floor(random(5, mgCols - 5));
    const cy = floor(random(6, mgRows - 6));
    mgDrawPixelFlowerIcon(cx, cy);
  }

  for (let i = 0; i < MG_TINY_FLOWERS; i++) {
    const cx = floor(random(4, mgCols - 4));
    const cy = floor(random(4, mgRows - 4));
    if (random() < 0.82) mgDrawTinyWhite(cx, cy);
  }

  mgAddCritters();
  mgRenderToGfx();

  background(230);
  image(mgGfx, 0, 0, width, height);
}

function mgPaintMeadowMultiGreen() {
  for (let y = 0; y < mgRows; y++) {
    for (let x = 0; x < mgCols; x++) {
      const n1 = noise(x * 0.08, y * 0.08);
      const n2 = noise(100 + x * 0.18, 100 + y * 0.18);
      const n3 = noise(300 + x * 0.03, 300 + y * 0.03);

      const t = mgClamp01(n1 * 0.55 + n2 * 0.30 + n3 * 0.15);

      const a = mgRgb(mgPick(MG_MEADOW_GREENS));
      const b = mgRgb(mgPick(MG_MEADOW_GREENS));
      let c = mgMix(a, b, t);

      c = mgMix(c, color(255), 0.10);

      const v = (n2 * 10 - 5);
      mgGrid[x][y] = color(
        mgClamp(red(c) + v),
        mgClamp(green(c) + v),
        mgClamp(blue(c) + v)
      );
    }
  }
}

function mgAddMeadowTexture() {
  const patches = mgCols * 11;
  for (let i = 0; i < patches; i++) {
    const cx = floor(random(mgCols));
    const cy = floor(random(mgRows));
    const r = floor(random(3, 10));

    const c = random() < 0.72 ? mgRgb(mgPick(MG_MEADOW_GREENS)) : mgRgb(mgPick(MG_DEEP_GREENS));
    const strength = random() < 0.7 ? 0.18 : 0.12;

    mgBlobMix(cx, cy, r, c, strength);
  }
}

function mgPaintStonePath() {
  let x = random(mgCols);
  let y = random(mgRows);

  const ang = random(TWO_PI);
  const dx0 = cos(ang);
  const dy0 = sin(ang);

  const steps = floor(random(mgCols * 0.9, mgCols * 1.3));
  for (let i = 0; i < steps; i++) {
    const wobble = noise(900 + i * 0.06, mgSeedBase * 0.000001) * 2 - 1;
    const dx = dx0 + wobble * 0.35;
    const dy = dy0 - wobble * 0.35;

    x += dx;
    y += dy;

    if (x < 2 || x > mgCols - 3 || y < 2 || y > mgRows - 3) break;

    if (random() < 0.85) mgPaintStoneBlob(floor(x), floor(y), floor(random(3, 5)));
  }
}

function mgPaintStoneBlob(cx, cy, r) {
  const base = mgRgb(mgPick(MG_STONE_BASE));
  const hi = mgMix(base, color(255), 0.18);
  const sh = mgMix(base, mgRgb(mgPick(MG_STONE_SHADOW)), 0.35);

  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      if (!mgInBounds(x, y)) continue;
      const d = dist(x, y, cx, cy) / r;
      if (d > 1) continue;

      const lx = (x - cx);
      const ly = (y - cy);
      let c = base;
      if (lx + ly < -0.2) c = hi;
      if (lx + ly > 0.8) c = sh;

      mgGrid[x][y] = mgMix(mgGrid[x][y], c, 0.78 * (1 - d * 0.35));
    }
  }

  if (random() < 0.35) {
    const k = mgMix(base, color(0), 0.25);
    mgSetCellBlend(cx, cy, k, 0.28);
    if (random() < 0.5) mgSetCellBlend(cx + 1, cy, k, 0.20);
  }
}

function mgPickFlowerPalette() {
  const r = random();
  if (r < 0.28) return { petal: mgRgb(mgPick(MG_BLUES)),   accent: mgRgb(mgPick(MG_PURPLES)), core: mgRgb(mgPick(MG_YELLOWS)) };
  if (r < 0.52) return { petal: mgRgb(mgPick(MG_PINKS)),   accent: mgRgb(mgPick(MG_PURPLES)), core: mgRgb(mgPick(MG_YELLOWS)) };
  if (r < 0.76) return { petal: mgRgb(mgPick(MG_REDS)),    accent: mgRgb(mgPick(MG_PINKS)),   core: mgRgb(mgPick(MG_YELLOWS)) };
  return             { petal: mgRgb(mgPick(MG_PURPLES)), accent: mgRgb(mgPick(MG_BLUES)),    core: mgRgb(mgPick(MG_YELLOWS)) };
}

function mgDrawRosette(cx, cy, radius, pal, isBig) {
  const pet = pal.petal;
  const hi = mgMix(pet, color(255), 0.22);
  const sh = mgMix(pet, color(0), 0.12);

  const acc = pal.accent;
  const accHi = mgMix(acc, color(255), 0.18);
  const accSh = mgMix(acc, color(0), 0.10);

  const core = pal.core;

  const ring1 = radius;
  const ring2 = max(2, floor(radius * 0.65));
  const ring3 = max(1, floor(radius * 0.35));

  if (isBig && random() < 0.95) {
    const leaf = mgRgb(mgPick(MG_LEAF_GREENS));
    mgBlobMix(cx + floor(random(-2, 2)), cy + floor(random(-2, 2)), radius + 3, leaf, 0.12);
  }

  mgRosetteRing(cx, cy, ring1, pet, hi, sh);
  mgRosetteRing(cx, cy, ring2, acc, accHi, accSh);
  mgRosetteRing(cx, cy, ring3, mgMix(pet, color(255), 0.12), mgMix(pet, color(255), 0.25), mgMix(pet, color(0), 0.08));

  mgStampBlend(cx, cy, [
    {dx:0,dy:0,c:core},
    {dx:1,dy:0,c:mgMix(core,color(255),0.12)},
    {dx:-1,dy:0,c:mgMix(core,color(255),0.08)},
    {dx:0,dy:1,c:mgMix(core,color(0),0.10)},
    {dx:0,dy:-1,c:mgMix(core,color(255),0.08)},
  ], 0.92);

  if (random() < 0.45) {
    const w = mgRgb(mgPick(MG_WHITES));
    mgSetCellBlend(cx + floor(random(-ring1, ring1)), cy + floor(random(-ring1, ring1)), w, 0.22);
  }
}

function mgRosetteRing(cx, cy, r, base, hi, sh) {
  const pts = [
    [ r,  0], [-r,  0], [ 0,  r], [ 0, -r],
    [ r-1,  r-1], [-(r-1),  r-1], [ r-1, -(r-1)], [-(r-1), -(r-1)],
  ];

  for (const [dx, dy] of pts) mgSetCellBlend(cx + dx, cy + dy, base, 0.92);

  for (const [dx, dy] of pts) {
    const ax = cx + dx;
    const ay = cy + dy;
    mgSetCellBlend(ax + mgSign(dx), ay, hi, 0.72);
    mgSetCellBlend(ax, ay + mgSign(dy), hi, 0.72);
    mgSetCellBlend(ax - mgSign(dx), ay, sh, 0.52);
    mgSetCellBlend(ax, ay - mgSign(dy), sh, 0.52);
  }

  for (let a = 0; a < TWO_PI; a += TWO_PI / 16) {
    const x = cx + round(cos(a) * r);
    const y = cy + round(sin(a) * r);
    mgSetCellBlend(x, y, mgMix(base, hi, 0.25), 0.68);
  }
}

function mgDrawTinyWhite(cx, cy) {
  const w = mgRgb(mgPick(MG_WHITES));
  const y = mgRgb(mgPick(MG_YELLOWS));
  mgStampBlend(cx, cy, [
    {dx:0,dy:0,c:y},
    {dx:1,dy:0,c:w},{dx:-1,dy:0,c:w},{dx:0,dy:1,c:w},{dx:0,dy:-1,c:w},
  ], 0.90);
}

function mgDrawPixelFlowerIcon(cx, cy) {
  const typeRoll = random();
  let type = "YELLOW";
  if (typeRoll < 0.22) type = "YELLOW";
  else if (typeRoll < 0.44) type = "PINK";
  else if (typeRoll < 0.62) type = "RED";
  else if (typeRoll < 0.78) type = "PURPLE";
  else type = "BLUE_SPRIG";

  if (random() < 0.25) {
    const c = mgGrid[cx][cy];
    if (red(c) > 140 && green(c) > 140 && blue(c) > 140) return;
  }

  const stem = mgRgb(mgPick(MG_STEM_GREENS));
  const stem2 = mgMix(stem, color(0), 0.10);
  const leaf = mgMix(stem, color(255), 0.12);

  const stemLen = floor(random(3, 6));
  for (let i = 0; i < stemLen; i++) {
    mgSetCellBlend(cx, cy + 2 + i, mgMix(stem, stem2, i / max(1, stemLen - 1)), 0.92);
  }

  if (random() < 0.85) mgSetCellBlend(cx - 1, cy + 3 + floor(stemLen * 0.4), leaf, 0.88);
  if (random() < 0.85) mgSetCellBlend(cx + 1, cy + 4 + floor(stemLen * 0.55), leaf, 0.88);

  if (type === "BLUE_SPRIG") {
    const b1 = mgRgb(mgPick(MG_BLUES));
    const b2 = mgMix(b1, color(255), 0.18);
    const y = mgRgb(mgPick(MG_YELLOWS));

    mgSetCellBlend(cx,     cy + 1, stem2, 0.92);
    mgSetCellBlend(cx + 1, cy,     stem2, 0.88);
    mgSetCellBlend(cx + 2, cy - 1, stem2, 0.82);

    mgStampBlend(cx, cy, [
      {dx:-1,dy:0,c:b1},{dx:0,dy:0,c:b2},{dx:1,dy:0,c:b1},
      {dx:0,dy:-1,c:b2},{dx:2,dy:-1,c:b1},{dx:3,dy:-2,c:b2},
      {dx:2,dy:0,c:b2},
    ], 0.92);

    if (random() < 0.6) mgSetCellBlend(cx + 1, cy - 1, y, 0.60);
    return;
  }

  let pet, petHi, core;
  if (type === "YELLOW") {
    pet = color(245, 190, 55);
    petHi = mgMix(pet, color(255), 0.22);
    core = mgMix(mgRgb(mgPick(MG_YELLOWS)), color(255), 0.08);
  } else if (type === "PINK") {
    pet = mgRgb(mgPick(MG_PINKS));
    petHi = mgMix(pet, color(255), 0.22);
    core = mgMix(mgRgb(mgPick(MG_YELLOWS)), color(255), 0.10);
  } else if (type === "RED") {
    pet = mgRgb(mgPick(MG_REDS));
    petHi = mgMix(pet, color(255), 0.16);
    core = mgMix(mgRgb(mgPick(MG_YELLOWS)), color(0), 0.05);
  } else {
    pet = mgRgb(mgPick(MG_PURPLES));
    petHi = mgMix(pet, color(255), 0.22);
    core = mgMix(mgRgb(mgPick(MG_YELLOWS)), color(255), 0.06);
  }

  const shapeRoll = random();
  if (shapeRoll < 0.55) {
    mgStampBlend(cx, cy, [
      {dx:0,dy:0,c:pet},
      {dx:-1,dy:0,c:petHi},
      {dx:1,dy:0,c:pet},
      {dx:0,dy:-1,c:petHi},
    ], 0.94);
    mgSetCellBlend(cx, cy + 1, pet, 0.70);
  } else {
    mgStampBlend(cx, cy, [
      {dx:0,dy:0,c:core},
      {dx:-1,dy:0,c:pet},{dx:1,dy:0,c:pet},
      {dx:0,dy:-1,c:petHi},{dx:0,dy:1,c:pet},
      {dx:-1,dy:-1,c:petHi},{dx:1,dy:-1,c:petHi},
    ], 0.93);
  }
}

function mgAddCritters() {
  const bCount = floor(random(MG_BUTTERFLIES[0], MG_BUTTERFLIES[1] + 1));
  for (let i = 0; i < bCount; i++) {
    const x = floor(random(8, mgCols - 8));
    const y = floor(random(8, mgRows - 8));
    mgDrawButterfly(x, y);
  }

  const lCount = floor(random(MG_LADYBUGS[0], MG_LADYBUGS[1] + 1));
  for (let i = 0; i < lCount; i++) {
    const x = floor(random(4, mgCols - 4));
    const y = floor(random(4, mgRows - 4));
    mgDrawLadybug3x3LongLegs(x, y);
  }
}

function mgDrawButterfly(cx, cy) {
  const body = mgRgb(mgPick(MG_DARKS));
  const wing = random() < 0.5 ? mgRgb(mgPick(MG_BLUES)) : mgRgb(mgPick(MG_PINKS));
  const wing2 = mgMix(wing, color(255), 0.20);

  mgStampBlend(cx, cy, [
    {dx:-3,dy:-1,c:wing},{dx:-2,dy:-2,c:wing},{dx:-2,dy:-1,c:wing2},{dx:-2,dy:0,c:wing},
    {dx:-1,dy:-2,c:wing2},{dx:-1,dy:-1,c:wing},{dx:-1,dy:0,c:wing2},{dx:-1,dy:1,c:wing},
    {dx: 3,dy:-1,c:wing},{dx: 2,dy:-2,c:wing},{dx: 2,dy:-1,c:wing2},{dx: 2,dy:0,c:wing},
    {dx: 1,dy:-2,c:wing2},{dx: 1,dy:-1,c:wing},{dx: 1,dy:0,c:wing2},{dx: 1,dy:1,c:wing},
    {dx:0,dy:-1,c:body},{dx:0,dy:0,c:body},{dx:0,dy:1,c:body},
  ], 0.92);

  mgSetCellBlend(cx - 1, cy - 3, body, 0.35);
  mgSetCellBlend(cx + 1, cy - 3, body, 0.35);
}

function mgDrawLadybug3x3LongLegs(cx, cy) {
  const r = color(220, 35, 55);
  const rh = mgMix(r, color(255), 0.14);
  const k = color(20, 20, 20);

  mgSetCellBlend(cx - 1, cy - 1, rh, 0.92);
  mgSetCellBlend(cx,     cy - 1, k,  0.92);
  mgSetCellBlend(cx + 1, cy - 1, rh, 0.92);

  mgSetCellBlend(cx - 1, cy,     r,  0.92);
  mgSetCellBlend(cx,     cy,     k,  0.92);
  mgSetCellBlend(cx + 1, cy,     r,  0.92);

  mgSetCellBlend(cx - 1, cy + 1, r,  0.92);
  mgSetCellBlend(cx,     cy + 1, r,  0.92);
  mgSetCellBlend(cx + 1, cy + 1, r,  0.92);

  if (random() < 0.35) mgSetCellBlend(cx - 1, cy + 1, k, 0.70);
  if (random() < 0.35) mgSetCellBlend(cx + 1, cy + 1, k, 0.70);

  const legA = 0.78;

  mgSetCellBlend(cx - 2, cy - 1, k, legA);
  mgSetCellBlend(cx - 3, cy - 2, k, 0.55);
  mgSetCellBlend(cx - 4, cy - 3, k, 0.35);

  mgSetCellBlend(cx - 2, cy,     k, legA);
  mgSetCellBlend(cx - 3, cy,     k, 0.55);
  mgSetCellBlend(cx - 4, cy + 1, k, 0.35);

  mgSetCellBlend(cx - 2, cy + 1, k, legA);
  mgSetCellBlend(cx - 3, cy + 2, k, 0.55);
  mgSetCellBlend(cx - 4, cy + 3, k, 0.35);

  mgSetCellBlend(cx + 2, cy - 1, k, legA);
  mgSetCellBlend(cx + 3, cy - 2, k, 0.55);
  mgSetCellBlend(cx + 4, cy - 3, k, 0.35);

  mgSetCellBlend(cx + 2, cy,     k, legA);
  mgSetCellBlend(cx + 3, cy,     k, 0.55);
  mgSetCellBlend(cx + 4, cy + 1, k, 0.35);

  mgSetCellBlend(cx + 2, cy + 1, k, legA);
  mgSetCellBlend(cx + 3, cy + 2, k, 0.55);
  mgSetCellBlend(cx + 4, cy + 3, k, 0.35);

  if (random() < 0.7) {
    mgSetCellBlend(cx - 1, cy - 2, k, 0.45);
    mgSetCellBlend(cx - 2, cy - 3, k, 0.28);
  }
  if (random() < 0.7) {
    mgSetCellBlend(cx + 1, cy - 2, k, 0.45);
    mgSetCellBlend(cx + 2, cy - 3, k, 0.28);
  }
}

function mgRenderToGfx() {
  mgGfx.clear();
  mgGfx.noStroke();

  for (let y = 0; y < mgRows; y++) {
    for (let x = 0; x < mgCols; x++) {
      mgGfx.fill(mgGrid[x][y]);
      mgGfx.rect(x * mgCell, y * mgCell, mgCell, mgCell);
    }
  }

  mgGfx.strokeWeight(1);
  for (let y = 0; y < mgRows; y++) {
    for (let x = 0; x < mgCols; x++) {
      const c = mgGrid[x][y];
      const d1 = mgDarker(c, MG_X_CONTRAST);
      const d2 = mgLighter(c, MG_X_CONTRAST);
      d1.setAlpha(MG_X_ALPHA);
      d2.setAlpha(MG_X_ALPHA);

      const px = x * mgCell;
      const py = y * mgCell;

      mgGfx.stroke(d1);
      mgGfx.line(px + 2, py + 2, px + mgCell - 2, py + mgCell - 2);

      mgGfx.stroke(d2);
      mgGfx.line(px + mgCell - 2, py + 2, px + 2, py + mgCell - 2);
    }
  }

  mgGfx.strokeWeight(1);
  mgGfx.stroke(0, MG_GRID_ALPHA);
  for (let x = 0; x <= mgCols; x++) mgGfx.line(x * mgCell, 0, x * mgCell, mgRows * mgCell);
  for (let y = 0; y <= mgRows; y++) mgGfx.line(0, y * mgCell, mgCols * mgCell, y * mgCell);
}

function mgBlobMix(cx, cy, r, colr, strength) {
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      if (!mgInBounds(x, y)) continue;
      const d = dist(x, y, cx, cy) / r;
      if (d > 1) continue;
      const t = strength * (1 - d);
      mgGrid[x][y] = mgMix(mgGrid[x][y], colr, t);
    }
  }
}

function mgStampBlend(cx, cy, pts, alphaMix) {
  for (const p of pts) {
    const x = cx + p.dx;
    const y = cy + p.dy;
    if (!mgInBounds(x, y)) continue;
    mgGrid[x][y] = mgMix(mgGrid[x][y], p.c, alphaMix);
  }
}

function mgSetCellBlend(x, y, c, t) {
  if (!mgInBounds(x, y)) return;
  mgGrid[x][y] = mgMix(mgGrid[x][y], c, t);
}

function mgInBounds(x, y) {
  return x >= 0 && x < mgCols && y >= 0 && y < mgRows;
}

function mgPick(arr, a = 0, b = null) {
  const hi = (b === null) ? arr.length - 1 : b;
  return arr[floor(random(a, hi + 1))];
}

function mgRgb(a) { return color(a[0], a[1], a[2]); }
function mgClamp(v) { return max(0, min(255, v)); }
function mgClamp01(v) { return max(0, min(1, v)); }
function mgSign(v) { return v === 0 ? 0 : (v > 0 ? 1 : -1); }

function mgMix(c1, c2, t) {
  return color(
    lerp(red(c1), red(c2), t),
    lerp(green(c1), green(c2), t),
    lerp(blue(c1), blue(c2), t)
  );
}
function mgDarker(c, t) { return mgMix(c, color(0), t); }
function mgLighter(c, t) { return mgMix(c, color(255), t); }

// ---------- SUKHUMVIT ----------
// Abstract City Map (random on click)
function drawSukhumvit(){
  let palette_SUK = [
    color(35), color(80),
    color(10, 140, 200),
    color(0, 170, 130),
    color(255, 90, 100),
    color(255, 180, 0),
    color(170, 120, 230),
    color(20, 200, 170),
  ];
  let bg = color(250);

  background(bg);

  stroke(230); strokeWeight(2); noFill();
  rect(20, 20, width-40, height-40, 4);

  drawGrid_SUK();

  const roads = int(random(8, 12));
  for (let i = 0; i < roads; i++) drawRoad_SUK();

  drawStations_SUK();

  const icons = int(random(100, 150));
  for (let i = 0; i < icons; i++) {
    const x = random(40, width-40);
    const y = random(40, height-40);
    drawGlyph_SUK(x, y, random(10, 22), int(random(12)), palette_SUK);
  }

  stroke(235); noFill();
  rect(26, 26, width-52, height-52);
}

function drawGrid_SUK() {
  stroke(240); strokeWeight(1);
  for (let x = 40; x < width-40; x += 40) line(x, 40, x, height-40);
  for (let y = 40; y < height-40; y += 40) line(40, y, width-40, y);
}

function drawRoad_SUK() {
  const n = int(random(3, 6));
  let pts = [];
  for (let i = 0; i < n; i++) {
    pts.push(createVector(
      constrain(randomGaussian(width/2, width*0.25), 50, width-50),
      constrain(randomGaussian(height/2, height*0.25), 50, height-50)
    ));
  }
  const style = int(random(3));
  const col = random([color(30), color(120), color(220,80,90)]);
  stroke(col);
  if (style === 0) { strokeWeight(1.8); }
  if (style === 1) { strokeWeight(1.8); }
  if (style === 2) { strokeWeight(1.2); }

  for (let i=0; i<pts.length-1; i++) {
    if (style === 0) line(pts[i].x, pts[i].y, pts[i+1].x, pts[i+1].y);
    if (style === 1) dashed_SUK(pts[i], pts[i+1], 10, 6);
    if (style === 2) dotted_SUK(pts[i], pts[i+1], 8, 3);
  }
}

function drawStations_SUK() {
  const k = int(random(40, 65));
  noStroke();
  for (let i=0; i<k; i++) {
    const d = random([4,6,8]);
    fill(random([color(30), color(255, 90, 100), color(0)]));
    circle(random(50, width-50), random(50, height-50), d);
  }
}

function dashed_SUK(a, b, len, gap) {
  const d = p5.Vector.dist(a, b);
  const v = p5.Vector.sub(b, a).setMag(len+gap);
  let p = a.copy();
  while (p5.Vector.dist(p, a) < d) {
    const p2 = p5.Vector.add(p, v.copy().setMag(len));
    line(p.x, p.y, p2.x, p2.y);
    p.add(v);
  }
}
function dotted_SUK(a, b, gap, dotSize) {
  const d = p5.Vector.dist(a, b);
  const step = gap;
  const dir = p5.Vector.sub(b, a).setMag(step);
  let p = a.copy();
  noStroke(); fill(30);
  while (p5.Vector.dist(p, a) < d) {
    circle(p.x, p.y, dotSize);
    p.add(dir);
  }
  stroke(30);
}

function drawGlyph_SUK(x, y, s, type, palette_SUK) {
  push();
  translate(x, y);
  rectMode(CENTER);
  strokeCap(ROUND);

  function pick() { return random(palette_SUK); }

  switch (type) {
    case 0:
      noStroke(); fill(pick());
      triangle(0, -s*0.4, s*0.55, -s*0.2, 0, 0);
      stroke(30); strokeWeight(1.5); line(0, -s*0.5, 0, s*0.5);
      break;
    case 1:
      noStroke(); fill(pick());
      rect(0, 0, s*0.9, s*1.4, 2);
      fill(30);
      for (let i=-2; i<=2; i++) rect(i*s*0.18, 0, s*0.06, s*1.1);
      break;
    case 2:
      noStroke(); fill(pick());
      triangle(0, -s*0.5, -s*0.45, s*0.1, s*0.45, s*0.1);
      fill(30); rect(0, s*0.35, s*0.12, s*0.5);
      break;
    case 3:
      noStroke(); fill(pick());
      arc(0, 0, s*1.2, s*1.2, PI, TWO_PI, PIE);
      fill(30); rect(0, s*0.5, s*0.2, s*0.6);
      break;
    case 4:
      noStroke(); fill(pick());
      rect(-s*0.25, s*0.1, s*0.5, s*0.2);
      rect(0, -s*0.1, s*0.5, s*0.2);
      rect(s*0.25, -s*0.3, s*0.5, s*0.2);
      break;
    case 5:
      noFill(); stroke(30); strokeWeight(1.5);
      beginShape();
      for (let i=0;i<6;i++) vertex(map(i,0,5,-s*0.5,s*0.5), (i%2?-1:1)*s*0.2);
      endShape();
      break;
    case 6:
      noFill(); stroke(30); strokeWeight(1);
      rect(0,0,s,s*0.7);
      for (let x=-s*0.4;x<=s*0.4;x+=s*0.15) line(x,-s*0.3,x+s*0.3,s*0.35);
      break;
    case 7:
      noStroke();
      fill(30); circle(0,0,s*0.22);
      fill(255); circle(0,0,s*0.42);
      fill(pick()); circle(0,0,s*0.14);
      break;
    case 8:
      noStroke();
      const k = int(random(2,5));
      for (let i=0; i<k; i++) {
        fill(pick());
        rect(0, -s*0.5 + i*(s*0.35), random(s*0.3, s), s*0.12, 2);
      }
      break;
    case 9:
      noStroke();
      fill(30); circle(-s*0.2,0,s*0.12);
      fill(pick()); circle(s*0.25,0,s*0.18);
      stroke(30); strokeWeight(1.5); line(-s*0.5,-s*0.35,s*0.5,-s*0.35);
      break;
    case 10:
      noStroke();
      fill(pick()); rect(0,0,s*0.9,s*0.5,2);
      fill(30); rect(0,-s*0.35,s*0.6,s*0.35);
      fill(0); circle(-s*0.3,s*0.35,s*0.3); circle(s*0.3,s*0.35,s*0.3);
      break;
    case 11:
      noStroke();
      fill(pick()); rect(0,s*0.25,s*0.9,s*0.7);
      fill(30); triangle(-s*0.5,s*0.25,0,-s*0.5,s*0.5,s*0.25);
      break;
  }
  pop();
}
