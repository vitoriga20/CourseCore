import { PLATFORM } from '../data/platform.js';
import { COURSES } from '../data/courses.js';
import { state, getTotalItems, getCompletedCount, isItemCompleted } from '../state.js';
import { escapeHtml } from '../utils.js';
import { href } from '../config/routes.js';
import { renderPillNav } from '../components/pillNav.js';
import { getTodayReview, getReviewQueue, getStats } from '../services/review-engine.js';
import { renderPracticeOverview } from './practice/index.js';

// 判断 item 是否属于某个课程（用于"继续上次"的跳转目标）
function isCourseItem(itemId) {
  for (const c of COURSES) {
    for (const m of c.modules) {
      if (m.items.some(i => i.id === itemId)) return true;
    }
  }
  return false;
}

// 找到课程下一个未完成的小节（"下一步动作"）
function nextItemOf(course) {
  for (const m of course.modules) {
    for (const i of m.items) {
      if (!isItemCompleted(i.id)) return i;
    }
  }
  return null;
}

// 学习路径卡"继续上次"：优先跳最近的 lastSession 小节，否则跳首门课程
function resumeTarget() {
  if (state.lastSession && isCourseItem(state.lastSession.itemId)) {
    return { href: `/item/${state.lastSession.itemId}`, label: '继续上次 →' };
  }
  return { href: href('course', { courseId: 'calculus-1' }), label: '开始首门 →' };
}

function renderLearnPanel() {
  const resume = resumeTarget();
  return `
    <div>
      <h2 class="text-2xl font-bold mb-2" style="color: var(--fg);">认证课程</h2>
      <p class="mb-8" style="color: var(--muted);">每门课程由理论、示例、练习与测验组成，完成即可解锁认证。</p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
        ${COURSES.map(course => {
          const total = getTotalItems(course);
          const done = getCompletedCount(course);
          const next = nextItemOf(course);
          const nextAction = next
            ? `<a href="/item/${next.id}" class="btn-pill btn-primary inline-flex items-center gap-1 mt-3">${next.type === 'theory' ? '继续学习' : '继续练习'} →</a>`
            : `<span class="inline-flex items-center gap-1 mt-3 text-sm font-semibold" style="color: var(--success);">已全部完成</span>`;
          return `<div class="card course-card">
            <div class="flex items-start justify-between mb-3">
              <div class="w-10 h-10 rounded-xl border flex items-center justify-center" style="border-color: var(--line);">
                <span class="font-bold text-sm">${course.title.slice(0,1)}</span>
              </div>
              <span class="text-xs font-semibold px-2 py-1 rounded-full border" style="border-color: var(--line); color: var(--muted);">${done}/${total} 完成</span>
            </div>
            <h3 class="text-lg font-bold mb-2" style="color: var(--fg);">${escapeHtml(course.title)}</h3>
            <p class="text-sm mb-4" style="color: var(--muted);">${escapeHtml(course.description)}</p>
            <div class="progress-bar"><div class="progress-fill" style="width: ${total ? (done/total*100) : 0}%"></div></div>
            <div class="flex items-center justify-between gap-3 mt-4">
              <a href="${href('course', { courseId: course.id })}" class="text-sm font-semibold" style="color: var(--muted);">查看目录 →</a>
              ${nextAction}
            </div>
          </div>`;
        }).join("")}
      </div>

      <h2 class="text-2xl font-bold mb-6" style="color: var(--fg);">学习路径</h2>
      <div class="card">
        <div class="flex flex-col md:flex-row md:items-center gap-4">
          <div class="flex-1">
            <h3 class="font-bold mb-1">理工科公共基础课路径</h3>
            <p class="text-sm" style="color: var(--muted);">高等数学 → 线性代数 → 大学物理 → 概率统计。适合大一到大二的系统学习。</p>
          </div>
          <a href="${resume.href}" class="btn-pill btn-ghost shrink-0">${resume.label}</a>
        </div>
      </div>
    </div>
  `;
}

function renderKBSummaryPanel() {
  const doneCount = Object.keys(state.completedQuestions).length;
  return `
    <div class="max-w-4xl mx-auto">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div class="card text-center">
          <div class="text-3xl font-extrabold mb-1" style="color: var(--primary);">${doneCount}</div>
          <div class="text-xs" style="color: var(--muted);">累计做题</div>
        </div>
        <div class="card text-center">
          <div id="landing-kb-today" class="text-3xl font-extrabold mb-1" style="color: var(--primary);">–</div>
          <div class="text-xs" style="color: var(--muted);">今日待复习</div>
        </div>
        <div class="card text-center">
          <div id="landing-kb-due" class="text-3xl font-extrabold mb-1" style="color: var(--primary);">–</div>
          <div class="text-xs" style="color: var(--muted);">即将遗忘</div>
        </div>
        <div class="card text-center">
          <div id="landing-kb-weak" class="truncate text-sm font-extrabold mb-1" style="color: var(--primary);">–</div>
          <div class="text-xs" style="color: var(--muted);">最薄弱考点</div>
        </div>
      </div>
      <div class="text-center">
        <p class="mb-8" style="color: var(--muted);">知识库统一管理刷题过程中的错题与收藏，支持按学科筛选、错误原因/考点雷达分析，并可切换经典/紧凑复习曲线，按节奏复盘巩固。</p>
        <a href="/kb" class="btn-pill btn-primary">进入知识库</a>
      </div>
    </div>
  `;
}

