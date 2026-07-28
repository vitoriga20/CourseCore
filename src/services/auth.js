import { state, saveProgress } from '../state.js';
import { loadPersistedData } from '../utils/progress.js';
import { getDefaultAvatar } from '../utils/avatars.js';
import { isSupabaseConfigured } from './supabase.js';
import * as sync from './sync.js';

export { getDefaultAvatar } from '../utils/avatars.js';

const GUEST_ID_KEY = 'cc-guest-id';
const ADMIN_SESSION_KEY = 'cc-admin-session';

const ADMIN_CREDENTIALS = {
  email: 'admin@coursecore.local',
  password: 'admin123456'
};

const ADMIN_USER = {
  id: 'admin',
  email: ADMIN_CREDENTIALS.email,
  role: 'admin',
  name: '管理员',
  avatar: getDefaultAvatar('Admin')
};

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

function getTodayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function ensureLoginDates(user) {
  const today = getTodayKey();
  const dates = Array.isArray(user?.loginDates) ? user.loginDates : [];
  if (!dates.includes(today)) {
    return { ...user, loginDates: [...dates, today] };
  }
  return { ...user, loginDates: dates };
}

async function mergeGuestData(userId) {
  if (!isSupabaseConfigured()) return;
  const local = loadPersistedData() || {};
  const localProgress = local.progress || {};
  const localCompleted = local.completedQuestions || {};

  try {
    const { answers, progress } = await sync.pullProgress(userId);
    const merged = await sync.mergeAndPushLocal(userId, localProgress, localCompleted, answers, progress);
    Object.assign(state.progress, merged.progress);
    Object.assign(state.completedQuestions, merged.completedQuestions);
    saveProgress();
  } catch (e) {
    console.error('Failed to merge guest data', e);
  }
}

export async function initAuth() {
  try {
    const session = localStorage.getItem(ADMIN_SESSION_KEY);
    if (session) {
      const user = JSON.parse(session);
      const normalized = {
        ...ADMIN_USER,
        ...user,
        avatar: user.avatar || getDefaultAvatar(user.name || 'Admin')
      };
      const withDates = ensureLoginDates(normalized);
      setAuthUser(withDates);
      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(withDates));
      return;
    }
  } catch (e) {
    console.error('Admin session parse failed', e);
  }
  setAuthUser(null);
}

export async function signUp(email, password) {
  throw new Error('当前暂不开放注册，请联系管理员');
}

export async function signIn(email, password) {
  if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
    const user = ensureLoginDates(ADMIN_USER);
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(user));
    setAuthUser(user);
    return { user };
  }
  throw new Error('账号或密码错误');
}

export async function signOut() {
  localStorage.removeItem(ADMIN_SESSION_KEY);
  clearGuestData();
  setAuthUser(null);
}

export function updateUserProfile(updates) {
  if (!state.user) return null;
  const next = { ...state.user, ...updates };
  if (!next.avatar) {
    next.avatar = getDefaultAvatar(next.name || 'Admin');
  }
  state.user = next;
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('cc-auth-change', { detail: { user: next } }));
  return next;
}

export async function resetPassword(email) {
  throw new Error('当前暂不开放密码重置，请联系管理员');
}
