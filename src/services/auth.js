import { state, saveProgress } from '../state.js';
import { loadPersistedData } from '../utils/progress.js';
import { supabase, isSupabaseConfigured } from './supabase.js';
import * as sync from './sync.js';

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
  if (!isSupabaseConfigured()) {
    setAuthUser(null);
    return;
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    setAuthUser(session?.user || null);

    if (state.user) {
      await mergeGuestData(state.user.id);
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      const prevUser = state.user;
      setAuthUser(session?.user || null);

      if (event === 'SIGNED_IN' && state.user && (!prevUser || prevUser.id !== state.user.id)) {
        await mergeGuestData(state.user.id);
      }
    });
  } catch (e) {
    console.error('Auth init failed', e);
    setAuthUser(null);
  }
}

export async function signUp(email, password) {
  if (!supabase) throw new Error('认证服务未配置');
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  if (!supabase) throw new Error('认证服务未配置');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  clearGuestData();
}

export async function resetPassword(email) {
  if (!supabase) throw new Error('认证服务未配置');
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/`
  });
  if (error) throw error;
}