function renderPracticePanel() {
  // 刷题 tab 直接复用"刷题板块"（/practice）的完整渲染，消除内容重叠
  return renderPracticeOverview();
}

// 首页知识库 tab 异步补充数据（页面 mount 后调用）
export function initLandingContent() {
  if (state.landingTab === 'kb') {
    if (!state.user) {
      const set = (id, txt) => { const n = document.getElementById(id); if (n) n.textContent = txt; };
      set('landing-kb-today', '–');
      set('landing-kb-due', '–');
      set('landing-kb-weak', '–');
      return;
    }
    const uid = state.user.id;
    const todayEl = document.getElementById('landing-kb-today');
    const dueEl = document.getElementById('landing-kb-due');
    const weakEl = document.getElementById('landing-kb-weak');
    if (!todayEl) return;

    getTodayReview(uid).then(rows => {
      if (document.getElementById('landing-kb-today')) todayEl.textContent = Array.isArray(rows) ? rows.length : 0;
    }).catch(() => { if (document.getElementById('landing-kb-today')) todayEl.textContent = '–'; });

    getReviewQueue(uid).then(rows => {
      if (!document.getElementById('landing-kb-due')) return;
      const now = Date.now();
      const due = Array.isArray(rows) ? rows.filter(r => {
        const t = r.next_review_at ? new Date(r.next_review_at).getTime() : 0;
        return t > 0 && t - now <= 24 * 3600 * 1000;
      }).length : 0;
      dueEl.textContent = due;
    }).catch(() => { if (document.getElementById('landing-kb-due')) dueEl.textContent = '–'; });

    getStats(uid).then(stats => {
      if (!document.getElementById('landing-kb-weak')) return;
      const byTag = stats && stats.byTag ? stats.byTag : {};
      const entries = Object.entries(byTag).sort((a, b) => b[1] - a[1]);
      weakEl.textContent = entries.length ? entries[0][0] : '暂无';
    }).catch(() => { if (document.getElementById('landing-kb-weak')) weakEl.textContent = '–'; });
    return;
  }
}

function renderCommunityPanel() {
  return `
    <div class="max-w-4xl mx-auto text-center">
      <div class="card mb-8">
        <div class="text-4xl font-extrabold mb-2" style="color: var(--fg);">社区</div>
        <div class="text-sm" style="color: var(--muted);">刷题技巧分享 · 方法讨论 · 经验交流</div>
      </div>
      <p class="mb-8" style="color: var(--muted);">分享你的刷题技巧和学习方法，或浏览其他同学的经验分享。</p>
      <a href="/community" class="btn-pill btn-primary">进入社区</a>
    </div>
  `;
}

function renderMePanel() {
  return `
    <div class="max-w-4xl mx-auto text-center">
      <div class="card mb-8">
        <div class="text-4xl font-extrabold mb-2" style="color: var(--fg);">我的</div>
        <div class="text-sm" style="color: var(--muted);">刷题记录 · 收藏 · 错题统计</div>
      </div>
      <p class="mb-8" style="color: var(--muted);">查看你的刷题历史、正确率趋势和复习计划。</p>
      <a href="/user/records" class="btn-pill btn-primary">查看刷题记录</a>
    </div>
  `;
}

export function renderLandingContent() {
  switch (state.landingTab) {
    case 'learn': return renderLearnPanel();
    case 'practice': return renderPracticePanel();
    case 'kb': return renderKBSummaryPanel();
    case 'community': return renderCommunityPanel();
    case 'me': return renderMePanel();
    default: return renderLearnPanel();
  }
}

export function renderLanding() {
  const items = [
    { label: '学习', value: 'learn' },
    { label: '刷题', value: 'practice' },
    { label: '知识库', value: 'kb' },
    { label: '社区', value: 'community' },
    { label: '我的', value: 'me' }
  ];
  const tabOrder = ['learn', 'practice', 'kb', 'community', 'me'];
  const activeIndex = Math.max(0, tabOrder.indexOf(state.landingTab));

  return `
    <section class="max-w-4xl mx-auto text-center pt-10 pb-12">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-6 border" style="border-color: var(--line); color: var(--muted);">
        <div class="w-5 h-5 rounded-full border flex items-center justify-center" style="border-color: var(--accent);">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--accent);">
            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
            <path d="M2 17l10 5 10-5"></path>
            <path d="M2 12l10 5 10-5"></path>
          </svg>
        </div>
        真题突破·学霸解题·分层练习
      </div>
      <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6" style="color: var(--fg);">
        ${PLATFORM.name}
      </h1>
      <p class="text-lg sm:text-xl mb-8 max-w-2xl mx-auto" style="color: var(--muted);">
        ${PLATFORM.tagline}
      </p>
    </section>

    <section class="max-w-6xl mx-auto pb-16">
      <div class="flex items-center justify-center mb-8">
        ${renderPillNav(items, activeIndex)}
      </div>

      <div id="landing-content">
        ${renderLandingContent()}
      </div>
    </section>
  `;
}
