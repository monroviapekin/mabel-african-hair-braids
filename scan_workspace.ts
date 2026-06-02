import fs from 'fs';
import path from 'path';

function findFiles(dir: string, depth = 0) {
  if (depth > 5) return;
  try {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      let isDir = false;
      try {
        isDir = fs.statSync(fullPath).isDirectory();
      } catch (e) {}

      if (isDir) {
        if (!item.includes('node_modules') && !item.includes('.cache')) {
          findFiles(fullPath, depth + 1);
        }
      } else {
        if (item.toLowerCase().includes('app.tsx') || item.includes('.bak') || item.includes('old') || item.includes('git')) {
          console.log(`Found file: ${fullPath}`);
        }
      }
    }
  } catch (err) {
    // console.log(`Error reading ${dir}:`, err.message);
  }
}

console.log("Scanning /workspace...");
findFiles('/workspace');
console.log("Scan complete.");
process.exit(0);
