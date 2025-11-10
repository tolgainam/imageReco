# Changelog

## [2.0.0] - 2025-11-10 - Supabase Integration

### Added

#### Complete Supabase Backend Integration
- **Dynamic product management** via Supabase database
- **Real-time analytics tracking** for user interactions
- **CDN-powered asset delivery** via Supabase Storage
- **Automatic fallback** to products.json if Supabase unavailable
- **Feature flag system** for easy toggling between Supabase and static JSON

#### New Documentation Files
- **SUPABASE_INTEGRATION.md** - Complete integration guide
  - Architecture overview with diagrams
  - Database schema documentation
  - API integration patterns
  - File storage strategy (4 buckets)
  - Security policies (RLS)
  - Code changes overview
  - Migration instructions
  - Performance optimizations
  - Admin interface requirements
  - Cost estimates ($25/mo Pro plan recommended)

- **SUPABASE_MIGRATION_GUIDE.md** - Step-by-step migration guide
  - 7-phase migration process
  - Supabase project setup
  - Database configuration
  - Asset upload instructions
  - Data migration steps
  - Testing checklist
  - Deployment guide
  - Rollback plan
  - FAQ section

- **SUPABASE_SCHEMA.sql** - Complete database schema
  - 8 core tables (products, product_targets, product_models, product_ui_config, product_buttons, product_interactions, global_settings, analytics_events)
  - 1 versioning table (product_versions)
  - Indexes for performance
  - Triggers for auto-updating timestamps
  - Function to save product versions automatically
  - View `products_complete` returning JSON matching products.json format
  - Materialized view `products_complete_mv` for faster queries
  - Utility functions (get_product_count_by_status, get_popular_products)

- **SUPABASE_RLS_POLICIES.sql** - Row Level Security policies
  - Public read access for published products
  - Public insert-only access for analytics
  - Authenticated user policies
  - Storage bucket policies (4 buckets)
  - Performance indexes for RLS checks
  - Testing queries
  - Admin setup examples

#### New JavaScript Files

- **js/config.js** - Central configuration system
  - Feature flags (supabaseEnabled, analyticsEnabled, fallbackToJSON)
  - Supabase credentials (url, anonKey)
  - Analytics configuration
  - Performance settings (caching, timeouts)
  - Debug options
  - Environment detection (dev/prod)
  - Configuration validation

- **js/supabase-client.js** - Supabase client wrapper
  - Product data fetching (`getProducts()`, `getProduct()`, `getGlobalSettings()`)
  - Analytics tracking (`trackEvent()`, `trackProductFound()`, `trackButtonClick()`)
  - Event batching system
  - Cache management
  - Connection checking
  - Storage URL helpers
  - File upload support
  - Real-time subscriptions support

- **js/supabase-config-loader.js** - Supabase-aware config loader
  - Extends `ARConfigLoader`
  - Loads products from Supabase database
  - Automatic fallback to products.json on error
  - Data format conversion (Supabase → products.json format)
  - Integrated analytics tracking for all events
  - Real-time updates support (optional)
  - Performance monitoring
  - Switch between Supabase/JSON modes at runtime

#### Migration Scripts

- **scripts/upload-assets.js** - Asset upload automation
  - Uploads .mind files to ar-targets bucket
  - Uploads .glb files to ar-models bucket
  - Uploads images to ar-images bucket
  - Uploads sounds to ar-sounds bucket
  - Generates asset-urls.json mapping
  - Detailed progress reporting
  - Error handling and retry logic
  - Upload summary with file sizes

- **scripts/migrate-to-supabase.js** - Data migration automation
  - Reads products.json
  - Reads asset-urls.json
  - Migrates global settings
  - Migrates all products with related data
  - Replaces local paths with Supabase CDN URLs
  - Refreshes materialized view
  - Verification checks
  - Migration report generation

- **scripts/package.json** - NPM dependencies for scripts
  - `@supabase/supabase-js` for Supabase client
  - `dotenv` for environment variables
  - Convenient npm scripts (`upload`, `migrate`, `full-migration`)

### Changed

#### index.html
- **Added Supabase client library** from CDN
- **Added config.js, supabase-client.js, supabase-config-loader.js** script includes
- **Updated initialization logic** to use feature flags
  - Checks `CONFIG.features.supabaseEnabled`
  - Uses `SupabaseConfigLoader` or `ARConfigLoader` based on flag
  - Logs config source (Supabase vs products.json)
- **Improved loading flow**
  - Shows loading screen
  - Transitions to instructions
  - Auto-hides instructions after 5 seconds
- **Better error handling** with user-friendly messages

### Features

