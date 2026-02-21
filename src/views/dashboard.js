// ============================================================
// LIFE OS — Dashboard View
// ============================================================

import * as db from '../services/db.js';
import * as xp from '../services/xp.js';
import { TIERS } from '../config.js';
import { todayISO } from '../utils/date.js';
import { countdown } from '../utils/date.js';
import { createDailyFocus } from '../components/daily-focus.js';
import { createProgressBar } from '../components/progress-bar.js';
import { showToast, showXPToast } from '../components/toast.js';
import { showXpPopup } from '../utils/animations.js';
import { navigate } from '../router.js';
import { renderNav, updateNavXP } from '../components/nav.js';

/**
 * Render the dashboard view
 * @param {HTMLElement} container
 */
export async function render(container) {
  renderNav();
  const today = todayISO();

  // Get data
  const todayTasks = db.getAll('tasks', {
    filter: t => t.scheduled_date === today && t.status !== 'skipped',
    sort: { field: 'tier', direction: 'asc' },
  });

  const completedToday = todayTasks.filter(t => t.status === 'completed');
  const pendingTasks = todayTasks.filter(t => t.status !== 'completed');
  const todayXP = xp.getTodayXP();
  const totalXP = xp.getTotalXP();
  const level = xp.getLevel();
  const levelProgress = xp.getLevelProgress();
  const streak = xp.getCurrentStreak();
  const healthActive = xp.isHealthMultiplierActive();

  // Find focus task (highest tier, uncompleted, highlighted first)
  const focusTask = pendingTasks.find(t => t.is_highlighted) || pendingTasks[0] || null;

  // Upcoming deadlines
  const upcomingDeadlines = db.getAll('deadlines', {
    filter: d => !d.is_completed && new Date(d.due_at) > new Date(),
    sort: { field: 'due_at', direction: 'asc' },
  }).slice(0, 3);

  // Build the dashboard
  container.innerHTML = `
    <div class="dashboard-grid">
      <!-- Health Multiplier Banner -->
      <div class="health-check-banner ${healthActive ? '' : 'inactive'}" id="health-banner">
        <div>
          <div class="multiplier-badge ${healthActive ? 'multiplier-active' : 'multiplier-inactive'}">
            ${healthActive ? '2X ACTIVE' : '1X'}
          </div>
          <div style="font-size:0.8rem;color:var(--text-secondary);margin-top:4px">
            ${healthActive
              ? 'Health multiplier active! All XP is doubled.'
              : 'Complete a health task to activate 2X multiplier.'}
          </div>
        </div>
        ${!healthActive ? `<button class="btn btn-primary btn-sm" id="health-check-btn">Health Check</button>` : ''}
      </div>

      <!-- Daily Focus -->
      <div id="daily-focus-container"></div>

      <!-- Stats Row -->
      <div class="dashboard-stats">
        <div class="stat-card">
          <div class="stat-value">${completedToday.length}/${todayTasks.length}</div>
          <div class="stat-label">Tasks Done</div>
        </div>
        <div class="stat-card">
          <div class="stat-value xp-amount">${todayXP.toFixed(2)}</div>
          <div class="stat-label">XP Today</div>
        </div>
        <div class="stat-card">
          <div class="streak-display">
            <span class="streak-fire">${streak > 0 ? '🔥' : '💤'}</span>
            <span class="streak-count">${streak}</span>
          </div>
          <div class="stat-label">Day Streak</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">Lv.${level}</div>
          <div class="stat-label">${totalXP.toFixed(0)} Total XP</div>
          <div style="margin-top:6px" id="level-progress"></div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <button class="btn btn-secondary btn-sm" id="quick-add-task">+ Task</button>
        <button class="btn btn-secondary btn-sm" id="quick-add-grocery">+ Grocery</button>
        <button class="btn btn-secondary btn-sm" id="quick-add-deadline">+ Deadline</button>
      </div>

      <!-- Upcoming Deadlines -->
      ${upcomingDeadlines.length > 0 ? `
        <div>
          <div class="section-header">
            <h3>Upcoming</h3>
          </div>
          <div class="dashboard-upcoming" id="upcoming-list"></div>
        </div>
      ` : ''}
    </div>
  `;

  // Render daily focus
  const focusContainer = container.querySelector('#daily-focus-container');
  const focusWidget = createDailyFocus(focusTask, handleCompleteTask);
  focusContainer.appendChild(focusWidget);

  // Render level progress bar
  const levelProgressEl = container.querySelector('#level-progress');
  if (levelProgressEl) {
    levelProgressEl.appendChild(createProgressBar(levelProgress.percentage, { size: 'sm' }));
  }

  // Render upcoming deadlines
  const upcomingList = container.querySelector('#upcoming-list');
  if (upcomingList) {
    upcomingDeadlines.forEach(deadline => {
      const { text, urgency } = countdown(deadline.due_at);
      const card = document.createElement('div');
      card.className = `card flex justify-between items-center`;
      card.style.padding = 'var(--space-md)';
      card.innerHTML = `
        <div>
          <div style="font-weight:500">${escapeHtml(deadline.title)}</div>
          <div style="font-size:0.8rem;color:var(--text-muted)">${deadline.category || ''}</div>
        </div>
        <div class="deadline-countdown ${urgency}" style="font-size:0.95rem">${text}</div>
      `;
      upcomingList.appendChild(card);
    });
  }

  // Quick action handlers
  container.querySelector('#quick-add-task')?.addEventListener('click', () => navigate('tasks'));
  container.querySelector('#quick-add-grocery')?.addEventListener('click', () => navigate('groceries'));
  container.querySelector('#quick-add-deadline')?.addEventListener('click', () => navigate('deadlines'));

  // Health check button
  container.querySelector('#health-check-btn')?.addEventListener('click', () => {
    xp.updateHealthCheck({ meds_taken: true, health_minimum_met: true });
    showToast('Health check completed! 2X multiplier activated!', 'success');
    render(container); // Re-render dashboard
  });

  async function handleCompleteTask(task) {
    const earnedXP = xp.awardXP(task);
    db.update('tasks', task.id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
    });
    xp.updateStreak();

    showXPToast(earnedXP, healthActive);
    showXpPopup(window.innerWidth / 2, window.innerHeight / 3, earnedXP);

    updateNavXP();

    // Re-render after short delay for animation
    setTimeout(() => render(container), 500);
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
