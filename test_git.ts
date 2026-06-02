import fs from 'fs';
import path from 'path';

function listFiles(dir: string, depth = 0) {
  if (depth > 2) return;
  try {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      let isDir = false;
      try {
        isDir = fs.statSync(fullPath).isDirectory();
      } catch (e) {}
      
      console.log(' '.repeat(depth * 2) + (isDir ? `[DIR] ${item}` : `[FILE] ${item}`));
    }
  } catch (err) {
    console.log(`Error reading ${dir}:`, err.message);
  }
}

console.log("Listing parent directories:");
listFiles('..');
listFiles('../..');
