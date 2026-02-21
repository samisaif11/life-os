// ============================================================
// LIFE OS — Offline-first Database Service
// All reads from localStorage. All writes to localStorage + sync queue.
// ============================================================

import * as storage from '../utils/storage.js';
import { uuid } from '../utils/dom.js';
import { nowISO } from '../utils/date.js';
import { getUserId } from './auth.js';
import { scheduleSyncDebounced } from './sync.js';

/**
 * Get all records from a table
 * @param {string} table
 * @param {Object} options - { filter, sort, limit }
 * @returns {Array}
 */
export function getAll(table, options = {}) {
  let items = storage.getTable(table);

  // Filter by user_id
  const userId = getUserId();
  if (userId) {
    items = items.filter(item => item.user_id === userId);
  }

  // Apply custom filter
  if (options.filter && typeof options.filter === 'function') {
    items = items.filter(options.filter);
  }

  // Apply sort
  if (options.sort) {
    const { field, direction = 'asc' } = options.sort;
    items.sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Apply limit
  if (options.limit) {
    items = items.slice(0, options.limit);
  }

  return items;
}

/**
 * Get a single record by ID
 * @param {string} table
 * @param {string} id
 * @returns {Object|null}
 */
export function getById(table, id) {
  return storage.getById(table, id);
}

/**
 * Create a new record
 * @param {string} table
 * @param {Object} data - Record data (id will be auto-generated)
 * @returns {Object} The created record
 */
export function create(table, data) {
  const userId = getUserId();
  const now = nowISO();
  const record = {
    id: uuid(),
    user_id: userId,
    ...data,
    created_at: now,
    updated_at: now,
  };

  // Write to localStorage
  storage.upsert(table, record);

  // Queue for Supabase sync
  storage.addToSyncQueue({
    table,
    op: 'insert',
    data: record,
  });

  // Trigger debounced sync
  scheduleSyncDebounced();

  return record;
}

/**
 * Update a record
 * @param {string} table
 * @param {string} id
 * @param {Object} updates
 * @returns {Object|null} The updated record
 */
export function update(table, id, updates) {
  const existing = storage.getById(table, id);
  if (!existing) return null;

  const now = nowISO();
  const updated = {
    ...existing,
    ...updates,
    updated_at: now,
  };

  // Write to localStorage
  storage.upsert(table, updated);

  // Queue for Supabase sync
  storage.addToSyncQueue({
    table,
    op: 'update',
    data: updated,
  });

  scheduleSyncDebounced();

  return updated;
}

/**
 * Delete a record
 * @param {string} table
 * @param {string} id
 */
export function remove(table, id) {
  const existing = storage.getById(table, id);
  if (!existing) return;

  // Remove from localStorage
  storage.removeById(table, id);

  // Queue for Supabase sync
  storage.addToSyncQueue({
    table,
    op: 'delete',
    data: { id, user_id: existing.user_id },
  });

  scheduleSyncDebounced();
}

/**
 * Upsert a record (insert or update by ID)
 * @param {string} table
 * @param {Object} data - Must have an `id` field
 * @returns {Object}
 */
export function upsert(table, data) {
  const existing = storage.getById(table, data.id);
  if (existing) {
    return update(table, data.id, data);
  } else {
    return create(table, data);
  }
}

/**
 * Count records in a table matching a filter
 * @param {string} table
 * @param {Function} filter
 * @returns {number}
 */
export function count(table, filter = null) {
  const items = getAll(table, { filter });
  return items.length;
}
