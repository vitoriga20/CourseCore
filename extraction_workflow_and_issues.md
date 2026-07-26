# 大学物理 B（上）训练题 PDF 提取流程与问题整理

> 本文件汇总当前窗口把「力学练习 / 波动光学练习」PDF 转化为课程训练题的全过程、踩过的坑以及修复方案，供后续复用和 skill 进化参考。

## 1. 任务目标

把 13 份大学物理练习 PDF（力学 7 份 + 波动光学 6 份，不含综合测试）提取成 Markdown 训练题：
- 只取题干，答案留空，后续人工补充。
- 区分选择题 / 填空题 / 计算题。
- 题图要能正确显示。
- 每个理论小节后跟一个 `type: training` 训练小节，复用 `quizSession` 交互。

## 2. 整体流程

```text
PDF 文件
  ↓ 选择抽取方式
  ├── 初版：本地 MinerU CLI（失败：HuggingFace 模型下载超时）
  ├── 备选：pdfplumber（能跑，但公式/图片质量差）
  └── 终版：mineru-open-sdk HTTP API
        ↓
content_list.json + images
        ↓
training-extract.py 解析、拆分、清洗
        ↓
curriculum/raw/questions/physics-b-1/<item>-training/q-*.md
        ↓
复制题图到 public/physics/training/<item>/
        ↓
npm run build:data 生成 src/data/questions.js
        ↓
npx vite build && node scripts/prerender.js 产出 dist/
```

## 3. 抽取工具演变

### 3.1 本地 MinerU CLI
- 命令：`magic-pdf pdf-command --pdf <file>` 等。
- 问题：默认从 HuggingFace 下载模型，`Connection to huggingface.co timed out`。
- 尝试：切换 `MINERU_MODEL_SOURCE=modelscope`，但本地仍然依赖模型文件，部分环境继续失败。

### 3.2 pdfplumber 备选
- 能直接读文本，零模型依赖。
- 缺点：
  - 对嵌入字体里的私有使用区（PUA）字符解析为乱码。
  - 公式无法转成 LaTeX。
  - 题图无法自动识别。
- 结论：仅作为临时兜底，不适合物理公式训练题。

### 3.3 mineru-open-sdk HTTP API（最终方案）
- 使用：`MinerU(token=...).extract_batch(sources, model="vlm", formula=True, table=False, language="ch")`
- 优势：把模型下载和计算放到 MinerU 服务端，本地只收发 JSON/图片。
- 批量：13 个 PDF 一次性提交，轮询状态直到完成。
- 输出：`content_list.json`（结构化文本/图片块）+ `images/` 目录。

## 4. 解析与清洗流程（training-extract.py）

1. **按题号拆分**
   - 用正则匹配 `1．`、`2.` 等题号开头。
   - 遇到 `选择题`、`填空题`、`计算题` 等章节标题时更新题型。

2. **题库前缀推断题型**
   - 部分题目以 `（xz0000A000008425）` 等题库编码开头。
   - 前缀 `xz`→选择、`tk`→填空、`js`→计算、`pd`→判断、`jd`→简答、`zm`→证明。

3. **选项提取**
   - 正则匹配 `（A）`、`(A)`、`A.`、`A、` 等标记。
   - 保护 LaTeX 公式 `$...$`，避免把 `\Delta` 等希腊字母误判为选项。
   - 如果首选项不是 A，则从题干末尾推断 A 选项内容。

4. **题型判定**
   - 章节标题含「选择/判断」→ `singleChoice`
   - 含「填空」→ `fillInBlank`
   - 含「计算」→ `calculation`
   - 有选项但无明确标题→ `singleChoice`
   - 其他→ `proof`

5. **符号修复**
   - PUA 字符映射表：把嵌入字体私有区符号转回 `λ`、`π`、`θ`、`φ`、`Δ` 等。
   - 启发式恢复 MinerU 漏识别的希腊字母：
     - `波长为 的` → `波长为 λ 的`
     - `成 /4角` → `成 π/4角`
   - 已知题目硬编码补丁：如波动光学练习四第 2 题补回空选项 B。

