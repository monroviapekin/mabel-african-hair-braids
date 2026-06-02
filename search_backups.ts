import fs from 'fs';
import path from 'path';

function findBackups(dir: string, depth = 0) {
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
        if (!item.includes('node_modules') && !item.includes('proc') && !item.includes('sys') && !item.includes('dev')) {
          findBackups(fullPath, depth + 1);
        }
      } else {
        if (item.toLowerCase().includes('app.tsx') || item.toLowerCase().includes('backup') || item.includes('.bak') || item.includes('old')) {
          console.log(`Found backup file: ${fullPath}`);
        }
      }
    }
  } catch (err) {
    // console.log(`Error reading ${dir}:`, err.message);
  }
}

console.log("Searching system for backups of App.tsx or general backups...");
findBackups('/tmp');
findBackups('/app');
console.log("Search complete.");
process.exit(0);
