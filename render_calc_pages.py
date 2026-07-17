import fitz
from pathlib import Path

pdf_dir = Path(r"c:\Users\vitoriga\Downloads\物理试题")
out_dir = Path(r"c:\Users\vitoriga\AppData\Local\Temp\physics_pdf_images")
out_dir.mkdir(parents=True, exist_ok=True)

# (filename, 0-based page indices to render)
pages_to_render = {
    "力学练习一.pdf": [1],
    "力学练习二.pdf": [1],
    "力学练习三.pdf": [1],
    "力学练习四.pdf": [1],
    "力学练习五.pdf": [1],
    "力学练习六.pdf": [1],
    "力学练习七.pdf": [1],
    "力学综合测试.pdf": [6, 7, 8, 9, 10],
}

zoom = 2
mat = fitz.Matrix(zoom, zoom)

for filename, pages in pages_to_render.items():
    doc = fitz.open(pdf_dir / filename)
    for p in pages:
        page = doc.load_page(p)
        pix = page.get_pixmap(matrix=mat)
        out_name = f"{Path(filename).stem}_p{p+1}.png"
        out_path = out_dir / out_name
        pix.save(out_path)
        print(f"Saved {out_path}")
