import fs from 'fs';
try {
  const content = fs.readFileSync('../.dev.env.json', 'utf-8');
  console.log("Found .dev.env.json:");
  console.log(content);
} catch (err) {
  console.log("Error reading .dev.env.json:", err.message);
}
process.exit(0);
