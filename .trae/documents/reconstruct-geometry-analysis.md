# Reconstruct 视频几何设计分析文档

> 分析对象：`c:\Users\vitoriga\Downloads\物理试题\_Reconstruct__video.mp4`  
> 视频信息：Bilibili MG 动画《Reconstruct》，UP：_紙，Video: NEKOPAPER，Music: Rainych - Overdose  
> 分析日期：2026-07-18  
> 用途：为 `geometric-design-engineering` Skill 提供设计意图、工程参数与可复用代码片段，与 `algorithmic-art` Skill 形成互补。

---

## 1. 项目背景与目标

本视频是一支高对比度黑白几何 MG 动画，核心视觉语言由网格、星芒、圆环、3D 基础体、碎片多边形、动态排版与硬切转场构成。用户希望将视频中的几何设计语言沉淀为可复用的 Skill，用于网页背景、小程序等实际场景。

本文档目标：
- 逐帧、分阶段拆解视频的构图、色彩、运动、节奏；
- 提取可复用的几何模式与工程参数；
- 为每个模式提供可直接在 p5.js / Canvas 2D / CSS 中运行的代码片段；
- 明确与 `algorithmic-art` Skill 的协作方式：本 Skill 负责「设计意图与参数」，algorithmic-art 负责「算法化生成」。

---

## 2. 视频整体信息

| 属性 | 值 |
|------|-----|
| 时长 | 约 18.6 秒 |
| 分辨率 | 约 1920×1080，16:9 |
| 帧率 | 30 fps |
| 主色调 | 纯黑 `#000000`、纯白 `#FFFFFF`、中灰 `#808080` |
| 字体 | 无衬线粗体（Disorderly、scripts、CRUSHER）、窄长高体（intertwine）、手写体（片尾 Reconstruct） |
| 核心结构 | 约 8.2 秒 Loop 单元播放两次 + 片尾字幕 |
| 估算 BPM | 145–150，最佳估算 146 BPM（一拍 ≈ 0.41 秒） |
| 视觉风格 | Brutalist / 瑞士排版 / 建筑解构 / WebGL 线框 |

**整体叙事弧线**：

```
Disorder → Formation → Overflow → Consciousness → Regularity → Scripts → Architecture → Crusher → Intertwine → Loop
```

---

## 3. 完整时间线拆解

### 3.1 0.0–0.5 s｜静默黑场与开场冲击

| 项目 | 观察 |
|------|------|
| 背景 | 纯黑 `#000000`，仅右上角 Bilibili 水印 |
| 切换 | 约 0.5 s 硬切进入第一场 |
| 设计意图 | 黑场蓄积注意力，随后元素爆开形成「开拍」冲击 |

### 3.2 0.5–1.5 s｜Disorder / 无序堆叠

**子窗口 A：0.5–1.0 s（黑底白形）**

| 元素 | 数量 | 位置 | 大小 | 颜色/透明度 | 运动 |
|------|------|------|------|-------------|------|
| 大横向胶囊 | 1 | 中心略下 | 42%W × 14%H | `#fff` 100% | 逆时针缓转 ~10°/0.5s |
| 四瓣星芒 | 1 | 中右 | 外接 18%W | `#fff` 100% | 顺时针 ~1 rev/s |
| 同心缺片圆弧 | 2 | 中左 | r≈12%W, 15%W | `#fff` 60% | 缓慢外扩 |
| 「Pile up」卡片 | 1 | 中下偏右 | 13%W × 9%H | `#fff` + 30% 投影 | 右下飞入 |
| 小胶囊 | 1 | 中中偏上 | 10%W × 5%H | `#fff` | 上下浮动 |

**子窗口 B：0.5–1.0 s（反色后白底黑形）**

- 约 0.85 s 发生全局反色：背景变白、元素变黑。
- 出现巨型文字 **「Disorderly」**，字母 `o` 被水平胶囊替代。
- 「Pile up」卡片堆叠为 3 层，每层偏移 (+2%W, +2%H)，带长投影。
- 底部出现透视网格地面，向镜头推进。

**子窗口 C：1.0–1.5 s（坍缩为垂直秩序）**

- 背景由白硬切回纯黑。
- 元素整理为垂直卡片堆叠：bird、Plane formation、latent、efficient、Target reversed、interface。
- 左侧出现向中心汇聚的透视扫线。

**设计意图**：从混乱堆积到秩序堆栈，反色作为主要转场语法。

### 3.3 1.5–2.0 s｜Plane Formation / 平面堆栈

| 项目 | 观察 |
|------|------|
| 1.5–1.7 s | 黑底，单列卡片堆叠居中，整体向上平移，透视细线渐显 |
| 1.72 s | 硬切至浅灰网格背景 `#f0f0f0` |
| 网格 | 平面正方网格，间距约 36–40 px，线宽 1 px，rgba(0,0,0,0.08–0.18) |
| 中心元素 | 左侧黑色 8 瓣花形星芒（外接约 44%W），右侧 R 圆形 logo（黑白对半填充） |
| 标签簇 | out of imagination、words、cosmic、hollow 等圆角/胶囊标签 |
| 大字 | endless 从底部黑栏后方向上揭示，字高约 180–220 px |

**设计意图**：网格作为秩序骨架，左右二元平衡构图，黑栏制造层叠遮挡。

### 3.4 2.0–3.5 s｜Out of Imagination / 意识网格

**子窗口 A：2.0–2.6 s（浅灰平面网格）**

- 背景 `#e6e6e6`，平面方格约 48 px。
- 黑色 8 瓣花形星芒在左侧（28%W, 44%H），缓慢顺时针旋转 ~15–20°/s。
- 右侧 R 徽章、底部 endless 被黑色矩形覆盖。

**子窗口 B：2.6–3.0 s（黑底 3D 意识空间）**

- 全局反色，背景变黑。
- 深灰曲率地面 `#141414`，透视网格渐入（opacity 0→0.75）。
- 中心出现白色 8 瓣星芒、灰色球体、球体线框笼（3 个交叉椭圆环）、白色立方体、水平胶囊条、四圆点序列。
- 文字 **consciousness / 交织** 位于中左，「Pile up」卡片位于中右。
- 弧线以 stroke-dashoffset 方式从星芒向右侧胶囊条绘制聚合。

**子窗口 C：3.0–3.5 s（透视网格阵列）**

- 透视网格地面完全成型，消失点约 (50%W, 35%H)。
- 中心装置沿 Z 轴复制为 3 组主簇，摄像机高速前冲。
- 3.25 s 硬切至曼陀罗放射线框，3.35 s 出现同心圆环。
- 文字：Intertwine、aligns of lack、forward、irregular、integration、geometrical "regularity"。

