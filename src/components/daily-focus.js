// ============================================================
// LIFE OS — Daily Focus Widget
// ============================================================

import { TIERS } from '../config.js';
import { calculateXP } from '../services/xp.js';

/**
 * Create the daily focus widget
 * @param {Object|null} task - The highest-priority uncompleted task
 * @param {Function} onComplete - Callback when the focus task is completed
 * @returns {HTMLElement}
 */
export function createDailyFocus(task, onComplete) {
  const widget = document.createElement('div');
  widget.className = 'daily-focus';

  if (!task) {
    widget.innerHTML = `
      <div class="daily-focus-label">Today's Focus</div>
      <div class="daily-focus-task text-muted" style="font-size:1rem">
        All tasks done! You're crushing it.
      </div>
    `;
    return widget;
  }

  const tier = TIERS[task.tier] || TIERS[5];
  const xp = calculateXP(task);

  widget.innerHTML = `
    <div class="daily-focus-label">Today's Focus</div>
    <div class="daily-focus-task">${escapeHtml(task.title)}</div>
    <div class="task-meta" style="margin-top: var(--space-sm)">
      <span class="tier-badge tier-${task.tier}">${tier.icon} ${tier.shortName}</span>
      <span class="task-xp">${xp.toFixed(2)} XP</span>
    </div>
    <div class="daily-focus-complete">
      <button class="btn btn-primary btn-lg" id="focus-complete-btn">
        Complete This Task
      </button>
    </div>
  `;

  const btn = widget.querySelector('#focus-complete-btn');
  btn.addEventListener('click', () => {
    if (onComplete) onComplete(task);
  });

  return widget;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
