---
name: "geometric-design-engineering"
description: "Analyze black-and-white geometric motion graphics (e.g. Reconstruct), extract reusable design patterns, and generate complete HTML/CSS/JS reproductions. Outputs single-file, runnable scenes with timeline orchestration."
---

# Geometric Design Engineering

## 1. Skill 目标

把高对比度黑白几何 MG 动画（如 Reconstruct）**完全重现为可运行的单文件 HTML**。

- **输入**：参考视频 / 图片 / 文字描述 / 已有 demo。
- **输出**：可直接在浏览器打开的单文件 HTML，包含完整场景时间线、转场、文字、几何动画。
- **与 algorithmic-art 分工**：复杂生成艺术模块（粒子、噪声、分形）可调用 `algorithmic-art` 生成；本 Skill 负责整体架构、场景脚本、转场系统、性能约束与最终集成。

---

## 2. 触发条件

遇到以下任一情况时调用本 Skill：

1. 用户上传视频/图片，要求「复刻 / 重现 / 用 HTML 实现」。
2. 用户问「怎么做这种几何背景 / MG 动画 / 转场 / 排版」。
3. 用户要求把已有设计参考转成可运行网页。
4. 关键词命中：Reconstruct、黑白几何、透视网格、星芒、曼荼罗、圆环、碎片、硬切、反色、MG 动画、Brutalist。

---

## 3. 完整工作流

### 3.1 视频分析 → 结构化场景脚本

1. **读取参考文件**（视频需多轮分析）：
   - 第 1 轮：整体结构、Loop 长度、BPM、色彩、风格关键词。
   - 第 2 轮：分秒级时间线，每 0.5–1.0 秒一个场景卡片。
   - 第 3 轮：逐场景元素清单（形状、数量、位置、大小、颜色、透明度、运动、文字）。
   - 第 4 轮：转场方式与节奏同步点（硬切 / 反色 / 擦除 / 生长）。
2. **输出 Scene Script**：见第 6 章格式。
3. **技术选型**：按元素类型选择渲染层：
   - 文字/卡片/简单形状 → DOM + CSS animation。
   - 复杂曲线/网格/曼荼罗 → SVG 或 Canvas 2D。
   - 3D 形体 / 粒子系统 → p5.js 2D 透视或 Three.js WebGL。
   - 全屏转场/反色 → CSS `filter` / `clip-path` / 覆盖层。

### 3.2 生成 HTML 骨架

单文件 HTML 必须包含：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[Project] — Geometric Reproduction</title>
  <!-- 字体：Inter / Bebas Neue / Dancing Script / 中文无衬线 -->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Bebas+Neue&family=Dancing+Script&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-black: #000000;
      --bg-white: #ffffff;
      --bg-grid: #e6e6e6;
      --fg-white: #ffffff;
      --fg-black: #000000;
      --gray-mid: #808080;
      --gray-dark: #2a2a2a;
      --bpm: 146;
      --beat: 0.4109589s;
      --loop: 8.219s;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
    #stage { position: fixed; inset: 0; }
    .scene { position: absolute; inset: 0; opacity: 0; pointer-events: none; }
    .scene.active { opacity: 1; }
  </style>
</head>
<body>
  <div id="stage"></div>
  <script>
    // SceneManager + Timeline + per-scene renderers
  </script>
</body>
</html>
```

### 3.3 逐个场景实现

每个场景 = 一个 `.scene` div + 内部图层 + 一个 `render(t)` 函数。

```javascript
const scenes = [
  { id: 'disorder', start: 0.0, end: 1.5, build, render },
  { id: 'formation', start: 1.5, end: 2.0, build, render },
  // ...
];
```

### 3.4 时间线与转场联调

- 使用 `requestAnimationFrame` 驱动全局时间 `t`（秒）。
- `SceneManager` 根据 `t` 切换 `.active` class。
- 转场覆盖层（flash invert / sweep wipe / panel wipe）作为独立 DOM 元素，按 cue 触发。
- 所有 CSS animation 时长用 `calc(var(--beat) * N)` 或绝对秒数，确保与 JS 时间同步。

### 3.5 验证

1. **语法检查**：浏览器 console 无报错。
2. **关键帧截图**：用 Playwright 在 Loop 关键时间点截图，与参考视频对比。
3. **性能检查**：
   - 粒子数 ≤ 50（默认）。
   - 帧率 ≤ 30 fps。
   - 预计算静态几何点。
   - 避免每帧 `filter: invert()` 切换。

### 3.6 交付

- 输出 HTML 文件路径。
- 输出 Scene Script Markdown（可选，便于复用）。
- 更新 `development-log.md`。
- 说明已知限制（字体依赖、WebGL 降级、BPM 估算误差）。

---

## 4. 场景编排系统

### 4.1 SceneManager

```javascript
class SceneManager {
  constructor(scenes, stage) {
    this.scenes = scenes.sort((a, b) => a.start - b.start);
    this.stage = stage;
    this.scenes.forEach(s => {
      s.el = document.createElement('div');
      s.el.className = `scene scene-${s.id}`;
      if (s.build) s.build(s.el);
      stage.appendChild(s.el);
    });
  }
  update(t) {
    this.scenes.forEach(s => {
      const active = t >= s.start && t < s.end;
      s.el.classList.toggle('active', active);
      if (active && s.render) {
        const local = (t - s.start) / (s.end - s.start);
        s.render(s.el, local, t);
      }
    });
  }
}
```

### 4.2 全局时间线

```javascript
let startTime = performance.now();
let speed = 1; // 可调整播放速度
let duration = 18.6; // 视频总时长
let loopStart = 8.533, loopEnd = 16.533; // 循环段落