**设计意图**：从平面情绪板进入三维意识空间，网格从平面折叠为透视地面，装置镜像复制形成秩序。

### 3.5 3.5–5.0 s｜Geometrical Regularity + Scripts

**子窗口 A：3.5–4.2 s（曼陀罗收缩 + 白光横扫）**

- 背景纯黑，中心为 **geometrical "regularity"** 小字。
- 外层曼陀罗环半径约 38–42 vh，逆时针缓慢旋转；内层环反向旋转。
- 约 3.9 s 一道白色梯形光斑从左向右横扫，宽度约占画面 35–45 vw。
- 底部点阵从左下角生长。

**子窗口 B：4.2–5.0 s（scripts 大字容器）**

- 巨型文字 **scripts** 居中偏下，字号约 25–28 vw，颜色 `#cccccc`/alpha 0.85。
- 文字作为中间层：暗灰立方体、玻璃线框立方体、竖立圆环在其前后穿梭。
- 右侧放射花、顶部小圆点、底部星形、左下透视点阵、背景弧线共同构成信息几何。
- 小标签 delay、fixation、time 漂浮在中心区域。
- 4.85 s 画面被两条对角线切成 4 块面板，切出到下一阶段。

**设计意图**：巨型文字作为空间容器，几何体在其前后穿插，形成明确的前后景层级。

### 3.6 5.0–6.5 s｜Architectural / 建筑 + CRUSHER

**子窗口 A：5.0–5.7 s（建筑分屏）**

- 左右垂直分屏：左侧约 53% 建筑摄影（玻璃幕墙/三角形网格/半色调纹理），右侧约 47% 白底黑星芒。
- 建筑上覆盖极细透视网格线。
- 右侧黑色 12–16 瓣尖锐星芒，缓慢顺时针旋转，带长投影。
- 文字 **Architectural**、Product Designer/Clu Soh、4 个圆点进度指示器。

**子窗口 B：5.7–6.5 s（CRUSHER 碎裂）**

- 垂直光柱从中央撕开画面，建筑摄影被推向两侧并模糊化。
- 纯黑背景上的白色工程网格，约 32 px 一格。
- 碎片从中心向四周爆发：15–22 个主要多边形 + 30–45 个边缘小碎屑。
- 碎片类型：锐角三角形、刀片形、菱形、方形粒子。
- 文字 **CRUSHER** 位于左侧，被碎片切割遮挡。
- 生命周期：爆发 → 悬浮聚合 → 淡出。

**设计意图**：从建筑秩序到暴力破碎，文字从完整可读到被破坏，强化情绪高潮。

### 3.7 6.5–8.5 s｜Intertwine / Infinite Extension

**子窗口 A：6.5–7.2 s（倾斜网格 + 标题显现）**

- 背景纯黑，倾斜透视网格向左上漂移。
- 标题 **intertwine** 从中心淡入上移，副标题 Infinite Extension 延迟 0.12 s。
- 约 6.9 s 花形线框从中心萌发，初始 1–2 层。

**子窗口 B：7.2–8.0 s（曼荼罗展开 + Torus 旋入）**

- 曼荼罗完全成型：内层 6 瓣、中层 8–10 瓣、外层 12–16 瓣，各层反向差速旋转。
- 约 7.45 s 3D 圆环/torus 从右上旋入，放大至屏幕半径 38–42%。
- Torus 双轴旋转：绕主环轴约 30°/s，绕翻转轴约 20–25°/s。
- 3–5 层白色椭圆轨道线包裹 torus。

**子窗口 C：8.0–8.5 s（Torus 主导 + 循环衔接）**

- Torus 占据中心，持续双轴旋转，整体向画面右下移动。
- 网格与曼荼罗淡出至 opacity < 0.1。
- 8.45–8.50 s 硬切回开场，完成第一次循环。

**设计意图**：从破碎回归连续循环，torus 与轨道线营造无限延伸感。

### 3.8 8.5–16.6 s｜第二次循环

- 第二遍循环与第一遍在构图、元素、运动、节奏上**完全一致**。
- Loop 衔接处为硬切，无淡入淡出或颜色反转。
- 16.5 s 后不再循环，转入片尾。

### 3.9 16.6–18.6 s｜片尾

| 项目 | 观察 |
|------|------|
| 背景 | 纯黑，前场景几何元素在 16.6 s 前已完全淡出 |
| 标题 | 手写体 **"Reconstruct"**，居中偏上，淡入 + 轻微上移 |
| Credits | Music / Rainych - Overdose、Video / NEKOPAPER，居中对齐 |
| 日期 | October 11, 2023，底部居中，极小字号 |
| 结束 | 静止显示后整体渐隐至黑场 |

---

## 4. 可复用几何模式库

### 4.1 空间与透视系统

#### 4.1.1 透视网格地面

**视觉描述**：向远方消失点收敛的正交网格线，近处稀疏、远处密集，营造纵深空间感。

**应用场景**：网页背景、3D 场景地面、科技/数据可视化、音乐可视化。

**工程参数表**

| 参数 | 典型值 | 说明 |
|------|--------|------|
| 消失点 | (50%W, 34%–38%H) | 水平居中，垂直偏上 |
| 水平线数量 | 18–30 条 | 向远方按 1/z 压缩 |
| 垂直线数量 | 20–34 条 | 向消失点收敛 |
| 线宽 | 1 px | 全程保持 1 px |
| 颜色 | rgba(255,255,255,0.1–0.75) | 黑底白线；白底反转为黑线 |
| 推进速度 | 2–4 px/帧 | 模拟相机/网格向镜头移动 |
| 曲率 | 轻微碗状畸变 | 远处线条微微上弯 |

**p5.js 代码片段**

```javascript
let horizon, focal = 340, zMove = 0;

function setup() {
  createCanvas(1920, 1080);
  horizon = height * 0.35;
}

function drawPerspectiveGround() {
  // 横向 Z 线
  for (let z = 20; z < 4000; z += 70) {
    let depth = z + zMove;
    let y = horizon + focal * 140 / depth;
    let alpha = map(depth, 20, 4000, 200, 30);
    stroke(255, alpha);
    strokeWeight(1);
    line(0, y, width, y);
  }

  // 纵向 X 线（带轻微曲率）
  for (let x = -width; x <= width * 2; x += 70) {
    noFill();
    beginShape();
    for (let z = 20; z < 4000; z += 50) {
      let depth = z + zMove;
      let y  = horizon + focal * 140 / depth;
      let sx = width / 2 + (x - width / 2) * focal / depth;
      let bend = 0.000015 * pow(x - width / 2, 2) * (depth / 1000);
      vertex(sx, y - bend);
    }
    endShape();
  }

  zMove += 3;
}
```

