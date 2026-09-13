const express = require('express');
const path = require('node:path');
const fs = require('node:fs');

const app = express();

const publicDir = path.join(__dirname, '../public');

// Embed catalog directly so Vercel NFT bundler bundles it
function getCatalog() {
  try {
    const p = path.join(publicDir, 'data/catalog.json');
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    }
  } catch {}
  try {
    return require('../public/data/catalog.json');
  } catch {
    return [];
  }
}

// Serve static assets
app.use(express.static(publicDir));
app.use('/loops', express.static(path.join(publicDir, 'loops')));
app.use('/data', express.static(path.join(publicDir, 'data')));

// Dedicated endpoints returning JSON catalog
app.get('/data/catalog.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  return res.json(getCatalog());
});

app.get('/api/loops', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  return res.json({ success: true, loops: getCatalog() });
});

// API: Stats
app.get('/api/stats', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  const cat = getCatalog();
  const totalBytes = cat.reduce((acc, c) => acc + (c.fileSize || 0), 0);
  return res.json({
    success: true,
    stats: {
      totalLoops: cat.length,
      totalBytes,
      totalMB: (totalBytes / (1024 * 1024)).toFixed(2)
    }
  });
});

// Serve index.html for root and navigation
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

module.exports = app;
