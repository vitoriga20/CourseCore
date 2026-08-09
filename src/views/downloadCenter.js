import { escapeHtml } from '../utils.js';
import { state } from '../state.js';
import { COURSES } from '../data/courses.js';
import { questionTypes } from '../config/question-types.js';
import { QUESTION_TYPE_LABELS } from '../data/labels.js';
import {
  collectTheory, collectTraining, collectQuiz, collectExams, collectReview,
  buildTheoryHtml, buildQuestionSetHtml, buildExamHtml, buildReviewHtml, exportPdf,
} from '../services/download.js';
import { getQueue, addToQueue, removeFromQueue, isQueued, clearQueue } from '../services/download-queue.js';
import { findQuestion } from '../utils/question.js';

const TABS = [
  { id: 'theory', label: '理论' },
  { id: 'training', label: '训练题' },
  { id: 'exam', label: '综合测试' },
  { id: 'final', label: '期末试卷' },
  { id: 'review', label: '复习' },
];

let loaded = {}; // { theory: [], training: [], exam: [], final: [], review: [] }

async function loadAll() {
  if (!loaded.theory) loaded.theory = collectTheory();
  if (!loaded.training) loaded.training = collectTraining();
  if (!loaded.exam) loaded.exam = collectQuiz(); // 综合测试 = 课程内 quiz 小节
  if (!loaded.final) loaded.final = await collectExams(); // 期末试卷 = 刷题中心试卷
  if (!loaded.review) loaded.review = await collectReview();
  return loaded;
}

function filterByTab(items, tabId, filters) {
  const course = filters.course;
  const type = filters.type;
  return items.filter(it => {
    if (course !== 'all' && it.courseTitle !== course) return false;
    if (tabId === 'review') return true;
    if (type !== 'all') {
      if (tabId === 'theory' || tabId === 'training') {
        const qs = it.questions || it.examples || [];
        return qs.some(q => String(q.questionType) === type);
      }
      if (tabId === 'exam') {
        const qs = it.questions || [];
        return qs.some(q => String(q.questionType) === type);
      }
      if (tabId === 'final') {
        const qs = (it.paper?.sections || []).flatMap(s => s.questions || []);
        return qs.some(q => String(q.questionType) === type);
      }
    }
    return true;
  });
}

// 各 tab 的条目计数文案（理论区分「正文/例题」，避免有内容却显示 0）
function countLabel(it, tabId) {
  if (tabId === 'theory') {
    const exCount = (it.examples || []).length;
    const hasContent = !!(it.content && it.content.trim());
    if (exCount > 0 && hasContent) return `${exCount} 道例题`;
    if (exCount > 0) return `${exCount} 道例题`;
    if (hasContent) return '含正文';
    return '无内容';
  }
  if (tabId === 'training' || tabId === 'exam') return `${(it.questions || []).length} 题`;
  if (tabId === 'final') return `${it.nQuestions} 题`;
  return '1 份';
}

// ============================================================
// 树形渲染：课程 →（模块）→ 叶子
// 默认只展开「课程」级；模块/叶子收起。
// ============================================================

function renderLeafRow(it, tabId) {
  const checked = isQueued(it.key);
  return `
    <div class="rounded-lg mb-2" style="border:1px solid var(--line);">
      <div class="flex items-center justify-between gap-3 p-3">
        <label class="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
          <input type="checkbox" data-action="dl-toggle" data-key="${escapeHtml(it.key)}" data-tab="${tabId}" ${checked ? 'checked' : ''} class="shrink-0" style="width:15px;height:15px;accent-color:var(--primary);">
          <span class="truncate text-sm" style="color:var(--fg);">${escapeHtml(it.itemTitle || it.title)}</span>
          <span class="text-xs shrink-0" style="color:var(--muted);">${countLabel(it, tabId)}</span>
        </label>
      </div>
    </div>
  `;
}

// 统计某节点下所有叶子 key
function collectLeafKeys(node, acc = []) {
  if (node.children) node.children.forEach(c => collectLeafKeys(c, acc));
  else acc.push(node.key);
  return acc;
}

