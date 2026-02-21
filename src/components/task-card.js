// ============================================================
// LIFE OS — Task Card Component
// ============================================================

import { TIERS } from '../config.js';
import { calculateXP } from '../services/xp.js';

/**
 * Create a task card element
 * @param {Object} task
 * @param {Object} handlers - { onComplete, onHighlight, onDelete, onEdit }
 * @returns {HTMLElement}
 */
export function createTaskCard(task, handlers = {}) {
  const tier = TIERS[task.tier] || TIERS[5];
  const isCompleted = task.status === 'completed';
  const xpPreview = calculateXP(task);

  const card = document.createElement('div');
  card.className = `task-card stagger-item ${isCompleted ? 'completed' : ''} ${task.is_highlighted ? 'highlighted' : ''}`;
  card.dataset.taskId = task.id;

  card.innerHTML = `
    <div class="task-checkbox ${isCompleted ? 'checked' : ''}" role="checkbox" aria-checked="${isCompleted}" tabindex="0">
      ${isCompleted ? '✓' : ''}
    </div>
    <div class="task-body">
      <div class="task-title">${escapeHtml(task.title)}</div>
      <div class="task-meta">
        <span class="tier-badge tier-${task.tier}">${tier.icon} ${tier.shortName}</span>
        <span class="task-xp">${xpPreview.toFixed(2)} XP</span>
        ${task.is_highlighted ? '<span class="highlight-indicator">★ Top 3</span>' : ''}
        ${task.due_date ? `<span class="text-muted" style="font-size:0.75rem">${task.due_date}</span>` : ''}
      </div>
    </div>
    <div class="task-actions">
      ${!isCompleted ? `<button class="btn btn-ghost btn-sm task-highlight-btn" title="Toggle highlight">★</button>` : ''}
      <button class="btn btn-ghost btn-sm task-delete-btn" title="Delete">✕</button>
    </div>
  `;

  // Checkbox click
  const checkbox = card.querySelector('.task-checkbox');
  checkbox.addEventListener('click', () => {
    if (!isCompleted && handlers.onComplete) {
      checkbox.classList.add('checked', 'anim-check-bounce');
      checkbox.innerHTML = '✓';
      card.classList.add('completed');
      handlers.onComplete(task);
    }
  });

  checkbox.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      checkbox.click();
    }
  });

  // Highlight button
  const highlightBtn = card.querySelector('.task-highlight-btn');
  if (highlightBtn && handlers.onHighlight) {
    highlightBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handlers.onHighlight(task);
    });
  }

  // Delete button
  const deleteBtn = card.querySelector('.task-delete-btn');
  if (deleteBtn && handlers.onDelete) {
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handlers.onDelete(task);
    });
  }

  return card;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
