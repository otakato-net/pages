const STORAGE_KEY = 'quick-bookmarks/data';

const DEFAULT_BOOKMARKS = [
  // REF: https://whats.new/shortcuts/
  { name: 'Open new GitHub gists', url: 'https://gist.new' },
  { name: 'Create and share new editor functions using Google App Script', url: 'https://script.new' },
  { name: 'Create a flowchart diagram to map processes', url: 'https://diagram.new' },
  { name: 'Create and send a new Google Calendar invite', url: 'https://cal.new' },
  { name: 'Create a new document using Google Docs', url: 'https://docs.new' },
  { name: 'Create a new form using Google Forms', url: 'https://form.new' },
  { name: 'Create a new note using Google Keep', url: 'https://keep.new' },
  { name: 'Launch a real-time meeting from your browser using Google Meet', url: 'https://meet.new' },
  { name: 'Create a new spreadsheet using Google Sheets', url: 'https://sheets.new' },
  { name: 'Create an online presentation using Google Slides', url: 'https://slide.new' },
  { name: 'Collaborate with your team using Notion\'s all-in-one online workspace', url: 'https://notion.new' },
];

let bookmarks = loadBookmarks();
let selectedIndex = 0;
let filteredBookmarks = [];

function loadBookmarks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return [...DEFAULT_BOOKMARKS];
}

function saveBookmarks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
}

function faviconUrl(url) {
  try {
    const origin = new URL(url).origin;
    return `${origin}/favicon.ico`;
  } catch {
    return '';
  }
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

const itemCache = new Map();

function render() {
  const query = searchBox.value.toLowerCase().trim();
  filteredBookmarks = bookmarks.filter(b =>
    b.name.toLowerCase().includes(query) || b.url.toLowerCase().includes(query)
  );

  if (selectedIndex >= filteredBookmarks.length) {
    selectedIndex = Math.max(0, filteredBookmarks.length - 1);
  }

  const activeUrls = new Set(filteredBookmarks.map(b => b.url));

  // Remove cached items that are no longer in bookmarks at all
  for (const [url] of itemCache) {
    if (!bookmarks.some(b => b.url === url)) {
      itemCache.delete(url);
    }
  }

  // Build new list, reusing existing DOM nodes
  const fragment = document.createDocumentFragment();
  filteredBookmarks.forEach((b, i) => {
    let li = itemCache.get(b.url);
    if (!li) {
      li = document.createElement('li');
      const img = document.createElement('img');
      img.className = 'favicon';
      img.src = faviconUrl(b.url);
      img.alt = '';
      img.referrerPolicy = 'no-referrer';
      const title = document.createElement('span');
      title.className = 'title';
      title.textContent = b.name;
      const url = document.createElement('span');
      url.className = 'url';
      url.textContent = b.url;
      const actions = document.createElement('span');
      actions.className = 'item-actions';
      const up = document.createElement('button');
      up.className = 'move-btn move-up';
      up.textContent = '\u25b2';
      up.title = 'Move up';
      const down = document.createElement('button');
      down.className = 'move-btn move-down';
      down.textContent = '\u25bc';
      down.title = 'Move down';
      const del = document.createElement('button');
      del.className = 'delete-btn';
      del.textContent = '\u00d7';
      del.title = 'Remove';
      actions.append(up, down, del);
      li.append(img, title, url, actions);
      itemCache.set(b.url, li);
    }
    li.dataset.index = i;
    li.classList.toggle('selected', i === selectedIndex);
    fragment.appendChild(li);
  });

  list.replaceChildren(fragment);
  list.classList.toggle('searching', query.length > 0);
}

function openSelected() {
  const bm = filteredBookmarks[selectedIndex];
  if (bm) window.open(bm.url, '_blank');
}

function scrollToSelected() {
  const sel = list.querySelector('.selected');
  if (sel) sel.scrollIntoView({ block: 'nearest' });
}

// Elements
const searchBox = document.getElementById('search-box');
const list = document.getElementById('bookmark-list');
const modal = document.getElementById('modal');
const modalName = document.getElementById('modal-name');
const modalUrl = document.getElementById('modal-url');

// Search
searchBox.addEventListener('input', () => {
  selectedIndex = 0;
  render();
});

// Keyboard navigation (global)
document.addEventListener('keydown', (e) => {
  if (document.querySelector('.modal-overlay.open')) return;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    selectedIndex = Math.min(selectedIndex + 1, filteredBookmarks.length - 1);
    render();
    scrollToSelected();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    selectedIndex = Math.max(selectedIndex - 1, 0);
    render();
    scrollToSelected();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    openSelected();
  } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && document.activeElement !== searchBox) {
    searchBox.focus();
  }
});