#### Database-Driven Product Management
```
Before: Edit products.json → Redeploy
After:  Edit in Supabase → Live immediately
```

#### Analytics Tracking
Automatically tracks:
- Page loads
- Product found/lost events
- Button clicks
- Model load performance
- Errors

Stored in `analytics_events` table with:
- Event type
- Product ID
- Session ID
- Metadata
- Timestamp
- User agent
- Viewport size

#### CDN Asset Delivery
```
Before: ./assets/models/model.glb (local)
After:  https://xxxxx.supabase.co/storage/v1/object/public/ar-models/model.glb
```

Benefits:
- Faster load times
- Cloudflare CDN integration
- Global edge distribution
- Bandwidth optimization

#### Feature Flag System
Easy toggle between modes:
```javascript
// Use Supabase
CONFIG.features.supabaseEnabled = true;

// Use products.json
CONFIG.features.supabaseEnabled = false;
```

With automatic fallback:
```javascript
CONFIG.features.fallbackToJSON = true;
```

#### Real-Time Updates (Optional)
```javascript
arConfig.enableRealTimeUpdates();
// Scene automatically refreshes when database changes
```

### Architecture

#### Database Tables
```
products (id, product_id, name, description, target_index, status)
  ↓
  ├── product_targets (image_path, image_preview)
  ├── product_models (model_path, position, rotation, scale, animation)
  ├── product_ui_config (colors, content)
  │   └── product_buttons (label, icon, link, style, position)
  ├── product_interactions (on_found, on_lost)
  └── product_versions (version history)

global_settings (multiple_targets, max_simultaneous_targets, colors, loading, instructions)
analytics_events (event_type, product_id, session_id, metadata, timestamp)
```

#### Storage Buckets
```
ar-targets/    → .mind files
ar-models/     → .glb files
ar-images/     → .jpg, .png files
ar-sounds/     → .mp3 files
```

#### Configuration Flow
```
index.html
  ↓
config.js (feature flags)
  ↓
[supabaseEnabled=true]          [supabaseEnabled=false]
  ↓                                ↓
SupabaseConfigLoader          ARConfigLoader
  ↓                                ↓
Supabase Database  ←--(fallback)-- products.json
  ↓
products_complete view
  ↓
Generate A-Frame Scene
```

### Security

#### Row Level Security (RLS)
- Public users: Read published products only
- Public users: Insert analytics only (no read)
- Authenticated users: Full CRUD on products
- Service role: Bypass RLS for admin operations

#### API Keys
- **anon key**: Safe to expose in client-side code (RLS protected)
- **service_role key**: Never expose (full database access)

### Performance Optimizations

#### Materialized Views
```sql
CREATE MATERIALIZED VIEW products_complete_mv AS
SELECT * FROM products_complete;
```
- Faster queries (pre-computed joins)
- Refresh on schedule or on-demand

#### Caching
- Client-side config caching (1 hour default)
- Configurable via `CONFIG.performance.cacheDuration`
- Cache invalidation on demand

#### Event Batching
- Batch analytics events every 5 seconds (optional)
- Reduces database writes
- Configurable via `CONFIG.analytics.batchInterval`

### Migration Path

#### Quick Start (Keep products.json)
1. Set `supabaseEnabled: false` in config.js
2. Everything works as before
3. No changes needed

#### Gradual Migration
1. Set up Supabase project
2. Run database schema
3. Upload assets (optional)
4. Migrate products (optional)
5. Enable `supabaseEnabled: true`
6. Enable `fallbackToJSON: true` for safety
7. Test thoroughly
8. Deploy

#### Full Migration
```bash
# 1. Install dependencies
cd scripts
npm install

# 2. Configure environment
cp ../.env.example .env
# Edit .env with Supabase credentials

# 3. Upload assets
npm run upload

# 4. Migrate data
npm run migrate

# 5. Update config.js
# Set supabaseEnabled: true

# 6. Test locally
cd ..
python3 -m http.server 8000

# 7. Deploy
git add .
git commit -m "Add Supabase integration"
git push
```

### Backward Compatibility

- ✅ Existing products.json still works
- ✅ No breaking changes to HTML structure
- ✅ No breaking changes to CSS
- ✅ ARConfigLoader unchanged (for non-Supabase users)
- ✅ Supabase features are opt-in via feature flags
- ✅ Automatic fallback if Supabase unavailable

### Cost Estimates

#### Free Tier (for testing)
- 500 MB database
- 1 GB file storage
- 2 GB bandwidth/month
- ~10,000 AR sessions/month

