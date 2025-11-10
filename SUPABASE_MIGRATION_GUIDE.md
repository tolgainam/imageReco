# Supabase Migration Guide

This guide walks you through migrating your AR Experience from static `products.json` to dynamic Supabase backend.

## Table of Contents

1. [Before You Start](#before-you-start)
2. [Phase 1: Supabase Setup](#phase-1-supabase-setup)
3. [Phase 2: Database Configuration](#phase-2-database-configuration)
4. [Phase 3: Upload Assets](#phase-3-upload-assets)
5. [Phase 4: Migrate Product Data](#phase-4-migrate-product-data)
6. [Phase 5: Update Frontend Code](#phase-5-update-frontend-code)
7. [Phase 6: Testing](#phase-6-testing)
8. [Phase 7: Deployment](#phase-7-deployment)
9. [Rollback Plan](#rollback-plan)
10. [FAQ](#faq)

---

## Before You Start

### Prerequisites

- Existing AR Experience working with `products.json`
- Node.js installed (for migration scripts)
- Supabase account (free tier is fine for testing)
- Git (for version control and rollback)

### What Will Change

✅ **What stays the same:**
- User experience (same AR tracking, UI, interactions)
- Asset files (same .mind, .glb, images)
- Core functionality (MindAR, A-Frame)

🔄 **What changes:**
- Configuration source: `products.json` → Supabase database
- Asset location: Local files → Supabase Storage (CDN)
- Analytics: None → Tracked in database
- Updates: Redeploy → Edit in admin panel

### Estimated Time

- **Testing environment**: 2-3 hours
- **Production migration**: 4-6 hours (including testing)

### Backup Strategy

```bash
# 1. Create backup branch
git checkout -b backup-before-supabase
git add .
git commit -m "Backup before Supabase migration"
git push origin backup-before-supabase

# 2. Create working branch
git checkout main
git checkout -b feature/supabase-integration

# 3. Backup products.json
cp products.json products.json.backup
```

---

## Phase 1: Supabase Setup

### Step 1.1: Create Supabase Project

1. Go to https://supabase.com
2. Click "New Project"
3. Fill in details:
   - **Name**: `ar-experience` (or your project name)
   - **Database Password**: Generate strong password (save it!)
   - **Region**: Choose closest to your users
   - **Plan**: Free (upgrade later if needed)

4. Wait 2-3 minutes for project to initialize

### Step 1.2: Get API Credentials

1. Go to **Project Settings** (gear icon)
2. Click **API** tab
3. Copy and save these values:

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon public key: eyJhbGc...
service_role key: eyJhbGc... (⚠️ Keep secret!)
```

### Step 1.3: Configure Environment

Create `.env` file in project root (add to `.gitignore`):

```bash
# Supabase Configuration
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...

# Feature Flags
ENABLE_SUPABASE=true
FALLBACK_TO_JSON=true
```

Create `.env.example` for reference:

```bash
# Copy this to .env and fill in your values
SUPABASE_URL=your_project_url_here
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_key_here
ENABLE_SUPABASE=true
FALLBACK_TO_JSON=true
```

Add to `.gitignore`:

```
.env
node_modules/
products.json.backup
```

---

## Phase 2: Database Configuration

### Step 2.1: Create Tables

1. Open **Supabase Dashboard** → **SQL Editor**
2. Click **New Query**
3. Copy entire contents of `SUPABASE_SCHEMA.sql`
4. Click **Run** (bottom right)
5. Verify success: Check **Table Editor** - you should see 9 tables

**Expected tables:**
- products
- product_targets
- product_models
- product_ui_config
- product_buttons
- product_interactions
- global_settings
- analytics_events
- product_versions

### Step 2.2: Set Up Security Policies

1. Open **SQL Editor** → **New Query**
2. Copy entire contents of `SUPABASE_RLS_POLICIES.sql`
3. Click **Run**
4. Verify success: Check **Authentication** → **Policies**

**Expected policies:**
- Public users can view published products
- Public users can insert analytics events
- Authenticated users can upload files
- (20+ policies total)

### Step 2.3: Create Storage Buckets

Buckets should be auto-created by RLS policies SQL, but verify:

1. Go to **Storage** tab
2. Verify these buckets exist:
   - `ar-targets` (public)
   - `ar-models` (public)
   - `ar-images` (public)
   - `ar-sounds` (public)

If missing, create manually:
1. Click **New Bucket**
2. Name: `ar-targets`
3. **Public bucket**: ✅ Enable
4. Click **Create bucket**
5. Repeat for other buckets

### Step 2.4: Verify Database Setup

Run this test query in SQL Editor:

```sql
-- Test 1: Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Test 2: Check view works
SELECT * FROM products_complete LIMIT 1;

-- Test 3: Check materialized view
SELECT * FROM products_complete_mv LIMIT 1;

-- Test 4: Check storage buckets
SELECT * FROM storage.buckets;
```

✅ **Success criteria**: All queries return results without errors

---

## Phase 3: Upload Assets

### Step 3.1: Prepare Assets

Organize your current assets:

```
assets/
├── targets/
│   └── zynSpearmint.mind
├── models/
│   └── iluma-i-prime.glb
├── images/
│   └── product-1-preview.jpg
└── sounds/
    └── found.mp3
```

### Step 3.2: Upload to Supabase Storage

**Option A: Manual Upload (Testing)**

1. Go to **Storage** → `ar-targets`
2. Click **Upload file**
3. Select `zynSpearmint.mind`
4. Click **Upload**
5. Repeat for all assets in correct buckets

**Option B: Script Upload (Recommended)**

Create `scripts/upload-assets.js`:

```javascript
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function uploadFile(bucketName, filePath, storagePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);

  console.log(`Uploading ${fileName} to ${bucketName}/${storagePath}...`);

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(storagePath, fileBuffer, {
      contentType: getContentType(fileName),
      upsert: true
    });

  if (error) {
    console.error(`❌ Error uploading ${fileName}:`, error.message);
    return null;
  }

  console.log(`✅ Uploaded ${fileName}`);

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from(bucketName)
    .getPublicUrl(storagePath);

  return publicUrl;
}

function getContentType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const types = {
    '.mind': 'application/octet-stream',
    '.glb': 'model/gltf-binary',
    '.jpg': 'image/jpeg',
    '.png': 'image/png',
    '.mp3': 'audio/mpeg'
  };
  return types[ext] || 'application/octet-stream';
}

async function uploadAllAssets() {
  const uploads = [
    // Targets
    { bucket: 'ar-targets', local: './assets/targets/zynSpearmint.mind', remote: 'zynSpearmint.mind' },

    // Models
    { bucket: 'ar-models', local: './assets/models/iluma-i-prime.glb', remote: 'iluma-i-prime.glb' },

    // Images
    { bucket: 'ar-images', local: './assets/images/product-1-preview.jpg', remote: 'product-1-preview.jpg' },

    // Sounds (if any)
    // { bucket: 'ar-sounds', local: './assets/sounds/found.mp3', remote: 'found.mp3' },
  ];

  const results = {};

  for (const upload of uploads) {
    const url = await uploadFile(upload.bucket, upload.local, upload.remote);
    if (url) {
      results[upload.local] = url;
    }
  }

  console.log('\n📋 Upload Summary:');
  console.log(JSON.stringify(results, null, 2));

  // Save URLs for migration script
  fs.writeFileSync('asset-urls.json', JSON.stringify(results, null, 2));
  console.log('\n✅ Saved URLs to asset-urls.json');
}

uploadAllAssets();
```

Install dependencies:

```bash
npm install @supabase/supabase-js dotenv
```

Run upload script:

```bash
node scripts/upload-assets.js
```

### Step 3.3: Verify Uploads

1. Go to **Storage** in Supabase Dashboard
2. Check each bucket has files
3. Click any file → **Get URL** → Copy
4. Open URL in browser to verify it loads

---

## Phase 4: Migrate Product Data

### Step 4.1: Analyze Current products.json

Create `scripts/analyze-products.js`:

```javascript
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('./products.json', 'utf8'));

console.log('📦 Products to migrate:', config.products.length);
console.log('\nProducts:');
config.products.forEach((p, i) => {
  console.log(`  ${i + 1}. ${p.name} (${p.id})`);
  console.log(`     Target: ${p.target.imagePath}`);
  console.log(`     Model: ${p.model.path}`);
  console.log(`     Buttons: ${p.ui.buttons?.length || 0}`);
});

console.log('\n📊 Global Settings:');
console.log(`  Multiple targets: ${config.globalSettings.multipleTargets}`);
console.log(`  Max simultaneous: ${config.globalSettings.maxSimultaneousTargets}`);
```

Run analysis:

```bash
node scripts/analyze-products.js
```

### Step 4.2: Create Migration Script

Create `scripts/migrate-to-supabase.js`:

```javascript
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function migrateProducts() {
  console.log('🚀 Starting migration to Supabase...\n');

  // 1. Load products.json
  const config = JSON.parse(fs.readFileSync('./products.json', 'utf8'));

  // 2. Load asset URLs (from upload script)
  const assetUrls = JSON.parse(fs.readFileSync('./asset-urls.json', 'utf8'));

  // 3. Migrate global settings
  console.log('📋 Migrating global settings...');
  const { data: globalSettings, error: globalError } = await supabase
    .from('global_settings')
    .insert({
      setting_key: 'default',
      multiple_targets: config.globalSettings.multipleTargets,
      max_simultaneous_targets: config.globalSettings.maxSimultaneousTargets,
      default_colors: config.globalSettings.defaultColors,
      loading_config: config.globalSettings.loading,
      instructions_config: config.globalSettings.instructions
    })
    .select()
    .single();

  if (globalError) {
    console.error('❌ Error migrating global settings:', globalError);
    return;
  }
  console.log('✅ Global settings migrated\n');

  // 4. Migrate each product
  for (const product of config.products) {
    console.log(`📦 Migrating product: ${product.name}...`);

    // 4a. Insert product
    const { data: productData, error: productError } = await supabase
      .from('products')
      .insert({
        product_id: product.id,
        name: product.name,
        description: product.description,
        target_index: product.targetIndex,
        status: 'published'
      })
      .select()
      .single();

    if (productError) {
      console.error(`❌ Error migrating product ${product.name}:`, productError);
      continue;
    }

    const productId = productData.id;

    // 4b. Insert target
    const targetUrl = assetUrls[product.target.imagePath] || product.target.imagePath;
    await supabase.from('product_targets').insert({
      product_id: productId,
      image_path: targetUrl,
      image_preview: product.target.imagePreview
    });

    // 4c. Insert model
    const modelUrl = assetUrls[product.model.path] || product.model.path;
    await supabase.from('product_models').insert({
      product_id: productId,
      model_path: modelUrl,
      position_x: product.model.position.x,
      position_y: product.model.position.y,
      position_z: product.model.position.z,
      rotation_x: product.model.rotation?.x || 0,
      rotation_y: product.model.rotation?.y || 0,
      rotation_z: product.model.rotation?.z || 0,
      scale_x: product.model.scale.x,
      scale_y: product.model.scale.y,
      scale_z: product.model.scale.z,
      animation_enabled: product.model.animation?.enabled || false,
      animation_clip: product.model.animation?.clip,
      animation_loop: product.model.animation?.loop
    });

    // 4d. Insert UI config
    const { data: uiData } = await supabase.from('product_ui_config').insert({
      product_id: productId,
      primary_color: product.ui.colors.primary,
      secondary_color: product.ui.colors.secondary,
      background_color: product.ui.colors.background,
      text_color: product.ui.colors.text,
      title: product.ui.content.title,
      subtitle: product.ui.content.subtitle,
      description: product.ui.content.description,
      features: product.ui.content.features
    }).select().single();

    // 4e. Insert buttons
    if (product.ui.buttons && product.ui.buttons.length > 0) {
      const buttons = product.ui.buttons.map(btn => ({
        ui_config_id: uiData.id,
        button_id: btn.id,
        label: btn.label,
        icon: btn.icon,
        link: btn.link,
        style: btn.style,
        position: btn.position
      }));

      await supabase.from('product_buttons').insert(buttons);
    }

    // 4f. Insert interactions
    await supabase.from('product_interactions').insert({
      product_id: productId,
      on_found_show_ui: product.interactions.onFound.showUI,
      on_found_play_sound: product.interactions.onFound.playSound,
      on_found_sound_path: product.interactions.onFound.soundPath,
      on_lost_hide_ui: product.interactions.onLost.hideUI,
      on_lost_pause_animation: product.interactions.onLost.pauseAnimation
    });

    console.log(`✅ Migrated ${product.name}\n`);
  }

  console.log('🎉 Migration complete!');

  // 5. Verify migration
  const { data: allProducts, error: verifyError } = await supabase
    .from('products_complete')
    .select('*');

  if (verifyError) {
    console.error('❌ Error verifying migration:', verifyError);
    return;
  }

  console.log(`\n✅ Verified ${allProducts.length} products in database`);

  // 6. Refresh materialized view
  await supabase.rpc('exec', {
    sql: 'REFRESH MATERIALIZED VIEW CONCURRENTLY products_complete_mv;'
  });

  console.log('✅ Refreshed materialized view');
}

migrateProducts();
```

### Step 4.3: Run Migration

```bash
node scripts/migrate-to-supabase.js
```

**Expected output:**
```
🚀 Starting migration to Supabase...

📋 Migrating global settings...
✅ Global settings migrated

📦 Migrating product: Example Product 1...
✅ Migrated Example Product 1

🎉 Migration complete!
✅ Verified 1 products in database
✅ Refreshed materialized view
```

### Step 4.4: Verify Data in Supabase

1. Go to **Table Editor** → `products`
2. Verify you see your product(s)
3. Check **View** → `products_complete`
4. Verify JSON structure matches products.json

---

## Phase 5: Update Frontend Code

### Step 5.1: Add Supabase Client Library

Update `index.html` - add before `</head>`:

```html
<!-- Supabase Client (CDN) -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

### Step 5.2: Create Configuration File

Create `js/config.js`:

```javascript
// Configuration for Supabase integration
const CONFIG = {
  // Feature flags
  features: {
    supabaseEnabled: true,  // Set to false to use products.json
    analyticsEnabled: true,
    fallbackToJSON: true    // Fallback to products.json if Supabase fails
  },

  // Supabase credentials (from .env or hardcoded for client)
  supabase: {
    url: 'https://xxxxxxxxxxxxx.supabase.co',
    anonKey: 'eyJhbGc...' // Safe to expose in client-side code
  },

  // Paths
  paths: {
    productsJSON: './products.json',
    assetsLocal: './assets'
  },

  // Analytics configuration
  analytics: {
    sessionId: generateSessionId(),
    trackEvents: [
      'product_found',
      'product_lost',
      'button_clicked',
      'model_loaded',
      'error_occurred'
    ]
  }
};

function generateSessionId() {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Make config globally available
window.CONFIG = CONFIG;
```

### Step 5.3: Create Supabase Client

Create `js/supabase-client.js`:

```javascript
class SupabaseClient {
  constructor() {
    if (!window.CONFIG?.supabase?.url || !window.CONFIG?.supabase?.anonKey) {
      console.warn('⚠️ Supabase credentials not configured');
      this.client = null;
      return;
    }

    this.client = window.supabase.createClient(
      window.CONFIG.supabase.url,
      window.CONFIG.supabase.anonKey
    );

    console.log('✅ Supabase client initialized');
  }

  async getProducts() {
    if (!this.client) {
      throw new Error('Supabase client not initialized');
    }

    const { data, error } = await this.client
      .from('products_complete')
      .select('*')
      .order('target_index');

    if (error) {
      console.error('❌ Error fetching products:', error);
      throw error;
    }

    return data;
  }

  async trackEvent(eventType, productId = null, metadata = {}) {
    if (!this.client || !window.CONFIG.features.analyticsEnabled) {
      return;
    }

    const event = {
      event_type: eventType,
      product_id: productId,
      session_id: window.CONFIG.analytics.sessionId,
      metadata: metadata,
      timestamp: new Date().toISOString()
    };

    const { error } = await this.client
      .from('analytics_events')
      .insert(event);

    if (error) {
      console.error('❌ Analytics error:', error);
    } else {
      console.log('📊 Event tracked:', eventType);
    }
  }
}

window.SupabaseClient = SupabaseClient;
```

### Step 5.4: Create Supabase Config Loader

Create `js/supabase-config-loader.js`:

```javascript
class SupabaseConfigLoader extends ARConfigLoader {
  constructor() {
    super();
    this.supabaseClient = new SupabaseClient();
    this.useSupabase = window.CONFIG?.features?.supabaseEnabled && this.supabaseClient.client;
  }

  async loadConfig() {
    console.log(`🔄 Loading config from ${this.useSupabase ? 'Supabase' : 'products.json'}...`);

    try {
      if (this.useSupabase) {
        return await this.loadFromSupabase();
      } else {
        return await super.loadConfig();
      }
    } catch (error) {
      console.error('❌ Error loading from Supabase:', error);

      if (window.CONFIG?.features?.fallbackToJSON) {
        console.warn('⚠️ Falling back to products.json...');
        this.useSupabase = false;
        return await super.loadConfig();
      }

      throw error;
    }
  }

  async loadFromSupabase() {
    const products = await this.supabaseClient.getProducts();

    if (!products || products.length === 0) {
      throw new Error('No products found in Supabase');
    }

    // Convert Supabase format to products.json format
    this.config = {
      products: products.map(p => ({
        id: p.product_id,
        name: p.name,
        description: p.description,
        targetIndex: p.target_index,
        target: p.target,
        model: this.convertModel(p.models?.[0]),
        ui: p.ui,
        interactions: p.interactions
      })),
      globalSettings: {} // Load from global_settings table if needed
    };

    this.products = this.config.products;
    this.validateTargets();
    this.updateSceneConfig();

    console.log('✅ Configuration loaded from Supabase');
    console.log(`📦 Products found: ${this.products.length}`);

    // Track page load
    await this.supabaseClient.trackEvent('page_loaded');

    return this.config;
  }

  convertModel(modelData) {
    if (!modelData) return null;

    return {
      path: modelData.model_path,
      position: {
        x: modelData.position_x,
        y: modelData.position_y,
        z: modelData.position_z
      },
      rotation: {
        x: modelData.rotation_x,
        y: modelData.rotation_y,
        z: modelData.rotation_z
      },
      scale: {
        x: modelData.scale_x,
        y: modelData.scale_y,
        z: modelData.scale_z
      },
      animation: {
        enabled: modelData.animation_enabled,
        clip: modelData.animation_clip,
        loop: modelData.animation_loop
      }
    };
  }

  // Override event tracking to use Supabase
  async onProductFound(productId) {
    await super.onProductFound(productId);

    if (this.useSupabase) {
      await this.supabaseClient.trackEvent('product_found', productId);
    }
  }

  async onProductLost(productId) {
    await super.onProductLost(productId);

    if (this.useSupabase) {
      await this.supabaseClient.trackEvent('product_lost', productId);
    }
  }

  async trackButtonClick(productId, buttonId) {
    if (this.useSupabase) {
      await this.supabaseClient.trackEvent('button_clicked', productId, { buttonId });
    }
  }
}

window.SupabaseConfigLoader = SupabaseConfigLoader;
```

### Step 5.5: Update index.html

Update script loading order in `index.html`:

```html
<!-- Configuration (NEW - load first) -->
<script src="./js/config.js"></script>

<!-- Supabase Integration (NEW) -->
<script src="./js/supabase-client.js"></script>
<script src="./js/supabase-config-loader.js"></script>

<!-- Existing scripts -->
<script src="./js/config-loader.js"></script>
<script src="./js/product-ui.js"></script>
<script src="./js/app.js"></script>

<script>
  // Initialize with feature flag
  const useSupabase = window.CONFIG?.features?.supabaseEnabled ?? false;
  const ConfigLoader = useSupabase ? SupabaseConfigLoader : ARConfigLoader;

  const arConfig = new ConfigLoader();

  // Initialize app when DOM ready
  document.addEventListener('DOMContentLoaded', async () => {
    try {
      await arConfig.loadConfig();
      await arConfig.generateScene();

      // Initialize AR when scene is loaded
      const scene = document.querySelector('a-scene');
      scene.addEventListener('arReady', () => {
        arConfig.startAR();
      });
    } catch (error) {
      console.error('❌ Initialization error:', error);
      document.body.innerHTML = `
        <div style="text-align: center; padding: 50px;">
          <h1>Error Loading AR Experience</h1>
          <p>${error.message}</p>
          <p>Please try again later.</p>
        </div>
      `;
    }
  });
</script>
```

---

## Phase 6: Testing

### Step 6.1: Test with Supabase Enabled

1. Update `js/config.js`:
```javascript
features: {
  supabaseEnabled: true,
  analyticsEnabled: true,
  fallbackToJSON: true
}
```

2. Update Supabase credentials in `js/config.js`

3. Start local server:
```bash
python3 -m http.server 8000
```

4. Open browser console and check for:
```
✅ Supabase client initialized
🔄 Loading config from Supabase...
✅ Configuration loaded from Supabase
📦 Products found: 1
```

5. Test AR tracking with your target image

6. Verify analytics in Supabase:
   - Go to **Table Editor** → `analytics_events`
   - You should see `page_loaded`, `product_found` events

### Step 6.2: Test Fallback to products.json

1. In `js/config.js`, set invalid Supabase URL

2. Reload page

3. Check console for:
```
❌ Error loading from Supabase: ...
⚠️ Falling back to products.json...
✅ Configuration loaded successfully
```

4. Verify AR still works

### Step 6.3: Test with Supabase Disabled

1. Update `js/config.js`:
```javascript
features: {
  supabaseEnabled: false,
  // ...
}
```

2. Reload page

3. Check console for:
```
🔄 Loading config from products.json...
✅ Configuration loaded successfully
```

4. Verify AR works

### Step 6.4: Testing Checklist

- [ ] Supabase configuration loads successfully
- [ ] Products display correctly from database
- [ ] 3D models load from Supabase Storage CDN
- [ ] Image targets work (.mind files from CDN)
- [ ] UI shows with correct colors and content
- [ ] Buttons work and analytics tracked
- [ ] Fallback to products.json works if Supabase fails
- [ ] Analytics events appear in database
- [ ] Performance is acceptable (measure load time)
- [ ] Works on mobile device
- [ ] Works on desktop browser

---

## Phase 7: Deployment

### Step 7.1: Production Checklist

- [ ] All assets uploaded to Supabase Storage
- [ ] Database populated with all products
- [ ] RLS policies verified and tested
- [ ] Analytics working correctly
- [ ] Materialized view refreshed
- [ ] Environment variables configured
- [ ] `.env` file added to `.gitignore`
- [ ] Backup of products.json created
- [ ] Git branch created for rollback

### Step 7.2: Update Production Config

Create production version of `js/config.js`:

```javascript
const CONFIG = {
  features: {
    supabaseEnabled: true,
    analyticsEnabled: true,
    fallbackToJSON: true  // Keep enabled for safety
  },
  supabase: {
    url: 'https://YOUR-PRODUCTION-PROJECT.supabase.co',
    anonKey: 'YOUR-PRODUCTION-ANON-KEY'
  },
  // ...
};
```

### Step 7.3: Deploy

**Option A: GitHub Pages**

```bash
git add .
git commit -m "Add Supabase integration"
git push origin feature/supabase-integration
# Create PR and merge to main
# GitHub Pages will auto-deploy
```

**Option B: Vercel/Netlify**

1. Push to main branch
2. Platform auto-deploys from main

**Option C: Custom Server**

```bash
# Upload files via FTP/SFTP
# Or use deployment script
rsync -avz --exclude '.git' --exclude 'node_modules' ./ user@server:/var/www/ar-experience/
```

### Step 7.4: Post-Deployment Verification

1. Visit production URL
2. Open browser console
3. Verify Supabase loads successfully
4. Test AR tracking
5. Check analytics in Supabase dashboard
6. Monitor for errors

### Step 7.5: Monitor Performance

1. Check Supabase Dashboard → **Database** → **Usage**
2. Monitor CDN bandwidth usage
3. Check analytics events count
4. Verify materialized view is refreshing (set up cron if needed)

---

## Rollback Plan

### If You Need to Rollback

**Immediate rollback (disable Supabase, use products.json):**

Update `js/config.js`:
```javascript
features: {
  supabaseEnabled: false,  // ← Change this
  // ...
}
```

Redeploy. System will use products.json immediately.

**Full rollback (remove Supabase integration):**

```bash
# 1. Switch to backup branch
git checkout backup-before-supabase

# 2. Create new branch from backup
git checkout -b rollback-supabase

# 3. Push to production
git push origin rollback-supabase -f

# 4. Deploy from rollback branch
```

---

## FAQ

### Q: Can I run Supabase and products.json simultaneously?

**A:** Yes! Set `supabaseEnabled: true` and `fallbackToJSON: true`. If Supabase fails, it automatically uses products.json.

### Q: Do I have to migrate all products at once?

**A:** No. You can migrate one product at a time. Keep others in products.json and set `supabaseEnabled: false` until ready.

### Q: What if I want to update a product?

**With products.json:**
1. Edit products.json
2. Redeploy

**With Supabase:**
1. Edit in Supabase Table Editor or admin panel
2. Changes are live immediately (no redeploy)

### Q: How much does Supabase cost?

**Free tier:**
- 500 MB database
- 1 GB file storage
- 2 GB bandwidth/month
- Should handle ~10,000 AR sessions/month

**Pro tier ($25/mo):**
- 8 GB database
- 100 GB file storage
- 50 GB bandwidth/month
- ~100,000 AR sessions/month

### Q: Can I use my own CDN instead of Supabase Storage?

**A:** Yes! Store URLs in database instead of using Storage:

```sql
UPDATE product_models
SET model_path = 'https://your-cdn.com/model.glb'
WHERE product_id = 'product-1';
```

### Q: How do I backup my Supabase data?

**Option 1: SQL Backup**
```bash
# Supabase Dashboard → Database → Backups → Download
```

**Option 2: Export to JSON**
```javascript
// Create backup script
const { data } = await supabase.from('products_complete').select('*');
fs.writeFileSync('backup.json', JSON.stringify(data, null, 2));
```

### Q: What if Supabase goes down?

With `fallbackToJSON: true`, the system automatically falls back to products.json. Keep products.json updated as a backup.

### Q: How do I add a new product after migration?

**Option 1: Supabase Dashboard**
1. Go to Table Editor → `products`
2. Insert New Row → Fill in data
3. Add related rows in other tables

**Option 2: Admin Panel (recommended)**
- Build simple admin panel (see `SUPABASE_INTEGRATION.md` section 9)

**Option 3: SQL**
```sql
-- Use the same INSERT structure from migration script
INSERT INTO products (product_id, name, ...) VALUES (...);
```

### Q: Can I preview changes before publishing?

**A:** Yes! Use the `status` field:

```sql
-- Draft product (not visible to public)
UPDATE products SET status = 'draft' WHERE product_id = 'new-product';

-- Preview in admin panel (authenticated users can see all)

-- Publish when ready
UPDATE products SET status = 'published' WHERE product_id = 'new-product';
```

---

## Next Steps

After successful migration:

1. **Set up admin panel** (optional but recommended)
   - See `SUPABASE_INTEGRATION.md` Section 9
   - Allows non-technical users to update products

2. **Set up automated backups**
   - Schedule daily SQL exports
   - Download to local storage

3. **Monitor analytics**
   - Create dashboard queries
   - Track popular products
   - Monitor error rates

4. **Optimize performance**
   - Set up materialized view refresh cron
   - Enable Cloudflare CDN
   - Optimize image/model sizes

5. **Scale as needed**
   - Upgrade Supabase plan when limits reached
   - Add caching layer if needed
   - Consider edge functions for advanced features

---

**Questions or Issues?**

- Supabase Docs: https://supabase.com/docs
- Supabase Support: https://supabase.com/dashboard/support
- Project README: `SUPABASE_INTEGRATION.md`

---

**Last Updated**: 2025-11-10
