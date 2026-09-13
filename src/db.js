const fs = require('node:fs');
const path = require('node:path');
const config = require('../config');

// Ensure data directory exists (with fallback for read-only environments)
try {
  if (!fs.existsSync(config.dataDir)) {
    fs.mkdirSync(config.dataDir, { recursive: true });
  }
} catch (e) {
  // Gracefully continue on read-only environments like Vercel
}

let dbInstance = null;

try {
  const { DatabaseSync } = require('node:sqlite');
  const dbPath = path.join(config.dataDir, 'loops.db');
  dbInstance = new DatabaseSync(dbPath);

  // Initialize schema
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS loops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT UNIQUE,
      filename TEXT,
      filepath TEXT,
      mimetype TEXT,
      filesize INTEGER,
      checksum TEXT,
      title TEXT,
      downloaded_at TEXT DEFAULT (datetime('now', 'localtime'))
    );
    CREATE INDEX IF NOT EXISTS idx_loops_url ON loops(url);
    CREATE INDEX IF NOT EXISTS idx_loops_checksum ON loops(checksum);
  `);
  console.log('✅ SQLite database initialized at:', dbPath);
} catch (err) {
  console.warn('⚠️ SQLite initialization warning, falling back to JSON storage:', err.message);
  dbInstance = null;
}

// Fallback JSON store if SQLite is unavailable
const fallbackJsonPath = path.join(config.dataDir, 'loops.json');
function getJsonData() {
  if (!fs.existsSync(fallbackJsonPath)) {
    fs.writeFileSync(fallbackJsonPath, JSON.stringify([]));
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(fallbackJsonPath, 'utf8'));
  } catch {
    return [];
  }
}
function saveJsonData(data) {
  fs.writeFileSync(fallbackJsonPath, JSON.stringify(data, null, 2));
}

const db = {
  isUrlDownloaded(url) {
    if (!url) return false;
    if (dbInstance) {
      const stmt = dbInstance.prepare('SELECT id FROM loops WHERE url = ? LIMIT 1');
      const row = stmt.get(url);
      return !!row;
    } else {
      const data = getJsonData();
      return data.some(item => item.url === url);
    }
  },

  isChecksumDownloaded(checksum) {
    if (!checksum) return false;
    if (dbInstance) {
      const stmt = dbInstance.prepare('SELECT id FROM loops WHERE checksum = ? LIMIT 1');
      const row = stmt.get(checksum);
      return !!row;
    } else {
      const data = getJsonData();
      return data.some(item => item.checksum === checksum);
    }
  },

  recordLoop({ url, filename, filepath, mimetype, filesize, checksum, title }) {
    if (dbInstance) {
      const stmt = dbInstance.prepare(`
        INSERT OR IGNORE INTO loops (url, filename, filepath, mimetype, filesize, checksum, title)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(url, filename, filepath, mimetype || 'audio/mpeg', filesize || 0, checksum || '', title || filename);
      const getStmt = dbInstance.prepare('SELECT * FROM loops WHERE url = ?');
      return getStmt.get(url);
    } else {
      const data = getJsonData();
      const existing = data.find(item => item.url === url || (checksum && item.checksum === checksum));
      if (existing) return existing;
      const record = {
        id: data.length + 1,
        url,
        filename,
        filepath,
        mimetype: mimetype || 'audio/mpeg',
        filesize: filesize || 0,
        checksum: checksum || '',
        title: title || filename,
        downloaded_at: new Date().toISOString()
      };
      data.unshift(record);
      saveJsonData(data);
      return record;
    }
  },

  getAllLoops(limit = 100, offset = 0) {
    if (dbInstance) {
      const stmt = dbInstance.prepare(`
        SELECT * FROM loops ORDER BY id DESC LIMIT ? OFFSET ?
      `);
      return stmt.all(limit, offset);
    } else {
      const data = getJsonData();
      return data.slice(offset, offset + limit);
    }
  },

  getStats() {
    if (dbInstance) {
      const countStmt = dbInstance.prepare('SELECT COUNT(*) as totalCount, COALESCE(SUM(filesize), 0) as totalBytes FROM loops');
      const row = countStmt.get();
      return {
        totalLoops: row.totalCount || 0,
        totalBytes: row.totalBytes || 0,
        totalMB: ((row.totalBytes || 0) / (1024 * 1024)).toFixed(2)
      };
    } else {
      const data = getJsonData();
      const totalBytes = data.reduce((acc, curr) => acc + (curr.filesize || 0), 0);
      return {
        totalLoops: data.length,
        totalBytes,
        totalMB: (totalBytes / (1024 * 1024)).toFixed(2)
      };
    }
  }
};

module.exports = db;
