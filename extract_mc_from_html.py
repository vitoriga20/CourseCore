import json
import re
from pathlib import Path

ROOT = Path(r"c:\Users\vitoriga\Downloads\物理试题")
HTML_PATH = ROOT / "index（顺序） (3).html"
OUT_PATH = Path(r"c:\Users\vitoriga\AppData\Local\Temp\physics_questions") / "mc_all.json"
OUT_PATH.parent.mkdir(parents=True, exist_ok=True)

text = HTML_PATH.read_text(encoding="utf-8")

# Extract the JS array between `const questionBankData = [` and `];`
match = re.search(r"const\s+questionBankData\s*=\s*(\[.*?\]);\s*$", text, re.MULTILINE | re.DOTALL)
if not match:
    raise RuntimeError("Could not find questionBankData array")

array_text = match.group(1)
# Replace single quotes? The file uses double quotes.
questions = json.loads(array_text)

# Normalize: add type, ensure options cleaned, answer uppercase
for q in questions:
    q["type"] = "multipleChoice"
    q["answer"] = str(q.get("answer", "")).strip().upper()
    q["options"] = [re.sub(r"^[（(][A-E][)）]\\s*", "", opt).strip().replace("；", ";").replace("。", ".") for opt in q["options"]]
    q["question"] = re.sub(r"\\s*（\\s*）\\s*$", "", q["question"]).strip()

OUT_PATH.write_text(json.dumps(questions, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Wrote {len(questions)} multiple-choice questions to {OUT_PATH}")
