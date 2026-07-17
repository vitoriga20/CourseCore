import json
import re
import shutil
from pathlib import Path

ROOT = Path(r"c:\Users\vitoriga\Downloads\物理试题")
JSON_DIR = Path(r"c:\Users\vitoriga\AppData\Local\Temp\physics_questions")
EXISTING_JSON = JSON_DIR / "comprehensive_mixed.json"
OUT_JSON = JSON_DIR / "comprehensive_mixed.json"
ASSETS_DIR = ROOT / "assets"

MD_PATHS = {
    "力学": ROOT / "mineru_output" / "力学综合测试" / "力学综合测试" / "auto" / "力学综合测试.md",
    "波动光学": ROOT / "mineru_output" / "波动光学综合测试" / "波动光学综合测试" / "auto" / "波动光学综合测试.md",
}

AUTO_DIRS = {
    "力学": ROOT / "mineru_output" / "力学综合测试" / "力学综合测试" / "auto",
    "波动光学": ROOT / "mineru_output" / "波动光学综合测试" / "波动光学综合测试" / "auto",
}

TYPE_MAP = {
    "选择题": "multipleChoice",
    "填空题": "fillInTheBlank",
    "计算题": "problemSolving",
}

# Global OCR / text cleanups (apply before math splitting)
TEXT_FIXES = [
    ("线偏辰光", "线偏振光"),
    ("偏辰", "偏振"),
    ("v\uf076", r"$\vec{v}$"),
    ("a \uf072", r"$\vec{a}$"),
    ("v\uf06e", r"$\vec{v}$"),
    ("a \uf06e", r"$\vec{a}$"),
    ("\uf076", ""),
    ("\uf072", ""),
    ("\uf06e", ""),
    ("\u3000", " "),  # full-width space
    # Known OCR misreads in the mechanics paper
    ("a t= +3 2", "a=3+2t"),
]


def parse_sections(text: str):
    """Split markdown into sections by Chinese section headings."""
    sections = {}
    current = None
    for raw_line in text.splitlines():
        line = raw_line.rstrip()
        m = re.match(r"^##\s*[一二三四]、\s*(选择题|填空题|计算题)", line)
        if m:
            current = m.group(1)
            sections[current] = []
        elif current is not None:
            sections[current].append(line)
    return sections


def parse_items(section_lines: list):
    """Parse numbered questions from a section."""
    items = []
    current = None
    # Tolerate "12 ．", "12.", "12．" and extra spaces around the marker.
    start_re = re.compile(r"^\s*(\d+)\s*[．.\s]+\s*(.*)$")
    for line in section_lines:
        m = start_re.match(line)
        if m:
            if current is not None:
                items.append(current)
            current = {"number": int(m.group(1)), "lines": [m.group(2)]}
        elif current is not None:
            current["lines"].append(line)
    if current is not None:
        items.append(current)
    return items


IMG_RE = re.compile(r"!\[.*?\]\((.*?)\)")


def extract_images(text: str):
    paths = IMG_RE.findall(text)
    text_no_img = IMG_RE.sub("", text)
    return paths, text_no_img


OPTION_RE = re.compile(r"\s*[（(]([A-E])[）)]\s*")
TRAILING_PUNCT_RE = re.compile(r"[；。,\.]+\s*$")


def strip_trailing_punct(text: str) -> str:
    return TRAILING_PUNCT_RE.sub("", text).strip()


def split_options(text: str):
    """Split a multiple-choice question into stem and option list.

    Works whether options are inline or each on its own line.
    """
    matches = list(OPTION_RE.finditer(text))
    if not matches:
        return text, []
    stem = text[: matches[0].start()].strip()
    # Drop the empty "（ ）" marker at the end of the stem.
    stem = re.sub(r"\(\s*\)\s*$", "", stem).strip()
    options = []
    for i, m in enumerate(matches):
        letter = m.group(1)
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        opt_text = text[m.end() : end].strip()
        opt_text = strip_trailing_punct(opt_text)
        options.append((letter, opt_text))
    # Drop any trailing empty option caused by stray markers.
    options = [(l, t) for l, t in options if t]
    if not options:
        return text, []
    return stem, [t for _, t in options]


def collapse_lines(text: str):
    """Join lines with spaces, but keep line breaks before numbered sub-items."""
    text = re.sub(r"\n(?=\s*[（(]\d+[）)]\s*)", "\x00SUB\x00", text)
    text = re.sub(r"\s*\n+\s*", " ", text)
    text = text.replace("\x00SUB\x00", "\n")
    return text.strip()