function renderTreeCourse(course, tabId) {
  const leaves = collectLeafKeys(course);
  const allChecked = leaves.length > 0 && leaves.every(k => isQueued(k));
  const someChecked = !allChecked && leaves.some(k => isQueued(k));
  return `
    <div class="card mb-3 overflow-hidden" style="margin-bottom:0.75rem;">
      <div class="flex items-center gap-2 p-3" style="border-bottom:1px dashed var(--line);">
        <input type="checkbox" data-action="dl-toggle-group" data-keys="${escapeHtml(leaves.join(','))}" ${allChecked ? 'checked' : ''} class="shrink-0" style="width:16px;height:16px;accent-color:var(--primary);" title="整组勾选">
        ${someChecked && !allChecked ? '<span class="text-xs" style="color:var(--primary);">部分</span>' : ''}
        <span class="font-bold flex-1 min-w-0 truncate" style="color:var(--fg);">${escapeHtml(course.title)}</span>
        <span class="text-xs shrink-0" style="color:var(--muted);">${leaves.length} 项</span>
      </div>
      <div class="pt-2 px-3 pb-3 space-y-2">
        ${course.children.map(node => renderTreeNode(node, tabId)).join('')}
      </div>
    </div>
  `;
}

function renderTreeNode(node, tabId) {
  if (node.children) {
    // 模块级节点
    const leaves = collectLeafKeys(node);
    const allChecked = leaves.length > 0 && leaves.every(k => isQueued(k));
    const someChecked = !allChecked && leaves.some(k => isQueued(k));
    return `
      <div>
        <div class="flex items-center gap-2 py-1.5">
          <input type="checkbox" data-action="dl-toggle-group" data-keys="${escapeHtml(leaves.join(','))}" ${allChecked ? 'checked' : ''} class="shrink-0" style="width:15px;height:15px;accent-color:var(--primary);" title="整组勾选">
          ${someChecked && !allChecked ? '<span class="text-xs" style="color:var(--primary);">部分</span>' : ''}
          <span class="flex-1 min-w-0 truncate text-sm font-semibold" style="color:var(--fg);">${escapeHtml(node.title)}</span>
          <span class="text-xs shrink-0" style="color:var(--muted);">${leaves.length} 项</span>
        </div>
        <div class="pl-4 mt-1 space-y-2">${node.children.map(leaf => renderLeafRow(leaf, tabId)).join('')}</div>
      </div>
    `;
  }
  return renderLeafRow(node, tabId);
}

// 构建树：理论/训练题/综合测试 → 课程→模块→叶子；期末/复习 → 课程→叶子
function buildTree(items, tabId) {
  const hasModuleLevel = tabId === 'theory' || tabId === 'training' || tabId === 'exam';
  const courses = new Map();
  for (const it of items) {
    const cid = it.courseId || it.courseTitle || '其他';
    if (!courses.has(cid)) {
      courses.set(cid, { id: cid, title: it.courseTitle || cid, children: [] });
    }
    const course = courses.get(cid);
    if (hasModuleLevel) {
      const mid = it.moduleId || `mod-${it.itemId}`;
      const mtitle = it.moduleTitle || '未分类';
      let mod = course.children.find(m => m.id === mid);
      if (!mod) {
        mod = { id: mid, title: mtitle, children: [] };
        course.children.push(mod);
      }
      mod.children.push(it);
    } else {
      course.children.push(it);
    }
  }
  return Array.from(courses.values());
}

function renderBody(tabId, filters) {
  const items = filterByTab(loaded[tabId] || [], tabId, filters);
  if (items.length === 0) {
    return `<div class="card text-center py-10" style="color:var(--muted);">暂无内容${tabId === 'review' ? '（需登录）' : ''}。</div>`;
  }
  const tree = buildTree(items, tabId);
  return tree.map(course => renderTreeCourse(course, tabId)).join('');
}

function renderToolbar(filters) {
  return `
    <div class="card mb-6">
      <div class="flex flex-col md:flex-row gap-4">
        <select data-action="dl-filter-course" class="answer-input md:w-48">
          <option value="all" ${filters.course === 'all' ? 'selected' : ''}>全部学科</option>
          ${COURSES.map(c => `<option value="${c.title}" ${filters.course === c.title ? 'selected' : ''}>${escapeHtml(c.title)}</option>`).join('')}
        </select>
        <select data-action="dl-filter-type" class="answer-input md:w-40">
          <option value="all" ${filters.type === 'all' ? 'selected' : ''}>全部题型</option>
          ${Object.entries(questionTypes).map(([key, value]) => `
            <option value="${value}" ${filters.type === String(value) ? 'selected' : ''}>${QUESTION_TYPE_LABELS[value]}题</option>
          `).join('')}
        </select>
        <label class="flex items-center gap-2 text-sm" style="color:var(--fg);">
          <input type="checkbox" data-action="dl-toggle-answer" ${filters.includeAnswer ? 'checked' : ''} style="width:16px;height:16px;accent-color:var(--primary);">
          含答案与解析
        </label>
      </div>
    </div>
  `;
}

