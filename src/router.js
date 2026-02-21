// ============================================================
// LIFE OS — Hash-based SPA Router
// ============================================================

let currentView = null;
let currentCleanup = null;

const routes = {};

/**
 * Register a route with a lazy-loading view module
 * @param {string} path - Route path (e.g., 'tasks', 'groceries', '' for home)
 * @param {Function} loader - Async function that returns the view module
 */
export function registerRoute(path, loader) {
  routes[path] = loader;
}

/**
 * Navigate to a route
 * @param {string} path - Route path
 */
export function navigate(path) {
  window.location.hash = path ? `#/${path}` : '#/';
}

/**
 * Get current route path from hash
 * @returns {string}
 */
export function getCurrentRoute() {
  const hash = window.location.hash.slice(2) || ''; // Remove '#/'
  return hash;
}

/**
 * Handle route changes
 */
async function handleRouteChange() {
  const path = getCurrentRoute();
  const loader = routes[path];
  const container = document.getElementById('app');

  if (!container) return;

  // Cleanup previous view
  if (currentCleanup && typeof currentCleanup === 'function') {
    currentCleanup();
    currentCleanup = null;
  }

  if (!loader) {
    // 404 — redirect to dashboard
    navigate('');
    return;
  }

  try {
    const viewModule = await loader();
    container.innerHTML = '';
    currentCleanup = await viewModule.render(container);
    currentView = path;
  } catch (err) {
    console.error(`[Router] Failed to load view: ${path}`, err);
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <p class="empty-state-text">Something went wrong loading this page.</p>
        <button class="btn btn-secondary" onclick="location.hash='#/'">Go Home</button>
      </div>
    `;
  }
}

/**
 * Initialize the router
 */
export function initRouter() {
  window.addEventListener('hashchange', handleRouteChange);

  // Handle initial route
  if (!window.location.hash) {
    window.location.hash = '#/';
  } else {
    handleRouteChange();
  }
}

/**
 * Get the active nav item ID based on current route
 * @returns {string}
 */
export function getActiveNavId() {
  const path = getCurrentRoute();
  return path || 'dashboard';
}
