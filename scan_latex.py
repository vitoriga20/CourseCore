import json
import re
from pathlib import Path

html = Path(r"c:\Users\vitoriga\Downloads\物理试题\index（综合混合）.html").read_text(encoding="utf-8")
m = re.search(r"const questionBankData = (\[.*?\]);", html, re.S)
data = json.loads(m.group(1))

suspicious = [
    r"\mathord",
    r"\vphantom",
    r"\kern-",
    r"\mathrm{~",
    r"\t{",
    r"{\frac",
    r"{\mathrm",
    r"\iota",
    r"\upsilon",
    r"\nu",
    r"{'}",
    r"{=}",
]

for q in data:
    texts = [q.get("question", "")]
    if q.get("options"):
        texts += q["options"]
    for a in [q.get("answer", ""), q.get("solution", "")]:
        if a:
            texts.append(a)
    for t in texts:
        for seg in re.finditer(r"\$([^$]+)\$", t):
            s = seg.group(1)
            for pat in suspicious:
                if pat in s:
                    print("id", q["id"], "pat", pat, "seg", repr(s))
                    break
