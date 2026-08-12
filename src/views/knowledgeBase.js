// 今日复习（Screen 4 + Screen 6 统一 hub）
// 单路由 /kb，页内 [错题库 | 收藏] tab 切换；齿轮展开复习曲线设置（经典/紧凑）
// 错题库: 任务入口 + 学科筛选 + 紧凑复习队列 + 薄弱点排行；收藏: 四分类筛选 + 卡片列表

import { state } from '../state.js';
import { escapeHtml } from '../utils.js';
import { getSubjects } from '../services/practice-data.js';
import {
  getReviewQueue, getStats,
  getUserCurve, switchCurve, CURVES, markRight
} from '../services/review-engine.js';

// 内联 SVG 图标（黑白线性风格，跟随 currentColor）
function icon(name, size = 32) {
  const paths = {
    clock: '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>',
    clipboard: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"></path>',
    doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line>',
    newspaper: '<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0V6"></path><line x1="10" y1="8" x2="18" y2="8"></line><line x1="10" y1="12" x2="18" y2="12"></line><line x1="10" y1="16" x2="18" y2="16"></line><line x1="6" y1="8" x2="6.01" y2="8"></line><line x1="6" y1="12" x2="6.01" y2="12"></line>'
  };
  const body = paths[name] || paths.doc;
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

// ============================================================
// 常量
// ============================================================
const TYPE_NAMES = { 0: '单选', 1: '多选', 2: '填空', 3: '解答', 4: '证明', 5: '判断' };
const STATUS_STYLES = {
  '未掌握': 'background: rgba(239, 83, 80, 0.15); color: #EF5350;',
  '复习中': 'background: rgba(255, 184, 0, 0.15); color: #FFB800;',
  '已掌握': 'background: rgba(22, 163, 74, 0.15); color: var(--practice-accent);'
};

// 页内状态（跨 renderMain 重渲染保留）
const _kbState = {
  tab: 'wrong',          // 'wrong' | 'favorites'
  currentSubject: null,
  entries: [],
  curve: 'classic',      // 'classic' | 'compact'
  curvePanelOpen: false,
  curveApplied: false    // 本次会话是否已应用过曲线
};

function pageShell(content) {
  return `
    <section class="max-w-5xl mx-auto px-4 pt-8 pb-16" style="min-height: 70vh;">
      ${content}
    </section>
  `;
}

// ============================================================
// 入口
// ============================================================
export function renderKnowledgeBase() {
  _initKnowledgeBase();
  return pageShell(`
    <!-- 顶部：今日复习 + 齿轮 -->
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-extrabold" style="color: var(--practice-text);">今日复习</h1>
      <div class="flex items-center gap-3">
        <button id="kb-curve-toggle" class="kb-gear-btn${_kbState.curvePanelOpen ? ' open' : ''}" title="复习曲线设置" aria-label="复习曲线设置" aria-expanded="${_kbState.curvePanelOpen ? 'true' : 'false'}">⚙</button>
      </div>
    </div>

    <!-- 复习曲线设置下拉 -->
    <div id="kb-curve-panel" class="kb-curve-panel"${_kbState.curvePanelOpen ? '' : ' hidden'}>
      <div class="kb-curve-head">
        <div class="kb-curve-title">复习曲线设置</div>
        <span id="kb-curve-hint" class="kb-curve-hint"></span>
      </div>
      <p class="kb-curve-desc">切换后按「重合」算法保留已复习阶段；超出新曲线阶段的错题自动毕业。</p>
      <div class="kb-curve-options">
        ${Object.entries(CURVES).map(([key, c]) => `
          <label class="kb-curve-option${_kbState.curve === key ? ' active' : ''}" data-curve="${key}">
            <input type="radio" name="kb-curve" value="${key}" ${_kbState.curve === key ? 'checked' : ''}>
            <div class="kb-curve-meta">
              <div class="kb-curve-name">${c.name}</div>
              <div class="kb-curve-sub">${c.label} · ${c.intervals.length} 阶段</div>
            </div>
          </label>
        `).join('')}
      </div>
    </div>

    <!-- tab 错题库 / 收藏 -->
    <div class="flex gap-1 mb-4">
      <span class="kb-tab-pill${_kbState.tab === 'wrong' ? ' active' : ''}" data-tab="wrong">错题库</span>
      <span class="kb-tab-pill${_kbState.tab === 'favorites' ? ' active' : ''}" data-tab="favorites">收藏</span>
    </div>

    <!-- tab 内容 -->
    <div id="kb-tab-content">${_kbState.tab === 'wrong' ? _renderWrongTabBody() : _renderFavoritesTabBody()}</div>
  `);
}

// ============================================================
// 错题库 tab
// ============================================================
function _renderWrongTabBody() {
  return `
    <div class="today-review-hero mb-5">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wider" style="color: var(--practice-accent);">错题复习入口</p>
        <h2 class="text-2xl font-extrabold mt-1" style="color: var(--practice-text);">今天先解决这些错题</h2>
        <p class="text-sm mt-2" style="color: var(--practice-muted);">复习内容来自你刷题时答错的题目，点击后直接进入第一题。</p>
      </div>
      <a href="/kb/review" class="btn-pill today-review-primary" style="background: var(--practice-accent); color: #fff;">开始今日复习 <span id="today-review-count">0</span> 题 →</a>
    </div>

    <div id="wrong-subjects" class="flex gap-2 mb-6 flex-wrap"></div>

    <div class="flex items-center justify-between mb-3">
      <h2 class="text-lg font-bold" style="color: var(--practice-text);">待巩固错题</h2>
      <span class="text-xs" style="color: var(--practice-muted);">按复习顺序排列</span>
    </div>

    <div id="wrong-area" class="wrong-flow-grid mb-6">
      <aside id="weakness-ranking" class="weakness-ranking card" style="background: var(--practice-card); border-color: var(--practice-border); padding: 1rem; align-self: start;">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-lg font-bold" style="color: var(--practice-text);">薄弱点排行</h2>
          <span class="text-xs" style="color: var(--practice-muted);">按错题数</span>
        </div>
        <div id="weakness-ranking-list" class="space-y-2">
          <p class="text-sm" style="color: var(--practice-muted);">加载中...</p>
        </div>
      </aside>
      <div id="wrong-queue" class="wrong-flow-cards">
        <div class="wrong-empty text-center py-8" style="color: var(--practice-muted);">
          <div class="flex justify-center mb-2" style="opacity: 0.3; color: var(--practice-muted);">${icon('clock')}</div>
          <p class="text-sm">加载中...</p>
        </div>
      </div>
    </div>
  `;
}

async function _initWrongTab() {
  const userId = state.user?.id;
  const subjects = await getSubjects();

  if (!userId) {
    const queueEl = document.getElementById('wrong-queue');
    if (queueEl) {
      queueEl.innerHTML = `
        <div class="text-center py-8">
          <div class="flex justify-center mb-2" style="opacity: 0.3; color: var(--practice-muted);">${icon('lock')}</div>
          <p class="text-sm font-semibold mb-1" style="color: var(--practice-text);">请登录后查看错题</p>
          <p class="text-xs" style="color: var(--practice-muted);">登录后刷题时答错的题会自动收录</p>
        </div>
      `;
    }
    _renderSubjects(subjects, {});
    _renderWeaknessRanking({ byReason: {} });
    return;
  }

  try {
    const [entries, stats] = await Promise.all([
      getReviewQueue(userId),
      getStats(userId)
    ]);

    _kbState.entries = entries;

    const subjectCounts = {};
    for (const e of entries) {
      subjectCounts[e.subject_id] = (subjectCounts[e.subject_id] || 0) + 1;
    }
    _renderSubjects(subjects, subjectCounts);
    _renderWrongQueue(entries);
    const todayCountEl = document.getElementById('today-review-count');
    if (todayCountEl) todayCountEl.textContent = String(entries.length);
    _renderWeaknessRanking(stats);
  } catch (e) {
    console.warn('[kb] 错题库数据加载失败:', e);
  }
}

function _renderWeaknessRanking(stats) {
  const el = document.getElementById('weakness-ranking-list');
  if (!el) return;
  const rows = Object.entries(stats.byReason || {})
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);
  if (rows.length === 0) {
    el.innerHTML = '<p class="text-sm" style="color: var(--practice-muted);">完成刷题总结后，这里会显示你的薄弱点。</p>';
    return;
  }
  const max = rows[0][1];
  el.innerHTML = rows.map(([reason, count]) => `
    <div class="weakness-ranking-row">
      <div class="flex items-center justify-between gap-3 text-xs mb-1">
        <span class="truncate" style="color: var(--practice-text);">${escapeHtml(reason)}</span>
        <strong style="color: var(--practice-accent);">${count}</strong>
      </div>
      <div class="weakness-ranking-bar"><span style="width: ${Math.max(10, Math.round((count / max) * 100))}%;"></span></div>
    </div>
  `).join('');
}

