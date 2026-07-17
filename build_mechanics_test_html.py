import json
import shutil
import subprocess
from pathlib import Path

JSON_DIR = Path(r"c:\Users\vitoriga\AppData\Local\Temp\physics_questions")
SRC_JSON = JSON_DIR / "comprehensive_mixed.json"
BACKUP_JSON = JSON_DIR / "comprehensive_mixed.json.bak.test"
OUT_HTML = Path(r"c:\Users\vitoriga\Downloads\物理试题\index（力学综合测试）.html")

# Backup original
shutil.copy(SRC_JSON, BACKUP_JSON)

# Load and filter mechanics questions
data = json.loads(SRC_JSON.read_text(encoding="utf-8"))
mechanics = [q for q in data if q.get("category") == "力学"]
print(f"Filtered {len(mechanics)} mechanics questions")

# Write mechanics-only JSON to the path build_mixed_html.py expects
SRC_JSON.write_text(json.dumps(mechanics, ensure_ascii=False, indent=2), encoding="utf-8")

# Run the builder
subprocess.run(["python", "build_mixed_html.py"], cwd=r"c:\Users\vitoriga\Downloads\物理试题", check=True)

# Move output to test file
DEFAULT_OUT = Path(r"c:\Users\vitoriga\Downloads\物理试题\index（综合混合）.html")
shutil.move(DEFAULT_OUT, OUT_HTML)
print(f"Generated {OUT_HTML}")

# Restore original JSON
shutil.copy(BACKUP_JSON, SRC_JSON)
BACKUP_JSON.unlink()
print("Restored comprehensive_mixed.json")