import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const configContent = fs.readFileSync('./firebase-applet-config.json', 'utf-8');
const firebaseConfig = JSON.parse(configContent);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function scanCollection(name: string) {
  try {
    console.log(`Scanning collection: ${name}...`);
    const col = collection(db, name);
    const snapshot = await getDocs(col);
    if (snapshot.empty) {
      console.log(`- Collection ${name} is empty.`);
    } else {
      console.log(`- Found ${snapshot.size} documents in ${name}:`);
      snapshot.docs.forEach(doc => {
        console.log(`  [${doc.id}]:`, JSON.stringify(doc.data()));
      });
    }
  } catch (err) {
    console.log(`- Error scanning ${name}:`, err.message);
  }
}

async function run() {
  await scanCollection('services');
  await scanCollection('gallery');
  await scanCollection('users');
  await scanCollection('appointments');
  process.exit(0);
}

run();
