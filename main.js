import './style.css'
import { nanoid } from 'nanoid'

// --- State Management ---
const FIXED_CATEGORIES = ['Tasks', 'Secondary Shelf Life'];

const ALERT_OPTIONS = {
  'alert1': 'Alert 1',
  'alert2': 'Alert 2',
  'alert3': 'Alert 3'
};

const ALERT_SOUNDS = {
  'alert1': '/alert1.wav',
  'alert2': '/alert2.mp3',
  'alert3': '/alert3.mp3'
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

let state = JSON.parse(localStorage.getItem('timer_state'));

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
    
    // Update timers that were running in the background
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
  localStorage.setItem('timer_state', JSON.stringify(state));
}

// --- DOM Elements ---
const grid = document.getElementById('timer-grid');
const adminScreen = document.getElementById('admin-screen');
const adminToggle = document.getElementById('admin-toggle');
const adminClose = document.getElementById('admin-close');
const itemForm = document.getElementById('item-form');
const itemsUl = document.getElementById('items-ul');
const warningInput = document.getElementById('warning-threshold');
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
    playAlert(defaultAlertSelect.value, 4);
  });
}

if (bulkSide2OnBtn) {
  bulkSide2OnBtn.addEventListener('click', () => {
    if (confirm('Enable Side 2 for ALL Secondary Shelf Life items?')) {
      state.items.forEach(item => {
        if (item.category === 'Secondary Shelf Life') item.hasSide2 = true;
      });
      saveState(); renderAdminItems(); updateTimers();
    }
  });
}

