from pathlib import Path
from pypdf import PdfReader

pdf_dir = Path(r"c:\Users\vitoriga\Downloads\物理试题")
out_dir = Path(r"c:\Users\vitoriga\AppData\Local\Temp\physics_pdf_text")
out_dir.mkdir(parents=True, exist_ok=True)

mechanics_pdfs = sorted(pdf_dir.glob("力学*.pdf"))
print(f"Found {len(mechanics_pdfs)} mechanics PDFs")

for pdf_path in mechanics_pdfs:
    reader = PdfReader(str(pdf_path))
    parts = []
    for i, page in enumerate(reader.pages, start=1):
        text = page.extract_text()
        if text:
            parts.append(f"--- Page {i} ---\n{text}\n")
    raw_text = "\n".join(parts)
    out_name = pdf_path.stem + "_raw.txt"
    out_path = out_dir / out_name
    out_path.write_text(raw_text, encoding="utf-8")
    print(f"Wrote {out_path} ({len(reader.pages)} pages)")
