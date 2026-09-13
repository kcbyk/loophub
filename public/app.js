// State Store
let allLoops = [];
let filteredLoops = [];
let currentIndex = -1;
let isLooping = true; // Loops default to looping mode for music production!

// DOM References
const loopsGrid = document.getElementById('loopsGrid');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const categoryTabs = document.getElementById('categoryTabs');
const bpmSortSelect = document.getElementById('bpmSortSelect');
const filterStatusText = document.getElementById('filterStatusText');
const totalCountBadge = document.getElementById('totalCountBadge');
const toast = document.getElementById('toast');

// Player DOM
const coreAudio = document.getElementById('coreAudio');
const mainPlayBtn = document.getElementById('mainPlayBtn');
const playIcon = document.getElementById('playIcon');
const pauseIcon = document.getElementById('pauseIcon');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const loopToggleBtn = document.getElementById('loopToggleBtn');
const dockTrackTitle = document.getElementById('dockTrackTitle');
const dockBpm = document.getElementById('dockBpm');
const dockKey = document.getElementById('dockKey');
const dockCategory = document.getElementById('dockCategory');
const dockDownloadBtn = document.getElementById('dockDownloadBtn');
const playerCoverIcon = document.getElementById('playerCoverIcon');

// Progress & Volume
const progressBarBg = document.getElementById('progressBarBg');
const progressFill = document.getElementById('progressFill');
const progressHandle = document.getElementById('progressHandle');
const currentTimeLabel = document.getElementById('currentTimeLabel');
const durationLabel = document.getElementById('durationLabel');
const volumeSlider = document.getElementById('volumeSlider');
const muteBtn = document.getElementById('muteBtn');

// Category icons
const categoryIcons = {
  'Acoustic Guitar': '🎸',
  'Electric Guitar': '🔥',
  'Bass & 808': '🔊',
  'Drums & Percussion': '🥁',
  'Keys & Synths': '🎹',
  'Vocals': '🎤',
  'FX & Atmos': '✨',
  'default': '🎵'
};

/**
 * Format bytes to readable string
 */
function formatBytes(bytes) {
  if (!bytes) return '0 KB';
  return (bytes / 1024).toFixed(0) + ' KB';
}

/**
 * Format seconds to MM:SS
 */
function formatTime(sec) {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

/**
 * Show temporary toast message
 */
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2400);
}

/**
 * Load Catalog Data
 */
async function loadCatalog() {
  try {
    const res = await fetch('/data/catalog.json');
    if (!res.ok) throw new Error('Catalog file not found');
    allLoops = await res.json();
    filteredLoops = [...allLoops];

    updateCategoryCounts();
    renderGrid(filteredLoops);
    totalCountBadge.textContent = `${allLoops.length} Loop`;

  } catch (err) {
    console.error('Error loading catalog:', err);
    loopsGrid.innerHTML = `
      <div class="empty-state">
        <p>⚠️ Loop arşivi yüklenirken hata oluştu: ${err.message}</p>
      </div>
    `;
  }
}

/**
 * Update category badges with accurate counts
 */
function updateCategoryCounts() {
  const counts = {
    all: allLoops.length,
    'Acoustic Guitar': 0,
    'Electric Guitar': 0,
    'Bass & 808': 0,
    'Drums & Percussion': 0,
    'Keys & Synths': 0,
    'Vocals': 0,
    'FX & Atmos': 0
  };

  allLoops.forEach(l => {
    if (counts[l.category] !== undefined) {
      counts[l.category]++;
    }
  });

  document.getElementById('count-all').textContent = counts.all;
  document.getElementById('count-acoustic').textContent = counts['Acoustic Guitar'];
  document.getElementById('count-electric').textContent = counts['Electric Guitar'];
  document.getElementById('count-bass').textContent = counts['Bass & 808'];
  document.getElementById('count-drums').textContent = counts['Drums & Percussion'];
  document.getElementById('count-keys').textContent = counts['Keys & Synths'];
  document.getElementById('count-vocals').textContent = counts['Vocals'];
  document.getElementById('count-fx').textContent = counts['FX & Atmos'];
}

/**
 * Render Audio Grid
 */