if (bulkSide2OffBtn) {
  bulkSide2OffBtn.addEventListener('click', () => {
    if (confirm('Disable Side 2 for ALL Secondary Shelf Life items?')) {
      state.items.forEach(item => {
        if (item.category === 'Secondary Shelf Life') item.hasSide2 = false;
      });
      saveState(); renderAdminItems(); updateTimers();
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

// --- Theme Management ---
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  state.theme = theme;
  saveState();
}

if (themeSelect) {
  themeSelect.addEventListener('change', (e) => applyTheme(e.target.value));
}

// Initial theme apply
if (state.theme) {
  applyTheme(state.theme);
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
  
  let main, sub;
  if (h > 0) {
    main = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    sub = `:${String(s).padStart(2, '0')}`;
  } else {
    main = `${String(m).padStart(2, '0')}`;
    sub = `${String(s).padStart(2, '0')}`;
  }
  
  return { main, sub, expired: false };
}

let lastUpdateTime = Date.now();

function updateTimers() {
  const now = Date.now();
  const delta = now - lastUpdateTime;
  lastUpdateTime = now;

  if (!grid) return;
  
  state.items.forEach(item => {
    [item.side1, item.side2].forEach(side => {
      if (side.isRunning && side.remainingMs > 0) {
        side.remainingMs -= delta;
        if (side.remainingMs <= 0) {
          side.remainingMs = 0;
          side.isRunning = false;
          playAlert(item.alert);
        }
      }
    });
  });

  grid.innerHTML = '';
  
  const sortedCategories = [...FIXED_CATEGORIES];

  sortedCategories.forEach(cat => {
    const catItems = state.items.filter(i => i.category === cat);
    if (catItems.length === 0) return;

    const section = document.createElement('section');
    section.className = 'category-section';
    section.innerHTML = `<h2 class="category-header">${cat}</h2><div class="category-grid"></div>`;
    const catGrid = section.querySelector('.category-grid');

    const sortedItems = [...catItems].sort((a, b) => {
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

    sortedItems.forEach(item => {
      const durationMs = item.duration * 60000;
      const tile = document.createElement('div');
      tile.className = `tile ${item.hasSide2 ? 'has-side2' : ''}`;
      
      const createTimerHtml = (side, label) => {
        let stateClass = 'state-ready';
        const progress = Math.max(0, (side.remainingMs / durationMs) * 100);
        if (side.remainingMs <= 0) stateClass = 'state-expired';
        else if (side.isRunning) {
          if (side.remainingMs <= state.warningThreshold * 60000) stateClass = 'state-warning';
          else stateClass = 'state-running';
        } else if (side.remainingMs < durationMs) stateClass = 'state-paused';

        const timeData = formatTime(side.remainingMs);
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
            <div class="status-indicator"><span class="dot"></span>${side.remainingMs <= 0 ? 'EXPIRED' : (side.isRunning ? 'RUNNING' : (side.remainingMs < durationMs ? 'PAUSED' : 'READY'))}</div>
          </div>`;
      };

      tile.innerHTML = `<div class="timer-wrapper">${createTimerHtml(item.side1, 'Side 1')}${item.hasSide2 ? createTimerHtml(item.side2, 'Side 2') : ''}</div><div class="tile-info"><div class="item-name">${item.name.toUpperCase()}</div><div class="tap-hint">Tap timer to start/reset</div></div>`;
      
      const timerContainers = tile.querySelectorAll('.timer-container');
      timerContainers[0].addEventListener('click', (e) => {
        e.stopPropagation();
        handleSideClick(item.side1, durationMs);
        saveState();
        updateTimers();
      });
      if (timerContainers[1]) {
        timerContainers[1].addEventListener('click', (e) => {
          e.stopPropagation();
          handleSideClick(item.side2, durationMs);
          saveState();
          updateTimers();
        });
      }
      catGrid.appendChild(tile);
    });
    grid.appendChild(section);
  });
}

function handleSideClick(side, durationMs) {
  if (side.remainingMs <= 0 || side.isRunning) {
    side.remainingMs = durationMs;
    side.isRunning = false;
    stopAllAlerts();
  } else side.isRunning = true;
}

let activeAlerts = [];
let testAlertAudio = null;

async function preloadAudioFiles() {
  for (const [key, path] of Object.entries(ALERT_SOUNDS)) {
    if (!audioCache[key]) {
      try {
        const response = await fetch(path);
        const blob = await response.blob();
        audioCache[key] = URL.createObjectURL(blob);
      } catch (e) {
        audioCache[key] = path;
      }
    }
  }
}

function playAlert(alertKey, loopCount) {
  if (!alertKey) alertKey = state.defaultAlert;
  const soundPath = audioCache[alertKey] || ALERT_SOUNDS[alertKey];
  if (soundPath) {
    try {
      const audio = new Audio(soundPath);
      
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
      
      const playPromise = audio.play();
      if (playPromise && playPromise.catch) {
        playPromise.catch((error) => {
          if (error.name === 'NotAllowedError') {
            document.addEventListener('click', () => {
              const retryAudio = new Audio(soundPath);
              if (loopCount) {
                retryAudio.loop = false;
                let playCount = 0;
                retryAudio.addEventListener('ended', () => {
                  playCount++;
                  if (playCount < loopCount) {
                    retryAudio.currentTime = 0;
                    retryAudio.play().catch(() => {});
                  }
                });
              } else {
                retryAudio.loop = true;
              }
              retryAudio.play().catch(() => {});
            }, { once: true });
          }
        });
      }
      
      if (loopCount) {
        if (testAlertAudio) testAlertAudio.pause();
        testAlertAudio = audio;
      } else {
        activeAlerts.push(audio);
      }
    } catch (e) {}
  }
}

function stopAllAlerts() {
  activeAlerts.forEach(audio => {
    audio.pause();
    audio.currentTime = 0;
  });
  activeAlerts = [];
}

// --- Admin Functions ---
function populateCategorySelect() {
  if (!categorySelect) return;
  categorySelect.innerHTML = '';
  // Sort to make 'Secondary Shelf Life' the first option
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
    const alertOptions = Object.entries(ALERT_OPTIONS).map(([key, label]) => 
      `<option value="${key}" ${item.alert === key ? 'selected' : ''}>Default (${ALERT_OPTIONS[state.defaultAlert]})</option>` +
      (Object.entries(ALERT_OPTIONS).filter(([k]) => k !== Object.keys(ALERT_OPTIONS)[0]).map(([k, l]) => 
        `<option value="${k}" ${item.alert === k ? 'selected' : ''}>${l}</option>`
      ).join(''))
    ).join('').split('</option><option').slice(1).reduce((acc, val, i) => {
      if (i === 0) return `<option value="" ${!item.alert ? 'selected' : ''}>Default (${ALERT_OPTIONS[state.defaultAlert]})</option><option${val}</option>`;
      return acc + `<option${val}</option>`;
    }, '');
    
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
            <option value="">Default (${ALERT_OPTIONS[state.defaultAlert]})</option>
            ${Object.entries(ALERT_OPTIONS).map(([key, label]) => 
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

if (adminClose) adminClose.addEventListener('click', () => adminScreen.classList.add('hidden'));

if (itemsUl) {
  itemsUl.addEventListener('click', (e) => {
    const id = e.target.dataset.id;
    if (e.target.classList.contains('btn-delete')) {
      const item = state.items.find(i => i.id === id);
      if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
        state.items = state.items.filter(item => item.id !== id);
        saveState();
        renderAdminItems();
        updateTimers();
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
      item.duration = (hours * 60) + minutes;
      item.category = e.target.querySelector('.edit-category').value;
      item.hasSide2 = item.category === 'Secondary Shelf Life' && e.target.querySelector('.edit-side2').checked;
      item.alert = e.target.querySelector('.edit-alert').value || null;
      if (!item.side1.isRunning) item.side1.remainingMs = item.duration * 60000;
      if (!item.side2.isRunning) item.side2.remainingMs = item.duration * 60000;
      saveState(); renderAdminItems(); updateTimers();
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
        id: nanoid(), name, duration, hasSide2, category,
        side1: { remainingMs: duration * 60000, isRunning: false },
        side2: { remainingMs: duration * 60000, isRunning: false }
      });
    }
    saveState(); renderAdminItems(); updateTimers(); itemForm.reset();
    document.getElementById('edit-id').value = '';
    document.getElementById('item-minutes').value = '0';
    document.getElementById('item-hours').value = '0';
    updateSide2Visibility(categorySelect.value, side2OptionWrapper);
  });
}

if (warningInput) {
  // Warning threshold is now fixed at 5 minutes
}

setInterval(updateTimers, 1000);
updateTimers();