def clean_math(s: str) -> str:
    s = s.strip()
    # Collapse spaces inside multi-digit numbers
    s = re.sub(r"(\d)\s+(\d)", r"\1\2", s)
    # Decimal points: "0 . 5" -> "0.5"
    s = re.sub(r"(\d)\s*\.\s*(\d)", r"\1.\2", s)
    # Sub/superscript braces
    s = re.sub(r"\s*(_|\^)\s*\{\s*", r"\1{", s)
    s = re.sub(r"\s*\}\s*", r"}", s)
    # Commands directly followed by { ( [:
    s = re.sub(r"\\([a-zA-Z]+)\s+([\{\(\[])", r"\\\1\2", s)
    # Collapse spaces inside \mathrm{...} and similar single-argument commands.
    def collapse_command_arg(m):
        cmd = m.group(1)
        arg = re.sub(r"\s+", "", m.group(2))
        return f"\\{cmd}{{{arg}}}"
    s = re.sub(r"\\([a-zA-Z]+)\s*\{\s*([^}]*)\s*\}", collapse_command_arg, s)
    # Remove scriptstyle markers left by OCR
    s = re.sub(r"\\(scriptstyle|scriptscriptstyle)\s*", "", s)
    # OCR sometimes renders absolute-value bars as empty delimiters
    s = s.replace(r"\left.", r"\left|")
    s = s.replace(r"\right.", r"\right|")
    # Collapse accidental double braces
    s = re.sub(r"\{\{+", "{", s)
    s = re.sub(r"\}\}+", "}", s)
    # Remove spaces after '{' and before '}'
    s = re.sub(r"\{\s+", "{", s)
    s = re.sub(r"\s+\}", "}", s)
    # MinerU reads the letter "v" as the Greek letter \nu / \upsilon in the mechanics paper.
    s = s.replace(r"\nu", r"v")
    s = s.replace(r"\upsilon", r"v")
    # A garbled "中心 O" sometimes becomes \iota\dot{\iota}\textit{O}
    s = re.sub(r"\\iota\\dot\{\\iota\}\\textit\{O\}", "O", s)
    # Operators without spaces
    s = re.sub(r"\s*([=+\-*/<>:])\s*", r"\1", s)
    # Specific OCR errors
    s = s.replace(r"\mathrm{lnm}", r"\mathrm{nm}")
    # Fix l_1 - l_1 = 3 lambda -> l_2 - l_1 = 3 lambda
    s = s.replace(r"l_1-l_1=3\lambda", r"l_2-l_1=3\lambda")
    s = s.replace(r"l_{1}-l_{1}=3\lambda", r"l_{2}-l_{1}=3\lambda")
    # Remove stray \} after subscript i_0\}
    s = re.sub(r"(_\{0\}|_0)\\\}", r"\1", s)
    # Drop stray \circ at end of a math segment unless it is a degree (preceded by ^)
    s = re.sub(r"(?<!\^)\\circ\s*$", "", s)
    # Collapse remaining multiple spaces
    s = re.sub(r"\s+", " ", s)
    return s.strip()


def clean_text(text: str) -> str:
    for old, new in TEXT_FIXES:
        text = text.replace(old, new)
    # Fix a known MinerU garble: "（ $\mathrm { \Omega _ { 1 n m = 1 0 } - } ^ { 9 } \mathrm { m } \mathrm { ) }$ ）"
    text = re.sub(
        r"（\s*\$\s*\\mathrm\s*\{\s*\\Omega[^}]*\}\s*\^\s*\{\s*9\s*\}\s*\\mathrm\s*\{\s*m\s*\}\s*\\mathrm\s*\{\s*\)\s*\}\s*\$\s*）",
        r"(1\\,\\mathrm{nm}=10^{-9}\\,\\mathrm{m})",
        text,
    )
    # Normalize full-width parens outside math
    text = text.replace("（", "(")
    text = text.replace("）", ")")
    # Remove question ID codes like (xz1000A000009225)
    text = re.sub(r"\s*\([a-z]{2}\d+[A-Z]\d+\)\s*", " ", text)
    # Remove stray '\}' not in math
    text = re.sub(r"\\\}", "", text)
    # Remove spaces between CJK characters/punctuation introduced by OCR/MinerU.
    text = re.sub(r"(?<=[\u4e00-\u9fff\u3000-\u303f])\s+(?=[\u4e00-\u9fff\u3000-\u303f])", "", text)
    # Collapse whitespace
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def process_math_in_text(text: str) -> str:
    """Apply clean_math to each $...$ segment."""
    result = []
    i = 0
    while i < len(text):
        idx = text.find("$", i)
        if idx == -1:
            result.append(text[i:])
            break
        result.append(text[i:idx])
        nxt = text.find("$", idx + 1)
        if nxt == -1:
            result.append(text[idx:])
            break
        math = text[idx + 1:nxt]
        result.append(f"${clean_math(math)}$")
        i = nxt + 1
    return "".join(result)