#### Pro Tier ($25/month) - Recommended
- 8 GB database
- 100 GB file storage
- 50 GB bandwidth/month
- ~100,000 AR sessions/month
- Point-in-time recovery
- Daily backups
- Email support

### Known Issues

None - all changes are additive and backward compatible.

### Recommendations

1. **Start with feature flag disabled** - Test existing functionality
2. **Set up Supabase project** - Follow SUPABASE_MIGRATION_GUIDE.md
3. **Test with fallback enabled** - Ensure graceful degradation
4. **Monitor analytics** - Use data to optimize experience
5. **Regular backups** - Export products.json as backup
6. **Use materialized views** - Refresh hourly for best performance

### Developer Experience Improvements

#### Before Supabase
```
1. Edit products.json
2. Commit changes
3. Push to GitHub
4. Wait for deployment
5. Changes live
```

#### After Supabase
```
1. Edit in Supabase Dashboard
2. Changes live immediately
```

#### Workflow Comparison
```
Content Update:
Before: 5-10 minutes (edit → deploy)
After:  < 1 minute (edit in dashboard)

Analytics:
Before: None
After:  Real-time tracking in database

Asset Management:
Before: Local files → Manual upload
After:  CDN with automatic optimization
```

---

## [1.1.1] - 2025-11-09 - Documentation Updates

### Fixed

#### QUICK_START.md
- **Removed outdated HTML editing instructions**
  - Old Step 2: "Update HTML" (edit index.html)
  - New Step 2: "Update products.json" (JSON configuration)

- **Removed manual model loading instructions**
  - Old Step 5: Edit HTML to add assets and models
  - New Step 5: Configure models in products.json

- **Added validation reminders**
  - Check browser console for configuration messages
  - Verify no validation errors before testing

- **Enhanced testing checklist**
  - Added console validation checks
  - Added UI and button testing items
  - Removed HTML editing requirement

- **Added Important Notes section**
  - Explained JSON configuration system
  - Clarified automatic HTML configuration
  - Added multiple products guidance
  - Included .mind file creation reference

### Added

#### FUTURE_ENHANCEMENTS.md
- Documented multi-model layering system (planned feature)
- Complete implementation plan with code examples
- Z-ordering guidelines for background/foreground layers
- Migration path from single to multiple models
- 3 practical use case examples
- Performance considerations and testing checklist

---

## [1.1.0] - 2025-11-09 - Target Management Improvements

### Added

#### New Documentation
- **TARGET_MANAGEMENT_GUIDE.md** - Comprehensive guide for creating and managing `.mind` files
  - Combined vs individual .mind file strategies
  - Step-by-step MindAR compiler instructions
  - Image quality guidelines
  - Troubleshooting common issues
  - Best practices for single-product-at-a-time scanning

#### Enhanced Features
- **Automatic target validation** in `config-loader.js`
  - Detects mismatched .mind files
  - Warns when multiple different paths are used
  - Provides helpful error messages with solutions
  - Logs clear configuration info to console

- **Better console logging**
  - ✅ Success indicators
  - ⚠️ Warning messages
  - ❌ Error descriptions
  - 📦 Configuration summary
  - 🎯 Target file information

### Changed

#### index.html
- **Removed hardcoded imageTargetSrc path**
  - Was: `imageTargetSrc: ./assets/targets/zynSpearmint.mind`
  - Now: `imageTargetSrc: ;` (empty, auto-configured)
  - Added comment explaining automatic configuration

#### config-loader.js
- **Enhanced `loadConfig()` method**
  - Added validation call
  - Better error messages
  - Improved console output with emojis

- **New `validateTargets()` method**
  - Checks for target path consistency
  - Warns about multiple .mind files
  - Suggests combined .mind solution
  - Shows which products use which files

- **Improved `updateSceneConfig()` method**
  - Better logic for detecting target source
  - Handles edge cases
  - Detailed logging of configuration
  - Lists all products with their indices

#### products.json
- **Added helpful comments**
  - Usage instructions at top
  - Workflow summary
  - Notes on combined vs separate .mind files
  - Per-product examples

- **Updated example paths**
  - Changed from separate files to combined approach
  - Both examples now use `./assets/targets/products.mind`
  - Clear indication of targetIndex usage

#### PRODUCTS_CONFIG_GUIDE.md
- **Added "Use Case" section**
  - Clarified single-product-at-a-time scanning
  - Explained typical workflow
  - Referenced TARGET_MANAGEMENT_GUIDE.md

- **Enhanced "Workflow" section**
  - Differentiated between single product and catalog
  - Added visual workflow diagram
  - Separate instructions for combined vs individual files

