#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
解析 MinerU 提取的试卷 markdown → 结构化题目 MD（与 Supabase exam_* 表字段对应）

输入: 题库/.mineru-raw/<试卷名>/<试卷名>.md
输出: 题库/高数/*.md, 题库/线代/*.md
格式: YAML 头(试卷元数据) + 章节(## ) + 题目块(### Q{n} + 字段列表)
"""
import os
import re
import sys
import unicodedata
from pathlib import Path

RAW_ROOT = Path(__file__).resolve().parent.parent / "题库" / ".mineru-raw"
OUT_ROOT = Path(__file__).resolve().parent.parent / "题库"

# 章节序号: 一(0) 二(1) 三(2) 四(3) 五(4) 六(5) ...
CN_NUM = {"一": 0, "二": 1, "三": 2, "四": 3, "五": 4, "六": 5, "七": 6, "八": 7, "九": 8, "十": 9}

# 题目类型 (与 exam_questions.question_type 一致)
QT_SINGLE = 0   # 单选
QT_MULTI = 1    # 多选
QT_BLANK = 2    # 填空
QT_CALC = 3     # 计算/解答/应用
QT_PROOF = 4    # 证明
QT_JUDGE = 5    # 判断


def clean_text(s: str) -> str:
    """清理 OCR 残留: 替换占位符、合并空白"""
    s = s.replace("\ufffd", "").replace("\uFFFD", "")
    s = re.sub(r"[\uD800-\uDFFF]", "", s)  # 孤立的 surrogate
    # 合并多个空格为一个(但保留 $...$ 内 LaTeX 的空格结构)
    s = re.sub(r"[ \t]{2,}", " ", s)
    return s.strip()


# 章节标题后的"说明/得分"文字(不是题目)的特征
INSTRUCTION_PATTERNS = [
    r"共\s*\d+\s*分",            # 共20分
    r"每小题\s*\d+\s*分",         # 每小题4分
    r"每题\s*\d+\s*分",           # 每题10分
    r"共计?\s*\d+\s*小题",        # 共计5小题
    r"本大题总分\s*\d+\s*分",      # 本大题总分20分
    r"请将\S+写在答题纸上",        # 请将答案写在答题纸上
    r"只有一项是符合题目要求的",
    r"下列每小题给出的四个选项中",
    r"^\d{1,3}\s*[～~\-至]\s*\d{1,3}\s*小题",  # 11~17小题 / 6~10小题
    r"^\d{1,3}\s*[～~\-至]\s*\d{1,3}",         # 1～5
]


def is_instruction_text(t: str) -> bool:
    """判断是否为章节后的说明文字(非题目)"""
    for pat in INSTRUCTION_PATTERNS:
        if re.search(pat, t):
            return True
    return False


def strip_score_annotations(t: str) -> str:
    """去掉章节标题后紧跟的得分/括号标注"""
    changed = True
    while changed:
        changed = False
        # （本大题总分20分，共计5小题，每题4分）/ （正确画√，错误画×） / （10分） / (2'×5=10')
        m = re.match(r"^[（(][^（()]*[)）]", t)
        if m:
            t = t[m.end():].strip()
            changed = True
            continue
        # $ (2' × 5 = 10') $  (LaTeX \times 版) 或 $(2'*5=10')$
        m = re.match(
            r"^\$\s*[（(]?\s*\d+\s*['′]\s*(?:[×x*]|\\times)\s*\d+\s*=\s*\d+\s*['′]\s*[)）]?\s*\$",
            t)
        if m:
            t = t[m.end():].strip()
            changed = True
            continue
        # $10'$ 或 (10') 单个得分标注
        m = re.match(r"^\$\s*[（(]?\s*\d+\s*['′]\s*[)）]?\s*\$|^[（(]\s*\d+\s*['′]\s*[)）]", t)
        if m:
            t = t[m.end():].strip()
            changed = True
            continue
        # （本题满分8分）/ （本题总分10分）/ （10分）
        m = re.match(r"^[（(]\s*本?题?(满分|总分|共)?\s*\d+\s*分\s*[)）]?", t)
        if m:
            t = t[m.end():].strip()
            changed = True
            continue
        # 孤立 $
        if t == "$" or t.startswith("$)"):
            t = t.lstrip("$").lstrip(")").strip()
            changed = True
            continue
        # 开头冒号
        if t.startswith(("：", ":", "；", ";")):
            t = t[1:].strip()
            changed = True
    return t


def strip_math_safe(text: str):
    """把 $...$/$$...$$ 片段替换为占位符, 返回 (清理后的文本, 占位映射列表)"""
    placeholders = []
    def repl(m):
        placeholders.append(m.group(0))
        return f"\x00{len(placeholders)-1}\x00"
    t = re.sub(r"\$\$.*?\$\$|\$.*?\$", repl, text, flags=re.S)
    return t, placeholders


def split_options(content: str):
    """
    从单选/多选题目内容中拆出选项列表。
    支持 (A)...(B)... / A. ... B. ... 两种标记(行内或跨行)。
    返回 (stem, options); options 为 ['A. xxx', ...] 或 [] 表示未识别到。
    """
    # 保护数学片段
    protected, placeholders = strip_math_safe(content)
    markers = []
    # 模式1: (A) (B) (C) (D)
    for m in re.finditer(r"[（(]\s*([A-Ha-h])\s*[)）]", protected):
        markers.append((m.start(), m.group(1).upper()))
    # 模式2: A. / A． (点号; 最可靠, 行内/跨行均可)
    if len(markers) == 0:
        for m in re.finditer(r"(?<![A-Za-z$])([A-Ha-h])[.．]\s*", protected):
            markers.append((m.start(), m.group(1).upper()))
    # 模式3: A、 (顿号; 仅当题干以括号结尾后才是选项起始, 避免 "α₁、α₂…" / "A、B、C 为…" 误判)
    if len(markers) == 0:
        # 在 protected 空间查找括号结尾位置
        bracket_end_positions = [m.end() for m in re.finditer(
            r"（\s*[\\_、.．\s\d]*\s*）|（\s*）|\(\s*\)",
            protected)]
        # 被 strip_math_safe 替换的数学占位符里可能含 (\quad) 等括号
        # 把这类占位符的结束位置也视为括号结尾
        for idx, ph in enumerate(placeholders):
            if re.search(r"\\quad|\(\s*\)|（\s*）", ph):
                mkr = f"\x00{idx}\x00"
                pos = protected.find(mkr)
                if pos >= 0:
                    bracket_end_positions.append(pos + len(mkr))
        for m in re.finditer(r"(?<![A-Za-z$])([A-Ha-h])[、]\s*", protected):
            pos = m.start()
            # 该顿号必须位于最近一个括号结尾之后(允许空白)
            if any(b_pos <= pos for b_pos in bracket_end_positions):
                markers.append((pos, m.group(1).upper()))
    if len(markers) < 2:
        return content.strip(), []
    markers.sort()
    # 去重(同一位置)
    dedup = []
    for pos, letter in markers:
        if not dedup or dedup[-1][0] != pos:
            dedup.append((pos, letter))
    markers = dedup
    # 按顺序取 A B C D... 直到字母序列中断
    expected = 0
    valid = []
    for pos, letter in markers:
        if ord(letter) - ord("A") == expected:
            valid.append((pos, letter))
            expected += 1
        elif expected == 0 and ord(letter) - ord("A") > 0:
            # 起始字母不是A(可能选项前有别的文本), 跳过
            continue
        else:
            break
    if len(valid) < 2:
        return content.strip(), []
    stem_end = valid[0][0]
    stem = protected[:stem_end].strip()
    opts = []
    for i, (pos, letter) in enumerate(valid):
        end = valid[i + 1][0] if i + 1 < len(valid) else len(protected)
        seg = protected[pos:end].strip()
        # 若最后一段里又出现 (A) 或 A. 重启标记(下一题的选项), 截断丢弃。
        # 注意: 先剥掉本段开头的 (D) 标记, 避免把自身误判为重启。
        if i == len(valid) - 1:
            seg_head = seg
            seg_nohead = re.sub(r"^[（(]\s*[A-Ha-h]\s*[)）]\s*", "", seg_head)
            if seg_nohead == seg_head:
                seg_nohead = re.sub(r"^[A-Ha-h][.．]\s*", "", seg_head)
            # 重启标记: 括号(A) 或 点号A. (顿号不算, 避免题干列举误判)
            m_restart = re.search(
                r"[（(]\s*[A-Ha-h]\s*[)）]|(?<![A-Za-z$])([A-Ha-h])[.．]\s*", seg_nohead)
            if m_restart:
                seg = seg[:m_restart.start() + (len(seg) - len(seg_nohead))].strip()
        seg = re.sub(r"^[（(]\s*[A-Ha-h]\s*[)）]\s*", f"{letter}. ", seg)
        seg = re.sub(r"^[A-Ha-h][.．、]\s*", f"{letter}. ", seg)
        opts.append(seg)
    # 恢复数学片段
    def restore(seg):
        return re.sub(r"\x00(\d+)\x00", lambda mm: placeholders[int(mm.group(1))], seg).strip()
    return restore(stem), [restore(o) for o in opts]


def section_type(name: str) -> int:
    """根据章节名判定题型"""
    if "多选" in name:
        return QT_MULTI
    if "判断" in name:
        return QT_JUDGE
    if "填空" in name:
        return QT_BLANK
    if "证明" in name:
        return QT_PROOF
    if "计算" in name or "解答" in name or "应用" in name:
        return QT_CALC
    if "选择" in name:
        return QT_SINGLE
    return QT_SINGLE


# 章节标题行: [## ] 一、单项选择题：... 或 四、证明题：（10分）... 或 二、填空题 $(5'\times4=20')$
SECTION_RE = re.compile(
    r"^(?P<hash>#{1,2}\s*)?(?P<cn>[一二三四五六七八九十]+)[、.．]\s*"
    r"(?P<name>[^：:（($]*?)(?P<sep>[：:（($]|$)"
)
# 题目编号行: 1. / 6. / 1、 / 12．
QNUM_RE = re.compile(r"^(\d{1,3})[.．、]\s*")
# 试卷分割(汇总文件用)
PAPER_SPLIT_RE = re.compile(r"^#\s*长沙理工大学考试试卷")


def split_papers(lines):
    """把 markdown 行按试卷分割(用于汇总文件), 单卷文件返回整体"""
    idxs = [i for i, ln in enumerate(lines) if PAPER_SPLIT_RE.match(ln)]
    if len(idxs) <= 1:
        return [lines]
    papers = []
    for k, start in enumerate(idxs):
        end = idxs[k + 1] if k + 1 < len(idxs) else len(lines)
        papers.append(lines[start:end])
    return papers


def split_midline_questions(ln: str) -> list:
    """把一行内 '…的值；2. 设…' 拆成多行(仅当分号后跟题号)。数学片段受保护。"""
    protected, placeholders = strip_math_safe(ln)
    parts = re.split(r"[；;]\s*(?=\d{1,3}[.．、])", protected)
    if len(parts) <= 1:
        return [ln]
    out = []
    for p in parts:
        restored = re.sub(r"\x00(\d+)\x00", lambda mm: placeholders[int(mm.group(1))], p)
        out.append(restored.strip())
    return out


def parse_paper(lines, paper_no=None):
    """解析一份试卷: 返回 dict(meta, sections[ {title, qtype, questions[ {no, content, options}] } ])"""
    sections = []
    cur = None  # 当前章节
    pending = []  # 当前题目累积行
    in_math_block = False
    math_block_buf = []
    first_question_no = None

    def flush_question():
        nonlocal pending
        text = "\n".join(pending).strip()
        pending = []
        if not text:
            return None
        return text

    def flush_section():
        nonlocal cur
        if cur is None:
            return
        qtext = flush_question()
        if qtext:
            cur["questions"].append(new_question(qtext, cur))
        sections.append(cur)
        cur = None

    def new_question(qtext, sec):
        qtype = sec["qtype"]
        # 去掉行首题号 "1. " / "6．"
        qtext = re.sub(r"^\d{1,3}[.．、]\s*", "", qtext).strip()
        if qtype == QT_JUDGE:
            stem, _ = split_options(qtext)
            # 去掉末尾的 (  ) 记号
            stem = re.sub(r"[（(]\s*[)）]\s*$", "", stem)
            return {"no": None, "content": stem.strip(), "options": ["正确", "错误"]}
        stem, opts = split_options(qtext)
        return {"no": None, "content": stem.strip(), "options": opts}

    for raw in lines:
        ln = raw.rstrip("\n")
        stripped = ln.strip()
        # 数学块状态机
        if in_math_block:
            math_block_buf.append(ln)
            if stripped.startswith("$$") or re.search(r"\$\$$", ln):
                in_math_block = False
                if pending:
                    pending.append("\n".join(math_block_buf))
                math_block_buf = []
            continue
        if stripped.startswith("$$"):
            in_math_block = True
            math_block_buf = [ln]
            continue
        # 页码残留: "## 第 1 页（共 2 页）" / "第 1 页 / 共 2 页" — 忽略, 归入上一章节
        if re.match(r"^#{1,2}\s*第\s*\d+\s*页", stripped) or re.match(r"^第\s*\d+\s*页", stripped):
            if cur is not None:
                # 若当前章节已有内容则跳过; 空内容时也跳过
                pass
            continue
        # 章节标题行
        m = SECTION_RE.match(stripped)
        if m:
            flush_section()
            name = m.group("name").strip()
            cn = m.group("cn")
            if not name:  # 如 "一、" 单独一行
                continue
            cur = {"title": f"{cn}、{name}", "qtype": section_type(name),
                   "questions": [], "last_no": 0}
            # sep 可能是 （ ( 等, 其后的文字可能是说明也可能直接是题目
            # 把左括号还回去, 让 strip_score_annotations 能成对剥掉 "（正确画√，错误画×）"
            tail = stripped[m.end():]
            if m.group("sep") in ("（", "("):
                tail = m.group("sep") + tail
            rest = strip_score_annotations(tail.strip())
            # 若剩余文字只是说明(如 "1～5小题, 每小题4分..."), 不作为题目
            if rest and not is_instruction_text(rest):
                pending.append(rest)
            continue
        # 题目编号行(支持一行多个题目: "…；2. 设…")
        for sub in split_midline_questions(ln):
            sub_stripped = sub.strip()
            qm = QNUM_RE.match(sub_stripped)
            if qm and cur is not None:
                no = int(qm.group(1))
                # 题号比上一题小 → 子问题(如 6 题下的小问 1. 2.), 合并进当前题
                if cur["last_no"] and no <= cur["last_no"] and cur["questions"]:
                    pending.append(sub_stripped)
                    continue
                qtext = flush_question()
                if qtext:
                    cur["questions"].append(new_question(qtext, cur))
                cur["last_no"] = no
                pending.append(sub_stripped)
                continue
            # 普通行
            if cur is not None:
                if sub_stripped:
                    pending.append(sub_stripped)
    flush_section()
    return sections


def make_title_from(content: str, fallback: str = "") -> str:
    """从题干提取短标题(去掉公式/题号后取前15字)"""
    t, _ = strip_math_safe(content)
    t = re.sub(r"\x00\d+\x00", "", t)          # 数学占位符
    t = re.sub(r"^\d{1,3}[.．、]\s*", "", t)     # 题号
    t = re.sub(r"\s+", "", t)
    t = re.sub(r"[（(]\s*[)）]\s*$", "", t)
    t = t.strip(" ，。．、：:；;")
    if len(t) > 15:
        t = t[:15]
    return t if t else fallback


def emit_md(paper_meta, sections, questions_total):
    """生成结构化 md 文本"""
    lines = []
    lines.append("---")
    for k, v in paper_meta.items():
        if isinstance(v, str):
            lines.append(f'{k}: "{v}"')
        else:
            lines.append(f"{k}: {v}")
    lines.append("---")
    lines.append("")
    lines.append(f"# {paper_meta['title']}")
    lines.append("")
    qidx = 0
    for sec in sections:
        lines.append(f"## {sec['title']}")
        lines.append("")
        for q in sec["questions"]:
            qidx += 1
            lines.append(f"### Q{qidx}")
            lines.append("")
            lines.append(f"- **question_type**: {sec['qtype']}")
            lines.append(f"- **title**: {make_title_from(q['content'])}")
            lines.append(f"- **content**: {q['content']}")
            lines.append("- **options**:")
            if q["options"]:
                for o in q["options"]:
                    lines.append(f"  - {o}")
            else:
                lines.append("  []")
            lines.append("- **answer**: 暂无答案")
            lines.append("- **answers**: []")
            lines.append("- **solution**: 暂无答案")
            lines.append("- **difficulty**: 2")
            lines.append("- **tags**: []")
            lines.append(f"- **source**: {paper_meta['title']}")
            lines.append("")
    return "\n".join(lines)


def get_paper_number(lines):
    """从头部提取试卷编号"""
    for ln in lines[:20]:
        m = re.search(r"试卷编号[_\s]*(\d+)", ln)
        if m:
            return int(m.group(1))
    return None


def main():
    # 高数: 每份 PDF 一个文件
    gaoshu = [
        "2019长沙理工大学高数A（二）期末",
        "2020长沙理工大学高数A（二）期末",
        "2021长沙理工大学高数A（二）期末",
        "2022长沙理工大学高数A（二）期末",
        "2023长沙理工大学高数A（二）期末",
        "2024长沙理工大学高数A（二）期末",
        "2025长沙理工大学高数A（二）期末",
        "2026年5月长沙理工大学高数A（二）重修期末",
    ]
    xianshu_single = ["线性代数【本部期末】（第一套）"]
    xianshu_multi = ["长理线代期末试卷汇总(1)"]

    report = []
    (OUT_ROOT / "高数").mkdir(parents=True, exist_ok=True)
    (OUT_ROOT / "线代").mkdir(parents=True, exist_ok=True)

    for name in gaoshu:
        md = RAW_ROOT / name / f"{name}.md"
        if not md.exists():
            report.append(f"!! 缺失: {md}")
            continue
        sections = parse_paper(md.read_text(encoding="utf-8").splitlines())
        year = re.search(r"(20\d{2})", name)
        year = year.group(1) if year else "20XX"
        is_retake = "重修" in name
        meta = {
            "id": f"exam-calculus-2-{year}{'-retake' if is_retake else ''}",
            "school": "长沙理工大学",
            "college": "",
            "subject": "高等数学A（二）",
            "term": f"{year}年5月重修期末" if is_retake else f"{year}年期末",
            "duration": "",
            "source_pdf": f"高数/{name}.pdf",
            "title": name,
        }
        total = sum(len(s["questions"]) for s in sections)
        content = emit_md(meta, sections, total)
        (OUT_ROOT / "高数" / f"{name}.md").write_text(content, encoding="utf-8")
        report.append(f"高数/{name}.md  ({total} 题)")

    for name in xianshu_single:
        md = RAW_ROOT / name / f"{name}.md"
        if not md.exists():
            report.append(f"!! 缺失: {md}")
            continue
        sections = parse_paper(md.read_text(encoding="utf-8").splitlines())
        meta = {
            "id": "exam-linear-algebra-final-1",
            "school": "长沙理工大学",
            "college": "",
            "subject": "线性代数",
            "term": "本部期末（第一套）",
            "duration": "",
            "source_pdf": f"线代/{name}.pdf",
            "title": name,
        }
        total = sum(len(s["questions"]) for s in sections)
        content = emit_md(meta, sections, total)
        (OUT_ROOT / "线代" / f"{name}.md").write_text(content, encoding="utf-8")
        report.append(f"线代/{name}.md  ({total} 题)")

    for name in xianshu_multi:
        md = RAW_ROOT / name / f"{name}.md"
        if not md.exists():
            report.append(f"!! 缺失: {md}")
            continue
        papers = split_papers(md.read_text(encoding="utf-8").splitlines())
        report.append(f"-- {name}: 拆分为 {len(papers)} 份试卷 --")
        for pi, plines in enumerate(papers, 1):
            pno = get_paper_number(plines)
            pno = pno if pno else pi
            sections = parse_paper(plines)
            meta = {
                "id": f"exam-linear-algebra-set-{pno:02d}",
                "school": "长沙理工大学",
                "college": "",
                "subject": "线性代数",
                "term": f"试卷编号{pno}",
                "duration": "",
                "source_pdf": f"线代/{name}.pdf",
                "title": f"长理线代期末试卷汇总-第{pno:02d}套",
            }
            total = sum(len(s["questions"]) for s in sections)
            content = emit_md(meta, sections, total)
            out_name = f"长理线代期末试卷汇总-第{pno:02d}套.md"
            (OUT_ROOT / "线代" / out_name).write_text(content, encoding="utf-8")
            report.append(f"  线代/{out_name}  ({total} 题)")

    print("\n".join(report))
    print("\n完成。输出目录:", OUT_ROOT)


if __name__ == "__main__":
    main()
