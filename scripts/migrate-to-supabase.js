#!/usr/bin/env node

/**
 * Migrate products.json to Supabase Database
 *
 * This script migrates product configuration from products.json to Supabase:
 * - Reads products.json
 * - Reads asset-urls.json (from upload-assets.js)
 * - Inserts products into database
 * - Inserts related data (targets, models, UI, buttons, interactions)
 * - Inserts global settings
 * - Refreshes materialized view
 *
 * Usage:
 *   node scripts/migrate-to-supabase.js
 *
 * Prerequisites:
 *   1. Run upload-assets.js first to upload files and generate asset-urls.json
 *   2. npm install @supabase/supabase-js dotenv
 *   3. Create .env file with SUPABASE_URL and SUPABASE_SERVICE_KEY
 *   4. Run SUPABASE_SCHEMA.sql and SUPABASE_RLS_POLICIES.sql in Supabase
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

// Project root directory
const PROJECT_ROOT = path.join(__dirname, '..');

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Load JSON file
 */
function loadJSON(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Error loading ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Replace local paths with Supabase URLs
 */
function replaceWithSupabaseUrl(localPath, assetUrls) {
  if (!localPath) return null;

  // Check if already a URL
  if (localPath.startsWith('http://') || localPath.startsWith('https://')) {
    return localPath;
  }

  // Try exact match
  const url = assetUrls[localPath];
  if (url) {
    return url;
  }

  // Try without leading ./
  const normalizedPath = localPath.replace(/^\.\//, '');
  const urlNormalized = assetUrls[`./${normalizedPath}`] || assetUrls[normalizedPath];
  if (urlNormalized) {
    return urlNormalized;
  }

  // Try to find by filename (asset-urls has absolute paths)
  const filename = path.basename(localPath);
  for (const [key, value] of Object.entries(assetUrls)) {
    if (key.endsWith(filename)) {
      return value;
    }
  }

  // Path not found in mapping
  console.warn(`⚠️ Asset URL not found for: ${localPath} (keeping original path)`);
  return localPath;
}

// ============================================================================
// MIGRATION FUNCTIONS
// ============================================================================

/**
 * Migrate global settings
 */
async function migrateGlobalSettings(globalSettings) {
  console.log('\n📋 Migrating global settings...\n');

  try {
    // The global_settings table uses a key-value JSONB structure
    // Update the existing settings or insert new ones

    // AR config
    await supabase
      .from('global_settings')
      .upsert({
        setting_key: 'ar_config',
        setting_value: {
          multipleTargets: globalSettings.multipleTargets ?? true,
          maxSimultaneousTargets: globalSettings.maxSimultaneousTargets ?? 3
        },
        description: 'AR system configuration'
      }, {
        onConflict: 'setting_key'
      });

    // Default colors
    await supabase
      .from('global_settings')
      .upsert({
        setting_key: 'default_colors',
        setting_value: globalSettings.defaultColors ?? {
          primary: '#4CC3D9',
          secondary: '#667eea',
          background: 'rgba(0, 0, 0, 0.85)',
          text: '#ffffff'
        },
        description: 'Default UI colors'
      }, {
        onConflict: 'setting_key'
      });

    // Loading config
    if (globalSettings.loading) {
      await supabase
        .from('global_settings')
        .upsert({
          setting_key: 'loading_config',
          setting_value: globalSettings.loading,
          description: 'Loading screen configuration'
        }, {
          onConflict: 'setting_key'
        });
    }

    // Instructions config
    if (globalSettings.instructions) {
      await supabase
        .from('global_settings')
        .upsert({
          setting_key: 'instructions_config',
          setting_value: globalSettings.instructions,
          description: 'Instructions screen configuration'
        }, {
          onConflict: 'setting_key'
        });
    }

    console.log('✅ Global settings migrated successfully\n');
    return true;

  } catch (error) {
    console.error('❌ Exception migrating global settings:', error);
    return null;
  }
}

/**
 * Migrate single product
 */
async function migrateProduct(product, assetUrls) {
  console.log(`\n📦 Migrating product: ${product.name}...\n`);

  try {
    // 1. Insert product
    console.log('   1️⃣ Inserting product record...');
    let { data: productData, error: productError } = await supabase
      .from('products')
      .insert({
        product_id: product.id,
        name: product.name,
        description: product.description || '',
        target_index: product.targetIndex,
        status: 'published'
      })
      .select()
      .single();

    if (productError) {
      // Check if already exists
      if (productError.code === '23505') {
        console.log('   ℹ️ Product already exists, updating...');

        const { data: existingProduct } = await supabase
          .from('products')
          .update({
            name: product.name,
            description: product.description || '',
            target_index: product.targetIndex
          })
          .eq('product_id', product.id)
          .select()
          .single();

        if (!existingProduct) {
          console.error('   ❌ Error updating existing product');
          return { success: false, product: product.id };
        }

        productData = existingProduct;
      } else {
        console.error('   ❌ Error inserting product:', productError);
        return { success: false, product: product.id, error: productError };
      }
    }

    const productId = productData.id;
    console.log(`   ✅ Product record created (ID: ${productId})`);

    // 2. Insert target
    console.log('   2️⃣ Inserting target...');
    const targetPath = replaceWithSupabaseUrl(product.target.imagePath, assetUrls);
    const targetPreview = product.target.imagePreview
      ? replaceWithSupabaseUrl(product.target.imagePreview, assetUrls)
      : null;

    await supabase.from('product_targets').delete().eq('product_id', productId);
    const { error: targetError } = await supabase
      .from('product_targets')
      .insert({
        product_id: productId,
        mind_file_path: product.target.imagePath,
        mind_file_url: targetPath,
        preview_image_path: product.target.imagePreview,
        preview_image_url: targetPreview
      });

    if (targetError) {
      console.error('   ❌ Error inserting target:', targetError);
    } else {
      console.log('   ✅ Target inserted');
    }

    // 3. Insert model
    console.log('   3️⃣ Inserting model...');
    const modelUrl = replaceWithSupabaseUrl(product.model.path, assetUrls);

    await supabase.from('product_models').delete().eq('product_id', productId);
    const { error: modelError } = await supabase
      .from('product_models')
      .insert({
        product_id: productId,
        model_id: product.id + '_model',
        glb_file_path: product.model.path,
        glb_file_url: modelUrl,
        position_x: product.model.position?.x ?? 0,
        position_y: product.model.position?.y ?? 0,
        position_z: product.model.position?.z ?? 0,
        rotation_x: product.model.rotation?.x ?? 0,
        rotation_y: product.model.rotation?.y ?? 0,
        rotation_z: product.model.rotation?.z ?? 0,
        scale_x: product.model.scale?.x ?? 1,
        scale_y: product.model.scale?.y ?? 1,
        scale_z: product.model.scale?.z ?? 1,
        animation_enabled: product.model.animation?.enabled ?? false,
        animation_clip: product.model.animation?.clip ?? '*',
        animation_loop: product.model.animation?.loop ?? 'repeat'
      });

    if (modelError) {
      console.error('   ❌ Error inserting model:', modelError);
    } else {
      console.log('   ✅ Model inserted');
    }

    // 4. Insert UI config
    console.log('   4️⃣ Inserting UI configuration...');

    await supabase.from('product_ui_config').delete().eq('product_id', productId);
    const { data: uiData, error: uiError } = await supabase
      .from('product_ui_config')
      .insert({
        product_id: productId,
        color_primary: product.ui.colors?.primary ?? '#4CC3D9',
        color_secondary: product.ui.colors?.secondary ?? '#667eea',
        color_background: product.ui.colors?.background ?? 'rgba(0, 0, 0, 0.85)',
        color_text: product.ui.colors?.text ?? '#ffffff',
        title: product.ui.content?.title ?? product.name,
        subtitle: product.ui.content?.subtitle ?? '',
        description_text: product.ui.content?.description ?? '',
        features: product.ui.content?.features ?? []
      })
      .select()
      .single();

    if (uiError) {
      console.error('   ❌ Error inserting UI config:', uiError);
    } else {
      console.log('   ✅ UI configuration inserted');
    }

    // 5. Insert buttons
    if (product.ui.buttons && product.ui.buttons.length > 0) {
      console.log(`   5️⃣ Inserting ${product.ui.buttons.length} button(s)...`);

      await supabase.from('product_buttons').delete().eq('product_id', productId);

      const buttons = product.ui.buttons.map((btn, index) => ({
        product_id: productId,
        button_id: btn.id,
        label: btn.label,
        icon: btn.icon ?? '',
        link: btn.link ?? '',
        button_style: btn.style ?? 'primary',
        button_order: index,
        position: btn.position ?? 'bottom-left'
      }));

      const { error: buttonsError } = await supabase
        .from('product_buttons')
        .insert(buttons);

      if (buttonsError) {
        console.error('   ❌ Error inserting buttons:', buttonsError);
      } else {
        console.log(`   ✅ ${buttons.length} button(s) inserted`);
      }
    } else {
      console.log('   5️⃣ No buttons to insert');
    }

    // 6. Insert interactions
    console.log('   6️⃣ Inserting interactions...');
    const soundPath = product.interactions?.onFound?.soundPath
      ? replaceWithSupabaseUrl(product.interactions.onFound.soundPath, assetUrls)
      : null;

    await supabase.from('product_interactions').delete().eq('product_id', productId);
    const { error: interactionsError } = await supabase
      .from('product_interactions')
      .insert({
        product_id: productId,
        on_found_show_ui: product.interactions?.onFound?.showUI ?? true,
        on_found_play_sound: product.interactions?.onFound?.playSound ?? false,
        on_found_sound_path: soundPath,
        on_lost_hide_ui: product.interactions?.onLost?.hideUI ?? true,
        on_lost_pause_animation: product.interactions?.onLost?.pauseAnimation ?? false
      });

    if (interactionsError) {
      console.error('   ❌ Error inserting interactions:', interactionsError);
    } else {
      console.log('   ✅ Interactions inserted');
    }

    console.log(`\n✅ Product "${product.name}" migrated successfully!\n`);

    return { success: true, product: product.id, productId: productId };

  } catch (error) {
    console.error(`\n❌ Exception migrating product "${product.name}":`, error);
    return { success: false, product: product.id, error: error.message };
  }
}

/**
 * Refresh materialized view
 */
async function refreshMaterializedView() {
  console.log('\n🔄 Refreshing materialized view...\n');

  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql: 'REFRESH MATERIALIZED VIEW CONCURRENTLY products_complete_mv;'
    });

    if (error) {
      // Try without RPC (might not be available)
      console.log('   ℹ️ Cannot refresh via RPC, skipping materialized view refresh');
      console.log('   💡 Manually run: REFRESH MATERIALIZED VIEW products_complete_mv;');
    } else {
      console.log('✅ Materialized view refreshed\n');
    }

  } catch (error) {
    console.log('   ℹ️ Materialized view refresh skipped (not critical)');
  }
}

