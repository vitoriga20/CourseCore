import { state } from '../../state.js';
import { escapeHtml } from '../../utils.js';
import { getDefaultAvatar } from '../../utils/avatars.js';

const MONTH_LABELS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
const WEEKDAY_LABELS = [
  { index: 1, label: 'Mon' },
  { index: 3, label: 'Wed' },
  { index: 5, label: 'Fri' }
];

function formatDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getTodayKey() {
  return formatDateKey(new Date());
}

function parseDateKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function nextDayKey(key) {
  const date = parseDateKey(key);
  date.setDate(date.getDate() + 1);
  return formatDateKey(date);
}

function getMonthLabel(date) {
  return MONTH_LABELS[date.getMonth()];
}

function getActiveDates() {
  const dates = new Set();
  (state.user?.loginDates || []).forEach(d => dates.add(d));
  const completed = state.completedQuestions || {};
  Object.values(completed).forEach(c => {
    if (!c.lastAt) return;
    dates.add(formatDateKey(new Date(c.lastAt)));
  });
  return dates;
}

function computeStreaks(dates) {
  if (dates.size === 0) return { current: 0, longest: 0 };
  const sorted = Array.from(dates).sort();
  const today = getTodayKey();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = formatDateKey(yesterdayDate);

  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === nextDayKey(sorted[i - 1])) {
      run++;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  let current = 0;
  const last = sorted[sorted.length - 1];
  if (last === today || last === yesterday) {
    current = 1;
    for (let i = sorted.length - 2; i >= 0; i--) {
      if (sorted[i + 1] === nextDayKey(sorted[i])) {
        current++;
      } else {
        break;
      }
    }
  }

  return { current, longest };
}

function getStats() {
  const completed = Object.values(state.completedQuestions || {});
  const passedCount = completed.filter(c => c.passed === true).length;
  const totalScore = passedCount * 10;
  const activeDates = getActiveDates();
  const { current, longest } = computeStreaks(activeDates);
  return {
    currentStreak: current,
    longestStreak: longest,
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

function getYearBoundaries(year) {
  return {
    start: new Date(year, 0, 1),
    end: new Date(year, 11, 31)
  };
}

function getHeatmapData(year) {
  const { start, end } = getYearBoundaries(year);
  const activity = getActivityMap();
  const loginDates = new Set(state.user?.loginDates || []);
  const today = getTodayKey();

  // align to Sunday before Jan 1, like the reference project
  const cur = new Date(start);
  while (cur.getDay() !== 0) {
    cur.setDate(cur.getDate() - 1);
  }

  const days = [];
  const final = new Date(end);
  final.setDate(final.getDate() + 1);
  while (cur < final) {
    const key = formatDateKey(cur);
    const inYear = cur.getFullYear() === year;
    days.push({
      date: key,
      count: inYear ? (activity.get(key) || 0) : 0,
      isLogin: inYear ? loginDates.has(key) : false,
      isToday: key === today,
      inYear
    });
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function getLevelClass(count) {
  if (count === 0) return 'level-0';
  if (count === 1) return 'level-1';
  if (count <= 3) return 'level-2';
  if (count <= 5) return 'level-3';
  return 'level-4';
}

function getCellClass(day) {
  const base = getLevelClass(day.count);
  if (day.isLogin && day.isToday) return `${base} is-today-login`;
  return base;
}

function getCellTitle(day) {
  const parts = [`${day.date}`];
  if (!day.inYear) return '';
  if (day.isLogin && day.isToday) parts.push('今日已登录');
  else if (day.isLogin) parts.push('已登录');
  parts.push(`${day.count} 题`);
  return parts.join(' · ');
}

function renderHeatmap() {
  const year = state.userHeatmapYear || new Date().getFullYear();
  const days = getHeatmapData(year);
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  const prevYear = year - 1;
  const nextYear = year + 1;

  return `
    <div class="user-heatmap">
      <div class="user-heatmap-wrapper">
        <div class="user-heatmap-months">
          ${MONTH_LABELS.map(m => `<span class="user-heatmap-month">${m}</span>`).join('')}
        </div>
        <div class="user-heatmap-weekdays">
          ${WEEKDAY_LABELS.map(w => `
            <span class="user-heatmap-weekday" style="grid-row: ${w.index * 2 + 1} / span 1;">${w.label}</span>
          `).join('')}
        </div>
        <div class="user-heatmap-grid">
          ${weeks.map(week => `
            <div class="user-heatmap-week">
              ${week.map(day => `
                <div class="user-heatmap-cell ${getCellClass(day)} ${day.inYear ? '' : 'out-of-year'}" title="${getCellTitle(day)}"></div>
              `).join('')}
            </div>
          `).join('')}
        </div>
        <div class="user-heatmap-year-switcher">
          <button type="button" class="year-switcher-btn" data-action="heatmap-prev-year" aria-label="上一年">${prevYear}</button>
          <strong class="current-year">${year}</strong>
          <button type="button" class="year-switcher-btn" data-action="heatmap-next-year" aria-label="下一年">${nextYear}</button>
        </div>
      </div>
      <div class="user-heatmap-legend">
        <span>Less</span>
        <div class="user-heatmap-cell level-0" aria-hidden="true"></div>
        <div class="user-heatmap-cell level-1" aria-hidden="true"></div>
        <div class="user-heatmap-cell level-2" aria-hidden="true"></div>
        <div class="user-heatmap-cell level-3" aria-hidden="true"></div>
        <div class="user-heatmap-cell level-4" aria-hidden="true"></div>
        <span>More</span>
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
      <button type="button" class="user-back-btn" data-action="user-page-back" aria-label="返回">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5"/>
          <path d="M12 19l-7-7 7-7"/>
        </svg>
        <span>返回</span>
      </button>

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
      </div>

      <div class="user-actions">
        <button type="button" class="user-logout-btn" data-action="logout-from-user-page">退出登录</button>
      </div>

      <div id="avatar-picker-container"></div>
    </div>
  `;
}
