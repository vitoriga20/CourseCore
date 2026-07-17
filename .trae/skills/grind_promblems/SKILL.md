---
name: "grind_promblems"
description: "Builds elegant black/white geometry-themed quiz HTML pages from uploaded question banks (PDF). Extracts text/images with Miner, accepts or generates answers with cross-validation, supports shuffle. Invoke when user uploads a PDF/JSON question bank and asks for a quiz/practice/drill page."
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
5. **主题偏好**：默认黑白几何炭黑主题，不生成浅色主题切换。
6. **是否打乱顺序**：默认支持。

🔴 CHECKPOINT：若用户已提供人工校对 JSON 或答案文件，再次确认「是否覆盖/更新已有答案与解析」，避免误删人工成果。

## 3. 处理流程

### 3.1 PDF 识别
- 安装/使用 `marker` 或 `MinerU`（优先 `marker` single file）提取 Markdown。
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
- 样式：几何构型、黑白优雅、炭黑主题。
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
| PDF 识别 | `marker`/`MinerU` 安装失败或提取乱码 | 换用 `pypdf` + 正则，或调参数/换工具 | 人工对照 PDF 重建题干，低置信度题目标 `[待核对]` |
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

- 主背景：`#111111`（炭黑）
- 强调色：`#e5e5e5` 文字 + `#333333` 边框
- 几何元素：
  - 卡片使用直角细边框（`border: 1px solid`）
  - 题号按钮使用等宽字体、正方形
  - 背景叠加 faint dot grid（CSS `radial-gradient`）
- 不生成主题切换按钮，保持单一炭黑主题
- 公式：MathJax 3 CHTML

## 6. 输出与交付

- 输出 HTML 文件路径
- 输出 JSON 文件（可选，便于复用）
- 更新 development-log.md
- 说明已知限制（图片、公式、答案置信度）

## 7. 反例与黑名单

执行本 skill 时禁止出现以下行为：

| # | 反模式 | 后果 | 正确做法 |
|---|--------|------|----------|
| 1 | 用户已提供人工校对 JSON 时直接覆盖 `answer`/`solution` | 丢失人工校对成果 | 优先更新题干/选项/配图字段，保留已有 `answer`/`solution` |
| 2 | 智能体生成答案后不标注置信度 | 低质量答案混入标准答案 | 记录每题置信度，低置信度题目标 `[待核对]` |
| 3 | 发现 LaTeX 显示异常时直接改 HTML | 下次重新生成又被覆盖 | 回到源 JSON 修复，再重新生成 HTML |
| 4 | PDF 提取失败就终止流程 | 无法交付 | 无法安装 `marker`/`MinerU` 时回退到 `pypdf` + 正则 |
| 5 | 未确认源文件路径/题目类型/答案来源就开始处理 | 输出与用户预期不符 | 按第 2 章清单逐项确认后再执行 |
| 6 | 默认生成浅色主题或主题切换按钮 | 与用户要求的单一炭黑风格冲突 | 默认仅炭黑主题，不生成浅色切换 |
| 7 | 答案归一化时保留 `$`、空白、全角标点差异 | 正确答案被判错 | 严格使用第 4 章 `normalizeAnswer()` |
| 8 | 未向用户说明图片/公式/答案置信度限制 | 用户误判产物完整性 | 交付时显式列出已知限制 |

## 8. 示例调用

用户说："上传这份 PDF，生成填空题刷题页"
执行：
1. 读取 PDF
2. 提取题目
3. 生成/验证答案
4. 生成 `index（填空题）.html`
5. 打开预览或报告完成