6. **题图处理**
   - 读取 `content_list.json` 中的 `image` 块。
   - Markdown frontmatter 中写入 `image: /physics/training/<item>/<hash>.jpg`。
   - 把图片从 MinerU 临时输出目录复制到 `public/physics/training/<item>/`。

## 5. 遇到的主要问题与修复

| # | 问题 | 表现 | 根因 | 修复方案 |
|---|---|---|---|---|
| 1 | 图片未加载 | 训练题里题图空白 | 只生成了 Markdown，没把图片复制到 `public/` | `process_pdf` 中新增图片复制逻辑 |
| 2 | 全变成填空题 | 所有题目显示为填空 | 默认 `questionType = proof`；章节标题识别失败时没 fallback | 加入章节标题 + 题库前缀 + 选项存在性三重判定 |
| 3 | 选择题无选项 | 单选题只显示题干 | 选项正则要求 `(A)` 后必须有空格，且 CJK 字符前 negative lookbehind 把 `(A)中文` 过滤掉 | 移除 `一-\u9fff` 前的 lookbehind，放宽标记后空格要求 |
| 4 | 首选项丢失 | 选项 A 内容被截断 | `extract_options` 切片时把首选项起点误当成 stem 终点 | 修正 starts/ends 切片逻辑 |
| 5 | 乱码 / PUA 字符 | 公式符号显示为方框或乱码 | PDF 使用嵌入字体私有区编码 | 建立 PUA_MAP 做字符回退 |
| 6 | λ / π 等符号缺失 | 题干出现「波长为 的」「成 /4角」 | MinerU API 偶发漏识别希腊字母 | `repair_missing_lambda` + `patch_known_questions` 启发式/硬编码修复 |
| 7 | 空选项占位 | 波动光学练习四第 2 题选项 B 为空 | API 输出缺选项 | 针对该题做补丁恢复 |
| 8 | 环境变量未透传 | `training-extract.py` 报 `MINERU_TOKEN` 缺失 | Node.js 子进程没拿到 `.env.local` | `training-builder.js` 增加 `loadEnvLocal` 函数 |
| 9 | API 轮询复杂 | 直接调 REST 接口查批量状态容易出错 | 官方 SDK 已封装批量轮询 | 改用 `mineru-open-sdk` 的 `extract_batch` |

## 6. 最终数据验证

- 总题数：107 道。
- 题型分布：单选 47 道（均含 4 个选项）、填空 35 道、计算 25 道。
- 题图：26 张引用全部命中 `public/physics/training/<item>/`。
- 构建：`npm run build:data` 产出 291 题 + 15 理论 + 2 试卷；`vite build + prerender.js` 产出 479 条静态路由。

## 7. 可复用经验

- **优先用 HTTP API 而非本地 CLI**：避免模型下载、CUDA、路径等环境差异。
- **不要信任 OCR 的符号**：物理题中的希腊字母、PUA 字符必须做后处理。
- **题型判定要多路 fallback**：章节标题、题库前缀、选项存在性都要参考。
- **题图路径要双检**：Markdown 里的 `image` 字段和 `public/` 下的实际文件都要验证。
- **批量任务用 SDK**：自己写轮询容易踩状态码和鉴权坑。

## 8. 给 MinerU skill 的进化建议

基于以上实战经验，mineru skill 可补充：
1. **“学术题目提取”工作流**：从 PDF → 结构化题目 Markdown 的完整步骤。
2. **失败模式清单**：本地 CLI 模型下载超时、PUA 乱码、公式漏识别、题图缺失等。
3. **后处理指南**：符号修复表、选项提取正则、题型判定规则。
4. **API 优先策略**：默认推荐 `mineru-open-sdk` 的 `extract_batch`。
5. **不要做什么**：不要把 MinerU 输出直接当最终题目，必须做题型/符号/图片校验。
