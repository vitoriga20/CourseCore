import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

async def main():
    html_path = Path(r"c:\Users\vitoriga\Downloads\物理试题\index（综合混合）.html").resolve().as_uri()
    errors = []
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        page.on("console", lambda msg: errors.append(msg.text) if "mathjax" in msg.text.lower() or "tex" in msg.text.lower() else None)
        page.on("pageerror", lambda err: errors.append(str(err)))
        await page.goto(html_path, wait_until="networkidle")
        for i in range(76):
            sel = f'.nav-btn[data-index="{i}"]'
            try:
                await page.click(sel, timeout=2000)
            except Exception as e:
                print(f"click {i} failed: {e}")
                continue
            await page.wait_for_timeout(120)
        await page.wait_for_timeout(800)
        await browser.close()
    if errors:
        print("MathJax/Tex errors:")
        for e in errors[:40]:
            print(" -", e)
    else:
        print("No MathJax/Tex console errors detected.")

asyncio.run(main())
