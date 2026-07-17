# 开发日志 - 物理填空/解答刷题网页

## 项目概览

| 项目 | 内容 |
|------|------|
| 当前状态 | 已生成填空/解答/综合混合三类刷题页，并通过 Playwright 验证；已用 darwin-skill 优化 grind_promblems Skill |
| 技术栈 | 静态 HTML + Tailwind CSS CDN + MathJax 3 (CHTML)；综合混合页使用 CSS 变量双主题 |
| 数据来源 | `力学练习一~七.pdf`、`力学综合测试.pdf`、`波动光学练习一~六.pdf`、`波动光学综合测试.pdf` |
| 输出页面 | `index（填空题）.html`（60 题）、`index（解答题）.html`（46 题）、`index（综合混合）.html`（76 题） |

## 文件结构

```
c:\Users\vitoriga\Downloads\物理试题\
├── .trae\documents\
│   ├── 物理填空解答刷题网页开发计划.md
│   ├── development-log.md              # 本文件
│   ├── technical-architecture.md       # 技术架构说明
│   └── prd.md                          # 产品需求文档
├── .trae\skills\grind_promblems\
│   ├── SKILL.md                        # 通用刷题生成器 Skill 定义
│   ├── test-prompts.json               # darwin-skill 测试 prompts
│   └── results.tsv                     # darwin-skill 优化记录
├── index（顺序） (3).html               # 现有单选刷题页（未改动）
├── index（填空题）.html                 # 填空题刷题页（力学 33 + 波动光学 27）
├── index（解答题）.html                 # 解答题刷题页（力学 25 + 波动光学 21）
├── index（综合混合）.html               # 综合混合刷题页（76 题，黑白几何双主题）
├── build_html_pages.py                 # 生成填空/解答 HTML 的脚本
├── build_mixed_html.py                 # 生成综合混合 HTML 的脚本
├── build_comprehensive_mixed.py        # 合并力学/光学综合测试题为混合 JSON
├── parse_mineru_to_json.py             # 解析 MinerU Markdown 为结构化题库
├── merge_mineru_images.py              # 将 MinerU 提取的图片合并到现有题库
├── count_mineru.py                     # 统计 MinerU Markdown 各题型题数
├── extract_mc_from_html.py             # 从现有单选页提取选择题 JSON
├── assets/                             # 题目配图（q001.jpg ~ q076.jpg）
├── build_mechanics_calc_json.py        # 生成力学解答题 JSON 的脚本
├── extract_mechanics_text.py           # 提取力学 PDF 文本的脚本
├── fix_mechanics_calc_latex.py         # 修复力学解答题 JSON 中冗余反斜杠的脚本
├── render_calc_pages.py                # 早期试验性渲染脚本（已停用）
├── 力学练习一~七.pdf
├── 力学综合测试.pdf
├── 波动光学练习一~六.pdf
└── 波动光学综合测试.pdf

c:\Users\vitoriga\AppData\Local\Temp\physics_questions\
├── mechanics_fillin.json               # 力学填空题（33 道）
├── optics_fillin.json                  # 波动光学填空题（27 道）
├── mechanics_calc.json                 # 力学解答题（25 道）
├── optics_calc.json                    # 波动光学解答题（21 道）
├── mc_all.json                         # 从现有单选页提取的全部选择题
└── comprehensive_mixed.json            # 综合测试混合题库（76 道）
```

## 开发阶段记录

### 阶段 1: 提取波动光学填空题 JSON

**日期**: 2026-07-13

**操作**:
- 读取 `physics_pdf_text\波动光学练习一~六_raw.txt` 和 `波动光学综合测试_raw.txt`。
- 定位每份试卷的"二、填空题"部分，拆分出独立填空题条目。
- 将 PDF 提取乱码中的数学符号用 LaTeX 重新排版。
- 为每道题推导/给出标准答案；多空答案用分号 `;` 分隔。
- 输出 JSON 到 `c:\Users\vitoriga\AppData\Local\Temp\physics_questions\optics_fillin.json`。

**关键决策**:
- 题号不保留原试卷编号，重新从 1 开始连续编号，便于刷题页面统一导航。
- 公式统一使用 MathJax 可渲染的 LaTeX，物理量带单位时使用 `$\,\mathrm{单位}$`。

**产出文件**:
- `optics_fillin.json` - 波动光学填空题数据（27 道）。

