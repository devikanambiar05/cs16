const os = require('os');
const fs = require('fs');
const path = require('path');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Redirect all MongoDB Memory Server files to the D: drive (workspace folder)
// because the C: drive is completely full (0 GB free) but D: has 100+ GB free.
const baseDir = path.join(__dirname, '.mongodb');
const tmpDir = path.join(baseDir, 'tmp');
const downloadDir = path.join(baseDir, 'binaries');

fs.mkdirSync(tmpDir, { recursive: true });
fs.mkdirSync(downloadDir, { recursive: true });

// Monkey-patch os.tmpdir() to force all extraction & temp files to be written to D:
os.tmpdir = () => tmpDir;

// Set download directory environment variable for mongodb-memory-server
process.env.MONGOMS_DOWNLOAD_DIR = downloadDir;

async function start() {
  console.log('Starting in-memory MongoDB on port 27017 (redirected entirely to D: drive)...');
  try {
    const mongoServer = await MongoMemoryServer.create({
      instance: {
        port: 27017,
        dbName: 'faqapp'
      }
    });
    console.log(`✓ In-memory MongoDB started successfully on port 27017!`);
    console.log(`URI: ${mongoServer.getUri()}`);
    console.log('Keeping database active. Press Ctrl+C to terminate.');
    
    // Keep process alive
    process.stdin.resume();
  } catch (error) {
    console.error('Failed to start in-memory MongoDB:', error);
    process.exit(1);
  }
}

start();
