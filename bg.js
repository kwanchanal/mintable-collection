
// Background trailing line (vanilla Canvas) — grey, continuous
(function () {
  const c = document.createElement('canvas');
  c.id = 'bgCanvas';
  document.body.prepend(c);
  const ctx = c.getContext('2d', { alpha: true });
  function resize() { c.width = innerWidth; c.height = innerHeight; }
  addEventListener('resize', resize, { passive: true });
  resize();

  let x = c.width * 0.5, y = c.height * 0.5;
  let t = 0;

  function fade(a){ return a*a*(3-2*a); }
  function hash(n){ const s = Math.sin(n) * 43758.5453123; return s - Math.floor(s); }
  function noise(x, y, z){
    const X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z||0);
    x -= X; y -= Y; z = (z||0) - Z;
    const u = fade(x), v = fade(y); // using 2D for speed
    function g(i,j){ return hash(X+i + 57*(Y+j) + 113*Z); }
    const n0=g(0,0), n1=g(1,0), n2=g(0,1), n3=g(1,1);
    const ix0 = n0 + (n1-n0)*u;
    const ix1 = n2 + (n3-n2)*u;
    return ix0 + (ix1-ix0)*v;
  }

  function step(){
    // fade previous frame to leave a trail
    ctx.fillStyle = 'rgba(15,15,20,0.06)';
    ctx.fillRect(0, 0, c.width, c.height);

    // direction from smooth noise
    const scale = 0.002;
    const ang = noise(x*scale, y*scale, t) * Math.PI * 2 * 2.0;
    const speed = 1.6;
    const nx = Math.cos(ang) * speed;
    const ny = Math.sin(ang) * speed;

    const px = x, py = y;
    x += nx; y += ny;

    // wrap around edges
    if (x < -10) x = c.width + 10;
    if (x > c.width + 10) x = -10;
    if (y < -10) y = c.height + 10;
    if (y > c.height + 10) y = -10;

    ctx.strokeStyle = 'rgba(176,176,184,0.75)';
    ctx.lineWidth = 1.2;
    ctx.shadowBlur = 6;
    ctx.shadowColor = 'rgba(180,180,190,0.65)';
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(x, y);
    ctx.stroke();

    t += 0.0035;
    requestAnimationFrame(step);
  }

  // prime background
  ctx.fillStyle = 'rgba(15,15,20,1)';
  ctx.fillRect(0,0,c.width,c.height);
  step();
})();
