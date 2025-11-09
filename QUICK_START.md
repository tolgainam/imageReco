# Quick Start Guide

Get your AR experience running in 5 minutes!

## Step 1: Create Your Image Target (2 min)

1. Take a clear photo of your product box
2. Go to: https://hiukim.github.io/mind-ar-js-doc/tools/compile
3. Upload your image
4. Check the red dots (feature points) - more is better
5. Click "Download Compiled"
6. Save the `.mind` file to `assets/targets/`
7. Rename it to something simple like `product.mind`

## Step 2: Update products.json (1 min)

Open `products.json` and update the first product:

```json
{
  "products": [
    {
      "id": "my-product",
      "name": "My Product Name",
      "targetIndex": 0,
      "target": {
        "imagePath": "./assets/targets/product.mind"
      },
      "model": {
        "path": "./assets/models/product.glb",
        "position": { "x": 0, "y": 0, "z": 0 },
        "scale": { "x": 1, "y": 1, "z": 1 }
      },
      "ui": {
        "colors": { "primary": "#4CC3D9" },
        "content": { "title": "My Product" },
        "buttons": []
      }
    }
  ]
}
```

**The system automatically configures `index.html` for you!** No manual HTML editing needed.

## Step 3: Start Local Server (1 min)

**Option A - Using Python:**
```bash
python3 -m http.server 8000
```

**Option B - Using Node.js:**
```bash
npm start
```

**Option C - Using PHP:**
```bash
php -S localhost:8000
```

## Step 4: Test on Mobile (1 min)

1. Open your phone's browser
2. Go to: `http://YOUR-COMPUTER-IP:8000`
   - Find your IP:
     - Mac: System Preferences > Network
     - Windows: `ipconfig` in Command Prompt
   - Example: `http://192.168.1.100:8000`
3. Allow camera permissions
4. **Check browser console** (important!)
   - You should see: `✅ Configuration loaded successfully`
   - And: `🎯 Setting image target source: ./assets/targets/product.mind`
5. Point camera at your product box

**Note**: Your phone and computer must be on the same WiFi network.

**💡 Pro Tip**: Open browser DevTools (F12) on desktop or use remote debugging to see console output on mobile.

## Step 5: Add Your 3D Model (Optional)

1. Get a GLB model (create in Blender or download from Sketchfab)
2. Save it to `assets/models/mymodel.glb`
3. Update `products.json`:

```json
{
  "products": [
    {
      "id": "my-product",
      "model": {
        "path": "./assets/models/mymodel.glb",
        "position": { "x": 0, "y": 0, "z": 0 },
        "scale": { "x": 0.5, "y": 0.5, "z": 0.5 },
        "animation": {
          "enabled": true,
          "clip": "*",
          "loop": "repeat"
        }
      },
      "ui": {
        "colors": { "primary": "#4CC3D9" },
        "content": {
          "title": "My Product",
          "description": "Product description here"
        },
        "buttons": [
          {
            "id": "btn-buy",
            "label": "Buy Now",
            "icon": "🛒",
            "link": "https://your-shop.com",
            "style": "primary"
          }
        ]
      }
    }
  ]
}
```

**The system automatically loads the model!** No HTML editing needed.

📖 **For more details:** See [PRODUCTS_CONFIG_GUIDE.md](PRODUCTS_CONFIG_GUIDE.md)

## Troubleshooting

### Camera not working
- Make sure you're using HTTPS or localhost
- Check browser camera permissions
- Try a different browser

### Target not detected
- Ensure good lighting
- Print the target larger (A4 size works well)
- Make sure the image has enough detail/contrast
- Try creating a new target with a different photo

### 3D model not showing
- Check browser console (F12) for errors
- Verify file path is correct
- Test model at https://gltf-viewer.donmccurdy.com/
- Try adjusting scale (might be too small or large)

### Slow performance
- Use a smaller/optimized GLB model
- Reduce texture sizes
- Test on a more powerful device

## Next Steps

**Configuration & Customization:**
- 📖 **[PRODUCTS_CONFIG_GUIDE.md](PRODUCTS_CONFIG_GUIDE.md)** - Complete JSON configuration guide
- 🎯 **[TARGET_MANAGEMENT_GUIDE.md](TARGET_MANAGEMENT_GUIDE.md)** - Creating .mind files
- 📋 **[SCHEMA.md](SCHEMA.md)** - JSON structure reference

**Project Documentation:**
- Read `PROJECT_PLAN.md` for detailed implementation guide
- Check `README.md` for full documentation
- Explore `assets/*/README.md` for specific guidance

**Advanced Customization (Optional):**
- Customize `css/styles.css` for your brand
- Modify `js/app.js` for custom interactions
- See `FUTURE_ENHANCEMENTS.md` for upcoming features

## Need Help?

- MindAR Docs: https://hiukim.github.io/mind-ar-js-doc/
- A-Frame Docs: https://aframe.io/docs/
- Examples: https://github.com/hiukim/mind-ar-js/tree/master/examples

## Testing Checklist

- [ ] Image target created and compiled
- [ ] `products.json` updated with correct `.mind` file path
- [ ] Console shows `✅ Configuration loaded successfully`
- [ ] Console shows no validation errors
- [ ] Local server running
- [ ] Mobile device on same WiFi
- [ ] Camera permissions granted
- [ ] Target detected successfully
- [ ] 3D content displays correctly
- [ ] Content aligns with target orientation
- [ ] Product UI appears with correct colors
- [ ] Buttons work (if configured)

---

## Important Notes

### JSON Configuration System

This project uses a **JSON-based configuration system**. You configure everything in `products.json`:
- Image targets
- 3D models
- UI colors and content
- Interactive buttons

**You don't need to edit HTML files!** The system automatically:
- Loads your `.mind` files
- Creates 3D models
- Generates UI elements
- Sets up interactions

### Validation & Debugging

Always check the browser console for:
- ✅ Configuration loaded successfully
- 🎯 Target validation messages
- ⚠️ Warnings about configuration issues
- ❌ Error messages with solutions

### Multiple Products

To add more products, just add entries to the `products` array in `products.json`:

```json
{
  "products": [
    {"id": "product-1", "targetIndex": 0, ...},
    {"id": "product-2", "targetIndex": 1, ...},
    {"id": "product-3", "targetIndex": 2, ...}
  ]
}
```

All products must use the **same .mind file** (compile all images together) or the system will warn you.

📖 **See [TARGET_MANAGEMENT_GUIDE.md](TARGET_MANAGEMENT_GUIDE.md)** for details on creating combined .mind files.

---

**Pro Tip**: Start with a simple configuration (no 3D model, just test tracking), then gradually add models, colors, and buttons.
