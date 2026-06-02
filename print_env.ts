console.log("Environment variables keys:");
Object.keys(process.env).forEach(key => {
  // Print all keys, hide values except non-sensitive config
  const val = process.env[key];
  if (key.includes("API") || key.includes("SECRET") || key.includes("KEY") || key.includes("PASSWORD")) {
    console.log(`- ${key}: [HIDDEN]`);
  } else {
    console.log(`- ${key}: ${val}`);
  }
});
process.exit(0);
