import json
from pathlib import Path

existing_path = Path(r"c:\Users\vitoriga\AppData\Local\Temp\physics_questions\existing_all.json")
existing = json.loads(existing_path.read_text(encoding="utf-8"))

# Print samples by category/type
from collections import Counter
print("Types:", Counter(q.get("type") for q in existing))
print("Categories:", Counter(q.get("category") for q in existing))

# Show last 30 multiple choice questions
print("\n--- Last multiple choice questions ---")
mc = [q for q in existing if q.get("type") == "multipleChoice"]
for i, q in enumerate(mc[-30:], start=len(mc)-29):
    print(f"{i}. [{q.get('category')}] {q['question'][:80]}...")
