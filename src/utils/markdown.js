import { marked } from 'marked';

// marked 会把 LaTeX 下标中的 _ 识别为 Markdown 强调语法，导致 MathJax 收到被
// <em> 标签拆开的公式。先保留完整数学片段，Markdown 渲染后再原样还原。
const MATH_SEGMENT = /\$\$[\s\S]*?\$\$|\\\\\[[\s\S]*?\\\\\]|\\\\\([\s\S]*?\\\\\)|(?<!\\)\$(?!\$)(?:\\.|[^$\n])+(?<!\\)\$/g;
const MATH_TOKEN = /@@COURSECORE_MATH_(\d+)@@/g;

export function renderMarkdownWithMath(markdown) {
  const segments = [];
  const protectedMarkdown = String(markdown || '').replace(MATH_SEGMENT, segment => {
    const token = `@@COURSECORE_MATH_${segments.length}@@`;
    segments.push(segment);
    return token;
  });

  return marked.parse(protectedMarkdown).replace(MATH_TOKEN, (_, index) => segments[Number(index)] || '');
}