**CSS 代码片段**

```css
.floor-grid {
  position: absolute;
  bottom: -30%; left: -20%;
  width: 140%; height: 90%;
  background-image:
    linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px);
  background-size: 60px 60px;
  transform: perspective(900px) rotateX(75deg);
  transform-origin: center top;
  mask-image: radial-gradient(ellipse at 50% 0%, black 30%, transparent 85%);
}
```

#### 4.1.2 放射射线

**视觉描述**：从中心点向四周均匀发散的直线，用于聚焦、速度感或中心放射构图。

**应用场景**：中心聚焦、加载动画、节拍标记、星芒骨架。

**工程参数表**

| 参数 | 典型值 | 说明 |
|------|--------|------|
| 原点 | 画面中心 | 可偏移 |
| 射线数量 | 12、16、24 | 越多越细密 |
| 发散角度 | 360° 均匀 | 或局部扇形 |
| 长度 | 至屏幕边缘 | 或固定半径 |
| 线宽 | 1 px | 细线 |
| 透明度 | 0.2–0.7 | 层级靠后 |

**Canvas 代码片段**

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

#### 4.1.3 倾斜网格/地面

**视觉描述**：平面网格绕 X/Z 轴旋转后向远方延伸，整体向左上漂移。

**应用场景**：舞台地面、无限延伸背景、抽象景观。

**工程参数表**

| 参数 | 典型值 | 说明 |
|------|--------|------|
| 旋转角度 | X 轴 60–80°，Z 轴 15–25° | 模拟倾斜地面 |
| 网格间距 | 48–80 px | 比平面网格大 |
| 线色 | rgba(255,255,255,0.12–0.35) | 随阶段衰减 |
| 漂移方向 | 向左上 (-dx, -dy) | 每循环移动一个单元 |

**CSS 代码片段**

```css
.tilt-grid {
  position: absolute;
  inset: -20%;
  background-image:
    linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px),
    linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px);
  background-size: 48px 48px;
  transform: rotate(24deg);
  animation: driftGrid 4s linear infinite;
}

@keyframes driftGrid {
  0%   { transform: rotate(24deg) translate(0, 0); }
  100% { transform: rotate(24deg) translate(-48px, -48px); }
}
```

---

### 4.2 几何母题

#### 4.2.1 星芒 / Asterisk（圆润版 + 尖锐版）

**视觉描述**：
- **圆润版**：8 个胶囊形花瓣，像重叠椭圆，常见于 2.0–3.5 s。
- **尖锐版**：12–16 个三角形刀片花瓣，尖端锐利，常见于 5.0–6.5 s。
- **四瓣 sparkle**：细长 X 形，常见于 0.5–1.5 s。

**应用场景**：装饰焦点、节拍标记、loading、图标背景。

**工程参数表**

| 参数 | 圆润版 | 尖锐版 | Sparkle |
|------|--------|--------|---------|
| 瓣数 | 8 | 12–16 | 4 |
| 花瓣形状 | 胶囊/椭圆 | 三角形刀片 | 细长 X |
| 半径 | 20–26%W | 18–24%W | 8–10%W |
| 旋转速度 | 15–30°/s | 90–180°/s | ~60°/s |
| 填充/描边 | 实心填充 | 实心填充 | 实心填充 |
| 阴影 | 长投影 | 长投影 | 无 |

**p5.js 代码片段：圆润 8 瓣花**

```javascript
function drawRoundedFlower(ctx, cx, cy, R = 260, w = 36, rot = 0, fill = '#000') {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.fillStyle = fill;
  ctx.beginPath();
  const step = Math.PI * 2 / 8;
  for (let i = 0; i < 8; i++) {
    ctx.rotate(step);
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo( w, -R * 0.45,  w, -R, 0, -R);
    ctx.bezierCurveTo(-w, -R, -w, -R * 0.45, 0, 0);
  }
  ctx.fill();
  ctx.restore();
}
```

**p5.js 代码片段：尖锐刀片星**

```javascript
function drawBladeStar(ctx, cx, cy, n = 12, R = 240, rot = 0, fill = '#000') {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.fillStyle = fill;
  for (let i = 0; i < n; i++) {
    ctx.save();
    ctx.rotate((i / n) * Math.PI * 2);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-R * 0.08, -R * 0.35);
    ctx.lineTo(0, -R);
    ctx.lineTo(R * 0.08, -R * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}
```

#### 4.2.2 椭圆 / 圆环与缺片

**视觉描述**：完整圆环、同心圆环、90°–120° 缺片圆弧交替使用。

**应用场景**：装饰环、进度环、容器边框、轨道线。

**工程参数表**

| 参数 | 完整圆环 | 同心圆环 | 缺片圆弧 |
|------|----------|----------|----------|
| 半径 | 40–260 px | 多层 60–560 px | 120–550 px |
| 线宽 | 1–2 px | 1 px | 1.5–2 px |
| 填充 | 无 | 无 | 无 |
| 缺口角度 | 无 | 无 | 90°–120° |
| 旋转 | 缓慢 | 差速反向 | 缓慢 |

**SVG 代码片段**

```svg
<!-- 同心圆环 -->
<g transform="translate(960,540)" fill="none" stroke="#fff" stroke-width="1">
  <circle r="130"/>
  <circle r="260"/>
  <circle r="400"/>
  <circle r="560"/>
</g>

<!-- 90° 缺片圆弧 -->
<g transform="translate(420,540) rotate(-45)">
  <path d="M 190,0 A 190,190 0 1 1 0,-190"
        fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
  <path d="M 120,0 A 120,120 0 1 1 0,-120"
        fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
</g>
```

#### 4.2.3 同心圆环 / 曼荼罗

**视觉描述**：多层同心圆环 + 放射辐条 + 节点连线，形成向心放射的曼荼罗结构。

**应用场景**：中心聚焦、加载动画、冥想/意识主题背景、音乐节拍可视化。

**工程参数表**

| 参数 | 典型值 | 说明 |
|------|--------|------|
| 环数 | 3–4 层 | 内小外大 |
| 每环节点数 | 8 / 16 / 24 / 32 | 外层更多 |
| 放射线数 | 与最外层节点数一致 | 24 或 32 |
| 连接线 | 节点间弦线 | 形成三角/菱形网格 |
| 差速旋转 | 内层快、外层慢，方向交替 | 营造交织感 |
| 生长动画 | scale 0→1.2，0.5–0.7 s | ease-out + 轻微弹性 |

**p5.js 代码片段**