#### README.md
- **Updated documentation structure**
  - Added TARGET_MANAGEMENT_GUIDE.md to file tree
  - Reorganized documentation list by importance

- **Improved "For Developers" section**
  - Clearer 3-step process
  - Direct links to relevant guides
  - Emphasized automatic configuration

### Fixed

#### Target Configuration Issues
- **Problem**: Confusing whether to edit index.html or products.json for targets
- **Solution**: Only products.json needs editing; index.html auto-configured

- **Problem**: Unclear error messages when using multiple .mind files
- **Solution**: Detailed validation with actionable suggestions

- **Problem**: No feedback about which target file is being used
- **Solution**: Console logs show exact configuration

### Developer Experience Improvements

#### Clearer Workflow
```
Before: ❓ Edit index.html? Or products.json? Both?
After:  ✅ Only edit products.json - system handles the rest
```

#### Better Errors
```
Before: Silent failure or cryptic errors
After:  Clear messages with solutions and links
```

#### Validation
```
Before: No validation until runtime errors
After:  Immediate validation with helpful suggestions
```

### Console Output Examples

#### Success (Single Product)
```
✅ Configuration loaded successfully
📦 Products found: 1
🎯 Target validation:
   Total products: 1
   Unique .mind files: 1
   ✅ All products use: ./assets/targets/product-1.mind
🎯 Setting image target source: ./assets/targets/product-1.mind
📱 MindAR configuration:
   Target file: ./assets/targets/product-1.mind
   Products configured: 1
   1. My Product (targetIndex: 0)
```

#### Success (Multiple Products, Combined File)
```
✅ Configuration loaded successfully
📦 Products found: 3
🎯 Target validation:
   Total products: 3
   Unique .mind files: 1
   ✅ All products use: ./assets/targets/products.mind
   ℹ️ Multiple products will be tracked from single .mind file
🎯 Setting image target source: ./assets/targets/products.mind
📱 MindAR configuration:
   Target file: ./assets/targets/products.mind
   Products configured: 3
   1. Product A (targetIndex: 0)
   2. Product B (targetIndex: 1)
   3. Product C (targetIndex: 2)
```

#### Error (Mismatched Files)
```
✅ Configuration loaded successfully
📦 Products found: 2
🎯 Target validation:
   Total products: 2
   Unique .mind files: 2
   ❌ Multiple different .mind files detected:
      1. ./assets/targets/product-1.mind (used by 1 product(s))
      2. ./assets/targets/product-2.mind (used by 1 product(s))
   ⚠️ MindAR can only load ONE .mind file at a time!
   💡 Solution: Compile all product images into one combined .mind file
   🔗 Use: https://hiukim.github.io/mind-ar-js-doc/tools/compile
```

### Migration Guide

#### For Existing Users

If you have an existing `products.json` with separate .mind files:

**Option 1: Create Combined File (Recommended)**
1. Collect all product images
2. Upload to MindAR compiler together
3. Download `products.mind`
4. Update all products to use same path:
```json
{
  "products": [
    {"id": "p1", "targetIndex": 0, "target": {"imagePath": "./assets/targets/products.mind"}},
    {"id": "p2", "targetIndex": 1, "target": {"imagePath": "./assets/targets/products.mind"}}
  ]
}
```

**Option 2: Keep Individual Files**
- Keep one product active at a time
- System will use first product's .mind file
- You'll see a warning in console

### Technical Details

#### File Changes
- `index.html` - 1 line changed (removed hardcoded path)
- `js/config-loader.js` - 3 methods enhanced, 1 method added (~60 lines)
- `products.json` - Comments added, paths updated
- `PRODUCTS_CONFIG_GUIDE.md` - 2 sections updated
- `README.md` - 2 sections updated
- `TARGET_MANAGEMENT_GUIDE.md` - New file (~400 lines)

#### Backward Compatibility
- ✅ Existing configurations still work
- ✅ Console warnings for deprecated patterns
- ✅ No breaking changes
- ⚠️ Hardcoded paths in index.html now ignored

### Known Issues

None - all changes are additive and backward compatible.

### Recommendations

1. **Use combined .mind files** for multiple products
2. **Check browser console** on first load to verify configuration
3. **Read TARGET_MANAGEMENT_GUIDE.md** before creating targets
4. **Test on actual devices** with printed targets

---

## [1.0.0] - 2025-11-09 - Initial Release

### Added
- JSON-based product configuration system
- Dynamic AR scene generation
- Product-specific UI with custom colors
- Interactive buttons with links
- MindAR + A-Frame integration
- Complete documentation suite
- Example configurations

---

**Last Updated**: 2025-11-09
