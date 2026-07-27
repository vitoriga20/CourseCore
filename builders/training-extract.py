#!/usr/bin/env python3
"""Extract mechanics/optics practice PDFs into training question Markdown via MinerU API.

Requires: mineru-open-sdk (pip install mineru-open-sdk) and MINERU_TOKEN env var.
"""

import json
import os
import re
import shutil
import sys
import tempfile
from pathlib import Path

try:
    from mineru import MinerU
except ImportError as e:
    raise SystemExit("mineru-open-sdk not installed. Run: pip install mineru-open-sdk") from e

COURSE_ID = "physics-b-1"

PDF_TO_ITEM = {
    **{f"力学练习{num}.pdf": f"p1b-m1-{i:02d}-training" for i, num in enumerate("一二三四五六七", 1)},
    **{f"波动光学练习{num}.pdf": f"p1b-m2-{i:02d}-training" for i, num in enumerate("一二三四五六", 1)},
}

MODULE_ID_BY_ITEM = {
    **{f"p1b-m1-{i:02d}-training": "p1b-m1" for i in range(1, 8)},
    **{f"p1b-m2-{i:02d}-training": "p1b-m2" for i in range(1, 7)},
}

TITLE_RE = re.compile(r"^\s*[一二三四五六七八九十]+[、.．]\s*(选择|填空|计算|简答|证明|判断)题\s*$")
# Match question start like "1．" or "1." or "1、" (arabic or full-width dot)
QUESTION_START_RE = re.compile(r"^\s*(\d+)\s*[．.．、]\s*")
# Question bank prefix like （xz0000A000008425 ） or (tk1000A000010965)
BANK_PREFIX_RE = re.compile(r"^\s*[（(]([a-zA-Z]+\d+[A-Z]?\d+)[）)]\s*")
# Prefix code -> section title fallback (xz=选择, tk=填空, js=计算, pd=判断, jd=简答, zm=证明)
BANK_TYPE_MAP = {
    "xz": "选择题",
    "tk": "填空题",
    "js": "计算题",
    "pd": "判断题",
    "jd": "简答题",
    "zm": "证明题",
}
# Sub-question like （1）(1) （一）
SUB_QUESTION_RE = re.compile(r"^\s*[（(]([\d一二三四五六七八九十]+)[）)]\s*")
LATEX_RE = re.compile(r"(\$[^$]*\$)")
# Match option markers like （A） (A) A. A、 A） without requiring trailing whitespace.
# Do not reject CJK characters before the marker: \w in Python matches Unicode letters.
MARKER_RE = re.compile(r"(?<![\\])[（(]([A-Da-d])[）)]\s*[.．、]?")
BARE_MARKER_RE = re.compile(r"(?<![\\])([A-Da-d])[)）.．、]")
CODE_RE = re.compile(r"\s*[（(][a-zA-Z0-9]+\s*[）)]")
HEADER_RE = re.compile(r"班级\s*_?\s*学号\s*_?\s*姓名\s*_?\s*成绩")

# PDF embedded font PUA -> standard character fallback map.
# Formulas are normally rendered as LaTeX when -f true; this map catches stray glyphs.
PUA_MAP = {
    "\uf028": "(",
    "\uf029": ")",
    "\uf02b": "+",
    "\uf02d": "-",
    "\uf03d": "=",
    "\uf044": "Δ",
    "\uf062": "β",
    "\uf066": "φ",
    "\uf06a": "φ",
    "\uf06c": "λ",
    "\uf06d": "μ",
    "\uf070": "π",
    "\uf071": "θ",
    "\uf072": "ρ",
    "\uf076": "⃗",
    "\uf077": "ω",
    "\uf0a3": "≤",
    "\uf0b0": "°",
    "\uf0b4": "θ",
    "\uf0b9": "≠",
    "\uf0d7": "·",
    "\uf0e6": "(",
    "\uf0e7": ")",
    "\uf0e8": ")",
    "\uf0f6": "(",
    "\uf0f7": ")",
    "\uf0f8": ")",
}


