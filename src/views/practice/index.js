// 刷题板块视图（第一期骨架，直接接真数据）
import { getExamPapers, getSubjects, getQuestionTypeStats } from '../../services/practice-data.js';
import { state } from '../../state.js';
import { escapeHtml } from '../../utils.js';
import { supabase } from '../../services/supabase.js';
import { getTodayReview, getStats } from '../../services/review-engine.js';
import { marked } from 'marked';

// ============================================================
// 工具
// ============================================================
function pageShell(content) {
  return `
    <section class="max-w-5xl mx-auto px-4 pt-8 pb-16" style="min-height: 70vh;">
      ${content}
    </section>
  `;
}

function statCard(value, label) {
  return `
    <div class="card text-center" style="background: var(--practice-card); border-color: var(--practice-border);">
      <div class="text-3xl font-extrabold mb-1" style="color: var(--practice-accent);">${value}</div>
      <div class="text-xs" style="color: var(--practice-muted);">${label}</div>
    </div>
  `;
}

function emptyState(msg) {
  return `
    <div class="card text-center py-12" style="background: var(--practice-card); border-color: var(--practice-border);">
      <div class="mb-3 flex justify-center" style="opacity: 0.3; color: var(--practice-muted);">
        ${icon('doc')}
      </div>
      <p style="color: var(--practice-muted);">${msg}</p>
    </div>
  `;
}

