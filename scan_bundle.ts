import fetch from 'node-fetch'; // wait, we can use native fetch or fs
import fs from 'fs';

async function scanBundle() {
  console.log("Downloading production bundle...");
  try {
    const res = await fetch("https://mabelafricanbraids.com/assets/index-Cf-mdfb3.js");
    const text = await res.text();
    console.log("Bundle downloaded successfully, size:", text.length, "chars");

    // Search for matches
    const searchTerms = [
      /https:\/\/storage\.googleapis\.com\/[^\s'"`}]+/,
      /https:\/\/firebasestorage\.googleapis\.com\/[^\s'"`}]+/
    ];

    console.log("Searching for Google Cloud Storage patterns...");
    const storageUrls: string[] = [];
    
    // Find all urls matching storage patterns
    const regex1 = /https:\/\/storage\.googleapis\.com\/[^\s'"`}]+/g;
    const matches1 = text.match(regex1) || [];
    console.log(`Found ${matches1.length} matches for storage.googleapis.com`);
    matches1.forEach((m, idx) => {
      console.log(`Match ${idx + 1}: ${m}`);
    });

    const regex2 = /https:\/\/firebasestorage\.googleapis\.com\/[^\s'"`}]+/g;
    const matches2 = text.match(regex2) || [];
    console.log(`Found ${matches2.length} matches for firebasestorage.googleapis.com`);
    matches2.forEach((m, idx) => {
      console.log(`Match ${idx + 1}: ${m}`);
    });

    // Also search around braids or mabel to see what it is
    const regexImages = /"\/images\/[^"]+"/g;
    const matchesImages = text.match(regexImages) || [];
    console.log("Matches for images:", matchesImages.length);

    // Let's write a regex that matches any URL with 'mabel' or 'braid'
    const generalUrls = text.match(/https:\/\/[^\s'"`}]+/g) || [];
    console.log("Total general URLs:", generalUrls.length);
    const mabelUrls = generalUrls.filter(u => u.toLowerCase().includes('mabel') || u.toLowerCase().includes('braid') || u.toLowerCase().includes('google'));
    console.log("Filtered mabel/braid/google URLs:");
    mabelUrls.slice(0, 50).forEach(u => console.log("-", u));

  } catch (error) {
    console.error("Error scanning bundle:", error);
  }
}

scanBundle();
