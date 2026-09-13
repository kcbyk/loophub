const express = require('express');
const path = require('node:path');
const fs = require('node:fs');

const app = express();

const publicDir = path.join(__dirname, '../public');

// Serve static assets from public
app.use(express.static(publicDir));
app.use('/loops', express.static(path.join(publicDir, 'loops')));
app.use('/data', express.static(path.join(publicDir, 'data')));

// API: Loops Catalog
app.get('/api/loops', (req, res) => {
  try {
    const catalogPath = path.join(publicDir, 'data/catalog.json');
    if (fs.existsSync(catalogPath)) {
      const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
      return res.json({ success: true, loops: catalog });
    }
    return res.json({ success: true, loops: [] });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// API: Stats
app.get('/api/stats', (req, res) => {
  try {
    const catalogPath = path.join(publicDir, 'data/catalog.json');
    if (fs.existsSync(catalogPath)) {
      const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
      const totalBytes = catalog.reduce((acc, c) => acc + (c.fileSize || 0), 0);
      return res.json({
        success: true,
        stats: {
          totalLoops: catalog.length,
          totalBytes,
          totalMB: (totalBytes / (1024 * 1024)).toFixed(2)
        }
      });
    }
    return res.json({ success: true, stats: { totalLoops: 0, totalBytes: 0, totalMB: '0.00' } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

module.exports = app;
