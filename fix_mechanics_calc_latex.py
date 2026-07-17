import json
from pathlib import Path

path = Path(r"c:\Users\vitoriga\AppData\Local\Temp\physics_questions\mechanics_calc.json")

def fix_string(s):
    if not isinstance(s, str):
        return s
    # Repeatedly collapse pairs of backslashes until each LaTeX command has one backslash.
    while "\\\\" in s:
        s = s.replace("\\\\", "\\")
    return s

def fix_object(obj):
    if isinstance(obj, dict):
        return {k: fix_object(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [fix_object(item) for item in obj]
    return fix_string(obj)

data = json.loads(path.read_text(encoding="utf-8"))
data = fix_object(data)
path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Fixed {len(data)} mechanics calc questions")
