import './style.css'
import { nanoid } from 'nanoid'

// --- State Management ---
const DEFAULT_ITEMS = [
  { name: 'Travel Path', duration: 60, hasSide2: false },
  { name: 'Hand Wash', duration: 60, hasSide2: false },
  { name: 'Onions Slivered', duration: 30, hasSide2: false },
  { name: 'Tomato', duration: 240, hasSide2: false },
  { name: 'Shredded Chz', duration: 240, hasSide2: false },
  { name: 'Lettuce - Shred', duration: 240, hasSide2: false },
  { name: 'Utensil Wash', duration: 240, hasSide2: false },
  { name: 'Crinkle Pickles', duration: 240, hasSide2: false },
  { name: 'Bacon', duration: 240, hasSide2: false },
  { name: 'Butter', duration: 240, hasSide2: false },
  { name: 'Pickle', duration: 720, hasSide2: false },
  { name: 'Towel Bucket', duration: 240, hasSide2: false },
  { name: 'Onions Shaker', duration: 240, hasSide2: false },
].map(item => ({ 
  ...item, 
  id: nanoid(), 
  side1: { remainingMs: item.duration * 60000, isRunning: false },
  side2: { remainingMs: item.duration * 60000, isRunning: false }
}));

let state = JSON.parse(localStorage.getItem('timer_state'));

if (!state || !state.items || state.items.length === 0) {
  state = {
    items: DEFAULT_ITEMS,
    warningThreshold: 15
  };
  localStorage.setItem('timer_state', JSON.stringify(state));
} else {
  // Migration for old state
  state.items.forEach(item => {
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
  });
}

