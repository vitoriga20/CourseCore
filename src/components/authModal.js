import './auth-components.css';

const TITLES = {
  login: '登录账号',
  signup: '注册账号',
  reset: '重置密码'
};

const SUBMIT_LABELS = {
  login: '登录',
  signup: '注册',
  reset: '发送重置邮件'
};

let activeTab = 'login';

function renderModalHtml() {
  return `
    <div id="auth-modal-overlay" class="auth-modal-overlay" data-action="auth-close">
      <div class="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <div class="auth-modal-header">
          <h2 id="auth-title" class="auth-modal-title">${TITLES[activeTab]}</h2>
          <button type="button" class="auth-modal-close" data-action="auth-close" aria-label="关闭">×</button>
        </div>
        <div class="auth-tabs">
          <button type="button" class="auth-tab ${activeTab === 'login' ? 'active' : ''}" data-action="auth-tab" data-tab="login">登录</button>
          <button type="button" class="auth-tab ${activeTab === 'signup' ? 'active' : ''}" data-action="auth-tab" data-tab="signup" disabled title="功能暂时关闭">注册</button>
          <button type="button" class="auth-tab ${activeTab === 'reset' ? 'active' : ''}" data-action="auth-tab" data-tab="reset" disabled title="功能暂时关闭">重置</button>
        </div>
        <div id="auth-message" class="auth-message hidden"></div>
        <form class="auth-form" id="auth-form" onsubmit="return false;">
          <div class="auth-field">
            <label for="auth-email">账号</label>
            <input id="auth-email" type="text" class="auth-input" placeholder="admin@coursecore.local" autocomplete="username" required>
          </div>
          <div class="auth-field ${activeTab === 'reset' ? 'hidden' : ''}">
            <label for="auth-password">密码</label>
            <input id="auth-password" type="password" class="auth-input" placeholder="••••••••" autocomplete="${activeTab === 'signup' ? 'new-password' : 'current-password'}" ${activeTab === 'reset' ? '' : 'required'}>
          </div>
          <div class="auth-field ${activeTab === 'signup' ? '' : 'hidden'}">
            <label for="auth-password-confirm">确认密码</label>
            <input id="auth-password-confirm" type="password" class="auth-input" placeholder="••••••••" autocomplete="new-password">
          </div>
          <div class="auth-consent ${activeTab === 'signup' ? '' : 'hidden'}">
            <label class="auth-consent-label">
              <input id="auth-consent" type="checkbox" class="auth-consent-checkbox">
              <span>我已年满 14 周岁，并同意<a href="/terms" data-action="auth-close-navigate" data-target="/terms">用户协议</a>和<a href="/privacy" data-action="auth-close-navigate" data-target="/privacy">隐私政策</a>。</span>
            </label>
          </div>
          <button type="submit" class="auth-submit-btn" data-action="auth-submit">${SUBMIT_LABELS[activeTab]}</button>
        </form>
      </div>
    </div>
  `;
}

export function renderAuthModal() {
  return renderModalHtml();
}

export function showAuthModal(tab = 'login') {
  activeTab = tab === 'login' ? 'login' : 'login';
  const container = document.getElementById('auth-modal-container');
  if (!container) return;
  container.innerHTML = renderModalHtml();
  document.getElementById('auth-email')?.focus();
}

export function hideAuthModal() {
  const container = document.getElementById('auth-modal-container');
  if (container) container.innerHTML = '';
}

export function switchAuthTab(tab) {
  showAuthModal(tab);
}

export function getActiveAuthTab() {
  return activeTab;
}
