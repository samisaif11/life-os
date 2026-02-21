// ============================================================
// LIFE OS — Sync Engine
// localStorage ↔ Supabase bidirectional sync
// ============================================================

import { getSupabase, isConfigured } from './supabase.js';
import { getUserId } from './auth.js';
import * as storage from '../utils/storage.js';
import { SYNC_INTERVAL_MS, SYNC_DEBOUNCE_MS, SYNCABLE_TABLES } from '../config.js';

let syncInterval = null;
let debounceTimer = null;
let isSyncing = false;
let syncListeners = [];

/**
 * Notify sync status listeners
 * @param {'idle'|'syncing'|'error'|'offline'} status
 */
function notifySyncStatus(status) {
  syncListeners.forEach(fn => fn(status));
}

/**
 * Subscribe to sync status changes
 * @param {Function} callback
 * @returns {Function} Unsubscribe
 */
export function onSyncStatusChange(callback) {
  syncListeners.push(callback);
  return () => {
    syncListeners = syncListeners.filter(fn => fn !== callback);
  };
}

/**
 * Push pending operations from sync queue to Supabase
 */
export async function pushQueue() {
  const supabase = getSupabase();
  if (!supabase || !navigator.onLine) return;

  const queue = storage.getSyncQueue().filter(op => !op.synced);
  if (queue.length === 0) return;

  let syncedCount = 0;

  for (const op of queue) {
    try {
      const { table, op: operation, data } = op;

      if (operation === 'insert') {
        const { error } = await supabase.from(table).upsert(data, { onConflict: 'id' });
        if (error) throw error;
      } else if (operation === 'update') {
        const { error } = await supabase.from(table).upsert(data, { onConflict: 'id' });
        if (error) throw error;
      } else if (operation === 'delete') {
        const { error } = await supabase.from(table).delete().eq('id', data.id);
        if (error) throw error;
      }

      syncedCount++;
    } catch (err) {
      console.warn(`[Sync] Failed to push ${op.op} to ${op.table}:`, err);
      break; // Stop on first error to maintain order
    }
  }

  if (syncedCount > 0) {
    storage.markSynced(syncedCount);
    storage.clearSyncedFromQueue();
  }
}

/**
 * Pull latest data from Supabase for all syncable tables
 */
export async function pullLatest() {
  const supabase = getSupabase();
  const userId = getUserId();
  if (!supabase || !userId || !navigator.onLine) return;

  for (const table of SYNCABLE_TABLES) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        mergeData(table, data);
      }
    } catch (err) {
      console.warn(`[Sync] Failed to pull ${table}:`, err);
    }
  }
}

/**
 * Merge remote data with local data (last-write-wins by updated_at)
 * @param {string} table
 * @param {Array} remoteItems
 */
function mergeData(table, remoteItems) {
  const localItems = storage.getTable(table);
  const merged = new Map();

  // Add all local items
  for (const item of localItems) {
    merged.set(item.id, item);
  }

  // Merge remote items (last-write-wins)
  for (const remoteItem of remoteItems) {
    const localItem = merged.get(remoteItem.id);
    if (!localItem) {
      // New from remote
      merged.set(remoteItem.id, remoteItem);
    } else {
      // Compare timestamps
      const localTime = new Date(localItem.updated_at || localItem.created_at).getTime();
      const remoteTime = new Date(remoteItem.updated_at || remoteItem.created_at).getTime();
      if (remoteTime >= localTime) {
        merged.set(remoteItem.id, remoteItem);
      }
    }
  }

  storage.setTable(table, [...merged.values()]);
}

/**
 * Run a full sync cycle (push then pull)
 */
export async function sync() {
  if (isSyncing || !navigator.onLine || !isConfigured()) return;

  isSyncing = true;
  notifySyncStatus('syncing');

  try {
    await pushQueue();
    await pullLatest();
    notifySyncStatus('idle');
  } catch (err) {
    console.error('[Sync] Error:', err);
    notifySyncStatus('error');
  } finally {
    isSyncing = false;
  }
}

/**
 * Schedule a debounced sync (called after every write)
 */
export function scheduleSyncDebounced() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    sync();
  }, SYNC_DEBOUNCE_MS);
}

/**
 * Start automatic periodic sync
 */
export function startAutoSync() {
  // Sync on online event
  window.addEventListener('online', () => {
    notifySyncStatus('idle');
    sync();
  });

  window.addEventListener('offline', () => {
    notifySyncStatus('offline');
  });

  // Sync on tab focus
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && navigator.onLine) {
      sync();
    }
  });

  // Periodic sync
  syncInterval = setInterval(() => {
    if (document.visibilityState === 'visible' && navigator.onLine) {
      sync();
    }
  }, SYNC_INTERVAL_MS);

  // Initial sync
  if (navigator.onLine && isConfigured()) {
    sync();
  } else {
    notifySyncStatus(navigator.onLine ? 'idle' : 'offline');
  }
}

/**
 * Stop automatic sync
 */
export function stopAutoSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}
