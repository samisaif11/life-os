// ============================================================
// LIFE OS — Settings View
// ============================================================

import { signOut, getUser } from '../services/auth.js';
import { isConfigured } from '../services/supabase.js';
import { onSyncStatusChange, sync } from '../services/sync.js';
import * as storage from '../utils/storage.js';
import { $ } from '../utils/dom.js';
import { showToast } from '../components/toast.js';
import { renderNav } from '../components/nav.js';

/**
 * Render the settings view
 * @param {HTMLElement} container
 */
export async function render(container) {
  renderNav();
  const user = getUser();
  const configured = isConfigured();

  container.innerHTML = `
    <h2 style="margin-bottom:var(--space-xl)">⚙ Settings</h2>

    <div class="settings-sections">
      <!-- Profile -->
      <div class="settings-section">
        <h3>Profile</h3>
        <div class="settings-row">
          <label>Email</label>
          <span class="text-secondary">${user?.email || 'Local mode'}</span>
        </div>
        <div class="settings-row">
          <label>User ID</label>
          <span class="text-muted font-mono" style="font-size:0.75rem">${user?.id || 'N/A'}</span>
        </div>
      </div>

      <!-- Sync -->
      <div class="settings-section">
        <h3>Sync</h3>
        <div class="settings-row">
          <label>Supabase</label>
          <span class="${configured ? 'text-success' : 'text-warning'}">${configured ? 'Connected' : 'Not configured'}</span>
        </div>
        <div class="settings-row">
          <label>Status</label>
          <div class="sync-status">
            <span class="sync-dot ${navigator.onLine ? 'online' : 'offline'}" id="sync-dot"></span>
            <span id="sync-status-text">${navigator.onLine ? 'Online' : 'Offline'}</span>
          </div>
        </div>
        <div class="settings-row">
          <label>Pending Syncs</label>
          <span class="font-mono" id="pending-count">${storage.getSyncQueue().filter(o => !o.synced).length}</span>
        </div>
        <div style="margin-top:var(--space-md)">
          <button class="btn btn-secondary btn-sm" id="force-sync-btn" ${!configured ? 'disabled' : ''}>
            Force Sync Now
          </button>
        </div>
      </div>

      <!-- Data -->
      <div class="settings-section">
        <h3>Data</h3>
        <div class="settings-row">
          <label>Export Data</label>
          <button class="btn btn-secondary btn-sm" id="export-btn">Download JSON</button>
        </div>
        <div class="settings-row">
          <label>Clear Local Cache</label>
          <button class="btn btn-danger btn-sm" id="clear-cache-btn">Clear Cache</button>
        </div>
      </div>

      <!-- Supabase Setup Guide (if not configured) -->
      ${!configured ? `
        <div class="settings-section" style="border-color:var(--warning)">
          <h3 style="color:var(--warning)">Setup Required</h3>
          <p class="text-secondary" style="font-size:0.9rem;line-height:1.6">
            To enable cloud sync, you need to configure Supabase:
          </p>
          <ol style="color:var(--text-secondary);font-size:0.85rem;line-height:2;padding-left:var(--space-lg);list-style:decimal">
            <li>Create a free Supabase project at supabase.com</li>
            <li>Go to Settings → API and copy your Project URL and anon key</li>
            <li>Edit <code class="font-mono" style="color:var(--accent)">src/config.js</code> and replace the placeholders</li>
            <li>Run the SQL files in <code class="font-mono" style="color:var(--accent)">supabase/</code> folder via Supabase SQL Editor</li>
          </ol>
          <p class="text-muted" style="font-size:0.8rem;margin-top:var(--space-md)">
            The app works offline without Supabase — your data is saved in your browser's localStorage.
          </p>
        </div>
      ` : ''}

      <!-- Account -->
      <div class="settings-section">
        <button class="btn btn-danger" id="logout-btn">Sign Out</button>
      </div>
    </div>
  `;

  // Force sync
  container.querySelector('#force-sync-btn')?.addEventListener('click', async () => {
    showToast('Syncing...', 'info');
    await sync();
    const pending = storage.getSyncQueue().filter(o => !o.synced).length;
    const pendingEl = container.querySelector('#pending-count');
    if (pendingEl) pendingEl.textContent = pending;
    showToast(pending === 0 ? 'Sync complete!' : `Sync done. ${pending} items pending.`, 'success');
  });

  // Export data
  container.querySelector('#export-btn')?.addEventListener('click', () => {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('lifeos_')) {
        data[key] = JSON.parse(localStorage.getItem(key));
      }
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifeos-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('Data exported!', 'success');
  });

  // Clear cache
  container.querySelector('#clear-cache-btn')?.addEventListener('click', () => {
    if (confirm('This will clear all local data. Your Supabase data (if synced) will remain. Continue?')) {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key.startsWith('lifeos_')) {
          localStorage.removeItem(key);
        }
      }
      showToast('Local cache cleared. Reloading...', 'info');
      setTimeout(() => location.reload(), 1000);
    }
  });

  // Logout
  container.querySelector('#logout-btn')?.addEventListener('click', async () => {
    await signOut();
    // Auth listener in app.js will handle redirect to login
  });

  // Listen for sync status changes
  const unsub = onSyncStatusChange(status => {
    const dot = container.querySelector('#sync-dot');
    const text = container.querySelector('#sync-status-text');
    if (dot && text) {
      dot.className = `sync-dot ${status === 'syncing' ? 'syncing' : navigator.onLine ? 'online' : 'offline'}`;
      text.textContent = status === 'syncing' ? 'Syncing...' : navigator.onLine ? 'Online' : 'Offline';
    }
  });

  return unsub;
}
