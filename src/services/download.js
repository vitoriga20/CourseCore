import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { renderMarkdownWithMath } from '../utils/markdown.js';
import { escapeHtml } from '../utils.js';
import { QUESTION_TYPE_LABELS } from '../data/labels.js';
import { formatAnswerDisplay } from '../utils/question.js';
import { THEORY_CONTENTS } from '../data/theoryContents.js';
import { COURSES } from '../data/courses.js';
import { QUESTIONS } from '../data/questions.js';
import { getExamPapers } from './practice-data.js';
import { getReviewQueue } from './review-engine.js';
import { state } from '../state.js';

// ============================================================
// 主题化导出 DOM 组装
// 思路：不在线上多页截图，而是把选中内容聚合到单个隐藏导出容器，
// 套用主题 CSS 变量，等待 MathJax 渲染后整份导出分页。
// ============================================================

const EXPORT_STYLES = `
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; }
  .cc-export {
    width: 794px;
    padding: 48px 56px;
    background: #ffffff;
    color: #1a1a1a;
    font-family: 'Inter', -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif;
    font-size: 14px;
    line-height: 1.7;
  }
  .cc-export .cc-title {
    font-size: 22px;
    font-weight: 800;
    margin: 0 0 4px;
    color: var(--cc-primary, #2d6a4f);
  }
  .cc-export .cc-subtitle {
    font-size: 12px;
    color: #6e6e73;
    margin: 0 0 24px;
    padding-bottom: 16px;
    border-bottom: 2px solid #e5e5e5;
  }
  .cc-export .cc-section {
    margin: 0 0 28px;
    page-break-inside: auto;
  }
  .cc-export .cc-section-h {
    font-size: 16px;
    font-weight: 700;
    margin: 0 0 6px;
    color: var(--cc-primary, #2d6a4f);
  }
  .cc-export .cc-section-sub {
    font-size: 12px;
    color: #6e6e73;
    margin: 0 0 12px;
  }
  .cc-export .cc-q {
    margin: 0 0 18px;
    padding-bottom: 14px;
    border-bottom: 1px dashed #e0e0e0;
    page-break-inside: avoid;
  }
  .cc-export .cc-q:last-child { border-bottom: none; }
  .cc-export .cc-q-head {
    font-weight: 600;
    margin: 0 0 6px;
  }
  .cc-export .cc-q-type {
    display: inline-block;
    font-size: 11px;
    font-weight: 600;
    color: var(--cc-primary, #2d6a4f);
    border: 1px solid currentColor;
    border-radius: 4px;
    padding: 0 6px;
    margin-right: 8px;
    vertical-align: middle;
  }
  .cc-export .cc-q-content { margin: 0 0 8px; }
  .cc-export .cc-q-content p { margin: 0 0 6px; }
  .cc-export .cc-options { margin: 0 0 8px; padding-left: 4px; }
  .cc-export .cc-opt { display: block; padding: 2px 0; }
  .cc-export .cc-answer {
    margin-top: 8px;
    font-size: 13px;
    color: var(--cc-primary, #2d6a4f);
    font-weight: 500;
  }
  .cc-export .cc-solution {
    margin-top: 4px;
    font-size: 13px;
    color: #444;
  }
  .cc-export .cc-solution-label {
    font-weight: 600;
    color: var(--cc-primary, #2d6a4f);
  }
  .cc-export table { border-collapse: collapse; width: 100%; margin: 8px 0; }
  .cc-export th, .cc-export td { border: 1px solid #ddd; padding: 6px 8px; font-size: 13px; }
  .cc-export img { max-width: 100%; }
  .cc-export code { background: #f4f4f5; padding: 1px 4px; border-radius: 3px; font-size: 12px; }
  .cc-export pre { background: #f4f4f5; padding: 10px 12px; border-radius: 6px; overflow: hidden; }
  .cc-export pre code { background: none; }
  .cc-export blockquote { border-left: 3px solid var(--cc-primary, #2d6a4f); margin: 8px 0; padding: 4px 12px; color: #555; }
  .cc-export mjx-container { color: #1a1a1a !important; }
  .cc-export .cc-tag {
    display: inline-block;
    font-size: 11px;
    color: #888;
    background: #f4f4f5;
    border-radius: 4px;
    padding: 0 6px;
    margin-right: 6px;
  }
`;

