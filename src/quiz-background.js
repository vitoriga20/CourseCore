let instance = null;
let container = null;
let globalBgCanvas = null;
let observer = null;

function isGeoMode() {
  return (document.body.getAttribute('data-bg') || 'geo') === 'geo';
}

function updateGlobalBgVisibility() {
  if (globalBgCanvas) {
    globalBgCanvas.style.opacity = isGeoMode() ? '0' : '';
  }
}

function getColors() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDark) {
    return {
      primary: '#a3c9b6',
      secondary: 'rgba(163, 201, 182, 0.58)',
      bg: '#050505'
    };
  }
  return {
    primary: '#2d4e3e',
    secondary: 'rgba(45, 78, 62, 0.58)',
    bg: '#f3f6f4'
  };
}

function sketch(p) {
  const params = {
    seed: 12345,
    sphereRadius: 1200,
    gridDensity: 6,
    noiseAmp: 12,
    rotationSpeed: 0.00015,
    viewOffsetX: p.PI / 2,
    starCount: 28,
    equatorStarCount: 6,
    lineWeight: 0.8,
    particleCount: 0,
    trailLength: 10
  };

  let particles = [];
  let stars = [];
  let spherePoints = [];
  let time = 0;
  let focalLength = 1500;
  let isVisible = true;
  let primaryColor, secondaryColor, bgColor;

  function updateColors() {
    const colors = getColors();
    primaryColor = colors.primary;
    secondaryColor = colors.secondary;
    bgColor = colors.bg;
  }

  function updateVisibility() {
    isVisible = isGeoMode();
    updateGlobalBgVisibility();
  }

  p.setup = function () {
    if (!container) return;
    p.createCanvas(container.clientWidth, container.clientHeight);
    p.pixelDensity(1);
    p.frameRate(15);
    updateColors();
    initializeSystem();
    updateVisibility();

    observer = new MutationObserver(updateVisibility);
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-bg'] });
    window.addEventListener('resize', onResize);
    window.addEventListener('themechange', updateColors);
  };

  function onResize() {
    if (!container) return;
    p.resizeCanvas(container.clientWidth, container.clientHeight);
  }

  function initializeSystem() {
    p.randomSeed(params.seed);
    p.noiseSeed(params.seed);
    time = 0;
    precomputeSpherePoints();
    stars = [];
    const eqCount = params.equatorStarCount || 0;
    for (let i = 0; i < eqCount; i++) {
      const theta = p.HALF_PI + p.map(i, 0, eqCount - 1, -1.2, 1.2) + p.random(-0.12, 0.12);
      const phi = p.HALF_PI + p.random(-0.25, 0.25);
      stars.push({
        pos: perturbedPoint(theta, phi, params.sphereRadius),
        size: p.random(35, 48),
        phase: p.random(p.TWO_PI)
      });
    }
    for (let i = 0; i < params.starCount; i++) {
      const theta = p.random(p.TWO_PI);
      const phi = p.random(p.PI);
      stars.push({
        pos: perturbedPoint(theta, phi, params.sphereRadius),
        size: p.random(12, 18),
        phase: p.random(p.TWO_PI)
      });
    }
    particles = [];
    for (let i = 0; i < params.particleCount; i++) {
      particles.push(new Particle());
    }
  }

  function precomputeSpherePoints() {
    spherePoints = [];
    const latCount = params.gridDensity;
    const lonCount = params.gridDensity * 2;
    for (let i = 0; i <= latCount; i++) {
      spherePoints[i] = [];
      const phi = p.map(i, 0, latCount, 0.08, p.PI - 0.08);
      for (let j = 0; j <= lonCount; j++) {
        const theta = p.map(j, 0, lonCount, 0, p.TWO_PI);
        spherePoints[i][j] = perturbedPoint(theta, phi, params.sphereRadius);
      }
    }
  }

  p.draw = function () {
    if (!isVisible) {
      p.clear();
      return;
    }
    p.background(bgColor);
    time += params.rotationSpeed;
    const rotX = time * 0.7 + params.viewOffsetX;
    const rotY = time * 0.5;
    const rotZ = time * 0.3;
    drawSphereGrid(rotX, rotY, rotZ);
    drawStars(rotX, rotY, rotZ);
    for (const particle of particles) {
      particle.update();
      particle.draw(rotX, rotY, rotZ);
    }
  };

  function sphericalToCartesian(r, theta, phi) {
    return {
      x: r * p.sin(phi) * p.cos(theta),
      y: r * p.sin(phi) * p.sin(theta),
      z: r * p.cos(phi)
    };
  }

  function rotate3D(x, y, z, rx, ry, rz) {
    const y1 = y * p.cos(rx) - z * p.sin(rx);
    const z1 = y * p.sin(rx) + z * p.cos(rx);
    const x2 = x * p.cos(ry) + z1 * p.sin(ry);
    const z2 = -x * p.sin(ry) + z1 * p.cos(ry);
    const x3 = x2 * p.cos(rz) - y1 * p.sin(rz);
    const y3 = x2 * p.sin(rz) + y1 * p.cos(rz);
    return { x: x3, y: y3, z: z2 };
  }

  function project(x, y, z) {
    const scale = focalLength / (focalLength + z);
    return {
      x: x * scale + p.width / 2,
      y: y * scale + p.height / 2,
      scale,
      visible: z > -focalLength + 50
    };
  }

  function perturbedPoint(theta, phi, r) {
    const base = sphericalToCartesian(r, theta, phi);
    const nx = base.x / r;
    const ny = base.y / r;
    const nz = base.z / r;
    const amp = params.noiseAmp;
    const n = p.noise(base.x * 0.004, base.y * 0.004, base.z * 0.004);
    const n2 = p.noise(base.x * 0.012 + 1000, base.y * 0.012 + 1000, base.z * 0.012 + 1000);
    const displacement = (n - 0.5) * amp + (n2 - 0.5) * amp * 0.4;
    return {
      x: base.x + nx * displacement,
      y: base.y + ny * displacement,
      z: base.z + nz * displacement
    };
  }

  function drawSphereGrid(rotX, rotY, rotZ) {
    const latCount = params.gridDensity;
    const lonCount = params.gridDensity * 2;
    const c = p.color(primaryColor);
    c.setAlpha(120);
    p.stroke(c);
    p.strokeWeight(params.lineWeight);
    p.noFill();
    const projected = [];
    for (let i = 0; i <= latCount; i++) {
      projected[i] = [];
      for (let j = 0; j <= lonCount; j++) {
        const pt = spherePoints[i][j];
        const rp = rotate3D(pt.x, pt.y, pt.z, rotX, rotY, rotZ);
        projected[i][j] = project(rp.x, rp.y, rp.z);
      }
    }
    for (let i = 1; i < latCount; i++) {
      p.beginShape();
      for (let j = 0; j <= lonCount; j++) {
        const pt = projected[i][j];
        if (pt.visible) p.vertex(pt.x, pt.y);
      }
      p.endShape();
    }
    for (let j = 0; j <= lonCount; j++) {
      p.beginShape();
      for (let i = 0; i <= latCount; i++) {
        const pt = projected[i][j];
        if (pt.visible) p.vertex(pt.x, pt.y);
      }
      p.endShape();
    }
  }

  function drawStars(rotX, rotY, rotZ) {
    const c = p.color(primaryColor);
    for (const s of stars) {
      const rp = rotate3D(s.pos.x, s.pos.y, s.pos.z, rotX, rotY, rotZ);
      const proj = project(rp.x, rp.y, rp.z);
      if (!proj.visible) continue;
      const pulse = 0.6 + 0.4 * p.sin(time * 2 + s.phase);
      const alpha = 230 * pulse + 20;
      const size = s.size * proj.scale;
      const x = proj.x;
      const y = proj.y;
      p.noStroke();
      c.setAlpha(alpha * 0.15);
      p.fill(c);
      p.ellipse(x, y, size * 4.0, size * 4.0);
      c.setAlpha(alpha * 0.4);
      p.fill(c);
      p.ellipse(x, y, size * 2.2, size * 2.2);
      c.setAlpha(alpha * 0.8);
      p.fill(c);
      p.ellipse(x, y, size, size);
      c.setAlpha(alpha);
      p.fill(c);
      p.ellipse(x, y, size * 0.45, size * 0.45);
      c.setAlpha(alpha * 0.4);
      p.stroke(c);
      p.strokeWeight(params.lineWeight * 0.8);
      p.line(x - size * 1.2, y, x + size * 1.2, y);
      p.line(x, y - size * 1.2, x, y + size * 1.2);
      p.noStroke();
    }
  }

  class Particle {
    constructor() {
      this.theta = p.random(p.TWO_PI);
      this.phi = p.random(0.2, p.PI - 0.2);
      this.speedTheta = p.random(-0.0008, 0.0008);
      this.speedPhi = p.random(-0.0003, 0.0003);
      this.trail = [];
      this.r = params.sphereRadius * p.random(0.97, 1.03);
    }
    update() {
      this.theta += this.speedTheta;
      this.phi += this.speedPhi;
      this.phi = p.constrain(this.phi, 0.15, p.PI - 0.15);
      const pt = perturbedPoint(this.theta, this.phi, this.r);
      this.trail.push({ x: pt.x, y: pt.y, z: pt.z });
      if (this.trail.length > params.trailLength) this.trail.shift();
    }
    draw(rotX, rotY, rotZ) {
      if (this.trail.length < 2) return;
      const c = p.color(secondaryColor);
      for (let i = 0; i < this.trail.length - 1; i++) {
        const rp1 = rotate3D(this.trail[i].x, this.trail[i].y, this.trail[i].z, rotX, rotY, rotZ);
        const proj1 = project(rp1.x, rp1.y, rp1.z);
        if (!proj1.visible) continue;
        const rp2 = rotate3D(this.trail[i + 1].x, this.trail[i + 1].y, this.trail[i + 1].z, rotX, rotY, rotZ);
        const proj2 = project(rp2.x, rp2.y, rp2.z);
        if (!proj2.visible) continue;
        const alpha = p.map(i, 0, this.trail.length, 0, 55);
        c.setAlpha(alpha);
        p.stroke(c);
        p.strokeWeight(params.lineWeight * 0.5 * proj1.scale);
        p.line(proj1.x, proj1.y, proj2.x, proj2.y);
      }
    }
  }
}

export function initQuizBackground() {
  if (instance) return;
  globalBgCanvas = document.getElementById('bg-canvas');
  container = document.createElement('div');
  container.id = 'quiz-bg-canvas';
  document.body.appendChild(container);
  updateGlobalBgVisibility();
  instance = new p5(sketch, container);
}

export function destroyQuizBackground() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  if (instance) {
    instance.remove();
    instance = null;
  }
  if (container) {
    container.remove();
    container = null;
  }
  if (globalBgCanvas) {
    globalBgCanvas.style.opacity = '';
    globalBgCanvas = null;
  }
}
