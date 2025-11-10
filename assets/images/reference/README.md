# Reference Images Directory

This directory stores reference photos of your product boxes for image-to-image matching using perceptual hashing.

## How It Works

When MindAR detects a product box (using the `.mind` file for shape detection), the ImageMatcher compares the camera frame against these reference images to identify which specific product variant it is.

## Adding Reference Images

### 1. Take High-Quality Photos

For each product variant, take a clear photo of the box:

**Best Practices:**
- ✅ Use good lighting (natural daylight is best)
- ✅ Capture the full box face (front or top)
- ✅ Keep the box straight and centered
- ✅ Use high resolution (at least 800x800px)
- ✅ Avoid glare or reflections
- ✅ Consistent angle across all products

**Avoid:**
- ❌ Blurry or out-of-focus images
- ❌ Extreme angles or perspectives
- ❌ Dark or poorly lit photos
- ❌ Partial boxes or cut-off edges

### 2. Save Images to This Directory

Save your reference images with descriptive names:

```
/assets/images/reference/
  ├── product-mint-ref.jpg
  ├── product-blue-ref.jpg
  ├── product-red-ref.jpg
  ├── product-green-ref.jpg
  └── product-purple-ref.jpg
```

**Naming Convention:** Use `product-{variant}-ref.jpg`

### 3. Update products.json

Add the `referenceImage` field to each product:

```json
{
  "id": "product-mint",
  "name": "Mint Flavor",
  "referenceImage": "./assets/images/reference/product-mint-ref.jpg",
  ...
}
```

### 4. Test Detection

1. Open the AR experience in your browser
2. Point camera at a product box
3. Check console for identification results:
   - ✅ `Product identified: product-mint (92.3% confidence)` = Success
   - ⚠️ `Low confidence match (65.4%)` = Add better reference photo
   - ❌ `Detection failed` = Check image path and format

## Image Formats

Supported formats:
- **JPEG** (.jpg, .jpeg) - Recommended
- **PNG** (.png)
- **WebP** (.webp)

## File Size Recommendations

- **Ideal:** 500KB - 2MB per image
- **Max:** 5MB (larger files slow down initialization)

**Optimization Tips:**
- Resize to 1200px width/height (maintains quality, reduces size)
- Use 80-90% JPEG quality
- Tools: TinyPNG, ImageOptim, Squoosh.app

## Multiple Photos Per Product (Advanced)

For better accuracy, you can add multiple reference photos per product:

```json
{
  "id": "product-mint",
  "referenceImages": [
    "./assets/images/reference/product-mint-front.jpg",
    "./assets/images/reference/product-mint-top.jpg",
    "./assets/images/reference/product-mint-angle.jpg"
  ]
}
```

**Note:** This requires modifying the ImageMatcher to support arrays. (Not yet implemented)

## Troubleshooting

### Low Detection Accuracy

**Problem:** System consistently identifies wrong product

**Solutions:**
1. **Improve Reference Photos**
   - Retake with better lighting
   - Use the same angle you'll scan from
   - Ensure all products are photographed consistently

2. **Adjust Confidence Threshold**
   ```javascript
   // In browser console:
   imageMatcher.setConfidenceThreshold(0.85); // Default is 0.80
   ```

3. **Check Hash Quality**
   ```javascript
   // In browser console:
   imageMatcher.getProductHashes();
   // Verify all products have different hashes
   ```

### Detection Too Slow

**Problem:** Takes too long to identify product

**Solutions:**
1. **Reduce Image Resolution**
   - Resize reference images to 800x800px

2. **Optimize Image Format**
   - Convert PNG to JPEG
   - Reduce file size

3. **Increase Throttle Interval**
   ```javascript
   // In app.js, increase DETECTION_INTERVAL:
   const DETECTION_INTERVAL = 1000; // 1 second (default: 500ms)
   ```

### Similar Products Confused

**Problem:** System confuses similar-looking products

**Solutions:**
1. **Use Photos from Different Angles**
   - Photograph the most distinctive side
   - Capture unique text/graphics clearly

2. **Consider Using Multiple Reference Photos**
   - Train with 2-3 angles per product
   - System averages the hash comparisons

3. **Upgrade to MobileNet** (if perceptual hashing isn't accurate enough)
   - See `/Documents/product-detection-image-matching.md`
   - Better handling of subtle differences

## Performance Stats

Check detection performance in console:

```javascript
// Get statistics
imageMatcher.getStats();

// Output example:
{
  totalComparisons: 45,
  averageComparisonTime: 23.4, // ms
  successfulMatches: 40,
  failedMatches: 5,
  successRate: "88.9%"
}
```

## Example Setup

Here's a complete example for 3 product variants:

### Directory Structure
```
/assets/images/reference/
  ├── mint-box.jpg      (550KB, 1200x1200)
  ├── blue-box.jpg      (620KB, 1200x1200)
  └── red-box.jpg       (580KB, 1200x1200)
```

### products.json
```json
{
  "products": [
    {
      "id": "product-mint",
      "name": "Mint Flavor",
      "referenceImage": "./assets/images/reference/mint-box.jpg",
      "target": {
        "imagePath": "./assets/targets/generic-box.mind"
      }
    },
    {
      "id": "product-blue",
      "name": "Blue Flavor",
      "referenceImage": "./assets/images/reference/blue-box.jpg",
      "target": {
        "imagePath": "./assets/targets/generic-box.mind"
      }
    },
    {
      "id": "product-red",
      "name": "Red Flavor",
      "referenceImage": "./assets/images/reference/red-box.jpg",
      "target": {
        "imagePath": "./assets/targets/generic-box.mind"
      }
    }
  ]
}
```

### Expected Console Output
```
🔍 ImageMatcher initialized
🔄 Initializing ImageMatcher with 3 product(s)...
✓ Hash computed for product-mint: 0x1a2b3c4d5e6f7a8b...
✓ Hash computed for product-blue: 0x9c8d7e6f5a4b3c2d...
✓ Hash computed for product-red: 0x5f4e3d2c1b0a9f8e...
✅ ImageMatcher ready with 3 reference image(s) (245.67ms)

Target 0 found
🔍 Identifying product variant...
🔍 Product identification results:
  ✓ product-mint: 91.2%
  ○ product-blue: 45.8%
  ○ product-red: 38.3%
⚡ Comparison time: 28.45ms
✅ Product identified: product-mint (91.2% confidence)
```

## Next Steps

1. **Add your first reference image** to this directory
2. **Update products.json** with the file path
3. **Test in browser** and check console logs
4. **Iterate:** Improve photos if accuracy is low
5. **Scale:** Add more product variants as needed

---

**Questions?** Check the full documentation:
- `/Documents/product-detection-image-matching.md` - Complete technical guide
- Console debugging: Enable verbose logs in `/js/config.js`
