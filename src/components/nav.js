// ============================================================
// LIFE OS — Navigation Component
// ============================================================

import { NAV_ITEMS } from '../config.js';
import { navigate, getActiveNavId } from '../router.js';
import { $, $$ } from '../utils/dom.js';
import { getTotalXP, getLevel } from '../services/xp.js';

/**
 * Render navigation (sidebar + mobile bottom bar)
 */
export function renderNav() {
  renderSidebar();
  renderBottomNav();
  updateActiveState();
}

function renderSidebar() {
  const sidebar = $('#nav-sidebar');
  const navItems = $('#nav-items');
  if (!sidebar || !navItems) return;

  sidebar.classList.remove('hidden');

  navItems.innerHTML = NAV_ITEMS.map(item => `
    <div class="nav-item" data-nav-id="${item.id}" data-path="${item.path}">
      <span class="nav-item-icon">${item.icon}</span>
      <span>${item.label}</span>
    </div>
  `).join('');

  // Click handlers
  $$('.nav-item', navItems).forEach(el => {
    el.addEventListener('click', () => {
      navigate(el.dataset.path);
    });
  });

  // XP summary
  updateNavXP();
}

function renderBottomNav() {
  const bottomNav = $('#nav-bottom');
  const bottomItems = $('#nav-bottom-items');
  if (!bottomNav || !bottomItems) return;

  bottomNav.classList.remove('hidden');

  bottomItems.innerHTML = NAV_ITEMS.map(item => `
    <div class="nav-bottom-item" data-nav-id="${item.id}" data-path="${item.path}">
      <span class="nav-bottom-icon">${item.icon}</span>
      <span>${item.label}</span>
    </div>
  `).join('');

  // Click handlers
  $$('.nav-bottom-item', bottomItems).forEach(el => {
    el.addEventListener('click', () => {
      navigate(el.dataset.path);
    });
  });
}

/**
 * Update active state based on current route
 */
export function updateActiveState() {
  const activeId = getActiveNavId();

  // Sidebar
  $$('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.navId === activeId);
  });

  // Bottom nav
  $$('.nav-bottom-item').forEach(el => {
    el.classList.toggle('active', el.dataset.navId === activeId);
  });
}

/**
 * Update XP display in sidebar footer
 */
export function updateNavXP() {
  const navXP = $('#nav-xp');
  if (!navXP) return;

  const totalXP = getTotalXP();
  const level = getLevel();
  navXP.innerHTML = `Level ${level} &middot; ${totalXP.toFixed(2)} XP`;
}

/**
 * Hide navigation (for login screen)
 */
export function hideNav() {
  const sidebar = $('#nav-sidebar');
  const bottomNav = $('#nav-bottom');
  if (sidebar) sidebar.classList.add('hidden');
  if (bottomNav) bottomNav.classList.add('hidden');
}
