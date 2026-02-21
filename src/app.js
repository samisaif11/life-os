// ============================================================
// LIFE OS — Main Application Entry Point
// ============================================================

import { initSupabase } from './services/supabase.js';
import { initAuth, onAuthChange, isAuthenticated } from './services/auth.js';
import { ensureProfile } from './services/xp.js';
import { startAutoSync, stopAutoSync } from './services/sync.js';
import { registerRoute, initRouter, navigate } from './router.js';
import { renderNav, hideNav } from './components/nav.js';
import { showLoadingScreen, hideLoadingScreen } from './components/loading-screen.js';

/**
 * Boot the application
 */
async function boot() {
  // Show loading screen with quote
  const loadingPromise = showLoadingScreen();

  // Initialize Supabase client
  await initSupabase();

  // Register routes
  registerRoute('', () => import('./views/dashboard.js'));
  registerRoute('tasks', () => import('./views/tasks.js'));
  registerRoute('groceries', () => import('./views/groceries.js'));
  registerRoute('deadlines', () => import('./views/deadlines.js'));
  registerRoute('settings', () => import('./views/settings.js'));

  // Listen for auth state changes
  onAuthChange(user => {
    if (user) {
      ensureProfile();
      startAutoSync();
      renderNav();
      initRouter();
    } else {
      stopAutoSync();
      hideNav();
      showLogin();
    }
  });

  // Check for existing session
  const user = await initAuth();

  // Wait for loading screen quote to be readable
  await loadingPromise;
  hideLoadingScreen();

  if (user) {
    ensureProfile();
    startAutoSync();
    renderNav();
    initRouter();
  } else {
    showLogin();
  }
}

/**
 * Show the login view
 */
async function showLogin() {
  hideNav();
  const container = document.getElementById('app');
  if (!container) return;

  const loginModule = await import('./views/login.js');
  container.innerHTML = '';
  loginModule.render(container);
}

// Boot on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
