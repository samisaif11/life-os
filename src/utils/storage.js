// ============================================================
// LIFE OS — localStorage Wrapper
// ============================================================

const PREFIX = 'lifeos_';

/**
 * Get a value from localStorage
 * @param {string} key
 * @param {*} fallback
 * @returns {*}
 */
export function get(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/**
 * Set a value in localStorage
 * @param {string} key
 * @param {*} value
 */
export function set(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.warn('[Storage] Failed to write:', key, err);
  }
}

/**
 * Remove a key from localStorage
 * @param {string} key
 */
export function remove(key) {
  localStorage.removeItem(PREFIX + key);
}

/**
 * Get all items for a "table" (stored as an array)
 * @param {string} table
 * @returns {Array}
 */
export function getTable(table) {
  return get(table, []);
}

/**
 * Set all items for a "table"
 * @param {string} table
 * @param {Array} items
 */
export function setTable(table, items) {
  set(table, items);
}

/**
 * Get a single item by ID from a table
 * @param {string} table
 * @param {string} id
 * @returns {Object|null}
 */
export function getById(table, id) {
  const items = getTable(table);
  return items.find(item => item.id === id) || null;
}

/**
 * Upsert an item into a table (insert or update by id)
 * @param {string} table
 * @param {Object} item - Must have an `id` field
 * @returns {Object} The upserted item
 */
export function upsert(table, item) {
  const items = getTable(table);
  const index = items.findIndex(i => i.id === item.id);
  if (index >= 0) {
    items[index] = { ...items[index], ...item };
  } else {
    items.push(item);
  }
  setTable(table, items);
  return item;
}

/**
 * Remove an item by ID from a table
 * @param {string} table
 * @param {string} id
 */
export function removeById(table, id) {
  const items = getTable(table).filter(item => item.id !== id);
  setTable(table, items);
}

/**
 * Get the sync queue
 * @returns {Array}
 */
export function getSyncQueue() {
  return get('syncQueue', []);
}

/**
 * Add an operation to the sync queue
 * @param {Object} operation - { table, op, data, timestamp }
 */
export function addToSyncQueue(operation) {
  const queue = getSyncQueue();
  queue.push({
    ...operation,
    timestamp: new Date().toISOString(),
    synced: false,
  });
  set('syncQueue', queue);
}

/**
 * Clear synced items from the queue
 */
export function clearSyncedFromQueue() {
  const queue = getSyncQueue().filter(op => !op.synced);
  set('syncQueue', queue);
}

/**
 * Mark queue items as synced
 * @param {number} count - Number of items to mark from the front
 */
export function markSynced(count) {
  const queue = getSyncQueue();
  for (let i = 0; i < Math.min(count, queue.length); i++) {
    queue[i].synced = true;
  }
  set('syncQueue', queue);
}