function saveState() {
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

// --- Timer Logic ---
function formatTime(ms) {
  if (ms <= 0) return { main: '00:00', sub: ':00', expired: true };
  const totalSeconds = Math.ceil(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  
  const main = h > 0 
    ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  
  const sub = `:${String(s).padStart(2, '0')}`;
  
  return { main, sub, expired: false };
}

let lastUpdateTime = Date.now();

function updateTimers() {
  const now = Date.now();
  const delta = now - lastUpdateTime;
  lastUpdateTime = now;

  if (!grid) return;
  
  // Update internal state
  state.items.forEach(item => {
    [item.side1, item.side2].forEach(side => {
      if (side.isRunning && side.remainingMs > 0) {
        side.remainingMs -= delta;
        if (side.remainingMs < 0) side.remainingMs = 0;
      }
    });
  });

  // Sort items
  const sortedItems = [...state.items].sort((a, b) => {
    const aDuration = a.duration * 60000;
    const bDuration = b.duration * 60000;
    
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

    if (!aActive && !bActive) {
      return a.name.localeCompare(b.name);
    }

    return getMinRemaining(a) - getMinRemaining(b);
  });

  grid.innerHTML = '';
  
  sortedItems.forEach(item => {
    const durationMs = item.duration * 60000;
    
    const tile = document.createElement('div');
    tile.className = `tile ${item.hasSide2 ? 'has-side2' : ''}`;
    
    const createTimerHtml = (side, label) => {
      let stateClass = 'state-ready';
      const progress = Math.max(0, (side.remainingMs / durationMs) * 100);
      
      if (side.remainingMs <= 0) {
        stateClass = 'state-expired';
      } else if (side.isRunning) {
        if (side.remainingMs <= state.warningThreshold * 60000) {
          stateClass = 'state-warning';
        } else {
          stateClass = 'state-running';
        }
      } else if (side.remainingMs < durationMs) {
        stateClass = 'state-paused';
      }

      const timeData = formatTime(side.remainingMs);
      return `
        <div class="timer-container ${stateClass}">
          <div class="side-label">${label}</div>
          <div class="tile-visual">
            <svg viewBox="0 0 100 100">
              <circle class="bg" cx="50" cy="50" r="45"></circle>
              <circle class="progress" cx="50" cy="50" r="45" 
                style="stroke-dasharray: 283; stroke-dashoffset: ${283 - (progress * 2.83)}">
              </circle>
            </svg>
            <div class="time-display">
              <span class="main">${timeData.main}</span>
              <span class="sub">${timeData.sub}</span>
            </div>
          </div>
          <div class="status-indicator">
            <span class="dot"></span>
            ${side.remainingMs <= 0 ? 'EXPIRED' : (side.isRunning ? 'RUNNING' : (side.remainingMs < durationMs ? 'PAUSED' : 'READY'))}
          </div>
        </div>
      `;
    };

    tile.innerHTML = `
      <div class="timer-wrapper">
        ${createTimerHtml(item.side1, 'Side 1')}
        ${item.hasSide2 ? createTimerHtml(item.side2, 'Side 2') : ''}
      </div>
      <div class="tile-info">
        <div class="item-name">${item.name.toUpperCase()}</div>
        <div class="tap-hint">Tap timer to start/reset</div>
      </div>
    `;
    
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
    
    grid.appendChild(tile);
  });
}

function handleSideClick(side, durationMs) {
  if (side.remainingMs <= 0 || side.isRunning) {
    side.remainingMs = durationMs;
    side.isRunning = false;
  } else {
    side.isRunning = true;
  }
}

// --- Admin Functions ---
function renderAdminItems() {
  if (!itemsUl) return;
  itemsUl.innerHTML = '';
  state.items.forEach(item => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${item.name} (${item.duration}m)${item.hasSide2 ? ' [Side 2]' : ''}</span>
      <div class="item-actions">
        <button class="btn-edit" data-id="${item.id}">Edit</button>
        <button class="btn-delete" data-id="${item.id}">Delete</button>
      </div>
    `;
    itemsUl.appendChild(li);
  });
}

// --- Event Listeners ---
if (adminToggle) {
  adminToggle.addEventListener('click', () => {
    adminScreen.classList.remove('hidden');
    renderAdminItems();
    warningInput.value = state.warningThreshold;
  });
}

if (adminClose) {
  adminClose.addEventListener('click', () => {
    adminScreen.classList.add('hidden');
  });
}

if (itemsUl) {
  itemsUl.addEventListener('click', (e) => {
    const id = e.target.dataset.id;
    if (e.target.classList.contains('btn-delete')) {
      state.items = state.items.filter(item => item.id !== id);
      saveState();
      renderAdminItems();
      updateTimers();
    } else if (e.target.classList.contains('btn-edit')) {
      const item = state.items.find(item => item.id === id);
      if (item) {
        document.getElementById('edit-id').value = item.id;
        document.getElementById('item-name').value = item.name;
        document.getElementById('item-duration').value = item.duration;
        document.getElementById('item-has-side2').checked = item.hasSide2;
      }
    }
  });
}

if (itemForm) {
  itemForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-id').value;
    const name = document.getElementById('item-name').value;
    const duration = parseInt(document.getElementById('item-duration').value);
    const hasSide2 = document.getElementById('item-has-side2').checked;

    if (id) {
      const item = state.items.find(item => item.id === id);
      if (item) {
        item.name = name;
        item.duration = duration;
        item.hasSide2 = hasSide2;
        if (!item.side1.isRunning) item.side1.remainingMs = duration * 60000;
        if (!item.side2.isRunning) item.side2.remainingMs = duration * 60000;
      }
    } else {
      state.items.push({
        id: nanoid(),
        name,
        duration,
        hasSide2,
        side1: { remainingMs: duration * 60000, isRunning: false },
        side2: { remainingMs: duration * 60000, isRunning: false }
      });
    }
    
    saveState();
    renderAdminItems();
    updateTimers();
    itemForm.reset();
    document.getElementById('edit-id').value = '';
  });
}

if (warningInput) {
  warningInput.addEventListener('change', () => {
    state.warningThreshold = parseInt(warningInput.value) || 15;
    saveState();
    updateTimers();
  });
}

// --- Initialization ---
setInterval(updateTimers, 1000);
updateTimers();
