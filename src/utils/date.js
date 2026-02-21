// ============================================================
// LIFE OS — Date Utilities
// ============================================================

/**
 * Format a date as "Feb 21, 2026"
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a date as "Feb 21"
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDateShort(date) {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a datetime as "Feb 21, 2:30 PM"
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDateTime(date) {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Get "time ago" string
 * @param {string|Date} date
 * @returns {string}
 */
export function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return formatDateShort(date);
}

/**
 * Get countdown string to a future date
 * @param {string|Date} targetDate
 * @returns {{ text: string, urgency: 'urgent'|'soon'|'normal', totalMs: number }}
 */
export function countdown(targetDate) {
  const target = new Date(targetDate).getTime();
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) {
    return { text: 'Passed', urgency: 'urgent', totalMs: 0 };
  }

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);

  let text;
  if (days > 0) {
    text = `${days}d ${hours}h`;
  } else if (hours > 0) {
    text = `${hours}h ${minutes}m`;
  } else {
    text = `${minutes}m`;
  }

  let urgency = 'normal';
  if (diff < 86400000) urgency = 'urgent';       // < 24h
  else if (diff < 172800000) urgency = 'urgent';  // < 2 days
  else if (diff < 604800000) urgency = 'soon';    // < 7 days

  return { text, urgency, totalMs: diff };
}

/**
 * Check if a date is today
 * @param {string|Date} date
 * @returns {boolean}
 */
export function isToday(date) {
  const d = new Date(date);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

/**
 * Get today's date as YYYY-MM-DD
 * @returns {string}
 */
export function todayISO() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get an ISO timestamp
 * @returns {string}
 */
export function nowISO() {
  return new Date().toISOString();
}