function renderGrid(loops) {
  if (!loops || loops.length === 0) {
    loopsGrid.innerHTML = `
      <div class="empty-state">
        <p style="font-size: 1.1rem; margin-bottom: 8px;">🔍 Eşleşen loop bulunamadı</p>
        <p style="font-size: 0.85rem; color: var(--text-muted);">Arama terimini değiştirin veya kategori filtresini temizleyin.</p>
      </div>
    `;
    return;
  }

  loopsGrid.innerHTML = loops.map((loop, idx) => {
    const isCurrent = currentIndex !== -1 && filteredLoops[currentIndex] && filteredLoops[currentIndex].id === loop.id;
    const isPlaying = isCurrent && !coreAudio.paused;
    const icon = categoryIcons[loop.category] || categoryIcons.default;

    return `
      <article class="loop-card ${isPlaying ? 'is-playing' : ''}" id="card-${loop.id}" data-id="${loop.id}">
        <div class="card-top">
          <button class="card-play-btn" onclick="togglePlayByIndex(${idx})" title="Çal">
            ${isPlaying ? `
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
              </svg>
            ` : `
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <polygon points="6 3 20 12 6 21 6 3"></polygon>
              </svg>
            `}
          </button>
          <div class="card-details">
            <h3 class="card-title" title="${escapeHtml(loop.title)}">${escapeHtml(loop.title)}</h3>
            <span class="card-category-tag">
              <span>${icon}</span>
              <span>${escapeHtml(loop.category)}</span>
            </span>
          </div>
        </div>

        <div class="card-tags">
          <span class="tag-bpm">${loop.bpm} BPM</span>
          <span class="tag-key">${loop.key}</span>
          <span class="tag-format">${loop.format}</span>
        </div>

        <div class="card-bottom">
          <span class="card-filesize">${formatBytes(loop.fileSize)}</span>
          <div class="card-actions-group">
            <button class="card-action-btn" onclick="copyLoopLink('${encodeURIComponent(loop.url)}')" title="Bağlantıyı Kopyala">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
              </svg>
              <span>Paylaş</span>
            </button>
            <a href="${loop.url}" download="${loop.filename}" class="card-action-btn" title="İndir">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>İndir</span>
            </a>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

/**
 * Filter & Sort Orchestrator
 */
function applyFilters() {
  const activeCatBtn = categoryTabs.querySelector('.cat-pill.active');
  const cat = activeCatBtn ? activeCatBtn.dataset.cat : 'all';
  const query = (searchInput.value || '').trim().toLowerCase();
  const sortMode = bpmSortSelect.value;

  filteredLoops = allLoops.filter(loop => {
    const matchesCat = cat === 'all' || loop.category === cat;
    const matchesQuery = !query ||
      loop.title.toLowerCase().includes(query) ||
      loop.key.toLowerCase().includes(query) ||
      String(loop.bpm).includes(query) ||
      loop.category.toLowerCase().includes(query);

    return matchesCat && matchesQuery;
  });

  // Sort
  if (sortMode === 'bpm-asc') {
    filteredLoops.sort((a, b) => a.bpm - b.bpm);
  } else if (sortMode === 'bpm-desc') {
    filteredLoops.sort((a, b) => b.bpm - a.bpm);
  } else if (sortMode === 'title') {
    filteredLoops.sort((a, b) => a.title.localeCompare(b.title));
  }

  // Update filter status text
  const catName = activeCatBtn ? activeCatBtn.querySelector('.cat-label').textContent : 'Tüm Looplar';
  filterStatusText.textContent = `${catName} (${filteredLoops.length} parça)`;

  renderGrid(filteredLoops);
}

/**
 * Playback Controls
 */
function playTrack(index) {
  if (index < 0 || index >= filteredLoops.length) return;

  currentIndex = index;
  const loop = filteredLoops[currentIndex];

  coreAudio.src = loop.url;
  coreAudio.loop = isLooping;
  coreAudio.play().then(() => {
    updatePlayerUI(loop, true);
  }).catch(e => {
    console.warn('Playback error:', e);
  });
}

function togglePlayByIndex(index) {
  if (currentIndex === index && !coreAudio.paused) {
    coreAudio.pause();
    updatePlayerUI(filteredLoops[currentIndex], false);
  } else {
    playTrack(index);
  }
}

function updatePlayerUI(loop, isPlaying) {
  if (isPlaying) {
    playIcon.classList.add('hidden');
    pauseIcon.classList.remove('hidden');
  } else {
    playIcon.classList.remove('hidden');
    pauseIcon.classList.add('hidden');
  }

  if (loop) {
    dockTrackTitle.textContent = loop.title;
    dockBpm.textContent = `${loop.bpm} BPM`;
    dockKey.textContent = loop.key;
    dockCategory.textContent = loop.category;
    dockDownloadBtn.href = loop.url;
    dockDownloadBtn.download = loop.filename;
    playerCoverIcon.textContent = categoryIcons[loop.category] || '🎵';
  }

  // Refresh grid cards to reflect active state
  renderGrid(filteredLoops);
}

function copyLoopLink(url) {
  const fullUrl = window.location.origin + decodeURIComponent(url);
  navigator.clipboard.writeText(fullUrl).then(() => {
    showToast('🔗 Bağlantı panoya kopyalandı!');
  }).catch(() => {
    showToast('Dosya bağlantısı: ' + fullUrl);
  });
}

/**
 * Setup Event Listeners
 */
function setupEvents() {
  // Category tabs click
  categoryTabs.addEventListener('click', (e) => {
    const pill = e.target.closest('.cat-pill');
    if (!pill) return;
    categoryTabs.querySelectorAll('.cat-pill').forEach(b => b.classList.remove('active'));
    pill.classList.add('active');
    applyFilters();
  });

  // Search input
  let searchTimeout;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(applyFilters, 180);
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    applyFilters();
    searchInput.focus();
  });

  // Sort select
  bpmSortSelect.addEventListener('change', applyFilters);

  // Core Audio events
  coreAudio.addEventListener('timeupdate', () => {
    if (!coreAudio.duration) return;
    const progress = (coreAudio.currentTime / coreAudio.duration) * 100;
    progressFill.style.width = `${progress}%`;
    progressHandle.style.left = `${progress}%`;
    currentTimeLabel.textContent = formatTime(coreAudio.currentTime);
  });

  coreAudio.addEventListener('loadedmetadata', () => {
    durationLabel.textContent = formatTime(coreAudio.duration);
  });

  coreAudio.addEventListener('ended', () => {
    if (!isLooping) {
      if (currentIndex < filteredLoops.length - 1) {
        playTrack(currentIndex + 1);
      } else {
        updatePlayerUI(filteredLoops[currentIndex], false);
      }
    }
  });

  // Main Play button
  mainPlayBtn.addEventListener('click', () => {
    if (currentIndex === -1 && filteredLoops.length > 0) {
      playTrack(0);
      return;
    }
    if (coreAudio.paused) {
      coreAudio.play();
      updatePlayerUI(filteredLoops[currentIndex], true);
    } else {
      coreAudio.pause();
      updatePlayerUI(filteredLoops[currentIndex], false);
    }
  });

  // Prev / Next
  prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) playTrack(currentIndex - 1);
  });

  nextBtn.addEventListener('click', () => {
    if (currentIndex < filteredLoops.length - 1) playTrack(currentIndex + 1);
  });

  // Loop toggle
  loopToggleBtn.addEventListener('click', () => {
    isLooping = !isLooping;
    coreAudio.loop = isLooping;
    loopToggleBtn.classList.toggle('active', isLooping);
    showToast(isLooping ? '🔁 Sonsuz Döngü Açık' : '➡️ Tek Çalma Modu');
  });

  // Scrubber click
  progressBarBg.addEventListener('click', (e) => {
    if (!coreAudio.duration) return;
    const rect = progressBarBg.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    coreAudio.currentTime = pos * coreAudio.duration;
  });

  // Volume
  volumeSlider.addEventListener('input', (e) => {
    coreAudio.volume = parseFloat(e.target.value);
  });

  muteBtn.addEventListener('click', () => {
    coreAudio.muted = !coreAudio.muted;
    showToast(coreAudio.muted ? '🔇 Sessiz' : '🔊 Ses Açık');
  });

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    if (['input', 'textarea'].includes(document.activeElement.tagName.toLowerCase())) {
      if (e.key === 'Escape') {
        searchInput.value = '';
        applyFilters();
        searchInput.blur();
      }
      return;
    }

    if (e.code === 'Space') {
      e.preventDefault();
      mainPlayBtn.click();
    } else if (e.code === 'ArrowRight') {
      nextBtn.click();
    } else if (e.code === 'ArrowLeft') {
      prevBtn.click();
    } else if (e.key === 'l' || e.key === 'L') {
      loopToggleBtn.click();
    }
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Initialize
setupEvents();
loadCatalog();
