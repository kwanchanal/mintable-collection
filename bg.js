// Background scribble — VERY long straight runs + strong jitter, sharp corners
(function(){
  const c = document.createElement('canvas');
  c.id = 'bgCanvas';
  c.style.position = 'fixed';
  c.style.inset = '0';
  c.style.zIndex = '0';
  c.style.pointerEvents = 'none';
  document.body.prepend(c);

  const ctx = c.getContext('2d', { alpha: false });
  function resize(){ c.width = innerWidth; c.height = innerHeight; ctx.fillStyle = '#000'; ctx.fillRect(0,0,c.width,c.height); }
  addEventListener('resize', resize, { passive: true }); resize();

  const MARGIN = 8;
  let x = MARGIN, y = MARGIN;
  let dir = Math.random()*Math.PI*2;

  // Tunables
  const SPEED = 2.0;                 // px/frame along the heading
  const JITTER_HEADING = 0.28;       // radians added to direction each frame (shake)
  const JITTER_POS = 1.4;            // perpendicular positional jitter (px)
  const SHARP_MIN = 0.9;             // radians (~51°)
  const SHARP_MAX = 2.2;             // radians (~126°)
  // ~15x longer than the earlier version (48–120 frames) → 720–1800
  const STRAIGHT_MIN_FRAMES = 720;
  const STRAIGHT_MAX_FRAMES = 1800;
  let framesToTurn = STRAIGHT_MIN_FRAMES + Math.floor(Math.random()*(STRAIGHT_MAX_FRAMES-STRAIGHT_MIN_FRAMES+1));

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.0;
  ctx.lineJoin = 'miter';
  ctx.lineCap  = 'round';

  function step(){
    const px = x, py = y;

    // Keep the heading mostly straight, but shake a bit
    dir += (Math.random()*2 - 1) * JITTER_HEADING;

    // After a very long run → make a sharp corner, then reset the run length
    if (--framesToTurn <= 0) {
      const ang = SHARP_MIN + Math.random()*(SHARP_MAX - SHARP_MIN);
      dir += (Math.random() < 0.5 ? -ang : ang);
      framesToTurn = STRAIGHT_MIN_FRAMES + Math.floor(Math.random()*(STRAIGHT_MAX_FRAMES-STRAIGHT_MIN_FRAMES+1));
    }

    // Move: forward + perpendicular positional jitter (scribbly but still straight overall)
    const dx = Math.cos(dir), dy = Math.sin(dir);
    const perpX = -dy, perpY = dx;
    const jitter = (Math.random()*2 - 1) * JITTER_POS;
    x += dx * SPEED + perpX * jitter;
    y += dy * SPEED + perpY * jitter;

    // Bounce on edges (reflect)
    if (x <= 1){ x = 1; dir = Math.PI - dir; }
    if (x >= c.width-1){ x = c.width-1; dir = Math.PI - dir; }
    if (y <= 1){ y = 1; dir = -dir; }
    if (y >= c.height-1){ y = c.height-1; dir = -dir; }

    // Draw segment
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(x, y);
    ctx.stroke();

    requestAnimationFrame(step);
  }
  step();
})();