### 阶段 2: 提取力学填空题 JSON

**日期**: 2026-07-13

**操作**:
- 读取 `力学练习一~七.pdf` 与 `力学综合测试.pdf` 的原始提取文本。
- 定位填空题段落，逐题重建题干与答案。
- 处理运动学、牛顿力学、刚体转动、角动量等公式。
- 输出 `mechanics_fillin.json`。

**关键决策**:
- 对题干中出现的"如图所示"保留文字描述，不再额外配图。
- 答案格式与波动光学保持一致：多空用 `;` 分隔。

**产出文件**:
- `mechanics_fillin.json` - 力学填空题数据（33 道）。

### 阶段 3: 提取波动光学与力学解答题 JSON

**日期**: 2026-07-13

**操作**:
- 从两类 PDF 的"三、计算题"段落提取解答题。
- 为每道题编写标准答案与简要 `solution` 提示。
- 处理多问问号、多答案用 `;` 分隔。
- 输出 `optics_calc.json`（21 道）与 `mechanics_calc.json`（25 道）。

**关键决策**:
- 由于解答题答案较长，页面中仅要求用户输入最终答案，提交后显示完整答案与思路提示。
- 为减少用户输入负担，答案比较时做归一化：去除 `$`、空格、单位命令、全角标点、大小写差异。

**产出文件**:
- `optics_calc.json`
- `mechanics_calc.json`

### 阶段 4: 修复力学解答题 LaTeX 反斜杠冗余

**日期**: 2026-07-13

