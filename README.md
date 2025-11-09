# Image Recognition AR Experience

Web-based AR application using MindAR for image tracking and A-Frame for 3D rendering.

## Features

- 📸 Image target tracking (product boxes)
- 🎨 3D GLB model display with animations
- 📱 Works on iOS and Android browsers
- 🎯 Real-world orientation tracking (6DOF)
- 🖼️ Custom HTML/CSS UI overlays
- 🔢 Support for multiple image targets (1-3)
- ⚙️ **JSON-based product configuration** (no code changes needed!)
- 🎨 **Per-product colors, content, and buttons**
- 🔗 **Interactive buttons with custom links**

## Quick Start

### For End Users (Testing)

1. **Start the server**
   ```bash
   npm start
   # or
   python3 -m http.server 8000
   ```

2. **Access on mobile**
   - Open `http://YOUR-IP:8000` (on same WiFi)
   - Allow camera permissions
   - Point camera at product box

### For Developers (Adding Products)

**Simple 3-step process:**

1. **Create image target** (`.mind` file)
   - Upload product photo to [MindAR Compiler](https://hiukim.github.io/mind-ar-js-doc/tools/compile)
   - Download `.mind` file → save to `assets/targets/`
   - 📖 See [TARGET_MANAGEMENT_GUIDE.md](TARGET_MANAGEMENT_GUIDE.md)

2. **Add 3D model** (optional)
   - Place GLB file in `assets/models/`

3. **Edit `products.json`** - Configure everything:
   - Image targets (which .mind file)
   - 3D models
   - UI colors
   - Content text
   - Button links
   - 📖 See [PRODUCTS_CONFIG_GUIDE.md](PRODUCTS_CONFIG_GUIDE.md)

**No HTML/JS editing needed!** The system automatically configures everything from JSON.

## Project Structure

```
imageReco/
├── 📘 Documentation
│   ├── README.md                    # This file
│   ├── QUICK_START.md               # 5-minute setup
│   ├── PRODUCTS_CONFIG_GUIDE.md     # 🌟 JSON configuration guide
│   ├── TARGET_MANAGEMENT_GUIDE.md   # 🌟 Image target (.mind files) guide
│   ├── SCHEMA.md                    # JSON schema reference
│   ├── SYSTEM_SUMMARY.md            # Configuration system overview
│   ├── PROJECT_OVERVIEW.md          # Complete project summary
│   └── PROJECT_PLAN.md              # Implementation roadmap
│
├── 🎨 Configuration
│   └── products.json                # 🌟 Product definitions (edit this!)
│
├── 🌐 Application
│   ├── index.html                   # Main AR experience
│   ├── css/styles.css               # UI styling
│   └── js/
│       ├── app.js                   # Core AR logic
│       └── config-loader.js         # 🌟 JSON loader & UI generator
│
└── 📁 Assets
    ├── targets/                     # .mind tracking files
    ├── models/                      # GLB 3D models
    ├── images/                      # UI images
    └── sounds/                      # Audio files (optional)
```

## Configuration System

### Managing Products via JSON

All products are configured in **`products.json`** - no code editing required!

**Example product configuration:**

```json
{
  "products": [
    {
      "id": "my-product",
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
          "primary": "#4CC3D9",
          "secondary": "#667eea"
        },
        "content": {
          "title": "Product Name",
          "description": "Product description text"
        },
        "buttons": [
          {
            "id": "btn-buy",
            "label": "Buy Now",
            "icon": "🛒",
            "link": "https://example.com/buy",
            "style": "primary"
          }
        ]
      }
    }
  ]
}
```

### What You Can Configure

- ✅ Image targets (`.mind` files)
- ✅ 3D models (GLB files)
- ✅ Model position, rotation, scale
- ✅ Animations (clips, looping)
- ✅ UI colors (per product)
- ✅ Content (title, description, features)
- ✅ Buttons (up to 2-3 per product)
- ✅ Button links and styling
- ✅ Interaction behaviors

**📖 Complete Guide**: See [PRODUCTS_CONFIG_GUIDE.md](PRODUCTS_CONFIG_GUIDE.md)

## Technology Stack

- **MindAR** (v1.2+) - Image tracking
- **A-Frame** (v1.4+) - 3D rendering framework
- **aframe-extras** (v7.2+) - Animation support
- **Three.js** - 3D engine (via A-Frame)

## Browser Compatibility

- iOS Safari 11+
- Android Chrome 79+
- Modern mobile browsers with camera access

## Development

### Requirements
- HTTPS or localhost (required for camera access)
- Modern browser
- Mobile device for testing

### Local Testing
```bash
# Option 1: Python
python3 -m http.server 8000

# Option 2: Node.js
npx serve

# Option 3: PHP
php -S localhost:8000
```

### Mobile Testing
- Use ngrok for HTTPS tunneling
- Or test on same WiFi network

## Resources

- [MindAR Documentation](https://hiukim.github.io/mind-ar-js-doc/)
- [A-Frame Documentation](https://aframe.io/docs/)
- [GLB Viewer](https://gltf-viewer.donmccurdy.com/)
- [Image Compiler Tool](https://hiukim.github.io/mind-ar-js-doc/tools/compile)

## License

MIT

## Support

For issues and questions, refer to:
- [MindAR GitHub](https://github.com/hiukim/mind-ar-js)
- [A-Frame Community](https://aframe.io/community/)
