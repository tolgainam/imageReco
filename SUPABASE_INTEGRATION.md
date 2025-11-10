# Supabase Integration Guide

Complete guide for integrating Supabase as the backend for dynamic product management, analytics, and asset storage.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [API Integration](#api-integration)
5. [File Storage](#file-storage)
6. [Security](#security)
7. [Code Changes](#code-changes)
8. [Migration](#migration)
9. [Performance](#performance)
10. [Admin Interface](#admin-interface)

---

## Overview

### Current System (Static)
- Products defined in `products.json`
- Assets stored locally in `assets/` folder
- No analytics or dynamic updates
- Requires redeployment to change content

### New System (Dynamic with Supabase)
- Products stored in Supabase database
- Assets in Supabase Storage with CDN
- Real-time analytics tracking
- Update content without redeployment
- Admin panel for content management

### Key Benefits

| Feature | Before | After |
|---------|--------|-------|
| **Content Updates** | Redeploy code | Update database |
| **Analytics** | None | Full tracking |
| **Scalability** | Limited by JSON | Thousands of products |
| **Asset Management** | Manual file uploads | Centralized storage + CDN |
| **Version Control** | Git only | Database versioning |
| **Admin Interface** | Code editing | Web-based CMS |

---

## Architecture

### High-Level Diagram

```
┌─────────────────────┐
│   Mobile Browser    │
│   (AR Experience)   │
└──────────┬──────────┘
           │
           ├──── Supabase API ────┐
           │                      │
           │    ┌─────────────────▼────────────┐
           │    │   Supabase Database          │
           │    │   - products                 │
           │    │   - product_targets          │
           │    │   - product_models           │
           │    │   - product_ui_config        │
           │    │   - product_buttons          │
           │    │   - analytics_events         │
           │    └──────────────────────────────┘
           │
           └──── Supabase Storage ──┐
                                    │
                ┌───────────────────▼───────────┐
                │  Storage Buckets (+ CDN)      │
                │  - product-models (.glb)      │
                │  - target-files (.mind)       │
                │  - product-images (.jpg/png)  │
                │  - product-sounds (.mp3)      │
                └────────────────────────────────┘
```

### Data Flow

```
1. Page Load
   └─> Load Supabase config
   └─> Query products_complete view
   └─> Generate A-Frame scene
   └─> Preload critical assets

2. Target Detection
   └─> Fire "targetFound" event
   └─> Show product UI
   └─> Track analytics event

3. Button Click
   └─> Track click event
   └─> Open link
```

---

## Database Schema

### Core Tables Overview

| Table | Purpose | Key Fields |
|-------|---------|------------|
| **products** | Main product data | id, product_id, name, status, target_index |
| **product_targets** | Image tracking files | mind_file_url, preview_image_url |
| **product_models** | 3D models | glb_file_url, position, scale, animation |
| **product_ui_config** | UI customization | colors, title, description, features |
| **product_buttons** | Interactive buttons | label, icon, link, style |
| **product_interactions** | Behavior settings | onFound, onLost actions |
| **global_settings** | System configuration | ar_config, default_colors |
| **analytics_events** | Usage tracking | event_type, product_id, metadata |

### Relationships

```
products (1) ─── (1) product_targets
         │
         ├─── (many) product_models
         │
         ├─── (1) product_ui_config
         │
         ├─── (many) product_buttons
         │
         └─── (1) product_interactions

analytics_events (many) ─── (1) products
                       │
                       └─── (1) product_buttons
```

### Status Flow

```
draft ──(publish)──> published ──(archive)──> archived
  └──(delete)──> [deleted]
```

**See [SUPABASE_SCHEMA.sql](SUPABASE_SCHEMA.sql) for complete DDL statements.**

---

## API Integration

### Query Patterns

#### Fetch All Products

```javascript
const { data: products, error } = await supabase
  .from('products_complete')
  .select('*')
  .order('target_index', { ascending: true });

// Returns array matching products.json structure
```

#### Fetch Single Product

```javascript
const { data: product, error } = await supabase
  .from('products_complete')
  .select('*')
  .eq('product_id', 'product-1')
  .single();
```

#### Fetch Global Settings

```javascript
const { data: settings } = await supabase
  .from('global_settings')
  .select('setting_key, setting_value');

const globalSettings = settings.reduce((acc, s) => {
  acc[s.setting_key] = s.setting_value;
  return acc;
}, {});
```

### Authentication Strategy

**Public Read Access:**
- Anonymous users can read published products
- No authentication required for AR experience
- Seamless user experience

**Admin Write Access:**
- Authenticated users with admin role
- Full CRUD operations
- Product versioning and publishing

### Caching Strategy

**Multi-layer Caching:**

```javascript
class SupabaseCache {
  constructor() {
    this.cache = new Map();
    this.ttl = 5 * 60 * 1000; // 5 minutes
  }

  async get(key, fetchFn) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.data;
    }

    const data = await fetchFn();
    this.cache.set(key, { data, timestamp: Date.now() });
    return data;
  }
}
```

**Cache Layers:**
1. Memory cache (5 min TTL)
2. Browser cache (HTTP headers)
3. CDN cache (Supabase Storage)
4. Service Worker (offline support)

### Error Handling

```javascript
async loadWithFallback() {
  try {
    return await this.loadFromSupabase();
  } catch (error) {
    console.warn('Supabase failed, using JSON fallback');
    return await this.loadFromJSON();
  }
}
```

---

## File Storage

### Bucket Configuration

| Bucket | Purpose | Max Size | Public |
|--------|---------|----------|--------|
| `product-models` | GLB 3D models | 10MB | Yes |
| `target-files` | .mind tracking files | 5MB | Yes |
| `product-images` | Preview images | 2MB | Yes |
| `product-sounds` | Audio files | 1MB | Yes |

### File Organization

```
product-models/
  └── [product-id]/
      ├── main-model-[hash].glb
      └── background-[hash].glb

target-files/
  └── [product-id]/
      └── target-[hash].mind

product-images/
  └── [product-id]/
      ├── preview-[hash].jpg
      └── thumbnail-[hash].jpg
```

### CDN Strategy

Supabase Storage includes built-in Cloudflare CDN:
- ✅ Global edge caching
- ✅ Automatic compression
- ✅ Fast worldwide delivery
- ✅ No additional setup

### URL Generation with Cache Busting

```javascript
function getPublicUrl(bucket, path, hash) {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return `${data.publicUrl}?v=${hash}`;
}
```

---

## Security

### Row Level Security (RLS)

**Public Read Access:**
```sql
CREATE POLICY "Public can view published products"
  ON products FOR SELECT
  USING (status = 'published');
```

**Admin Write Access:**
```sql
CREATE POLICY "Admins have full access"
  ON products FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');
```

**Analytics Insert:**
```sql
CREATE POLICY "Public can insert analytics"
  ON analytics_events FOR INSERT
  WITH CHECK (true);
```

**See [SUPABASE_RLS_POLICIES.sql](SUPABASE_RLS_POLICIES.sql) for complete policies.**

### API Rate Limiting

- Anonymous: 100 requests/minute
- Authenticated: 1000 requests/minute
- Client-side throttling for analytics

### Storage Security

```javascript
// Bucket policies
const policies = {
  'product-models': {
    public: true,
    allowedMimeTypes: ['model/gltf-binary']
  },
  'target-files': {
    public: true,
    allowedMimeTypes: ['application/octet-stream']
  }
};
```

---

## Code Changes

### New Files

#### 1. `/js/config.js` - Configuration

```javascript
const CONFIG = {
  supabase: {
    url: 'YOUR_SUPABASE_URL',
    anonKey: 'YOUR_SUPABASE_ANON_KEY'
  },
  features: {
    supabaseEnabled: true,
    analyticsEnabled: true,
    fallbackToJSON: true
  },
  cache: {
    ttl: 5 * 60 * 1000
  }
};
```

#### 2. `/js/supabase-client.js` - Client Setup

```javascript
const supabaseClient = supabase.createClient(
  CONFIG.supabase.url,
  CONFIG.supabase.anonKey
);

window.supabaseClient = supabaseClient;
```

#### 3. `/js/supabase-config-loader.js` - Dynamic Loader

Extends `ARConfigLoader` with Supabase queries:
- Replaces `products.json` fetch with database query
- Transforms database format to JSON structure
- Implements caching and retry logic
- Tracks analytics events

### Modified Files

#### `index.html` Changes

```html
<!-- Add Supabase CDN -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- Add config files -->
<script src="./js/config.js"></script>
<script src="./js/supabase-client.js"></script>
<script src="./js/supabase-config-loader.js"></script>

<!-- Update initialization -->
<script>
  const useSupabase = window.CONFIG?.features?.supabaseEnabled ?? false;
  const ConfigLoader = useSupabase ? SupabaseConfigLoader : ARConfigLoader;
  const arConfig = new ConfigLoader();
  // ... rest of initialization
</script>
```

#### `js/config-loader.js` Changes

Add analytics tracking hooks (non-breaking):

```javascript
// In onProductFound()
if (this.trackEvent) {
  this.trackEvent('product_found', product.id);
}

// In attachButtonListeners()
if (this.trackEvent) {
  this.trackEvent('button_click', product.id, button.id);
}
```

### Backward Compatibility

✅ Feature flag controlled (`features.supabaseEnabled`)
✅ Automatic fallback to `products.json`
✅ No breaking changes to existing code
✅ Same data structure maintained

---

## Migration

### Migration Steps

#### Phase 1: Setup Supabase (1-2 hours)

1. Create Supabase project
2. Run [SUPABASE_SCHEMA.sql](SUPABASE_SCHEMA.sql)
3. Run [SUPABASE_RLS_POLICIES.sql](SUPABASE_RLS_POLICIES.sql)
4. Create storage buckets
5. Test connection

#### Phase 2: Migrate Assets (2-3 hours)

```bash
# Run migration script
node migrate-assets-to-supabase.js
```

Migrates:
- GLB models → `product-models` bucket
- .mind files → `target-files` bucket
- Images → `product-images` bucket
- Sounds → `product-sounds` bucket

#### Phase 3: Migrate Data (1-2 hours)

```bash
# Run data migration
node migrate-products-to-supabase.js
```

Transforms `products.json` to database tables:
- products
- product_targets
- product_models
- product_ui_config
- product_buttons
- product_interactions
- global_settings

#### Phase 4: Testing (2-3 hours)

- [ ] Products load from Supabase
- [ ] All assets load correctly
- [ ] AR experience works identically
- [ ] Analytics tracking functions
- [ ] Fallback works
- [ ] Mobile performance OK

#### Phase 5: Deployment (1 hour)

1. Update environment variables
2. Deploy with `supabaseEnabled: false` initially
3. Test in production
4. Enable Supabase gradually
5. Monitor for 1 week
6. Remove JSON fallback

**See [SUPABASE_MIGRATION_GUIDE.md](SUPABASE_MIGRATION_GUIDE.md) for detailed steps.**

### Rollback Plan

If issues occur:

```javascript
// In config.js
features: {
  supabaseEnabled: false  // ← Set to false
}
```

App automatically uses `products.json` as fallback.

---

## Performance

### Optimization Strategies

#### 1. Materialized View

```sql
CREATE MATERIALIZED VIEW products_complete_mv AS
SELECT * FROM products_complete;

-- Refresh on product changes
CREATE TRIGGER refresh_products_view
AFTER INSERT OR UPDATE OR DELETE ON products
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_products_complete();
```

Query materialized view instead of regular view for 10x faster queries.

#### 2. Request Deduplication

```javascript
class RequestDeduplicator {
  async dedupe(key, fetchFn) {
    if (this.pending.has(key)) {
      return this.pending.get(key);
    }
    const promise = fetchFn();
    this.pending.set(key, promise);
    return promise;
  }
}
```

Prevents duplicate API calls for same resource.

#### 3. Lazy Asset Loading

```javascript
// Only load assets when needed
async loadOnDemand(product) {
  return Promise.all([
    fetch(product.model.path),
    fetch(product.target.imagePath)
  ]);
}
```

#### 4. Service Worker Caching

```javascript
// Cache Supabase responses
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('supabase.co')) {
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
  }
});
```

#### 5. Image Optimization

```javascript
// Get optimized image
const url = getOptimizedImageUrl(path, {
  width: 800,
  quality: 80,
  format: 'webp'
});
```

### Performance Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| Initial Load | < 2s | Materialized view, caching |
| Asset Load | < 3s | CDN, lazy loading |
| API Response | < 200ms | Caching, edge functions |
| Mobile FPS | 30+ | Optimized models, textures |

---

## Admin Interface

### Recommended Tech Stack

- **Frontend**: Next.js or React
- **Auth**: Supabase Auth
- **Forms**: React Hook Form
- **UI**: Tailwind CSS or shadcn/ui

### Core Features

#### 1. Product Management
- List/filter products by status
- Create/edit/delete products
- Drag-and-drop asset uploads
- Live preview
- Publish/unpublish

#### 2. Asset Management
- Upload GLB models
- Upload .mind files
- Image management
- 3D model preview
- File size validation

#### 3. UI Configuration
- Visual color picker
- Content editor
- Button management
- Real-time preview

#### 4. Analytics Dashboard
- Product scan statistics
- Button click rates
- Popular products
- Session analytics
- Export reports

#### 5. Version Control
- View history
- Compare versions
- Rollback changes
- Publish workflow

### Bulk Operations

```javascript
// Import from JSON
async function bulkImport(jsonData) {
  for (const product of jsonData.products) {
    await migrateProduct(product);
  }
}
```

### Preview Mode

```javascript
// Preview URL with draft products
const url = `https://app.com/?preview=true&token=${previewToken}`;
```

---

## Analytics

### Events Tracked

| Event | When | Data Captured |
|-------|------|---------------|
| `session_start` | Page load | user_agent, timestamp |
| `product_found` | Target detected | product_id, timestamp |
| `product_lost` | Target lost | product_id, duration |
| `button_click` | Button clicked | product_id, button_id, link |

### Querying Analytics

```sql
-- Most scanned products
SELECT
  p.name,
  COUNT(*) as scan_count
FROM analytics_events ae
JOIN products p ON p.id = ae.product_id
WHERE ae.event_type = 'product_found'
  AND ae.created_at > now() - interval '7 days'
GROUP BY p.name
ORDER BY scan_count DESC
LIMIT 10;

-- Button click rates
SELECT
  p.name,
  pb.label,
  COUNT(*) as clicks
FROM analytics_events ae
JOIN product_buttons pb ON pb.id = ae.button_id
JOIN products p ON p.id = pb.product_id
WHERE ae.event_type = 'button_click'
GROUP BY p.name, pb.label
ORDER BY clicks DESC;
```

### Privacy Considerations

- No personally identifiable information (PII) collected
- Only anonymous session IDs
- User agent for compatibility tracking
- GDPR compliant (no user tracking)

---

## Cost Estimates

### Supabase Pricing

**Free Tier:**
- 500MB database
- 1GB file storage
- 2GB bandwidth/month
- **Suitable for**: 10-50 products, 1000 scans/month

**Pro Plan ($25/month):**
- 8GB database
- 100GB storage
- 250GB bandwidth
- **Suitable for**: 1000+ products, 100K scans/month

### Cost Breakdown (Pro Plan Example)

```
Database: Included
Storage: 10GB models + 5GB targets = 15GB total
Bandwidth: ~50GB/month (10K scans × 5MB avg)
Total: $25/month base + bandwidth overages if any
```

### Optimization Tips

- Compress GLB models (Draco)
- Use WebP for images
- Enable CDN caching
- Lazy load assets

---

## Support & Resources

### Documentation
- [Supabase Docs](https://supabase.com/docs)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

### Community
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Discussions](https://github.com/supabase/supabase/discussions)

### Internal Docs
- [SUPABASE_SCHEMA.sql](SUPABASE_SCHEMA.sql) - Database schema
- [SUPABASE_RLS_POLICIES.sql](SUPABASE_RLS_POLICIES.sql) - Security policies
- [SUPABASE_MIGRATION_GUIDE.md](SUPABASE_MIGRATION_GUIDE.md) - Migration steps
- [CHANGELOG.md](CHANGELOG.md) - Version history

---

**Last Updated**: 2025-11-09
**Version**: 1.0
**Status**: Ready for Implementation
