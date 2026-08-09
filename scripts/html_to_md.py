import os, re, html2text
from bs4 import BeautifulSoup

base = r"C:\Users\vitoriga\OneDrive\Desktop\CourseCore\数据库设计最佳实践"
files = {
    "TDSQL表结构设计最佳实践.html": "TDSQL表结构设计最佳实践.md",
    "数据库模式设计的最佳实践.html": "数据库模式设计的最佳实践.md",
    "关系型数据库设计实战指南.html": "关系型数据库设计实战指南.md",
}

def decode(raw):
    for enc in ("utf-8", "utf-8-sig", "gbk", "gb18030"):
        try:
            return raw.decode(enc)
        except Exception:
            continue
    return raw.decode("utf-8", "ignore")

def extract_main(soup):
    for sel in ["article", "#cnblogs_post_body", ".post-content", ".content", "main", "#content", ".blog-content", ".article-content"]:
        el = soup.select_one(sel)
        if el:
            return el
    return soup.body or soup

for src, dst in files.items():
    path = os.path.join(base, src)
    with open(path, "rb") as f:
        raw = f.read()
    soup = BeautifulSoup(decode(raw), "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header", "aside", "noscript", "iframe"]):
        tag.decompose()
    main = extract_main(soup)
    for el in main.select(".advertisement, .sidebar, .comments, #side, .post-ad, .ad, .recommended, .footer, .header, .nav"):
        el.decompose()
    h = html2text.HTML2Text()
    h.baseurl = ""
    h.body_width = 0
    h.ignore_links = False
    h.ignore_images = False
    h.single_line_break = False
    md = h.handle(str(main))
    md = re.sub(r"\n{3,}", "\n\n", md).strip()
    out = os.path.join(base, dst)
    with open(out, "w", encoding="utf-8") as f:
        f.write(md + "\n")
    print(f"{dst}: {len(md)} chars")
