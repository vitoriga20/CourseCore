import { state } from '../state.js';
import { supabase, isSupabaseConfigured } from './supabase.js';
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

async function fetchProfile(userId) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('role, display_name, avatar_url')
    .eq('id', userId)
    .single();
  if (error) {
    console.error('fetchProfile error', error);
    return null;
  }
  return data;
}

function buildUser(authUser, profile) {
  if (!authUser) return null;
  const name = profile?.display_name || authUser.email?.split('@')[0] || '用户';
  return {
    id: authUser.id,
    email: authUser.email || '',
    name,
    avatar: profile?.avatar_url || getDefaultAvatar(name),
    role: profile?.role || 'free',
    loginDates: state.user?.loginDates || []
  };
}

export async function initAuth() {
  if (!supabase) {
    setAuthUser(null);
    return;
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    const profile = await fetchProfile(session.user.id);
    setAuthUser(buildUser(session.user, profile));
  } else {
    setAuthUser(null);
  }

  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT' || !session?.user) {
      setAuthUser(null);
      return;
    }
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
      const profile = await fetchProfile(session.user.id);
      setAuthUser(buildUser(session.user, profile));
    }
  });
}

export async function signUp(email, password) {
  if (!supabase) throw new Error('Supabase 未配置');
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  if (!supabase) throw new Error('Supabase 未配置');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  const profile = await fetchProfile(data.user.id);
  setAuthUser(buildUser(data.user, profile));
  return data;
}

export async function signOut() {
  if (supabase) {
    await supabase.auth.signOut();
  }
  setAuthUser(null);
}

export function updateUserProfile(updates) {
  if (!state.user) return null;

  const newName = updates.name !== undefined ? updates.name : state.user.name;
  const newAvatar = updates.avatar !== undefined ? updates.avatar : state.user.avatar;

  state.user = { ...state.user, name: newName, avatar: newAvatar };
  window.dispatchEvent(new CustomEvent('cc-auth-change', { detail: { user: state.user } }));

  if (supabase && state.user.id) {
    supabase
      .from('profiles')
      .update({
        display_name: newName,
        avatar_url: newAvatar,
        updated_at: new Date().toISOString()
      })
      .eq('id', state.user.id)
      .then(({ error }) => {
        if (error) console.error('updateUserProfile error', error);
      });
  }

  return state.user;
}

export async function resetPassword(email) {
  if (!supabase) throw new Error('Supabase 未配置');
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
}

export function isAdmin() {
  return state.user?.role === 'admin';
}