function _renderSubjects(subjects, counts) {
  const el = document.getElementById('wrong-subjects');
  if (!el) return;
  if (subjects.length === 0) {
    el.innerHTML = '<span class="text-sm" style="color: var(--practice-muted);">暂无学科数据</span>';
    return;
  }
  el.innerHTML = subjects.map((s, i) => {
    const count = counts[s] || 0;
    const active = i === 0 && !_kbState.currentSubject;
    return `
      <span class="px-3 py-1.5 rounded-lg text-sm font-semibold cursor-pointer subject-tab" data-subject="${s}" style="${active ? 'background: var(--practice-card-hover); color: var(--practice-text); border: 1px solid var(--practice-accent);' : 'background: var(--practice-card); color: var(--practice-muted); border: 1px solid var(--practice-border);'}">
        <span style="color: var(--practice-accent); margin-right: 4px; font-weight: 700;">${count}</span>${s}
      </span>
    `;
  }).join('');

  el.querySelectorAll('.subject-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      _kbState.currentSubject = tab.dataset.subject;
      el.querySelectorAll('.subject-tab').forEach(t => {
        t.style.background = 'var(--practice-card)';
        t.style.color = 'var(--practice-muted)';
        t.style.border = '1px solid var(--practice-border)';
      });
      tab.style.background = 'var(--practice-card-hover)';
      tab.style.color = 'var(--practice-text)';
      tab.style.border = '1px solid var(--practice-accent)';
      const filtered = _kbState.currentSubject
        ? _kbState.entries.filter(e => e.subject_id === _kbState.currentSubject)
        : _kbState.entries;
      _renderWrongQueue(filtered);
    });
  });
}