**操作**:
- 发现 `mechanics_calc.json` 中部分 LaTeX 命令出现双重反斜杠（如 `\\frac`）。
- 编写 `fix_mechanics_calc_latex.py`，递归地将 `\\` 折叠为 `\`，直到每个命令只剩一个反斜杠。
- 重新写入 JSON。

**关键决策**:
- 采用"反复折叠"策略，可处理多层冗余转义。
- 修复后再由 `build_html_pages.py` 统一生成页面，避免 HTML 中公式渲染失败。

**产出文件**:
- `fix_mechanics_calc_latex.py`
- 修复后的 `mechanics_calc.json`

### 阶段 5: 生成两个刷题 HTML 页面

**日期**: 2026-07-13

**操作**:
- 编写 `build_html_pages.py`，将四类 JSON 合并为两个页面内嵌数组。
- 填空题页使用单行输入框；解答题页使用多行文本框，提示多问用分号分隔。
- 复用 `index（顺序） (3).html` 的底部导航、上一题/下一题、完成练习、重新开始逻辑。
- 生成 `index（填空题）.html` 与 `index（解答题）.html`。

**关键决策**:
- 数据硬编码在页面脚本中，与现有单选页架构一致，无需后端。
- 科目顺序：力学在前，波动光学在后。

**产出文件**:
- `index（填空题）.html`（60 题）
- `index（解答题）.html`（46 题）
- `build_html_pages.py`

### 阶段 6: 修复 HTML 模板双大括号语法错误

**日期**: 2026-07-13

**操作**:
- 使用 Playwright 验证时发现页面 JS 报 `Unexpected token '{'`，原因为 `build_html_pages.py` 模板中所有 JS 对象字面量被写成 `{{ ... }}`。
- 将模板中的 `{{` 全部替换为 `{`、`}}` 全部替换为 `}`，重新生成页面。
- 再次验证 MathJax 正常渲染、答题反馈与导航功能正常。

**关键决策**:
- 优先修复模板源文件，确保后续重新生成不会再次出错。
- 验证流程前置，避免把有语法错误的页面交付。

**产出文件**:
- 修复后的 `build_html_pages.py`
- 重新生成的 `index（填空题）.html`、`index（解答题）.html`

### 阶段 7: 创建通用刷题生成器 Skill grind_promblems

**日期**: 2026-07-16

**操作**:
- 在 `.trae/skills/grind_promblems/` 下创建 `SKILL.md`。
- 定义 Skill 触发条件、输入确认、PDF 识别流程、题目结构化、答案生成与交叉验证、HTML 生成、样式规范。
- 第一版聚焦：PDF → 结构化 JSON → 黑白几何双主题单文件 HTML 刷题页；随机打乱；答案归一化判题。

**关键决策**:
- Skill 不自持运行时，而是指导智能体完成完整链路（识别/建库/生成/验证/出 HTML）。
- 样式要求几何构型、黑白优雅、双主题色，与现有彩色页面区分。
- 答案来源：优先使用用户上传答案，缺失时多源交叉验证生成，低置信度题目标记待核对。

**产出文件**:
- `.trae/skills/grind_promblems/SKILL.md`

### 阶段 8: 生成综合混合刷题 HTML

**日期**: 2026-07-16

**操作**:
- 从 `index（顺序） (3).html` 提取 78 道选择题，分离出力学综合 17 道、波动光学综合 14 道。
- 重新结构化力学综合填空 15 道、解答 11 道，波动光学综合填空 10 道、解答 9 道；答案基于标准物理公式推导并交叉核对。
- 合并为 `comprehensive_mixed.json`（76 题），顺序为力学（选择→填空→解答）后波动光学（选择→填空→解答）。
- 生成 `index（综合混合）.html`：单文件、内嵌 JSON、黑白几何双主题（宣纸白 / 炭黑）、顺序/随机切换、底部题号导航、三种题型统一判题、结果页。
- 使用 Playwright 验证：浅色/深色主题渲染、选择题/填空题/解答题显示、答题反馈、随机切换、完成结果页均正常。

**关键决策**:
- 综合测试题库采用“全部混合”分类，按科目分组后再按题型分组，兼顾复习连贯性与题型切换。
- 样式完全脱离 Tailwind 默认彩色，使用 CSS 变量实现双主题，几何直角边框 + 等宽题号 + 网点底纹。
- 答案归一化仅去除 LaTeX 命令与全角符号，保留单位；若用户省略单位则判为错误，以强化规范作答。

**产出文件**:
- `extract_mc_from_html.py` - 从现有 HTML 提取选择题 JSON。
- `build_comprehensive_mixed.py` - 合并综合测试题库 JSON。
- `build_mixed_html.py` - 生成黑白几何双主题 HTML。
- `index（综合混合）.html` - 最终刷题页面（76 题）。
- `c:\Users\vitoriga\AppData\Local\Temp\physics_questions\comprehensive_mixed.json` - 混合题库数据。

### 阶段 9: 优化综合混合页 UI 与交互

**日期**: 2026-07-16

**操作**:
- 全面重构 `index（综合混合）.html` 的样式与布局：
  - 右侧固定题号导航面板，5 列矩形网格，正确/错误/当前题号用颜色区分。
  - 主卡片使用更克制的黑白配色、更优雅的字体层级（标题宋体、题面宋体、题号等宽）。
  - 顶部新增进度条；增加“字体：宋体/黑体”与“背景：网点/方格/斜线/纯色”切换。
  - 移动端保留底部横向题号栏，桌面端自动隐藏。
- 调整顺序/随机模式：默认顺序；点击“切换随机”后生成一次不重复的乱序列表，下一题按乱序推进；切换回顺序则重置为原题号顺序。
- 增加题目图片支持：JSON 中若含 `image` 字段，题干下方自动渲染配图（为后续 MinerU 提取图片做准备）。
- 重新生成页面并通过 Playwright 验证：顺序/随机切换、主题切换、字体与背景切换、题号跳转、答题反馈均正常。

**关键决策**:
- 随机模式用“全局乱序数组”实现，保证 76 题均出现且不重复，符合刷题习惯。
- 图片字段提前预留，但本次 PDF 未做 MinerU 提取，故当前题库 `image` 为空；后续替换 JSON 即可自动显示。
- 字体/背景状态写入 `localStorage`，刷新后保持用户偏好。

**后续调整**: 按用户要求只保留深色主题，移除浅色变量、主题切换按钮及相关 JS，`data-theme` 不再使用，默认即为炭黑风格。

**产出文件**:
- `build_mixed_html.py`（更新）
- `index（综合混合）.html`（更新）

### 阶段 10: 使用 MinerU 提取综合测试 PDF 配图并更新综合混合题库

**日期**: 2026-07-17

**操作**:
- 使用 MinerU 提取 `力学综合测试.pdf` 与 `波动光学综合测试.pdf` 的 Markdown 与图片。
- 编写 `parse_mineru_to_json.py` 解析 Markdown：按题型分节、识别题号、清洗 LaTeX 与 OCR 空格、拆分选择题选项、提取图片路径。
- 编写 `merge_mineru_images.py` 将 MinerU 提取的图片按题号映射到现有 `comprehensive_mixed.json`，生成 `assets/q{ id }.jpg`。
- 运行 `build_mixed_html.py` 重新生成 `index（综合混合）.html`，题库仍为 76 题，其中 35 题成功嵌入原卷配图。

**关键决策**:
- 现有 `comprehensive_mixed.json` 的题干、选项、答案、解析已经过人工校对，质量优于 MinerU OCR 文本；因此仅使用 MinerU 提取的图片，保留原有文本内容，避免引入 OCR 错字与公式错乱。
- 图片命名与题目全局 `id` 绑定，HTML 中通过 `question.image` 动态渲染，保证随机/顺序模式下配图始终跟随对应题目。
- 解析脚本支持“节内原题号”映射，能处理同一科目下不同题型题号不连续的情况（如力学填空题从 18 开始）。

**产出文件**:
- `parse_mineru_to_json.py` - MinerU Markdown → 结构化题库的解析脚本。
- `merge_mineru_images.py` - 仅合并 MinerU 图片到现有题库。
- `assets/q001.jpg` ~ `assets/q076.jpg`（实际生成 35 张）- 题目配图。
- `index（综合混合）.html`（更新）- 内嵌带图片字段的 76 题 JSON。

### 阶段 11: 综合混合题库改用 MinerU 提取的题干/选项文本

**日期**: 2026-07-17

**操作**:
- 按用户要求，调用 `grind_promblems` Skill 并遵循其 PDF → JSON → HTML 流程。
- 重新运行 `parse_mineru_to_json.py`，将 `comprehensive_mixed.json` 中的 `question` 与 `options` 替换为 MinerU 从 Markdown 提取的版本，保留原有人工校对答案、解析、分类与全局 `id`。
- 重新运行 `build_mixed_html.py` 生成 `index（综合混合）.html`。
- 使用 Playwright 验证：首页、第 2 题、第 3 题、第 6 题（含配图）渲染正常。

**关键决策**:
- 仅替换题干与选项，不替换答案与解析：综合测试 PDF 本身不含答案，MinerU 无法自动生成，必须保留原有人工推导结果。
- 图片字段仍通过 MinerU 提取并按全局 `id` 映射，与阶段 10 保持一致。
- 发现 MinerU OCR 对部分选择题选项的 LaTeX 花括号识别不完整（如 id 2 的 B/C/D 选项），导致 MathJax 渲染失败并显示原始文本；该问题作为新的已知限制记录，待后续批量修复。

**产出文件**:
- `comprehensive_mixed.json`（更新）- 题干/选项来自 MinerU。
- `index（综合混合）.html`（更新）- 内嵌更新后的 76 题 JSON。

### 阶段 12: 统一鼠标悬浮字体颜色为绿色

**日期**: 2026-07-17

**操作**:
- 将 `index（综合混合）.html` 中所有可交互元素的悬浮文字颜色改为截图中的绿色（`#4caf50`，即 `--correct-border`）。
- 新增 CSS 变量 `--hover-text-color: var(--correct-border)`，统一维护悬浮字体色。
- 同步修改生成脚本 `build_mixed_html.py` 的模板，保证后续重新生成时样式一致。
- 题号导航仅对未答/当前题应用绿色悬浮，已标记为正确/错误的题号保留原红绿色，避免覆盖答题状态。

