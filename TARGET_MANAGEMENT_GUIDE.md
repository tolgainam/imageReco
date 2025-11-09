# Image Target Management Guide

Complete guide for creating and managing `.mind` files for AR image tracking.

## Overview

Image targets (`.mind` files) are what MindAR uses to recognize your physical products. This guide explains how to create, manage, and configure them for **single-product-at-a-time scanning**.

---

## Understanding .mind Files

### What is a .mind file?

- Compiled image tracking data created by MindAR
- Contains feature points and descriptors for image recognition
- Required for MindAR to detect and track physical objects
- Binary format (not human-readable)

### File Location

```
assets/
└── targets/
    ├── products.mind          ← Combined file (RECOMMENDED)
    ├── product-1.mind         ← Or individual files
    └── product-2.mind
```

---

## Two Approaches

### Approach 1: Combined .mind File (RECOMMENDED)

**Best for:** Multiple products, user can scan any of them

**Workflow:**
1. Collect photos of ALL products
2. Upload ALL images to compiler at once
3. Download single `products.mind` file
4. Each product gets a `targetIndex` (0, 1, 2, ...)

**Benefits:**
✅ User can scan any product without reloading
✅ Instant switching between products
✅ Single file to manage
✅ Better for product catalogs

**Configuration:**
```json
{
  "products": [
    {
      "id": "product-a",
      "targetIndex": 0,
      "target": { "imagePath": "./assets/targets/products.mind" }
    },
    {
      "id": "product-b",
      "targetIndex": 1,
      "target": { "imagePath": "./assets/targets/products.mind" }
    },
    {
      "id": "product-c",
      "targetIndex": 2,
      "target": { "imagePath": "./assets/targets/products.mind" }
    }
  ]
}
```

### Approach 2: Individual .mind Files

**Best for:** Single product, or frequently changing catalog

**Workflow:**
1. Create one `.mind` file per product
2. Upload to compiler individually
3. Update `products.json` when adding/removing

**Benefits:**
✅ Easier to update individual products
✅ Smaller file sizes per product
✅ Simple for single-product use

**Drawbacks:**
❌ Can only track ONE product at a time
❌ Need to manually configure which one to use
❌ More files to manage

**Configuration:**
```json
{
  "products": [
    {
      "id": "product-a",
      "targetIndex": 0,
      "target": { "imagePath": "./assets/targets/product-a.mind" }
    }
  ]
}
```

---

## Step-by-Step: Creating Image Targets

### Step 1: Photograph Your Products

**Camera Setup:**
- Good lighting (natural light or bright indoor)
- No shadows or glare
- Focus on the surface you want to track
- Fill the frame with the product

**Image Requirements:**
- Format: JPG or PNG
- Resolution: 1920x1080 or higher
- DPI: 300+ recommended (72 minimum)
- File size: < 5MB for upload

**What Makes a Good Target:**
✅ High contrast (varied colors/brightness)
✅ Complex patterns or text
✅ Asymmetric design
✅ Sharp edges and details

**What to Avoid:**
❌ Plain solid colors
❌ Very simple logos
❌ Highly symmetrical patterns
❌ Reflective/glossy surfaces
❌ Blurry images

### Step 2: Use MindAR Compiler

**URL:** https://hiukim.github.io/mind-ar-js-doc/tools/compile

**For Combined .mind (Multiple Products):**

1. Click "Start"
2. Click "+" to add first image
3. Click "+" again to add second image
4. Continue for all products (up to 10 recommended)
5. Wait for processing
6. Check feature points (red circles)
   - More circles = better tracking
   - Good distribution = stable tracking
7. Click "Download Compiled"
8. Save as `products.mind`

**For Individual .mind (Single Product):**

1. Click "Start"
2. Upload single product image
3. Check feature points
4. Click "Download Compiled"
5. Save as `product-name.mind`

### Step 3: Evaluate Tracking Quality

The compiler shows **red circles** = feature points

**Good Target (100+ points):**
```
🔴🔴🔴🔴🔴🔴🔴🔴
🔴🔴  Product  🔴🔴
🔴🔴   Image   🔴🔴
🔴🔴🔴🔴🔴🔴🔴🔴
```

**Poor Target (< 30 points):**
```
     🔴
         🔴
    Product
  🔴
```

**If you get poor results:**
- Try a different photo with more detail
- Increase image resolution
- Ensure better lighting
- Choose a different product face

### Step 4: Save to Project

```bash
# Move downloaded file to project
mv ~/Downloads/targets.mind ./assets/targets/products.mind
```

### Step 5: Update products.json

**For combined file:**
```json
{
  "products": [
    {
      "id": "my-product",
      "targetIndex": 0,
      "target": {
        "imagePath": "./assets/targets/products.mind"
      }
    }
  ]
}
```

**targetIndex guide:**
- First image uploaded = `targetIndex: 0`
- Second image = `targetIndex: 1`
- Third image = `targetIndex: 2`
- And so on...

### Step 6: Test

```bash
npm start
# Open http://YOUR-IP:8000 on mobile
# Point camera at physical product
```

---

## File Naming Conventions

### Recommended Names

**Combined file (multiple products):**
- `products.mind` ✅
- `all-targets.mind` ✅
- `catalog.mind` ✅
- `combined.mind` ✅

**Individual files:**
- `product-name.mind` ✅
- `zyn-spearmint.mind` ✅
- `coffee-maker.mind` ✅

**Avoid:**
- Spaces: `my product.mind` ❌
- Special chars: `product@2024.mind` ❌
- Uppercase: `PRODUCT.mind` ❌ (works but inconsistent)

---

## How the System Uses Targets

