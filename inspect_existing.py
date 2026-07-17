import json
from pathlib import Path

existing_path = Path(r"c:\Users\vitoriga\AppData\Local\Temp\physics_questions\existing_all.json")
existing = json.loads(existing_path.read_text(encoding="utf-8"))

mc = [q for q in existing if q.get("type") == "multipleChoice"]
print(f"Total MC: {len(mc)}")
for i in range(45, 79):
    q = mc[i-1]
    print(f"{i}. [{q.get('category')}] {q['question'][:70]}")
