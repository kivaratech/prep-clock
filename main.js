import './style.css'
import { nanoid } from 'nanoid'

// --- Constants ---
const FIXED_CATEGORIES = ['Tasks', 'Secondary Shelf Life'];

const ALERTS = {
  alert1: { label: 'Alert 1', path: '/alert1.wav' },
  alert2: { label: 'Alert 2', path: '/alert2.mp3' },
  alert3: { label: 'Alert 3', path: '/alert3.mp3' },
};

const audioCache = {};

const DEFAULT_ITEMS = [
  { name: 'Travel Path', duration: 60, hasSide2: false, category: 'Tasks' },
  { name: 'Hand Wash', duration: 60, hasSide2: false, category: 'Tasks' },
  { name: 'Onions Slivered', duration: 30, hasSide2: false, category: 'Secondary Shelf Life' },
  { name: 'Tomato', duration: 240, hasSide2: false, category: 'Secondary Shelf Life' },
  { name: 'Shredded Chz', duration: 240, hasSide2: false, category: 'Secondary Shelf Life' },
  { name: 'Lettuce - Shred', duration: 240, hasSide2: false, category: 'Secondary Shelf Life' },
  { name: 'Utensil Wash', duration: 240, hasSide2: false, category: 'Tasks' },
  { name: 'Crinkle Pickles', duration: 240, hasSide2: false, category: 'Secondary Shelf Life' },
  { name: 'Bacon', duration: 240, hasSide2: false, category: 'Secondary Shelf Life' },
  { name: 'Butter', duration: 240, hasSide2: false, category: 'Secondary Shelf Life' },
  { name: 'Pickle', duration: 720, hasSide2: false, category: 'Secondary Shelf Life' },
  { name: 'Towel Bucket', duration: 240, hasSide2: false, category: 'Tasks' },
  { name: 'Onions Shaker', duration: 240, hasSide2: false, category: 'Secondary Shelf Life' },
].map(item => ({
  ...item,
  id: nanoid(),
  side1: { remainingMs: item.duration * 60000, isRunning: false },
  side2: { remainingMs: item.duration * 60000, isRunning: false },
  alert: null
}));

// --- State ---
let state;
try {
  state = JSON.parse(localStorage.getItem('timer_state'));
} catch (e) {
  state = null;
}

if (!state || !state.items || state.items.length === 0) {
  state = {
    items: DEFAULT_ITEMS,
    categories: FIXED_CATEGORIES,
    warningThreshold: 5,
    defaultAlert: 'alert1'
  };
  localStorage.setItem('timer_state', JSON.stringify(state));
} else {
  // Handle background timer: calculate elapsed time and update running timers
  const lastSaveTime = state.lastSaveTime || Date.now();
  const elapsedMs = Date.now() - lastSaveTime;

  state.categories = FIXED_CATEGORIES;
  if (state.warningThreshold === 15) state.warningThreshold = 5;
  state.items.forEach(item => {
    if (item.category === 'TASKS') item.category = 'Tasks';
    if (!FIXED_CATEGORIES.includes(item.category)) item.category = FIXED_CATEGORIES[0];
    if (item.hasSide2 === undefined) item.hasSide2 = false;
    if (item.side1 === undefined) {
      item.side1 = {
        remainingMs: item.remainingMs !== undefined ? item.remainingMs : item.duration * 60000,
        isRunning: item.isRunning !== undefined ? item.isRunning : false
      };
      delete item.remainingMs;
      delete item.isRunning;
      delete item.startTime;
    }
    if (item.side2 === undefined) {
      item.side2 = { remainingMs: item.duration * 60000, isRunning: false };
    }
    if (item.side1.isRunning) {
      item.side1.remainingMs -= elapsedMs;
      if (item.side1.remainingMs < 0) item.side1.remainingMs = 0;
    }
    if (item.side2 && item.side2.isRunning) {
      item.side2.remainingMs -= elapsedMs;
      if (item.side2.remainingMs < 0) item.side2.remainingMs = 0;
    }
    if (item.alert === undefined) item.alert = null;
  });
  if (state.defaultAlert === undefined) state.defaultAlert = 'alert1';
}

