import json
import shutil
from pathlib import Path

from parse_mineru_to_json import parse_md_for_category, AUTO_DIRS

ROOT = Path(r"c:\Users\vitoriga\Downloads\物理试题")
JSON_DIR = Path(r"c:\Users\vitoriga\AppData\Local\Temp\physics_questions")
EXISTING_JSON = JSON_DIR / "comprehensive_mixed.json"
OUT_JSON = JSON_DIR / "comprehensive_mixed.json"
ASSETS_DIR = ROOT / "assets"


def main():
    existing = json.loads(EXISTING_JSON.read_text(encoding="utf-8"))

    parsed_data = {}
    auto_dirs = {}
    for cat in ["力学", "波动光学"]:
        parsed_data[cat], auto_dirs[cat] = parse_md_for_category(cat)

    # Build lookup by (category, type, original section number).
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

    ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    copied = 0
    mismatches = []

    for q in existing:
        key = (q["category"], q["type"])
        expected_num = counters[key] + section_starts[key]
        counters[key] += 1
        parsed = parsed_map.get(key + (expected_num,))
        if not parsed:
            mismatches.append(f"{key} #{expected_num} not found in MinerU output")
            continue
        src_name = parsed.get("image_src")
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

    OUT_JSON.write_text(json.dumps(existing, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Updated {len(existing)} questions, copied {copied} images to {ASSETS_DIR}")
    if mismatches:
        print("Warnings:")
        for m in mismatches:
            print(" -", m)


if __name__ == "__main__":
    main()