**关键决策**:
- 复用现有 `--correct-border` 变量，使悬浮绿与“回答正确”主题色保持一致，无需引入新色值。
- 受影响的类：`.geo-btn`、`.geo-primary`、`.theme-chip`、`.nav-btn`、`.option-btn`。
- 未改动 `index（填空题）.html`、`index（解答题）.html`、`index（顺序） (3).html`，因为它们的样式体系（Tailwind 彩色类）与综合混合页不同，不属于同一链路。

**产出文件**:
- `index（综合混合）.html`（更新）- 悬浮字体颜色改为绿色。
- `build_mixed_html.py`（更新）- 模板同步更新。

### 阶段 13: 批量修复综合混合题库中的 LaTeX 公式显示错误

**日期**: 2026-07-17

**操作**:
- 编写 `check_latex.py` 对 `index（综合混合）.html` 内嵌 JSON 的 76 题进行全量扫描，检测 `$...$` 段的花括号是否闭合。
- 共发现 17 处残缺/异常 LaTeX，分布在 id 2、4、13、17、18、21、28、37、42、43、74。
- 编写 `fix_comprehensive_latex.py` 对源数据 `comprehensive_mixed.json` 进行针对性修复，包括补齐分数/根号/括号、修正下标 OCR 错误、清理 MinerU 生成的 `mathord`/`vphantom` 垃圾代码等。
- 修复后再用 `scan_latex.py` 扫描可疑残留，补充修正 id 24、25、29、60、65、75 的 degree 符号、单位空格、数字错位等问题。
- 重新运行 `build_mixed_html.py` 生成 `index（综合混合）.html`。
- 最终 `check_latex.py` 扫描 bad count 为 0。

