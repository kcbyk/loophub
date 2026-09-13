const { exec } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const CATALOG_PATH = path.resolve(__dirname, '../public/data/catalog.json');
const LOOPS_DIR = path.resolve(__dirname, '../public/loops');

let isPushing = false;
const queue = [];

/**
 * Infer category from filename
 */
function categorize(filename) {
  const lower = filename.toLowerCase();
  if (lower.includes('acoustic') || lower.includes('acustic') || lower.includes('ac_gtr') || lower.includes('nylon') || lower.includes('fingerpick')) {
    return 'Acoustic Guitar';
  }
  if (lower.includes('electric_guitar') || lower.includes('el_gtr') || lower.includes('strat') || lower.includes('riff') || lower.includes('distort')) {
    return 'Electric Guitar';
  }
  if (lower.includes('bass') || lower.includes('808') || lower.includes('sub_') || lower.includes('reese')) {
    return 'Bass & 808';
  }
  if (lower.includes('drum') || lower.includes('beat') || lower.includes('kick') || lower.includes('snare') || lower.includes('hihat') || lower.includes('clap') || lower.includes('perc')) {
    return 'Drums & Percussion';
  }
  if (lower.includes('piano') || lower.includes('synth') || lower.includes('keys') || lower.includes('pad') || lower.includes('lead') || lower.includes('pluck') || lower.includes('rhodes')) {
    return 'Keys & Synths';
  }
  if (lower.includes('vocal') || lower.includes('vox') || lower.includes('chant') || lower.includes('phrase') || lower.includes('adlib')) {
    return 'Vocals';
  }
  if (lower.includes('fx') || lower.includes('sweep') || lower.includes('impact') || lower.includes('rise') || lower.includes('noise')) {
    return 'FX & Atmos';
  }
  const hash = lower.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const categories = ['Keys & Synths', 'Acoustic Guitar', 'Bass & 808', 'Drums & Percussion', 'Electric Guitar'];
  return categories[hash % categories.length];
}

/**
 * Extract BPM & Key
 */
function extractMetadata(filename) {
  let bpm = null;
  let key = null;
  const match = filename.match(/ST_Loop_(\d{2,3})_([A-G][b#]?[m]?)(?:_|$)/i);
  if (match) {
    bpm = parseInt(match[1], 10);
    key = match[2].trim();
  }
  if (!bpm) {
    const bpmMatch = filename.match(/(\d{2,3})\s*bpm/i) || filename.match(/_(\d{2,3})_/);
    if (bpmMatch) bpm = parseInt(bpmMatch[1], 10);
  }
  return {
    bpm: bpm && bpm >= 50 && bpm <= 220 ? bpm : 120,
    key: key || 'C Maj'
  };
}

/**
 * Add audio loop to public library, update catalog, and auto-push to GitHub
 */
async function syncLoopToGitHub({ filename, sourceFilePath, fileSize }) {
  try {
    // 1. Copy to public/loops if not already there
    const targetFilePath = path.join(LOOPS_DIR, filename);
    if (!fs.existsSync(targetFilePath) && fs.existsSync(sourceFilePath)) {
      fs.copyFileSync(sourceFilePath, targetFilePath);
    }

    // 2. Read catalog and update
    let catalog = [];
    if (fs.existsSync(CATALOG_PATH)) {
      try {
        catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
      } catch {
        catalog = [];
      }
    }

    // Check if already in catalog
    if (!catalog.some(item => item.filename === filename)) {
      const category = categorize(filename);
      const { bpm, key } = extractMetadata(filename);
      const ext = path.extname(filename).replace('.', '').toUpperCase();

      const newRecord = {
        id: `loop_${catalog.length + 1}`,
        filename,
        url: `/loops/${encodeURIComponent(filename)}`,
        title: `${category} Loop (${bpm} BPM - ${key})`,
        category,
        bpm,
        key,
        fileSize: fileSize || (fs.existsSync(targetFilePath) ? fs.statSync(targetFilePath).size : 0),
        format: ext || 'OGG',
        createdAt: new Date().toISOString()
      };

      catalog.unshift(newRecord);
      fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2));
      console.log(`📋 Added ${filename} to LoopHub catalog (${category}, ${bpm} BPM, ${key}).`);
    }

    // 3. Queue auto-git-push
    queue.push({ filename });
    processPushQueue();

  } catch (err) {
    console.error(`❌ Error syncing loop ${filename}:`, err.message);
  }
}

/**
 * Sequential git push queue processor
 */
function processPushQueue() {
  if (isPushing || queue.length === 0) return;

  isPushing = true;
  const current = queue.shift();
  const safeFilename = path.basename(current.filename);

  console.log(`\n🚀 [Auto-Git] Pushing newly harvested loop to GitHub: ${safeFilename}...`);

  const cmd = `git add -f "public/loops/${safeFilename}" "public/data/catalog.json" && git commit -m "auto: add loop ${safeFilename}" && git push origin main`;

  exec(cmd, { cwd: path.resolve(__dirname, '..') }, (error, stdout, stderr) => {
    isPushing = false;
    if (error) {
      console.warn(`⚠️ Auto-Git push warning for ${safeFilename}:`, error.message);
    } else {
      console.log(`✅ [Auto-Git] Successfully pushed ${safeFilename} to GitHub & triggered Vercel deploy!`);
    }

    // Process next in queue if any
    if (queue.length > 0) {
      setTimeout(processPushQueue, 1000);
    }
  });
}

module.exports = {
  syncLoopToGitHub
};