function saveState() {
  state.lastSaveTime = Date.now();
  try {
    localStorage.setItem('timer_state', JSON.stringify(state));
  } catch (e) {}
}

// --- DOM Elements ---
const grid = document.getElementById('timer-grid');
const adminScreen = document.getElementById('admin-screen');
const adminToggle = document.getElementById('admin-toggle');
const adminClose = document.getElementById('admin-close');
const itemForm = document.getElementById('item-form');
const itemsUl = document.getElementById('items-ul');
const categorySelect = document.getElementById('item-category');
const themeSelect = document.getElementById('theme-select');
const side2OptionWrapper = document.getElementById('side2-option-wrapper');
const bulkSide2OnBtn = document.getElementById('btn-bulk-side2-on');
const bulkSide2OffBtn = document.getElementById('btn-bulk-side2-off');
const defaultAlertSelect = document.getElementById('default-alert-select');
const testAlertBtn = document.getElementById('test-alert-btn');

if (defaultAlertSelect) {
  defaultAlertSelect.addEventListener('change', (e) => {
    state.defaultAlert = e.target.value;
    saveState();
  });
}

if (testAlertBtn) {
  testAlertBtn.addEventListener('click', () => {
    playAlert(defaultAlertSelect.value, 3);
  });
}

if (bulkSide2OnBtn) {
  bulkSide2OnBtn.addEventListener('click', () => {
    if (confirm('Enable Side 2 for ALL Secondary Shelf Life items?')) {
      state.items.forEach(item => {
        if (item.category === 'Secondary Shelf Life') item.hasSide2 = true;
      });
      saveState(); renderGrid();
      adminScreen.classList.add('hidden');
    }
  });
}

if (bulkSide2OffBtn) {
  bulkSide2OffBtn.addEventListener('click', () => {
    if (confirm('Disable Side 2 for ALL Secondary Shelf Life items?')) {
      state.items.forEach(item => {
        if (item.category === 'Secondary Shelf Life') item.hasSide2 = false;
      });
      saveState(); renderGrid();
      adminScreen.classList.add('hidden');
    }
  });
}

function updateSide2Visibility(category, wrapper) {
  if (!wrapper) return;
  if (category === 'Secondary Shelf Life') {
    wrapper.classList.remove('hidden');
  } else {
    wrapper.classList.add('hidden');
  }
}

if (categorySelect) {
  categorySelect.addEventListener('change', (e) => {
    updateSide2Visibility(e.target.value, side2OptionWrapper);
  });
}

// --- Theme ---
function applyTheme(theme, persist = true) {
  document.documentElement.setAttribute('data-theme', theme);
  state.theme = theme;
  if (persist) saveState();
}

if (themeSelect) {
  themeSelect.addEventListener('change', (e) => applyTheme(e.target.value));
}

if (state.theme) {
  applyTheme(state.theme, false);
  if (themeSelect) themeSelect.value = state.theme;
} else {
  state.theme = 'dark';
}