**关键决策**:
- 修复入口放在源 JSON `comprehensive_mixed.json`，而非直接改 HTML，保证后续重新生成不会丢失修正。
- 对无法自动判断的公式仅做保守修复，避免改动答案/解析的物理含义。
- 保留 `check_latex.py` / `scan_latex.py` / `fix_comprehensive_latex.py` 作为后续题库质量检查工具。

**产出文件**:
- `comprehensive_mixed.json`（更新）- 修复多处 LaTeX 公式。
- `index（综合混合）.html`（更新）- 重新内嵌修正后的 76 题 JSON。
- `check_latex.py`（新增）- LaTeX 花括号检查脚本。
- `scan_latex.py`（新增）- LaTeX 可疑残留扫描脚本。
- `fix_comprehensive_latex.py`（新增）- 综合混合题库 LaTeX 修复脚本。

### 阶段 14: 更新 grind_promblems Skill 文档

**日期**: 2026-07-17

**操作**:
- 根据阶段 11-13 的实际经验，更新 [`.trae/skills/grind_promblems/SKILL.md`](.trae/skills/grind_promblems/SKILL.md)。
- 在 PDF 识别步骤补充：若已存在含人工修正的源 JSON，优先更新该 JSON 再重新生成 HTML，避免覆盖答案与解析。
- 新增 3.5 节“LaTeX 质量检查”，建议在生成 HTML 后扫描 `$...$` 花括号闭合，并在源 JSON 修复后再生成。
- 推荐保留 `check_latex.py`、`scan_latex.py`、`fix_xxx_latex.py` 作为后续维护工具。

**关键决策**:
- Skill 文档保持通用性，但吸收本项目已验证的最佳实践，方便以后处理新 PDF 时直接复用同一套检查流程。

**产出文件**:
- `.trae/skills/grind_promblems/SKILL.md`（更新）- 补充 LaTeX 质量检查与源 JSON 优先修复策略。

### 阶段 15: 用 darwin-skill 优化 grind_promblems Skill

**日期**: 2026-07-17

**操作**:
- 初始化 git 分支 `auto-optimize/20260717-0000`，建立 baseline commit。
- 为 grind_promblems 编写 `test-prompts.json`，覆盖 PDF 填空题、人工校对 JSON 综合混合页、无答案解答题三类场景。
- 按 darwin-skill 9 维 rubric 做基线评估：总分 67.5，短板为 dim4 检查点(4)、dim9 反例黑名单(3)、dim3 失败模式(5)、dim5 可执行具体性(6)。
- 执行 4 轮优化：
  1. 新增「反例与黑名单」章节，dim9 从 3 → 8，总分 67.5 → 68.2。
  2. 输入确认增加 🛑 STOP / 🔴 CHECKPOINT 视觉标记，dim4 从 4 → 8，总分 68.2 → 70.6。
  3. PDF/答案/LaTeX 三段补充 if-then 三段式失败处理总表，dim3 从 5 → 8，总分 70.6 → 70.8。
  4. 删除「建议/可保留」等软化措辞，LaTeX 检查改为强制，dim5 从 6 → 8，总分 70.8 → 83.4；随后合并失败处理表以满足 150% 体积限制，最终总分 81.1。
- 所有改进均通过独立子 agent 的 dry-run 效果评估，未引入新的 scripts/references 依赖。
- 更新 `.trae/skills/grind_promblems/results.tsv` 记录优化日志。

**关键决策**:
- 每轮只改一个维度，便于归因；总分严格高于旧版才保留（体积约束导致的最后一轮 dim8 微调除外）。
- 失败处理从分散的三张小表合并为一张总表，在保持 dim3 得分的同时满足 SKILL.md 不超过原始大小 150% 的约束。
- 效果评估使用独立子 agent 干跑（dry_run），未做端到端 full_test，因为 full_test 需要真实 PDF 提取与 HTML 生成链路。

