// ============================================================
// LIFE OS — Grocery Item Component
// ============================================================

import { PRIORITY_COLORS } from '../config.js';

/**
 * Create a grocery item element
 * @param {Object} grocery
 * @param {Object} handlers - { onToggleBought, onDelete }
 * @returns {HTMLElement}
 */
export function createGroceryItem(grocery, handlers = {}) {
  const priorityColor = PRIORITY_COLORS[grocery.priority] || PRIORITY_COLORS[3];

  const item = document.createElement('div');
  item.className = `grocery-item ${grocery.is_bought ? 'bought' : ''} stagger-item`;
  item.dataset.groceryId = grocery.id;

  item.innerHTML = `
    <div class="grocery-priority" style="background:${priorityColor}"></div>
    <div class="task-checkbox ${grocery.is_bought ? 'checked' : ''}" role="checkbox" aria-checked="${grocery.is_bought}" tabindex="0">
      ${grocery.is_bought ? '✓' : ''}
    </div>
    <span class="grocery-name">${escapeHtml(grocery.item)}</span>
    ${grocery.category !== 'general' ? `<span class="grocery-category">${escapeHtml(grocery.category)}</span>` : ''}
    <button class="btn btn-ghost btn-sm grocery-delete-btn" title="Delete" style="opacity:0.3">✕</button>
  `;

  // Toggle bought
  const checkbox = item.querySelector('.task-checkbox');
  checkbox.addEventListener('click', () => {
    if (handlers.onToggleBought) handlers.onToggleBought(grocery);
  });

  // Delete
  const deleteBtn = item.querySelector('.grocery-delete-btn');
  deleteBtn.addEventListener('click', () => {
    if (handlers.onDelete) handlers.onDelete(grocery);
  });

  return item;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