// --- Timer Logic ---
function formatTime(ms) {
  if (ms <= 0) return { main: '00:00', sub: ':00', expired: true };
  const totalSeconds = Math.ceil(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  if (h > 0) {
    return {
      main: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
      sub: `:${String(s).padStart(2, '0')}`,
      expired: false
    };
  }
  return {
    main: `${String(m).padStart(2, '0')}`,
    sub: `${String(s).padStart(2, '0')}`,
    expired: false
  };
}

function getSideStateClass(side, durationMs) {
  if (side.remainingMs <= 0) return 'state-expired';
  if (side.isRunning) {
    return side.remainingMs <= state.warningThreshold * 60000 ? 'state-warning' : 'state-running';
  }
  if (side.remainingMs < durationMs) return 'state-paused';
  return 'state-ready';
}

function getSideStatusText(side, durationMs) {
  if (side.remainingMs <= 0) return 'EXPIRED';
  if (side.isRunning) return 'RUNNING';
  if (side.remainingMs < durationMs) return 'PAUSED';
  return 'READY';
}

let lastUpdateTime = Date.now();

// Advance timer state only — no DOM work
function tickState() {
  const now = Date.now();
  const delta = now - lastUpdateTime;
  lastUpdateTime = now;

  let anyExpired = false;
  state.items.forEach(item => {
    [item.side1, item.side2].forEach(side => {
      if (side.isRunning && side.remainingMs > 0) {
        side.remainingMs -= delta;
        if (side.remainingMs <= 0) {
          side.remainingMs = 0;
          side.isRunning = false;
          playAlert(item.alert);
          anyExpired = true;
        }
      }
    });
  });
  return anyExpired;
}

function sortCategoryItems(items) {
  return [...items].sort((a, b) => {
    const getMinRemaining = (item) => {
      let min = item.side1.remainingMs;
      if (item.hasSide2) min = Math.min(min, item.side2.remainingMs);
      return min;
    };
    const isAnyActive = (item) => {
      const d = item.duration * 60000;
      let active = item.side1.isRunning || item.side1.remainingMs < d;
      if (item.hasSide2) active = active || item.side2.isRunning || item.side2.remainingMs < d;
      return active;
    };
    const aActive = isAnyActive(a);
    const bActive = isAnyActive(b);
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    if (!aActive && !bActive) return a.name.localeCompare(b.name);
    return getMinRemaining(a) - getMinRemaining(b);
  });
}

function computeGridSortKey() {
  return FIXED_CATEGORIES.flatMap(cat => {
    const catItems = state.items.filter(i => i.category === cat);
    return sortCategoryItems(catItems).map(i => i.id);
  }).join(',');
}

let gridSortKey = '';

function fitLayout() {
  requestAnimationFrame(() => {
    if (!grid) return;
    const catHeaderEls = grid.querySelectorAll('.category-header');

    // grid is flex:1 so clientHeight is exactly the space below the header
    const availableH = grid.clientHeight;
    const vW = window.innerWidth;

    let catH = 0;
    catHeaderEls.forEach(el => { catH += el.offsetHeight + 2; });

    const catData = FIXED_CATEGORIES
      .map(cat => {
        const items = state.items.filter(i => i.category === cat);
        return { count: items.length, side2: items.filter(i => i.hasSide2).length };
      })
      .filter(c => c.count > 0);

    if (!catData.length) return;

    const TILE_GAP = 4;
    const GRID_PAD = 8;
    const BUFFER = 8;

    const totalItems = catData.reduce((s, c) => s + c.count, 0);
    const totalSide2 = catData.reduce((s, c) => s + c.side2, 0);
    const totalSingle = totalItems - totalSide2;

    // side-2 tiles span 2 columns so consume 2 slots each
    const catRows = (c, cols) => Math.ceil((c.side2 * 2 + (c.count - c.side2)) / cols);

    let bestCols = 1, bestScore = -1;

    for (let cols = 1; cols <= totalItems * 2; cols++) {
      const rows = catData.reduce((s, c) => s + catRows(c, cols), 0);
      const rowGaps = (rows - catData.length) * TILE_GAP;
      const colGaps = (cols - 1) * TILE_GAP;
      const tileH = (availableH - catH - GRID_PAD - rowGaps - BUFFER) / rows;
      const tileW = (vW - GRID_PAD - colGaps) / cols;
      if (tileH <= 0 || tileW <= 0) continue;

      // side-2 tiles span 2 cols so each timer-container gets one col width
      const singleScore = Math.min(0.9 * (tileW - 12), tileH - 58);
      const side2Score  = Math.min(0.9 * (tileW - 10), tileH - 58);
      const score = totalItems > 0
        ? (totalSingle * singleScore + totalSide2 * side2Score) / totalItems
        : singleScore;

      if (score > bestScore) { bestScore = score; bestCols = cols; }
    }

    const totalRows = catData.reduce((s, c) => s + catRows(c, bestCols), 0);
    const rowGaps = (totalRows - catData.length) * TILE_GAP;
    const tileH = Math.floor((availableH - catH - GRID_PAD - rowGaps - BUFFER) / totalRows);

    document.documentElement.style.setProperty('--grid-cols', String(bestCols));
    document.documentElement.style.setProperty('--tile-height', `${tileH}px`);
  });
}

// Full DOM rebuild — called when structure changes (sort order, item added/deleted, timer expired)
function renderGrid() {
  if (!grid) return;
  gridSortKey = computeGridSortKey();
  grid.innerHTML = '';

  FIXED_CATEGORIES.forEach(cat => {
    const catItems = state.items.filter(i => i.category === cat);
    if (catItems.length === 0) return;

    const section = document.createElement('section');
    section.className = 'category-section';
    section.innerHTML = `<h2 class="category-header">${cat}</h2><div class="category-grid"></div>`;
    const catGrid = section.querySelector('.category-grid');

    sortCategoryItems(catItems).forEach(item => {
      const durationMs = item.duration * 60000;
      const tile = document.createElement('div');
      tile.className = `tile ${item.hasSide2 ? 'has-side2' : ''}`;
      tile.dataset.itemId = item.id;

      const createTimerHtml = (side, label) => {
        const stateClass = getSideStateClass(side, durationMs);
        const progress = Math.max(0, (side.remainingMs / durationMs) * 100);
        const timeData = formatTime(side.remainingMs);
        const statusText = getSideStatusText(side, durationMs);
        return `
          <div class="timer-container ${stateClass}">
            <div class="side-label">${label}</div>
            <div class="tile-visual">
              <svg viewBox="0 0 100 100">
                <circle class="bg" cx="50" cy="50" r="45"></circle>
                <circle class="progress" cx="50" cy="50" r="45" style="stroke-dasharray: 283; stroke-dashoffset: ${283 - (progress * 2.83)}"></circle>
              </svg>
              <div class="time-display"><span class="main">${timeData.main}</span><span class="sub">${timeData.sub}</span></div>
            </div>
            <div class="status-indicator"><span class="dot"></span>${statusText}</div>
          </div>`;
      };

      tile.innerHTML = `<div class="timer-wrapper">${createTimerHtml(item.side1, 'Side 1')}${item.hasSide2 ? createTimerHtml(item.side2, 'Side 2') : ''}</div><div class="tile-info"><div class="item-name">${item.name.toUpperCase()}</div><div class="tap-hint">Tap timer to start/reset</div></div>`;

      const timerContainers = tile.querySelectorAll('.timer-container');
      timerContainers[0].addEventListener('click', (e) => {
        e.stopPropagation();
        handleSideClick(item.side1, durationMs);
        saveState();
        renderGrid();
      });
      if (timerContainers[1]) {
        timerContainers[1].addEventListener('click', (e) => {
          e.stopPropagation();
          handleSideClick(item.side2, durationMs);
          saveState();
          renderGrid();
        });
      }
      catGrid.appendChild(tile);
    });
    grid.appendChild(section);
  });
  fitLayout();
}

// Lightweight per-second update — only touches text and classes, no DOM rebuild
function updateDisplays() {
  if (!grid) return;
  state.items.forEach(item => {
    const tile = grid.querySelector(`[data-item-id="${item.id}"]`);
    if (!tile) return;
    const durationMs = item.duration * 60000;
    const containers = tile.querySelectorAll('.timer-container');
    updateSideDisplay(containers[0], item.side1, durationMs);
    if (item.hasSide2 && containers[1]) {
      updateSideDisplay(containers[1], item.side2, durationMs);
    }
  });
}

function updateSideDisplay(container, side, durationMs) {
  container.className = `timer-container ${getSideStateClass(side, durationMs)}`;

  const progress = Math.max(0, (side.remainingMs / durationMs) * 100);
  container.querySelector('circle.progress').style.strokeDashoffset = 283 - (progress * 2.83);

  const timeData = formatTime(side.remainingMs);
  container.querySelector('.main').textContent = timeData.main;
  container.querySelector('.sub').textContent = timeData.sub;

  container.querySelector('.status-indicator').innerHTML =
    `<span class="dot"></span>${getSideStatusText(side, durationMs)}`;
}

function handleSideClick(side, durationMs) {
  if (side.remainingMs <= 0 || side.isRunning) {
    side.remainingMs = durationMs;
    side.isRunning = false;
    stopAllAlerts();
  } else {
    side.isRunning = true;
  }
}

// --- Audio ---
let activeAlertAudio = null;
let testAlertAudio = null;

async function preloadAudioFiles() {
  for (const [key, { path }] of Object.entries(ALERTS)) {
    if (!audioCache[key]) {
      try {
        const response = await Promise.race([
          fetch(path),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
        ]);
        if (response.ok) {
          const blob = await response.blob();
          audioCache[key] = URL.createObjectURL(blob);
        } else {
          audioCache[key] = path;
        }
      } catch (e) {
        audioCache[key] = path;
      }
    }
  }
}

function configureAudioLoop(audio, loopCount) {
  if (loopCount) {
    let playCount = 0;
    audio.loop = false;
    audio.addEventListener('ended', () => {
      playCount++;
      if (playCount < loopCount) {
        audio.currentTime = 0;
        audio.play().catch(() => {});
      }
    });
  } else {
    audio.loop = true;
  }
}

function playAlert(alertKey, loopCount) {
  if (!alertKey) alertKey = state.defaultAlert;
  const soundPath = audioCache[alertKey] || ALERTS[alertKey]?.path;
  if (!soundPath) return;

  try {
    if (loopCount) {
      // Test alert: always create fresh instance
      if (testAlertAudio) testAlertAudio.pause();
      const audio = new Audio(soundPath);
      configureAudioLoop(audio, loopCount);
      audio.play().catch((error) => {
        if (error.name === 'NotAllowedError') {
          document.addEventListener('click', () => {
            const retryAudio = new Audio(soundPath);
            configureAudioLoop(retryAudio, loopCount);
            retryAudio.play().catch(() => {});
            testAlertAudio = retryAudio;
          }, { once: true });
        }
      });
      testAlertAudio = audio;
    } else {
      // Timer expiry: restart existing alert instead of stacking
      if (activeAlertAudio) {
        activeAlertAudio.currentTime = 0;
        return;
      }
      const audio = new Audio(soundPath);
      configureAudioLoop(audio, loopCount);
      audio.addEventListener('ended', () => { activeAlertAudio = null; });
      audio.play().catch((error) => {
        if (error.name === 'NotAllowedError') {
          document.addEventListener('click', () => {
            const retryAudio = new Audio(soundPath);
            configureAudioLoop(retryAudio, loopCount);
            retryAudio.addEventListener('ended', () => { activeAlertAudio = null; });
            retryAudio.play().catch(() => {});
            activeAlertAudio = retryAudio;
          }, { once: true });
        }
      });
      activeAlertAudio = audio;
    }
  } catch (e) {}
}

function stopAllAlerts() {
  if (activeAlertAudio) {
    activeAlertAudio.pause();
    activeAlertAudio.currentTime = 0;
    activeAlertAudio = null;
  }
}

// --- Admin ---
function populateCategorySelect() {
  if (!categorySelect) return;
  categorySelect.innerHTML = '';
  const sortedForSelect = [...state.categories].sort((a, b) => {
    if (a === 'Secondary Shelf Life') return -1;
    if (b === 'Secondary Shelf Life') return 1;
    return 0;
  });
  sortedForSelect.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });
  updateSide2Visibility(categorySelect.value, side2OptionWrapper);
}

