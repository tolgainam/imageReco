# How to Add a New Product to Supabase

Complete step-by-step guide for adding the **zyn-cool-mint** product (or any new product) to your Supabase backend.

---

## 📋 Prerequisites

You need:
- ✅ `.mind` file: `zyn-cool-mint.mind` (in `/assets/targets/`)
- ✅ Product image: `zyn-cool-mint.jpg` (in `/assets/targets/`)
- ✅ 3D model: `.glb` file (optional, can reuse existing)
- ✅ Supabase project URL and credentials
- ✅ Access to Supabase Dashboard

---

## 🎯 Overview

Adding a product involves:
1. **Upload files** to Supabase Storage
2. **Run SQL** to create database records
3. **Test** in your AR app

Total time: ~10-15 minutes

---

## Step 1: Upload Files to Supabase Storage

### 1.1 Access Supabase Storage

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **Storage** in the left sidebar
4. You should see these buckets:
   - `ar-targets` - For .mind files
   - `ar-models` - For .glb models and images
   - `ar-images` - For product images (if separate)

### 1.2 Upload the .mind File

**Location:** `/assets/targets/zyn-cool-mint.mind`

1. Click on the **`ar-targets`** bucket
2. Click **Upload file** button
3. Select `zyn-cool-mint.mind` from your computer
4. Click **Upload**
5. After upload, **copy the public URL**:
   - Click the file name
   - Click **Get URL** or copy from the details panel
   - Should look like: `https://YOUR_PROJECT.supabase.co/storage/v1/object/public/ar-targets/zyn-cool-mint.mind`
   - **Save this URL** - you'll need it for the SQL!

### 1.3 Upload the Product Image

**Location:** `/assets/targets/zyn-cool-mint.jpg`

1. Click on the **`ar-models`** bucket (or `ar-images` if you have it)
2. Click **Upload file** button
3. Select `zyn-cool-mint.jpg` from your computer
4. Click **Upload**
5. After upload, **copy the public URL**:
   - Should look like: `https://YOUR_PROJECT.supabase.co/storage/v1/object/public/ar-models/zyn-cool-mint.jpg`
   - **Save this URL** - you'll need it for the SQL!

### 1.4 Upload Reference Image for Image Matching (Optional but Recommended)

If you want the image matching feature to distinguish between zyn-cool-mint and other products:

1. Take a high-quality photo of the actual product box (or use `zyn-cool-mint.jpg`)
2. Upload to **`ar-models`** bucket (or create an `ar-references` bucket)
3. Name it: `zyn-cool-mint-ref.jpg`
4. **Copy the public URL** - you'll need it later

**Tip:** Use the same image (`zyn-cool-mint.jpg`) for both preview and reference if you don't have separate photos.

---

## Step 2: Run SQL to Create Product Records

### 2.1 Open Supabase SQL Editor

1. In Supabase Dashboard, click **SQL Editor** in left sidebar
2. Click **New query** button

### 2.2 Execute the Product Creation SQL

I've created a complete SQL script for you: **`/add-zyn-cool-mint-product.sql`**

**Steps:**

1. Open the file: `/Users/tolgainam/Github/imageReco/add-zyn-cool-mint-product.sql`

2. **STEP 1 - Insert Product:**
   ```sql
   INSERT INTO products (
     product_id,
     name,
     description,
     target_index,
     status,
     published_at
   ) VALUES (
     'product-2',
     'Zyn Cool Mint',
     'Zyn Cool Mint Nicotine Pouches',
     1,  -- ⚠️ IMPORTANT: Set this to match your .mind file index!
     'published',
     now()
   )
   RETURNING id;
   ```

   **Run this query first!**

   ✅ **Save the UUID that's returned** - you'll need it for all the next steps!

   Example UUID: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

3. **STEP 2 - Insert Target Configuration:**

   Replace `<PRODUCT_UUID>` with the UUID from Step 1
   Replace the URLs with your actual Supabase URLs from Step 1.2 and 1.3

   ```sql
   INSERT INTO product_targets (
     product_id,
     mind_file_path,
     mind_file_url,
     preview_image_path,
     preview_image_url,
     target_count
   ) VALUES (
     'a1b2c3d4-e5f6-7890-abcd-ef1234567890',  -- Your UUID here
     './assets/targets/zyn-cool-mint.mind',
     'https://YOUR_PROJECT.supabase.co/storage/v1/object/public/ar-targets/zyn-cool-mint.mind',
     './assets/images/zyn-cool-mint.jpg',
     'https://YOUR_PROJECT.supabase.co/storage/v1/object/public/ar-models/zyn-cool-mint.jpg',
     1
   );
   ```