```javascript
function drawRadialMandala(ctx, cx, cy, t = 0) {
  const rings   = [130, 260, 400, 560];
  const counts  = [8, 16, 24, 32];
  const speeds  = [18, -12, 24, -15];

  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth   = 1;

  const nodes = rings.map((r, i) => {
    const rot = (speeds[i] * t * Math.PI / 180) % (Math.PI * 2);
    const n = counts[i];
    return Array.from({length: n}, (_, j) => {
      const a = j * Math.PI * 2 / n + rot;
      return {x: r * Math.cos(a), y: r * Math.sin(a)};
    });
  });

  rings.forEach(r => {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
  });

  const maxN = Math.max(...counts);
  for (let j = 0; j < maxN; j++) {
    ctx.beginPath();
    for (let i = 0; i < rings.length; i++) {
      const n = counts[i];
      const idx = Math.floor(j * n / maxN) % n;
      const p = nodes[i][idx];
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }

  ctx.restore();
}
```

#### 4.2.4 3D 圆环 / Torus

**视觉描述**：深灰哑光圆环体，双轴缓慢旋转，被多层椭圆轨道线包裹。

**应用场景**：科技背景、3D 装饰、无限循环意象。

**工程参数表**

| 参数 | 典型值 | 说明 |
|------|--------|------|
| 大半径 R | 120–140 px | 约占屏幕 38–42% |
| 管半径 r | 45–55 px | r/R ≈ 0.35–0.4（胖 torus） |
| 颜色 | `#2a2a2a`–`#3a3a3a` | 哑光深灰 |
| 自转速度 | 绕主环轴 ~30°/s | 类似轮胎滚动 |
| 翻转速度 | 绕倾斜轴 ~20–25°/s | 形成 tumbling |
| 轨道线 | 3–5 层椭圆 | 不同倾角，半透明 |

**p5.js (WEBGL) 代码片段**

```javascript
function setup() {
  createCanvas(800, 600, WEBGL);
}

function draw() {
  background(10);
  ambientLight(80);
  directionalLight(200, 200, 200, 0.5, 0.5, -1);

  const R = 140, r = 50;
  rotateX(0.5);
  rotateY(frameCount * 0.008);
  rotateZ(frameCount * 0.012);

  noStroke();
  fill(45);
  torus(R, r, 48, 32);

  noFill();
  stroke(180, 120);
  strokeWeight(1);
  for (let k = 0; k < 3; k++) {
    push();
    rotateX(k * PI/3 + frameCount * 0.005);
    rotateY(k * PI/4 + frameCount * 0.003);
    ellipse(0, 0, (R + r + 40) * 2, (R + r + 40) * 2);
    pop();
  }
}
```

#### 4.2.5 3D 基础体穿插

**视觉描述**：灰色球体 + 线框笼、白色立方体、水平胶囊条、暗灰立方体、玻璃线框立方体、竖立圆环、顶部小圆点等在同一空间中穿插排列。

**应用场景**：科技 hero 区域、产品展示、抽象构图。

**工程参数表**

| 元素 | 大小 | 颜色 | 材质 | 旋转 |
|------|------|------|------|------|
| 灰色球体 | 直径 6–8%H | `#808080` | 实体哑光 | 极慢或静止 |
| 球体线框笼 | 外接 12–14%H | `#fff` | 线框 | 三轴慢转 |
| 白色立方体 | 边长 6%H | `#fff` | 实体 | 绕 X/Y 慢转 |
| 水平胶囊条 | 长 12–15%W，高 2%H | `#fff` | 实体 | 基本水平 |
| 暗灰立方体 | 边长 10–12%H | `#303030` | 实体 | 极慢 Y 轴 |
| 玻璃线框立方体 | 边长 8–10%H | 白边 + 透明面 | 线框/透明 | 绕 X/Y 慢转 |
| 竖立圆环 | 高 12%H，宽 4%W | `#c0c0c0` | 实体薄环 | 绕 Y 轴旋转 |
| 顶部小圆点 | 直径 2%H | `#fff` | 实体 | 轻微浮动 |

**p5.js 代码片段**

```javascript
function drawPrimitives() {
  background(0);

  // 灰色球体 + 线框笼
  push();
  translate(-120, 0, 0);
  noStroke(); fill(128); sphere(60);
  stroke(255); noFill(); strokeWeight(1.5);
  for (let i = 0; i < 3; i++) {
    push();
    rotateX(frameCount * 0.01 + i * PI/3);
    rotateY(frameCount * 0.015 + i * PI/3);
    ellipse(0, 0, 160, 160);
    pop();
  }
  pop();

  // 白色立方体
  push();
  translate(0, 0, 0);
  rotateY(frameCount * 0.01);
  rotateX(frameCount * 0.007);
  fill(255); noStroke(); box(50);
  pop();

  // 水平胶囊条
  push();
  translate(120, 0, 0);
  rotateZ(HALF_PI);
  fill(255); noStroke(); cylinder(12, 140);
  pop();
}
```

#### 4.2.6 碎片多边形

**视觉描述**：锐角三角形、刀片形、菱形、方形粒子从中心爆发，独立旋转并向外扩散，随后悬浮聚合、淡出。

**应用场景**：破碎/重构动画、过渡效果、高潮冲击、数据解构。

**工程参数表**

| 参数 | 典型值 | 说明 |
|------|--------|------|
| 碎片总数 | 30–45 个 | 主要多边形 15–22 + 边缘粒子 |
| 三角形 | 3–5 个 | 边长 80–150 px |
| 刀片形 | 4–6 个 | 长 100–220 px |
| 菱形 | 2–4 个 | 60–120 px |
| 方形粒子 | 10–15 个 | 8–28 px |
| 爆炸速度 | 4–14 px/帧 | 快速衰减 |
| 旋转速度 | ±0.05–0.15 rad/帧 | 独立随机 |
| 生命周期 | 爆发 → 悬浮聚合 → 淡出 | 约 2.5–3 秒 |

**p5.js 代码片段**