def normalize_text(text: str) -> str:
    # Replace embedded-font PUA glyphs with readable equivalents.
    for pua, std in PUA_MAP.items():
        text = text.replace(pua, std)
    # Remove page header / student info fragments
    text = HEADER_RE.sub("", text)
    # Replace full-width punctuation commonly used in PDFs (but keep LaTeX intact)
    text = text.replace("\uFF08", "(").replace("\uFF09", ")")
    text = text.replace("\uFF0C", ",").replace("\uFF0E", ".").replace("\uFF1B", ";")
    text = text.replace("\uFF1D", "=").replace("\uFF4D", "m").replace("\uFF58", "x")
    # Compact whitespace, but preserve line breaks inside LaTeX is tricky; we keep single spaces.
    text = re.sub(r"[ \t]+", " ", text)
    return text.strip()


def question_type_for(section_title: str, has_options: bool) -> str:
    if "选择" in section_title or "判断" in section_title:
        return "singleChoice"
    if "填空" in section_title:
        return "fillInBlank"
    if "计算" in section_title:
        return "calculation"
    # 证明 / 简答 / 其他
    if has_options:
        return "singleChoice"
    return "proof"


def extract_options(text: str):
    r"""Extract inline options A/B/C/D from a question text.

    LaTeX formulas ($...$) are protected so that command letters like \Delta
    are not mistaken for option markers. If the first option marker is not A,
    option A is inferred from the stem end (after the last empty parenthesis
    pair or sentence-ending punctuation) up to the first marker.

    Returns (stem_without_options, [option_texts]) or (text, None).
    """
    latex = []

    def protect(m):
        latex.append(m.group(1))
        return f"\x00LX{len(latex) - 1}\x00"

    protected = LATEX_RE.sub(protect, text)

    matches = list(MARKER_RE.finditer(protected))
    if len(matches) < 2:
        matches = list(BARE_MARKER_RE.finditer(protected))
    if len(matches) < 2:
        return text, None

    letters = [m.group(1).upper() for m in matches]
    first_letter = letters[0]
    expected = [chr(ord(first_letter) + i) for i in range(len(letters))]
    if letters != expected:
        return text, None

    infer_a = first_letter != "A"
    if infer_a:
        search_end = matches[0].start()
        last_sep = None
        for candidate in re.finditer(r"[（(]\s*[）)]\s*|[。；]\s*", protected[:search_end]):
            last_sep = candidate
        if last_sep is None:
            return text, None
        stem_end = last_sep.end()
    else:
        stem_end = matches[0].start()

    stem = protected[:stem_end].strip()
    starts = [stem_end] + [m.end() for m in matches]
    ends = [m.start() for m in matches] + [len(protected)]
    options = []
    for s, e in zip(starts, ends):
        opt = protected[s:e].strip()
        # Drop separators (semicolon / Chinese semicolon) left between options.
        opt = re.sub(r"\s*[;；]\s*$", "", opt)
        if opt:
            options.append(opt)

    if len(options) < 2:
        return text, None

    def restore(s: str) -> str:
        for i, lx in enumerate(latex):
            s = s.replace(f"\x00LX{i}\x00", lx)
        return s

    return restore(stem), [restore(opt) for opt in options]


