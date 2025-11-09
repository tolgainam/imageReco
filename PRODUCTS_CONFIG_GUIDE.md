# Products Configuration Guide

Complete guide to managing your AR products using the JSON configuration system.

## Overview

The `products.json` file is the central configuration for all your AR experiences. You can define multiple products with their own:
- Image targets
- 3D models
- UI colors and styling
- Content (text, descriptions, features)
- Interactive buttons with links
- Behavior settings

**No code changes needed!** Just edit `products.json` to add/update products.

### Use Case: Single-Product-at-a-Time Scanning

This system is designed for scanning **one physical product at a time** to learn information about it:
- User holds Product A → Scans it → Sees Product A details
- User picks up Product B → Scans it → Sees Product B details
- Perfect for: product education, retail info, marketing, demos

**📖 For detailed target setup, see [TARGET_MANAGEMENT_GUIDE.md](TARGET_MANAGEMENT_GUIDE.md)**

---

## Quick Example

```json
{
  "products": [
    {
      "id": "my-product",
      "name": "My Product Name",
      "targetIndex": 0,
      "target": {
        "imagePath": "./assets/targets/my-product.mind"
      },
      "model": {
        "path": "./assets/models/my-model.glb",
        "position": { "x": 0, "y": 0, "z": 0 },
        "scale": { "x": 1, "y": 1, "z": 1 }
      },
      "ui": {
        "colors": {
          "primary": "#4CC3D9",
          "secondary": "#667eea"
        },
        "content": {
          "title": "Product Title",
          "description": "Product description text"
        },
        "buttons": [
          {
            "id": "btn-buy",
            "label": "Buy Now",
            "icon": "🛒",
            "link": "https://example.com/buy"
          }
        ]
      }
    }
  ]
}
```

---

## Configuration Structure

### Root Level

```json
{
  "products": [/* array of product objects */],
  "globalSettings": {/* global configuration */}
}
```

---

## Product Configuration

### Basic Information

```json
{
  "id": "product-1",           // Unique identifier (letters, numbers, hyphens)
  "name": "Product Name",      // Display name
  "description": "Text",       // Internal description
  "targetIndex": 0             // MindAR target index (0, 1, 2, etc.)
}
```

**Important Notes:**
- `id` must be unique across all products
- `targetIndex` must match the order in your compiled `.mind` file
- For single targets, use `targetIndex: 0`
- For multiple targets, use sequential indices (0, 1, 2, ...)

---

### Target Configuration

```json
{
  "target": {
    "imagePath": "./assets/targets/product.mind",      // Required: path to .mind file
    "imagePreview": "./assets/images/product.jpg"      // Optional: preview image
  }
}
```

**Image Target Setup:**
1. Create image target at: https://hiukim.github.io/mind-ar-js-doc/tools/compile
2. Download `.mind` file
3. Save to `assets/targets/`
4. Update `imagePath` in config

**Multiple Targets:**
- **Option A (Recommended)**: Compile all images into one `.mind` file
  - Use MindAR compiler with multiple images
  - Each image gets a `targetIndex` (0, 1, 2, etc.)
  - Set same `imagePath` for all products

- **Option B**: Separate `.mind` files (requires manual switching)
  - Each product has its own `.mind` file
  - Only one can be active at a time

---

### 3D Model Configuration

```json
{
  "model": {
    "path": "./assets/models/product.glb",  // Required: path to GLB file
    "position": {
      "x": 0,    // Left/Right (-/+)
      "y": 0,    // Down/Up (-/+)
      "z": 0     // Back/Forward (-/+)
    },
    "rotation": {
      "x": 0,    // Pitch (degrees)
      "y": 0,    // Yaw (degrees)
      "z": 0     // Roll (degrees)
    },
    "scale": {
      "x": 1,    // Width multiplier
      "y": 1,    // Height multiplier
      "z": 1     // Depth multiplier
    },
    "animation": {
      "enabled": true,              // Enable/disable animation
      "clip": "*",                  // "*" for all, or animation name
      "loop": "repeat"              // "repeat", "once", or "pingpong"
    }
  }
}
```

**Position Tips:**
- Start with `0, 0, 0` (center of target)
- Adjust Y to raise/lower model above target
- Use small increments (0.1, 0.2, etc.)

**Scale Tips:**
- Start with `1, 1, 1` (original size)
- If too large, try `0.5, 0.5, 0.5`
- If too small, try `2, 2, 2`
- Keep proportions equal unless distortion is desired

**Animation Tips:**
- Set `clip: "*"` to play all animations
- Set `clip: "Walk"` to play specific animation (check GLB file)
- Use `loop: "once"` for one-time animations
- Use `loop: "repeat"` for continuous animations