4. **STEP 3 - Insert Model Configuration:**

   Replace `<PRODUCT_UUID>` again:

   ```sql
   INSERT INTO product_models (
     product_id,
     model_id,
     glb_file_path,
     glb_file_url,
     position_x, position_y, position_z,
     rotation_x, rotation_y, rotation_z,
     scale_x, scale_y, scale_z,
     animation_enabled,
     background_plane_enabled,
     background_plane_mode,
     background_plane_width,
     background_plane_height,
     background_plane_color,
     background_plane_opacity,
     background_plane_distance
   ) VALUES (
     'a1b2c3d4-e5f6-7890-abcd-ef1234567890',  -- Your UUID
     'model-zyn-cool-mint',
     './assets/models/iluma-i-prime.glb',
     'https://YOUR_PROJECT.supabase.co/storage/v1/object/public/ar-models/iluma-i-prime.glb',
     0, 0, 0,  -- Position
     0, 0, 0,  -- Rotation
     1, 1, 1,  -- Scale
     false,    -- Animation
     true,     -- Background plane
     'screen',
     4, 3,
     '#ffffff',
     0.9,
     1.5
   );
   ```

5. **STEP 4 - Insert UI Configuration:**

   ```sql
   INSERT INTO product_ui_config (
     product_id,
     color_primary,
     color_secondary,
     title,
     subtitle,
     description_text,
     features
   ) VALUES (
     'a1b2c3d4-e5f6-7890-abcd-ef1234567890',  -- Your UUID
     '#4CC3D9',
     '#667eea',
     'Zyn Cool Mint',
     'Nicotine Pouches',
     'Experience the refreshing cool mint flavor.',
     ARRAY[
       'Refreshing cool mint flavor',
       'Available in multiple strengths',
       'Smoke-free and tobacco-free'
     ]::TEXT[]
   );
   ```

6. **STEP 5 - Insert Buttons:**

   ```sql
   -- Button 1
   INSERT INTO product_buttons (
     product_id,
     button_id,
     label,
     icon,
     link,
     button_style,
     position,
     button_order
   ) VALUES (
     'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
     'btn-zyn-learn-more',
     'Learn More',
     'ℹ️',
     'https://www.zyn.com/us/en/products/cool-mint/',
     'primary',
     'bottom-left',
     1
   );

   -- Button 2
   INSERT INTO product_buttons (
     product_id,
     button_id,
     label,
     icon,
     link,
     button_style,
     position,
     button_order
   ) VALUES (
     'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
     'btn-zyn-buy-now',
     'Buy Now',
     '🛒',
     'https://www.zyn.com/us/en/where-to-buy/',
     'secondary',
     'bottom-right',
     2
   );
   ```

---

## Step 3: Verify Product Was Added

Run these verification queries in the SQL Editor:

```sql
-- Check basic product info
SELECT * FROM products WHERE product_id = 'product-2';

-- Check complete product data (using the view)
SELECT * FROM products_complete WHERE product_id = 'product-2';

-- List all published products
SELECT product_id, name, status FROM products WHERE status = 'published';
```

**Expected output:**
- You should see `product-2` with name "Zyn Cool Mint"
- Status should be "published"
- All related data should be populated

---

## Step 4: Update Local Reference Image (Optional)

If you want to use the image matching feature:

### 4.1 Copy Reference Image Locally

```bash
# Copy the reference image to the local directory
cp /Users/tolgainam/Github/imageReco/assets/targets/zyn-cool-mint.jpg \
   /Users/tolgainam/Github/imageReco/assets/images/reference/product-2-ref.jpg
```

### 4.2 Update products.json (If Using Local Mode)

If you're testing locally without Supabase, add to `products.json`:

```json
{
  "id": "product-2",
  "name": "Zyn Cool Mint",
  "description": "Zyn Cool Mint Nicotine Pouches",
  "referenceImage": "./assets/images/reference/product-2-ref.jpg",
  "targetIndex": 1,
  "target": {
    "imagePath": "./assets/targets/zyn-cool-mint.mind",
    "imagePreview": "./assets/images/zyn-cool-mint.jpg"
  },
  "model": {
    "path": "./assets/models/iluma-i-prime.glb",
    ...
  },
  ...
}
```

---

## Step 5: Test in AR App

### 5.1 Enable Supabase in Config

Make sure Supabase is enabled in `/js/config.js`:

```javascript
features: {
  supabaseEnabled: true,  // ✅ Must be true
  ...
}
```

### 5.2 Open AR Experience

1. Start your local dev server:
   ```bash
   cd /Users/tolgainam/Github/imageReco
   python3 -m http.server 8000
   ```

2. Open in browser: `http://localhost:8000`

### 5.3 Check Console Logs

Look for these logs in browser console:

```
✅ Configuration loaded from Supabase
📦 Products found: 2
🔍 Product structure: {id: "product-2", name: "Zyn Cool Mint", ...}
✅ ImageMatcher ready with 2 reference image(s)
```

### 5.4 Test Detection

