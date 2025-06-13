#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

const ASSETS_DIR = 'public/assets';
const CACHE_FILE = '.video-compression-cache.json';

// Load compression cache
function loadCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  } catch {
    return {};
  }
}

// Save compression cache
function saveCache(cache) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

// Get file hash for change detection
function getFileHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('md5').update(fileBuffer).digest('hex');
}

// Find all video files
function findVideoFiles(dir) {
  const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
  const files = [];
  
  function scanDir(currentDir) {
    const items = fs.readdirSync(currentDir);
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else if (videoExtensions.includes(path.extname(item).toLowerCase())) {
        files.push(fullPath);
      }
    }
  }
  
  scanDir(dir);
  return files;
}

// Compress a single video
function compressVideo(inputPath) {
  const dir = path.dirname(inputPath);
  const name = path.basename(inputPath, path.extname(inputPath));
  const outputPath = path.join(dir, `${name}_compressed.mp4`);
  
  console.log(`Compressing: ${inputPath}`);
  console.log(`Output: ${outputPath}`);
  
  // Web-optimized ffmpeg settings
  const command = [
    'ffmpeg',
    '-i', `"${inputPath}"`,
    '-c:v libx264',           // H.264 codec
    '-preset medium',         // Balance between speed and compression
    '-crf 28',               // Constant Rate Factor (23-28 is good for web)
    '-maxrate 2M',           // Max bitrate for web streaming
    '-bufsize 4M',           // Buffer size
    '-c:a aac',              // AAC audio codec
    '-b:a 128k',             // Audio bitrate
    '-movflags +faststart',   // Optimize for web streaming
    '-y',                    // Overwrite output file
    `"${outputPath}"`
  ].join(' ');
  
  try {
    execSync(command, { stdio: 'inherit' });
    
    // Get file sizes for comparison
    const originalSize = fs.statSync(inputPath).size;
    const compressedSize = fs.statSync(outputPath).size;
    const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
    
    console.log(`✅ Compressed successfully!`);
    console.log(`   Original: ${(originalSize / 1024 / 1024).toFixed(1)}MB`);
    console.log(`   Compressed: ${(compressedSize / 1024 / 1024).toFixed(1)}MB`);
    console.log(`   Savings: ${savings}%`);
    
    // Delete the original file to save space
    try {
      fs.unlinkSync(inputPath);
      console.log(`   🗑️  Deleted original file: ${path.basename(inputPath)}\n`);
    } catch (deleteError) {
      console.warn(`   ⚠️  Could not delete original file: ${deleteError.message}\n`);
    }
    
    return outputPath;
  } catch (error) {
    console.error(`❌ Failed to compress ${inputPath}:`, error.message);
    return null;
  }
}

// Main compression function
function compressVideos() {
  if (!fs.existsSync(ASSETS_DIR)) {
    console.log('No assets directory found.');
    return;
  }
  
  const cache = loadCache();
  const videoFiles = findVideoFiles(ASSETS_DIR);
  
  if (videoFiles.length === 0) {
    console.log('No video files found.');
    return;
  }
  
  console.log(`Found ${videoFiles.length} video file(s):\n`);
  
  let compressed = 0;
  let skipped = 0;
  
  for (const videoPath of videoFiles) {
    // Skip already compressed files
    if (videoPath.includes('_compressed.')) {
      continue;
    }
    
    const currentHash = getFileHash(videoPath);
    const cacheKey = videoPath;
    
    // Check if file has changed since last compression
    if (cache[cacheKey] && cache[cacheKey].hash === currentHash) {
      console.log(`⏭️  Skipping ${videoPath} (unchanged)`);
      skipped++;
      continue;
    }
    
    // Compress the video
    const compressedPath = compressVideo(videoPath);
    
    if (compressedPath) {
      // Update cache
      cache[cacheKey] = {
        hash: currentHash,
        compressedPath: compressedPath,
        timestamp: new Date().toISOString()
      };
      compressed++;
    }
  }
  
  saveCache(cache);
  
  console.log(`\n🎬 Video compression complete!`);
  console.log(`   Compressed: ${compressed} files`);
  console.log(`   Skipped: ${skipped} files (unchanged)`);
}

// Run if called directly
if (require.main === module) {
  compressVideos();
}

module.exports = { compressVideos }; 