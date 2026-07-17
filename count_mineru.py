import re
from pathlib import Path

def parse_md(path):
    text = Path(path).read_text(encoding='utf-8')
    sections = {}
    current = None
    for line in text.splitlines():
        m = re.match(r'^##\s*[一二三四]、\s*(选择题|填空题|计算题)', line)
        if m:
            current = m.group(1)
            sections[current] = []
        elif current:
            sections[current].append(line)
    for sec, lines in sections.items():
        nums = []
        for line in lines:
            m = re.match(r'^(\d+)\．', line)
            if m:
                nums.append(int(m.group(1)))
        print(f'{sec}: {len(nums)} questions, first {nums[:3]}, last {nums[-3:] if nums else None}')

parse_md(r'c:\Users\vitoriga\Downloads\物理试题\mineru_output\力学综合测试\力学综合测试\auto\力学综合测试.md')
parse_md(r'c:\Users\vitoriga\Downloads\物理试题\mineru_output\波动光学综合测试\波动光学综合测试\auto\波动光学综合测试.md')