---

### UI Configuration

#### Colors

```json
{
  "ui": {
    "colors": {
      "primary": "#4CC3D9",                    // Primary button & accent color
      "secondary": "#667eea",                  // Secondary button color
      "background": "rgba(0, 0, 0, 0.85)",    // UI panel background
      "text": "#ffffff"                        // Text color
    }
  }
}
```

**Color Formats:**
- Hex: `#4CC3D9`
- RGB: `rgb(76, 195, 217)`
- RGBA: `rgba(76, 195, 217, 0.9)` (with transparency)
- Named: `white`, `black`, `red`, etc.

**Color Tips:**
- Use your brand colors
- Ensure good contrast (dark bg = light text)
- Test readability on mobile screens
- Use RGBA for semi-transparent backgrounds

---

#### Content

```json
{
  "ui": {
    "content": {
      "title": "Product Title",                    // Main heading
      "subtitle": "Short tagline",                 // Subheading
      "description": "Detailed description text",  // Paragraph text
      "features": [                                // Bulleted list
        "Feature 1",
        "Feature 2",
        "Feature 3"
      ]
    }
  }
}
```

**Content Tips:**
- Keep title short (2-5 words)
- Subtitle should be catchy (5-10 words)
- Description: 1-2 sentences
- Features: 3-5 bullet points max
- Mobile screens are small - be concise!

---

#### Buttons

```json
{
  "ui": {
    "buttons": [
      {
        "id": "btn-learn-more",        // Unique ID (for this product)
        "label": "Learn More",         // Button text
        "icon": "ℹ️",                  // Emoji icon
        "link": "https://example.com", // URL to open
        "style": "primary",            // "primary" or "secondary"
        "position": "bottom-left"      // Future use (currently ignored)
      },
      {
        "id": "btn-buy-now",
        "label": "Buy Now",
        "icon": "🛒",
        "link": "https://example.com/buy",
        "style": "secondary",
        "position": "bottom-right"
      }
    ]
  }
}
```

**Button Tips:**
- Maximum 2-3 buttons per product (UI space is limited)
- Use clear, action-oriented labels ("Buy Now", "Learn More", "Watch Video")
- Primary = main action, Secondary = alternative action
- Links open in new tab automatically
- Use emojis for visual appeal: 🛒 💳 ℹ️ 📱 🎥 ⬇️ 🌐

**Common Button Examples:**

```json
// Buy button
{ "id": "btn-buy", "label": "Buy Now", "icon": "🛒", "link": "https://shop.com/product" }

// Info button
{ "id": "btn-info", "label": "Learn More", "icon": "ℹ️", "link": "https://info.com" }

// Video button
{ "id": "btn-video", "label": "Watch Video", "icon": "🎥", "link": "https://youtube.com/watch?v=xxx" }

// Download button
{ "id": "btn-download", "label": "Download", "icon": "⬇️", "link": "https://files.com/manual.pdf" }

// Contact button
{ "id": "btn-contact", "label": "Contact Us", "icon": "📧", "link": "mailto:info@example.com" }
```

---

### Interactions Configuration

```json
{
  "interactions": {
    "onFound": {
      "showUI": true,                              // Show product UI panel
      "playSound": false,                          // Play sound on detection
      "soundPath": "./assets/sounds/found.mp3"    // Sound file path
    },
    "onLost": {
      "hideUI": true,                              // Hide UI when target lost
      "pauseAnimation": false                      // Pause model animation
    }
  }
}
```

**Interaction Tips:**
- Set `showUI: true` to automatically show product info
- Set `showUI: false` for minimal/clean experience
- Sound files must be in `.mp3` format
- Set `pauseAnimation: true` to save battery when target lost

---

## Global Settings

```json
{
  "globalSettings": {
    "multipleTargets": true,           // Enable multiple simultaneous targets
    "maxSimultaneousTargets": 3,       // Max targets tracked at once
    "defaultColors": {                 // Fallback colors
      "primary": "#4CC3D9",
      "secondary": "#667eea",
      "background": "rgba(0, 0, 0, 0.85)",
      "text": "#ffffff"
    },
    "loading": {                       // Loading screen config
      "title": "Loading AR Experience",
      "subtitle": "Please wait...",
      "backgroundColor": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    },
    "instructions": {                  // Instructions screen config
      "title": "Point Camera at Product",
      "subtitle": "Align your camera with the product to see the AR experience",
      "backgroundColor": "rgba(0, 0, 0, 0.75)"
    }
  }
}
```