// 内联 SVG 图标（黑白线性风格，跟随 currentColor）
function icon(name, size = 40) {
  const paths = {
    trophy: '<path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4zM7 4H4v2a3 3 0 0 0 3 3M17 4h3v2a3 3 0 0 1-3 3"></path>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"></path>',
    doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line>',
    star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>',
    clipboard: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>',
    clock: '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>',
    newspaper: '<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-4 0V6"></path><line x1="10" y1="8" x2="18" y2="8"></line><line x1="10" y1="12" x2="18" y2="12"></line><line x1="10" y1="16" x2="18" y2="16"></line><line x1="6" y1="8" x2="6.01" y2="8"></line><line x1="6" y1="12" x2="6.01" y2="12"></line>',
    comment: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>',
    play: '<polygon points="6 3 20 12 6 21 6 3"></polygon>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>',
    grid: '<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>',
    alert: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>',
    star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>'
  };
  const body = paths[name] || paths.doc;
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

// ============================================================
// Screen 1: 刷题概览
// ============================================================
export function renderPracticeOverview() {
  _loadOverviewData();
  return pageShell(`
    <!-- 页头：标题 + 弱化入口 -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-extrabold" style="color: var(--practice-text);">刷题板块</h1>
        <p class="text-xs mt-1" style="color: var(--practice-muted);">按学科抓重点 · 按题型补短板 · 精准刷提效</p>
      </div>
      <a href="/practice/add" class="text-xs font-bold flex items-center gap-1.5 px-3 py-2 rounded-lg transition" style="background: var(--practice-card-hover); color: var(--practice-accent);">
        ${icon('plus', 14)} 添加我的试卷
      </a>
    </div>

    <!-- 主区：状态仪表盘（一个主视觉，不分卡片） -->
    <div class="rounded-2xl p-6 mb-4" style="background: var(--practice-card);">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- 继续上次 + 今日待复习 -->
        <div class="space-y-5">
          <div>
            <div class="text-xs font-bold mb-2 flex items-center gap-1.5" style="color: var(--practice-muted);">
              ${icon('play', 13)} 继续上次
            </div>
            <div id="overview-resume" class="text-sm" style="color: var(--practice-muted);">加载中...</div>
          </div>
          <div>
            <div class="text-xs font-bold mb-2 flex items-center gap-1.5" style="color: var(--practice-muted);">
              ${icon('clock', 13)} 今日待复习
            </div>
            <div id="overview-today" class="text-sm" style="color: var(--practice-muted);">加载中...</div>
          </div>
        </div>
        <!-- 薄弱考点 + 主行动按钮 -->
        <div class="flex flex-col justify-between gap-5">
          <div>
            <div class="text-xs font-bold mb-2 flex items-center gap-1.5" style="color: var(--practice-muted);">
              ${icon('alert', 13)} 薄弱考点
            </div>
            <div id="overview-weak" class="text-sm" style="color: var(--practice-muted);">加载中...</div>
          </div>
          <a href="/practice/exams" class="btn-pill flex items-center justify-center gap-2 w-full" style="background: var(--practice-accent); color: #fff; padding: 0.9rem 2rem; font-weight: 700; font-size: 1rem;">
            ${icon('play', 18)} 开始刷题
          </a>
        </div>
      </div>
    </div>

    <!-- 辅助区：统计指标（一行内联，无边框） -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
      <div class="rounded-xl px-4 py-3" style="background: var(--practice-card);">
        <div class="text-2xl font-extrabold" style="color: var(--practice-text); line-height: 1.2;" data-stat="exam-count">…</div>
        <div class="text-xs mt-1" style="color: var(--practice-muted);">累计试卷</div>
      </div>
      <div class="rounded-xl px-4 py-3" style="background: var(--practice-card);">
        <div class="text-2xl font-extrabold" style="color: var(--practice-text); line-height: 1.2;" data-stat="question-count">…</div>
        <div class="text-xs mt-1" style="color: var(--practice-muted);">累计题目</div>
      </div>
      <div class="rounded-xl px-4 py-3" style="background: var(--practice-card);">
        <div class="text-2xl font-extrabold" style="color: var(--practice-accent); line-height: 1.2;" data-stat="accuracy">—</div>
        <div class="text-xs mt-1" style="color: var(--practice-muted);">正确率</div>
      </div>
      <div class="rounded-xl px-4 py-3" style="background: var(--practice-card);">
        <div class="text-2xl font-extrabold" style="color: var(--practice-text); line-height: 1.2;" data-stat="hours">0h</div>
        <div class="text-xs mt-1" style="color: var(--practice-muted);">总耗时</div>
      </div>
    </div>

    <!-- 辅助区：排行榜 + 最近练习（两栏压缩） -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="rounded-xl p-4" style="background: var(--practice-card);">
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm font-bold flex items-center gap-1.5" style="color: var(--practice-text);">${icon('trophy', 15)} 排行榜</span>
          <div class="flex gap-1 text-xs">
            <span class="px-2 py-1 rounded font-semibold cursor-pointer lb-tab" data-sort="exam_count" style="background: var(--practice-accent); color: #fff;">试卷数</span>
            <span class="px-2 py-1 rounded font-semibold cursor-pointer lb-tab" data-sort="total_questions" style="background: var(--practice-card-hover); color: var(--practice-muted);">题量</span>
            <span class="px-2 py-1 rounded font-semibold cursor-pointer lb-tab" data-sort="avg_accuracy" style="background: var(--practice-card-hover); color: var(--practice-muted);">正确率</span>
            <span class="px-2 py-1 rounded font-semibold cursor-pointer lb-tab" data-sort="total_hours" style="background: var(--practice-card-hover); color: var(--practice-muted);">耗时</span>
          </div>
        </div>
        <div id="leaderboard-list" class="space-y-1.5">
          <div class="text-center py-5 text-sm" style="color: var(--practice-muted);">加载中...</div>
        </div>
      </div>
      <div class="rounded-xl p-4" style="background: var(--practice-card);">
        <span class="text-sm font-bold mb-3 flex items-center gap-1.5" style="color: var(--practice-text);">${icon('book', 15)} 最近练习</span>
        <div id="recent-list" class="space-y-2.5 mt-3">
          <div class="text-center py-5 text-sm" style="color: var(--practice-muted);">加载中...</div>
        </div>
      </div>
    </div>
  `);
}

async function _loadOverviewData() {
  try {
    // 指标卡
    const papers = await getExamPapers();
    const examCount = papers.length;
    const questionCount = papers.reduce((sum, p) =>
      sum + (p.sections || []).reduce((s, sec) => s + (sec.questions || []).length, 0), 0);

    const examEl = document.querySelector('[data-stat="exam-count"]');
    const qEl = document.querySelector('[data-stat="question-count"]');
    if (examEl) examEl.textContent = String(examCount);
    if (qEl) qEl.textContent = String(questionCount);

    // 个人正确率 / 总耗时（从 practice_records 聚合）
    const userId = state.user?.id;
    const accEl = document.querySelector('[data-stat="accuracy"]');
    const hoursEl = document.querySelector('[data-stat="hours"]');
    if (userId && supabase) {
      const { data: records } = await supabase
        .from('practice_records')
        .select('accuracy, duration_seconds, correct, total')
        .eq('user_id', userId);
      const recs = records || [];
      const totalQ = recs.reduce((s, r) => s + (r.total || 0), 0);
      const correctQ = recs.reduce((s, r) => s + (r.correct || 0), 0);
      const accuracy = totalQ > 0 ? Math.round((correctQ / totalQ) * 100) : 0;
      const totalSec = recs.reduce((s, r) => s + (r.duration_seconds || 0), 0);
      const hours = totalSec >= 3600 ? (totalSec / 3600).toFixed(1) : (totalSec / 60).toFixed(0);
      if (accEl) accEl.textContent = accuracy + '%';
      if (hoursEl) hoursEl.textContent = totalSec >= 3600 ? `${hours}h` : `${hours}m`;
    } else {
      if (accEl) accEl.textContent = '—';
      if (hoursEl) hoursEl.textContent = '0h';
    }

    // 继续上次（个人任务区）
    const resumeEl = document.getElementById('overview-resume');
    if (resumeEl) {
      const ls = state.lastSession;
      if (ls) {
        const acc = ls.total ? Math.round((ls.correct / ls.total) * 100) : 0;
        resumeEl.innerHTML = `
          <div class="flex items-center justify-between gap-3">
            <div class="font-semibold truncate" style="color: var(--practice-text);">${escapeHtml(ls.title || '最近练习')}</div>
            <a href="/practice/quiz" class="text-xs font-bold shrink-0" style="color: var(--practice-accent);">继续 →</a>
          </div>
          <div class="flex items-center gap-3 mt-2">
            <div class="progress-bar flex-1"><div class="progress-fill" style="width: ${acc}%"></div></div>
            <span class="text-xs font-semibold" style="color: var(--practice-muted);">${ls.correct}/${ls.total} 正确</span>
          </div>
        `;
      } else {
        resumeEl.innerHTML = `
          <div style="color: var(--practice-muted);">还没有练习记录，点下方「开始刷题」。</div>
        `;
      }
    }

    // 今日待复习（个人任务区）
    const todayEl = document.getElementById('overview-today');
    if (todayEl) {
      if (userId) {
        getTodayReview(userId).then(rows => {
          if (!document.getElementById('overview-today')) return;
          const count = Array.isArray(rows) ? rows.length : 0;
          todayEl.innerHTML = count > 0
            ? `<div class="flex items-center justify-between">
                <div>
                  <div class="text-3xl font-extrabold" style="color: var(--practice-accent);">${count}</div>
                  <div class="text-xs" style="color: var(--practice-muted);">道错题待复习</div>
                </div>
              </div>`
            : `<div style="color: var(--practice-muted);">今天没有待复习错题，继续保持！</div>`;
        }).catch(() => {
          if (todayEl) todayEl.innerHTML = `<div style="color: var(--practice-muted);">数据暂不可用</div>`;
        });
      } else {
        todayEl.innerHTML = `<div style="color: var(--practice-muted);">登录后查看今日待复习</div>`;
      }
    }

    // 排行榜：读取全部用户（含 0 刷题），后端按注册时间排好序
    let leaderboardData = [];
    if (supabase) {
      try {
        const { data, error } = await supabase.rpc('get_leaderboard');
        if (!error) {
          leaderboardData = data || [];
        } else {
          console.warn('[practice] get_leaderboard RPC 失败，降级到 leaderboard_view:', error.message);
          const { data: viewData } = await supabase.from('leaderboard_view').select('*');
          leaderboardData = viewData || [];
        }
      } catch (e) {
        console.warn('[practice] 排行榜加载失败:', e);
      }
    }
    _renderLeaderboard(leaderboardData, 'exam_count');

    // 排行榜 tab 切换
    document.querySelectorAll('.lb-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.lb-tab').forEach(t => {
          t.style.background = 'var(--practice-card-hover)';
          t.style.color = 'var(--practice-muted)';
        });
        tab.style.background = 'var(--practice-accent)';
        tab.style.color = '#fff';
        _renderLeaderboard(leaderboardData, tab.dataset.sort);
      });
    });

    // 最近练习
    if (userId && supabase) {
      const { data: recent } = await supabase
        .from('practice_records')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(2);
      _renderRecent(recent || []);
    } else {
      _renderRecent([]);
    }
  } catch (e) {
    console.warn('[practice] 概览数据加载失败:', e);
  }
}

