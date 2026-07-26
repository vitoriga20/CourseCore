---
name: "grind_promblems"
description: "Builds elegant gray-white geometry-themed quiz HTML pages from uploaded question banks (PDF). Extracts text/images with Miner, accepts or generates answers with cross-validation, supports shuffle. Invoke when user uploads a PDF/JSON question bank and asks for a quiz/practice/drill page."
---

# Grind Problems 刷题生成器

## 1. 触发条件

用户上传题库文件（PDF 优先，或已整理好的 JSON/TXT）并要求：
- 做成刷题网页 / 刷题工具
- 生成 HTML 页面
- 自动识别题目、生成答案
- 需要随机打乱 / 几何黑白风格

## 2. 输入确认

🛑 STOP · 🔴 CHECKPOINT：开始任何处理前，必须逐项确认以下 6 项。用户未明确回复前不得继续。

1. **源文件路径**：PDF 或其他文件路径。
2. **题目类型**：单选 / 填空 / 解答 / 混合。
3. **答案来源**（关键决策）：
   - 用户已提供答案（随 PDF 或单独文件）
   - 需要智能体生成答案（需交叉验证）
4. **输出文件名/路径**：默认 `index（<类型>）.html` 在工作目录。
5. **主题偏好**：默认 Apple 风格墨绿灰白几何球背景（面向赤道的大半径局部球面投影、墨绿经纬线 + 十字星星、极低动画速度），使用 p5.js 2D 渲染实现，不生成浅色主题切换。
6. **是否打乱顺序**：默认支持。

🔴 CHECKPOINT：若用户已提供人工校对 JSON 或答案文件，再次确认「是否覆盖/更新已有答案与解析」，避免误删人工成果。

## 3. 处理流程

### 3.1 PDF 识别
- 安装/使用 `MinerU` 提取 Markdown。
- 若已有包含人工修正的源 JSON（如 `comprehensive_mixed.json`），优先更新该 JSON 的题干/选项/配图字段，再重新生成 HTML，避免覆盖已有答案与解析。
- 将图片单独保存到 `assets/` 目录（相对输出 HTML）。
- 公式统一转换为 LaTeX（`$...$` 行内，`$$...$$` 行间）。

### 3.2 题目结构化
- 解析为 JSON 数组，字段：
  - `question`：题干（LaTeX）
  - `options`：可选项（单选）
  - `answer`：标准答案
  - `solution`：简要推导/思路
  - `category`：科目/章节
  - `type`：`multipleChoice` | `fillInTheBlank` | `problemSolving`
  - `image`：配图相对路径（可选）

### 3.3 答案处理
- 若用户未提供答案：
  1. 用多模型/多平台交叉求解（至少 2 种独立来源）。
  2. 对物理/数学题使用符号计算（sympy）+ 数值代入验证。
  3. 记录置信度，低置信度题目标 `[待核对]`。
- 若用户已提供答案：直接采用，但仍做格式归一化。

### 3.4 HTML 生成
- 生成单文件 HTML，内嵌题库 JSON。
- 样式：Apple 风格墨绿灰白几何构型，背景使用 p5.js 2D 透视投影几何球（大半径局部球面视野、面向赤道、墨绿经纬线 + 十字星星），保持优雅克制；p5.js 仅通过 CDN 引入，不依赖 esm.sh。
- 功能：
  - 顺序/随机切换
  - 上一题/下一题
  - 底部题号导航
  - 提交判题（归一化比较）
  - 完成练习结果页
  - 重新开始

### 3.5 LaTeX 质量检查
- 生成 HTML 后，对 `$...$` 段做全量扫描，检查花括号是否闭合。
- 发现公式显示异常时，优先回到源 JSON 修复，再重新生成 HTML，避免直接改 HTML 后下次生成被覆盖。
- 保留 `check_latex.py`、`scan_latex.py`、`fix_xxx_latex.py` 等脚本作为后续维护工具。

### 3.6 失败处理总表

