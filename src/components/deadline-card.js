// ============================================================
// LIFE OS — Deadline Card Component
// ============================================================

import { countdown, formatDateTime } from '../utils/date.js';

/**
 * Create a deadline card element
 * @param {Object} deadline
 * @param {Object} handlers - { onComplete, onDelete }
 * @returns {HTMLElement}
 */
export function createDeadlineCard(deadline, handlers = {}) {
  const { text, urgency } = countdown(deadline.due_at);

  const card = document.createElement('div');
  card.className = `deadline-card ${urgency} ${urgency === 'urgent' ? 'anim-urgent-pulse' : ''} stagger-item`;
  card.dataset.deadlineId = deadline.id;

  const hasQuestions = deadline.pre_questions && deadline.pre_questions.length > 0;

  card.innerHTML = `
    <div class="flex justify-between items-center">
      <div>
        <div class="deadline-countdown ${urgency}">${text}</div>
        <div class="deadline-title">${escapeHtml(deadline.title)}</div>
        <div class="deadline-date">${formatDateTime(deadline.due_at)}</div>
      </div>
      <div class="flex gap-xs">
        ${!deadline.is_completed ? `<button class="btn btn-ghost btn-sm deadline-complete-btn" title="Mark done">✓</button>` : ''}
        <button class="btn btn-ghost btn-sm deadline-delete-btn" title="Delete">✕</button>
      </div>
    </div>
    ${hasQuestions ? `
      <div class="deadline-questions">
        ${deadline.pre_questions.map(q => `<div class="deadline-question">${escapeHtml(q)}</div>`).join('')}
      </div>
    ` : ''}
    ${deadline.description ? `<div style="margin-top:var(--space-sm);font-size:0.85rem;color:var(--text-secondary)">${escapeHtml(deadline.description)}</div>` : ''}
  `;

  // Complete handler
  const completeBtn = card.querySelector('.deadline-complete-btn');
  if (completeBtn && handlers.onComplete) {
    completeBtn.addEventListener('click', () => handlers.onComplete(deadline));
  }

  // Delete handler
  const deleteBtn = card.querySelector('.deadline-delete-btn');
  if (deleteBtn && handlers.onDelete) {
    deleteBtn.addEventListener('click', () => handlers.onDelete(deadline));
  }

  return card;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