/* 主题变量：订阅当前应用主题（现为 dark），PDF 导出始终用打印友好的浅色墨绿底 */
const THEME_VARS = {
  dark: {
    '--cc-primary': '#2d6a4f',
    '--cc-muted': '#6e6e73',
  },
  light: {
    '--cc-primary': '#2d6a4f',
    '--cc-muted': '#6e6e73',
  },
};

function getActiveTheme() {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

function injectStyle(container, vars) {
  const style = document.createElement('style');
  style.textContent = EXPORT_STYLES;
  container.appendChild(style);
  const root = container.querySelector('.cc-export');
  if (root) {
    for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
  }
}

// ============================================================
// 内容渲染帮助函数
// ============================================================

function renderMarkdown(md) {
  return renderMarkdownWithMath(md || '');
}

function renderQuestion(question, index, { includeAnswer = true } = {}) {
  const typeLabel = QUESTION_TYPE_LABELS[question.questionType] || '题目';
  const num = index != null ? `${index}. ` : '';
  let optionsHtml = '';
  if ((question.questionType === 0 || question.questionType === 1) && Array.isArray(question.options) && question.options.length) {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    optionsHtml = `<div class="cc-options">` + question.options.map((opt, i) => {
      const label = letters[i];
      const content = /<[a-z][\s\S]*>/i.test(opt) ? opt : escapeHtml(opt);
      return `<span class="cc-opt">${label}. ${content}</span>`;
    }).join('') + `</div>`;
  }
  let answerHtml = '';
  let solutionHtml = '';
  if (includeAnswer) {
    const ans = formatAnswerDisplay(question);
    if (ans !== undefined && ans !== null && ans !== '') {
      answerHtml = `<div class="cc-answer">答案：${escapeHtml(ans)}</div>`;
    }
    if (question.solution) {
      solutionHtml = `<div class="cc-solution"><span class="cc-solution-label">解析：</span>${renderMarkdown(question.solution)}</div>`;
    }
  }
  return `
    <div class="cc-q">
      <div class="cc-q-head"><span class="cc-q-type">${typeLabel}</span>${num}${renderMarkdown(question.content)}</div>
      ${optionsHtml}
      ${answerHtml}
      ${solutionHtml}
    </div>
  `;
}

// ============================================================
// 单类内容聚合 → HTML 字符串
// ============================================================

export function buildTheoryHtml(groups, { includeAnswer = true } = {}) {
  return groups.map(g => `
    <section class="cc-section">
      <h2 class="cc-section-h">${escapeHtml(g.courseTitle)}</h2>
      <div class="cc-section-sub">${escapeHtml(g.moduleTitle)} · ${escapeHtml(g.itemTitle)}</div>
      <div>${renderMarkdown(g.content)}</div>
      ${(g.examples || []).length ? `
        <div style="margin-top:12px;">
          <div class="cc-section-sub">例题</div>
          ${g.examples.map((ex, i) => renderQuestion(ex, i + 1, { includeAnswer })).join('')}
        </div>
      ` : ''}
    </section>
  `).join('');
}

export function buildQuestionSetHtml(groups, { includeAnswer = true } = {}) {
  return groups.map(g => `
    <section class="cc-section">
      <h2 class="cc-section-h">${escapeHtml(g.courseTitle)}</h2>
      <div class="cc-section-sub">${escapeHtml(g.moduleTitle)} · ${escapeHtml(g.itemTitle)} · ${g.questions.length} 题</div>
      ${g.questions.map((q, i) => renderQuestion(q, i + 1, { includeAnswer })).join('')}
    </section>
  `).join('');
}

export function buildExamHtml(papers, { includeAnswer = true } = {}) {
  return papers.map(p => `
    <section class="cc-section">
      <h2 class="cc-section-h">${escapeHtml(p.subject)} · ${escapeHtml(p.term || '')}</h2>
      <div class="cc-section-sub">${escapeHtml(p.school)}${p.college ? ' · ' + escapeHtml(p.college) : ''}${p.duration ? ' · ' + p.duration + ' 分钟' : ''}</div>
      ${(p.sections || []).map(sec => `
        <h3 style="font-size:14px;font-weight:700;margin:14px 0 8px;">${escapeHtml(sec.title || '')}</h3>
        ${(sec.questions || []).map((q, i) => renderQuestion(q, i + 1, { includeAnswer })).join('')}
      `).join('')}
    </section>
  `).join('');
}

export function buildReviewHtml(entries, { includeAnswer = true } = {}) {
  return entries.map((e, i) => {
    const q = e.question || e;
    return `<section class="cc-section">${renderQuestion(q, i + 1, { includeAnswer })}</section>`;
  }).join('');
}

// ============================================================
// 导出主流程
// ============================================================

let exportContainer = null;

function ensureContainer() {
  if (exportContainer && document.body.contains(exportContainer)) return exportContainer;
  exportContainer = document.createElement('div');
  exportContainer.id = 'cc-export-container';
  // 默认隐藏，仅在导出渲染期间显示（此刻有全屏遮罩盖住，用户不可见）；
  // 渲染时需在视口内可见 html2canvas 才能捕获（off-screen/display:none 会挂起）
  exportContainer.style.cssText = 'position:fixed;top:0;left:0;width:794px;display:none;pointer-events:none;';
  document.body.appendChild(exportContainer);
  return exportContainer;
}

function waitMathJax(el) {
  return new Promise(resolve => {
    const tryTypeset = () => {
      if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise([el]).then(() => resolve()).catch(() => resolve());
      } else {
        resolve();
      }
    };
    // MathJax 异步加载，等待可用
    if (window.MathJax && window.MathJax.typesetPromise) {
      tryTypeset();
    } else {
      let tries = 0;
      const timer = setInterval(() => {
        tries++;
        if (window.MathJax && window.MathJax.typesetPromise) {
          clearInterval(timer);
          tryTypeset();
        } else if (tries > 100) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    }
  });
}

export function sanitizeFilename(name) {
  return String(name || 'download').replace(/[\\/:*?"<>|]+/g, '_').trim() || 'download';
}

// 将导出 DOM 拆成不可分单元（标题/整题各自独立，保持文档顺序）
// 原子块 = 标题类 + 单个题目；其余容器（如理论正文）若含原子块则拆分，否则整体保留
function collectUnits(root) {
  const units = [];
  const isAtomic = el => el.matches('.cc-title, .cc-subtitle, .cc-section-h, .cc-section-sub, .cc-q') || el.tagName === 'H3';
  const walk = (el) => {
    for (const child of Array.from(el.children)) {
      if (isAtomic(child)) { units.push(child); continue; }
      if (child.querySelector('.cc-q, .cc-title, .cc-subtitle, .cc-section-h, .cc-section-sub, h3')) {
        walk(child);
      } else {
        units.push(child);
      }
    }
  };
  walk(root);
  return units;
}

// 把单元按页高分配到多个页容器（块不跨页，超高单块单独成页后再切片兜底）
function allocatePages(units, pageCssH, cssW) {
  const pages = [];
  const newPage = () => {
    const p = document.createElement('div');
    p.className = 'cc-export';
    p.style.width = cssW + 'px';
    pages.push(p);
    return p;
  };
  let cur = newPage();
  let curH = 0;
  for (const u of units) {
    const h = u.offsetHeight || 0;
    if (cur.children.length > 0 && curH + h > pageCssH) { cur = newPage(); curH = 0; }
    cur.appendChild(u);
    curH += h;
  }
  return pages;
}

/**
 * 将拼接好的 HTML 导出为 PDF（矢量分页：html2canvas → jsPDF 分页切片）
 * @param {string} bodyHtml 内容区 HTML（不含 <html>/<body> 包裹）
 * @param {Object} opts { title, subtitle, filename, theme, canvasWidth }
 */
export async function exportPdf(bodyHtml, opts = {}) {
  const theme = opts.theme || getActiveTheme();
  const vars = THEME_VARS[theme] || THEME_VARS.dark;
  const container = ensureContainer();
  // 打开容器供 html2canvas 捕获（exportContainer 平时 display:none）
  container.style.display = 'block';
  container.innerHTML = '';

  const titleHtml = opts.title ? `<h1 class="cc-title">${escapeHtml(opts.title)}</h1>` : '';
  const subtitleHtml = opts.subtitle ? `<p class="cc-subtitle">${escapeHtml(opts.subtitle)}</p>` : '';

  try {
    const wrap = document.createElement('div');
    wrap.className = 'cc-export';
    wrap.innerHTML = titleHtml + subtitleHtml + bodyHtml;
    container.appendChild(wrap);
    injectStyle(container, vars);

    await waitMathJax(wrap);

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageW = 210;
    const pageH = 297;
    const margin = 10;
    const contentW = pageW - margin * 2;
    const contentH = pageH - margin * 2;
    const cssW = 794;
    // 每页内容可容纳像素高（ratio = 像素/mm，扣除 .cc-export 上下 padding 留余量）
    const pageCssH = Math.floor(contentH * (cssW / contentW)) - 120;

    // 拆成不可分单元并按页高分配到多个页容器，逐页捕获，避免整卷单张超高 canvas 卡死
    const units = collectUnits(wrap);
    const pages = allocatePages(units, pageCssH, cssW);
    for (const p of pages) Object.entries(vars).forEach(([k, v]) => p.style.setProperty(k, v));
    wrap.remove();

    // 拆页后按「批」捕获：一批多页共用一个 canvas，再按页裁剪进 PDF。
    // 相比逐页捕获，大幅减少 html2canvas 调用次数（固定开销 × 批数）以提速；
    // 单块高度有界（= 批大小 × 页高），避免整卷一张超高 canvas 导致卡死。
    const CHUNK = 3;
    let pageIndex = 0;
    for (let ci = 0; ci < pages.length; ci += CHUNK) {
      const chunk = pages.slice(ci, ci + CHUNK);
      const chunkWrap = document.createElement('div');
      chunkWrap.style.cssText = `width:${cssW}px;background:#ffffff;`;
      chunk.forEach(p => chunkWrap.appendChild(p));
      container.appendChild(chunkWrap);

      // 先让出主线程，让遮罩/进度先渲染出来，避免界面冻结无反馈
      await new Promise(r => setTimeout(r, 0));
      opts.onProgress?.(ci, pages.length);

      const canvas = await html2canvas(chunkWrap, {
        scale: 1.25,
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: cssW,
        logging: false,
      });
      const scaleFactor = canvas.width / cssW;
      const imgW = contentW;
      let offsetY = 0;
      for (let j = 0; j < chunk.length; j++) {
        const pagePxH = Math.round((chunk[j].offsetHeight || 0) * scaleFactor);
        const imgH = pagePxH * imgW / canvas.width;
        // 从整块 canvas 中裁剪出当页，再转 base64 复用
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = pagePxH;
        pageCanvas.getContext('2d').drawImage(canvas, 0, offsetY, canvas.width, pagePxH, 0, 0, canvas.width, pagePxH);
        const dataURL = pageCanvas.toDataURL('image/jpeg', 0.92);
        if (pageIndex++ > 0) pdf.addPage();
        let heightLeft = imgH - contentH;
        let position = margin;
        pdf.addImage(dataURL, 'JPEG', margin, margin, imgW, imgH);
        while (heightLeft > 0) {
          position = margin - (imgH - heightLeft);
          pdf.addPage();
          pdf.addImage(dataURL, 'JPEG', margin, position, imgW, imgH);
          heightLeft -= contentH;
        }
        offsetY += pagePxH;
      }
      chunkWrap.remove();
    }

    opts.onProgress?.(pages.length, pages.length);

    const filename = sanitizeFilename(opts.filename || opts.title || 'download') + '.pdf';
    pdf.save(filename);
    return filename;
  } finally {
    // 无论成败都隐藏容器并清空，避免白纸残留遮挡页面
    container.style.display = 'none';
    container.innerHTML = '';
  }
}

// ============================================================
// 数据聚合：供下载中心与「刷一个下载一个」复用
// ============================================================

export function getCourseMeta(itemId) {
  for (const c of COURSES) {
    for (const m of c.modules) {
      for (const i of m.items) {
        if (i.id === itemId) return { course: c, module: m, item: i };
      }
    }
  }
  return null;
}

export function metaTitle(meta) {
  if (!meta) return '';
  return `${meta.course?.title || ''} / ${meta.module?.title || ''} / ${meta.item?.title || ''}`;
}

// 理论：按小节聚合
export function collectTheory() {
  return THEORY_CONTENTS.map(t => {
    const meta = getCourseMeta(t.itemId);
    return {
      key: `theory-${t.itemId}`,
      type: 'theory',
      title: metaTitle(meta),
      courseId: meta?.course?.id || '',
      courseTitle: meta?.course?.title || '',
      moduleId: meta?.module?.id || '',
      moduleTitle: meta?.module?.title || '',
      itemTitle: meta?.item?.title || '',
      itemId: t.itemId,
      content: t.content || '',
      examples: t.examples || [],
    };
  });
}

// 按小节类型聚合题目（训练题 / 综合测试共用），过滤指定小节类型
function collectItemQuestions(type, itemTypeFilter) {
  const map = new Map();
  QUESTIONS.forEach(q => {
    if (!map.has(q.itemId)) map.set(q.itemId, { itemId: q.itemId, questions: [] });
    map.get(q.itemId).questions.push(q);
  });
  // 合并运行时题目（训练/综合测验小节）
  Object.entries(state.runtimeQuestions || {}).forEach(([itemId, qs]) => {
    if (!map.has(itemId)) map.set(itemId, { itemId, questions: [] });
    const existing = new Map(map.get(itemId).questions.map(q => [q.id, q]));
    qs.forEach(q => existing.set(q.id, q));
    map.get(itemId).questions = Array.from(existing.values());
  });
  return Array.from(map.values())
    .filter(grp => {
      const meta = getCourseMeta(grp.itemId);
      return meta && itemTypeFilter(meta.item.type);
    })
    .map(grp => {
      const meta = getCourseMeta(grp.itemId);
      return {
        key: `${type}-${grp.itemId}`,
        type,
        title: metaTitle(meta),
        courseId: meta?.course?.id || '',
        courseTitle: meta?.course?.title || '',
        moduleId: meta?.module?.id || '',
        moduleTitle: meta?.module?.title || '',
        itemTitle: meta?.item?.title || '',
        itemId: grp.itemId,
        questions: (grp.questions || []).slice().sort((a, b) =>
          (Number(a.order_index ?? a.order ?? 0)) - (Number(b.order_index ?? b.order ?? 0))),
      };
    });
}

// 训练题：只聚合 training 类型小节的题目
export function collectTraining() {
  return collectItemQuestions('training', t => t === 'training');
}

// 综合测试：只聚合 quiz 类型小节（如「力学期末综合测验」）的题目
export function collectQuiz() {
  return collectItemQuestions('quiz', t => t === 'quiz');
}

// 试卷：综合测试 + 期末试卷
export async function collectExams() {
  const papers = await getExamPapers();
  return (papers || []).map(p => ({
    key: `exam-${p.id}`,
    type: 'exam',
    title: `${p.subject} · ${p.term || ''}`,
    courseId: p.subject || '',
    courseTitle: p.subject || '',
    moduleId: p.college || '',
    moduleTitle: p.college || '期末试卷',
    itemTitle: p.term || p.id,
    paper: p,
    nQuestions: (p.sections || []).reduce((s, sec) => s + (sec.questions || []).length, 0),
  }));
}

// 复习：错题本
export async function collectReview() {
  const userId = state.user?.id;
  if (!userId) return [];
  const queue = await getReviewQueue(userId);
  return (queue || []).map((e, i) => ({
    key: `review-${e.id || i}`,
    type: 'review',
    title: '复习 · 错题',
    courseId: e.subject || '',
    courseTitle: e.subject || '',
    moduleId: '',
    moduleTitle: '',
    itemTitle: '',
    question: e.question || null,
  })).filter(e => e.question);
}