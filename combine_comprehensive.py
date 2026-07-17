import json
from pathlib import Path

ROOT = Path(r"c:\Users\vitoriga\Downloads\物理试题")
JSON_DIR = Path(r"c:\Users\vitoriga\AppData\Local\Temp\physics_questions")

# Load existing all
existing = json.loads((JSON_DIR / "existing_all.json").read_text(encoding="utf-8"))
mc = [q for q in existing if q.get("type") == "multipleChoice"]

# 力学综合测试 MC: existing 48-64 (17 questions)
mechanics_mc = mc[47:64]
# 波动光学综合测试 MC: existing 65-78 (14 questions)
optics_mc = mc[64:78]

# Add type explicitly
for q in mechanics_mc:
    q["type"] = "multipleChoice"
for q in optics_mc:
    q["type"] = "multipleChoice"

print(f"Mechanics MC: {len(mechanics_mc)}")
print(f"Optics MC: {len(optics_mc)}")

# Load parsed fill-in and problem-solving
mechanics_fillin = json.loads(Path(r"c:\Users\vitoriga\AppData\Local\Temp\physics_questions\mechanics_comprehensive_fillin.json").read_text(encoding="utf-8"))
mechanics_calc = json.loads(Path(r"c:\Users\vitoriga\AppData\Local\Temp\physics_questions\mechanics_comprehensive_calc.json").read_text(encoding="utf-8"))
optics_fillin = json.loads(Path(r"c:\Users\vitoriga\AppData\Local\Temp\physics_questions\optics_comprehensive_fillin.json").read_text(encoding="utf-8"))
optics_calc = json.loads(Path(r"c:\Users\vitoriga\AppData\Local\Temp\physics_questions\optics_comprehensive_calc.json").read_text(encoding="utf-8"))

print(f"Mechanics fill-in: {len(mechanics_fillin)}")
print(f"Mechanics calc: {len(mechanics_calc)}")
print(f"Optics fill-in: {len(optics_fillin)}")
print(f"Optics calc: {len(optics_calc)}")

# Combine: 力学 first (MC, fill-in, calc) then 光学 (MC, fill-in, calc)
all_questions = []
all_questions.extend(mechanics_mc)
all_questions.extend(mechanics_fillin)
all_questions.extend(mechanics_calc)
all_questions.extend(optics_mc)
all_questions.extend(optics_fillin)
all_questions.extend(optics_calc)

print(f"Total: {len(all_questions)}")

# Save combined JSON
out_path = JSON_DIR / "comprehensive_mixed.json"
out_path.write_text(json.dumps(all_questions, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Wrote {out_path}")