---

## Complete Example

Here's a full working example with 2 products:

```json
{
  "products": [
    {
      "id": "coffee-maker",
      "name": "Premium Coffee Maker",
      "description": "High-end coffee maker with AR visualization",
      "targetIndex": 0,
      "target": {
        "imagePath": "./assets/targets/combined.mind",
        "imagePreview": "./assets/images/coffee-maker.jpg"
      },
      "model": {
        "path": "./assets/models/coffee-maker.glb",
        "position": { "x": 0, "y": 0.1, "z": 0 },
        "rotation": { "x": 0, "y": 0, "z": 0 },
        "scale": { "x": 0.8, "y": 0.8, "z": 0.8 },
        "animation": {
          "enabled": true,
          "clip": "Brewing",
          "loop": "repeat"
        }
      },
      "ui": {
        "colors": {
          "primary": "#6F4E37",
          "secondary": "#A0826D",
          "background": "rgba(40, 30, 20, 0.9)",
          "text": "#FFFFFF"
        },
        "content": {
          "title": "Premium Coffee Maker",
          "subtitle": "Barista Quality at Home",
          "description": "Experience the perfect brew with our award-winning coffee maker. See it in action through AR!",
          "features": [
            "15-bar pressure system",
            "One-touch brewing",
            "Built-in grinder",
            "Milk frother included"
          ]
        },
        "buttons": [
          {
            "id": "btn-buy-coffee",
            "label": "Buy Now",
            "icon": "🛒",
            "link": "https://shop.example.com/coffee-maker",
            "style": "primary",
            "position": "bottom-left"
          },
          {
            "id": "btn-recipes",
            "label": "Get Recipes",
            "icon": "☕",
            "link": "https://recipes.example.com",
            "style": "secondary",
            "position": "bottom-right"
          }
        ]
      },
      "interactions": {
        "onFound": {
          "showUI": true,
          "playSound": true,
          "soundPath": "./assets/sounds/coffee-brewing.mp3"
        },
        "onLost": {
          "hideUI": true,
          "pauseAnimation": true
        }
      }
    },
    {
      "id": "smart-speaker",
      "name": "Smart Speaker Pro",
      "description": "Voice-controlled smart speaker",
      "targetIndex": 1,
      "target": {
        "imagePath": "./assets/targets/combined.mind",
        "imagePreview": "./assets/images/smart-speaker.jpg"
      },
      "model": {
        "path": "./assets/models/smart-speaker.glb",
        "position": { "x": 0, "y": 0, "z": 0 },
        "rotation": { "x": 0, "y": 45, "z": 0 },
        "scale": { "x": 1.2, "y": 1.2, "z": 1.2 },
        "animation": {
          "enabled": true,
          "clip": "Pulse",
          "loop": "repeat"
        }
      },
      "ui": {
        "colors": {
          "primary": "#1DB954",
          "secondary": "#1ED760",
          "background": "rgba(25, 20, 20, 0.9)",
          "text": "#FFFFFF"
        },
        "content": {
          "title": "Smart Speaker Pro",
          "subtitle": "Your Voice, Your Control",
          "description": "Control your entire home with voice commands. Premium sound meets smart functionality.",
          "features": [
            "360° premium sound",
            "Multi-room audio",
            "Voice assistant built-in",
            "Smart home hub"
          ]
        },
        "buttons": [
          {
            "id": "btn-buy-speaker",
            "label": "Order Now",
            "icon": "🎵",
            "link": "https://shop.example.com/smart-speaker",
            "style": "primary",
            "position": "bottom-center"
          }
        ]
      },
      "interactions": {
        "onFound": {
          "showUI": true,
          "playSound": false,
          "soundPath": ""
        },
        "onLost": {
          "hideUI": true,
          "pauseAnimation": false
        }
      }
    }
  ],
  "globalSettings": {
    "multipleTargets": true,
    "maxSimultaneousTargets": 2,
    "defaultColors": {
      "primary": "#4CC3D9",
      "secondary": "#667eea",
      "background": "rgba(0, 0, 0, 0.85)",
      "text": "#ffffff"
    },
    "loading": {
      "title": "Loading Product AR",
      "subtitle": "Preparing your experience...",
      "backgroundColor": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    },
    "instructions": {
      "title": "Scan Product Packaging",
      "subtitle": "Point your camera at the product box to begin",
      "backgroundColor": "rgba(0, 0, 0, 0.75)"
    }
  }
}
```

---

## Workflow: Adding a New Product

### Quick Start Workflow