function renderQueueBar() {
  const queue = getQueue();
  return `
    <div class="card mb-6" style="border-color:var(--primary);">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div class="font-bold" style="color:var(--fg);">下载队列</div>
          <div class="text-xs mt-0.5" style="color:var(--muted);">已选 ${queue.length} 项${queue.length ? ' · 可合并为一份 PDF 或逐份导出' : ''}</div>
        </div>
        <div class="flex gap-2 flex-wrap">
          <button type="button" data-action="dl-export-merged" class="btn-pill btn-primary" ${queue.length ? '' : 'disabled'} style="${queue.length ? '' : 'opacity:0.5;cursor:not-allowed;'}">合并导出 PDF</button>
          <button type="button" data-action="dl-export-separate" class="btn-pill btn-ghost" ${queue.length ? '' : 'disabled'} style="${queue.length ? '' : 'opacity:0.5;cursor:not-allowed;'}">逐份导出</button>
          <button type="button" data-action="dl-clear-queue" class="btn-pill btn-ghost" ${queue.length ? '' : 'disabled'} style="${queue.length ? '' : 'opacity:0.5;cursor:not-allowed;'}" style="color:var(--danger);">清空</button>
        </div>
      </div>
    </div>
  `;
}

export function renderDownloadCenter() {
  const tabId = state.downloadTab || 'theory';
  const filters = state.downloadFilters || { course: 'all', type: 'all', includeAnswer: true };
  const tabs = TABS.map(t =>
    `<button type="button" data-action="dl-tab" data-tab="${t.id}" class="btn-pill ${tabId === t.id ? 'btn-primary' : 'btn-ghost'}">${t.label}</button>`
  ).join('');

  return `
    <div class="max-w-5xl mx-auto">
      <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2" style="color:var(--fg);">下载中心</h1>
      <p class="mb-6" style="color:var(--muted);">自由勾选理论、训练题、综合测试、期末试卷与复习错题，一键导出为 PDF。</p>

      <div class="flex flex-wrap gap-2 mb-6">${tabs}</div>
      ${renderQueueBar()}
      ${renderToolbar(filters)}
      <div data-dl-body>${renderBody(tabId, filters)}</div>
    </div>
  `;
}

// 初始化：加载数据 + 渲染（异步数据就绪后刷新）
export async function initDownloadCenter() {
  await loadAll();
  const body = document.querySelector('[data-dl-body]');
  if (body) {
    const tabId = state.downloadTab || 'theory';
    const filters = state.downloadFilters || { course: 'all', type: 'all', includeAnswer: true };
    body.innerHTML = renderBody(tabId, filters);
  }
}

// ============================================================
// 交互处理（由 main.js 事件委托调用）
// ============================================================

export function handleDownloadAction(action, el) {
  const tabId = state.downloadTab || 'theory';
  const filters = state.downloadFilters || { course: 'all', type: 'all', includeAnswer: true };

  switch (action) {
    case 'dl-tab':
      state.downloadTab = el.dataset.tab;
      renderDownloadCenterInto();
      break;
    case 'dl-filter-course':
      filters.course = el.value;
      state.downloadFilters = filters;
      renderDownloadCenterInto();
      break;
    case 'dl-filter-type':
      filters.type = el.value;
      state.downloadFilters = filters;
      renderDownloadCenterInto();
      break;
    case 'dl-toggle-answer':
      filters.includeAnswer = el.checked;
      state.downloadFilters = filters;
      break;
    case 'dl-toggle': {
      const key = el.dataset.key;
      const item = (loaded[el.dataset.tab] || []).find(it => it.key === key);
      if (item) {
        if (el.checked) addToQueue({ ...item, sourceTab: el.dataset.tab });
        else removeFromQueue(key);
      }
      renderDownloadCenterInto();
      break;
    }
    case 'dl-toggle-group': {
      // 整组勾选：data-keys 为逗号分隔的叶子 key，全部加入/移除队列
      const keys = (el.dataset.keys || '').split(',').filter(Boolean);
      const tab = state.downloadTab || 'theory';
      const items = loaded[tab] || [];
      if (el.checked) {
        keys.forEach(k => {
          const item = items.find(it => it.key === k);
          if (item && !isQueued(k)) addToQueue({ ...item, sourceTab: tab });
        });
      } else {
        keys.forEach(k => removeFromQueue(k));
      }
      renderDownloadCenterInto();
      break;
    }
    case 'dl-clear-queue':
      clearQueue();
      renderDownloadCenterInto();
      break;
    case 'dl-export-merged':
      exportQueue(true);
      break;
    case 'dl-export-separate':
      exportQueue(false);
      break;
    case 'dl-single-exam':
      exportSingleExam(el.dataset.examId);
      break;
    case 'dl-single-question':
      exportSingleQuestion(el.dataset.key);
      break;
  }
}