function tick(now) {
  let raw = (now - startTime) / 1000 * speed;
  let t = mapRawToSceneTime(raw);
  if (raw >= duration) { t = duration; playing = false; }
  window.inLoop = raw >= loopStart && raw < loopEnd;
  manager.update(t);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
```

> **确定性绘制**：所有 `render(el, local, t)` 中的动画必须基于传入的全局时间 `t`，禁止使用 `performance.now()` 或 `Date.now()` 驱动 Canvas/SVG/CSS 变换，以保证 seek、循环、截图时画面完全可复现。
>
> **有状态系统的确定性**：粒子、碎片、物理模拟等跨帧累计状态的元素，不能依赖运行时的 `Math.random()` 和上一次绘制状态。应使用基于 `local` 的确定性模拟：为每个粒子分配固定种子 → 从初始状态按 `local` 推算迭代步数 → 每帧从 0 重新模拟到目标步数。这样无论 seek 到第几次、是否在 Loop 段，`local` 相同则画面相同。

### 4.3 Loop 段非模映射

如果视频的第二段循环与第一段不是简单“整体平移 + 取模”，而是各场景时长/起止被重新剪辑，使用独立场景区间表：

```javascript
const secondVerseSegments = [
  { id: 'overdose',      start: 8.533,  end: 8.792,  targetStart: 0.533,  targetEnd: 0.700 },
  { id: 'disorderly',    start: 8.792,  end: 9.250,  targetStart: 0.700,  targetEnd: 1.150 },
  { id: 'bird',          start: 9.250,  end: 9.875,  targetStart: 1.150,  targetEnd: 2.000 },
  { id: 'endless',       start: 9.875,  end: 10.417, targetStart: 2.000,  targetEnd: 2.533 },
  { id: 'consciousness', start: 10.417, end: 10.850, targetStart: 2.533,  targetEnd: 3.000 },
  { id: 'consciousness', start: 10.850, end: 11.400, targetStart: 3.000,  targetEnd: 3.533 },
  { id: 'regularity',    start: 11.400, end: 11.970, targetStart: 3.533,  targetEnd: 4.000 },
  { id: 'scripts',       start: 11.970, end: 12.850, targetStart: 4.000,  targetEnd: 4.533 },
  { id: 'architectural', start: 12.850, end: 13.450, targetStart: 4.533,  targetEnd: 5.400 },
  { id: 'crusher',       start: 13.450, end: 14.450, targetStart: 5.400,  targetEnd: 6.400 },
  { id: 'intertwine',    start: 14.450, end: 16.533, targetStart: 6.533,  targetEnd: 8.533 },
];
function mapRawToSceneTime(raw) {
  if (raw < loopStart || raw >= loopEnd) return raw;
  const seg = secondVerseSegments.find(s => raw >= s.start && raw < s.end);
  if (!seg) return raw;
  const local = (raw - seg.start) / (seg.end - seg.start);
  return seg.targetStart + local * (seg.targetEnd - seg.targetStart);
}
```

- `start/end`：第二段在视频里的真实时间边界（从 `detect_cuts.py` 与逐帧对比获得）。
- `targetStart/targetEnd`：要复用的第一段场景时间边界。
- 同一 `id` 可多次出现（如 `consciousness` 被拆成两段对应第一段的 2.533–3.0 与 3.0–3.533）。
- 场景渲染仍通过 `SceneManager.update(t)` 统一调度，`window.inLoop` 用于第二段的反色/镜像等差异化处理。

### 4.4 转场触发器

```javascript
const transitions = [
  { t: 0.85, type: 'invert', duration: 0.10 },
  { t: 1.50, type: 'cut' },
  { t: 2.60, type: 'invert', duration: 0.10 },
  { t: 3.25, type: 'cut' },
  { t: 3.90, type: 'sweep', duration: 0.40 },
  { t: 4.85, type: 'panels', duration: 0.45 },
  { t: 5.70, type: 'tear', duration: 0.50 },
  { t: 8.45, type: 'cut' },
];
```

---

## 5. 设计模式库

> 以下参数来自对 Reconstruct 的逐帧分析。实际使用时按画布尺寸等比缩放。

### 5.1 透视网格地面

```javascript
function buildGround(el) {
  const canvas = document.createElement('canvas');
  canvas.className = 'ground-canvas';
  el.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let zMove = 0;
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  function draw() {
    const W = canvas.width, H = canvas.height;
    const horizon = H * 0.35, focal = 340;
    ctx.clearRect(0, 0, W, H);
    for (let z = 20; z < 4000; z += 70) {
      const depth = z + zMove;
      const y = horizon + focal * 140 / depth;
      const alpha = Math.max(0, 1 - depth / 4000) * 0.75;
      ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    for (let x = -W; x <= W * 2; x += 70) {
      ctx.beginPath();
      for (let z = 20; z < 4000; z += 50) {
        const depth = z + zMove;
        const y = horizon + focal * 140 / depth;
        const sx = W / 2 + (x - W / 2) * focal / depth;
        const bend = 0.000015 * Math.pow(x - W / 2, 2) * (depth / 1000);
        ctx.lineTo(sx, y - bend);
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.stroke();
    }
    zMove += 3;
  }
  resize(); window.addEventListener('resize', resize);
  return { draw };
}
```

### 5.2 放射射线

```javascript
function drawRadialRays(ctx, cx, cy, n = 24, r = 600, alpha = 0.3) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
  ctx.lineWidth = 1;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.stroke();
  }
  ctx.restore();
}
```

### 5.3 星芒

```javascript
function drawRoundedFlower(ctx, cx, cy, R = 260, w = 36, rot = 0, fill = '#fff') {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.fillStyle = fill;
  const step = Math.PI * 2 / 8;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    ctx.rotate(step);
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo( w, -R * 0.45,  w, -R, 0, -R);
    ctx.bezierCurveTo(-w, -R, -w, -R * 0.45, 0, 0);
  }
  ctx.fill(); ctx.restore();
}

