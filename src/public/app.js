let currentLoops = [];

// DOM elements
const loopsTableBody = document.getElementById('loopsTableBody');
const statTotalCount = document.getElementById('statTotalCount');
const statTotalSize = document.getElementById('statTotalSize');
const loopCounterBadge = document.getElementById('loopCounterBadge');
const searchInput = document.getElementById('searchInput');
const refreshBtn = document.getElementById('refreshBtn');
const globalAudio = document.getElementById('globalAudio');
const playerTrackTitle = document.getElementById('playerTrackTitle');
const playerTrackSub = document.getElementById('playerTrackSub');
const connectionStatus = document.getElementById('connectionStatus');

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return dateStr;
  }
}

function playTrack(filename, title) {
  globalAudio.src = `/audio/${encodeURIComponent(filename)}`;
  playerTrackTitle.textContent = title || filename;
  playerTrackSub.textContent = `Dosya: ${filename}`;
  globalAudio.play().catch(e => console.warn('Autoplay prevented:', e));
}

function renderTable(loops) {
  if (!loops || loops.length === 0) {
    loopsTableBody.innerHTML = `
      <tr class="empty-row">
        <td colspan="7">Henüz bir loop yakalanmadı. Tarayıcıda sesler çalındıkça buraya anında yansıyacaktır.</td>
      </tr>
    `;
    loopCounterBadge.textContent = '0 loop';
    return;
  }

  loopCounterBadge.textContent = `${loops.length} loop`;

  const rows = loops.map((loop, idx) => {
    return `
      <tr>
        <td style="color: var(--text-muted);">${idx + 1}</td>
        <td>
          <button class="play-inline-btn" onclick="playTrack('${escapeHtml(loop.filename)}', '${escapeHtml(loop.title || loop.filename)}')">▶</button>
        </td>
        <td style="font-weight: 500;">${escapeHtml(loop.title || loop.filename)}</td>
        <td><span class="badge" style="background: rgba(255,255,255,0.06); color: #fff;">${escapeHtml(loop.mimetype.split('/')[1] || 'audio')}</span></td>
        <td>${formatBytes(loop.filesize)}</td>
        <td style="color: var(--text-muted);">${formatDate(loop.downloaded_at)}</td>
        <td>
          <a class="download-link" href="/audio/${encodeURIComponent(loop.filename)}" download>İndir ⇩</a>
        </td>
      </tr>
    `;
  }).join('');

  loopsTableBody.innerHTML = rows;
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

async function loadStats() {
  try {
    const res = await fetch('/api/stats');
    const data = await res.json();
    if (data.success && data.stats) {
      statTotalCount.textContent = data.stats.totalLoops;
      statTotalSize.textContent = `${data.stats.totalMB} MB`;
    }
  } catch (err) {
    console.error('Failed to load stats:', err);
  }
}

async function loadLoops() {
  try {
    const res = await fetch('/api/loops?limit=200');
    const data = await res.json();
    if (data.success && Array.isArray(data.loops)) {
      currentLoops = data.loops;
      applySearchFilter();
    }
  } catch (err) {
    console.error('Failed to load loops:', err);
  }
}

function applySearchFilter() {
  const query = (searchInput.value || '').trim().toLowerCase();
  if (!query) {
    renderTable(currentLoops);
    return;
  }

  const filtered = currentLoops.filter(l => 
    (l.filename && l.filename.toLowerCase().includes(query)) ||
    (l.title && l.title.toLowerCase().includes(query)) ||
    (l.mimetype && l.mimetype.toLowerCase().includes(query))
  );
  renderTable(filtered);
}

// Server-Sent Events for Live Interception Feed
function initSSE() {
  const eventSource = new EventSource('/api/events');

  eventSource.onopen = () => {
    connectionStatus.querySelector('.status-text').textContent = 'Canlı Dinleniyor (SSE)';
    connectionStatus.style.borderColor = 'rgba(16, 185, 129, 0.4)';
  };

  eventSource.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === 'download' && msg.data) {
        // Prepend new loop
        currentLoops.unshift(msg.data);
        applySearchFilter();
        loadStats();
      } else if (msg.type === 'connected') {
        loadStats();
      }
    } catch (err) {
      console.warn('SSE parse error:', err);
    }
  };

  eventSource.onerror = () => {
    connectionStatus.querySelector('.status-text').textContent = 'Yeniden Bağlanıyor...';
    connectionStatus.style.borderColor = 'rgba(239, 68, 68, 0.4)';
  };
}

// Event Listeners
searchInput.addEventListener('input', applySearchFilter);
refreshBtn.addEventListener('click', () => {
  loadStats();
  loadLoops();
});

// Initial load
loadStats();
loadLoops();
initSSE();
