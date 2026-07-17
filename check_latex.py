import json
import re
import sys
from pathlib import Path

DEFAULT_HTML = r"c:\Users\vitoriga\Downloads\物理试题\index（综合混合）.html"
html_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(DEFAULT_HTML)
html = html_path.read_text(encoding="utf-8")
m = re.search(r"const questionBankData = (\[.*?\]);", html, re.S)
if not m:
    print("no match")
    raise SystemExit
data = json.loads(m.group(1))
print("questions", len(data))

def math_segments(s):
    return [mm.group(1) for mm in re.finditer(r"\$([^$]+)\$", s)]

bad = []
for q in data:
    texts = [q.get("question", "")]
    if q.get("options"):
        texts += q["options"]
    for a in [q.get("answer", ""), q.get("solution", "")]:
        if a:
            texts.append(a)
    for t in texts:
        for seg in math_segments(t):
            if seg.count("{") != seg.count("}"):
                bad.append((q["id"], t, seg))
                break
            # commands with unclosed braces at end
            if re.search(r"\\[a-zA-Z]+\{[^}]*$", seg):
                bad.append((q["id"], t, seg))
                break
print("bad count", len(bad))
for bid, txt, seg in bad[:120]:
    print("id", bid, "seg", repr(seg))
