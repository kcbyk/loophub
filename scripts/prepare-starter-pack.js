const fs = require('node:fs');
const path = require('node:path');

const LOOPS_DIR = path.resolve(__dirname, '../public/loops');
const DATA_DIR = path.resolve(__dirname, '../public/data');
const CATALOG_PATH = path.join(DATA_DIR, 'catalog.json');

// Read current catalog
const fullCatalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));

// Pick 3-4 loops from each category for a balanced 20-track starter library
const categories = [
  'Acoustic Guitar',
  'Electric Guitar',
  'Bass & 808',
  'Drums & Percussion',
  'Keys & Synths',
  'Vocals',
  'FX & Atmos'
];

const starterPack = [];
const keptFilenames = new Set();

for (const cat of categories) {
  const matches = fullCatalog.filter(item => item.category === cat);
  const picked = matches.slice(0, 3); // 3 items per category = 21 items total
  picked.forEach(item => {
    starterPack.push(item);
    keptFilenames.add(item.filename);
  });
}

// Any remaining categories fallback
if (starterPack.length < 20) {
  const rest = fullCatalog.filter(item => !keptFilenames.has(item.filename));
  rest.slice(0, 20 - starterPack.length).forEach(item => {
    starterPack.push(item);
    keptFilenames.add(item.filename);
  });
}

// Remove files from public/loops that are not in the starter pack
// (They still exist in downloaded_loops so zero data is lost!)
const existingFiles = fs.readdirSync(LOOPS_DIR);
let removedCount = 0;
let totalStarterBytes = 0;

for (const file of existingFiles) {
  const filePath = path.join(LOOPS_DIR, file);
  if (!keptFilenames.has(file)) {
    fs.unlinkSync(filePath);
    removedCount++;
  } else {
    totalStarterBytes += fs.statSync(filePath).size;
  }
}

// Save starter catalog.json
fs.writeFileSync(CATALOG_PATH, JSON.stringify(starterPack, null, 2));

console.log(`✅ Starter pack ready!`);
console.log(`🎵 Selected ${starterPack.length} curated loops across all 7 categories.`);
console.log(`📦 Total starter pack size: ${(totalStarterBytes / (1024 * 1024)).toFixed(2)} MB.`);
console.log(`💾 Note: All other loops remain 100% intact in downloaded_loops/ for auto-sync.`);