```javascript
class Fragment {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.fromAngle(random(TWO_PI)).mult(random(4, 14));
    this.angle = random(TWO_PI);
    this.aVel = random(-0.12, 0.12);
    this.type = random(['triangle', 'blade', 'diamond', 'square']);
    this.size = random(20, 160);
    this.color = random() > 0.35 ? 255 : 55;
    this.life = 1;
  }

  update() {
    this.pos.add(this.vel);
    this.vel.mult(0.92);
    let toCenter = p5.Vector.sub(createVector(width/2, height/2), this.pos).mult(0.003);
    this.pos.add(toCenter);
    this.angle += this.aVel;
    this.life -= 0.003;
  }

  display() {
    if (this.life <= 0) return;
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.angle);
    fill(this.color, 255 * this.life);
    noStroke();
    let s = this.size;
    if (this.type === 'triangle') {
      triangle(-s*0.5, s*0.4, s*0.5, s*0.4, 0, -s*0.6);
    } else if (this.type === 'blade') {
      beginShape();
      vertex(-s*0.18, -s*0.5);
      vertex(s*0.18, -s*0.5);
      vertex(s*0.08, s*0.5);
      vertex(-s*0.08, s*0.5);
      endShape(CLOSE);
    } else if (this.type === 'diamond') {
      quad(0, -s*0.5, s*0.45, 0, 0, s*0.5, -s*0.45, 0);
    } else {
      rectMode(CENTER); rect(0, 0, s, s);
    }
    pop();
  }
}
```

---

### 4.3 排版与信息几何

#### 4.3.1 文字卡片堆叠

**视觉描述**：矩形文字卡片沿垂直中轴堆叠，每张卡片有轻微旋转错位与长投影，整体可向上/下滚动。

**应用场景**：标签云、技能列表、时间线、导航菜单。

**工程参数表**

| 参数 | 典型值 | 说明 |
|------|--------|------|
| 卡片尺寸 | 120–180 px × 28–40 px | 横条为主 |
| 错位偏移 | x 轴 5–20 px，y 轴 8–14 px | 模拟 Z 轴层叠 |
| 旋转 | ±5°–12° | 绕 Z 轴 |
| 阴影 | 长投影，方向一致 | 硬边、低透明度 |
| 滚动速度 | 180–260 px/s | 向上或向下 |

**CSS 代码片段**

```css
.card-stack {
  perspective: 700px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  animation: stackScroll 2.4s ease-in-out infinite alternate;
}

.card-stack .chip {
  background: rgba(255,255,255,.12);
  border: 1px solid rgba(255,255,255,.35);
  padding: 10px 28px;
  font: 400 13px/1 sans-serif;
  box-shadow: 0 24px 0 rgba(255,255,255,.08);
}

.card-stack .chip:nth-child(1) { transform: rotate(-8deg); }
.card-stack .chip:nth-child(2) { transform: rotate(6deg) translate(18px, -54px); }
.card-stack .chip:nth-child(3) { transform: rotate(-2deg) translate(34px, -104px); }

@keyframes stackScroll {
  from { transform: perspective(700px) rotateX(25deg) translateY(120px); }
  to   { transform: perspective(700px) rotateX(25deg) translateY(-120px); }
}
```

#### 4.3.2 巨型文字作为容器

**视觉描述**：巨型文字（如 scripts、Disorderly、intertwine）占据画面中心，几何体在其前后穿梭，形成明确的 Z 轴层级。

**应用场景**：Hero 标题、品牌展示、艺术海报、MV 字幕。

**工程参数表**

| 参数 | 典型值 | 说明 |
|------|--------|------|
| 字号 | 14–28 vw | 撑满画面宽度 |
| 字重 | Regular/Medium/Bold | 根据情绪选择 |
| 颜色 | 浅灰 `#d0d0d0` alpha 0.85 | 不抢前景几何体 |
| 字母替换 | 胶囊替代 o | 增加几何趣味 |
| 前后景 | 文字 z-index 居中 | 几何体在其前后 |

**HTML/CSS 代码片段**

```html
<div class="stage">
  <div class="scripts">scripts</div>
  <div class="geo cube"></div>
  <div class="geo sphere"></div>
  <div class="geo ring"></div>
</div>
```

```css
.stage { position: relative; width: 100vw; height: 100vh; background: #000; }
.scripts {
  position: absolute; z-index: 5;
  left: 0; right: 0; top: 46vh;
  text-align: center;
  font: 600 27vw/1 'Inter', sans-serif;
  color: rgba(255,255,255,0.22);
  pointer-events: none;
}
.geo { position: absolute; z-index: 6; background: #fff; }
.geo.behind { z-index: 4; }
```

#### 4.3.3 文字列 / 传送带

**视觉描述**：文字标签以单列或横向阵列排列，像传送带一样持续滚动。

**应用场景**：新闻 ticker、标签流、跑马灯、数据流。

**工程参数表**

| 参数 | 典型值 | 说明 |
|------|--------|------|
| 条目数 | 5–10 个 | 可循环 |
| 滚动方向 | 垂直或水平 | 垂直更常见 |
| 滚动速度 | 180–260 px/s | 配合节奏 |
| 间距 | 8–14 px | 紧凑 |

**CSS 代码片段**

```css
.ticker {
  display: flex;
  gap: 16px;
  animation: tickerMove 8s linear infinite;
  white-space: nowrap;
}

@keyframes tickerMove {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
```

#### 4.3.4 混合字体系统

**视觉描述**：
- Display 无衬线粗体：Disorderly、scripts、CRUSHER
- 窄长高体：intertwine
- 小标签无衬线：Plane formation、consciousness
- 手写体：片尾 Reconstruct

**应用场景**：品牌视觉、海报、MV、网页排版。

**工程参数表**

| 字体类型 | 用途 | 推荐字体 |
|----------|------|----------|
| Display Bold | 大标题、关键词 | Inter Bold, Helvetica Neue Bold |
| Tall Condensed | 强调词、窄长标题 | Bebas Neue, Oswald |
| Body Sans | 标签、说明 | Inter, Helvetica Neue |
| Script | 片尾、装饰 | Dancing Script, Great Vibes |

**CSS 代码片段**

```css
:root {
  --font-display: 'Inter', sans-serif;
  --font-tall: 'Bebas Neue', sans-serif;
  --font-body: 'Inter', sans-serif;
  --font-hand: 'Dancing Script', cursive;
}
```

---

### 4.4 构图与布局系统

#### 4.4.1 中心放射构图

**视觉描述**：所有元素围绕画面中心分布，从中心向外放射生长。

**应用场景**：加载动画、聚焦、意识/冥想主题、节拍可视化。

**工程参数表**

| 参数 | 典型值 | 说明 |
|------|--------|------|
| 中心点 | (50%W, 50%H) | 可偏移 |
| 元素分布 | 径向对称 | 均匀或错落 |
| 缩放节奏 | 0→1.2 | 生长动画 |
| 旋转 | 整体缓慢旋转 | 内快外慢 |

#### 4.4.2 左右 / 上下分屏

**视觉描述**：画面被直线或对角线分割，两侧承载不同内容（如建筑摄影 vs 抽象图形）。

**应用场景**：对比展示、并置叙事、产品+抽象装饰。

**工程参数表**

