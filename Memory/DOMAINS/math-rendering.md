# 数学公式渲染

id: memory-20260808-math-rendering
type: domain
status: active
confidence: verified
source: src/utils/markdown.js, tests/math-markdown.test.js
updated: 2026-08-08
review_after: 2027-02-08
tags: [mathjax, markdown, admin]

`marked` 会将 LaTeX 内的 `_` 当作 Markdown 强调语法，破坏 `$...$` 中含下标的公式，使 MathJax 无法排版。
所有需同时支持 Markdown 与公式的预览应使用 `renderMarkdownWithMath`：先占位保护数学片段，Markdown 渲染后再还原，最后由 MathJax typeset。
