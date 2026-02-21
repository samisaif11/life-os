// ============================================================
// LIFE OS — Groceries View
// ============================================================

import * as db from '../services/db.js';
import { GROCERY_CATEGORIES } from '../config.js';
import { $ } from '../utils/dom.js';
import { createGroceryItem } from '../components/grocery-item.js';
import { showToast } from '../components/toast.js';
import { renderNav } from '../components/nav.js';
import { nowISO } from '../utils/date.js';

/**
 * Render the groceries view
 * @param {HTMLElement} container
 */
export async function render(container) {
  renderNav();

  container.innerHTML = `
    <div class="section-header">
      <h2>🛒 Groceries</h2>
    </div>

    <!-- Quick Add -->
    <div class="grocery-add">
      <input class="form-input" type="text" id="grocery-input" placeholder="Add item..." autofocus>
      <select class="form-select" id="grocery-priority" style="width:80px">
        <option value="1">P1</option>
        <option value="2">P2</option>
        <option value="3" selected>P3</option>
        <option value="4">P4</option>
        <option value="5">P5</option>
      </select>
      <select class="form-select" id="grocery-category" style="width:120px">
        ${GROCERY_CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
      </select>
      <button class="btn btn-primary" id="grocery-add-btn">Add</button>
    </div>

    <!-- Active Items -->
    <div class="groceries-section">
      <div class="groceries-section-title">To Buy</div>
      <div id="grocery-active-list" class="groceries-list"></div>
    </div>

    <!-- Bought Items (collapsible) -->
    <div class="groceries-section">
      <div class="groceries-section-header" id="bought-toggle">
        <span class="groceries-section-title">Bought</span>
        <span class="groceries-count" id="bought-count">0</span>
      </div>
      <div id="grocery-bought-list" class="groceries-list hidden"></div>
    </div>

    <!-- Clear Bought -->
    <div id="clear-bought-container" class="hidden" style="margin-top:var(--space-md)">
      <button class="btn btn-danger btn-sm" id="clear-bought-btn">Clear Bought Items</button>
    </div>
  `;

  // Add item
  const input = $('#grocery-input', container);
  const addBtn = $('#grocery-add-btn', container);

  const addItem = () => {
    const item = input.value.trim();
    if (!item) return;

    const priority = parseInt($('#grocery-priority', container).value);
    const category = $('#grocery-category', container).value;

    db.create('groceries', {
      item,
      priority,
      category,
      is_bought: false,
    });

    input.value = '';
    input.focus();
    showToast('Item added!', 'success');
    renderList(container);
  };

  addBtn.addEventListener('click', addItem);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addItem();
  });

  // Toggle bought section
  const boughtToggle = $('#bought-toggle', container);
  const boughtList = $('#grocery-bought-list', container);
  boughtToggle.addEventListener('click', () => {
    boughtList.classList.toggle('hidden');
  });

  // Clear bought
  const clearBtn = $('#clear-bought-btn', container);
  clearBtn.addEventListener('click', () => {
    const bought = db.getAll('groceries', { filter: g => g.is_bought });
    bought.forEach(g => db.remove('groceries', g.id));
    showToast('Bought items cleared.', 'info');
    renderList(container);
  });

  renderList(container);
}

function renderList(container) {
  const activeList = $('#grocery-active-list', container);
  const boughtList = $('#grocery-bought-list', container);
  const boughtCount = $('#bought-count', container);
  const clearContainer = $('#clear-bought-container', container);

  // Get items
  const active = db.getAll('groceries', {
    filter: g => !g.is_bought,
    sort: { field: 'priority', direction: 'asc' },
  });

  const bought = db.getAll('groceries', {
    filter: g => g.is_bought,
    sort: { field: 'bought_at', direction: 'desc' },
  });

  // Render active
  activeList.innerHTML = '';
  if (active.length === 0) {
    activeList.innerHTML = '<div class="empty-state" style="padding:var(--space-lg)"><p class="text-muted">No items to buy.</p></div>';
  } else {
    active.forEach(grocery => {
      activeList.appendChild(createGroceryItem(grocery, {
        onToggleBought: (g) => toggleBought(g, container),
        onDelete: (g) => deleteItem(g, container),
      }));
    });
  }

  // Render bought
  boughtList.innerHTML = '';
  bought.forEach(grocery => {
    boughtList.appendChild(createGroceryItem(grocery, {
      onToggleBought: (g) => toggleBought(g, container),
      onDelete: (g) => deleteItem(g, container),
    }));
  });

  boughtCount.textContent = bought.length;
  clearContainer.classList.toggle('hidden', bought.length === 0);
}

function toggleBought(grocery, container) {
  db.update('groceries', grocery.id, {
    is_bought: !grocery.is_bought,
    bought_at: !grocery.is_bought ? nowISO() : null,
  });
  renderList(container);
}

function deleteItem(grocery, container) {
  db.remove('groceries', grocery.id);
  renderList(container);
}