/**
 * Verify migration
 */
async function verifyMigration() {
  console.log('\n🔍 Verifying migration...\n');

  try {
    // Check products_complete view
    const { data, error } = await supabase
      .from('products_complete')
      .select('*');

    if (error) {
      console.error('❌ Error querying products_complete view:', error);
      return false;
    }

    console.log(`✅ Found ${data.length} product(s) in products_complete view\n`);

    data.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.name} (${p.product_id})`);
    });

    return true;

  } catch (error) {
    console.error('❌ Exception during verification:', error);
    return false;
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('🚀 Starting migration to Supabase...\n');
  console.log(`📍 Supabase URL: ${SUPABASE_URL}\n`);

  const startTime = Date.now();

  // 1. Load products.json
  console.log('📄 Loading products.json...\n');
  const config = loadJSON(path.join(PROJECT_ROOT, 'products.json'));

  if (!config) {
    console.error('❌ Failed to load products.json');
    process.exit(1);
  }

  console.log(`✅ Loaded ${config.products.length} product(s) from products.json\n`);

  // 2. Load asset URLs
  console.log('📄 Loading asset-urls.json...\n');
  const assetUrls = loadJSON(path.join(PROJECT_ROOT, 'asset-urls.json')) || {};

  if (Object.keys(assetUrls).length === 0) {
    console.warn('⚠️ No asset URLs found. Run upload-assets.js first or assets will use local paths.\n');
  } else {
    console.log(`✅ Loaded ${Object.keys(assetUrls).length} asset URL mapping(s)\n`);
  }

  // 3. Migrate global settings
  await migrateGlobalSettings(config.globalSettings || {});

  // 4. Migrate products
  const results = [];
  for (const product of config.products) {
    const result = await migrateProduct(product, assetUrls);
    results.push(result);
  }

  // 5. Refresh materialized view
  await refreshMaterializedView();

  // 6. Verify migration
  const verified = await verifyMigration();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 MIGRATION SUMMARY');
  console.log('='.repeat(60) + '\n');

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`✅ Successfully migrated: ${successful.length}`);
  console.log(`❌ Failed migrations: ${failed.length}`);
  console.log(`📊 Total products: ${results.length}`);
  console.log(`🔍 Verification: ${verified ? '✅ Passed' : '❌ Failed'}`);

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`⏱️ Duration: ${duration}s`);

  if (failed.length > 0) {
    console.log('\n❌ Failed Migrations:');
    failed.forEach(r => {
      console.log(`   - ${r.product}: ${r.error || 'Unknown error'}`);
    });
  }

  // Save migration report
  const report = {
    timestamp: new Date().toISOString(),
    supabaseUrl: SUPABASE_URL,
    summary: {
      total: results.length,
      successful: successful.length,
      failed: failed.length,
      verified: verified,
      durationSeconds: parseFloat(duration)
    },
    migrations: results
  };

  const reportPath = path.join(PROJECT_ROOT, 'migration-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n✅ Migration report saved to: ${reportPath}`);

  console.log('\n🎉 Migration complete!');

  if (!verified || failed.length > 0) {
    process.exit(1);
  }
}

// Run main function
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
