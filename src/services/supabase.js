// ============================================================
// LIFE OS — Supabase Client
// ============================================================

import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config.js';

let supabaseClient = null;
let createClientFn = null;

/**
 * Initialize the Supabase client from CDN
 * @returns {Promise<Object>} The Supabase client
 */
export async function initSupabase() {
  if (supabaseClient) return supabaseClient;

  try {
    const { createClient } = await import(
      'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
    );
    createClientFn = createClient;

    if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
      console.warn(
        '[Supabase] Using placeholder credentials. Update src/config.js with your Supabase project URL and anon key.'
      );
      return null;
    }

    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });

    return supabaseClient;
  } catch (err) {
    console.error('[Supabase] Failed to initialize:', err);
    return null;
  }
}

/**
 * Get the current Supabase client
 * @returns {Object|null}
 */
export function getSupabase() {
  return supabaseClient;
}

/**
 * Check if Supabase is configured (not placeholder)
 * @returns {boolean}
 */
export function isConfigured() {
  return (
    SUPABASE_URL !== 'YOUR_SUPABASE_URL' &&
    SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY'
  );
}
