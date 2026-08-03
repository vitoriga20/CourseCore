import { PLATFORM } from '../data/platform.js';
import { COURSES } from '../data/courses.js';
import { state, getTotalItems, getCompletedCount } from '../state.js';
import { escapeHtml } from '../utils.js';
import { href } from '../config/routes.js';
import { renderPillNav } from '../components/pillNav.js';

function renderLearnPanel() {
  return `
    <div>
      <h2 class="text-2xl font-bold mb-2" style="color: var(--fg);">认证课程</h2>
      <p class="mb-8" style="color: var(--muted);">每门课程由理论、示例、练习、项目与测验组成，完成即可解锁认证。</p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
        ${COURSES.map(course => {
          const total = getTotalItems(course);
          const done = getCompletedCount(course);
          return `<a href="${href('course', { courseId: course.id })}" class="card course-card cursor-pointer">
            <div class="flex items-start justify-between mb-3">
              <div class="w-10 h-10 rounded-xl border flex items-center justify-center" style="border-color: var(--line);">
                <span class="font-bold text-sm">${course.title.slice(0,1)}</span>
              </div>
              <span class="text-xs font-semibold px-2 py-1 rounded-full border" style="border-color: var(--line); color: var(--muted);">${done}/${total} 完成</span>
            </div>
            <h3 class="text-lg font-bold mb-2" style="color: var(--fg);">${escapeHtml(course.title)}</h3>
            <p class="text-sm mb-4" style="color: var(--muted);">${escapeHtml(course.description)}</p>
            <div class="progress-bar"><div class="progress-fill" style="width: ${total ? (done/total*100) : 0}%"></div></div>
          </a>`;
        }).join("")}
      </div>

      <h2 class="text-2xl font-bold mb-6" style="color: var(--fg);">学习路径</h2>
      <div class="card">
        <div class="flex flex-col md:flex-row md:items-center gap-4">
          <div class="flex-1">
            <h3 class="font-bold mb-1">理工科公共基础课路径</h3>
            <p class="text-sm" style="color: var(--muted);">高等数学 → 线性代数 → 大学物理 → 概率统计。适合大一到大二的系统学习。</p>
          </div>
          <a href="${href('course', { courseId: 'calculus-1' })}" class="btn-pill btn-ghost shrink-0">开始首门</a>
        </div>
      </div>
    </div>
  `;
}

function renderKBSummaryPanel() {
  const doneCount = Object.keys(state.completedQuestions).length;
  return `
    <div class="max-w-4xl mx-auto text-center">
      <div class="card mb-8">
        <div class="text-4xl font-extrabold mb-2" style="color: var(--fg);">${doneCount}</div>
        <div class="text-sm" style="color: var(--muted);">已收录已做过的题型与解法</div>
      </div>
      <p class="mb-8" style="color: var(--muted);">知识库自动汇总你在课程练习与刷题中完成过的题目。完成后即可查看标准解法，便于考前复习。</p>
      <a href="/kb" class="btn-pill btn-primary">进入知识库</a>
    </div>
  `;
}

function renderPracticePanel() {
  return `
    <div class="max-w-4xl mx-auto text-center">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div class="card text-center">
          <div class="text-3xl font-extrabold mb-1" style="color: var(--practice-accent);">0</div>
          <div class="text-xs" style="color: var(--muted);">试卷套数</div>
        </div>
        <div class="card text-center">
          <div class="text-3xl font-extrabold mb-1" style="color: var(--practice-accent);">0</div>
          <div class="text-xs" style="color: var(--muted);">题目数量</div>
        </div>
        <div class="card text-center">
          <div class="text-3xl font-extrabold mb-1" style="color: var(--practice-accent);">—</div>
          <div class="text-xs" style="color: var(--muted);">平均正确率</div>
        </div>
        <div class="card text-center">
          <div class="text-3xl font-extrabold mb-1" style="color: var(--practice-accent);">0h</div>
          <div class="text-xs" style="color: var(--muted);">刷题耗时</div>
        </div>
      </div>
      <p class="mb-8" style="color: var(--muted);">按试卷或按题型刷题，即时评判或模拟考试，错题自动收录复习。</p>
      <a href="/practice" class="btn-pill btn-primary" style="background: var(--practice-accent); border-color: var(--practice-accent);">进入刷题中心</a>
    </div>
  `;
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
