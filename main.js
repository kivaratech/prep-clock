import './style.css'
import { nanoid } from 'nanoid'

// --- State Management ---
const DEFAULT_ITEMS = [
  { name: 'Travel Path', duration: 60 },
  { name: 'Hand Wash', duration: 60 },
  { name: 'Onions Slivered', duration: 30 },
  { name: 'Tomato', duration: 240 },
  { name: 'Shredded Chz', duration: 240 },
  { name: 'Lettuce - Shred', duration: 240 },
  { name: 'Utensil Wash', duration: 240 },
  { name: 'Crinkle Pickles', duration: 240 },
  { name: 'Bacon', duration: 240 },
  { name: 'Butter', duration: 240 },
  { name: 'Pickle', duration: 720 },
  { name: 'Towel Bucket', duration: 240 },
  { name: 'Onions Shaker', duration: 240 },
].map(item => ({ ...item, id: nanoid(), startTime: null }));

let state = JSON.parse(localStorage.getItem('timer_state'));

if (!state || !state.items || state.items.length === 0) {
  state = {
    items: DEFAULT_ITEMS,
    warningThreshold: 15
  };
  localStorage.setItem('timer_state', JSON.stringify(state));
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
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  
  const main = h > 0 
    ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  
  const sub = `:${String(s).padStart(2, '0')}`;
  
  return { main, sub, expired: false };
}

function updateTimers() {
  const now = Date.now();
  if (!grid) return;
  grid.innerHTML = '';
  
  state.items.forEach(item => {
    let remainingMs = 0;
    let stateClass = 'state-ready';
    let progress = 100;
    
    if (item.startTime) {
      const elapsedMs = now - item.startTime;
      const durationMs = item.duration * 60000;
      remainingMs = durationMs - elapsedMs;
      progress = Math.max(0, (remainingMs / durationMs) * 100);
      
      if (remainingMs <= 0) {
        stateClass = 'state-expired';
      } else if (remainingMs <= state.warningThreshold * 60000) {
        stateClass = 'state-warning';
      } else {
        stateClass = 'state-running';
      }
    }

    const timeData = item.startTime 
      ? formatTime(remainingMs) 
      : { main: String(item.duration).padStart(2, '0') + ':00', sub: ':00', expired: false };
    
    const tile = document.createElement('div');
    tile.className = `tile ${stateClass}`;
    tile.innerHTML = `
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
      <div class="tile-info">
        <div class="item-name">${item.name.toUpperCase()}</div>
        <div class="status-indicator">
          <span class="dot"></span>
          ${item.startTime ? (remainingMs <= 0 ? 'EXPIRED' : 'RUNNING') : 'READY'}
        </div>
        <div class="tap-hint">${item.startTime ? 'Tap to restart' : 'Tap to start'}</div>
      </div>
    `;
    
    tile.addEventListener('click', () => {
      item.startTime = Date.now();
      saveState();
      updateTimers();
    });
    
    grid.appendChild(tile);
  });
}

// --- Admin Functions ---
function renderAdminItems() {
  if (!itemsUl) return;
  itemsUl.innerHTML = '';
  state.items.forEach(item => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${item.name} (${item.duration}m)</span>
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

    if (id) {
      const item = state.items.find(item => item.id === id);
      if (item) {
        item.name = name;
        item.duration = duration;
      }
    } else {
      state.items.push({
        id: nanoid(),
        name,
        duration,
        startTime: null
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
