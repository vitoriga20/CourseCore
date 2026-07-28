import { state } from '../../state.js';
import { escapeHtml } from '../../utils.js';
import { getDefaultAvatar } from '../../utils/avatars.js';

const MONTH_LABELS = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getStats() {
  const completed = Object.values(state.completedQuestions || {});
  const passedCount = completed.filter(c => c.passed === true).length;
  const totalScore = passedCount * 10;
  // 连续签到数据目前未采集，展示 0
  return {
    currentStreak: 0,
    longestStreak: 0,
    totalScore
  };
}

function getActivityMap() {
  const map = new Map();
  const completed = state.completedQuestions || {};
  Object.values(completed).forEach(c => {
    if (!c.lastAt) return;
    const key = formatDateKey(new Date(c.lastAt));
    map.set(key, (map.get(key) || 0) + 1);
  });
  return map;
}

function getHeatmapData() {
  // 展示 2026-02-01 到 2026-07-31 的格子
  const start = new Date('2026-02-01');
  const end = new Date('2026-07-31');
  const activity = getActivityMap();
  const days = [];
  const cur = new Date(start);
  while (cur <= end) {
    const key = formatDateKey(cur);
    const count = activity.get(key) || 0;
    days.push({ date: key, count });
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function getLevelClass(count) {
  if (count === 0) return 'level-0';
  if (count < 3) return 'level-1';
  if (count < 6) return 'level-2';
  if (count < 10) return 'level-3';
  return 'level-4';
}

function renderHeatmap() {
  const days = getHeatmapData();
  // 按周列组织：7 行 x N 列
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return `
    <div class="user-heatmap">
      <div class="user-heatmap-months">
        ${MONTH_LABELS.map(m => `<span class="user-heatmap-month">${m}</span>`).join('')}
      </div>
      <div class="user-heatmap-grid">
        ${weeks.map(week => `
          <div class="user-heatmap-week">
            ${week.map(day => `
              <div class="user-heatmap-cell ${getLevelClass(day.count)}" title="${day.date}: ${day.count} 题"></div>
            `).join('')}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

export function renderUserPage() {
  const user = state.user;
  const name = user?.name || '管理员';
  const avatar = user?.avatar || getDefaultAvatar(name);
  const stats = getStats();

  return `
    <div class="user-page">
      <div class="user-card user-profile-card">
        <button type="button" class="user-avatar-edit" data-action="open-avatar-picker" title="更换头像">
          <img src="${avatar}" alt="用户头像" class="user-avatar-img" loading="eager">
          <span class="user-avatar-mask">更换</span>
        </button>
        <div class="user-name-wrap">
          <span class="user-name" id="user-display-name">${escapeHtml(name)}</span>
          <button type="button" class="user-name-edit" data-action="edit-user-name" aria-label="编辑昵称">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </button>
        </div>
        <div class="user-id">@${user?.id || 'guest'}</div>
      </div>

      <div class="user-card user-stats-card">
        <div class="user-card-header">
          <h3 class="user-card-title">统计</h3>
          <span class="user-privacy-tag">私密</span>
        </div>
        <div class="user-stats-grid">
          <div class="user-stat">
            <div class="user-stat-label">当前连续签到</div>
            <div class="user-stat-value">${stats.currentStreak}</div>
          </div>
          <div class="user-stat">
            <div class="user-stat-label">总积分</div>
            <div class="user-stat-value">${stats.totalScore}</div>
          </div>
          <div class="user-stat">
            <div class="user-stat-label">最长连续签到</div>
            <div class="user-stat-value">${stats.longestStreak}</div>
          </div>
        </div>
      </div>

      <div class="user-card user-activity-card">
        <div class="user-card-header">
          <h3 class="user-card-title">活动</h3>
          <span class="user-privacy-tag">私密</span>
        </div>
        ${renderHeatmap()}
        <div class="user-heatmap-footer">2026年1月 - 2026年7月</div>
      </div>

      <div class="user-actions">
        <button type="button" class="user-logout-btn" data-action="logout-from-user-page">退出登录</button>
      </div>

      <div id="avatar-picker-container"></div>
    </div>
  `;
}
