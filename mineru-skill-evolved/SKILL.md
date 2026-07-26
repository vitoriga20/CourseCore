---
name: mineru
description: Parse PDF / Office / image documents into structured Markdown with MinerU. Use when converting PDF/Word/PPT/Excel/images, extracting text/tables/formulas, running OCR, or batch processing. Trigger words: PDF转Markdown、MinerU、提取题目、公式识别、批量PDF、OCR. Works with NO token via the Agent API, or with a token via the Standard API; falls back automatically when Standard fails and the input fits Agent limits.
metadata:
  author: Nebutra
  version: "3.5.0"
  argument-hint: <pdf-file-or-url>
---

# MinerU PDF Parser

Parse PDF, Office, and image documents into structured Markdown via the MinerU API.

## Quick Start

```bash
# Agent API (no token, no install)
python3 "${SKILL_ROOT}/scripts/mineru.py" ./document.pdf --output ./output/

# Pipe Markdown back to an agent
python3 "${SKILL_ROOT}/scripts/mineru.py" ./document.pdf --stdout

# Standard API (token unlocks large files / batch / extra formats)
export MINERU_TOKEN="..."   # https://mineru.net/apiManage/token
python3 "${SKILL_ROOT}/scripts/mineru.py" ./document.pdf --output ./output/ --token "$MINERU_TOKEN"
```

## Workflow

1. **Choose API mode**
   - No token, single small file, plain Markdown → Agent API.
   - Token present, batch, formulas/tables, DOCX/HTML/LaTeX → Standard API.
2. **Run extraction**
   - Single file: `python3 "${SKILL_ROOT}/scripts/mineru.py" ./doc.pdf --output ./out/`
   - Batch folder: `python3 "${SKILL_ROOT}/scripts/mineru.py" ./pdfs/ --output ./out/ --workers 4 --resume`
3. **Inspect output**
   - `output/<name>/markdown.md` for direct Markdown.
   - `output/<name>/content_list.json` + `output/<name>/images/` for structured blocks.
4. **Post-process (especially for exam/training questions)**
   - Map embedded-font PUA glyphs back to standard characters (e.g. `λ π θ φ Δ`).
   - Protect LaTeX formulas `$...$` before running option-detection regex.
   - Copy referenced images from MinerU temp dir to your project's public/static directory.
   - Validate question types against section titles, option presence, and prefix codes.

## Features

- **Smart API routing**: prefers Standard API when a token is present; falls back to the free Agent API on quota/rate-limit/invalid-token errors if the input fits Agent limits.
- **Token auto-discovery**: reads `MINERU_TOKEN` or `--token`; prompts interactively in a terminal only when Standard API is required but missing.
- **Multi-modal**: PDF, images, Word, PPT, Excel, HTML.
- **High-performance OCR**: `--ocr` with `--lang` selection.
- **Formula & table recognition**: LaTeX formulas and structured tables.
- **Multi-format export**: Markdown (default), DOCX, HTML, LaTeX.
- **AI-Native output**: `--stdout` (Markdown) and `--json` (machine status).
- **Batch + resume**: parallel workers with `--resume`.
- **Zero dependencies**: standard library only.

## Failure Modes

| Symptom | First fix | If it still fails |
|---|---|---|
| Local CLI reports `Connection to huggingface.co timed out` or model download errors | Switch to HTTP API via `mineru-open-sdk` or this CLI's Standard mode | Use Agent API for files within Agent limits |
| Greek letters / math symbols appear as boxes or PUA glyphs | Enable formula recognition and apply a PUA-to-Unicode mapping table | Heuristically restore known missing symbols (e.g. `波长为 的` → `波长为 λ 的`) |
| Multiple-choice options are missing or truncated | Protect `$...$` before regex, relax marker rules `(A)`/`A.`, infer missing option A from stem | Apply per-page hard-coded patches for known OCR gaps |
| Images referenced in `content_list.json` do not load in the final app | Copy `images/` into your public/static directory and rewrite URLs | Re-run with `--ocr` if images were scanned |
| Token rejected or quota exceeded | Fall back to Agent API (auto if input fits limits) | Refresh token at https://mineru.net/apiManage/token |

## Anti-Patterns / Don't Do

- Don't treat MinerU output as the final answer for academic exam/training questions without post-processing symbols, options, and images.
- Don't rely on local CLI in production unless the model cache is verified; prefer the HTTP API for stability.
- Don't leave image paths pointing at MinerU's temporary output directory; copy them into your project.
- Don't submit a large batch without confirming token quota, expected cost, and output disk space.

## 🔴 CHECKPOINTS

- 🔴 STOP before a large batch: confirm `MINERU_TOKEN`, expected page count, and output directory.
- 🔴 STOP before publishing extracted questions: run a validation pass on symbols, options, and image paths.

## Authentication

A token is optional — the Agent API works without one. Set a token to unlock the Standard API (≤ 200 MB / ≤ 200 pages, batch, DOCX/HTML/LaTeX):

```bash
export MINERU_TOKEN="your-token-here"   # https://mineru.net/apiManage/token
```

If the Standard API is required (e.g., HTML, extra formats, or files/pages beyond Agent limits) and no token is set, the CLI will prompt you to paste one in an interactive terminal. In non-interactive environments (MCP, CI, etc.), set `MINERU_TOKEN` beforehand.

Official API docs: https://mineru.net/apiManage/docs