1. Point camera at the zyn-cool-mint box
2. Look for console output:
   ```
   Target 1 found
   🔍 Identifying product variant...
   ✅ Product identified: product-2 (92.3% confidence)
   ```
3. Verify the correct product UI displays

---

## Troubleshooting

### Problem: Product doesn't appear in AR app

**Check:**
1. Is Supabase enabled? (`CONFIG.features.supabaseEnabled = true`)
2. Is product status `'published'`? Run:
   ```sql
   SELECT status FROM products WHERE product_id = 'product-2';
   ```
3. Check browser console for errors
4. Verify `.mind` file URL is accessible (paste in browser)

---

### Problem: Wrong target_index

**Symptoms:** Product appears when scanning wrong box, or doesn't appear at all

**Solution:**
The `target_index` must match the index in your `.mind` file:
- If `zyn-cool-mint.mind` was compiled as the **first** target → `target_index = 0`
- If it's the **second** target → `target_index = 1`
- If it's the **third** target → `target_index = 2`

Update with:
```sql
UPDATE products
SET target_index = 1  -- Change to correct index
WHERE product_id = 'product-2';
```

---

### Problem: "RangeError" or ".mind file corruption"

**Symptoms:** Console shows `RangeError: Extra bytes found at buffer`

**Solutions:**
1. **Disable CDN loading** (recommended):
   ```javascript
   // In js/config.js:
   features: {
     useMindFileCDN: false  // Use local files instead
   }
   ```

2. **Verify file integrity:**
   ```bash
   # Check file size
   ls -lh /Users/tolgainam/Github/imageReco/assets/targets/zyn-cool-mint.mind

   # Compare with uploaded file
   # Sizes should match exactly
   ```

3. **Re-upload if needed:**
   - Delete from Supabase Storage
   - Upload again
   - Update URL in database

---

### Problem: Image matching not working

**Symptoms:** Wrong product identified, or low confidence

**Solutions:**
1. **Add reference image:**
   - Upload high-quality photo to Storage
   - Update database with URL:
     ```sql
     UPDATE products
     SET reference_image_url = 'https://YOUR_URL/zyn-cool-mint-ref.jpg'
     WHERE product_id = 'product-2';
     ```

2. **Improve reference photo quality:**
   - Use good lighting
   - Capture full box face
   - Same angle you'll scan from
   - High resolution (>800x800px)

3. **Check ImageMatcher stats:**
   ```javascript
   // In browser console:
   imageMatcher.getStats()
   ```

---

## Quick Reference: Key Settings

### Target Index
```sql
target_index INTEGER  -- 0, 1, 2, etc. (must match .mind file)
```

### Product Status
```sql
status TEXT  -- 'draft', 'published', or 'archived'
```

### Model Position/Scale
```sql
-- Position (relative to target)
position_x, position_y, position_z  -- Usually 0, 0, 0

-- Rotation (degrees)
rotation_x, rotation_y, rotation_z  -- Usually 0, 0, 0

-- Scale
scale_x, scale_y, scale_z  -- Usually 1, 1, 1 (adjust if too big/small)
```

### UI Colors
```sql
color_primary TEXT     -- Main brand color (e.g., '#4CC3D9')
color_secondary TEXT   -- Secondary color (e.g., '#667eea')
color_background TEXT  -- Background (e.g., 'rgba(0, 0, 0, 0.85)')
color_text TEXT        -- Text color (e.g., '#ffffff')
```

---

## Summary Checklist

- [ ] Upload `.mind` file to `ar-targets` bucket
- [ ] Upload product image to `ar-models` bucket
- [ ] (Optional) Upload reference image for image matching
- [ ] Run SQL STEP 1 - Insert product (save UUID!)
- [ ] Run SQL STEP 2 - Insert target config
- [ ] Run SQL STEP 3 - Insert model config
- [ ] Run SQL STEP 4 - Insert UI config
- [ ] Run SQL STEP 5 - Insert buttons
- [ ] Verify with SQL queries
- [ ] Test in AR app
- [ ] Check console logs
- [ ] Verify correct product displays

---

## Need Help?

**Common Issues:**
- `.mind` file issues → Check CORS, file integrity, CDN settings
- Wrong product shows → Check `target_index`
- Low confidence → Improve reference image quality
- Nothing shows → Check `status = 'published'`

**Debugging Commands:**
```javascript
// Browser console
imageMatcher.getStats()           // Image matching stats
imageMatcher.getProductHashes()   // View all product hashes
CONFIG                            // View full configuration
window.arConfig.products          // List loaded products
```

**SQL Debugging:**
```sql
-- View all products with details
SELECT * FROM products_complete;

-- Check specific product
SELECT * FROM products WHERE product_id = 'product-2';

-- Count products by status
SELECT status, COUNT(*) FROM products GROUP BY status;
```

---

🎉 **You're done!** Your zyn-cool-mint product should now be fully integrated into your AR experience!
