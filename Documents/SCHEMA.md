# products.json Schema Reference

Quick reference for the JSON configuration structure.

## Complete Schema

```javascript
{
  "products": [
    {
      // BASIC INFO
      "id": "string",              // Required: unique identifier
      "name": "string",            // Required: display name
      "description": "string",     // Optional: internal description
      "targetIndex": number,       // Required: 0, 1, 2, etc.

      // IMAGE TARGET
      "target": {
        "imagePath": "string",     // Required: path to .mind file
        "imagePreview": "string"   // Optional: preview image path
      },

      // 3D MODEL
      "model": {
        "path": "string",          // Required: path to .glb file
        "position": {
          "x": number,             // Default: 0
          "y": number,             // Default: 0
          "z": number              // Default: 0
        },
        "rotation": {
          "x": number,             // Degrees, default: 0
          "y": number,             // Degrees, default: 0
          "z": number              // Degrees, default: 0
        },
        "scale": {
          "x": number,             // Default: 1
          "y": number,             // Default: 1
          "z": number              // Default: 1
        },
        "animation": {
          "enabled": boolean,      // Default: false
          "clip": "string",        // "*" for all, or animation name
          "loop": "string"         // "repeat", "once", or "pingpong"
        }
      },

      // USER INTERFACE
      "ui": {
        "colors": {
          "primary": "string",     // CSS color
          "secondary": "string",   // CSS color
          "background": "string",  // CSS color (can use rgba)
          "text": "string"         // CSS color
        },
        "content": {
          "title": "string",       // Main heading
          "subtitle": "string",    // Subheading
          "description": "string", // Body text
          "features": [            // Bullet list (optional)
            "string",
            "string"
          ]
        },
        "buttons": [
          {
            "id": "string",        // Unique per product
            "label": "string",     // Button text
            "icon": "string",      // Emoji
            "link": "string",      // URL
            "style": "string",     // "primary" or "secondary"
            "position": "string"   // Reserved for future use
          }
        ]
      },

      // INTERACTIONS
      "interactions": {
        "onFound": {
          "showUI": boolean,       // Default: true
          "playSound": boolean,    // Default: false
          "soundPath": "string"    // Path to .mp3 file
        },
        "onLost": {
          "hideUI": boolean,       // Default: true
          "pauseAnimation": boolean // Default: false
        }
      }
    }
  ],

  // GLOBAL SETTINGS
  "globalSettings": {
    "multipleTargets": boolean,    // Enable multiple simultaneous targets
    "maxSimultaneousTargets": number, // Max targets at once
    "defaultColors": {
      "primary": "string",
      "secondary": "string",
      "background": "string",
      "text": "string"
    },
    "loading": {
      "title": "string",
      "subtitle": "string",
      "backgroundColor": "string"
    },
    "instructions": {
      "title": "string",
      "subtitle": "string",
      "backgroundColor": "string"
    }
  }
}
```

## Minimal Valid Product

The absolute minimum required fields:

```json
{
  "products": [
    {
      "id": "product-1",
      "name": "My Product",
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
        "colors": {
          "primary": "#4CC3D9"
        },
        "content": {
          "title": "Product Title"
        },
        "buttons": []
      }
    }
  ]
}
```

## Field Types

| Field | Type | Required | Default |
|-------|------|----------|---------|
| `id` | string | ✅ Yes | - |
| `name` | string | ✅ Yes | - |
| `targetIndex` | number | ✅ Yes | - |
| `target.imagePath` | string | ✅ Yes | - |
| `model.path` | string | ✅ Yes | - |
| `model.position.*` | number | ❌ No | 0 |
| `model.rotation.*` | number | ❌ No | 0 |
| `model.scale.*` | number | ❌ No | 1 |
| `ui.colors.primary` | string | ✅ Yes | - |
| `ui.content.title` | string | ✅ Yes | - |
| `ui.buttons` | array | ✅ Yes | [] |

## Validation Rules

### IDs
- Must be unique across all products
- Use lowercase letters, numbers, hyphens
- No spaces or special characters

### Target Index
- Must be non-negative integer (0, 1, 2, ...)
- Must match order in `.mind` file
- Cannot have duplicate indices

### File Paths
- Must start with `./assets/`
- Use forward slashes `/` (not backslashes)
- File must exist at specified path

### Colors
- Valid CSS color formats:
  - Hex: `#4CC3D9`
  - RGB: `rgb(76, 195, 217)`
  - RGBA: `rgba(76, 195, 217, 0.9)`
  - Named: `red`, `blue`, etc.

### Model Values
- Position: any number (recommend -5 to 5)
- Rotation: 0-360 degrees
- Scale: positive numbers (recommend 0.1 to 10)

### Animation Loop
- Valid values: `"repeat"`, `"once"`, `"pingpong"`
- Case-sensitive

### Button Style
- Valid values: `"primary"`, `"secondary"`
- Case-sensitive

## Common Mistakes

❌ **Wrong:**
```json
{
  "id": "Product 1",              // Spaces not allowed
  "targetIndex": "0",             // Should be number, not string
  "model": {
    "path": ".\\assets\\model.glb" // Wrong slashes
  }
}
```

✅ **Correct:**
```json
{
  "id": "product-1",              // Hyphenated, lowercase
  "targetIndex": 0,               // Number
  "model": {
    "path": "./assets/models/model.glb" // Forward slashes
  }
}
```

## Testing Your JSON

1. **Syntax Check**: Use [JSONLint.com](https://jsonlint.com/)
2. **Browser Console**: Check for errors on page load
3. **File Paths**: Verify all files exist
4. **Colors**: Test in browser DevTools

## Example Error Messages

```
Error: Product ID "product-1" is duplicated
→ Check: Each product must have unique ID

Error: Cannot find file "./assets/models/missing.glb"
→ Check: File path is correct and file exists

Error: Invalid color "#GGGGGG"
→ Check: Use valid hex colors (#000000 - #FFFFFF)

Error: targetIndex must be a number
→ Check: Use 0, 1, 2 (not "0", "1", "2")
```

## API Access (JavaScript)

Access configuration at runtime:

```javascript
// Get all products
const products = window.arConfig.products;

// Get product by ID
const product = window.arConfig.getProductById('product-1');

// Get product by target index
const product = window.arConfig.getProductByTargetIndex(0);

// Get currently tracked product
const current = window.arConfig.getCurrentProduct();

// Get global settings
const settings = window.arConfig.globalSettings;
```

---

For detailed usage examples, see `PRODUCTS_CONFIG_GUIDE.md`