def parse_content_list(blocks):
    """Parse MinerU content_list blocks into (section_title, qnum, content, options, images)."""
    section_title = "其他"
    current_qnum = None
    current_parts = []   # list of ("text", text) or ("image", img_path)
    current_options = None

    def flush():
        nonlocal current_qnum, current_parts, current_options
        if current_qnum is not None:
            text_lines = []
            images = []
            for kind, value in current_parts:
                if kind == "image":
                    images.append(value)
                    continue
                # 纯选项块：内容为空且能拆出选项，只取选项不进入题干
                stem_part, opts = extract_options(value)
                if opts and stem_part == "":
                    current_options = opts
                    continue
                text_lines.append(value)

            body = "\n".join(text_lines).strip()
            body = CODE_RE.sub("", body, count=1).strip()
            content, inline_options = extract_options(body)
            options = inline_options if inline_options else current_options

            # Trim option markers that may remain at the end of the stem.
            content = re.sub(r"\s*[（(]\s*[）)]\s*$", "", content).strip()

            content = re.sub(r"\n{3,}", "\n\n", content).strip()
            if not content:
                content = "（题干提取为空，请手动补充）"

            yield (section_title, current_qnum, content, options, images)
        current_qnum = None
        current_parts = []
        current_options = None

    for block in blocks:
        btype = block.get("type", "")

        if btype == "page_number":
            continue

        if btype == "image":
            img_path = block.get("img_path", "")
            if img_path and current_qnum is not None:
                current_parts.append(("image", img_path))
            continue

        text = normalize_text(block.get("text", ""))
        if not text:
            continue

        tm = TITLE_RE.match(text)
        if tm:
            yield from flush()
            section_title = tm.group(1) + "题"
            continue

        qm = QUESTION_START_RE.match(text)
        if qm:
            yield from flush()
            current_qnum = int(qm.group(1))
            rest = text[qm.end():].strip()
            # Infer section type from question-bank prefix like （xz0000...）
            prefix_match = BANK_PREFIX_RE.match(rest)
            if prefix_match and section_title == "其他":
                code = prefix_match.group(1)
                prefix_type = ""
                for k in BANK_TYPE_MAP:
                    if code.lower().startswith(k):
                        prefix_type = BANK_TYPE_MAP[k]
                        break
                if prefix_type:
                    section_title = prefix_type
            # Strip question-bank prefix
            rest = BANK_PREFIX_RE.sub("", rest).strip()
            if rest:
                current_parts.append(("text", rest))
            continue

        sm = SUB_QUESTION_RE.match(text)
        if sm and current_qnum is not None:
            current_parts.append(("text", text))
            continue

        # 内联选项或独立选项行
        _, opts = extract_options(text)
        if opts and current_qnum is not None:
            current_options = opts
            continue

        if current_qnum is not None:
            current_parts.append(("text", text))

    yield from flush()


def escape_yaml(s: str) -> str:
    if not s:
        return '""'
    if re.search(r"[:#\n\r'\"{}\[\],&*!?|><=\-`\s]", s) or s.startswith((" ", "\"")) or s.endswith(" "):
        return json.dumps(s, ensure_ascii=False)
    return s


def build_frontmatter(fields: dict) -> str:
    lines = ["---"]
    for k, v in fields.items():
        if v is None:
            continue
        if isinstance(v, list):
            lines.append(f"{k}: [{', '.join(json.dumps(x, ensure_ascii=False) for x in v)}]")
        elif isinstance(v, (int, float, bool)):
            lines.append(f"{k}: {v}")
        else:
            lines.append(f"{k}: {escape_yaml(str(v))}")
    lines.append("---")
    return "\n".join(lines)


def repair_missing_lambda(content: str, options: list[str]) -> tuple[str, list[str]]:
    """MinerU API occasionally drops the Greek lambda symbol; restore it heuristically."""
    # Restore lambda in content where a bare space was left.
    content = re.sub(r"波长为\s+的", "波长为 λ 的", content)
    content = re.sub(r"波长为\s+单色", "波长为 λ 单色", content)
    content = re.sub(r"波长为\s+平行", "波长为 λ 平行", content)
    content = re.sub(r"波长为\s+光", "波长为 λ 光", content)
    # Restore a missing diffraction angle symbol in fill-in-the-blank stems.
    content = re.sub(r"衍射角的绝对值为\s*,", "衍射角的绝对值为 θ,", content)

    # If the question is clearly about wavelength and an option is a bare
    # fraction/integer, prefix it with λ (e.g. " /2" -> "λ/2", "2" -> "2λ").
    wave_context = re.search(r"波长|光栅|衍射|干涉|单缝", content)
    if wave_context:
        fixed = []
        for opt in options:
            stripped = opt.strip()
            # Only touch options that are plain numbers or fractions without λ.
            if re.fullmatch(r"\s*/?\s*\d+\s*(?:/\s*\d+)?\s*", stripped) and "λ" not in stripped and "$" not in stripped:
                collapsed = re.sub(r"\s+", "", stripped)
                if collapsed.startswith("/"):
                    fixed.append("λ" + collapsed)
                else:
                    fixed.append(collapsed + "λ")
            else:
                fixed.append(opt)
        options = fixed
    return content, options