**产出文件**:
- `.trae/skills/grind_promblems/SKILL.md`（更新）- 加入反例黑名单、显性检查点、失败处理总表、去除软化措辞。
- `.trae/skills/grind_promblems/test-prompts.json`（新增）- darwin-skill 测试 prompts。
- `.trae/skills/grind_promblems/results.tsv`（新增）- 优化记录。



### 问题 1: PDF 原始文本中的数学符号乱码

**日期**: 2026-07-13

**现象**: `*_raw.txt` 中波长、角度、分数等符号显示为私有 Unicode 或错位字符。

**原因**: PDF 使用嵌入式字体编码，直接文本提取无法得到标准数学符号。

**解决**: 根据上下文语义、物理公式习惯及数值合理性人工推断，并用 LaTeX 重写题干与答案。

### 问题 2: 力学解答题 JSON 中 LaTeX 命令双重反斜杠

**日期**: 2026-07-13

**现象**: 页面中部分公式（如 `\vec{r}`）渲染失败或显示为原始文本。

**原因**: JSON 生成过程中字符串被多次转义，导致 `\\vec{r}` 这类冗余反斜杠出现。

**解决**: 编写 `fix_mechanics_calc_latex.py` 递归折叠 `\\` 为 `\`，再重新生成 HTML。

### 问题 3: HTML 模板双大括号导致 JS 语法错误

**日期**: 2026-07-13

**现象**: 浏览器报 `Unexpected token '{'`，`question-counter`、`question-body` 为空，页面无法加载题目。

**原因**: `build_html_pages.py` 中的 HTML 模板为了兼容 f-string 格式，把 JS 的 `{` 写成了 `{{`。

**解决**: 将模板内所有 `{{` 替换为 `{`、`}}` 替换为 `}`，并重新生成页面。

### 问题 4: MinerU OCR 导致选择题选项 LaTeX 花括号残缺

**日期**: 2026-07-17

**现象**: 综合混合页第 2 题（力学选择题）的 B、C、D 选项显示为原始文本，如 `$v=-\frac{1}{2}k t^{2}+v_{\mathrm{0}$`，而非渲染后的数学公式。

**原因**: MinerU 在识别 PDF 中的数学公式时，对嵌套花括号或 `\mathrm{...}` 的闭合括号识别不完整，导致 `$...$` 内部 LaTeX 语法错误，MathJax 无法排版。

**解决**: 当前记录为已知限制；如需修复，可在 `parse_mineru_to_json.py` 的 `clean_math()` 中增加针对选项末位缺失 `}` 的兜底补全规则，或改回阶段 10 之前的人工校对题干。

## 已知限制与待改进项

- [x] 已完成力学填空题提取。
- [x] 已完成力学与波动光学解答题提取。
- [x] 已生成填空题/解答题刷题页面。
- [x] 已通过 Playwright 验证页面渲染与基础交互。
- [ ] 未对全部 106 道题逐一做浏览器截图核对；后续如发现个别公式或答案显示异常，可在对应 JSON 中修正后重新运行 `build_html_pages.py`。
- [ ] 部分题目含"如图所示"描述，页面未嵌入原 PDF 配图；用户若需看图，可对照原 PDF。
- [ ] 答案归一化仅覆盖常见 LaTeX 命令与全角符号，极端等价形式（如 `\sqrt{3}/2` 与 `0.866`）无法自动匹配。
- [x] 综合混合页已使用 MinerU 提取 PDF 配图，35/76 题已嵌入 `assets/q{ id }.jpg`。
- [x] 综合混合页题干/选项已改用 MinerU 提取文本（阶段 11），保留人工答案与解析。
- [x] MinerU OCR 对部分选择题选项的 LaTeX 花括号识别不完整（如 id 2），导致 MathJax 渲染失败并显示原始文本；已在阶段 13 批量修复综合混合页中检测到的 17 处明显残缺。
- [ ] 仍可能存在 subtle OCR 公式错误（如数字错位、符号遗漏），需在刷题过程中继续收集并修复。
- [x] `grind_promblems` Skill 已通过 darwin-skill 9 维 rubric 优化并记录（baseline 67.5 → final 81.1）。
- [ ] 未来实际调用新 PDF 时，可补一次端到端 full_test 以替换 dry_run 评估。

## 最后更新时间

2026-07-18 00:55
