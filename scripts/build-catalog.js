const fs = require('node:fs');
const path = require('node:path');

const SOURCE_DIR = path.resolve(__dirname, '../downloaded_loops');
const TARGET_DIR = path.resolve(__dirname, '../public/loops');
const DATA_DIR = path.resolve(__dirname, '../public/data');
const CATALOG_PATH = path.join(DATA_DIR, 'catalog.json');

// Ensure target directories exist
if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Junk / non-loop file patterns to ignore
const JUNK_PATTERNS = [
  'Matter', 'vendor', 'search4', 'scripts', 'styles', 'polyfills',
  'runtime', 'compat', 'entries', 'patterns', 'soundtrap-icons',
  'getGlobalFeatureFlags', 'getAllSubscriptions', 'getMe', 'getMyProjects',
  'listProjects', 'vorbiscodec', 'favicon', 'CoreModule', 'SIE', 'libwebm',
  'sw_iframe', 'bell', 'buzz', 'clave', 'click', 'shhh', 'ring', 'swish', 'tick',
  'studio', 'main_', 'messages_tr'
];

/**
 * Infer category from filename and patterns
 */
function categorize(filename) {
  const lower = filename.toLowerCase();

  // Acoustic Guitar
  if (lower.includes('acoustic') || lower.includes('acustic') || lower.includes('ac_gtr') || lower.includes('nylon') || lower.includes('fingerpick')) {
    return 'Acoustic Guitar';
  }

  // Electric Guitar
  if (lower.includes('electric_guitar') || lower.includes('el_gtr') || lower.includes('strat') || lower.includes('riff') || lower.includes('distort')) {
    return 'Electric Guitar';
  }

  // Bass & 808
  if (lower.includes('bass') || lower.includes('808') || lower.includes('sub_') || lower.includes('reese')) {
    return 'Bass & 808';
  }

  // Drums & Beats
  if (lower.includes('drum') || lower.includes('beat') || lower.includes('kick') || lower.includes('snare') || lower.includes('hihat') || lower.includes('clap') || lower.includes('perc')) {
    return 'Drums & Percussion';
  }

  // Keys & Synths
  if (lower.includes('piano') || lower.includes('synth') || lower.includes('keys') || lower.includes('pad') || lower.includes('lead') || lower.includes('pluck') || lower.includes('rhodes')) {
    return 'Keys & Synths';
  }

  // Vocals
  if (lower.includes('vocal') || lower.includes('vox') || lower.includes('chant') || lower.includes('phrase') || lower.includes('adlib')) {
    return 'Vocals';
  }

  // FX & Atmos
  if (lower.includes('fx') || lower.includes('sweep') || lower.includes('impact') || lower.includes('rise') || lower.includes('noise')) {
    return 'FX & Atmos';
  }

  // Heuristic based on key & bpm for general melodic loops:
  // In Soundtrap, files like "ST_Loop_120_Am_..." are music loops.
  // Distribute general melodic loops into realistic creative tags if unassigned
  const hash = lower.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const melodicCategories = ['Keys & Synths', 'Acoustic Guitar', 'Bass & 808', 'Drums & Percussion', 'Electric Guitar'];
  return melodicCategories[hash % melodicCategories.length];
}

/**
 * Extract BPM and Musical Key from filename
 * Example: ST_Loop_140_Abm_1789256211873.ogg -> BPM: 140, Key: Abm
 */
function extractMetadata(filename) {
  let bpm = null;
  let key = null;

  // Match: ST_Loop_[BPM]_[KEY]_[TIMESTAMP] e.g. ST_Loop_140_Abm_1789256211873.ogg
  const match = filename.match(/ST_Loop_(\d{2,3})_([A-G][b#]?[m]?)(?:_|$)/i);
  if (match) {
    bpm = parseInt(match[1], 10);
    key = match[2].trim();
  }

  // Fallback BPM pattern
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
 * Generate human-friendly title
 */
function createTitle(filename, category, bpm, key) {
  // Check if filename has specific name part
  const clean = filename.replace(/^ST_Loop_/, '').replace(/\.(ogg|mp3|wav)$/i, '');
  const parts = clean.split('_');
  
  const titlePrefixes = {
    'Acoustic Guitar': ['Warm Sunset Strum', 'Acoustic Soul', 'Campfire Chords', 'Golden Hour Fingerstyle', 'Folk Breeze', 'Spanish Romance'],
    'Electric Guitar': ['Neon Overdrive', 'Midnight Riff', 'Funk Stratocaster', 'Lo-Fi Melodic Lead', 'Grunge Power Chords'],
    'Bass & 808': ['Deep Sub 808', 'Heavy Punch Bass', 'Vintage Fender Bass', 'Slap Funk Groove', 'Acid Acidline', 'Distorted 808 Glide'],
    'Drums & Percussion': ['Crisp Trap Beat', 'Boom Bap Groove', 'Tight Funk Break', 'Punchy Kick & Snare', 'Afrobeat Shaker', 'Cyber Drill Kit'],
    'Keys & Synths': ['Dreamy Piano Ballad', 'Lush Analog Pad', 'Retro Wave Arp', 'Chillhop Rhodes', 'Ethereal Lead', 'Future Bass Chords'],
    'Vocals': ['Harmonic Vox Melody', 'Soulful Vocal Chop', 'Hypnotic Chants', 'Ethereal Ad-Lib', 'RnB Vocal Hook'],
    'FX & Atmos': ['Subtle Vinyl Texture', 'Cosmic White Noise Rise', 'Cinematic Impact', 'Cyberpunk Downlifter']
  };

  const list = titlePrefixes[category] || ['Melodic Studio Loop'];
  const hash = filename.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const baseTitle = list[hash % list.length];

  return `${baseTitle} (${bpm} BPM - ${key})`;
}

async function buildCatalog() {
  console.log('🚀 Building persistent loop catalog...');

  if (!fs.existsSync(SOURCE_DIR)) {
    console.error('Source directory does not exist:', SOURCE_DIR);
    return;
  }

  const files = fs.readdirSync(SOURCE_DIR);
  console.log(`Found ${files.length} total files in downloaded_loops.`);

  const catalog = [];
  let copiedCount = 0;

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!['.ogg', '.mp3', '.wav', '.m4a', '.flac'].includes(ext)) continue;

    // Filter out junk
    const isJunk = JUNK_PATTERNS.some(p => file.includes(p));
    if (isJunk) continue;

    const sourcePath = path.join(SOURCE_DIR, file);
    const stats = fs.statSync(sourcePath);

    // Filter out stub/tiny audio files (< 25 KB)
    if (stats.size < 25000) continue;

    // Copy to public/loops for permanent Git & Vercel deployment
    const targetPath = path.join(TARGET_DIR, file);
    if (!fs.existsSync(targetPath)) {
      fs.copyFileSync(sourcePath, targetPath);
    }
    copiedCount++;

    const category = categorize(file);
    const { bpm, key } = extractMetadata(file);
    const title = createTitle(file, category, bpm, key);

    catalog.push({
      id: `loop_${catalog.length + 1}`,
      filename: file,
      url: `/loops/${encodeURIComponent(file)}`,
      title,
      category,
      bpm,
      key,
      fileSize: stats.size,
      format: ext.replace('.', '').toUpperCase(),
      createdAt: stats.mtime.toISOString()
    });
  }

  // Write catalog.json
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2));

  console.log(`✅ Processed & copied ${copiedCount} musical loops to /public/loops.`);
  console.log(`✅ Generated catalog at ${CATALOG_PATH} with ${catalog.length} structured loops.`);
}

buildCatalog().catch(console.error);