function renderAdminItems() {
  if (!itemsUl) return;
  itemsUl.innerHTML = '';
  const sortedItems = [...state.items].sort((a, b) => a.name.localeCompare(b.name));
  sortedItems.forEach(item => {
    const li = document.createElement('li');
    li.className = 'admin-item-row';
    li.dataset.id = item.id;
    const h = Math.floor(item.duration / 60);
    const m = item.duration % 60;
    const isSecondary = item.category === 'Secondary Shelf Life';

    li.innerHTML = `
      <div class="admin-item-display">
        <span>${item.name} (${h > 0 ? h + 'h ' : ''}${m}m) [${item.category}]</span>
        <div class="item-actions">
          <button class="btn-edit" data-id="${item.id}">Edit</button>
          <button class="btn-delete" data-id="${item.id}">Delete</button>
        </div>
      </div>
      <div class="inline-edit-form hidden" id="edit-form-${item.id}">
        <form class="inline-form">
          <input type="text" class="edit-name" value="${item.name}" required />
          <div class="duration-inputs">
            <div class="input-group">
              <label>Hr</label>
              <input type="number" class="edit-hours" value="${h}" min="0" />
            </div>
            <div class="input-group">
              <label>Min</label>
              <input type="number" class="edit-minutes" value="${m}" min="0" required />
            </div>
          </div>
          <select class="edit-category" required data-item-id="${item.id}"></select>
          <label class="checkbox-label ${isSecondary ? '' : 'hidden'}" id="edit-side2-wrapper-${item.id}">
            <input type="checkbox" class="edit-side2" ${item.hasSide2 ? 'checked' : ''} /> Side 2
          </label>
          <label for="edit-alert-${item.id}">Alert Sound</label>
          <select class="edit-alert" id="edit-alert-${item.id}">
            <option value="">Default (${ALERTS[state.defaultAlert].label})</option>
            ${Object.entries(ALERTS).map(([key, { label }]) =>
              `<option value="${key}" ${item.alert === key ? 'selected' : ''}>${label}</option>`
            ).join('')}
          </select>
          <div class="inline-form-actions">
            <button type="submit" class="btn-save">Save</button>
            <button type="button" class="btn-cancel">Cancel</button>
          </div>
        </form>
      </div>
    `;
    itemsUl.appendChild(li);
  });
}