### Automatic Configuration

1. You edit `products.json`
2. System reads all product configurations
3. Validates target paths (checks for mismatches)
4. Automatically sets `imageTargetSrc` in A-Frame scene
5. Logs configuration to console

### Console Output Example

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

### Error Detection

**If you use multiple different .mind files:**

```
❌ Multiple different .mind files detected:
      1. ./assets/targets/product-1.mind (used by 1 product(s))
      2. ./assets/targets/product-2.mind (used by 1 product(s))
   ⚠️ MindAR can only load ONE .mind file at a time!
   💡 Solution: Compile all product images into one combined .mind file
   🔗 Use: https://hiukim.github.io/mind-ar-js-doc/tools/compile
```

---

## Common Scenarios

### Scenario 1: Product Catalog (3-5 products)

**Setup:**
```json
{
  "products": [
    {"id": "headphones", "targetIndex": 0, "target": {"imagePath": "./assets/targets/catalog.mind"}},
    {"id": "speaker", "targetIndex": 1, "target": {"imagePath": "./assets/targets/catalog.mind"}},
    {"id": "earbuds", "targetIndex": 2, "target": {"imagePath": "./assets/targets/catalog.mind"}}
  ]
}
```

**How to create `catalog.mind`:**
1. Take photos of all 3 products
2. Upload all 3 to compiler
3. Download as `catalog.mind`
4. First photo = index 0, second = 1, third = 2

### Scenario 2: Single Product Demo

**Setup:**
```json
{
  "products": [
    {"id": "demo-product", "targetIndex": 0, "target": {"imagePath": "./assets/targets/demo.mind"}}
  ]
}
```

**How to create `demo.mind`:**
1. Take one product photo
2. Upload to compiler
3. Download as `demo.mind`

### Scenario 3: Adding New Product to Existing Catalog

**Option A: Re-compile (Recommended)**
1. Take photo of new product
2. Re-upload ALL products (old + new) to compiler
3. Download new `catalog.mind`
4. Add new entry to `products.json` with next `targetIndex`

**Option B: Separate file (Quick)**
1. Create `new-product.mind`
2. Temporarily use only that product
3. Later re-compile into combined file

---

## Troubleshooting

### Target Not Detected

**Problem:** Camera sees product but nothing happens

**Solutions:**
1. **Check image quality:**
   - Re-compile with higher resolution photo
   - Ensure good lighting when photographing
   - Avoid reflections/glare

2. **Print size matters:**
   - Minimum: Business card size (3.5" x 2")
   - Recommended: A4/Letter size (8.5" x 11")
   - Larger = more reliable tracking

3. **Test in good lighting:**
   - Bright indoor lighting or natural light
   - Avoid shadows on product
   - Point camera directly at target

4. **Check console:**
   ```javascript
   // Open browser DevTools (F12)
   // Look for target detection logs
   ```

### Wrong Product Detected

**Problem:** Scanning Product A shows Product B's info

**Solution:**
- Check `targetIndex` in `products.json`
- Verify index matches upload order in compiler
- First uploaded = 0, second = 1, etc.

### "File Not Found" Error

**Problem:** Console shows `404: ./assets/targets/products.mind`

**Solution:**
1. Check file exists at exact path
2. Verify spelling and case sensitivity
3. Ensure file is in correct folder
4. Check browser console for exact error

### Poor Tracking Stability

**Problem:** AR content jitters or loses tracking

**Solutions:**
1. **Re-compile with better image:**
   - Higher resolution (300+ DPI)
   - More complex pattern
   - Better lighting in photo

2. **Physical conditions:**
   - Improve lighting when using AR
   - Keep product steady
   - Maintain distance (6-12 inches)

3. **Image quality:**
   - Aim for 100+ feature points
   - Even distribution across image
   - High contrast areas

---

## Best Practices

### DO ✅

- Use combined `.mind` file for multiple products
- Test on actual physical products (not screens)
- Take high-quality reference photos (300+ DPI)
- Use descriptive file names
- Check feature points before downloading
- Keep .mind files under 5MB each
- Test in various lighting conditions
- Backup your .mind files

### DON'T ❌

- Don't use multiple separate .mind files simultaneously
- Don't use low-resolution photos (< 1920x1080)
- Don't photograph products through glass
- Don't use pure white/black backgrounds
- Don't compress .mind files (they're already optimized)
- Don't edit products.json without validating JSON syntax
- Don't forget to update `targetIndex` when adding products

---

## Quick Reference

### Creating Targets Checklist

- [ ] Take high-quality photos of products
- [ ] Upload to MindAR compiler
- [ ] Check feature points (aim for 100+)
- [ ] Download `.mind` file
- [ ] Save to `assets/targets/`
- [ ] Update `products.json`
- [ ] Test on mobile device
- [ ] Verify tracking quality
- [ ] Test in different lighting
- [ ] Document product order (targetIndex)

### File Size Guidelines

| Products | Typical Size | Max Recommended |
|----------|--------------|-----------------|
| 1 product | 500KB - 1MB | 2MB |
| 2-3 products | 1MB - 2MB | 5MB |
| 4-5 products | 2MB - 3MB | 8MB |
| 6-10 products | 3MB - 5MB | 10MB |

Larger files = slower loading on mobile

---

## Tools & Resources

- **MindAR Compiler**: https://hiukim.github.io/mind-ar-js-doc/tools/compile
- **Image Optimization**: https://tinypng.com/
- **Resolution Check**: https://www.imageresizer.com/
- **MindAR Docs**: https://hiukim.github.io/mind-ar-js-doc/

---

**Last Updated**: 2025-11-09
**Version**: 1.0