| 参数 | 典型值 | 说明 |
|------|--------|------|
| 垂直分屏 | 53% / 47% | 建筑阶段 |
| 水平分屏 | 50% / 50% | 可根据需要 |
| 分割线 | 硬切直线或对角线 | 无渐变 |
| 两侧权重 | 一侧信息、一侧装饰 | 动态平衡 |

**CSS 代码片段**

```css
.split-stage {
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 100vw; height: 100vh;
}
.split-left { background: #000; }
.split-right { background: #fff; color: #000; }
```

#### 4.4.3 横向阵列 / 模块化重复

**视觉描述**：同一装置沿水平轴/Z 轴复制排列，形成流水线或数据流感。

**应用场景**：数据可视化、产品阵列、无限滚动背景。

**工程参数表**

| 参数 | 典型值 | 说明 |
|------|--------|------|
| 模块数量 | 3 组主簇 + 远景 | 可扩展 |
| 间距 | 按透视缩放 | 近大远小 |
| 平移速度 | 高速前冲 6000 px/s | 视觉冲击 |
| 连接弧线 | 模块间细曲线 | 强化关联 |

#### 4.4.4 进度点 / 指示器

**视觉描述**：标题下方 4 个圆点，部分实心、部分空心，指示当前步骤。

**应用场景**：步骤指示、轮播图、加载进度、节拍标记。

**工程参数表**

| 参数 | 典型值 | 说明 |
|------|--------|------|
| 点数 | 4 | 常见 |
| 大小 | 7–8 px | 小圆点 |
| 间距 | 18–30 px | 均匀 |
| 高亮 | 实心 vs 空心 | 当前步骤 |

**CSS 代码片段**

```css
.dots-line { display: flex; gap: 18px; }
.dots-line span {
  width: 8px; height: 8px;
  background: #000; border-radius: 50%;
}
.dots-line span.empty {
  background: transparent;
  border: 1px solid #000;
}
```

---

### 4.5 动态与转场语言

#### 4.5.1 反色 / 闪光切换

**视觉描述**：整个画面背景与前景颜色瞬间反转，形成强烈节拍冲击。

**应用场景**：重拍标记、段落切换、 glitch 效果。

**工程参数表**

| 参数 | 典型值 | 说明 |
|------|--------|------|
| 触发时机 | 重拍或段落切换 | 0.85 s、2.6 s 等 |
| 过渡时长 | 0.08–0.12 s | 极快 |
| 类型 | 全局 filter:invert(1) | 非图层局部反转 |
| 范围 | 整个画面 | 包括背景、图形、文字 |

**CSS 代码片段**

```css
.scene {
  transition: filter 0.1s steps(1);
}
.scene.inverted {
  filter: invert(1);
}

@keyframes flashInvert {
  0%   { filter: invert(0); }
  50%  { filter: invert(1) brightness(2); }
  100% { filter: invert(1); }
}
```

#### 4.5.2 擦除 / clip-path 转场

**视觉描述**：白光横扫、对角面板切出、垂直光柱撕开。

**应用场景**：段落切换、揭示内容、节奏冲击。

**工程参数表**

| 转场 | 方向 | 时长 | 缓动 |
|------|------|------|------|
| 白光横扫 | 左→右 | ~0.4 s | cubic-bezier(0.7, 0, 0.3, 1) |
| 对角面板 | 左上↔右下 | ~0.45 s | cubic-bezier(0.65, 0, 0.35, 1) |
| 垂直光柱 | 中心→两侧 | ~0.5 s | cubic-bezier(0.16, 1, 0.3, 1) |

**CSS 代码片段**

```css
/* 白光横扫 */
.sweep-wipe {
  position: absolute; inset: 0;
  background: #fff;
  transform: translateX(-110%);
  animation: sweepLR 0.4s cubic-bezier(0.7, 0, 0.3, 1) forwards;
}
@keyframes sweepLR {
  to { transform: translateX(110%); }
}

/* 对角面板 */
.panel-next {
  clip-path: polygon(0 0, 0 0, 0 100%, 0 100%);
  animation: diagonalReveal 0.45s cubic-bezier(0.65, 0, 0.35, 1) forwards;
}
@keyframes diagonalReveal {
  to { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); }
}

/* 垂直撕开 */
.vertical-tear {
  clip-path: inset(0 50% 0 50%);
  animation: tearOpen 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes tearOpen {
  to { clip-path: inset(0 0 0 0); }
}
```

#### 4.5.3 翻页 / 面板翻动

**视觉描述**：卡片堆叠轻微 3D 翻动，面板沿对角线滑出。

**应用场景**：卡片交互、页面切换、堆叠展示。

**工程参数表**

| 参数 | 典型值 | 说明 |
|------|--------|------|
| 翻动角度 | ±5°–15° | 轻微 |
| 旋转轴 | Y 轴或 Z 轴 | 卡片 Y，面板 Z |
| 阴影 | 长投影 | 硬边、方向一致 |

**CSS 代码片段**

```css
.card-stack { perspective: 1000px; transform-style: preserve-3d; }
.card {
  transform-origin: left center;
  box-shadow: 20px 20px 0 rgba(255,255,255,0.15);
  animation: cardFan 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
@keyframes cardFan {
  from { transform: rotateY(0deg) translateZ(0); opacity: 0; }
  to   { transform: rotateY(-12deg) translateZ(30px) translateX(20px); opacity: 1; }
}
```

#### 4.5.4 运动拖尾 / 残影

**视觉描述**：快速旋转或飞行的元素后方留下淡淡的残影。

**应用场景**：速度感、破碎感、动态背景。

**工程参数表**

| 参数 | 典型值 | 说明 |
|------|--------|------|
| 拖尾长度 | 8–20 帧 | 可调整 |
| 淡出速率 | 每帧 alpha 衰减 0.15–0.25 | 控制长短 |
| 实现方式 | 半透明背景覆盖 | Canvas 最自然 |

**p5.js 代码片段**

```javascript
function draw() {
  background(0, 40); // alpha 控制拖尾长度
  // 绘制当前元素
  drawMovingObjects();
}
```

#### 4.5.5 生长 / 绽放动画

**视觉描述**：曼荼罗、放射花、点阵从中心 scale 0 展开到目标大小。

**应用场景**：加载完成、聚焦、绽放效果、节拍冲击。

**工程参数表**

| 元素 | 起始缩放 | 目标缩放 | 时长 | 缓动 |
|------|----------|----------|------|------|
| 放射花 | 0 | 1 | ~0.5 s | cubic-bezier(0.34, 1.56, 0.64, 1) |
| 曼荼罗 | 0 | 1.2 | ~0.7 s | ease-out |
| 点阵 | 0 | 1 | ~0.4 s | stagger |

