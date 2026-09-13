const path = require('node:path');
require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,
  headless: process.env.HEADLESS === 'true',
  soundtrapUrl: process.env.SOUNDTRAP_URL || 'https://www.soundtrap.com/home/creator/projects',
  downloadDir: path.resolve(process.cwd(), process.env.DOWNLOAD_DIR || './downloaded_loops'),
  dataDir: path.resolve(process.cwd(), process.env.DATA_DIR || './data'),
  sessionDir: path.resolve(process.cwd(), process.env.SESSION_DIR || './session_data'),
  cookiesFile: path.resolve(process.cwd(), process.env.COOKIES_FILE || './cookies.json'),
  autoScrollDelayMs: parseInt(process.env.AUTO_SCROLL_DELAY_MS, 10) || 2000,
  maxPreviews: parseInt(process.env.MAX_PREVIEWS_PER_SESSION, 10) || 500,

  // Audio interception filters
  audioMimeTypes: [
    'audio/mpeg',
    'audio/wav',
    'audio/mp3',
    'audio/ogg',
    'audio/aac',
    'audio/x-wav',
    'audio/flac',
    'audio/mp4'
  ],

  // URL indicators for Soundtrap audio assets
  audioUrlPatterns: [
    '.mp3',
    '.wav',
    '.ogg',
    'soundtrap',
    'audio',
    'loops',
    'samples'
  ]
};
