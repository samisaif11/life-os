// ============================================================
// LIFE OS — Deadlines View
// ============================================================

import * as db from '../services/db.js';
import { DEADLINE_CATEGORIES } from '../config.js';
import { $ } from '../utils/dom.js';
import { createDeadlineCard } from '../components/deadline-card.js';
import { openModal, closeModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { renderNav } from '../components/nav.js';

let countdownIntervalId = null;

/**
 * Render the deadlines view
 * @param {HTMLElement} container
 * @returns {Function} Cleanup function
 */
export async function render(container) {
  renderNav();

  container.innerHTML = `
    <div class="section-header">
      <h2>⏱ Deadlines</h2>
      <button class="btn btn-primary btn-sm" id="add-deadline-btn">+ Add Deadline</button>
    </div>

    <div id="deadlines-active" class="deadlines-grid"></div>

    <div style="margin-top:var(--space-xl)">
      <h3 class="text-muted" style="font-size:0.85rem;margin-bottom:var(--space-md)">Completed</h3>
      <div id="deadlines-completed" class="deadlines-grid"></div>
    </div>
  `;

  // Add deadline button
  container.querySelector('#add-deadline-btn').addEventListener('click', () => openAddDeadlineModal(container));

  renderDeadlines(container);

  // Update countdowns every minute
  countdownIntervalId = setInterval(() => {
    renderDeadlines(container);
  }, 60_000);

  // Return cleanup function
  return () => {
    if (countdownIntervalId) {
      clearInterval(countdownIntervalId);
      countdownIntervalId = null;
    }
  };
}

function renderDeadlines(container) {
  const activeList = container.querySelector('#deadlines-active');
  const completedList = container.querySelector('#deadlines-completed');
  if (!activeList || !completedList) return;

  const active = db.getAll('deadlines', {
    filter: d => !d.is_completed,
    sort: { field: 'due_at', direction: 'asc' },
  });

  const completed = db.getAll('deadlines', {
    filter: d => d.is_completed,
    sort: { field: 'due_at', direction: 'desc' },
  });

  // Render active
  activeList.innerHTML = '';
  if (active.length === 0) {
    activeList.innerHTML = '<div class="empty-state"><p class="text-muted">No upcoming deadlines.</p></div>';
  } else {
    active.forEach(deadline => {
      activeList.appendChild(createDeadlineCard(deadline, {
        onComplete: (d) => handleComplete(d, container),
        onDelete: (d) => handleDelete(d, container),
      }));
    });
  }

  // Render completed
  completedList.innerHTML = '';
  if (completed.length === 0) {
    completedList.innerHTML = '<div class="text-muted" style="font-size:0.85rem">None yet.</div>';
  } else {
    completed.forEach(deadline => {
      const card = document.createElement('div');
      card.className = 'card';
      card.style.opacity = '0.5';
      card.style.padding = 'var(--space-md)';
      card.innerHTML = `
        <div style="text-decoration:line-through">${escapeHtml(deadline.title)}</div>
        <button class="btn btn-ghost btn-sm" style="margin-top:var(--space-xs)">Delete</button>
      `;
      card.querySelector('button').addEventListener('click', () => handleDelete(deadline, container));
      completedList.appendChild(card);
    });
  }
}

function handleComplete(deadline, container) {
  db.update('deadlines', deadline.id, { is_completed: true });
  showToast('Deadline marked complete!', 'success');
  renderDeadlines(container);
}

function handleDelete(deadline, container) {
  db.remove('deadlines', deadline.id);
  showToast('Deadline deleted.', 'info');
  renderDeadlines(container);
}

function openAddDeadlineModal(container) {
  const categoryOptions = DEADLINE_CATEGORIES.map(c =>
    `<option value="${c}">${c}</option>`
  ).join('');

  // Default to tomorrow 9:00 AM
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  const defaultDateTime = tomorrow.toISOString().slice(0, 16);

  openModal({
    title: 'Add Deadline',
    body: `
      <form id="add-deadline-form">
        <div class="form-group">
          <label class="form-label" for="deadline-title">Title</label>
          <input class="form-input" type="text" id="deadline-title" placeholder="Doctor appointment..." required autofocus>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="deadline-date">Date & Time</label>
            <input class="form-input" type="datetime-local" id="deadline-date" value="${defaultDateTime}" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="deadline-category">Category</label>
            <select class="form-select" id="deadline-category">
              ${categoryOptions}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="deadline-questions">Pre-questions (one per line, optional)</label>
          <textarea class="form-input" id="deadline-questions" rows="3" placeholder="What should I ask the doctor?&#10;What symptoms to report?"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label" for="deadline-description">Notes (optional)</label>
          <input class="form-input" type="text" id="deadline-description" placeholder="Any extra details...">
        </div>
      </form>
    `,
    buttons: [
      { label: 'Cancel', className: 'btn btn-secondary', onClick: closeModal },
      {
        label: 'Add Deadline',
        className: 'btn btn-primary',
        onClick: () => {
          const title = document.getElementById('deadline-title').value.trim();
          const dueAt = document.getElementById('deadline-date').value;
          const category = document.getElementById('deadline-category').value;
          const questionsRaw = document.getElementById('deadline-questions').value.trim();
          const description = document.getElementById('deadline-description').value.trim();

          if (!title || !dueAt) {
            showToast('Please fill in title and date.', 'error');
            return;
          }

          const preQuestions = questionsRaw
            ? questionsRaw.split('\n').map(q => q.trim()).filter(Boolean)
            : [];

          db.create('deadlines', {
            title,
            due_at: new Date(dueAt).toISOString(),
            category,
            pre_questions: preQuestions,
            description: description || null,
            is_completed: false,
          });

          closeModal();
          showToast('Deadline added!', 'success');
          renderDeadlines(container);
        },
      },
    ],
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