**CSS 代码片段**

```css
.flower {
  transform: scale(0) rotate(-45deg);
  animation: bloom 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
@keyframes bloom {
  to { transform: scale(1) rotate(0deg); }
}
```

---

### 4.6 质感与层次系统

#### 4.6.1 黑白层次系统

**视觉描述**：在纯黑/纯白背景上，通过透明度分层、线宽变化、错位阴影、运动拖尾、体积渐变五种技法制造层次。

**应用场景**：极简黑白设计、高对比背景、科技/数据可视化。

**技法表**

| 技法 | 实现方式 | 参数 |
|------|----------|------|
| 透明度分层 | 前景 100%，次级 30%–60%，背景网格 10%–20% | alpha 0.1–1.0 |
| 线宽变化 | 主体 2–4 px，辅助线 1 px | 线宽 1–4 px |
| 错位阴影 | 元素副本偏移 20–80 px | opacity 0.08–0.25 |
| 运动拖尾 | 多帧残影或半透明覆盖 | 8–20 帧 |
| 体积渐变 | 径向/线性渐变模拟 3D 光照 | 深→浅灰 |

**CSS 代码片段：长投影**

```css
.long-shadow {
  background: #fff;
  box-shadow:
    1px 1px 0 rgba(0,0,0,.20),
    2px 2px 0 rgba(0,0,0,.19),
    4px 4px 0 rgba(0,0,0,.17),
    8px 8px 0 rgba(0,0,0,.15),
    18px 18px 0 rgba(0,0,0,.11),
    40px 40px 0 rgba(0,0,0,.05);
}
```

#### 4.6.2 照片 / 纹理与矢量混合

**视觉描述**：建筑摄影与抽象矢量图形并置，照片处理为高对比黑白并叠加半调纹理。

**应用场景**：建筑/设计作品集、品牌视觉、艺术海报。

**工程参数表**

| 参数 | 典型值 | 说明 |
|------|--------|------|
| 照片处理 | grayscale(100%) contrast(1.2–1.4) | 去色、增强对比 |
| 混合模式 | luminosity | 只贡献明度 |
| 纹理叠加 | 点阵/半调 | 4–6 px 间距 |
| 分屏比例 | 53% / 47% | 建筑侧略宽 |

**CSS 代码片段**

```css
.photo-side {
  background: url('architecture.jpg') center/cover;
  filter: grayscale(100%) contrast(1.25) brightness(1.05);
  mix-blend-mode: luminosity;
}
.photo-side::after {
  content: '';
  position: absolute; inset: 0;
  background-image: radial-gradient(circle, #000 1px, transparent 1px);
  background-size: 4px 4px;
  opacity: 0.12;
  mix-blend-mode: multiply;
}
```

#### 4.6.3 暗角 / 晕影收尾

**视觉描述**：片尾背景纯黑，字幕居中，暗角极弱或不存在。

**应用场景**：片尾、聚焦、收束感。

**工程参数表**

| 参数 | 典型值 | 说明 |
|------|--------|------|
| 暗角强度 | 0–8% | 片中几乎无暗角 |
| 过渡范围 | 中心 45%→边缘 100% | 如需使用 |
| 颜色 | #000000 | 纯黑 |

**CSS 代码片段**

```css
.vignette {
  position: fixed; inset: 0; pointer-events: none;
  background: radial-gradient(
    circle at 50% 50%,
    rgba(0,0,0,0) 45%,
    rgba(0,0,0,0.45) 85%,
    rgba(0,0,0,0.70) 100%
  );
}
```

---

### 4.7 节奏与叙事结构

#### 4.7.1 节拍同步

**估算 BPM**：145–150，最佳估算 **146 BPM**，一拍 ≈ 0.41 秒。

**重拍映射**

| 时间 | 拍位 | 事件 |
|------|------|------|
| 0.00 s | Bar 1.1 | 循环起点 |
| 1.70 s | Bar 2.1 | Plane Formation 降临 |
| 3.25 s | Bar 3.1 | 镜像网格地面 |
| 5.00 s | Bar 4.1 | Architectural 分屏 |
| 6.50 s | Bar 5.1 | CRUSHER 炸裂 |
| 8.45 s | Bar 6.1 | Loop 重入 |

**音画同步代码思路**

```javascript
const BPM = 146;
const BEAT = 60 / BPM;
const LOOP = BEAT * 20;

const CUES = [
  { beat:  1, type: 'downbeat', scene: 'disorder' },
  { beat:  5, type: 'downbeat', scene: 'formation' },
  { beat:  9, type: 'downbeat', scene: 'consciousness' },
  { beat: 13, type: 'downbeat', scene: 'scripts' },
  { beat: 17, type: 'downbeat', scene: 'crusher' },
  { beat: 21, type: 'downbeat', scene: 'disorder' },
];

function schedule() {
  const now = audioCtx.currentTime;
  const loopPhase = now % LOOP;
  const currentBeat = loopPhase / BEAT;

  CUES.forEach(cue => {
    const cueTimeInLoop = (cue.beat - 1) * BEAT;
    const thisCueTime = now - loopPhase + cueTimeInLoop
                      + (loopPhase > cueTimeInLoop ? LOOP : 0);
    if (thisCueTime > now && thisCueTime < now + 0.1) {
      requestAnimationFrame(() => {
        document.body.dataset.scene = cue.scene;
        if (cue.type === 'downbeat') {
          document.body.classList.add('flash');
          setTimeout(() => document.body.classList.remove('flash'), 80);
        }
      });
    }
  });

  requestAnimationFrame(schedule);
}
```

#### 4.7.2 Loop 单元

**Loop 时长**：8.2 秒 = 20 拍 = 5 小节（4/4）

```
0.0s      1.64s     3.28s     4.92s     6.56s     8.2s
|  Bar 1  |  Bar 2  |  Bar 3  |  Bar 4  |  Bar 5  |
| Disorder|Formation|Conscious| Scripts | Crusher |
```

**重复策略**：第一遍完整展示 9 段弧线；第二遍精确复刻；片尾在 16.6 s 打破循环。

#### 4.7.3 解构—重构叙事弧线

| 阶段 | 时间 | 视觉表现 |
|------|------|----------|
| Disorder | 0.0–1.5 s | 自由落体、随机旋转、负片闪烁 |
| Formation | 1.5–2.0 s | 轴向对齐、透视收敛、秩序建立 |
| Overflow | 2.0–2.9 s | 径向扩张、图标 pop、信息过载 |
| Consciousness | 2.9–3.5 s | 轨道运动、镜像对称、自我映照 |
| Regularity | 3.5–4.0 s | 对称锁定、图案重复、节奏稳定 |
| Scripts | 4.0–4.85 s | 模块化排版、低动态悬浮 |
| Architecture | 4.85–5.7 s | 建筑结构 + 几何装饰 |
| Crusher | 5.7–6.5 s | 碎片飞散、棱角切割、强冲击 |
| Intertwine | 6.5–8.45 s | 连续循环、有机曲线、无限延伸 |

