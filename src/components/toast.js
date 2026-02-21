// ============================================================
// LIFE OS — Toast Notifications
// ============================================================

import { $ } from '../utils/dom.js';

const ICONS = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  xp: '★',
};

/**
 * Show a toast notification
 * @param {string} message
 * @param {'success'|'error'|'info'|'xp'} type
 * @param {number} duration - ms (default 3000)
 */
export function showToast(message, type = 'info', duration = 3000) {
  const container = $('#toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${ICONS[type] || ICONS.info}</span>
    <span class="toast-message">${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => {
    toast.classList.add('visible');
  });

  // Auto-remove
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Show XP earned toast
 * @param {number} amount
 * @param {boolean} multiplierActive
 */
export function showXPToast(amount, multiplierActive = false) {
  const mult = multiplierActive ? ' (2X!)' : '';
  showToast(`+${amount.toFixed(2)} XP earned${mult}`, 'xp', 3500);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
