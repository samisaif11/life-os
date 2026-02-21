// ============================================================
// LIFE OS — Animation Utilities
// ============================================================

/**
 * Add animation class, wait for it to finish, then remove it
 * @param {Element} element
 * @param {string} animClass - CSS class name (e.g., 'anim-slide-up')
 * @returns {Promise<void>}
 */
export function animate(element, animClass) {
  return new Promise(resolve => {
    element.classList.add(animClass);
    const handler = () => {
      element.classList.remove(animClass);
      element.removeEventListener('animationend', handler);
      resolve();
    };
    element.addEventListener('animationend', handler);
  });
}

/**
 * Fade in an element
 * @param {Element} element
 * @param {number} duration - ms
 */
export function fadeIn(element, duration = 250) {
  element.style.opacity = '0';
  element.style.transition = `opacity ${duration}ms ease`;
  element.offsetHeight; // force reflow
  element.style.opacity = '1';
}

/**
 * Fade out an element
 * @param {Element} element
 * @param {number} duration - ms
 * @returns {Promise<void>}
 */
export function fadeOut(element, duration = 250) {
  return new Promise(resolve => {
    element.style.transition = `opacity ${duration}ms ease`;
    element.style.opacity = '0';
    setTimeout(() => {
      resolve();
    }, duration);
  });
}

/**
 * Show a floating XP amount from a position
 * @param {number} x
 * @param {number} y
 * @param {number} amount
 */
export function showXpPopup(x, y, amount) {
  const popup = document.createElement('div');
  popup.className = 'xp-popup anim-xp-float';
  popup.textContent = `+${amount.toFixed(2)} XP`;
  popup.style.left = `${x}px`;
  popup.style.top = `${y}px`;
  popup.style.fontSize = '1.1rem';
  document.body.appendChild(popup);

  setTimeout(() => {
    popup.remove();
  }, 1500);
}
