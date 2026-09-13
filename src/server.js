if (process.env.VERCEL) {
  module.exports = { app: null, startServer: async () => {} };
  return;
}

const express = require('express');
const cors = require('cors');
const path = require('node:path');
const config = require('../config');
const db = require('./db');
const { interceptorEvents } = require('./interceptor');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend LoopHub library
const rootPublicDir = path.join(__dirname, '../public');
app.use(express.static(rootPublicDir));

// Serve audio loops directly
app.use('/loops', express.static(path.join(rootPublicDir, 'loops')));
app.use('/audio', express.static(config.downloadDir));

// Store active SSE clients for real-time pushing
const sseClients = new Set();

interceptorEvents.on('download', (record) => {
  const payload = JSON.stringify({ type: 'download', data: record });
  for (const res of sseClients) {
    res.write(`data: ${payload}\n\n`);
  }
});

// SSE endpoint for live feed
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.add(res);

  // Send initial ping
  res.write(`data: ${JSON.stringify({ type: 'connected', stats: db.getStats() })}\n\n`);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// API: Overall statistics
app.get('/api/stats', (req, res) => {
  const stats = db.getStats();
  res.json({ success: true, stats });
});

// API: Paginated loops list
app.get('/api/loops', (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 50;
  const offset = parseInt(req.query.offset, 10) || 0;
  const loops = db.getAllLoops(limit, offset);
  res.json({ success: true, loops });
});

function startServer() {
  return new Promise((resolve) => {
    app.listen(config.port, () => {
      console.log(`🎛️ Soundtrap Dashboard running at: http://localhost:${config.port}`);
      resolve(app);
    });
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