function _renderWrongQueue(entries) {
  const el = document.getElementById('wrong-queue');
  if (!el) return;
  if (entries.length === 0) {
    el.innerHTML = `
      <div class="wrong-empty text-center py-8">
        <div class="flex justify-center mb-2" style="opacity: 0.3; color: var(--practice-muted);">${icon('clipboard')}</div>
        <p class="text-sm font-semibold mb-1" style="color: var(--practice-text);">错题库为空</p>
        <p class="text-xs" style="color: var(--practice-muted);">刷题时答错的题会自动收录</p>
      </div>
    `;
    return;
  }
  el.innerHTML = entries.map(e => {
    const q = e.questions || {};
    const typeName = TYPE_NAMES[q.question_type] || '题型';
    const statusStyle = STATUS_STYLES[e.status] || '';
    const titleText = (q.title || q.content || '').slice(0, 60);
    const reasons = Array.isArray(e.reasons) && e.reasons.length > 0 ? e.reasons : (e.reason ? [e.reason] : []);
    return `
      <article class="today-review-card card" data-id="${e.id}" data-question-id="${q.id}" style="background: var(--practice-card); border-color: var(--practice-border); padding: 0.9rem;">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs px-2 py-0.5 rounded font-semibold" style="background: rgba(22, 163, 74, 0.15); color: var(--practice-accent);">${typeName}</span>
            <span class="text-xs px-2 py-0.5 rounded font-semibold" style="${statusStyle}">${e.status}</span>
          </div>
          <div class="text-sm font-medium" style="color: var(--practice-text);">${escapeHtml(titleText)}</div>
          <div class="flex flex-wrap gap-1 mt-2">${reasons.slice(0, 2).map(reason => `<span class="text-xs px-2 py-0.5 rounded" style="background: rgba(22, 163, 74, 0.1); color: var(--practice-accent);">${escapeHtml(reason)}</span>`).join('')}${reasons.length > 2 ? `<span class="text-xs px-2 py-0.5 rounded" style="background: var(--practice-card-hover); color: var(--practice-muted);">+${reasons.length - 2}</span>` : ''}</div>
          <div class="text-xs mt-1" style="color: var(--practice-muted);">错 ${e.wrong_count} 次 · 下次复习 ${e.next_review_at ? new Date(e.next_review_at).toLocaleDateString() : '—'}</div>
          <div class="flex items-center gap-2 mt-2 flex-wrap">
            ${q.id ? `<a href="/question/${q.id}" class="text-xs px-2.5 py-1 rounded-lg font-semibold" style="background: var(--practice-card-hover); color: var(--practice-text); border: 1px solid var(--practice-border);">查看解析</a>` : ''}
            <button class="text-xs px-2.5 py-1 rounded-lg font-semibold wrong-mark" data-id="${e.id}" data-question-id="${q.id}" style="background: rgba(22, 163, 74, 0.15); color: var(--practice-accent); border: 1px solid var(--practice-accent);">标记已掌握</button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  el.querySelectorAll('.wrong-mark').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const qid = btn.dataset.questionId;
      const userId = state.user?.id;
      if (!userId || !qid) return;
      markRight(userId, qid, null)
        .then(() => {
          _kbState.entries = _kbState.entries.filter(e => e.id !== id);
          _renderWrongQueue(_kbState.currentSubject
            ? _kbState.entries.filter(e => e.subject_id === _kbState.currentSubject)
            : _kbState.entries);
          const countEl = document.getElementById('today-review-count');
          if (countEl) countEl.textContent = String(_kbState.entries.length);
        })
        .catch(err => console.warn('[kb] 标记已掌握失败:', err));
    });
  });
}

// ============================================================
// 收藏 tab（第二期接入真数据，当前 mock 卡片展示布局）
// ============================================================
function _renderFavoritesTabBody() {
  return `
    <!-- 学科 + 分类筛选 tab -->
    <div class="flex gap-2 mb-6 flex-wrap">
      <span class="px-3 py-1.5 rounded-lg text-sm font-semibold" style="background: var(--practice-accent); color: #fff;">全部</span>
      <span class="px-3 py-1.5 rounded-lg text-sm font-semibold cursor-pointer" style="background: var(--practice-card); color: var(--practice-muted); border: 1px solid var(--practice-border);">理论</span>
      <span class="px-3 py-1.5 rounded-lg text-sm font-semibold cursor-pointer" style="background: var(--practice-card); color: var(--practice-muted); border: 1px solid var(--practice-border);">题目</span>
      <span class="px-3 py-1.5 rounded-lg text-sm font-semibold cursor-pointer" style="background: var(--practice-card); color: var(--practice-muted); border: 1px solid var(--practice-border);">试卷</span>
      <span class="px-3 py-1.5 rounded-lg text-sm font-semibold cursor-pointer" style="background: var(--practice-card); color: var(--practice-muted); border: 1px solid var(--practice-border);">文章</span>
    </div>

    <!-- 收藏卡片列表 -->
    <div id="favorites-list" class="space-y-3">
      <div class="card flex items-start gap-4" style="background: var(--practice-card); border-color: var(--practice-border); padding: 1.25rem;">
        <div class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style="background: rgba(22, 163, 74, 0.15); color: var(--practice-accent);">${icon('book', 22)}</div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs px-2 py-0.5 rounded font-semibold" style="background: rgba(22, 163, 74, 0.15); color: var(--practice-accent);">理论</span>
            <span class="text-xs" style="color: var(--practice-muted);">线性代数·第 1 章</span>
          </div>
          <div class="font-semibold text-sm mb-2" style="color: var(--practice-text);">错题收集：概念的充要条件</div>
        </div>
        <div class="flex flex-col items-end gap-2 shrink-0">
          <button class="text-sm px-3 py-1 rounded-lg font-semibold" style="background: var(--practice-accent); color: #fff;">继续刷题</button>
          <button class="text-lg" style="color: #FBBF24;" title="取消收藏">★</button>
        </div>
      </div>
      <div class="card flex items-start gap-4" style="background: var(--practice-card); border-color: var(--practice-border); padding: 1.25rem;">
        <div class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style="background: rgba(45, 210, 136, 0.15); color: var(--practice-accent-2);">${icon('doc', 22)}</div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs px-2 py-0.5 rounded font-semibold" style="background: rgba(45, 210, 136, 0.15); color: var(--practice-accent-2);">题目</span>
            <span class="text-xs" style="color: var(--practice-muted);">线性代数·第 2 章</span>
          </div>
          <div class="font-semibold text-sm mb-2" style="color: var(--practice-text);">错题：a + b + c 的充要条件...</div>
        </div>
        <div class="flex flex-col items-end gap-2 shrink-0">
          <button class="text-sm px-3 py-1 rounded-lg font-semibold" style="border: 1px solid var(--practice-border); color: var(--practice-text);">阅读</button>
          <button class="text-lg" style="color: #FBBF24;" title="取消收藏">★</button>
        </div>
      </div>
      <div class="card flex items-start gap-4" style="background: var(--practice-card); border-color: var(--practice-border); padding: 1.25rem;">
        <div class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style="background: rgba(22, 163, 74, 0.15); color: var(--practice-accent);">${icon('doc', 22)}</div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs px-2 py-0.5 rounded font-semibold" style="background: rgba(22, 163, 74, 0.15); color: var(--practice-accent);">试卷</span>
            <span class="text-xs" style="color: var(--practice-muted);">高等数学 A2 · 2019 年期末</span>
          </div>
          <div class="font-semibold text-sm mb-2" style="color: var(--practice-text);">已收藏 3 题</div>
        </div>
        <div class="flex flex-col items-end gap-2 shrink-0">
          <button class="text-sm px-3 py-1 rounded-lg font-semibold" style="background: var(--practice-accent); color: #fff;">继续刷题</button>
          <button class="text-lg" style="color: #FBBF24;" title="取消收藏">★</button>
        </div>
      </div>
      <div class="card flex items-start gap-4" style="background: var(--practice-card); border-color: var(--practice-border); padding: 1.25rem;">
        <div class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style="background: rgba(251, 191, 36, 0.15); color: #FBBF24;">${icon('newspaper', 22)}</div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs px-2 py-0.5 rounded font-semibold" style="background: rgba(251, 191, 36, 0.15); color: #FBBF24;">文章</span>
            <span class="text-xs" style="color: var(--practice-muted);">高等数学第 1 章</span>
          </div>
          <div class="font-semibold text-sm mb-2" style="color: var(--practice-text);">错题集详解：第 2 章的 1.2 节...</div>
        </div>
        <div class="flex flex-col items-end gap-2 shrink-0">
          <button class="text-sm px-3 py-1 rounded-lg font-semibold" style="border: 1px solid var(--practice-border); color: var(--practice-text);">阅读</button>
          <button class="text-lg" style="color: #FBBF24;" title="取消收藏">★</button>
        </div>
      </div>
    </div>
  `;
}

// ============================================================
// 初始化 + 交互绑定
// ============================================================
async function _initKnowledgeBase() {
  // 读用户曲线配置
  const userId = state.user?.id;
  if (userId) {
    try {
      _kbState.curve = await getUserCurve(userId);
    } catch (e) { /* 默认 classic */ }
  }

  _bindHeader();
  _bindTabSwitch();

  if (_kbState.tab === 'wrong') {
    _initWrongTab();
  }
}

function _bindHeader() {
  // 齿轮展开/收起
  const gear = document.getElementById('kb-curve-toggle');
  const panel = document.getElementById('kb-curve-panel');
  if (gear && panel) {
    gear.onclick = () => {
      _kbState.curvePanelOpen = !_kbState.curvePanelOpen;
      gear.classList.toggle('open', _kbState.curvePanelOpen);
      gear.setAttribute('aria-expanded', _kbState.curvePanelOpen ? 'true' : 'false');
      panel.hidden = !_kbState.curvePanelOpen;
    };
  }

  // 曲线选项
  document.querySelectorAll('.kb-curve-option').forEach(opt => {
    opt.addEventListener('click', async (e) => {
      e.preventDefault();
      const type = opt.dataset.curve;
      if (!type || type === _kbState.curve) return;
      _kbState.curve = type;
      document.querySelectorAll('.kb-curve-option').forEach(o => o.classList.toggle('active', o === opt));
      opt.querySelector('input[type="radio"]').checked = true;
      await _applyCurve(type);
    });
  });
}

async function _applyCurve(type) {
  const hint = document.getElementById('kb-curve-hint');
  const userId = state.user?.id;
  if (!userId) {
    if (hint) hint.textContent = '登录后生效';
    return;
  }
  if (hint) hint.textContent = '应用中…';
  try {
    const res = await switchCurve(userId, type);
    _kbState.curveApplied = true;
    if (hint) hint.textContent = res && res.updated != null ? `已更新 ${res.updated} 条` : '已切换';
  } catch (e) {
    if (hint) hint.textContent = '切换失败';
    return;
  }
  // 切换后重载错题队列（next_review_at 已按新曲线重算）
  if (_kbState.tab === 'wrong') {
    _initWrongTab();
  }
}

function _bindTabSwitch() {
  document.querySelectorAll('.kb-tab-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      const tab = pill.dataset.tab;
      if (!tab || tab === _kbState.tab) return;
      _kbState.tab = tab;
      document.querySelectorAll('.kb-tab-pill').forEach(p => p.classList.toggle('active', p === pill));
      const content = document.getElementById('kb-tab-content');
      if (!content) return;
      content.innerHTML = tab === 'wrong' ? _renderWrongTabBody() : _renderFavoritesTabBody();
      if (tab === 'wrong') _initWrongTab();
    });
  });
}