// 导出进度遮罩：避免大题量渲染时界面无反馈
let exportMaskEl = null;
function showExportMask() {
  if (exportMaskEl) return;
  const mask = document.createElement('div');
  mask.id = 'cc-export-mask';
  mask.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;color:#fff;font-family:inherit;';
  // 加载遮罩动画：参考 shadcn spinner（旋转环）+ progress（indeterminate 平移动画）思路，
  // 用原生 CSS 实现，契合项目墨绿高端配色：墨绿双击 spinner + shimmer 扫描进度条 + 百分比数字
  mask.innerHTML = `
    <style>
      .cc-mask-bg{position:absolute;inset:0;background:
        radial-gradient(circle at 50% 38%, rgba(45,106,79,.38), transparent 62%),
        radial-gradient(circle at 82% 84%, rgba(188,156,26,.10), transparent 52%),
        rgba(7,9,8,1);}
      .cc-mask-grid{position:absolute;inset:0;background-image:
        linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px);
        background-size:44px 44px;
        -webkit-mask-image:radial-gradient(circle at 50% 50%, #000, transparent 76%);
                mask-image:radial-gradient(circle at 50% 50%, #000, transparent 76%);}
      .cc-mask-card{position:relative;display:flex;flex-direction:column;align-items:center;gap:22px;
        padding:42px 60px;border-radius:20px;background:rgba(255,255,255,.035);
        border:1px solid rgba(255,255,255,.08);
        box-shadow:0 0 0 1px rgba(45,106,79,.18), 0 24px 80px rgba(0,0,0,.55);
        animation:cc-mask-in .55s cubic-bezier(.22,1,.36,1);}
      @keyframes cc-mask-in{from{opacity:0;transform:translateY(16px) scale(.97)}to{opacity:1;transform:none}}
      .cc-mask-ring{width:64px;height:64px;position:relative;}
      .cc-mask-ring::before,.cc-mask-ring::after{content:"";position:absolute;inset:0;border-radius:50%;}
      .cc-mask-ring::before{border:2px solid rgba(45,106,79,.28);}
      .cc-mask-ring::after{border:2px solid transparent;border-top-color:#4ade80;border-right-color:#2d6a4f;
        animation:cc-mask-spin 1s linear infinite;}
      @keyframes cc-mask-spin{to{transform:rotate(360deg)}}
      .cc-mask-pct{font-size:34px;font-weight:700;font-variant-numeric:tabular-nums;letter-spacing:.5px;
        background:linear-gradient(90deg,#4ade80,#fff);-webkit-background-clip:text;background-clip:text;color:transparent;}
      .cc-mask-track{width:248px;height:8px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden;position:relative;}
      .cc-mask-fill{height:100%;width:0%;border-radius:999px;position:relative;
        background:linear-gradient(90deg,#1f4d3a,#2d6a4f,#4ade80);transition:width .3s ease;}
      .cc-mask-fill::after{content:"";position:absolute;inset:0;
        background:linear-gradient(90deg,transparent,rgba(255,255,255,.38),transparent);
        transform:translateX(-100%);animation:cc-mask-shimmer 1.6s ease-in-out infinite;}
      @keyframes cc-mask-shimmer{to{transform:translateX(100%)}}
      .cc-mask-label{font-size:13px;color:rgba(255,255,255,.56);}
    </style>
    <div class="cc-mask-bg"></div>
    <div class="cc-mask-grid"></div>
    <div class="cc-mask-card">
      <div class="cc-mask-ring"></div>
      <div class="cc-mask-pct" id="cc-mask-pct">0%</div>
      <div class="cc-mask-track"><div class="cc-mask-fill" id="cc-mask-fill"></div></div>
      <div class="cc-mask-label" id="cc-mask-label">正在导出 PDF…</div>
    </div>
  `;
  document.body.appendChild(mask);
  exportMaskEl = mask;
}
function updateExportMask(i, total) {
  const pct = total > 0 ? Math.min(100, Math.round(((i + 1) / total) * 100)) : 0;
  const pctEl = document.getElementById('cc-mask-pct');
  if (pctEl) pctEl.textContent = `${pct}%`;
  const fill = document.getElementById('cc-mask-fill');
  if (fill) fill.style.width = `${pct}%`;
  const label = document.getElementById('cc-mask-label');
  if (label) label.textContent = `正在渲染第 ${Math.min(i + 1, total)} / ${total} 页`;
}
function hideExportMask() {
  if (exportMaskEl) { exportMaskEl.remove(); exportMaskEl = null; }
}

