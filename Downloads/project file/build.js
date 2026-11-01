const fs = require('fs');
const path = require('path');

console.log('--- Starting Build Script ---');

const distDir = path.resolve(__dirname, 'dist');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) {
      copyRecursive(path.join(src, item), path.join(dest, item));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

const candidateDirs = [
  __dirname,
  path.join(__dirname, 'Downloads', 'project file')
];

const itemsToCopy = [
  'index1.html',
  'style1.css',
  'script1.js',
  'campus_map.png',
  'campus_map.webp',
  'floorplan.png',
  'floorplan.webp',
  'db.json',
  'qrcodes',
  'archive'
];

for (const dir of candidateDirs) {
  if (fs.existsSync(dir)) {
    for (const item of itemsToCopy) {
      const src = path.join(dir, item);
      const dest = path.join(distDir, item);
      if (!fs.existsSync(dest) && fs.existsSync(src)) {
        copyRecursive(src, dest);
        console.log(`Copied ${item} to dist/`);
      }
    }
  }
}

const indexPath = path.join(distDir, 'index.html');
const index1Path = path.join(distDir, 'index1.html');
if (!fs.existsSync(indexPath) && fs.existsSync(index1Path)) {
  fs.copyFileSync(index1Path, indexPath);
  console.log('Created dist/index.html from index1.html');
}

console.log('--- Build Finished Successfully ---');