function _renderLeaderboard(data, sortKey) {
  const el = document.getElementById('leaderboard-list');
  if (!el) return;
  if (!data || data.length === 0) {
    el.innerHTML = `
      <div class="text-center py-6">
        <div class="flex justify-center mb-2" style="opacity: 0.3; color: var(--practice-muted);">${icon('trophy', 32)}</div>
        <p class="text-sm font-semibold mb-1" style="color: var(--practice-text);">暂无排行数据</p>
        <p class="text-xs" style="color: var(--practice-muted);">开始刷题即可上榜</p>
      </div>
    `;
    return;
  }
  const sorted = [...data].sort((a, b) => {
    const av = a[sortKey] ?? 0;
    const bv = b[sortKey] ?? 0;
    if (av !== bv) return bv - av;
    // 同分（含 0）按注册时间先后排序
    return new Date(a.created_at || 0) - new Date(b.created_at || 0);
  });
  const userId = state.user?.id;
  const units = { exam_count: ' 套', total_questions: ' 题', avg_accuracy: '%', total_hours: 'h' };

  el.innerHTML = sorted.slice(0, 10).map((row, i) => {
    const isMe = row.user_id === userId;
    const val = row[sortKey] || 0;
    const display = val + (units[sortKey] || '');
    return `
      <div class="flex items-center justify-between py-2 px-3 rounded" style="${isMe ? 'border: 1px solid var(--practice-accent); background: rgba(22, 163, 74, 0.08);' : 'background: var(--practice-card-hover);'}">
        <div class="flex items-center gap-3">
          <span class="font-bold w-6 text-center" style="color: ${isMe ? 'var(--practice-accent)' : 'var(--practice-muted)'};">${isMe ? '我' : (i + 1)}</span>
          <span style="color: ${isMe ? 'var(--practice-accent)' : 'var(--practice-text)'};">${escapeHtml(row.display_name || '匿名用户')}</span>
        </div>
        <span class="text-sm font-semibold" style="color: var(--practice-accent);">${display}</span>
      </div>
    `;
  }).join('');
}

function _renderRecent(records) {
  const el = document.getElementById('recent-list');
  if (!el) return;
  if (!records || records.length === 0) {
    el.innerHTML = `
      <div class="text-center py-6">
        <div class="flex justify-center mb-2" style="opacity: 0.3; color: var(--practice-muted);">${icon('book', 32)}</div>
        <p class="text-sm font-semibold mb-1" style="color: var(--practice-text);">还没有练习记录</p>
        <p class="text-xs" style="color: var(--practice-muted);">完成首次刷题后显示</p>
      </div>
    `;
    return;
  }
  el.innerHTML = records.map(r => {
    const acc = Math.round(r.accuracy || 0);
    const duration = r.duration_seconds ? `${Math.floor(r.duration_seconds / 60)}分` : '—';
    return `
      <div class="p-3 rounded" style="background: var(--practice-card-hover);">
        <div class="font-semibold mb-1 text-sm" style="color: var(--practice-text);">${escapeHtml(r.source_name || '刷题记录')}</div>
        <div class="flex items-center justify-between text-xs mb-2">
          <span style="color: var(--practice-muted);">耗时${duration}</span>
          <span style="color: var(--practice-accent); font-weight: 600;">正确${acc}%</span>
        </div>
        <div class="h-1 rounded-full overflow-hidden" style="background: var(--practice-border);">
          <div class="h-full rounded-full" style="background: var(--practice-accent); width: ${acc}%;"></div>
        </div>
      </div>
    `;
  }).join('');
}

// ============================================================
// Screen 2: 刷题中心·按试卷
// ============================================================
export function renderPracticeExams() {
  _loadExamsData();
  return pageShell(`
    <!-- 顶部 tab -->
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-extrabold" style="color: var(--practice-text);">刷题中心</h1>
      <div class="flex gap-1 p-1 rounded-xl" style="background: var(--practice-card); border: 1px solid var(--practice-border);">
        <span class="px-4 py-2 rounded-lg text-sm font-semibold" style="background: var(--practice-accent); color: #fff;">按试卷</span>
        <a href="/practice/types" class="px-4 py-2 rounded-lg text-sm font-semibold" style="color: var(--practice-muted);">按题型</a>
      </div>
    </div>

    <!-- 主体两栏：学科树 + 试卷预览 -->
    <div class="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4">
      <!-- 左：学科→试卷二级树 -->
      <div class="card" style="background: var(--practice-card); border-color: var(--practice-border); padding: 1rem;">
        <div id="exams-tree" class="space-y-1 text-sm">
          <div class="text-center py-4" style="color: var(--practice-muted);">加载学科中...</div>
        </div>
      </div>

      <!-- 右：试卷预览 -->
      <div id="exam-preview" class="card" style="background: var(--practice-card); border-color: var(--practice-border); padding: 1.5rem;">
        <div class="text-center py-12" style="color: var(--practice-muted);">请从左侧选择试卷</div>
      </div>
    </div>
  `);
}

