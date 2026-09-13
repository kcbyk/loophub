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

const DEFAULT_STARTER_LOOPS = [
  {
    "id": "loop_3",
    "filename": "ST_Loop_100_Am_1789256176620.ogg",
    "url": "/loops/ST_Loop_100_Am_1789256176620.ogg",
    "title": "Acoustic Soul (100 BPM - Am)",
    "category": "Acoustic Guitar",
    "bpm": 100,
    "key": "Am",
    "fileSize": 387773,
    "format": "OGG"
  },
  {
    "id": "loop_13",
    "filename": "ST_Loop_100_D_1789255974815.ogg",
    "url": "/loops/ST_Loop_100_D_1789255974815.ogg",
    "title": "Campfire Chords (100 BPM - D)",
    "category": "Acoustic Guitar",
    "bpm": 100,
    "key": "D",
    "fileSize": 303636,
    "format": "OGG"
  },
  {
    "id": "loop_18",
    "filename": "ST_Loop_100_Gm_1789255982918.ogg",
    "url": "/loops/ST_Loop_100_Gm_1789255982918.ogg",
    "title": "Golden Hour Fingerstyle (100 BPM - Gm)",
    "category": "Acoustic Guitar",
    "bpm": 100,
    "key": "Gm",
    "fileSize": 667351,
    "format": "OGG"
  },
  {
    "id": "loop_14",
    "filename": "ST_Loop_100_Em_1789255870390.ogg",
    "url": "/loops/ST_Loop_100_Em_1789255870390.ogg",
    "title": "Midnight Riff (100 BPM - Em)",
    "category": "Electric Guitar",
    "bpm": 100,
    "key": "Em",
    "fileSize": 146230,
    "format": "OGG"
  },
  {
    "id": "loop_23",
    "filename": "ST_Loop_104_C_1789256200605.ogg",
    "url": "/loops/ST_Loop_104_C_1789256200605.ogg",
    "title": "Midnight Riff (104 BPM - C)",
    "category": "Electric Guitar",
    "bpm": 104,
    "key": "C",
    "fileSize": 708929,
    "format": "OGG"
  },
  {
    "id": "loop_24",
    "filename": "ST_Loop_104_C_1789256237083.ogg",
    "url": "/loops/ST_Loop_104_C_1789256237083.ogg",
    "title": "Midnight Riff (104 BPM - C)",
    "category": "Electric Guitar",
    "bpm": 104,
    "key": "C",
    "fileSize": 664771,
    "format": "OGG"
  },
  {
    "id": "loop_6",
    "filename": "ST_Loop_100_C_1789255955417.ogg",
    "url": "/loops/ST_Loop_100_C_1789255955417.ogg",
    "title": "Acid Acidline (100 BPM - C)",
    "category": "Bass & 808",
    "bpm": 100,
    "key": "C",
    "fileSize": 412680,
    "format": "OGG"
  },
  {
    "id": "loop_7",
    "filename": "ST_Loop_100_C_1789255958982.ogg",
    "url": "/loops/ST_Loop_100_C_1789255958982.ogg",
    "title": "Vintage Fender Bass (100 BPM - C)",
    "category": "Bass & 808",
    "bpm": 100,
    "key": "C",
    "fileSize": 306123,
    "format": "OGG"
  },
  {
    "id": "loop_10",
    "filename": "ST_Loop_100_C_1789256210331.ogg",
    "url": "/loops/ST_Loop_100_C_1789256210331.ogg",
    "title": "Vintage Fender Bass (100 BPM - C)",
    "category": "Bass & 808",
    "bpm": 100,
    "key": "C",
    "fileSize": 355544,
    "format": "OGG"
  },
  {
    "id": "loop_2",
    "filename": "ST_Loop_100_Am_1789256170619.ogg",
    "url": "/loops/ST_Loop_100_Am_1789256170619.ogg",
    "title": "Punchy Kick & Snare (100 BPM - Am)",
    "category": "Drums & Percussion",
    "bpm": 100,
    "key": "Am",
    "fileSize": 388181,
    "format": "OGG"
  },
  {
    "id": "loop_4",
    "filename": "ST_Loop_100_A_1789255878533.ogg",
    "url": "/loops/ST_Loop_100_A_1789255878533.ogg",
    "title": "Cyber Drill Kit (100 BPM - A)",
    "category": "Drums & Percussion",
    "bpm": 100,
    "key": "A",
    "fileSize": 366136,
    "format": "OGG"
  },
  {
    "id": "loop_8",
    "filename": "ST_Loop_100_C_1789256196834.ogg",
    "url": "/loops/ST_Loop_100_C_1789256196834.ogg",
    "title": "Cyber Drill Kit (100 BPM - C)",
    "category": "Drums & Percussion",
    "bpm": 100,
    "key": "C",
    "fileSize": 368723,
    "format": "OGG"
  },
  {
    "id": "loop_1",
    "filename": "ST_Loop_100_Ab_1789255983800.ogg",
    "url": "/loops/ST_Loop_100_Ab_1789255983800.ogg",
    "title": "Lush Analog Pad (100 BPM - Ab)",
    "category": "Keys & Synths",
    "bpm": 100,
    "key": "Ab",
    "fileSize": 324931,
    "format": "OGG"
  },
  {
    "id": "loop_5",
    "filename": "ST_Loop_100_Bb_1789255875183.ogg",
    "url": "/loops/ST_Loop_100_Bb_1789255875183.ogg",
    "title": "Dreamy Piano Ballad (100 BPM - Bb)",
    "category": "Keys & Synths",
    "bpm": 100,
    "key": "Bb",
    "fileSize": 278259,
    "format": "OGG"
  },
  {
    "id": "loop_11",
    "filename": "ST_Loop_100_C_1789256253242.ogg",
    "url": "/loops/ST_Loop_100_C_1789256253242.ogg",
    "title": "Ethereal Lead (100 BPM - C)",
    "category": "Keys & Synths",
    "bpm": 100,
    "key": "C",
    "fileSize": 363038,
    "format": "OGG"
  },
  {
    "id": "loop_9",
    "filename": "ST_Loop_100_C_1789256203321.ogg",
    "url": "/loops/ST_Loop_100_C_1789256203321.ogg",
    "title": "Punchy Kick & Snare (100 BPM - C)",
    "category": "Drums & Percussion",
    "bpm": 100,
    "key": "C",
    "fileSize": 350005,
    "format": "OGG"
  },
  {
    "id": "loop_12",
    "filename": "ST_Loop_100_Dm_1789256272802.ogg",
    "url": "/loops/ST_Loop_100_Dm_1789256272802.ogg",
    "title": "Punchy Kick & Snare (100 BPM - Dm)",
    "category": "Drums & Percussion",
    "bpm": 100,
    "key": "Dm",
    "fileSize": 350874,
    "format": "OGG"
  },
  {
    "id": "loop_15",
    "filename": "ST_Loop_100_Em_1789256109791.ogg",
    "url": "/loops/ST_Loop_100_Em_1789256109791.ogg",
    "title": "Ethereal Lead (100 BPM - Em)",
    "category": "Keys & Synths",
    "bpm": 100,
    "key": "Em",
    "fileSize": 144432,
    "format": "OGG"
  },
  {
    "id": "loop_16",
    "filename": "ST_Loop_100_E_1789255881165.ogg",
    "url": "/loops/ST_Loop_100_E_1789255881165.ogg",
    "title": "Acid Acidline (100 BPM - E)",
    "category": "Bass & 808",
    "bpm": 100,
    "key": "E",
    "fileSize": 304790,
    "format": "OGG"
  },
  {
    "id": "loop_17",
    "filename": "ST_Loop_100_F_23m_1789256112934.ogg",
    "url": "/loops/ST_Loop_100_F_23m_1789256112934.ogg",
    "title": "Retro Wave Arp (100 BPM - F)",
    "category": "Keys & Synths",
    "bpm": 100,
    "key": "F",
    "fileSize": 145620,
    "format": "OGG"
  }
];

