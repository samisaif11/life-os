// ============================================================
// LIFE OS — Tasks View
// ============================================================

import * as db from '../services/db.js';
import * as xp from '../services/xp.js';
import { TIERS } from '../config.js';
import { todayISO } from '../utils/date.js';
import { $ } from '../utils/dom.js';
import { createTaskCard } from '../components/task-card.js';
import { openModal, closeModal } from '../components/modal.js';
import { showToast, showXPToast } from '../components/toast.js';
import { showXpPopup } from '../utils/animations.js';
import { renderNav, updateNavXP } from '../components/nav.js';

let currentFilter = 'today';

/**
 * Render the tasks view
 * @param {HTMLElement} container
 */
export async function render(container) {
  renderNav();
  const today = todayISO();

  container.innerHTML = `
    <div class="tasks-view-header">
      <h2>☑ Tasks</h2>
      <div class="flex gap-sm items-center">
        <div class="tasks-filters">
          <button class="filter-btn ${currentFilter === 'today' ? 'active' : ''}" data-filter="today">Today</button>
          <button class="filter-btn ${currentFilter === 'upcoming' ? 'active' : ''}" data-filter="upcoming">Upcoming</button>
          <button class="filter-btn ${currentFilter === 'completed' ? 'active' : ''}" data-filter="completed">Done</button>
        </div>
        <button class="btn btn-primary btn-sm" id="add-task-btn">+ Add Task</button>
      </div>
    </div>
    <div id="tasks-list" class="tasks-list"></div>
  `;

  // Filter buttons
  container.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilter = btn.dataset.filter;
      renderTaskList(container);
      container.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.filter === currentFilter));
    });
  });

  // Add task button
  container.querySelector('#add-task-btn').addEventListener('click', () => openAddTaskModal(container));

  // Render the list
  renderTaskList(container);
}

function renderTaskList(container) {
  const listEl = container.querySelector('#tasks-list');
  if (!listEl) return;
  listEl.innerHTML = '';

  const today = todayISO();
  let tasks;

  if (currentFilter === 'today') {
    tasks = db.getAll('tasks', {
      filter: t => t.scheduled_date === today && t.status !== 'completed',
      sort: { field: 'sort_order', direction: 'asc' },
    });
  } else if (currentFilter === 'upcoming') {
    tasks = db.getAll('tasks', {
      filter: t => t.status !== 'completed' && (!t.scheduled_date || t.scheduled_date > today),
      sort: { field: 'due_date', direction: 'asc' },
    });
  } else {
    tasks = db.getAll('tasks', {
      filter: t => t.status === 'completed',
      sort: { field: 'completed_at', direction: 'desc' },
    });
  }

  // Sort: highlighted first, then by tier
  if (currentFilter === 'today') {
    tasks.sort((a, b) => {
      if (a.is_highlighted && !b.is_highlighted) return -1;
      if (!a.is_highlighted && b.is_highlighted) return 1;
      return (a.tier || 5) - (b.tier || 5);
    });
  }

  if (tasks.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">${currentFilter === 'completed' ? '🎉' : '📝'}</div>
        <p class="empty-state-text">
          ${currentFilter === 'completed' ? 'No completed tasks yet.' : 'No tasks. Add one to get started!'}
        </p>
      </div>
    `;
    return;
  }

  // Show highlighted section label
  const highlighted = tasks.filter(t => t.is_highlighted);
  const regular = tasks.filter(t => !t.is_highlighted);

  if (highlighted.length > 0 && currentFilter === 'today') {
    const label = document.createElement('div');
    label.className = 'tasks-section-label';
    label.textContent = `★ TOP ${highlighted.length} — Focus on these first`;
    listEl.appendChild(label);

    highlighted.forEach(task => {
      listEl.appendChild(createTaskCard(task, {
        onComplete: (t) => handleComplete(t, container),
        onHighlight: (t) => handleHighlight(t, container),
        onDelete: (t) => handleDelete(t, container),
      }));
    });

    if (regular.length > 0) {
      const otherLabel = document.createElement('div');
      otherLabel.className = 'tasks-section-label';
      otherLabel.textContent = 'Other Tasks';
      listEl.appendChild(otherLabel);
    }
  }

  regular.forEach(task => {
    listEl.appendChild(createTaskCard(task, {
      onComplete: (t) => handleComplete(t, container),
      onHighlight: (t) => handleHighlight(t, container),
      onDelete: (t) => handleDelete(t, container),
    }));
  });
}

function handleComplete(task, container) {
  const healthActive = xp.isHealthMultiplierActive();
  const earnedXP = xp.awardXP(task);
  db.update('tasks', task.id, {
    status: 'completed',
    completed_at: new Date().toISOString(),
  });
  xp.updateStreak();

  showXPToast(earnedXP, healthActive);
  updateNavXP();

  setTimeout(() => renderTaskList(container), 400);
}

function handleHighlight(task, container) {
  const today = todayISO();
  const highlighted = db.getAll('tasks', {
    filter: t => t.scheduled_date === today && t.is_highlighted && t.status !== 'completed',
  });

  if (!task.is_highlighted && highlighted.length >= 3) {
    showToast('Maximum 3 highlighted tasks per day.', 'info');
    return;
  }

  db.update('tasks', task.id, { is_highlighted: !task.is_highlighted });
  renderTaskList(container);
}

function handleDelete(task, container) {
  db.remove('tasks', task.id);
  showToast('Task deleted.', 'info');
  renderTaskList(container);
}

function openAddTaskModal(container) {
  const tierOptions = Object.entries(TIERS).map(([tier, config]) =>
    `<option value="${tier}">${config.icon} ${config.name}</option>`
  ).join('');

  openModal({
    title: 'Add Task',
    body: `
      <form id="add-task-form">
        <div class="form-group">
          <label class="form-label" for="task-title">Task</label>
          <input class="form-input" type="text" id="task-title" placeholder="What needs to be done?" required autofocus>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="task-tier">Pillar</label>
            <select class="form-select" id="task-tier">
              ${tierOptions}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="task-date">Date</label>
            <input class="form-input" type="date" id="task-date" value="${todayISO()}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="task-description">Notes (optional)</label>
          <input class="form-input" type="text" id="task-description" placeholder="Any extra context...">
        </div>
      </form>
    `,
    buttons: [
      { label: 'Cancel', className: 'btn btn-secondary', onClick: closeModal },
      {
        label: 'Add Task',
        className: 'btn btn-primary',
        onClick: () => {
          const title = document.getElementById('task-title').value.trim();
          const tier = parseInt(document.getElementById('task-tier').value);
          const date = document.getElementById('task-date').value;
          const description = document.getElementById('task-description').value.trim();

          if (!title) {
            showToast('Please enter a task title.', 'error');
            return;
          }

          const tierConfig = TIERS[tier];
          db.create('tasks', {
            title,
            tier,
            base_xp: tierConfig.baseXp,
            scheduled_date: date || todayISO(),
            description: description || null,
            status: 'pending',
            is_highlighted: false,
          });

          closeModal();
          showToast('Task added!', 'success');
          renderTaskList(container);
        },
      },
    ],
  });
}
