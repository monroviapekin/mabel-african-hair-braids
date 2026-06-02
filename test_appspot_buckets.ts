import fetch from 'node-fetch';

const buckets = [
  'mabelafricanbraids.appspot.com',
  'mabelafricanbraids-assets.appspot.com',
  'mabel-african-braids-assets.appspot.com',
  'mabel-braids.appspot.com',
  'mabelafricanbraids-799d5.appspot.com', // wait, 799d5 might be a random code, let's see
];

async function verify() {
  console.log("Analyzing .appspot.com bucket statuses...");
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
