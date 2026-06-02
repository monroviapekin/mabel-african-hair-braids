import { Storage } from '@google-cloud/storage';

const buckets = [
  'gen-lang-client-0102115829.appspot.com',
  'gen-lang-client-0102115829.firebasestorage.app'
];

async function run() {
  const storage = new Storage();
  for (const b of buckets) {
    console.log(`Checking bucket permissions for: ${b}...`);
    try {
      const gcsBucket = storage.bucket(b);
      const file = gcsBucket.file('test_connection.txt');
      await file.save('Hello from AI sandbox!', {
        public: true, // try to make it public
        contentType: 'text/plain'
      });
      console.log(`[SUCCESS] Write succeeded to bucket: ${b}`);
      
      // Let's test reading back
      const url = `https://storage.googleapis.com/${b}/test_connection.txt`;
      console.log(`Bucket public URL: ${url}`);
    } catch (err) {
      console.log(`[FAILED] Write failed to bucket ${b}:`, err.message);
    }
  }
}

async function start() {
  await run();
  process.exit(0);
}

start();
