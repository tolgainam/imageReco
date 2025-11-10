#!/usr/bin/env node

/**
 * Upload Assets to Supabase Storage
 *
 * This script uploads all local assets to Supabase Storage buckets:
 * - .mind files → ar-targets bucket
 * - .glb files → ar-models bucket
 * - images → ar-images bucket
 * - sounds → ar-sounds bucket
 *
 * Usage:
 *   node scripts/upload-assets.js
 *
 * Prerequisites:
 *   npm install @supabase/supabase-js dotenv
 *   Create .env file with SUPABASE_URL and SUPABASE_SERVICE_KEY
 */

const path = require('path');
const fs = require('fs');

// Load .env from parent directory (project root)
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { createClient } = require('@supabase/supabase-js');

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Asset directories (relative to project root)
const PROJECT_ROOT = path.join(__dirname, '..');
const ASSETS_DIR = path.join(PROJECT_ROOT, 'assets');
const TARGETS_DIR = path.join(ASSETS_DIR, 'targets');
const MODELS_DIR = path.join(ASSETS_DIR, 'models');
const IMAGES_DIR = path.join(ASSETS_DIR, 'images');
const SOUNDS_DIR = path.join(ASSETS_DIR, 'sounds');

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get content type for file
 */
function getContentType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const types = {
    '.mind': 'application/octet-stream',
    '.glb': 'model/gltf-binary',
    '.gltf': 'model/gltf+json',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg'
  };
  return types[ext] || 'application/octet-stream';
}

/**
 * Get file size in KB
 */
function getFileSizeKB(filePath) {
  const stats = fs.statSync(filePath);
  return (stats.size / 1024).toFixed(2);
}

/**
 * Upload single file to Supabase Storage
 */