// --- Event Listeners ---
preloadAudioFiles();

if (adminToggle) {
  adminToggle.addEventListener('click', () => {
    adminScreen.classList.remove('hidden');
    populateCategorySelect();
    renderAdminItems();
    if (themeSelect) themeSelect.value = state.theme || 'dark';
    if (defaultAlertSelect) defaultAlertSelect.value = state.defaultAlert || 'alert1';
  });
}

if (adminClose) adminClose.addEventListener('click', () => {
  adminScreen.classList.add('hidden');
  if (testAlertAudio) {
    testAlertAudio.pause();
    testAlertAudio = null;
  }
});

if (itemsUl) {
  itemsUl.addEventListener('click', (e) => {
    const id = e.target.dataset.id;
    if (e.target.classList.contains('btn-delete')) {
      const item = state.items.find(i => i.id === id);
      if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
        state.items = state.items.filter(item => item.id !== id);
        saveState();
        renderAdminItems();
        renderGrid();
      }
    } else if (e.target.classList.contains('btn-edit')) {
      const formContainer = document.getElementById(`edit-form-${id}`);
      const isHidden = formContainer.classList.contains('hidden');
      document.querySelectorAll('.inline-edit-form').forEach(f => f.classList.add('hidden'));
      if (isHidden) {
        formContainer.classList.remove('hidden');
        const select = formContainer.querySelector('.edit-category');
        select.innerHTML = '';
        state.categories.forEach(cat => {
          const opt = document.createElement('option');
          opt.value = cat;
          opt.textContent = cat;
          if (cat === state.items.find(i => i.id === id).category) opt.selected = true;
          select.appendChild(opt);
        });
      }
    } else if (e.target.classList.contains('btn-cancel')) {
      e.target.closest('.inline-edit-form').classList.add('hidden');
    } else if (e.target.classList.contains('edit-category')) {
      const itemId = e.target.dataset.itemId;
      const wrapper = document.getElementById(`edit-side2-wrapper-${itemId}`);
      updateSide2Visibility(e.target.value, wrapper);
    }
  });

  itemsUl.addEventListener('submit', (e) => {
    if (e.target.classList.contains('inline-form')) {
      e.preventDefault();
      const li = e.target.closest('.admin-item-row');
      const id = li.dataset.id;
      const item = state.items.find(i => i.id === id);
      item.name = e.target.querySelector('.edit-name').value;
      const hours = parseInt(e.target.querySelector('.edit-hours').value) || 0;
      const minutes = parseInt(e.target.querySelector('.edit-minutes').value) || 0;
      const duration = (hours * 60) + minutes;
      let errorEl = e.target.querySelector('.inline-duration-error');
      if (!errorEl) {
        errorEl = document.createElement('p');
        errorEl.className = 'form-error inline-duration-error';
        e.target.querySelector('.inline-form-actions').before(errorEl);
      }
      if (duration === 0) { errorEl.textContent = 'Duration must be greater than 0.'; return; }
      errorEl.textContent = '';
      item.duration = duration;
      item.category = e.target.querySelector('.edit-category').value;
      item.hasSide2 = item.category === 'Secondary Shelf Life' && e.target.querySelector('.edit-side2').checked;
      item.alert = e.target.querySelector('.edit-alert').value || null;
      if (!item.side1.isRunning) item.side1.remainingMs = item.duration * 60000;
      if (!item.side2.isRunning) item.side2.remainingMs = item.duration * 60000;
      saveState(); renderAdminItems(); renderGrid();
    }
  });
}