def patch_known_questions(content: str, options: list[str], pdf_name: str, qnum: int) -> tuple[str, list[str]]:
    """Apply per-question fixes for OCR gaps that generic heuristics cannot cover."""
    # Missing π in angle descriptions like "成 /4角" -> "成 π/4角".
    content = re.sub(r"成\s*/(\d+)\s*角", r"成 π/\1角", content)

    # 波动光学练习四 第2题: MinerU leaves option (B) empty; restore the natural λ choice.
    if pdf_name == "波动光学练习四.pdf" and qnum == 2:
        normalized = [re.sub(r"\s+", "", opt) for opt in options]
        if "λ" not in normalized and set(normalized) == {"λ/2", "3/2λ", "2λ"}:
            options = [options[0], "λ", options[1], options[2]]
    return content, options


def markdown_for_question(seq: int, qnum: int, content: str, options, images: list, section_title: str, item_id: str, pdf_name: str, image_dir_url: str) -> str:
    content, options = repair_missing_lambda(content, options or [])
    content, options = patch_known_questions(content, options, pdf_name, qnum)
    qtype = question_type_for(section_title, bool(options))
    qid = f"q-{COURSE_ID}-{item_id}-{seq:03d}"
    fields = {
        "id": qid,
        "courseId": COURSE_ID,
        "moduleId": MODULE_ID_BY_ITEM[item_id],
        "itemId": item_id,
        "questionType": qtype,
        "title": f"第 {qnum} 题",
        "answer": "",
        "tags": [section_title],
        "source": f"{pdf_name} 第{qnum}题",
    }

    if images:
        # 题目目前只支持单张题图，取第一张
        first = Path(images[0]).name
        fields["image"] = f"{image_dir_url}/{first}"

    out = [build_frontmatter(fields), "", "## Content", content, ""]
    if options:
        out.extend(["## Options"] + [f"- {opt}" for opt in options if opt] + [""])
    return "\n".join(out)


def run_mineru_api(pdf_paths: list[Path]) -> dict[str, object]:
    """Run MinerU API on a list of PDFs and return {filename: ExtractResult}."""
    token = os.environ.get("MINERU_TOKEN")
    if not token:
        raise RuntimeError("MINERU_TOKEN environment variable is required")

    client = MinerU(token=token)
    sources = [str(p) for p in pdf_paths]
    print(f"[MinerU API] submitting {len(sources)} PDFs...")

    results: dict[str, object] = {}
    for result in client.extract_batch(
        sources,
        model="vlm",
        formula=True,
        table=False,
        language="ch",
        timeout=1800,
    ):
        filename = Path(result.filename).name
        state = result.state
        error = getattr(result, "error", None)
        print(f"  -> {filename}: {state}")
        if error:
            print(f"     error: {error}")
        results[filename] = result
    return results


def save_and_parse_result(result, save_dir: Path) -> tuple[list, Path]:
    """Save result files to save_dir and return (content_list blocks, content_list.json path)."""
    save_dir.mkdir(parents=True, exist_ok=True)
    result.save_all(str(save_dir))

    candidates = list(save_dir.rglob("*_content_list.json"))
    if not candidates:
        raise FileNotFoundError(f"content_list.json not found in {save_dir}")
    content_json = candidates[0]

    with open(content_json, "r", encoding="utf-8") as f:
        blocks = json.load(f)
    return blocks, content_json


