export function initBackground(getTheme) {
  const canvas = document.getElementById("bg-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let w, h, horizon, focal, zMove = 0;
  let raf;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    horizon = h * 0.38;
    focal = Math.min(w, h) * 0.55;
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const isDark = typeof getTheme === 'function' ? getTheme() === "dark" : false;
    ctx.strokeStyle = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)";
    ctx.lineWidth = 1;

    const maxZ = Math.max(w, h) * 2.5;
    const stepZ = Math.max(30, Math.min(w, h) * 0.04);

    for (let z = 20; z < maxZ; z += stepZ) {
      const depth = z + zMove;
      const y = horizon + focal * 120 / depth;
      if (y > h + 20) continue;
      ctx.globalAlpha = Math.max(0, 1 - depth / maxZ) * 0.8;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    for (let x = -w; x <= w * 2; x += stepZ * 1.6) {
      ctx.beginPath();
      for (let z = 20; z < maxZ; z += stepZ * 0.8) {
        const depth = z + zMove;
        const y = horizon + focal * 120 / depth;
        const sx = w / 2 + (x - w / 2) * focal / depth;
        ctx.lineTo(sx, y);
      }
      ctx.globalAlpha = 0.25;
      ctx.stroke();
    }

    zMove += 0.25;
    if (zMove > stepZ) zMove -= stepZ;
    raf = requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", resize);
  draw();

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduce.matches) cancelAnimationFrame(raf);
  reduce.addEventListener("change", e => {
    if (e.matches) cancelAnimationFrame(raf);
    else draw();
  });

  return () => cancelAnimationFrame(raf);
}
