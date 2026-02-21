// ============================================================
// LIFE OS — DOM Utilities
// ============================================================

/**
 * Query a single element
 * @param {string} selector
 * @param {Element} parent
 * @returns {Element|null}
 */
export function $(selector, parent = document) {
  return parent.querySelector(selector);
}

/**
 * Query multiple elements
 * @param {string} selector
 * @param {Element} parent
 * @returns {Element[]}
 */
export function $$(selector, parent = document) {
  return [...parent.querySelectorAll(selector)];
}

/**
 * Create an element with attributes and children
 * @param {string} tag
 * @param {Object} attrs - Attributes and properties
 * @param {...(string|Element)} children
 * @returns {Element}
 */
export function el(tag, attrs = {}, ...children) {
  const element = document.createElement(tag);

  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'dataset') {
      Object.assign(element.dataset, value);
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(element.style, value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      const event = key.slice(2).toLowerCase();
      element.addEventListener(event, value);
    } else if (key === 'innerHTML') {
      element.innerHTML = value;
    } else {
      element.setAttribute(key, value);
    }
  }

  for (const child of children) {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof Node) {
      element.appendChild(child);
    }
  }

  return element;
}

/**
 * Clear all children from an element
 * @param {Element} element
 */
export function clearChildren(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

/**
 * Set innerHTML safely and return the container
 * @param {Element} container
 * @param {string} html
 * @returns {Element}
 */
export function setHTML(container, html) {
  container.innerHTML = html;
  return container;
}

/**
 * Generate a UUID v4
 * @returns {string}
 */
export function uuid() {
  return crypto.randomUUID();
}
