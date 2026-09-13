if (process.env.VERCEL) {
  module.exports = {
    attachAudioInterceptor: () => {},
    interceptorEvents: { on: () => {}, emit: () => {} }
  };
  return;
}

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const EventEmitter = require('node:events');
const config = require('../config');
const db = require('./db');

class InterceptorEmitter extends EventEmitter {}
const interceptorEvents = new InterceptorEmitter();

// Ensure download directory exists (with fallback for read-only environments)
try {
  if (!fs.existsSync(config.downloadDir)) {
    fs.mkdirSync(config.downloadDir, { recursive: true });
  }
} catch (e) {
  // Gracefully handle read-only environments like Vercel
}

/**
 * Determine file extension from MIME type or URL
 */
function getExtension(mimeType, url) {
  if (mimeType.includes('audio/wav') || mimeType.includes('audio/x-wav')) return 'wav';
  if (mimeType.includes('audio/ogg')) return 'ogg';
  if (mimeType.includes('audio/aac')) return 'aac';
  if (mimeType.includes('audio/mp4') || mimeType.includes('audio/m4a')) return 'm4a';
  if (mimeType.includes('audio/flac')) return 'flac';

  // Check URL pathname
  try {
    const pathname = new URL(url).pathname;
    const match = pathname.match(/\.(mp3|wav|ogg|aac|m4a|flac)$/i);
    if (match) return match[1].toLowerCase();
  } catch {}

  return 'mp3';
}

/**
 * Sanitize filename and extract meaningful ID/title
 */
function generateFilename(url, mimeType, buffer) {
  const ext = getExtension(mimeType, url);
  let id = '';
  let title = '';

  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    const lastPart = parts[parts.length - 1] || 'sample';
    const cleanLast = lastPart.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    id = cleanLast.slice(0, 30);
  } catch {
    id = 'sample';
  }

  const timestamp = Date.now();
  const filename = `ST_Loop_${id}_${timestamp}.${ext}`;
  return { filename, title: id };
}

/**
 * Attach audio response interceptor to a Playwright page
 */
function attachAudioInterceptor(page) {
  console.log('🎧 Network audio interceptor attached and monitoring...');

  page.on('response', async (response) => {
    try {
      const url = response.url();
      const status = response.status();

      // Only handle successful responses
      if (status !== 200 && status !== 206) return;

      const headers = response.headers();
      const contentType = (headers['content-type'] || '').toLowerCase();

      // Check if response matches audio criteria
      const isAudioMime = config.audioMimeTypes.some(mime => contentType.includes(mime));
      const isAudioUrl = config.audioUrlPatterns.some(pat => url.toLowerCase().includes(pat));

      if (!isAudioMime && !isAudioUrl) return;

      // Duplicate check 1: by URL
      if (db.isUrlDownloaded(url)) {
        return;
      }

      console.log(`\n🎵 [Audio Detected] Status: ${status} | Type: ${contentType}`);
      console.log(`🔗 URL: ${url.slice(0, 100)}...`);

      // Read binary buffer
      const buffer = await response.body().catch(err => {
        console.warn(`⚠️ Failed to read audio buffer: ${err.message}`);
        return null;
      });

      if (!buffer || buffer.length < 2048) {
        // Less than 2KB is probably an error or tiny notification beep
        return;
      }

      // Checksum for duplicate content check
      const checksum = crypto.createHash('md5').update(buffer).digest('hex');
      if (db.isChecksumDownloaded(checksum)) {
        console.log(`⏭️ Duplicate audio content detected (MD5: ${checksum.slice(0, 8)}). Skipping.`);
        return;
      }

      // Generate filename and save
      const { filename, title } = generateFilename(url, contentType, buffer);
      const filePath = path.join(config.downloadDir, filename);

      await fs.promises.writeFile(filePath, buffer);
      const fileSize = buffer.length;

      // Save to SQLite
      const record = db.recordLoop({
        url,
        filename,
        filepath: filePath,
        mimetype: contentType || 'audio/mpeg',
        filesize: fileSize,
        checksum,
        title
      });

      console.log(`💾 [SAVED] ${filename} (${(fileSize / 1024).toFixed(1)} KB)`);

      // Emit event for real-time dashboard update
      interceptorEvents.emit('download', record);

      // Auto-sync to GitHub & trigger Vercel deployment for the new loop
      try {
        const { syncLoopToGitHub } = require('./gitSync');
        syncLoopToGitHub({ filename, sourceFilePath: filePath, fileSize });
      } catch (syncErr) {
        console.warn('⚠️ Auto-Git sync trigger error:', syncErr.message);
      }

    } catch (err) {
      console.error('❌ Error processing intercepted audio:', err.message);
    }
  });
}

module.exports = {
  attachAudioInterceptor,
  interceptorEvents
};