async function _loadExamsData() {
  try {
    const papers = await getExamPapers();

    // 读用户已刷记录
    const userId = state.user?.id;
    const practicedSet = new Set();
    if (userId && supabase) {
      const { data } = await supabase
        .from('practice_records')
        .select('source_id, accuracy')
        .eq('user_id', userId)
        .eq('mode', 'exam')
        .order('created_at', { ascending: false });
      (data || []).forEach(r => practicedSet.add(r.source_id));
    }

    const grouped = {};
    for (const p of papers) {
      const subject = p.subject || '其他';
      if (!grouped[subject]) grouped[subject] = [];
      grouped[subject].push(p);
    }

    const treeEl = document.getElementById('exams-tree');
    if (!treeEl) return;

    let firstPaperId = null;
    const html = Object.entries(grouped).map(([subject, list], i) => `
      <div>
        <div class="flex items-center justify-between px-2 py-1.5 rounded font-semibold cursor-pointer" style="background: ${i === 0 ? 'rgba(22, 163, 74, 0.12)' : 'transparent'}; color: var(--practice-text);">
          <span>${subject}</span>
          <span class="text-xs" style="color: var(--practice-accent);">${list.length} 套</span>
        </div>
        <div class="ml-2 mt-1 space-y-1">
          ${list.map((p, j) => {
            const active = i === 0 && j === 0;
            if (active) firstPaperId = p.id;
            const practiced = practicedSet.has(p.id);
            return `
              <div class="px-3 py-1.5 rounded text-sm cursor-pointer exam-item flex items-center gap-2" data-paper-id="${p.id}" style="background: ${active ? 'var(--practice-accent)' : 'transparent'}; color: ${active ? '#fff' : 'var(--practice-text)'};">
                <span>${p.subject} · ${p.term || ''}</span>
                ${practiced ? `<span class="w-2 h-2 rounded-full" style="background: ${active ? '#fff' : 'var(--practice-accent)'};"></span>` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `).join('');

    treeEl.innerHTML = html;

    // 绑定点击切换试卷预览
    treeEl.querySelectorAll('.exam-item').forEach(el => {
      el.addEventListener('click', () => {
        treeEl.querySelectorAll('.exam-item').forEach(e => {
          e.style.background = 'transparent';
          e.style.color = 'var(--practice-text)';
          const dot = e.querySelector('.w-2.h-2.rounded-full');
          if (dot) dot.style.background = 'var(--practice-accent)';
        });
        el.style.background = 'var(--practice-accent)';
        el.style.color = '#fff';
        const dot = el.querySelector('.w-2.h-2.rounded-full');
        if (dot) dot.style.background = '#fff';
        const paper = papers.find(p => p.id === el.dataset.paperId);
        if (paper) _renderExamPreview(paper, practicedSet);
      });
    });

    // 默认选中第一个
    if (firstPaperId) {
      const paper = papers.find(p => p.id === firstPaperId);
      if (paper) _renderExamPreview(paper, practicedSet);
    }
  } catch (e) {
    console.warn('[practice] 按试卷数据加载失败:', e);
  }
}

function _renderExamPreview(paper, practicedSet = new Set()) {
  const previewEl = document.getElementById('exam-preview');
  if (!previewEl) return;

  const practiced = practicedSet.has(paper.id);

  // 统计题型
  const typeStats = {};
  for (const sec of paper.sections || []) {
    for (const q of sec.questions || []) {
      typeStats[q.questionType] = (typeStats[q.questionType] || 0) + 1;
    }
  }
  const TYPE_NAMES = { 0: '单选', 1: '多选', 2: '填空', 3: '解答', 4: '证明', 5: '判断' };
  const total = Object.values(typeStats).reduce((a, b) => a + b, 0);
  const typeRows = Object.entries(typeStats)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([t, n]) => `<span>${TYPE_NAMES[t] || t} ${n}</span>`)
    .join('<span style="color: var(--practice-border); margin: 0 8px;">·</span>');

  // 题型构成条
  const typeColors = { 0: '#16A34A', 1: '#2DD288', 2: '#7C3AED', 3: '#3B82F6', 4: '#FBBF24', 5: '#EF5350' };
  const segments = Object.entries(typeStats)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([t, n]) => `<div style="background: ${typeColors[t] || '#16A34A'}; flex: ${n};"></div>`)
    .join('');

  previewEl.innerHTML = `
    <div class="text-xs mb-2" style="color: var(--practice-muted);">${paper.school || ''} ${paper.college || ''}</div>
    <h2 class="text-2xl font-extrabold mb-2" style="color: var(--practice-text);">${paper.subject} · ${paper.term || ''}</h2>
    <div class="flex items-center gap-3 text-sm mb-4" style="color: var(--practice-muted);">
      <span>${total} 题</span>
      <span style="color: var(--practice-border);">·</span>
      <span>${paper.duration || '120分钟'}</span>
      <span style="color: var(--practice-border);">·</span>
      <span>上次成绩 <span style="color: var(--practice-accent); font-weight: 600;">${practiced ? '已刷' : '—'}</span></span>
    </div>
    <div class="flex h-2 rounded-full overflow-hidden mb-3" style="background: var(--practice-border);">
      ${segments}
    </div>
    <div class="flex flex-wrap gap-y-1 text-xs mb-6" style="color: var(--practice-muted);">
      ${typeRows}
    </div>
    <button id="enter-exam-btn" data-exam-id="${paper.id}" class="btn-pill" style="background: var(--practice-accent); color: #fff; padding: 0.75rem 2rem; font-weight: 700;">
      进入试卷 →
    </button>
  `;

  // 绑定进入试卷按钮
  const examBtn = previewEl.querySelector('#enter-exam-btn');
  if (examBtn) {
    examBtn.onclick = () => {
      sessionStorage.setItem('practice-session', JSON.stringify({ examId: examBtn.dataset.examId }));
      window.location.href = '/practice/quiz';
    };
  }
}

// ============================================================
// Screen 10: 刷题中心·按题型
// ============================================================
export function renderPracticeTypes() {
  _loadTypesData();
  return pageShell(`
    <!-- 顶部 tab -->
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-extrabold" style="color: var(--practice-text);">刷题中心</h1>
      <div class="flex gap-1 p-1 rounded-xl" style="background: var(--practice-card); border: 1px solid var(--practice-border);">
        <a href="/practice/exams" class="px-4 py-2 rounded-lg text-sm font-semibold" style="color: var(--practice-muted);">按试卷</a>
        <span class="px-4 py-2 rounded-lg text-sm font-semibold" style="background: var(--practice-accent); color: #fff;">按题型</span>
      </div>
    </div>

    <!-- 主体两栏：学科→题型树 + 题型组预览 -->
    <div class="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4">
      <!-- 左：学科→题型二级树 -->
      <div class="card" style="background: var(--practice-card); border-color: var(--practice-border); padding: 1rem;">
        <div id="types-tree" class="space-y-1 text-sm">
          <div class="text-center py-4" style="color: var(--practice-muted);">加载题型中...</div>
        </div>
      </div>

      <!-- 右：题型组预览 -->
      <div id="type-preview" class="card" style="background: var(--practice-card); border-color: var(--practice-border); padding: 1.5rem;">
        <div class="text-center py-12" style="color: var(--practice-muted);">请从左侧选择学科 + 题型</div>
      </div>
    </div>
  `);
}

async function _loadTypesData() {
  try {
    const stats = await getQuestionTypeStats();
    const TYPE_NAMES = { 0: '单选', 1: '多选', 2: '填空', 3: '解答', 4: '证明', 5: '判断' };

    const treeEl = document.getElementById('types-tree');
    if (!treeEl) return;

    let firstKey = null;
    const html = Object.entries(stats).map(([subject, types], i) => {
      const typeItems = Object.entries(types)
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([t, n], j) => {
          const active = i === 0 && j === 0;
          if (active) firstKey = `${subject}|${t}`;
          return `
            <div class="px-3 py-1.5 rounded text-sm cursor-pointer type-item" data-subject="${subject}" data-type="${t}" style="background: ${active ? 'var(--practice-accent)' : 'transparent'}; color: ${active ? '#fff' : 'var(--practice-text)'};">
              ${TYPE_NAMES[t] || t} <span style="opacity: 0.7; margin-left: 4px;">${n}</span>
            </div>
          `;
        }).join('');

      return `
        <div>
          <div class="flex items-center justify-between px-2 py-1.5 rounded font-semibold" style="background: ${i === 0 ? 'rgba(22, 163, 74, 0.12)' : 'transparent'}; color: var(--practice-text);">
            <span>${subject}</span>
          </div>
          <div class="ml-2 mt-1 space-y-1">${typeItems}</div>
        </div>
      `;
    }).join('');

    treeEl.innerHTML = html;

    treeEl.querySelectorAll('.type-item').forEach(el => {
      el.addEventListener('click', () => {
        treeEl.querySelectorAll('.type-item').forEach(e => {
          e.style.background = 'transparent';
          e.style.color = 'var(--practice-text)';
        });
        el.style.background = 'var(--practice-accent)';
        el.style.color = '#fff';
        _renderTypePreview(el.dataset.subject, Number(el.dataset.type));
      });
    });

    if (firstKey) {
      const [s, t] = firstKey.split('|');
      _renderTypePreview(s, Number(t));
    }
  } catch (e) {
    console.warn('[practice] 按题型数据加载失败:', e);
  }
}

function _renderTypePreview(subject, questionType) {
  const previewEl = document.getElementById('type-preview');
  if (!previewEl) return;

  const TYPE_NAMES = { 0: '单选', 1: '多选', 2: '填空', 3: '解答', 4: '证明', 5: '判断' };
  const TYPE_DURATIONS = { 0: 1, 1: 2, 2: 2, 3: 8, 4: 10, 5: 1 }; // 分钟/题
  const typeName = TYPE_NAMES[questionType] || '题型';

  // 估算题量和时长（用缓存的 stats）
  getQuestionTypeStats().then(stats => {
    const total = stats[subject]?.[questionType] || 0;
    const duration = total * (TYPE_DURATIONS[questionType] || 2);

    previewEl.innerHTML = `
      <div class="text-xs mb-2" style="color: var(--practice-muted);">跨卷抽题</div>
      <h2 class="text-2xl font-extrabold mb-2" style="color: var(--practice-text);">${subject} · ${typeName}题组</h2>
      <div class="text-sm mb-3" style="color: var(--practice-muted);">
        来自 <span style="color: var(--practice-accent); font-weight: 600;">多套试卷</span> 的跨卷抽题
      </div>
      <div class="flex items-center gap-3 text-sm mb-4" style="color: var(--practice-muted);">
        <span><span style="color: var(--practice-text); font-weight: 600;">${total}</span> 题</span>
        <span style="color: var(--practice-border);">·</span>
        <span>约 ${duration} 分钟</span>
        <span style="color: var(--practice-border);">·</span>
        <span>上次成绩 <span style="color: var(--practice-accent); font-weight: 600;">—</span></span>
      </div>
      <div class="flex h-2 rounded-full overflow-hidden mb-6" style="background: var(--practice-border);">
        <div style="background: var(--practice-accent); flex: 1;"></div>
      </div>
      <button id="enter-type-btn" data-subject="${subject}" data-type="${questionType}" class="btn-pill" style="background: var(--practice-accent); color: #fff; padding: 0.75rem 2rem; font-weight: 700;">
        进入练习 →
      </button>
    `;

    // 绑定进入练习按钮
    const typeBtn = previewEl.querySelector('#enter-type-btn');
    if (typeBtn) {
      typeBtn.onclick = () => {
        sessionStorage.setItem('practice-session', JSON.stringify({
          subject: typeBtn.dataset.subject,
          questionType: Number(typeBtn.dataset.type),
        }));
        window.location.href = '/practice/quiz';
      };
    }
  });
}

export function renderCommunity() {
  _loadCommunityPosts();
  return pageShell(`
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-extrabold" style="color: var(--practice-text);">社区 · 刷题技巧</h1>
      <a href="/community/post" id="new-post-btn" class="btn-pill text-sm font-semibold" style="background: var(--practice-accent); color: #fff;">+ 发帖</a>
    </div>

    <!-- 分类筛选 -->
    <div class="flex gap-2 mb-6 flex-wrap">
      <span class="px-3 py-1.5 rounded-lg text-sm font-semibold cursor-pointer category-tab" data-cat="all" style="background: var(--practice-accent); color: #fff;">全部</span>
      <span class="px-3 py-1.5 rounded-lg text-sm font-semibold cursor-pointer category-tab" data-cat="高数" style="background: var(--practice-card); color: var(--practice-muted); border: 1px solid var(--practice-border);">高数</span>
      <span class="px-3 py-1.5 rounded-lg text-sm font-semibold cursor-pointer category-tab" data-cat="线代" style="background: var(--practice-card); color: var(--practice-muted); border: 1px solid var(--practice-border);">线代</span>
      <span class="px-3 py-1.5 rounded-lg text-sm font-semibold cursor-pointer category-tab" data-cat="大物" style="background: var(--practice-card); color: var(--practice-muted); border: 1px solid var(--practice-border);">大物</span>
      <span class="px-3 py-1.5 rounded-lg text-sm font-semibold cursor-pointer category-tab" data-cat="方法" style="background: var(--practice-card); color: var(--practice-muted); border: 1px solid var(--practice-border);">方法</span>
    </div>

    <!-- 文章列表 -->
    <div id="posts-list" class="space-y-4">
      <div class="text-center py-8" style="color: var(--practice-muted);">加载中...</div>
    </div>
  `);
}

let _communityState = { all: [], category: 'all' };

async function _loadCommunityPosts() {
  const listEl = document.getElementById('posts-list');
  if (!listEl || !supabase) return;

  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles!posts_author_id_fkey(display_name, avatar_url)')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) throw error;
    _communityState.all = data || [];

    _renderCommunityList();

    // 分类 tab 切换
    document.querySelectorAll('.category-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        _communityState.category = tab.dataset.cat;
        document.querySelectorAll('.category-tab').forEach(t => {
          t.style.background = 'var(--practice-card)';
          t.style.color = 'var(--practice-muted)';
          t.style.border = '1px solid var(--practice-border)';
        });
        tab.style.background = 'var(--practice-accent)';
        tab.style.color = '#fff';
        tab.style.border = 'none';
        _renderCommunityList();
      });
    });
  } catch (e) {
    console.warn('[practice] 社区列表加载失败:', e);
    listEl.innerHTML = `<div class="card text-center py-8" style="color: var(--practice-muted);">加载失败</div>`;
  }
}

function _renderCommunityList() {
  const listEl = document.getElementById('posts-list');
  if (!listEl) return;

  let posts = _communityState.all;
  if (_communityState.category !== 'all') {
    posts = posts.filter(p => p.category === _communityState.category);
  }

  if (posts.length === 0) {
    listEl.innerHTML = `
      <div class="card text-center py-12" style="background: var(--practice-card); border-color: var(--practice-border);">
        <div class="flex justify-center mb-3" style="opacity: 0.3; color: var(--practice-muted);">${icon('doc', 40)}</div>
        <p class="text-sm font-semibold mb-1" style="color: var(--practice-text);">暂无文章</p>
        <p class="text-xs" style="color: var(--practice-muted);">${_communityState.category === 'all' ? '成为第一个分享刷题技巧的人' : '该分类下暂无文章'}</p>
        <a href="/community/post" class="btn-pill inline-block mt-4" style="background: var(--practice-accent); color: #fff; padding: 0.5rem 1.5rem;">+ 发帖</a>
      </div>
    `;
    return;
  }

  const CAT_COLORS = {
    '高数': 'rgba(22, 163, 74, 0.15); color: var(--practice-accent);',
    '线代': 'rgba(45, 210, 136, 0.15); color: var(--practice-accent-2);',
    '大物': 'rgba(124, 58, 237, 0.15); color: #7C3AED;',
    '方法': 'rgba(251, 191, 36, 0.15); color: #FBBF24;',
  };

  listEl.innerHTML = posts.map(p => {
    const profile = p.profiles || {};
    const catColor = CAT_COLORS[p.category] || 'background: var(--practice-card-hover); color: var(--practice-muted);';
    const date = new Date(p.created_at).toLocaleDateString('zh-CN');
    const summary = (p.content || '').slice(0, 120).replace(/\n+/g, ' ');
    return `
      <a href="/community/${p.id}" class="card block hover:opacity-90" style="background: var(--practice-card); border-color: var(--practice-border); padding: 1.5rem;">
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full" style="background: linear-gradient(135deg, var(--practice-accent), var(--practice-accent-2));"></div>
            <div>
              <div class="text-sm font-semibold" style="color: var(--practice-text);">${escapeHtml(profile.display_name || '匿名')}</div>
              <div class="text-xs" style="color: var(--practice-muted);">${date}</div>
            </div>
          </div>
          ${p.category ? `<span class="text-xs px-2 py-1 rounded font-semibold" style="${catColor}">${escapeHtml(p.category)}</span>` : ''}
        </div>
        <h3 class="text-lg font-bold mb-2" style="color: var(--practice-text);">${escapeHtml(p.title || '无标题')}</h3>
        <p class="text-sm mb-3" style="color: var(--practice-muted); line-height: 1.6;">${escapeHtml(summary)}</p>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3 text-xs" style="color: var(--practice-muted);">
            <span>📖 5 分钟</span>
            <span style="color: var(--practice-border);">·</span>
            <span>💬 0</span>
          </div>
          <span class="text-xs px-3 py-1.5 rounded-lg font-semibold" style="background: var(--practice-accent); color: #fff;">阅读全文 →</span>
        </div>
      </a>
    `;
  }).join('');
}

export function renderCommunityDetail(postId) {
  _loadPostDetail(postId);
  return pageShell(`
    <div class="mb-4">
      <a href="/community" class="text-sm" style="color: var(--practice-muted);">← 返回社区</a>
    </div>
    <div id="post-detail">
      <div class="text-center py-8" style="color: var(--practice-muted);">加载中...</div>
    </div>
  `);
}

async function _loadPostDetail(postId) {
  const el = document.getElementById('post-detail');
  if (!el || !supabase) return;

  try {
    const { data: post, error } = await supabase
      .from('posts')
      .select('*, profiles!posts_author_id_fkey(display_name, avatar_url)')
      .eq('id', postId)
      .maybeSingle();
    if (error || !post) {
      el.innerHTML = `<div class="card text-center py-12" style="background: var(--practice-card); border-color: var(--practice-border);"><p style="color: var(--practice-muted);">文章不存在或已删除</p></div>`;
      return;
    }

    // 收藏数 + 是否已收藏
    const userId = state.user?.id;
    let isFavorited = false;
    let favCount = 0;
    if (supabase) {
      const { count } = await supabase.from('post_favorites').select('id', { count: 'exact', head: true }).eq('post_id', postId);
      favCount = count || 0;
      if (userId) {
        const { data: fav } = await supabase.from('post_favorites').select('id').eq('post_id', postId).eq('user_id', userId).maybeSingle();
        isFavorited = !!fav;
      }
    }

    const profile = post.profiles || {};
    const date = new Date(post.created_at).toLocaleString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

    // Markdown 渲染
    const html = await marked.parse(post.content || '');

    el.innerHTML = `
      <!-- 作者区 -->
      <div class="flex items-center gap-3 mb-6">
        <div class="w-12 h-12 rounded-full" style="background: linear-gradient(135deg, var(--practice-accent), var(--practice-accent-2));"></div>
        <div>
          <div class="font-semibold" style="color: var(--practice-text);">${escapeHtml(profile.display_name || '匿名')}</div>
          <div class="text-xs" style="color: var(--practice-muted);">${date}</div>
        </div>
        ${post.category ? `<span class="ml-auto text-xs px-2 py-1 rounded font-semibold" style="background: rgba(22, 163, 74, 0.15); color: var(--practice-accent);">${escapeHtml(post.category)}</span>` : ''}
      </div>

      <!-- 大标题 -->
      <h1 class="text-3xl font-extrabold mb-6" style="color: var(--practice-text); line-height: 1.3;">${escapeHtml(post.title || '无标题')}</h1>

      <!-- Markdown 正文 -->
      <article class="prose-content mb-8" style="color: var(--practice-text); line-height: 1.8; font-size: 0.95rem;">
        ${html}
      </article>

      <!-- 底部操作 -->
      <div class="flex items-center justify-between pt-4 border-t" style="border-color: var(--practice-border);">
        <div class="flex items-center gap-4 text-xs" style="color: var(--practice-muted);">
          <span class="flex items-center gap-1">${icon('clock', 16)} 5 分钟</span>
          <span class="flex items-center gap-1">${icon('comment', 16)} 0</span>
          <span class="flex items-center gap-1">${icon('star', 16)} ${favCount}</span>
        </div>
        <button id="fav-btn" data-post-id="${postId}" data-favorited="${isFavorited}" class="text-sm px-4 py-1.5 rounded-lg font-semibold" style="background: ${isFavorited ? 'rgba(251, 191, 36, 0.15)' : 'var(--practice-card)'}; color: ${isFavorited ? '#FBBF24' : 'var(--practice-muted)'}; border: 1px solid ${isFavorited ? '#FBBF24' : 'var(--practice-border)'};">
          ${isFavorited ? '★ 已收藏' : '☆ 收藏'}
        </button>
      </div>
    `;

    // 绑定收藏按钮
    const favBtn = document.getElementById('fav-btn');
    if (favBtn) {
      favBtn.onclick = async () => {
        if (!userId) {
          alert('请登录后收藏');
          return;
        }
        const wasFav = favBtn.dataset.favorited === 'true';
        if (wasFav) {
          await supabase.from('post_favorites').delete().eq('post_id', postId).eq('user_id', userId);
          favBtn.dataset.favorited = 'false';
          favBtn.textContent = '☆ 收藏';
          favBtn.style.background = 'var(--practice-card)';
          favBtn.style.color = 'var(--practice-muted)';
          favBtn.style.border = '1px solid var(--practice-border)';
        } else {
          await supabase.from('post_favorites').insert({ user_id: userId, post_id: postId });
          favBtn.dataset.favorited = 'true';
          favBtn.textContent = '★ 已收藏';
          favBtn.style.background = 'rgba(251, 191, 36, 0.15)';
          favBtn.style.color = '#FBBF24';
          favBtn.style.border = '1px solid #FBBF24';
        }
      };
    }
  } catch (e) {
    console.warn('[practice] 文章加载失败:', e);
    el.innerHTML = `<div class="card text-center py-8" style="color: var(--practice-muted);">加载失败</div>`;
  }
}

// ============================================================
// 发帖编辑器
// ============================================================
export function renderPostForm() {
  _initPostForm();
  return pageShell(`
    <div class="mb-4">
      <a href="/community" class="text-sm" style="color: var(--practice-muted);">← 返回社区</a>
    </div>
    <h1 class="text-2xl font-extrabold mb-6" style="color: var(--practice-text);">发帖</h1>

    <div class="card" style="background: var(--practice-card); border-color: var(--practice-border); padding: 1.5rem;">
      <div class="mb-4">
        <label class="block text-sm font-semibold mb-2" style="color: var(--practice-text);">标题</label>
        <input id="post-title" type="text" placeholder="给你的文章起个标题" class="w-full px-3 py-2 rounded-lg text-sm" style="background: var(--practice-bg); border: 1px solid var(--practice-border); color: var(--practice-text);" />
      </div>
      <div class="mb-4">
        <label class="block text-sm font-semibold mb-2" style="color: var(--practice-text);">分类</label>
        <select id="post-category" class="w-full px-3 py-2 rounded-lg text-sm" style="background: var(--practice-bg); border: 1px solid var(--practice-border); color: var(--practice-text);">
          <option value="高数">高数</option>
          <option value="线代">线代</option>
          <option value="大物">大物</option>
          <option value="方法">方法</option>
        </select>
      </div>
      <div class="mb-4">
        <label class="block text-sm font-semibold mb-2" style="color: var(--practice-text);">正文（支持 Markdown）</label>
        <textarea id="post-content" rows="14" placeholder="分享你的刷题技巧、学习方法或解题思路..." class="w-full px-3 py-2 rounded-lg text-sm font-mono" style="background: var(--practice-bg); border: 1px solid var(--practice-border); color: var(--practice-text); resize: vertical;"></textarea>
      </div>
      <div class="flex items-center justify-between">
        <p id="post-status-msg" class="text-xs" style="color: var(--practice-muted);"></p>
        <button id="submit-post-btn" class="btn-pill" style="background: var(--practice-accent); color: #fff; padding: 0.75rem 2rem; font-weight: 700;">
          发布
        </button>
      </div>
    </div>
  `);
}

async function _initPostForm() {
  const userId = state.user?.id;
  if (!userId) {
    const submitBtn = document.getElementById('submit-post-btn');
    if (submitBtn) {
      submitBtn.onclick = () => { window.location.href = '/'; };
    }
    const msg = document.getElementById('post-status-msg');
    if (msg) msg.textContent = '请先登录后再发帖';
    return;
  }

  // 检查是否为管理员（直接发布）
  let isAdmin = false;
  if (supabase) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();
    isAdmin = profile?.role === 'admin';
  }

  const msg = document.getElementById('post-status-msg');
  if (msg) {
    msg.textContent = isAdmin
      ? '管理员：提交后直接发布'
      : '普通用户：提交后需要审核';
    msg.style.color = isAdmin ? 'var(--practice-accent)' : 'var(--practice-muted)';
  }

  const submitBtn = document.getElementById('submit-post-btn');
  if (submitBtn) {
    submitBtn.onclick = async () => {
      const title = document.getElementById('post-title')?.value?.trim();
      const category = document.getElementById('post-category')?.value;
      const content = document.getElementById('post-content')?.value?.trim();

      if (!title || !content) {
        if (msg) { msg.textContent = '标题和正文不能为空'; msg.style.color = '#EF5350'; }
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = '提交中...';

      const { error } = await supabase.from('posts').insert({
        author_id: userId,
        title,
        content,
        category,
        status: isAdmin ? 'published' : 'pending',
      });

      submitBtn.disabled = false;
      submitBtn.textContent = '发布';

      if (error) {
        if (msg) { msg.textContent = '发布失败: ' + error.message; msg.style.color = '#EF5350'; }
        return;
      }
      window.location.href = '/community';
    };
  }
}

export function renderUserRecords() {
  return pageShell(`
    <h1 class="text-2xl font-extrabold mb-6" style="color: var(--practice-text);">我的·刷题记录</h1>

    <!-- 3 统计卡 -->
    <div class="grid grid-cols-3 gap-4 mb-6">
      <div class="card text-center" style="background: var(--practice-card); border-color: var(--practice-border); padding: 1.25rem;">
        <div class="text-4xl font-extrabold mb-1" style="color: var(--practice-accent); line-height: 1;" data-stat="papers">—</div>
        <div class="text-xs" style="color: var(--practice-muted);">已刷试卷</div>
      </div>
      <div class="card text-center" style="background: var(--practice-card); border-color: var(--practice-border); padding: 1.25rem;">
        <div class="text-4xl font-extrabold mb-1" style="color: var(--practice-accent); line-height: 1;" data-stat="questions">—</div>
        <div class="text-xs" style="color: var(--practice-muted);">累计做题</div>
      </div>
      <div class="card text-center" style="background: var(--practice-card); border-color: var(--practice-border); padding: 1.25rem;">
        <div class="text-4xl font-extrabold mb-1" style="color: var(--practice-accent); line-height: 1;" data-stat="accuracy">—</div>
        <div class="text-xs" style="color: var(--practice-muted);">正确率</div>
      </div>
    </div>

    <!-- 筛选 tab -->
    <div class="flex gap-2 mb-6">
      <span class="px-3 py-1.5 rounded-lg text-sm font-semibold cursor-pointer record-filter" data-filter="all" style="background: var(--practice-accent); color: #fff;">全部</span>
      <span class="px-3 py-1.5 rounded-lg text-sm font-semibold cursor-pointer record-filter" data-filter="incomplete" style="background: var(--practice-card); color: var(--practice-muted); border: 1px solid var(--practice-border);">进行中</span>
      <span class="px-3 py-1.5 rounded-lg text-sm font-semibold cursor-pointer record-filter" data-filter="complete" style="background: var(--practice-card); color: var(--practice-muted); border: 1px solid var(--practice-border);">已完成</span>
    </div>

    <!-- 记录列表 -->
    <div id="records-list" class="space-y-3 mb-8">
      <div class="text-center py-8" style="color: var(--practice-muted);">加载中...</div>
    </div>

    <!-- 雷达图 -->
    <div>
      <h2 class="text-lg font-bold mb-3" style="color: var(--practice-text);">掌握度分析</h2>
      <div id="records-radar" style="width: 100%; height: 320px;"></div>
    </div>
  `);
}

let _recordsState = { all: [], filter: 'all' };

// 挂载后单独调用（render 只返回 HTML，避免 getElementById 拿到 null 早退）
export function initUserRecords() {
  _loadUserRecords();
}

async function _loadUserRecords() {
  const userId = state.user?.id;
  const listEl = document.getElementById('records-list');
  if (!listEl) return;

  if (!userId || !supabase) {
    listEl.innerHTML = `
      <div class="card text-center py-8" style="background: var(--practice-card); border-color: var(--practice-border);">
        <div class="flex justify-center mb-2" style="opacity: 0.3; color: var(--practice-muted);">${icon('lock', 32)}</div>
        <p class="text-sm font-semibold mb-1" style="color: var(--practice-text);">请登录后查看记录</p>
        <p class="text-xs" style="color: var(--practice-muted);">登录后刷题记录会自动保存</p>
      </div>
    `;
    return;
  }

  try {
    const { data, error } = await supabase
      .from('practice_records')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    _recordsState.all = data || [];

    // 统计卡
    const papers = new Set(_recordsState.all.map(r => r.source_id)).size;
    const questions = _recordsState.all.reduce((s, r) => s + (r.total || 0), 0);
    const accRows = _recordsState.all.filter(r => r.total > 0);
    const accuracy = accRows.length > 0
      ? Math.round(accRows.reduce((s, r) => s + r.accuracy, 0) / accRows.length)
      : 0;

    const setStat = (key, val) => {
      const el = document.querySelector(`[data-stat="${key}"]`);
      if (el) el.textContent = String(val);
    };
    setStat('papers', papers);
    setStat('questions', questions);
    setStat('accuracy', accuracy + '%');

    _renderRecordsList();

    // 筛选 tab
    document.querySelectorAll('.record-filter').forEach(tab => {
      tab.addEventListener('click', () => {
        _recordsState.filter = tab.dataset.filter;
        document.querySelectorAll('.record-filter').forEach(t => {
          t.style.background = 'var(--practice-card)';
          t.style.color = 'var(--practice-muted)';
          t.style.border = '1px solid var(--practice-border)';
        });
        tab.style.background = 'var(--practice-accent)';
        tab.style.color = '#fff';
        tab.style.border = 'none';
        _renderRecordsList();
      });
    });

    // 雷达图（复用错题统计）
    const stats = await getStats(userId);
    try {
      const { renderRadarChart } = await import('../../services/charts.js');
      const radarEl = document.getElementById('records-radar');
      if (radarEl) {
        const reasons = ['概念不清', '计算失误', '审题错误', '方法不熟', '时间不够'];
        const values = reasons.map(r => stats.byReason?.[r] || 0);
        const max = Math.max(...values, 5);
        renderRadarChart(radarEl,
          reasons.map(r => ({ name: r, max })),
          [{ name: '错误次数', value: values }]
        );
      }
    } catch (e) {
      console.warn('[practice] 记录雷达图失败:', e);
    }
  } catch (e) {
    console.warn('[practice] 记录加载失败:', e);
    listEl.innerHTML = `<div class="card text-center py-8" style="color: var(--practice-muted);">加载失败</div>`;
  }
}

function _renderRecordsList() {
  const listEl = document.getElementById('records-list');
  if (!listEl) return;

  let records = _recordsState.all;
  if (_recordsState.filter === 'incomplete') {
    records = records.filter(r => r.answered < r.total);
  } else if (_recordsState.filter === 'complete') {
    records = records.filter(r => r.answered >= r.total);
  }

  if (records.length === 0) {
    listEl.innerHTML = `
      <div class="card text-center py-8" style="background: var(--practice-card); border-color: var(--practice-border);">
        <div class="flex justify-center mb-2" style="opacity: 0.3; color: var(--practice-muted);">${icon('clipboard', 32)}</div>
        <p class="text-sm font-semibold mb-1" style="color: var(--practice-text);">暂无刷题记录</p>
        <p class="text-xs" style="color: var(--practice-muted);">开始刷题后记录会显示在这里</p>
        <a href="/practice/exams" class="btn-pill inline-block mt-4" style="background: var(--practice-accent); color: #fff; padding: 0.5rem 1.5rem;">去刷题</a>
      </div>
    `;
    return;
  }

  listEl.innerHTML = records.map(r => {
    const isComplete = r.answered >= r.total;
    const statusBadge = isComplete
      ? `<span class="text-xs px-2 py-0.5 rounded font-semibold" style="background: rgba(22,163,74,0.15); color: var(--practice-accent);">已完成</span>`
      : `<span class="text-xs px-2 py-0.5 rounded font-semibold" style="background: rgba(255,184,0,0.15); color: #FFB800;">进行中</span>`;
    const duration = r.duration_seconds ? `${Math.floor(r.duration_seconds / 60)}分${r.duration_seconds % 60}秒` : '—';
    const date = new Date(r.created_at).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const acc = r.total > 0 ? Math.round(r.accuracy) : 0;

    return `
      <div class="card" style="background: var(--practice-card); border-color: var(--practice-border); padding: 1.25rem;">
        <div class="flex items-start justify-between mb-2">
          <div>
            <div class="flex items-center gap-2 mb-1">
              ${statusBadge}
              <span class="text-xs" style="color: var(--practice-muted);">${date}</span>
            </div>
            <div class="font-semibold" style="color: var(--practice-text);">${escapeHtml(r.source_name || '刷题记录')}</div>
          </div>
          <div class="text-right">
            <div class="text-2xl font-extrabold" style="color: var(--practice-accent);">${acc}%</div>
            <div class="text-xs" style="color: var(--practice-muted);">${r.correct}/${r.total} 正确</div>
          </div>
        </div>
        <div class="flex items-center gap-3 text-xs mb-3" style="color: var(--practice-muted);">
          <span>${r.total} 题</span>
          <span style="color: var(--practice-border);">·</span>
          <span>耗时 ${duration}</span>
        </div>
        <div class="h-1 rounded-full overflow-hidden mb-3" style="background: var(--practice-border);">
          <div class="h-full rounded-full" style="background: var(--practice-accent); width: ${acc}%;"></div>
        </div>
        <div class="flex gap-2">
          ${r.wrong > 0 ? `<a href="/kb" class="text-xs px-3 py-1.5 rounded-lg font-semibold" style="background: var(--practice-accent); color: #fff;">查看错题 (${r.wrong})</a>` : ''}
          <a href="/practice/exams" class="text-xs px-3 py-1.5 rounded-lg font-semibold" style="border: 1px solid var(--practice-border); color: var(--practice-text);">继续刷题</a>
        </div>
      </div>
    `;
  }).join('');
}