function drawBladeStar(ctx, cx, cy, n = 12, R = 240, rot = 0, fill = '#fff') {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.fillStyle = fill;
  for (let i = 0; i < n; i++) {
    ctx.save(); ctx.rotate((i / n) * Math.PI * 2);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-R * 0.08, -R * 0.35);
    ctx.lineTo(0, -R);
    ctx.lineTo(R * 0.08, -R * 0.35);
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
  ctx.restore();
}
```

### 5.4 同心圆环 / 曼荼罗

```javascript
function drawRadialMandala(ctx, cx, cy, t = 0, color = '#fff') {
  const rings = [130, 260, 400, 560];
  const counts = [8, 16, 24, 32];
  const speeds = [18, -12, 24, -15];
  ctx.save(); ctx.translate(cx, cy);
  ctx.strokeStyle = color; ctx.lineWidth = 1;
  const nodes = rings.map((r, i) => {
    const rot = (speeds[i] * t * Math.PI / 180) % (Math.PI * 2);
    return Array.from({length: counts[i]}, (_, j) => {
      const a = j * Math.PI * 2 / counts[i] + rot;
      return {x: r * Math.cos(a), y: r * Math.sin(a)};
    });
  });
  rings.forEach(r => { ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke(); });
  const maxN = Math.max(...counts);
  for (let j = 0; j < maxN; j++) {
    ctx.beginPath();
    for (let i = 0; i < rings.length; i++) {
      const n = counts[i], idx = Math.floor(j * n / maxN) % n;
      const p = nodes[i][idx];
      if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }
  ctx.restore();
}
```

### 5.5 3D 圆环 / Torus

```javascript
function drawTorus(ctx, cx, cy, R = 140, r = 50, t = 0) {
  // 简化：用 p5.js WEBGL 或预计算 3D 点投影
  // 详见 algorithmic-art 生成的 torus 模块
}
```

### 5.6 碎片多边形

必须基于固定种子按 `local` 重新模拟，保证 seek / Loop / 截图完全一致（见 4.2 确定性原则）。

```javascript
function seededRandom(seed) {
  return function() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

class Fragment {
  constructor(x, y, rng) {
    this.pos = {x, y};
    const angle = rng() * Math.PI * 2;
    const speed = 4 + rng() * 10;
    this.vel = {x: Math.cos(angle) * speed, y: Math.sin(angle) * speed};
    this.angle = rng() * Math.PI * 2;
    this.aVel = (rng() - 0.5) * 0.24;
    this.type = ['triangle', 'blade', 'diamond', 'longblade'][Math.floor(rng() * 4)];
    this.size = 20 + rng() * 160;
    this.color = rng() > 0.12 ? '#fff' : '#777';
    this.life = 1;
    // 退场爆发方向（local > 0.82 时启用）
    const exitAngle = rng() * Math.PI * 2;
    this.exitVel = {x: Math.cos(exitAngle) * (18 + rng() * 26), y: Math.sin(exitAngle) * (18 + rng() * 26)};
    this.exitSpin = (rng() - 0.5) * 0.6;
  }
  update(W, H, local) {
    this.pos.x += this.vel.x; this.pos.y += this.vel.y;
    this.vel.x *= 0.92; this.vel.y *= 0.92;
    this.pos.x += (W / 2 - this.pos.x) * 0.003;
    this.pos.y += (H / 2 - this.pos.y) * 0.003;
    this.angle += this.aVel;
    this.life -= 0.003;
    if (local > 0.82) {
      const sub = (local - 0.82) / 0.18;
      this.vel.x += this.exitVel.x * sub * 0.15;
      this.vel.y += this.exitVel.y * sub * 0.15;
      this.aVel += this.exitSpin * sub * 0.15;
      this.life -= 0.012 * sub;
    }
  }
  draw(ctx) {
    if (this.life <= 0) return;
    ctx.save(); ctx.translate(this.pos.x, this.pos.y); ctx.rotate(this.angle);
    ctx.fillStyle = this.color; ctx.globalAlpha = this.life;
    const s = this.size;
    ctx.beginPath();
    if (this.type === 'triangle') {
      ctx.moveTo(-s*0.5, s*0.4); ctx.lineTo(s*0.5, s*0.4); ctx.lineTo(0, -s*0.6);
    } else if (this.type === 'blade') {
      ctx.moveTo(-s*0.18, -s*0.5); ctx.lineTo(s*0.18, -s*0.5);
      ctx.lineTo(s*0.08, s*0.5); ctx.lineTo(-s*0.08, s*0.5);
    } else if (this.type === 'diamond') {
      ctx.moveTo(0, -s*0.5); ctx.lineTo(s*0.45, 0); ctx.lineTo(0, s*0.5); ctx.lineTo(-s*0.45, 0);
    } else if (this.type === 'longblade') {
      ctx.moveTo(-s*0.10, -s*0.70); ctx.lineTo(s*0.10, -s*0.70); ctx.lineTo(0, s*0.65);
    } else {
      ctx.rect(-s/2, -s/2, s, s);
    }
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
}
```

### 5.7 意识模块（Consciousness module）

```javascript
function drawModule(ctx, cx, cy, s, rot, cn, en, mirror = false) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
  if (mirror) ctx.scale(-1, 1);
  ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(1, s * 0.018);
  // 弧线笼
  ctx.strokeStyle = 'rgba(255,255,255,0.42)';
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.ellipse(i * s * 0.10, -s * 0.12, s * 0.78, s * 0.26, i * 0.28, 0, Math.PI * 2);
    ctx.stroke();
  }
  // 顶部弧
  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(0, -s * 0.55, s * (0.32 + i * 0.14), s * 0.10, 0, Math.PI, 0);
    ctx.stroke();
  }
  // 8 瓣花
  drawRoundedFlower(ctx, -s * 0.52, 0, s * 0.30, s * 0.09, 0, '#fff');
  // 渐变球
  const g = ctx.createRadialGradient(cx - s*0.05, cy - s*0.12, s*0.015, cx, cy, s*0.15);
  g.addColorStop(0, '#bbb'); g.addColorStop(0.5, '#666'); g.addColorStop(1, '#222');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(-s*0.06, -s*0.12, s*0.15, 0, Math.PI*2); ctx.fill();
  // 菱形
  ctx.save(); ctx.translate(s * 0.16, -s * 0.02); ctx.rotate(Math.PI / 8); ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.moveTo(0, -s*0.31); ctx.lineTo(s*0.26, 0); ctx.lineTo(0, s*0.31); ctx.lineTo(-s*0.26, 0); ctx.closePath(); ctx.fill(); ctx.restore();
  // 圆点、横条、4 小点、网格图案
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(s * 0.34, -s * 0.06, s * 0.065, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(s * 0.44, -s * 0.035, s * 0.46, s * 0.07);
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(-s*0.05 + i*s*0.08, s*0.26, s*0.03, 0, Math.PI*2); ctx.fill(); }
  ctx.save(); ctx.translate(s * 0.86, -s * 0.16); ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = Math.max(1, s*0.011);
  for (let i = 0; i < 4; i++) {
    ctx.beginPath(); ctx.moveTo(-s*0.07, -s*0.07 + i*s*0.047); ctx.lineTo(s*0.07, -s*0.07 + i*s*0.047); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-s*0.07 + i*s*0.047, -s*0.07); ctx.lineTo(-s*0.07 + i*s*0.047, s*0.07); ctx.stroke();
  }
  ctx.restore();
  // 中英卡片
  ctx.fillStyle = '#fff';
  ctx.fillRect(-s * 0.36, s * 0.38, s * 0.72, s * 0.44);
  ctx.fillStyle = '#000'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (mirror) ctx.save();
  if (mirror) ctx.scale(-1, 1);
  ctx.font = `600 ${s * 0.13}px Inter, Noto Sans SC, sans-serif`; ctx.fillText(en, 0, s * 0.53);
  ctx.font = `400 ${s * 0.11}px Noto Sans SC, Inter, sans-serif`; ctx.fillText(cn, 0, s * 0.74);
  if (mirror) ctx.restore();
  ctx.restore();
}
```

**参数说明**：`s` 为模块基准像素尺寸，建议以 `Math.min(W,H) * 0.16–0.35` 计算；`rot` 给模块轻微旋转；`mirror=true` 时模块几何沿 Y 轴镜像而文字保持正向，用于复现参考视频中左右模块的非对称朝向；卡片文字需配中文 fallback。

### 5.8 渐变立方体（Gradient cube）

```javascript
function drawCube(ctx, cx, cy, s, rotDeg) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rotDeg * Math.PI / 180);
  const face = s * 0.45, dx = s * 0.18, dy = s * 0.12;
  const g1 = ctx.createLinearGradient(-face, -face, face, face);
  g1.addColorStop(0, '#888'); g1.addColorStop(1, '#333');
  ctx.fillStyle = g1;
  ctx.beginPath(); ctx.moveTo(-face, -face); ctx.lineTo(face, -face); ctx.lineTo(face, face); ctx.lineTo(-face, face); ctx.closePath(); ctx.fill();
  const g2 = ctx.createLinearGradient(-face, -face, -face + dx, -face - dy);
  g2.addColorStop(0, '#bbb'); g2.addColorStop(1, '#666');
  ctx.fillStyle = g2;
  ctx.beginPath(); ctx.moveTo(-face, -face); ctx.lineTo(face, -face); ctx.lineTo(face + dx, -face - dy); ctx.lineTo(-face + dx, -face - dy); ctx.closePath(); ctx.fill();
  const g3 = ctx.createLinearGradient(face, -face, face + dx, face + dy);
  g3.addColorStop(0, '#555'); g3.addColorStop(1, '#222');
  ctx.fillStyle = g3;
  ctx.beginPath(); ctx.moveTo(face, -face); ctx.lineTo(face, face); ctx.lineTo(face + dx, face - dy); ctx.lineTo(face + dx, -face - dy); ctx.closePath(); ctx.fill();
  ctx.restore();
}
```

### 5.9 呼吸点阵（Dot grid）

```javascript
function drawDotGrid(ctx, cx, cy, size, n, t) {
  ctx.save(); ctx.translate(cx, cy); ctx.fillStyle = '#fff';
  const step = size / (n - 1);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const x = -size/2 + i * step, y = -size/2 + j * step;
      const phase = (i + j) * 0.3 + t * 1.5;
      ctx.globalAlpha = 0.45 + Math.sin(phase) * 0.25;
      ctx.beginPath(); ctx.arc(x, y, Math.max(0.6, 1.2 + Math.sin(phase) * 0.4), 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.globalAlpha = 1; ctx.restore();
}
```

### 5.10 放射骨架（Radial structure）

```javascript
function drawRadialStructure(ctx, cx, cy, r, t) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 0.2);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1;
  const n = 18;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const len = r * (0.45 + 0.55 * Math.sin(i * 1.3 + t * 1.2));
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len); ctx.stroke();
  }
  for (let i = 0; i < 5; i++) {
    ctx.beginPath(); ctx.arc(0, 0, r * (0.35 + i * 0.16), 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}
```

### 5.11 文字卡片堆叠

```css
.card-stack {
  perspective: 700px;
  display: flex; flex-direction: column; align-items: center; gap: 10px;
}
.card-stack .chip {
  background: rgba(255,255,255,.12);
  border: 1px solid rgba(255,255,255,.35);
  padding: 10px 28px;
  font: 400 13px/1 'Inter', sans-serif;
  box-shadow: 0 24px 0 rgba(255,255,255,.08);
}
```

### 5.12 反色切换

```css
.flash-invert {
  animation: flashInvert 0.10s steps(1) forwards;
}
@keyframes flashInvert {
  0%   { filter: invert(0); }
  50%  { filter: invert(1) brightness(1.4); }
  100% { filter: invert(1); }
}
```

### 5.13 擦除转场

```css
.sweep-wipe {
  position: absolute; inset: 0; background: #fff;
  transform: translateX(-110%);
  animation: sweepLR 0.4s cubic-bezier(0.7, 0, 0.3, 1) forwards;
}
@keyframes sweepLR { to { transform: translateX(110%); } }

.vertical-tear {
  clip-path: inset(0 50% 0 50%);
  animation: tearOpen 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes tearOpen { to { clip-path: inset(0 0 0 0); } }
```

### 5.14 复合星簇（Cluster star）

用于 architectural 等场景的右侧主视觉：24–30 片不等长刀片 + 6 颗卫星菱形，整体缓慢旋转。

```javascript
function drawClusterStar(ctx, cx, cy, R, n, rot, color) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.fillStyle = color;
  const blades = n || 26;
  for (let i = 0; i < blades; i++) {
    ctx.save();
    const base = (i / blades) * Math.PI * 2;
    ctx.rotate(base + Math.sin(i * 2.3) * 0.22);
    const len = R * (0.50 + 0.50 * Math.sin(i * 3.6 + 1.2));
    const w = R * (0.06 + 0.04 * Math.sin(i * 5.1));
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(-w, -len * 0.32); ctx.lineTo(0, -len); ctx.lineTo(w, -len * 0.32);
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
  // small satellite diamonds
  ctx.globalAlpha = 0.75;
  for (let i = 0; i < 6; i++) {
    ctx.save();
    const a = (i / 6) * Math.PI * 2 + 0.5;
    const d = R * (0.78 + 0.22 * Math.sin(i * 2.7));
    ctx.translate(Math.cos(a) * d, Math.sin(a) * d);
    ctx.rotate(a);
    const s = R * 0.11;
    ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s, 0); ctx.lineTo(0, s); ctx.lineTo(-s, 0); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}
```

### 5.15 长阴影（Long shadow）

向右下方递减排列的旋转正方形阴影，配合星簇制造空间深度。

```javascript
function drawLongShadow(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.18;
  const n = 6;
  for (let i = 0; i < n; i++) {
    const off = r * (0.22 + i * 0.16);
    const s = r * (0.20 + i * 0.10);
    ctx.save();
    ctx.translate(cx + off * 0.85, cy + off * 0.30);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-s / 2, -s / 2, s, s);
    ctx.restore();
  }
  ctx.restore();
}
```

### 5.16 建筑线框扇（Wire fan）

用于 scripts 等场景右侧的复杂建筑/球面线框：多层同心圆、经线椭圆、纬线椭圆与放射线束组合，营造测绘草图感。

```javascript
function drawWireFan(ctx, cx, cy, r, t) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 0.08);
  ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 1;
  // 放射线束
  const n = 56;
  for (let i = 0; i <= n; i++) {
    const a = -Math.PI / 2.4 + (i / n) * (Math.PI * 2 / 1.9);
    const len = r * (0.55 + 0.45 * Math.sin(i * 1.9 + t));
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len); ctx.stroke();
  }
  // 同心圆弧
  for (let i = 0; i < 7; i++) {
    const rad = r * (0.16 + i * 0.12);
    ctx.beginPath(); ctx.arc(0, 0, rad, -Math.PI / 2.2, Math.PI / 2.2); ctx.stroke();
  }
  // 完整同心圆环背景
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  for (let i = 0; i < 4; i++) {
    const rad = r * (0.35 + i * 0.25);
    ctx.beginPath(); ctx.arc(0, 0, rad, 0, Math.PI * 2); ctx.stroke();
  }
  // 经线椭圆
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1;
  for (let i = -3; i <= 3; i++) {
    if (i === 0) continue;
    const a = (i / 3) * Math.PI / 3;
    ctx.beginPath(); ctx.ellipse(Math.cos(a) * r * 0.5, 0, r * 0.06, r * 0.62, 0, 0, Math.PI * 2); ctx.stroke();
  }
  // 纬线椭圆
  for (let i = -2; i <= 2; i++) {
    if (i === 0) continue;
    const b = (i / 2) * Math.PI / 4;
    ctx.beginPath(); ctx.ellipse(0, Math.sin(b) * r * 0.45, r * 0.55, r * 0.05, 0, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}
```

### 5.17 带孔渐变立方体（Cube with hole）

用于 scripts 场景中央，模拟字母 `i` 的主体：渐变正方形 + 中心圆孔 + 细圆环。

```javascript
function drawCubeWithHole(ctx, cx, cy, s, t) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(0.08 + Math.sin(t * 0.15) * 0.04);
  const g = ctx.createLinearGradient(-s, -s, s, s);
  g.addColorStop(0, '#eee'); g.addColorStop(0.5, '#777'); g.addColorStop(1, '#333');
  ctx.fillStyle = g;
  ctx.fillRect(-s, -s, s * 2, s * 2);
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(0, 0, s * 0.32, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(0, 0, s * 0.32, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}```

### 5.18 程序生成建筑摄影立面（Procedural building facade）

不依赖外部图片，用 Canvas 模拟高对比度黑白建筑摄影：亮灰底 + 宽暗对角带 + 密集对角结构肋 + 反向对角线 + 菱形明暗模块 + 三角形阴影/高光口袋 + 颗粒 + 暗角。适用于 architectural 场景左侧面板。

```javascript
function drawBuildingFacade(ctx, w, h, local) {
  ctx.save();
  // brighter photo tone: push highlights toward white for stronger inverted darks
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#e8e8e8'); bg.addColorStop(0.40, '#ffffff'); bg.addColorStop(1, '#b8b8b8');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  // broad dark diagonal bands for high-contrast facade rhythm
  ctx.fillStyle = 'rgba(0,0,0,0.14)';
  for (let i = -4; i < 10; i++) {
    ctx.beginPath();
    const x = i * w * 0.20;
    ctx.moveTo(x, h);
    ctx.lineTo(x + w * 0.62, 0);
    ctx.lineTo(x + w * 0.78, 0);
    ctx.lineTo(x + w * 0.16, h);
    ctx.closePath();
    ctx.fill();
  }
  // large dark architectural shadows (top-left and bottom-left like real facade)
  ctx.fillStyle = 'rgba(0,0,0,0.42)';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w * 0.55, 0); ctx.lineTo(0, h * 0.70); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(w * 0.60, h); ctx.lineTo(0, h * 0.32); ctx.closePath(); ctx.fill();
  // photo grain
  for (let i = 0; i < 600; i++) {
    const rng = seededRandom(333 + i);
    const x = rng() * w, y = rng() * h;
    ctx.fillStyle = rng() > 0.5 ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(x, y, 1, 1);
  }
  // primary diagonal structural ribs (steep, dark)
  ctx.strokeStyle = 'rgba(0,0,0,0.60)'; ctx.lineWidth = Math.max(1, w * 0.006);
  for (let i = -6; i < 22; i++) {
    const x = i * w * 0.07;
    ctx.beginPath(); ctx.moveTo(x, h); ctx.lineTo(x + w * 0.58, 0); ctx.stroke();
  }
  // secondary thin ribs
  ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = Math.max(1, w * 0.002);
  for (let i = -6; i < 22; i++) {
    const x = i * w * 0.07 + w * 0.035;
    ctx.beginPath(); ctx.moveTo(x, h); ctx.lineTo(x + w * 0.58, 0); ctx.stroke();
  }
  // light counter-diagonal beams creating diamond modules
  ctx.strokeStyle = 'rgba(255,255,255,0.40)'; ctx.lineWidth = Math.max(1, w * 0.004);
  for (let i = -2; i < 14; i++) {
    const x = i * w * 0.12;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x - w * 0.48, h); ctx.stroke();
  }
  // diamond panel fills alternating dark/light (subtle)
  const cols = 6, rows = 8;
  const pw = w / cols, ph = h / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const gx = c * pw + pw * 0.5;
      const gy = r * ph + ph * 0.5;
      const dark = ((r + c) % 2 === 0);
      ctx.fillStyle = dark ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.22)';
      ctx.beginPath();
      ctx.moveTo(gx, gy - ph * 0.35);
      ctx.lineTo(gx + pw * 0.28, gy);
      ctx.lineTo(gx, gy + ph * 0.35);
      ctx.lineTo(gx - pw * 0.28, gy);
      ctx.closePath(); ctx.fill();
    }
  }
  // bright glass highlights
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  for (let i = 0; i < 5; i++) {
    const x = i * w * 0.22 + w * 0.02;
    ctx.beginPath();
    ctx.moveTo(x, h * 0.08); ctx.lineTo(x + w * 0.10, h * 0.48); ctx.lineTo(x, h * 0.76);
    ctx.closePath(); ctx.fill();
  }
  // vignette: darken corners like a real lens/view
  const g = ctx.createRadialGradient(w * 0.5, h * 0.5, h * 0.25, w * 0.5, h * 0.5, h * 0.95);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.28)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  ctx.restore();
}
```

### 5.19 尖刺放射水晶（Crystal star）

比 5.14 更锐利、更薄的放射星簇，带两层刀片，适合 architectural 右侧面板的主视觉。

```javascript
function drawCrystalStar(ctx, cx, cy, R, n, rot, color) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.fillStyle = color;
  const blades = n || 20;
  for (let i = 0; i < blades; i++) {
    ctx.save(); ctx.rotate((i / blades) * Math.PI * 2);
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(-R * 0.10, -R * 0.42);
    ctx.lineTo(0, -R * (0.92 + 0.08 * Math.sin(i * 3.1)));
    ctx.lineTo(R * 0.10, -R * 0.42);
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
  // inner secondary blades
  ctx.globalAlpha = 0.65;
  for (let i = 0; i < blades; i++) {
    ctx.save(); ctx.rotate((i / blades) * Math.PI * 2 + Math.PI / blades);
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(-R * 0.07, -R * 0.30);
    ctx.lineTo(0, -R * 0.62); ctx.lineTo(R * 0.07, -R * 0.30);
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
  ctx.restore();
}
```

### 5.20 淡出到黑退场（Fade-to-black exit）

白底/高亮场景切换到黑底场景时，用全屏黑色覆盖层逐步提升透明度，实现「画面暗下去」的过渡，比 `filter: invert()` 更贴合真实剪辑节奏。

```css
.fade-overlay {
  position: absolute; inset: 0;
  background: #000; opacity: 0;
  pointer-events: none; z-index: 10;
}
```

```javascript
function renderDisorderly(el, local) {
  // ... 其他元素动画
  const fade = local > 0.75 ? Math.min(1, (local - 0.75) / 0.25) : 0;
  el.querySelector('.disorderly-fade').style.opacity = fade;
}
```

- 触发时机：`local > 0.75` 开始，到 `local = 1.0` 完全黑场。
- 可与白屏闪光叠加：黑场完成后再用全局闪光覆盖层切到下一幕。

### 5.21 大白碎片扫过转场（Big shard sweep）

黑底场景切换到下一个黑底场景时，在退场末尾叠加少量尖锐白色碎片，从画面中心向外快速扩张并覆盖屏幕，提供视觉连续性。

```javascript
function initCrusherShards(canvas) {
  const ctx = canvas.getContext('2d');
  function resize() { canvas.width = W(); canvas.height = H(); }
  resize(); window.addEventListener('resize', resize);
  const shardCount = 8;
  function makeShard(seed) {
    const rng = seededRandom(seed);
    const u = Math.min(W(), H());
    const cx = W() * (0.35 + rng() * 0.3);
    const cy = H() * (0.35 + rng() * 0.3);
    const angle = rng() * Math.PI * 2;
    const dist = u * (0.35 + rng() * 0.45);
    const speed = 0.6 + rng() * 0.4;
    const baseSize = u * (0.12 + rng() * 0.14);
    const rotSpeed = (rng() - 0.5) * 2.0;
    // sharp shards: 3-5 irregular points, high radius contrast for jagged silhouettes
    const n = 3 + Math.floor(rng() * 3);
    const verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = 0.25 + rng() * 0.75;
      verts.push({x: Math.cos(a) * r, y: Math.sin(a) * r});
    }
    return {cx, cy, angle, dist, speed, baseSize, rotSpeed, verts};
  }
  const shards = Array.from({length: shardCount}, (_, i) => makeShard(98765 + i));
  canvas._draw = (local) => {
    const w = W(), h = H();
    ctx.clearRect(0, 0, w, h);
    if (local <= 0.88) return;
    const sub = Math.min(1, (local - 0.88) / 0.12);
    ctx.save();
    shards.forEach(sh => {
      const t = sub * sh.speed;
      const cx = sh.cx + Math.cos(sh.angle) * sh.dist * t;
      const cy = sh.cy + Math.sin(sh.angle) * sh.dist * t;
      const s = sh.baseSize * (1 + sub * 4.0);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(sh.rotSpeed * sub);
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = 0.85 * (1 - sub * 0.75);
      ctx.beginPath();
      sh.verts.forEach((v, i) => {
        const x = v.x * s;
        const y = v.y * s;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
    ctx.restore();
  };
}
```

- 使用固定种子的 `seededRandom`，保证截图/seek/Loop 完全一致。
- 碎片延迟到 `local > 0.88` 后出现，只在场景最后一刻扫过，避免提前遮挡主体。
- 顶点数 3–5、半径方差大，形成尖锐不规则的剪影，比规则多边形更接近参考视频的白色碎片。
- 可配合 `intertwine` 场景入口的碎片延续，形成「爆开 → 扫过 → 网格淡入」的连续转场。

### 5.22 圆瓣花（Endless flower）

`endless` 场景左侧的 6 瓣黑色花朵，每瓣用贝塞尔曲线画出圆润轮廓，整体缓慢旋转。

```javascript
function drawEndlessFlower(ctx, cx, cy, R, rot) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.fillStyle = '#000';
  const n = 6, step = Math.PI * 2 / n, w = R * 0.22;
  for (let i = 0; i < n; i++) {
    ctx.save(); ctx.rotate(i * step);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(w, -R * 0.30, w * 0.55, -R * 0.92, 0, -R);
    ctx.bezierCurveTo(-w * 0.55, -R * 0.92, -w, -R * 0.30, 0, 0);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}
```

### 5.23 小星芒（Tiny star）

16 点细小星芒，用于 endless 花朵左下角等局部点缀。

```javascript
function drawTinyStar(ctx, x, y, r) {
  ctx.save(); ctx.translate(x, y); ctx.fillStyle = '#fff';
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const a = i * Math.PI / 8;
    const rr = i % 2 === 0 ? r : r * 0.38;
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath(); ctx.fill(); ctx.restore();
}
```

### 5.24 分裂 R 标（Split R mark）

外圈圆线 + 左下半圆填充 + 中心字母 `R`，再用 clip 把左下区域反色为白色，形成半黑半白的徽章效果。

```javascript
function drawEndlessR(ctx, cx, cy, R) {
  ctx.save(); ctx.translate(cx, cy);
  ctx.strokeStyle = '#000'; ctx.lineWidth = Math.max(1, R * 0.07);
  ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, Math.PI, Math.PI * 1.5); ctx.closePath(); ctx.fill();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `800 ${R * 1.25}px Inter, sans-serif`;
  ctx.fillStyle = '#000'; ctx.fillText('R', 0, 0);
  ctx.save();
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R, Math.PI, Math.PI * 1.5); ctx.closePath(); ctx.clip();
  ctx.fillStyle = '#fff'; ctx.fillText('R', 0, 0);
  ctx.restore();
  ctx.restore();
}
```

---

## 6. Reconstruct 专用场景脚本

### 6.1 时间线总表

| 时间 | 场景 ID | 背景 | 核心元素 | 文字 | 转场 |
|------|---------|------|----------|------|------|
| 0.0–0.533 | black | #000 | 无 | 无 | 黑场 |
| 0.533–0.75 | overdose | #000 | 胶囊、星芒、圆环、卡片聚拢 | overdose / Pile up / Meaningless accumulation | 0.75s 白屏闪 |
| 0.75–1.25 | disorderly | #fff 网格地面 | 黑形胶囊、星芒、Disorderly 大字 | Disorderly / Pile up | 硬切 |
| 1.25–2.0 | bird | #000 | 透视卡片堆叠 + 左侧扫线 | bird / Plane formation / interface / Diffusion synthesis | 硬切 |
| 2.0–2.533 | endless | #e6e6e6 网格 | 黑星芒、R 徽章、标签、黑 wipe bar | out of imagination / endless | 硬切 |
| 2.533–3.533 | consciousness | #000 + 透视网格 + 山丘 | 意识模块（弧线笼 / 8 瓣花 / 渐变球 / 菱形 / 横条 / 中英卡片）、顶部标签 | consciousness / 交织 | 硬切 |
| 3.533–4.0 | regularity | #000 | 曼荼罗 + 白光横扫 | geometrical "regularity" | 硬切 |
| 4.0–4.533 | scripts | #000 | 巨型 scripts + 几何穿插 | scripts / delay / friction / time | 4.5s 垂直撕开 |
| 4.533–5.400 | architectural | 50/50 左右分屏 | 程序生成建筑摄影质感立面 + 尖刺水晶星簇 + 长阴影 + 居中文字 + 进度点 | Architectural / Product Designer / ASSEMBLE | 退场反色切换 |
| 5.400–6.400 | crusher | #000 + 网格 | 碎片爆发、两侧白色光柱 | CRUSHER / abstract / Shape combinations | 硬切 |
| 6.533–8.533 | intertwine | #000 | 斜网格 → 曼荼罗 → 3D torus | intertwine / Infinite Extension | 硬切 |
| 8.533–16.533 | loop | 重复 0.533–8.533 | 同上 | 同上 | 硬切 |
| 16.533–18.6 | credits | #000 | 手写体标题 | "Reconstruct" / Music / Video | 淡入 |

### 6.2 每个场景实现要点

#### overdose（0.533–0.75s）

- 黑底白形：大胶囊、四角星芒、细圆环、Pile up 卡片。
- 元素从四周向中心聚拢，透明度从 0 到 1。
- 中心大字 `overdose`，左侧竖排 `Meaningless accumulation`。
- 0.75s 白屏 flash 切换到 disorderly。

#### disorderly（0.75–1.25s）

- 白底浅灰网格地面，摄像机略带俯视旋转。
- 黑色胶囊、星芒、Pile up 卡片；右侧竖排小圆点。
- 巨大 `Disorderly` 居中，字母 `o` 用胶囊替代。
- 退场：`local > 0.75` 时黑色覆盖层透明度从 0 到 1 淡出到黑，衔接 bird 黑底场景。

#### bird（1.25–2.0s）

- 黑底，单列卡片沿 Z 轴透视堆叠，整体缓慢上移。
- 左侧放射细线束向中心汇聚。
- 右侧 faint labels：`Vague outline / skeleton / mirror`。

#### endless（2.0–2.533s）

- 浅灰网格纸背景，网格随 local 缓慢左移。
- Canvas 绘制：左侧 6 瓣黑色圆瓣花（`drawEndlessFlower`）中心偏右叠加黑色小方块、花朵左下角白色小星芒（`drawTinyStar`）、右侧半黑半白 R 徽章（`drawEndlessR`）。
- 顶部 4 个胶囊标签：`Run out of imagination`（黑底白字）、`words`、`cosmic`、`hollow`，按索引 stagger 淡入并向上微移。
- 右中 4 个小图标（心形/圆形/三角/方块）依次淡入。
- 底部黑 wipe bar 从 0% 到 42vh 升起，ease-out cubic；升起过程中黑色 `endless` 大字从网格后透出。

#### consciousness（2.533–3.0s）

- 黑底 + 白色透视网格地面 + 深灰山丘剪影。
- 顶部漂浮标签：`intertwine` / `abyss of black` / `farewell`。
- 意识模块 `drawModule()`：弧线笼、顶部弧、8 瓣花、渐变球体、菱形、圆点、横条、小网格图案、中英双语卡片；左右模块传 `mirror=true` 以复现视频中的非对称元素朝向。
- 由单模块居中聚拢，过渡到左 / 中 / 右三个模块沿地平线排列；模块错开出现。
- 加入底部锯齿线与随机构造线，强化工程草图感。
- 文字 `consciousness / 交织` 位于底部中心。

#### gridfloor（3.0–3.533s）

- 黑底白色透视网格地面，摄像机前冲。
- 沿地平线重复排列 consciousness 装置模块。
- 漂浮标签 `interface / forward / 交织 / integration`。

#### regularity（3.533–4.0s）

- 纯黑背景，中心 `geometrical "regularity"` 小字。
- 多层同心圆环 + 放射辐条，差速反向旋转。
- 末尾白光梯形横扫。

#### scripts（4.0–4.533s）

- 巨型 `scripts` 居中，字号 25–27vw，颜色 `rgba(255,255,255,0.55)`，随 local 缓慢左移。
- 背景大字上方叠加 Canvas 2D 图层：
  - 左侧大半径扫弧线（扁椭圆）横贯画面。
  - 左上小角度倾斜 5×5 呼吸点阵。
  - 左下透视呼吸点阵。
  - 左中渐变正方形压在文字上方。
  - 中央渐变立方体带圆孔，模拟字母 `i` 的点与主体。
  - 中右垂直胶囊/圆柱，下方叠加第二根细垂直柱。
  - 右侧建筑线框扇：`drawWireFan()` 多层同心圆弧 + 经线椭圆 + 纬线椭圆 + 放射线束，营造 3D 球面/建筑测绘感。
  - 底部小巧 8 刃星芒。
- 复用模式库函数 `drawCube / drawDotGrid / drawRadialStructure / drawBladeStar / drawRoundedFlower / drawWireFan / drawCubeWithHole`。
- 小标签 `delay / friction / time` 分别位于左中、中心偏右、右侧风扇下方。
- 4.5s 垂直撕开转场进入 architectural。

#### architectural（4.533–5.400s）

- 左右垂直分屏（左 50% / 右 50%），左侧 `#808080` 底色上 Canvas 2D 绘制程序生成建筑摄影质感立面，右侧白底绘制尖刺水晶星簇与长阴影。
- 左侧面板 `drawBuildingFacade()`：灰白渐变底（`#e8e8e8`→`#ffffff`→`#b8b8b8`）+ 宽暗对角带（opacity 0.14）+ 大型顶左/底左建筑阴影（opacity 0.42）+ 600 点照片颗粒 + 主次对角结构肋 + 反向对角线 + 菱形明暗模块 + 玻璃高光 + 暗角（opacity 0.28）。
- 右侧面板背景过渡：`local 0.10–0.30` 从黑色逐渐翻转为白色，尖刺水晶星簇颜色同步切换（暗底白星 → 白底黑星）。
- 右侧主星簇位置 `finalCx = 0.68W`、`finalCy = 0.46H`，半径 `0.15·min(W,H)`，16 片；附带右下小簇与 faint 对角构造线。
- 入场动画：`local < 0.10` 左右面板从两侧滑入；`0.10–0.22` 配合「右上白 + 下黑」的水平擦除覆盖层（`local < 0.22` 时 opacity 从 1 到 0），制造建筑摄影切入感。
- 退场反色：`local 0.74–0.86` 短暂 `filter: invert()` 闪烁（0→1→0 正弦过渡），衔接 crusher 黑底场景。
- 文字 `Architectural`、`Product Designer / Clu Soh`、`ASSEMBLE`；进度点 3 实 1 空。

#### crusher（5.400–6.400s）

- 黑底白色工程网格，左右两侧白色竖条光柱。
- 40 个确定性碎片从中心爆发，类型包含 `triangle / blade / diamond / longblade`；暗色碎片概率 12%，其余为白色。
- 每帧基于 `local` 重新模拟到目标步数（`steps = floor(local * 60)`），保证 Loop/截图完全一致。
- 碎片中后期（`local > 0.82`）受退场爆发力向外飞散，`life` 加速衰减。
- 退场：`local > 0.88` 时叠加 8 块尖锐白色碎片从中心向外快速扫过屏幕（基础尺寸 `0.12–0.26·min(W,H)`，扩张系数 4.0），衔接 intertwine 的倾斜网格。
- 大字 `CRUSHER`（描边），副标题 `abstract`，标签 `Shape combinations`。

#### intertwine（6.533–8.533s）

- 黑底白色倾斜透视网格，向左上漂移；`intertwine` 高细标题 + `Infinite Extension` 副标题居中。
- 中段（local 0.25–0.45）：网格淡出，多层曼荼罗从中心生长展开，圆环差速反向旋转。
- 后段（local 0.45–1.0）：曼荼罗淡出，近黑背景 `#080808` 中 3D torus 双轴旋转，数个小球沿轨道环绕；可用 p5.js WEBGL 实现。

#### credits（16.533–18.6s）

- 纯黑背景，手写体 `"Reconstruct"` 淡入。
- 下方 credits 居中对齐，日期底部居中。

---

## 7. 与 algorithmic-art 协作

### 7.1 何时调用

- 需要生成复杂生成艺术模块：噪声地形、粒子系统、分形生长、流体轨迹。
- 需要优化性能：预计算、LOD、WebGL 迁移。
- 用户要求增加交互控件（seed、参数滑块、下载 PNG）。

### 7.2 交接格式

必须提供：

```text
算法哲学: [名称]
色彩系统:
- 主背景: #000000
- 反色背景: #ffffff
- 中间层: rgba(255,255,255,0.12-0.85)
几何母题:
- [模式]: [关键参数]
透视系统:
- 消失点: (50%W, 35%H)
- 网格间距: 40-60px
运动语言:
- [差速旋转 / Z轴推进 / 双轴 tumbling / 碎片爆发]
节奏:
- BPM: 146
- Loop: 8.2s
质感:
- [长投影 / 拖尾 / 体积渐变 / 半调]
性能约束:
- 粒子上限 / 预计算 / 帧率
输出要求:
- 单文件 HTML
- 函数签名：function renderModule(ctx, t, W, H)
- 不依赖外部资源（除字体 CDN）
```

### 7.3 接收后的集成

- 把 `algorithmic-art` 输出的 `renderModule` 函数复制到对应场景的 `render(el, local, t)` 中。
- 在场景 `<div>` 内创建 `<canvas class="module-canvas">`。
- 确保 canvas 尺寸随窗口变化而 resize。

---

## 8. 输出示例

### 示例 1：用户要求「用 HTML 完全复刻 Reconstruct」

1. 读取 `_Reconstruct__video.mp4`，输出 Scene Script（第 6 章）。
2. 生成 `reconstruct_full.html`：
   - 单文件、1920×1080 适配、响应式缩放。
   - 包含 11 个主场景（含 intertwine 内部 grid / mandala / torus 三段）+ 全局时间线 + 转场触发器。
   - 关键几何模块用 Canvas 2D / SVG / CSS animation 实现。
   - 复杂 3D 模块（torus）使用 p5.js WEBGL。
3. 用 Playwright 在 0.75s / 1.25s / 1.75s / 2.25s / 2.9s / 3.75s / 4.25s / 5.0s / 6.0s / 6.75s / 7.25s / 8.0s / 17.0s 截图验证。
4. 更新 `development-log.md`。

### 示例 2：用户要求「提取 Reconstruct 的几何设计语言做网页背景」

1. 输出第 5 章模式库中的关键模式（透视网格、曼荼罗、星芒、碎片）。
2. 生成简化版 `reconstruct_bg.html`：
   - 黑底，循环播放曼荼罗 + 星芒 + 碎片爆发。
   - 限制粒子数 0、帧率 15fps。
   - 预计算静态几何点。
3. 作为网页背景使用时，确保 `#stage` 在内容后方，`pointer-events: none`。

---

## 9. 反例与黑名单

| # | 反模式 | 后果 | 正确做法 |
|---|--------|------|----------|
| 1 | 只输出设计参数，不生成可运行 HTML | 用户无法验证 | 必须输出单文件 HTML，至少包含骨架 + 关键场景 |
| 2 | 用绝对像素写死所有尺寸 | 不同屏幕变形 | 使用 `%W / %H / vmin / vmax` 或窗口 resize 重新计算 |
| 3 | 每帧重新计算全部几何点 | 掉帧 | 预计算静态点，每帧只做旋转 + 投影 |
| 4 | CSS animation 与 JS 时间线不同步 | 转场错位 | animation 时长基于 `--beat` 或秒数，由 JS 统一触发 |
| 5 | 忽略 `prefers-reduced-motion` | 可访问性问题 | 检测并减少/停止动画 |
| 6 | 加载大量外部图片/视频 | 单文件优势丢失 | 优先用 Canvas/SVG/CSS 生成，照片用 base64 或省略 |
| 7 | 字体 fallback 缺失 | 中文/特殊字体显示异常 | 始终提供系统字体 fallback |
| 8 | 场景直接复制粘贴不抽象 | 难维护 | 每个场景封装为 `{build, render, start, end}` 对象 |

---

## 10. 设计 Token 速查表

| Token | 值 | 用途 |
|-------|-----|------|
| `--bg-black` | `#000000` | 主背景 |
| `--bg-white` | `#ffffff` | 反色背景 |
| `--bg-grid` | `#e6e6e6` | 平面网格背景 |
| `--fg-white` | `#ffffff` | 黑底图形/文字 |
| `--fg-black` | `#000000` | 白底图形/文字 |
| `--gray-mid` | `#808080` | 球体、次级元素 |
| `--gray-dark` | `#2a2a2a` | Torus、暗灰立方体 |
| `--font-display` | `Inter, sans-serif` | 大标题 |
| `--font-tall` | `Bebas Neue, sans-serif` | 窄长标题 |
| `--font-hand` | `Dancing Script, cursive` | 手写片尾 |
| `--line-thin` | `1px` | 网格、辅助线 |
| `--line-medium` | `1.5–2px` | 圆弧、轨道线 |
| `--grid-cell` | `32–48px` | 平面方格 |
| `--perspective` | `700–900px` | CSS 透视 |
| `--vanishing-y` | `34%–38%` | 透视消失点 |
| `--bpm` | `146` | 音乐速度 |
| `--beat` | `0.4109589s` | 单拍时长 |
| `--loop` | `8.219s` | 视觉 Loop |
| `--flash` | `0.08–0.12s` | 反色切换 |
| `--ease-cut` | `cubic-bezier(0.2, 0, 0.2, 1)` | 硬切 |
| `--ease-bloom` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | 生长绽放 |

---

*Skill 版本: 2.1*
*目标: 用 HTML 完全重现 Reconstruct 等黑白几何 MG 动画*
*更新摘要: 新增 longblade 碎片类型、8 块尖锐退场碎片、endless 场景圆瓣花/小星芒/分裂 R 标、loop 段逐帧量化验证流程。*
