import { state } from '../state.js';
import { getDefaultAvatar } from '../utils/avatars.js';

export { getDefaultAvatar } from '../utils/avatars.js';

const GUEST_ID_KEY = 'cc-guest-id';

function generateGuestId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function initGuest() {
  try {
    if (!localStorage.getItem(GUEST_ID_KEY)) {
      localStorage.setItem(GUEST_ID_KEY, generateGuestId());
    }
  } catch (e) {
    console.error('Failed to init guest', e);
  }
}

export function getGuestId() {
  try {
    return localStorage.getItem(GUEST_ID_KEY);
  } catch {
    return null;
  }
}

export function clearGuestData() {
  try {
    localStorage.removeItem(GUEST_ID_KEY);
  } catch (e) {
    console.error('Failed to clear guest data', e);
  }
}

function setAuthUser(user) {
  const changed = (user?.id) !== (state.user?.id);
  state.user = user || null;
  state.authReady = true;
  if (changed) {
    window.dispatchEvent(new CustomEvent('cc-auth-change', { detail: { user: state.user } }));
  }
}

export async function initAuth() {
  setAuthUser(null);
}

export async function signUp(email, password) {
  throw new Error('当前暂不开放注册，请联系管理员');
}

export async function signIn(email, password) {
  throw new Error('当前暂不开放登录，请联系管理员');
}

export async function signOut() {
  setAuthUser(null);
}

export function updateUserProfile(updates) {
  return null;
}

export async function resetPassword(email) {
  throw new Error('当前暂不开放密码重置，请联系管理员');
}
