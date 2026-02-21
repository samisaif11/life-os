// ============================================================
// LIFE OS — Progress Bar Component
// ============================================================

/**
 * Create a progress bar element
 * @param {number} percentage - 0 to 100
 * @param {Object} options
 * @param {'sm'|'md'|'lg'} options.size
 * @param {string} options.color - CSS color
 * @param {boolean} options.shimmer - Animate shimmer effect
 * @returns {HTMLElement}
 */
export function createProgressBar(percentage, options = {}) {
  const { size = 'md', color, shimmer = false } = options;
  const clampedPct = Math.max(0, Math.min(100, percentage));

  const bar = document.createElement('div');
  bar.className = `progress-bar ${size !== 'md' ? `progress-bar-${size}` : ''}`;

  const fill = document.createElement('div');
  fill.className = `progress-bar-fill ${shimmer ? 'shimmer' : ''}`;
  fill.style.width = `${clampedPct}%`;

  if (color) {
    fill.style.background = `linear-gradient(90deg, ${color}, ${lightenColor(color, 20)})`;
  }

  bar.appendChild(fill);
  return bar;
}

/**
 * Update an existing progress bar's fill
 * @param {HTMLElement} barElement
 * @param {number} percentage
 */
export function updateProgressBar(barElement, percentage) {
  const fill = barElement.querySelector('.progress-bar-fill');
  if (fill) {
    fill.style.width = `${Math.max(0, Math.min(100, percentage))}%`;
  }
}

function lightenColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + Math.round(255 * percent / 100));
  const g = Math.min(255, ((num >> 8) & 0x00ff) + Math.round(255 * percent / 100));
  const b = Math.min(255, (num & 0x0000ff) + Math.round(255 * percent / 100));
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}
