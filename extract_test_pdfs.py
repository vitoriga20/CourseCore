from pathlib import Path
from pypdf import PdfReader

pdf_dir = Path(r"c:\Users\vitoriga\Downloads\物理试题")
out_dir = Path(r"c:\Users\vitoriga\AppData\Local\Temp\physics_pdf_text")
out_dir.mkdir(parents=True, exist_ok=True)

pdfs = ["力学综合测试.pdf", "波动光学综合测试.pdf"]
for name in pdfs:
    pdf_path = pdf_dir / name
    reader = PdfReader(str(pdf_path))
    parts = []
    for i, page in enumerate(reader.pages, start=1):
        text = page.extract_text()
        if text:
            parts.append(f"--- Page {i} ---\n{text}\n")
    raw_text = "\n".join(parts)
    out_path = out_dir / (pdf_path.stem + "_raw.txt")
    out_path.write_text(raw_text, encoding="utf-8")
    print(f"Wrote {out_path} ({len(reader.pages)} pages, {len(raw_text)} chars)")
