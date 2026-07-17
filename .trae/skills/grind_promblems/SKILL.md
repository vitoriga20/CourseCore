---
name: "grind_promblems"
description: "Builds elegant black/white geometry-themed quiz HTML pages from uploaded question banks (PDF). Extracts text/images with Miner, accepts or generates answers with cross-validation, supports dual themes and shuffle. Invoke when user uploads a PDF/JSON question bank and asks for a quiz/practice/drill page."
---

# Grind Problems 刷题生成器

## 1. 触发条件

用户上传题库文件（PDF 优先，或已整理好的 JSON/TXT）并要求：
- 做成刷题网页 / 刷题工具
- 生成 HTML 页面
- 自动识别题目、生成答案
- 需要随机打乱 / 双主题 / 几何黑白风格

## 2. 输入确认

必须向用户确认：
1. **源文件路径**：PDF 或其他文件路径。
2. **题目类型**：单选 / 填空 / 解答 / 混合。
3. **答案来源**：
   - 用户已提供答案（随 PDF 或单独文件）
   - 需要智能体生成答案（需交叉验证）
4. **输出文件名/路径**：默认 `index（<类型>）.html` 在工作目录。
5. **主题偏好**：默认黑白几何 + 双主题（炭黑 / 宣纸）。
6. **是否打乱顺序**：默认支持。

## 3. 处理流程

### 3.1 PDF 识别
- 安装/使用 `marker` 或 `MinerU`（优先 `marker` single file）提取 Markdown。
- 如果无法安装，回退到 `pypdf` + 正则 + 人工推断。
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
  2. 对物理/数学题建议：符号计算（sympy）+ 数值代入验证。
  3. 记录置信度，低置信度题目标 `[待核对]`。
- 若用户已提供答案：直接采用，但仍做格式归一化。

### 3.4 HTML 生成
- 生成单文件 HTML，内嵌题库 JSON。
- 样式：几何构型、黑白优雅、双主题切换。
- 功能：
  - 顺序/随机切换
  - 上一题/下一题
  - 底部题号导航
  - 提交判题（归一化比较）
  - 完成练习结果页
  - 重新开始

### 3.5 LaTeX 质量检查（可选但建议）
- 生成 HTML 后，对 `$...$` 段做全量扫描，检查花括号是否闭合。
- 发现公式显示异常时，优先回到源 JSON 修复，再重新生成 HTML，避免直接改 HTML 后下次生成被覆盖。
- 可保留 `check_latex.py`、`scan_latex.py`、`fix_xxx_latex.py` 等脚本作为后续维护工具。

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

- 主背景：
  - 浅色主题 `#f8f8f6`（宣纸白）
  - 深色主题 `#111111`（炭黑）
- 强调色：
  - 浅色 `#2a2a2a` 文字 + `#d4d4d4` 边框
  - 深色 `#e5e5e5` 文字 + `#333333` 边框
- 几何元素：
  - 卡片使用直角细边框（`border: 1px solid`）
  - 题号按钮使用等宽字体、正方形
  - 背景可叠加 faint dot grid（CSS `radial-gradient`）
- 主题切换按钮固定右上角
- 公式：MathJax 3 CHTML

## 6. 输出与交付

- 输出 HTML 文件路径
- 输出 JSON 文件（可选，便于复用）
- 更新 development-log.md
- 说明已知限制（图片、公式、答案置信度）

## 7. 示例调用

用户说："上传这份 PDF，生成填空题刷题页"
执行：
1. 读取 PDF
2. 提取题目
3. 生成/验证答案
4. 生成 `index（填空题）.html`
5. 打开预览或报告完成
