# 技术架构文档 - 物理填空/解答刷题网页

## 1. 技术栈

| 层级 | 技术 |
|------|------|
| 页面结构 | 原生 HTML5 |
| 样式 | Tailwind CSS CDN |
| 数学公式渲染 | MathJax 3 (tex-chtml) |
| 数据 | JSON 数组硬编码在页面 `<script>` 中 |
| 构建/处理 | Python 3 + `pypdf` / 正则 / `json` |
| 测试 | Playwright (Chromium) |

## 2. 项目目录说明

```
c:\Users\vitoriga\Downloads\物理试题\
├── .trae\documents\              # 开发文档
├── index（顺序） (3).html         # 现有单选刷题页
├── index（填空题）.html           # 填空题刷题页（产物）
├── index（解答题）.html           # 解答题刷题页（产物）
├── build_html_pages.py           # 合并 JSON 生成两个 HTML 产物
├── build_mixed_html.py           # 生成综合混合 HTML 产物
├── build_comprehensive_mixed.py  # 合并综合测试题为混合 JSON
├── parse_mineru_to_json.py       # 解析 MinerU Markdown 为结构化题库
├── merge_mineru_images.py        # 将 MinerU 提取的图片合并到现有题库
├── build_mechanics_calc_json.py  # 生成力学解答题 JSON
├── extract_mechanics_text.py     # 提取力学 PDF 原始文本
├── fix_mechanics_calc_latex.py   # 修复力学解答题 JSON 的 LaTeX 转义
├── assets/                       # 题目配图（q{ id }.jpg）
└── *.pdf                          # 原始物理试卷

c:\Users\vitoriga\AppData\Local\Temp\physics_questions\
├── mechanics_fillin.json         # 力学填空题（33 道）
├── optics_fillin.json            # 波动光学填空题（27 道）
├── mechanics_calc.json           # 力学解答题（25 道）
└── optics_calc.json              # 波动光学解答题（21 道）
```

## 3. 数据流

```
PDF 试卷
   │
   ▼
pypdf / MinerU 提取原始文本或 Markdown + 图片
   │
   ▼
人工对照 PDF 重建题干/答案 → JSON
   │
   ▼
parse_mineru_to_json.py / merge_mineru_images.py 提取并合并配图（如需要）
   │
   ▼
fix_mechanics_calc_latex.py 修复转义（如需要）
   │
   ▼
build_html_pages.py / build_mixed_html.py 合并 JSON 为页面内嵌数组
   │
   ▼
index（填空题）.html / index（解答题）.html / index（综合混合）.html
```

## 4. 数据格式

### 4.1 填空题

```json
{
  "question": "题干，使用 $...$ 表示行内公式",
  "answer": "标准答案，多空用 ; 分隔",
  "category": "力学 | 波动光学",
  "type": "fillInTheBlank"
}
```

### 4.2 解答题

```json
{
  "question": "题干，使用 $...$ 表示行内公式，\\n 表示换行",
  "answer": "最终答案，多问用 ; 分隔",
  "solution": "简要推导/思路提示",
  "category": "力学 | 波动光学",
  "type": "problemSolving"
}
```

## 5. 前端运行时

### 5.1 初始化

1. 页面加载 MathJax 3。
2. `MathJax.startup.promise.then(mainApp)` 或 `DOMContentLoaded` 触发 `mainApp()`。
3. `mainApp()` 将 `questionBankData` 绑定到 `state.questions`，初始化 `userAnswers` 数组。
4. `renderQuestion()` 渲染当前题目并调用 `MathJax.typesetPromise()` 排版公式。
5. `renderNavbar()` 生成底部题号按钮。

### 5.2 答题流程

1. 用户在输入框填入答案，点击"提交答案"或按回车。
2. `handleSubmit*` 比较归一化后的用户答案与标准答案。
3. 若相同，输入框变绿色；若不同，输入框变红色并显示正确答案（解答题额外显示 `solution`）。
4. 底部对应题号按钮更新颜色。
5. 用户可通过上一题/下一题或底部导航切换。
6. 点击"完成练习"显示结果页（答对题数、正确率）。
7. 点击"重新开始"清空所有答题状态。

### 5.3 答案归一化

`normalizeAnswer()` 对字符串执行以下处理：

- 去除 `$`
- 去除 `\mathrm{...}` 命令
- 去除 `\,`、`\;` 等间距命令
- 去除所有空白字符
- 全角标点 `；，（）` 转为半角 `;,()`
- 转为小写

比较时认为归一化后的字符串完全一致即为正确。

## 6. 依赖

- 浏览器环境：支持现代 Chromium/Edge/Firefox/Safari。
- 网络：需要加载 Tailwind CSS CDN 与 MathJax CDN。
- 本地构建：Python 3 + `pypdf`。
- 本地验证：Playwright + Chromium。

## 7. 可复现构建步骤

1. 确保四类 JSON 已生成并放置在 `c:\Users\vitoriga\AppData\Local\Temp\physics_questions\`。
2. 运行 `python build_html_pages.py`。
3. 产物自动生成在工作目录根目录。
4. 使用浏览器打开 `file:///.../index（填空题）.html` 与 `file:///.../index（解答题）.html` 即可使用。

## 8. 已知技术限制

- 所有数据硬编码在 HTML 中，文件体积较大；好处是无后端、可直接用浏览器打开。
- 答案匹配基于字符串归一化，不处理数值近似或复杂等价变形。
- 综合混合页已通过 MinerU 嵌入 35 张原卷配图；未配图的"如图所示"题目仍需结合原 PDF 查看。
