// ============================================================
// LIFE OS — Authentication Service
// ============================================================

import { getSupabase, isConfigured } from './supabase.js';
import * as storage from '../utils/storage.js';

let currentUser = null;
let authListeners = [];

/**
 * Sign up with email and password
 * @param {string} email
 * @param {string} password
 * @param {string} displayName
 * @returns {Promise<{user: Object|null, error: string|null}>}
 */
export async function signUp(email, password, displayName = '') {
  const supabase = getSupabase();
  if (!supabase) {
    // Offline mode: create a local-only user
    const localUser = { id: crypto.randomUUID(), email, display_name: displayName };
    storage.set('localUser', localUser);
    setCurrentUser(localUser);
    return { user: localUser, error: null };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
    },
  });

  if (error) return { user: null, error: error.message };

  setCurrentUser(data.user);
  return { user: data.user, error: null };
}

/**
 * Sign in with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{user: Object|null, error: string|null}>}
 */
export async function signIn(email, password) {
  const supabase = getSupabase();
  if (!supabase) {
    const localUser = storage.get('localUser');
    if (localUser && localUser.email === email) {
      setCurrentUser(localUser);
      return { user: localUser, error: null };
    }
    return { user: null, error: 'No Supabase connection. Check your config.' };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { user: null, error: error.message };

  setCurrentUser(data.user);
  return { user: data.user, error: null };
}

/**
 * Sign out
 */
export async function signOut() {
  const supabase = getSupabase();
  if (supabase) {
    await supabase.auth.signOut();
  }
  storage.remove('localUser');
  setCurrentUser(null);
}

/**
 * Get the current user
 * @returns {Object|null}
 */
export function getUser() {
  return currentUser;
}

/**
 * Get the current user's ID
 * @returns {string|null}
 */
export function getUserId() {
  return currentUser?.id || null;
}

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export function isAuthenticated() {
  return currentUser !== null;
}

/**
 * Set current user and notify listeners
 * @param {Object|null} user
 */
function setCurrentUser(user) {
  currentUser = user;
  authListeners.forEach(fn => fn(user));
}

/**
 * Subscribe to auth state changes
 * @param {Function} callback - (user) => void
 * @returns {Function} Unsubscribe function
 */
export function onAuthChange(callback) {
  authListeners.push(callback);
  return () => {
    authListeners = authListeners.filter(fn => fn !== callback);
  };
}

/**
 * Initialize auth — check for existing session
 * @returns {Promise<Object|null>} Current user
 */
export async function initAuth() {
  const supabase = getSupabase();

  if (supabase) {
    // Listen for auth changes from Supabase
    supabase.auth.onAuthStateChange((event, session) => {
      setCurrentUser(session?.user || null);
    });

    // Check existing session
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUser(user);
      return user;
    }
  }

  // Check for local user (offline mode)
  const localUser = storage.get('localUser');
  if (localUser) {
    setCurrentUser(localUser);
    return localUser;
  }

  return null;
}
