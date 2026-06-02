import fetch from 'node-fetch';

const urls = [
  'https://storage.googleapis.com/gen-lang-client-0102115829/images/braids1.jpg',
  'https://storage.googleapis.com/gen-lang-client-0102115829/braids1.jpg',
  'https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0102115829/o/images%2Fbraids1.jpg?alt=media',
  'https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0102115829/o/braids1.jpg?alt=media'
];

async function run() {
  for (const url of urls) {
    try {
      const res = await fetch(url, { method: 'GET' });
      console.log(`URL: ${url} | Status: ${res.status}`);
    } catch (e) {
      console.log(`Error on ${url}:`, e.message);
    }
  }
}

run();
