// ============================================================
// LIFE OS — Modal Component
// ============================================================

import { $ } from '../utils/dom.js';

let isOpen = false;

/**
 * Open a modal dialog
 * @param {Object} options
 * @param {string} options.title
 * @param {string|Function} options.body - HTML string or function(container)
 * @param {Array} options.buttons - [{ label, className, onClick }]
 */
export function openModal({ title, body, buttons = [] }) {
  const overlay = $('#modal-overlay');
  const modalTitle = $('#modal-title');
  const modalBody = $('#modal-body');
  const modalFooter = $('#modal-footer');
  const closeBtn = $('#modal-close');

  if (!overlay) return;

  // Set title
  modalTitle.textContent = title;

  // Set body
  if (typeof body === 'function') {
    modalBody.innerHTML = '';
    body(modalBody);
  } else {
    modalBody.innerHTML = body;
  }

  // Set buttons
  modalFooter.innerHTML = '';
  if (buttons.length > 0) {
    modalFooter.style.display = '';
    buttons.forEach(btn => {
      const button = document.createElement('button');
      button.className = btn.className || 'btn btn-secondary';
      button.textContent = btn.label;
      button.addEventListener('click', () => {
        if (btn.onClick) btn.onClick();
      });
      modalFooter.appendChild(button);
    });
  } else {
    modalFooter.style.display = 'none';
  }

  // Show modal
  overlay.classList.add('active');
  isOpen = true;

  // Close handlers
  closeBtn.onclick = closeModal;
  overlay.onclick = (e) => {
    if (e.target === overlay) closeModal();
  };

  // Escape key
  document.addEventListener('keydown', handleEscape);
}

/**
 * Close the modal
 */
export function closeModal() {
  const overlay = $('#modal-overlay');
  if (!overlay) return;

  overlay.classList.remove('active');
  isOpen = false;
  document.removeEventListener('keydown', handleEscape);
}

function handleEscape(e) {
  if (e.key === 'Escape') closeModal();
}

/**
 * Check if modal is currently open
 * @returns {boolean}
 */
export function isModalOpen() {
  return isOpen;
}
