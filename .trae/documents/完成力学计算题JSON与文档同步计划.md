# 完成力学计算题 JSON 输出与文档同步计划

## 1. Summary

继续完成上一阶段的剩余工作：

1. 执行 `build_mechanics_calc_json.py`，将 25 道力学计算题写入目标 JSON 文件。
2. 修复脚本中 LaTeX 反斜杠转义不一致的问题，确保最终 JSON 中的公式可被 MathJax 正确渲染。
3. 创建/更新 `development-log.md`，记录本次数据产出、关键决策与已知问题。
4. 验证 JSON 文件结构、题目总数与公式渲染可用性。

## 2. Current State Analysis

### 2.1 已存在文件

- `c:\Users\vitoriga\Downloads\物理试题\build_mechanics_calc_json.py`
  - 硬编码了 25 道力学计算题，包含 `question`、`answer`、`solution`、`category`、`type` 字段。
  - 脚本尚未执行，目标 JSON 文件 `c:\Users\vitoriga\AppData\Local\Temp\physics_questions\mechanics_calc.json` 不存在。
  - 源码中 LaTeX 反斜杠转义不统一：部分使用 `\\vec`（会生成 JSON 中的 `\\\\vec`，即两个反斜杠），部分使用 `\frac`（会生成 JSON 中的 `\\frac`，即一个反斜杠）。这会导致 MathJax 渲染失败或显示异常。
- `c:\Users\vitoriga\Downloads\物理试题\extract_mechanics_text.py`
  - 已完成力学 PDF 原始文本提取，输出到 `c:\Users\vitoriga\AppData\Local\Temp\physics_pdf_text\`。
- `c:\Users\vitoriga\Downloads\物理试题\render_calc_pages.py`
  - 已完成计算题页面渲染为 PNG，便于人工校对公式。
- `c:\Users\vitoriga\Downloads\物理试题\.trae\documents\物理填空解答刷题网页开发计划.md`
  - 项目整体方案已确定，数据格式与页面规划已明确。

### 2.2 缺失文件

- 根目录 `development-log.md` 不存在，需要创建。
- `.trae\documents\technical-architecture.md` 与 `.trae\documents\prd.md` 当前未要求必须创建，仅当本次改动涉及时才更新；本次以创建 `development-log.md` 为主。

### 2.3 已知问题

- `build_mechanics_calc_json.py` 中部分 LaTeX 命令转义不一致，必须在生成 JSON 前统一为单条反斜杠（即 Python 源码中统一使用 `\\` 表示最终 JSON 中的一个反斜杠）。
- 需确认 JSON 输出后字段完整、无乱码、可正常被 Python `json.load` 解析。

## 3. Proposed Changes

### 3.1 修复 `build_mechanics_calc_json.py` 中的 LaTeX 转义

**文件**：`c:\Users\vitoriga\Downloads\物理试题\build_mechanics_calc_json.py`

**操作**：

- 全文扫描所有含 `$...$` 的字符串。
- 将最终应渲染为单个反斜杠的 LaTeX 命令统一为 Python 字符串中的 `\\`（JSON 中对应 `\\`，渲染时对应 `\`）。
- 重点关注以下命令：`\vec`、`*\bar`、`*\Delta`、`*\omega`、`*\alpha`、`*\theta`、`*\mu`、`*\rho`、`*\tau`、`*\sqrt`、`*\frac`、`*\arctan`、`*\cos`、`*\sin` 等。
- 避免使用 Unicode 上下标字符；统一用 LaTeX 命令（如 `^\circ`、`^2`、`_0`）。

**目的**：保证 MathJax 能正确解析所有公式。

### 3.2 执行脚本生成 JSON

**文件**：`c:\Users\vitoriga\Downloads\物理试题\build_mechanics_calc_json.py`

**操作**：

- 在 PowerShell 中运行 `python build_mechanics_calc_json.py`。
- 确认输出提示写入题目数量与目标路径。

**目的**：产出目标 JSON 文件。

### 3.3 验证 JSON 文件

**文件**：`c:\Users\vitoriga\AppData\Local\Temp\physics_questions\mechanics_calc.json`

**操作**：

- 使用 Python `json.load` 读取，确认无解析错误。
- 统计条目数量，确认等于 25。
- 抽查 3-5 道题的 `question`、`answer`、`solution` 字段，确认 LaTeX 反斜杠数量正确（MathJax 可识别）。

### 3.4 创建 `development-log.md`

**文件**：`c:\Users\vitoriga\Downloads\物理试题\development-log.md`

**操作**：

- 创建根目录开发日志。
- 记录项目概览、文件结构、开发阶段、关键决策、问题与解决方案、已知限制与待改进项。
- 重点记录本次阶段：
  - 阶段 1：提取力学 PDF 原始文本（`extract_mechanics_text.py`）。
  - 阶段 2：渲染计算题页面图像用于人工校对（`render_calc_pages.py`）。
  - 阶段 3：整理 25 道力学计算题并生成 JSON（`build_mechanics_calc_json.py`）。
- 更新最后更新时间。

## 4. Assumptions & Decisions

| 决策项 | 选择 | 理由 |
|--------|------|------|
| LaTeX 转义标准 | Python 源码中所有 LaTeX 命令统一用 `\\` | 保证 JSON 中只保留一个反斜杠，MathJax 可识别 |
| 题目编号 | 保持原题号或重新连续编号均可；本次按脚本现有顺序 1-25 | 用户允许“保持原样或重新从 1 开始连续编号” |
| 答案格式 | 多小问用 `;` 分隔 | 符合用户原始要求 |
| 文档位置 | `development-log.md` 放在根目录 | 规则中“根目录文档优先读取” |
| 公式校对依据 | 已渲染的 PNG 页面 + 原始文本 | 人工推断正确公式并统一为 LaTeX |

## 5. Verification Steps

- [ ] `build_mechanics_calc_json.py` 中所有 LaTeX 命令转义一致。
- [ ] 运行脚本后 `mechanics_calc.json` 成功生成。
- [ ] `json.load` 能正常读取该文件。
- [ ] 题目总数为 25。
- [ ] 抽查题目中 `$...$` 内的 LaTeX 命令均为单条反斜杠。
- [ ] `development-log.md` 已创建并包含本次阶段记录。
- [ ] 文档中的“最后更新时间”已更新。