| 阶段 | 触发条件 | 一线修复 | 仍失败兜底 |
|------|----------|----------|------------|
| PDF 识别 | `MinerU` 安装失败或提取乱码 | 换用 `pypdf` + 正则，或调参数/换工具 | 人工对照 PDF 重建题干，低置信度题目标 `[待核对]` |
| PDF 识别 | 源 JSON 已存在且含人工答案 | 只更新题干/选项/配图字段 | 用户明确回复「覆盖」前禁止动 `answer`/`solution` |
| 答案处理 | 多模型答案不一致或 `sympy` 超时 | 引入第 3 种来源仲裁，或数值代入特例 | 标记 `[待核对]`，交付时告知用户 |
| 答案处理 | 用户答案格式不统一 | 用第 4 章 `normalizeAnswer()` 归一化 | 多空/多问用 `;` 分隔后仍异常则向用户确认 |
| LaTeX 检查 | `$...$` 花括号不闭合 | 回到源 JSON 补全括号 | 公式含复杂嵌套时先转 `$$...$$` 并人工复核 |
| LaTeX 检查 | MathJax 渲染报错 | 检查并移除非法命令或转义 | 仍报错则截图或复制报错信息交付时说明 |
| LaTeX 检查 | 图片路径失效 | 确认 `assets/` 与 HTML 相对位置 | 无法修复则删除 `image` 字段或提示用户原卷查看 |

## 4. 答案归一化

```javascript
function normalizeAnswer(str) {
  if (!str) return '';
  return str.toString()
    .replace(/\$/g, '')
    .replace(/\\mathrm\{([^}]*)\}/g, '$1')
    .replace(/\\,/g, '')
    .replace(/\\;/g, '')
    .replace(/[\u3000\s]+/g, '')
    .replace(/；/g, ';')
    .replace(/，/g, ',')
    .replace(/（/g, '(')
    .replace(/）/g, ')')
    .toLowerCase();
}
```

多空/多问答案统一用 `;` 分隔。

## 5. 样式规范

- 主背景：灰白渐变 `#f3f6f4` → `#e1e8e4`（geo 模式下 body 透明，由 p5.js 几何球 canvas 提供）
- 文字：`#2d4e3e`（墨绿）
- 强调色：`#2d4e3e` 按钮/强调 + `rgba(45,78,62,0.18)` 边框
- 几何元素：
  - 卡片使用圆角（`border-radius: 24px`）、细边框、半透明毛玻璃（`backdrop-filter: blur(20px)`）
  - 题号按钮使用等宽字体、圆角正方形
  - 背景使用 p5.js 2D 透视投影：大半径球面局部视野（radius ≈ 1200，focal length ≈ 1500），默认面向赤道（`viewOffsetX = Math.PI / 2`）；经纬线 `#2d4e3e`（透明度 0.42）、十字星星 `#2d4e3e`（透明度 0.45）；禁用粒子轨迹以降低开销
- 状态色：正确 `#2d4e3e` / 错误 `#8b3a3a`，保持低饱和
- 不生成主题切换按钮，保持单一墨绿灰白几何主题；保留「背景：几何/素白」切换作为 3D 背景降级
- 公式：MathJax 3 CHTML
- 动画：背景球体缓慢自转，监听 `prefers-reduced-motion` 减少动画

### 5.1 背景实现规范

背景脚本必须满足以下要求，以保证性能、可维护性和统一视觉：

**依赖**
- 仅通过 `<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js"></script>` 引入 p5.js，不使用模块导入或外部构建工具。

**结构**
- 在 `<body>` 开头放置固定层 `<div id="bg-canvas"></div>`，CSS 使其 `position: fixed; inset: 0; z-index: 0;`。
- 背景脚本使用 IIFE 封装，但在 IIFE 末尾将 `setup` / `draw` 暴露到 `window.setup` / `window.draw`，确保 p5.js 自动实例化可找到入口。

**颜色同步**
- 从 CSS 变量读取当前主题色，不使用硬编码 RGB：
  - `--text-color` → 经纬线、十字星星
  - `--bg-color` → p5.js 背景色
  - `--muted-color` → 若保留粒子轨迹则使用

**默认参数**
```javascript
const params = {
  seed: 12345,
  sphereRadius: 1200,
  gridDensity: 6,
  noiseAmp: 12,
  rotationSpeed: 0.00015,
  viewOffsetX: Math.PI / 2,
  starCount: 16,
  lineWeight: 0.8,
  particleCount: 0,
  trailLength: 10
};
```

