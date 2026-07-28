import { AVATAR_CHOICES } from '../utils/avatars.js';

export function getAvatarChoices() {
  return AVATAR_CHOICES;
}

export function renderAvatarPicker(currentAvatar = '') {
  const choices = getAvatarChoices();
  return `
    <div id="avatar-picker-overlay" class="avatar-picker-overlay" data-action="close-avatar-picker">
      <div class="avatar-picker-modal" role="dialog" aria-modal="true" aria-labelledby="avatar-picker-title">
        <div class="avatar-picker-header">
          <h3 id="avatar-picker-title" class="avatar-picker-title">选择头像</h3>
          <button type="button" class="avatar-picker-close" data-action="close-avatar-picker" aria-label="关闭">×</button>
        </div>
        <div class="avatar-picker-grid">
          ${choices.map(url => `
            <button type="button" class="avatar-choice ${url === currentAvatar ? 'active' : ''}" data-action="select-avatar" data-avatar="${url}">
              <img src="${url}" alt="头像候选" loading="eager">
            </button>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}