```
1. Photograph Product
   ↓
2. Create .mind File (MindAR Compiler)
   ↓
3. Add GLB Model
   ↓
4. Edit products.json
   ↓
5. Test on Mobile
```

### Step 1: Create Image Target

**For Single Product:**
1. Take a photo of your product box
2. Visit: https://hiukim.github.io/mind-ar-js-doc/tools/compile
3. Upload image
4. Download `.mind` file
5. Save to `assets/targets/your-product.mind`

**For Product Catalog (Multiple Products):**
1. Take photos of ALL products you want to support
2. Visit compiler
3. Upload ALL images at once (they'll get indices 0, 1, 2, ...)
4. Download single `products.mind` file
5. Save to `assets/targets/products.mind`

**📖 Detailed guide:** See [TARGET_MANAGEMENT_GUIDE.md](TARGET_MANAGEMENT_GUIDE.md)

### Step 2: Prepare 3D Model
1. Create or obtain GLB model
2. Optimize (< 5MB, < 50k triangles)
3. Save to `assets/models/your-product.glb`

### Step 3: Add to products.json

**For Combined .mind File (Recommended):**
```json
{
  "products": [
    {
      "id": "product-1",
      "targetIndex": 0,
      "target": { "imagePath": "./assets/targets/products.mind" }
    },
    {
      "id": "product-2",
      "targetIndex": 1,
      "target": { "imagePath": "./assets/targets/products.mind" }
    }
  ]
}
```

**For Individual .mind Files:**
```json
{
  "id": "your-product",
  "name": "Your Product Name",
  "targetIndex": 0,
  "target": {
    "imagePath": "./assets/targets/your-product.mind"
  },
  "model": {
    "path": "./assets/models/your-product.glb",
    "position": { "x": 0, "y": 0, "z": 0 },
    "scale": { "x": 1, "y": 1, "z": 1 }
  },
  "ui": {
    "colors": {
      "primary": "#YOUR_COLOR"
    },
    "content": {
      "title": "Your Title",
      "description": "Your description"
    },
    "buttons": [
      {
        "id": "btn-action",
        "label": "Action",
        "icon": "🔗",
        "link": "https://your-link.com",
        "style": "primary"
      }
    ]
  }
}
```

### Step 4: Test
1. Start server: `npm start`
2. Open on mobile: `http://YOUR-IP:8000`
3. Point camera at product
4. Adjust position/scale in JSON as needed

---

## Tips & Best Practices

### Performance
- Keep GLB files < 5MB
- Limit to 2-3 simultaneous targets
- Use compressed textures
- Test on actual mobile devices

### UI Design
- Use high-contrast colors
- Keep text concise
- Test button sizes (48x48px minimum)
- Consider brand colors

### Image Targets
- High-quality photos (300+ DPI)
- Good lighting, no glare
- Complex patterns track better
- A4 size print recommended

### Testing Checklist
- [ ] Image target detects reliably
- [ ] 3D model appears correctly
- [ ] Model scale is appropriate
- [ ] UI colors match brand
- [ ] All buttons work
- [ ] Links open correctly
- [ ] Animations play smoothly
- [ ] Works on iOS and Android

---

## Troubleshooting

**Product not loading:**
- Check JSON syntax (use JSONLint.com)
- Verify file paths are correct
- Check browser console for errors

**Model not showing:**
- Verify GLB file exists at path
- Test model at: https://gltf-viewer.donmccurdy.com/
- Check scale (might be too small/large)

**Buttons not working:**
- Verify `link` URL is correct
- Check button `id` is unique
- Test on actual device (not simulator)

**Colors not applying:**
- Use valid CSS color format
- Check spelling of color properties
- Clear browser cache

---

## Advanced: Custom Events

Listen to AR events in your own JavaScript:

```javascript
// Product found
window.addEventListener('ar-product-found', (event) => {
  const product = event.detail;
  console.log('Found:', product.name);
  // Your custom logic
});

// Product lost
window.addEventListener('ar-product-lost', (event) => {
  const product = event.detail;
  console.log('Lost:', product.name);
  // Your custom logic
});

// Button clicked
window.addEventListener('ar-button-click', (event) => {
  const { product, button } = event.detail;
  console.log(`Button ${button.label} clicked for ${product.name}`);
  // Analytics, custom behavior, etc.
});
```

---

## Support

For issues with:
- **JSON format**: Use [JSONLint](https://jsonlint.com/) to validate
- **Image targets**: See `assets/targets/README.md`
- **3D models**: See `assets/models/README.md`
- **General setup**: See `QUICK_START.md`

---

**Last Updated**: 2025-11-09
**Version**: 1.0