if (itemForm) {
  itemForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-id').value;
    const name = document.getElementById('item-name').value;
    const hours = parseInt(document.getElementById('item-hours').value) || 0;
    const minutes = parseInt(document.getElementById('item-minutes').value) || 0;
    const duration = (hours * 60) + minutes;
    const durationError = document.getElementById('duration-error');
    if (duration === 0) {
      durationError.classList.remove('hidden');
      return;
    }
    durationError.classList.add('hidden');
    const category = document.getElementById('item-category').value;
    const hasSide2 = category === 'Secondary Shelf Life' && document.getElementById('item-has-side2').checked;

    if (id) {
      const item = state.items.find(item => item.id === id);
      if (item) {
        item.name = name;
        item.duration = duration;
        item.hasSide2 = hasSide2;
        item.category = category;
        if (!item.side1.isRunning) item.side1.remainingMs = duration * 60000;
        if (!item.side2.isRunning) item.side2.remainingMs = duration * 60000;
      }
    } else {
      state.items.push({
        id: nanoid(), name, duration, hasSide2, category, alert: null,
        side1: { remainingMs: duration * 60000, isRunning: false },
        side2: { remainingMs: duration * 60000, isRunning: false }
      });
      const timerAdded = document.getElementById('timer-added');
      timerAdded.classList.remove('hidden');
      clearTimeout(timerAdded._hideTimeout);
      timerAdded._hideTimeout = setTimeout(() => timerAdded.classList.add('hidden'), 3000);
    }
    saveState(); renderAdminItems(); renderGrid(); itemForm.reset();
    document.getElementById('edit-id').value = '';
    document.getElementById('item-minutes').value = '0';
    document.getElementById('item-hours').value = '0';
    updateSide2Visibility(categorySelect.value, side2OptionWrapper);
  });
}

setInterval(() => {
  const anyExpired = tickState();
  const newSortKey = computeGridSortKey();
  if (anyExpired || newSortKey !== gridSortKey) {
    renderGrid();
  } else {
    updateDisplays();
  }
}, 1000);

renderGrid();

window.addEventListener('resize', fitLayout);
if (window.visualViewport) window.visualViewport.addEventListener('resize', fitLayout);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
