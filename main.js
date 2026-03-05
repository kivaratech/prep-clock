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
].map(item => ({ ...item, id: nanoid(), startTime: Date.now() }));

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
  if (ms <= 0) return 'EXPIRED';
  const totalMin = Math.ceil(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${m}m`;
}

function updateTimers() {
  const now = Date.now();
  grid.innerHTML = '';
  
  state.items.forEach(item => {
    const elapsedMs = now - item.startTime;
    const durationMs = item.duration * 60000;
    const remainingMs = durationMs - elapsedMs;
    
    let stateClass = 'state-normal';
    if (remainingMs <= 0) {
      stateClass = 'state-expired';
    } else if (remainingMs <= state.warningThreshold * 60000) {
      stateClass = 'state-warning';
    }

    const tile = document.createElement('div');
    tile.className = `tile ${stateClass}`;
    tile.innerHTML = `
      <div class="tile-name">${item.name}</div>
      <div class="tile-time">${formatTime(remainingMs)}</div>
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
adminToggle.addEventListener('click', () => {
  adminScreen.classList.remove('hidden');
  renderAdminItems();
  warningInput.value = state.warningThreshold;
});

adminClose.addEventListener('click', () => {
  adminScreen.classList.add('hidden');
});

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
      startTime: Date.now()
    });
  }
  
  saveState();
  renderAdminItems();
  updateTimers();
  itemForm.reset();
  document.getElementById('edit-id').value = '';
});

warningInput.addEventListener('change', () => {
  state.warningThreshold = parseInt(warningInput.value) || 15;
  saveState();
  updateTimers();
});

// --- Initialization ---
setInterval(updateTimers, 1000);
updateTimers();