**性能优化（必须）**
- `pixelDensity(1)`：禁用高 DPI 缩放。
- `frameRate(15)`：限制刷新率为 15fps。
- 预计算球面网格点，每帧只做旋转 + 透视投影。
- 粒子数量设为 0，不绘制粒子轨迹。
- 使用 `MutationObserver` 监听 `data-bg` 属性，切换到 plain 模式时停止绘制。

**视角**
- 默认面向赤道：X 轴初始旋转 `viewOffsetX = Math.PI / 2`，避免经线汇聚在画面中心。

**降级**
- 保留 `body[data-bg="plain"]` 样式隐藏 `#bg-canvas`；保留 `#bg-btn` 按钮在几何与素白之间切换。

### 3.7 清理中间文件

HTML 生成完成后，必须按以下规则清理中间过程文件，不留下任何提取/解析产物：

- **PDF 提取的文件**：删除 `marker` 或 `MinerU` 输出的 `_raw.txt`、`_md.md`、`*_images/` 等中间产物。
- **独立中间 JSON**：若使用独立的中间 JSON 文件（如 `questions.json`），删除；除非用户指定保留。
- **临时脚本**：删除所有临时创建的 Python 脚本（如 `extract_*.py`、`fix_*.py`、`validate_*.py`），除非该脚本是项目长期维护工具（如已存在于工作区的 `check_latex.py`、`scan_latex.py`）。
- **assets 目录**：若无配图或配图已嵌入 HTML，删除 `assets/` 目录。
- **保留的文件**：最终交付的 HTML、用户提供的源 PDF/JSON、用户的答案 JSON（如 `comprehensive_mixed.json`）、构建脚本（如 `build_mixed_html.py`）、项目文档（`.trae/`）。

**删除原则**：
- 用 `DeleteFile` 或 `RunCommand rm/Remove-Item`，不要留注释说"应该删掉"。
- 先列清单，批量删除，避免遗漏。
- 如果有多个同类型中间文件（如 `extract_*.py`、`fix_*.py`），用通配符匹配删除。

## 6. 输出与交付

- 输出 HTML 文件路径
- 输出 JSON 文件（可选，便于复用）
- 更新 development-log.md
- 说明已知限制（图片、公式、答案置信度）
- **执行清理**：按 3.7 节删除中间过程文件，不留下临时产物

## 7. 反例与黑名单

执行本 skill 时禁止出现以下行为：

| # | 反模式 | 后果 | 正确做法 |
|---|--------|------|----------|
| 1 | 用户已提供人工校对 JSON 时直接覆盖 `answer`/`solution` | 丢失人工校对成果 | 优先更新题干/选项/配图字段，保留已有 `answer`/`solution` |
| 2 | 智能体生成答案后不标注置信度 | 低质量答案混入标准答案 | 记录每题置信度，低置信度题目标 `[待核对]` |
| 3 | 发现 LaTeX 显示异常时直接改 HTML | 下次重新生成又被覆盖 | 回到源 JSON 修复，再重新生成 HTML |
| 4 | PDF 提取失败就终止流程 | 无法交付 | 无法安装 `marker`/`MinerU` 时回退到 `pypdf` + 正则 |
| 5 | 未确认源文件路径/题目类型/答案来源就开始处理 | 输出与用户预期不符 | 按第 2 章清单逐项确认后再执行 |
| 6 | 默认生成浅色主题或主题切换按钮 | 与用户要求的 Apple 风格墨绿灰白几何背景冲突 | 默认仅墨绿灰白 p5.js 几何球主题，不生成浅色切换；保留「背景：几何/素白」作为背景降级 |
| 7 | 答案归一化时保留 `$`、空白、全角标点差异 | 正确答案被判错 | 严格使用第 4 章 `normalizeAnswer()` |
| 8 | 未向用户说明图片/公式/答案置信度限制 | 用户误判产物完整性 | 交付时显式列出已知限制 |
| 9 | 生成完成后不清理中间文件 | 工作区被临时脚本/提取物污染 | 按 3.7 节删除所有中间过程文件，只保留最终产物 |

## 8. 示例调用

用户说："上传这份 PDF，生成填空题刷题页"
执行：
1. 读取 PDF
2. 提取题目
3. 生成/验证答案
4. 生成 `index（填空题）.html`
5. 按 3.7 节清理中间文件（删除提取产物、临时脚本等）
6. 打开预览或报告完成