async function uploadFile(bucketName, filePath, storagePath) {
  try {
    const fileName = path.basename(filePath);
    const fileBuffer = fs.readFileSync(filePath);
    const contentType = getContentType(fileName);
    const fileSize = getFileSizeKB(filePath);

    console.log(`📤 Uploading ${fileName} (${fileSize} KB) to ${bucketName}/${storagePath}...`);

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, fileBuffer, {
        contentType: contentType,
        cacheControl: '3600',
        upsert: true  // Overwrite if exists
      });

    if (error) {
      console.error(`❌ Error uploading ${fileName}:`, error.message);
      return { success: false, path: filePath, error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(storagePath);

    console.log(`✅ Uploaded ${fileName}`);
    console.log(`   URL: ${urlData.publicUrl}`);

    return {
      success: true,
      localPath: filePath,
      storagePath: storagePath,
      publicUrl: urlData.publicUrl,
      bucket: bucketName,
      fileName: fileName,
      size: fileSize
    };

  } catch (error) {
    console.error(`❌ Exception uploading ${filePath}:`, error);
    return { success: false, path: filePath, error: error.message };
  }
}

/**
 * Get all files in directory with extension
 */
function getFilesInDir(dir, extensions) {
  if (!fs.existsSync(dir)) {
    console.warn(`⚠️ Directory not found: ${dir}`);
    return [];
  }

  const files = fs.readdirSync(dir);
  return files
    .filter(file => {
      const ext = path.extname(file).toLowerCase();
      return extensions.includes(ext);
    })
    .map(file => path.join(dir, file));
}

// ============================================================================
// UPLOAD FUNCTIONS
// ============================================================================

/**
 * Upload all target files (.mind)
 */
async function uploadTargets() {
  console.log('\n🎯 Uploading target files...\n');

  const files = getFilesInDir(TARGETS_DIR, ['.mind']);

  if (files.length === 0) {
    console.log('ℹ️ No .mind files found in', TARGETS_DIR);
    return [];
  }

  const results = [];

  for (const filePath of files) {
    const fileName = path.basename(filePath);
    const result = await uploadFile('ar-targets', filePath, fileName);
    results.push(result);
  }

  return results;
}

/**
 * Upload all 3D model files (.glb, .gltf)
 */
async function uploadModels() {
  console.log('\n🎨 Uploading 3D model files...\n');

  const files = getFilesInDir(MODELS_DIR, ['.glb', '.gltf']);

  if (files.length === 0) {
    console.log('ℹ️ No model files found in', MODELS_DIR);
    return [];
  }

  const results = [];

  for (const filePath of files) {
    const fileName = path.basename(filePath);
    const result = await uploadFile('ar-models', filePath, fileName);
    results.push(result);
  }

  return results;
}

/**
 * Upload all image files
 */
async function uploadImages() {
  console.log('\n🖼️ Uploading image files...\n');

  const files = getFilesInDir(IMAGES_DIR, ['.jpg', '.jpeg', '.png', '.gif', '.webp']);

  if (files.length === 0) {
    console.log('ℹ️ No image files found in', IMAGES_DIR);
    return [];
  }

  const results = [];

  for (const filePath of files) {
    const fileName = path.basename(filePath);
    const result = await uploadFile('ar-images', filePath, fileName);
    results.push(result);
  }

  return results;
}

/**
 * Upload all sound files
 */
async function uploadSounds() {
  console.log('\n🔊 Uploading sound files...\n');

  const files = getFilesInDir(SOUNDS_DIR, ['.mp3', '.wav', '.ogg']);

  if (files.length === 0) {
    console.log('ℹ️ No sound files found in', SOUNDS_DIR);
    return [];
  }

  const results = [];

  for (const filePath of files) {
    const fileName = path.basename(filePath);
    const result = await uploadFile('ar-sounds', filePath, fileName);
    results.push(result);
  }

  return results;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('🚀 Starting asset upload to Supabase Storage...\n');
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
  console.log(`📂 Assets directory: ${ASSETS_DIR}\n`);

  const startTime = Date.now();

  // Upload all asset types
  const targetResults = await uploadTargets();
  const modelResults = await uploadModels();
  const imageResults = await uploadImages();
  const soundResults = await uploadSounds();

  // Combine results
  const allResults = [
    ...targetResults,
    ...modelResults,
    ...imageResults,
    ...soundResults
  ];

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 UPLOAD SUMMARY');
  console.log('='.repeat(60) + '\n');

  const successful = allResults.filter(r => r.success);
  const failed = allResults.filter(r => !r.success);

  console.log(`✅ Successful uploads: ${successful.length}`);
  console.log(`❌ Failed uploads: ${failed.length}`);
  console.log(`📊 Total files processed: ${allResults.length}`);

  // Calculate total size
  const totalSize = successful.reduce((sum, r) => sum + parseFloat(r.size || 0), 0);
  console.log(`💾 Total size uploaded: ${totalSize.toFixed(2)} KB`);

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`⏱️ Duration: ${duration}s`);

  // Show failed uploads
  if (failed.length > 0) {
    console.log('\n❌ Failed Uploads:');
    failed.forEach(r => {
      console.log(`   - ${r.path}: ${r.error}`);
    });
  }

  // Create URL mapping file
  const urlMapping = {};
  successful.forEach(r => {
    urlMapping[r.localPath] = r.publicUrl;
  });

  const mappingPath = path.join(PROJECT_ROOT, 'asset-urls.json');
  fs.writeFileSync(mappingPath, JSON.stringify(urlMapping, null, 2));
  console.log(`\n✅ URL mapping saved to: ${mappingPath}`);

  // Create detailed report
  const report = {
    timestamp: new Date().toISOString(),
    supabaseUrl: SUPABASE_URL,
    summary: {
      total: allResults.length,
      successful: successful.length,
      failed: failed.length,
      totalSizeKB: parseFloat(totalSize.toFixed(2)),
      durationSeconds: parseFloat(duration)
    },
    uploads: successful.map(r => ({
      fileName: r.fileName,
      bucket: r.bucket,
      publicUrl: r.publicUrl,
      sizeKB: parseFloat(r.size)
    })),
    errors: failed.map(r => ({
      path: r.path,
      error: r.error
    }))
  };

  const reportPath = path.join(PROJECT_ROOT, 'upload-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`✅ Detailed report saved to: ${reportPath}`);

  console.log('\n🎉 Upload complete!');

  if (failed.length > 0) {
    process.exit(1);
  }
}

// Run main function
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
