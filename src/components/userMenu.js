import './auth-components.css';
import { state } from '../state.js';
import { escapeHtml } from '../utils.js';

export function renderUserMenu() {
  const user = state.user;
  if (user) {
    return `
      <div class="user-menu">
        <button type="button" class="user-menu-toggle" data-action="toggle-user-menu" aria-haspopup="true" aria-expanded="false">
          ${escapeHtml(user.email || '用户')}
        </button>
        <div id="user-menu-dropdown" class="user-menu-dropdown hidden">
          <button type="button" class="user-menu-item" data-action="logout">退出登录</button>
        </div>
      </div>
    `;
  }
  return '';
}

export function updateUserMenu() {
  const container = document.getElementById('user-menu-container');
  if (!container) return;
  container.innerHTML = renderUserMenu();
}