def process_pdf(pdf_path: Path, result, out_dir: Path, public_img_dir: Path, tmp_dir: Path):
    pdf_name = pdf_path.name
    item_id = PDF_TO_ITEM.get(pdf_name)
    if not item_id:
        print(f"Skip unmapped PDF: {pdf_name}")
        return 0

    if result.state != "done":
        print(f"Skip failed PDF: {pdf_name} ({result.state})")
        return 0

    print(f"Processing {pdf_name} -> {item_id}")
    save_dir = tmp_dir / pdf_path.stem
    blocks, content_json = save_and_parse_result(result, save_dir)

    target_dir = out_dir / item_id
    target_dir.mkdir(parents=True, exist_ok=True)

    item_img_dir = public_img_dir / item_id
    item_img_dir.mkdir(parents=True, exist_ok=True)
    image_dir_url = f"/physics/training/{item_id}"

    seq = 0
    for section_title, qnum, content, options, images in parse_content_list(blocks):
        if qnum is None:
            continue
        seq += 1
        md = markdown_for_question(seq, qnum, content, options, images, section_title, item_id, pdf_name, image_dir_url)
        file_path = target_dir / f"q-{COURSE_ID}-{item_id}-{seq:03d}.md"
        file_path.write_text(md, encoding="utf-8")

    # Copy images referenced in this PDF.
    # MinerU content_list img_path is relative to the result output directory.
    content_root = content_json.parent
    image_sources = list(save_dir.rglob("images/*"))
    copied = 0
    for src in image_sources:
        if src.is_file():
            dst = item_img_dir / src.name
            shutil.copy2(src, dst)
            copied += 1

    # Also resolve any image paths recorded in content_list and copy them if they exist
    # outside the images/ folder.
    for block in blocks:
        if block.get("type") == "image":
            img_path = block.get("img_path", "")
            if not img_path:
                continue
            src = Path(img_path)
            if not src.is_absolute():
                src = content_root / src
            if src.exists() and src.is_file():
                dst = item_img_dir / src.name
                if not dst.exists():
                    shutil.copy2(src, dst)
                    copied += 1

    print(f"  Generated {seq} questions in {target_dir}, copied {copied} images to {item_img_dir}")
    return seq


def main():
    if len(sys.argv) < 2:
        raise SystemExit("Usage: training-extract.py <project-root>")
    project_root = Path(sys.argv[1]).resolve()
    if not project_root.is_dir():
        raise SystemExit(f"Not a directory: {project_root}")

    out_dir = project_root / "coursecore" / "curriculum" / "raw" / "questions" / COURSE_ID
    if out_dir.exists():
        for entry in out_dir.iterdir():
            if entry.is_dir() and entry.name.endswith("-training"):
                shutil.rmtree(entry)

    public_img_dir = project_root / "coursecore" / "public" / "physics" / "training"
    if public_img_dir.exists():
        shutil.rmtree(public_img_dir)
    public_img_dir.mkdir(parents=True, exist_ok=True)

    pdf_paths = []
    for pdf_path in sorted(project_root.iterdir()):
        if not pdf_path.is_file() or pdf_path.suffix.lower() != ".pdf":
            continue
        if "综合测试" in pdf_path.name:
            continue
        if pdf_path.name.startswith("力学练习") or pdf_path.name.startswith("波动光学练习"):
            pdf_paths.append(pdf_path)

    if not pdf_paths:
        print("No matching PDFs found in project root")
        return

    total = 0
    with tempfile.TemporaryDirectory(prefix="mineru-training-") as tmp:
        tmp_path = Path(tmp)
        results = run_mineru_api(pdf_paths)
        for pdf_path in pdf_paths:
            result = results.get(pdf_path.name)
            if result is None:
                print(f"No result returned for {pdf_path.name}")
                continue
            total += process_pdf(pdf_path, result, out_dir, public_img_dir, tmp_path)

    print(f"Total training questions generated: {total}")


if __name__ == "__main__":
    main()