---

## 5. 与 algorithmic-art Skill 的协作方式

### 5.1 设计 → 生成

当用户先用本 Skill 获得几何设计方案后，输出应包含可直接喂给 `algorithmic-art` 的算法哲学提示词：

```text
算法哲学：Spherical Cartography / 球面制图学
核心参数：
- 色彩：严格黑白灰，背景 #000000，前景 #FFFFFF，中间层 rgba(255,255,255,0.12–0.85)
- 几何母题：8 瓣圆润花形星芒、12 瓣尖锐刀片星芒、同心圆环曼荼罗、3D torus（R=140, r=50）
- 透视系统：消失点 (50%W, 35%H)，网格间距 40–60 px，1/z 压缩
- 运动：差速旋转、Z 轴推进、双轴 tumbling、碎片径向爆发
- 节奏：146 BPM，8.2 秒 Loop，重拍触发反色/切换
- 质感：长投影、运动拖尾、体积渐变、半调纹理
```

### 5.2 生成 → 调优

当 `algorithmic-art` 生成初稿后，使用本 Skill 对以下维度进行工程化评估：

- [ ] 构图是否遵循中心放射 / 分屏 / 阵列三种主要布局？
- [ ] 黑白层次是否通过透明度、线宽、错位阴影、拖尾、渐变五种技法实现？
- [ ] 几何母题是否保持统一（星芒、圆环、torus、碎片）？
- [ ] 转场是否以硬切/反色/擦除为主，避免淡入淡出？
- [ ] 动画节奏是否与 146 BPM/8.2 秒 Loop 对齐？
- [ ] 文字层级是否清晰（巨型容器 / 小标签 / 手写片尾）？
- [ ] 性能是否适合作为网页背景（建议限制粒子数、降低帧率、预计算静态点）？

---

## 6. 可直接运行的综合 Demo

以下是一个最小可运行的 HTML 骨架，整合了本文档中的核心模式：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Reconstruct 几何模式 Demo</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"></script>
<style>
  body { margin: 0; overflow: hidden; background: #000; }
  #overlay {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    pointer-events: none;
  }
  .title {
    font: 400 12vw/1 'Bebas Neue', sans-serif;
    color: rgba(255,255,255,0.15);
    letter-spacing: 0.06em;
  }
</style>
</head>
<body>
<div id="overlay"><div class="title">intertwine</div></div>
<script>
let t = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont('Inter, Helvetica, Arial, sans-serif');
}

function draw() {
  background(0, 60); // 拖尾

  translate(width/2, height/2);

  // 曼荼罗线框
  stroke(255, 80);
  strokeWeight(1);
  noFill();
  for (let i = 0; i < 3; i++) {
    push();
    rotate(t * (0.01 + i * 0.005) * (i % 2 === 0 ? 1 : -1));
    let r = 120 + i * 100;
    let n = 6 * (i + 1);
    beginShape();
    for (let j = 0; j <= n; j++) {
      let a = j * TWO_PI / n;
      let rr = r * (1 + 0.12 * sin((i+2) * a));
      vertex(cos(a) * rr, sin(a) * rr);
    }
    endShape(CLOSE);
    pop();
  }

  // Torus 线框
  push();
  rotateX(0.5);
  rotateY(t * 0.008);
  rotateZ(t * 0.012);
  stroke(180, 120);
  noFill();
  let R = min(width, height) * 0.18;
  let r = R * 0.38;
  for (let u = 0; u < 48; u++) {
    beginShape();
    for (let v = 0; v <= 24; v++) {
      let U = u / 48 * TWO_PI;
      let V = v / 24 * TWO_PI;
      let x = (R + r * cos(V)) * cos(U);
      let y = (R + r * cos(V)) * sin(U);
      let z = r * sin(V);
      vertex(x, y, z);
    }
    endShape();
  }
  pop();

  t += 1;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
</script>
</body>
</html>
```

---

## 7. 设计 Token 速查表

| Token | 值 | 用途 |
|-------|-----|------|
| `--bg-black` | `#000000` | 主背景 |
| `--bg-white` | `#ffffff` | 反色背景 |
| `--bg-grid` | `#e6e6e6` | 平面网格背景 |
| `--fg-white` | `#ffffff` | 黑底上的图形/文字 |
| `--fg-black` | `#000000` | 白底上的图形/文字 |
| `--gray-mid` | `#808080` | 球体、次级元素 |
| `--gray-dark` | `#2a2a2a` | Torus、暗灰立方体 |
| `--line-thin` | `1px` | 网格、辅助线、线框 |
| `--line-medium` | `1.5–2px` | 缺片圆弧、轨道线 |
| `--grid-cell` | `32–48 px` | 平面方格 |
| `--perspective` | `700–900 px` | CSS 透视 |
| `--vanishing-y` | `34%–38%` | 透视消失点 |
| `--bpm` | `146` | 音乐速度 |
| `--loop` | `8.2 s` | 视觉 Loop |
| `--flash` | `0.08–0.12 s` | 反色切换 |
| `--ease-cut` | `cubic-bezier(0.2, 0, 0.2, 1)` | 硬切 |
| `--ease-bloom` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | 生长绽放 |

---

## 8. 关键结论

1. **色彩极简**：全程严格黑白灰，所有层次通过透明度、线宽、错位阴影、拖尾、渐变实现。
2. **网格是骨架**：透视网格、平面网格、放射网格、倾斜网格贯穿全片，是空间纵深的核心手段。
3. **几何母题复用**：星芒、圆环、曼荼罗、torus、碎片在 8.2 秒 Loop 中反复出现，通过颜色反转、缩放、旋转变化。
4. **文字作为图层**：巨型文字不仅是信息，更是空间容器和构图锚点。
5. **转场即节奏**：反色、硬切、擦除、碎片爆发均与音乐节拍强同步。
6. **叙事弧线清晰**：Disorder → Formation → Overflow → Consciousness → Regularity → Scripts → Architecture → Crusher → Intertwine → Loop。
7. **与 algorithmic-art 衔接**：本 Skill 输出设计参数与算法哲学提示词，algorithmic-art 负责生成艺术实现与性能优化。

---

*本文档为 Task 1 与 Task 2 的产出，Task 3（Skill 文件创建）将