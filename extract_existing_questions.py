import json
import re
from pathlib import Path

ROOT = Path(r"c:\Users\vitoriga\Downloads\物理试题")
files = [
    ("index（顺序） (3).html", "multipleChoice"),
    ("index（填空题）.html", "fillInTheBlank"),
    ("index（解答题）.html", "problemSolving"),
]

all_questions = []
for filename, default_type in files:
    path = ROOT / filename
    text = path.read_text(encoding="utf-8")
    # Find questionBankData = [...]; or questionBankData = [{...}]
    m = re.search(r"const\s+questionBankData\s*=\s*(\[.*?\]);\s*\n", text, re.DOTALL)
    if not m:
        print(f"No match in {filename}")
        continue
    data_str = m.group(1)
    data = json.loads(data_str)
    for item in data:
        if "type" not in item:
            item["type"] = default_type
    all_questions.extend(data)
    print(f"{filename}: {len(data)} questions")

print(f"Total: {len(all_questions)}")
out_path = Path(r"c:\Users\vitoriga\AppData\Local\Temp\physics_questions\existing_all.json")
out_path.parent.mkdir(parents=True, exist_ok=True)
out_path.write_text(json.dumps(all_questions, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Wrote {out_path}")
