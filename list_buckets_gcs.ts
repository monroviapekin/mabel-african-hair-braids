import { Storage } from '@google-cloud/storage';

const storage = new Storage();

async function run() {
  console.log("Listing GCS buckets in project...");
  try {
    const [buckets] = await storage.getBuckets();
    console.log("Found buckets:");
    buckets.forEach(b => {
      console.log(`- ${b.name} (Created: ${b.metadata.timeCreated})`);
    });
  } catch (err) {
    console.error("Error listing buckets:", err.message);
  }
}

run();