/**
 * Load Catalog Data with Multi-Tier Fallback
 */
async function loadCatalog() {
  let loadedData = null;

  // Tier 1: Try /data/catalog.json
  try {
    const res = await fetch('/data/catalog.json');
    if (res.ok) {
      const text = await res.text();
      if (text && (text.trim().startsWith('[') || text.trim().startsWith('{'))) {
        const parsed = JSON.parse(text);
        loadedData = Array.isArray(parsed) ? parsed : (parsed.loops || null);
      }
    }
  } catch (e) {
    console.warn('Fetch /data/catalog.json failed:', e);
  }

  // Tier 2: Try /api/loops
  if (!loadedData || !Array.isArray(loadedData) || loadedData.length === 0) {
    try {
      const res2 = await fetch('/api/loops');
      if (res2.ok) {
        const text2 = await res2.text();
        if (text2 && (text2.trim().startsWith('[') || text2.trim().startsWith('{'))) {
          const parsed2 = JSON.parse(text2);
          loadedData = Array.isArray(parsed2) ? parsed2 : (parsed2.loops || null);
        }
      }
    } catch (e) {
      console.warn('Fetch /api/loops failed:', e);
    }
  }

  // Tier 3: Direct inlined starter pack
  if (!loadedData || !Array.isArray(loadedData) || loadedData.length === 0) {
    console.log('Using inlined curated starter library.');
    loadedData = DEFAULT_STARTER_LOOPS;
  }

  allLoops = loadedData;
  filteredLoops = [...allLoops];
  updateCategoryCounts();
  renderGrid(filteredLoops);
  totalCountBadge.textContent = `${allLoops.length} Loop`;
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