def clean_question(text: str):
    text = collapse_lines(text)
    # Preserve sub-item line breaks while cleaning
    text = text.replace("\n", "\x00NL\x00")
    text = clean_text(text)
    text = text.replace("\x00NL\x00", "\n")
    text = process_math_in_text(text)
    return text.strip()


def parse_md_for_category(category: str):
    md_path = MD_PATHS[category]
    auto_dir = AUTO_DIRS[category]
    text = md_path.read_text(encoding="utf-8")
    sections = parse_sections(text)
    result = {}
    for sec_name, sec_lines in sections.items():
        qtype = TYPE_MAP[sec_name]
        raw_items = parse_items(sec_lines)
        parsed = []
        for item in raw_items:
            raw_text = "\n".join(item["lines"])
            img_paths, raw_text = extract_images(raw_text)
            raw_text = clean_question(raw_text)
            entry = {
                "number": item["number"],
                "question": raw_text,
                "options": [],
                "image_src": img_paths[0] if img_paths else None,
            }
            if qtype == "multipleChoice":
                stem, options = split_options(raw_text)
                if options:
                    entry["question"] = clean_question(stem)
                    entry["options"] = [clean_question(opt) for opt in options]
                else:
                    entry["options"] = []
            parsed.append(entry)
        result[qtype] = parsed
    return result, auto_dir


def main():
    existing = json.loads(EXISTING_JSON.read_text(encoding="utf-8"))
    # Backup previous JSON.
    backup = EXISTING_JSON.with_suffix(".json.bak")
    backup.write_text(json.dumps(existing, ensure_ascii=False, indent=2), encoding="utf-8")

    parsed_data = {}
    auto_dirs = {}
    for cat in ["力学", "波动光学"]:
        parsed_data[cat], auto_dirs[cat] = parse_md_for_category(cat)
        for t, items in parsed_data[cat].items():
            print(f"Parsed {cat} {t}: {len(items)} items")

    # Build a lookup by (category, type, original number).
    parsed_map = {}
    section_starts = {}
    for cat, types in parsed_data.items():
        for t, items in types.items():
            nums = [it["number"] for it in items]
            section_starts[(cat, t)] = min(nums) if nums else 1
            for it in items:
                parsed_map[(cat, t, it["number"])] = it

    counters = {
        ("力学", "multipleChoice"): 0,
        ("力学", "fillInTheBlank"): 0,
        ("力学", "problemSolving"): 0,
        ("波动光学", "multipleChoice"): 0,
        ("波动光学", "fillInTheBlank"): 0,
        ("波动光学", "problemSolving"): 0,
    }

    mismatches = []
    ASSETS_DIR.mkdir(parents=True, exist_ok=True)

    updated = 0
    for q in existing:
        key = (q["category"], q["type"])
        expected_num = counters[key] + section_starts[key]
        parsed = parsed_map.get(key + (expected_num,))
        counters[key] += 1
        if not parsed:
            mismatches.append(f"{key} #{expected_num} not found in MinerU output")
            continue
        q["question"] = parsed["question"]
        if parsed["options"]:
            q["options"] = parsed["options"]
        else:
            q.pop("options", None)
        if parsed.get("image_src"):
            q["_image_src"] = parsed["image_src"]
        else:
            q.pop("image", None)
        updated += 1

    copied = 0
    for q in existing:
        src_name = q.pop("_image_src", None)
        if not src_name:
            continue
        auto_dir = auto_dirs[q["category"]]
        src = auto_dir / src_name
        dest_name = f"q{q['id']:03d}.jpg"
        dest = ASSETS_DIR / dest_name
        if src.exists():
            shutil.copy2(src, dest)
            copied += 1
            q["image"] = f"assets/{dest_name}"
        else:
            mismatches.append(f"Image not found: {src}")

    # Validate multiple-choice answers still fit within the parsed options.
    for q in existing:
        if q.get("type") == "multipleChoice" and q.get("options"):
            ans = str(q.get("answer", "")).strip().upper()
            letters = [chr(ord("A") + i) for i in range(len(q["options"]))]
            if ans and ans not in letters:
                mismatches.append(
                    f"MC answer out of range: id={q['id']} answer={ans} options={letters}"
                )

    OUT_JSON.write_text(json.dumps(existing, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Updated {updated}/{len(existing)} questions in {OUT_JSON}")
    print(f"Copied {copied} images to {ASSETS_DIR}")
    if mismatches:
        print("Mismatches/Warnings:")
        for m in mismatches:
            print(" -", m)


if __name__ == "__main__":
    main()
