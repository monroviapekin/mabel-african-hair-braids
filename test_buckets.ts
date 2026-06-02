import fetch from 'node-fetch';

const buckets = [
  'ai-studio-45b384ed-bb91-4de4-83f3-da4d77ee515c',
  'ai-studio-45b384ed-bb91-4de4-83f3-da4d77ee515c.appspot.com',
  'ai-studio-45b384ed-bb91-4de4-83f3-da4d77ee515c.firebasestorage.app',
  'aistudio-45b384ed-bb91-4de4-83f3-da4d77ee515c',
  'aistudio-45b384ed-bb91-4de4-83f3-da4d77ee515c.appspot.com',
  'aistudio-45b384ed-bb91-4de4-83f3-da4d77ee515c.firebasestorage.app',
];

async function verify() {
  console.log("Analyzing Applet ID and custom Firestore DB ID GCS bucket statuses...");
  for (const b of buckets) {
    const urls = [
      `https://storage.googleapis.com/${b}/images/braids1.jpg`,
      `https://storage.googleapis.com/${b}/braids1.jpg`
    ];
    for (const url of urls) {
      try {
        const res = await fetch(url, { method: 'GET' });
        console.log(`URL: ${url} | Status: ${res.status} | Length: ${res.headers.get('content-length')}`);
      } catch (e) {
        console.log(`URL: ${url} | Error: ${e.message}`);
      }
    }
  }
}

verify();