async function exportSingleQuestion(qid) {
  const q = findQuestion(qid);
  if (!q) return;
  const includeAnswer = (state.downloadFilters || {}).includeAnswer !== false;
  const html = buildQuestionSetHtml([{
    key: `single-${qid}`,
    courseTitle: '',
    moduleTitle: '',
    itemTitle: q.title || '题目',
    questions: [q],
  }], { includeAnswer });
  await exportPdf(html, {
    title: q.title || '题目',
    subtitle: QUESTION_TYPE_LABELS[q.questionType] || 'CourseCore',
    filename: q.title || qid,
  });
}

async function exportSingleExam(examId) {
  const data = await loadAll();
  const item = (data.final || []).find(it => it.paper?.id === examId);
  if (!item) return;
  const includeAnswer = (state.downloadFilters || {}).includeAnswer !== false;
  const html = buildExamHtml([item.paper], { includeAnswer });
  showExportMask();
  try {
    await exportPdf(html, {
      title: item.title,
      subtitle: item.courseTitle || 'CourseCore',
      filename: item.title,
      onProgress: updateExportMask,
    });
  } finally {
    hideExportMask();
  }
}

function renderDownloadCenterInto() {
  const main = document.getElementById('main');
  if (main) {
    main.innerHTML = renderDownloadCenter();
    initDownloadCenter();
  }
}

function buildQueueHtml(queue, includeAnswer) {
  const theory = queue.filter(it => it.type === 'theory');
  const training = queue.filter(it => it.type === 'training' || it.type === 'quiz'); // 训练题 + 综合测试都是题目集
  const exams = queue.filter(it => it.type === 'exam');
  const reviews = queue.filter(it => it.type === 'review');

  let html = '';
  if (theory.length) html += buildTheoryHtml(theory, { includeAnswer });
  if (training.length) html += buildQuestionSetHtml(training, { includeAnswer });
  if (exams.length) html += buildExamHtml(exams.map(it => it.paper), { includeAnswer });
  if (reviews.length) html += buildReviewHtml(reviews, { includeAnswer });
  return html;
}

async function exportQueue(merged) {
  const queue = getQueue();
  if (queue.length === 0) return;
  const includeAnswer = (state.downloadFilters || {}).includeAnswer !== false;

  const btn = document.querySelector('[data-action="dl-export-merged"], [data-action="dl-export-separate"]');
  const original = btn ? btn.innerHTML : '';
  if (btn) { btn.disabled = true; btn.innerHTML = '导出中…'; }

  try {
    if (merged) {
      const html = buildQueueHtml(queue, includeAnswer);
      showExportMask();
      try {
        await exportPdf(html, {
          title: 'CourseCore 下载内容',
          subtitle: `共 ${queue.length} 项 · ${new Date().toLocaleDateString('zh-CN')}`,
          filename: `CourseCore-下载合集-${Date.now()}`,
          onProgress: updateExportMask,
        });
      } finally {
        hideExportMask();
      }
    } else {
      for (const item of queue) {
        let html = '';
        if (item.type === 'theory') html += buildTheoryHtml([item], { includeAnswer });
        else if (item.type === 'training' || item.type === 'quiz') html += buildQuestionSetHtml([item], { includeAnswer });
        else if (item.type === 'exam') html += buildExamHtml([item.paper], { includeAnswer });
        else if (item.type === 'review') html += buildReviewHtml([item], { includeAnswer });
        showExportMask();
        try {
          await exportPdf(html, {
            title: item.title,
            subtitle: item.courseTitle || 'CourseCore',
            filename: item.title,
            onProgress: updateExportMask,
          });
        } finally {
          hideExportMask();
        }
      }
    }
  } catch (err) {
    console.error('[download] 导出失败:', err);
    alert('导出失败：' + (err?.message || err));
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = original; }
  }
}