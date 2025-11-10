# Supabase Integration - Quick Reference

This document provides a quick overview of the Supabase integration for the Image Recognition AR Experience.

## What is Supabase Integration?

Supabase integration adds:
- **Database-driven product management** - Edit products without redeploying
- **Real-time analytics** - Track user interactions and product performance
- **CDN asset delivery** - Faster loading via Cloudflare CDN
- **Automatic fallback** - Works offline with products.json

## Status: Optional Feature (Disabled by Default)

The Supabase integration is **completely optional**. The project works perfectly without it using `products.json`.

**Current Status**: Disabled (using `products.json`)

To enable Supabase, see [Getting Started](#getting-started) below.

## Files Added

### Documentation
- `SUPABASE_INTEGRATION.md` - Complete integration guide (10 sections)
- `SUPABASE_MIGRATION_GUIDE.md` - Step-by-step migration (7 phases)
- `SUPABASE_SCHEMA.sql` - Database schema (9 tables, views, functions)
- `SUPABASE_RLS_POLICIES.sql` - Security policies

### JavaScript
- `js/config.js` - Feature flags and configuration
- `js/supabase-client.js` - Supabase client wrapper
- `js/supabase-config-loader.js` - Database-aware config loader

### Migration Scripts
- `scripts/upload-assets.js` - Upload files to Supabase Storage
- `scripts/migrate-to-supabase.js` - Migrate products.json to database
- `scripts/package.json` - NPM dependencies

### Configuration
- `.env.example` - Environment variables template
- `index.html` - Updated with Supabase integration

## Quick Comparison

### Without Supabase (Current)
```
✅ No setup required
✅ Works offline
✅ No external dependencies
✅ Fast and simple
❌ Requires redeploy to update products
❌ No analytics
❌ Local asset storage only
```

### With Supabase
```
✅ Live product updates (no redeploy)
✅ Real-time analytics tracking
✅ CDN asset delivery (faster loading)
✅ Automatic fallback to products.json
✅ Version history
❌ Requires Supabase account
❌ Setup time (~2-3 hours)
💰 Free tier: 10k sessions/month
💰 Pro tier: $25/mo for 100k sessions/month
```

## Getting Started

### Option 1: Keep Using products.json (No Changes)

Nothing to do! The project works exactly as before.

### Option 2: Enable Supabase

**Step 1: Read Documentation**
```bash
# Start with the migration guide
open SUPABASE_MIGRATION_GUIDE.md
```

**Step 2: Create Supabase Project**
1. Go to https://supabase.com
2. Create new project
3. Copy project URL and anon key

**Step 3: Configure**
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your Supabase credentials
nano .env
```

**Step 4: Set Up Database**
1. Open Supabase Dashboard → SQL Editor
2. Run `SUPABASE_SCHEMA.sql`
3. Run `SUPABASE_RLS_POLICIES.sql`

**Step 5: Upload Assets (Optional)**
```bash
cd scripts
npm install
npm run upload
```

**Step 6: Migrate Data (Optional)**
```bash
npm run migrate
```

**Step 7: Enable in Config**

Edit `js/config.js`:
```javascript
const CONFIG = {
  features: {
    supabaseEnabled: true,  // Change to true
    analyticsEnabled: true,
    fallbackToJSON: true    // Keep enabled for safety
  },
  supabase: {
    url: 'https://xxxxx.supabase.co',
    anonKey: 'eyJhbG...'
  }
};
```

**Step 8: Test**
```bash
cd ..
python3 -m http.server 8000
# Open http://localhost:8000
# Check console for "✅ Configuration loaded from Supabase"
```

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         index.html                          │
│                             ↓                               │
│                        config.js                            │
│              (Check CONFIG.features.supabaseEnabled)        │
│                             ↓                               │
│         ┌───────────────────┴───────────────────┐          │
│         ↓                                       ↓          │
│  supabaseEnabled=true              supabaseEnabled=false  │
│         ↓                                       ↓          │
│ SupabaseConfigLoader                   ARConfigLoader     │
│         ↓                                       ↓          │
│ Supabase Database  ←─────(fallback)──────  products.json  │
│         ↓                                                   │
│  Generate A-Frame Scene                                    │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

```
products
  ├── product_targets (image tracking)
  ├── product_models (3D models)
  ├── product_ui_config (colors, content)
  │   └── product_buttons (interactive buttons)
  ├── product_interactions (onFound, onLost)
  └── product_versions (history)

global_settings (app-wide config)
analytics_events (tracking)
```

## Feature Flags

Control Supabase features in `js/config.js`:

```javascript
CONFIG.features = {
  // Enable/disable Supabase entirely
  supabaseEnabled: false,  // true = use Supabase, false = use products.json

  // Enable/disable analytics (requires Supabase)
  analyticsEnabled: false,

  // Fallback to products.json if Supabase fails
  fallbackToJSON: true  // Recommended: true
};
```

## Analytics Events Tracked

When `analyticsEnabled: true`:
- `page_loaded` - User visits the page
- `product_found` - Image target detected
- `product_lost` - Image target lost
- `button_clicked` - UI button clicked
- `model_loaded` - 3D model loaded successfully
- `error_occurred` - Any error

All events include:
- Session ID
- Timestamp
- Product ID (if applicable)
- User agent
- Viewport size
- Custom metadata

## Storage Buckets

Files stored in Supabase Storage:

```
ar-targets/    → .mind files (image targets)
ar-models/     → .glb files (3D models)
ar-images/     → .jpg, .png (preview images)
ar-sounds/     → .mp3 (sound effects)
```

All buckets are:
- **Public for read** (anyone can download)
- **Authenticated for write** (only admin can upload)
- **CDN-enabled** (via Cloudflare)

## Cost Calculator

### Free Tier (Good for testing)
```
Database:     500 MB
Storage:      1 GB
Bandwidth:    2 GB/month
Sessions:     ~10,000/month
Cost:         $0
```

### Pro Tier (Recommended for production)
```
Database:     8 GB
Storage:      100 GB
Bandwidth:    50 GB/month
Sessions:     ~100,000/month
Cost:         $25/month
Extras:       Backups, support, point-in-time recovery
```

### Calculate Your Needs
```
1 AR session ≈ 500 KB (models) + 200 KB (target) + 50 KB (overhead)
1 AR session ≈ 750 KB total

Your monthly bandwidth = sessions × 750 KB
```

## Security

### Public (Anon) Key
- **Safe to expose** in `config.js`
- Can only read published products
- Can only insert analytics (not read)
- Protected by Row Level Security (RLS)

### Service Role Key
- **NEVER expose** in client-side code
- Full database access
- Only use in migration scripts (server-side)

## Testing

### Test with Supabase Enabled
```javascript
// config.js
supabaseEnabled: true
```
Console should show:
```
🔧 Using SupabaseConfigLoader
✅ Configuration loaded from Supabase
📍 Config source: Supabase
```

### Test Fallback
```javascript
// config.js
supabaseEnabled: true
fallbackToJSON: true

// Set invalid Supabase URL to trigger fallback
```
Console should show:
```
❌ Error loading from Supabase
⚠️ Falling back to products.json...
✅ Configuration loaded successfully
```

### Test with Supabase Disabled
```javascript
// config.js
supabaseEnabled: false
```
Console should show:
```
🔧 Using ARConfigLoader
✅ Configuration loaded successfully
```

## Migration Checklist

- [ ] Read SUPABASE_MIGRATION_GUIDE.md
- [ ] Create Supabase project
- [ ] Copy API credentials
- [ ] Create .env file
- [ ] Run SUPABASE_SCHEMA.sql
- [ ] Run SUPABASE_RLS_POLICIES.sql
- [ ] Install migration script dependencies (`cd scripts && npm install`)
- [ ] Upload assets (`npm run upload`)
- [ ] Migrate products (`npm run migrate`)
- [ ] Verify in Supabase Dashboard
- [ ] Update config.js with credentials
- [ ] Set `supabaseEnabled: true`
- [ ] Test locally
- [ ] Test fallback
- [ ] Deploy

## Troubleshooting

### Supabase not loading
- Check `supabaseEnabled: true` in config.js
- Check credentials in config.js
- Check browser console for errors
- Verify database schema is created

### Analytics not tracking
- Check `analyticsEnabled: true` in config.js
- Check `supabaseEnabled: true`
- Check browser console for analytics logs
- Verify `analytics_events` table exists

### Assets not loading from CDN
- Check Storage buckets exist
- Check files uploaded correctly
- Check URLs in database point to Supabase Storage
- Check bucket policies allow public read

### Fallback not working
- Check `fallbackToJSON: true` in config.js
- Verify products.json exists
- Check browser console for fallback message

## Support

- **Documentation**: See `SUPABASE_INTEGRATION.md` for complete guide
- **Migration**: See `SUPABASE_MIGRATION_GUIDE.md` for step-by-step
- **Supabase Docs**: https://supabase.com/docs
- **Supabase Support**: https://supabase.com/dashboard/support

## Summary

✅ **Supabase integration is complete and ready to use**
✅ **Currently disabled by default (using products.json)**
✅ **No breaking changes - fully backward compatible**
✅ **Optional feature - choose your workflow**

**To enable**: Follow steps in [Getting Started](#getting-started)
**To keep disabled**: No action needed - works as before

---

**Last Updated**: 2025-11-10
**Version**: 2.0.0