// Click to open / delete / reorder
list.addEventListener('click', (e) => {
  const li = e.target.closest('li');
  if (!li) return;
  const idx = parseInt(li.dataset.index, 10);
  const bm = filteredBookmarks[idx];

  if (e.target.closest('.move-up')) {
    const bmIdx = bookmarks.indexOf(bm);
    if (bmIdx > 0) {
      [bookmarks[bmIdx - 1], bookmarks[bmIdx]] = [bookmarks[bmIdx], bookmarks[bmIdx - 1]];
      saveBookmarks();
      itemCache.clear();
      render();
    }
    return;
  }
  if (e.target.closest('.move-down')) {
    const bmIdx = bookmarks.indexOf(bm);
    if (bmIdx < bookmarks.length - 1) {
      [bookmarks[bmIdx], bookmarks[bmIdx + 1]] = [bookmarks[bmIdx + 1], bookmarks[bmIdx]];
      saveBookmarks();
      itemCache.clear();
      render();
    }
    return;
  }
  if (e.target.closest('.delete-btn')) {
    if (bm) {
      bookmarks.splice(bookmarks.indexOf(bm), 1);
      saveBookmarks();
      render();
    }
    return;
  }
  selectedIndex = idx;
  openSelected();
});

// Add button
document.getElementById('btn-add').addEventListener('click', () => {
  modalName.value = '';
  modalUrl.value = '';
  document.getElementById('modal-title').textContent = 'Add Bookmark';
  modal.classList.add('open');
  modalName.focus();
});

// Reset button
const resetModal = document.getElementById('reset-modal');

document.getElementById('btn-reset').addEventListener('click', () => {
  resetModal.classList.add('open');
  document.getElementById('reset-cancel').focus();
});

document.getElementById('reset-cancel').addEventListener('click', () => {
  resetModal.classList.remove('open');
  searchBox.focus();
});

document.getElementById('reset-confirm').addEventListener('click', () => {
  bookmarks = [...DEFAULT_BOOKMARKS];
  saveBookmarks();
  selectedIndex = 0;
  resetModal.classList.remove('open');
  render();
  searchBox.focus();
});

resetModal.addEventListener('keydown', (e) => {
  e.stopPropagation();
  if (e.key === 'Escape') {
    resetModal.classList.remove('open');
    searchBox.focus();
  }
});

// Modal
document.getElementById('modal-cancel').addEventListener('click', () => {
  modal.classList.remove('open');
  searchBox.focus();
});

document.getElementById('modal-save').addEventListener('click', () => {
  const name = modalName.value.trim();
  const url = modalUrl.value.trim();
  if (!name || !url) return;
  bookmarks.push({ name, url: url.startsWith('http') ? url : 'https://' + url });
  saveBookmarks();
  modal.classList.remove('open');
  searchBox.value = '';
  selectedIndex = bookmarks.length - 1;
  render();
  searchBox.focus();
});

modal.addEventListener('keydown', (e) => {
  e.stopPropagation();
  if (e.key === 'Escape') {
    modal.classList.remove('open');
    searchBox.focus();
  }
  if (e.key === 'Enter') {
    document.getElementById('modal-save').click();
  }
});

// Data modal (Export / Import)
const dataModal = document.getElementById('data-modal');
const dataTextarea = document.getElementById('data-textarea');
const dataCopy = document.getElementById('data-copy');
const dataConfirm = document.getElementById('data-confirm');
const dataTitle = document.getElementById('data-modal-title');

document.getElementById('btn-export').addEventListener('click', () => {
  dataTitle.textContent = 'Export';
  dataTextarea.value = JSON.stringify(bookmarks, null, 2);
  dataTextarea.readOnly = true;
  dataCopy.style.display = '';
  dataConfirm.style.display = 'none';
  dataModal.classList.add('open');
  dataTextarea.focus();
  dataTextarea.select();
});

document.getElementById('btn-import').addEventListener('click', () => {
  dataTitle.textContent = 'Import';
  dataTextarea.value = '';
  dataTextarea.readOnly = false;
  dataCopy.style.display = 'none';
  dataConfirm.style.display = '';
  dataModal.classList.add('open');
  dataTextarea.focus();
});

dataCopy.addEventListener('click', () => {
  navigator.clipboard.writeText(dataTextarea.value).then(() => {
    dataCopy.textContent = 'Copied!';
    setTimeout(() => { dataCopy.textContent = 'Copy'; }, 1500);
  });
});

document.getElementById('data-cancel').addEventListener('click', () => {
  dataModal.classList.remove('open');
  searchBox.focus();
});

dataConfirm.addEventListener('click', () => {
  try {
    const parsed = JSON.parse(dataTextarea.value);
    if (!Array.isArray(parsed)) throw new Error('not array');
    bookmarks = parsed;
    saveBookmarks();
    itemCache.clear();
    selectedIndex = 0;
    dataModal.classList.remove('open');
    render();
    searchBox.focus();
  } catch {
    dataTextarea.style.outline = '2px solid #e55';
    setTimeout(() => { dataTextarea.style.outline = ''; }, 1000);
  }
});

dataModal.addEventListener('keydown', (e) => {
  e.stopPropagation();
  if (e.key === 'Escape') {
    dataModal.classList.remove('open');
    searchBox.focus();
  }
});

// Init
render();
searchBox.focus();
