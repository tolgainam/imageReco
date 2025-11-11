# Image Recognition AR Experience

Web-based AR application using MindAR for image tracking and A-Frame for 3D rendering.

## Features

### Core AR Experience
- 📸 Image target tracking (product boxes)
- 🎨 3D GLB model display with animations
- 📱 Works on iOS and Android browsers
- 🎯 Real-world orientation tracking (6DOF)
- 🖼️ Custom HTML/CSS UI overlays with glassmorphism effects
- 🔢 Support for multiple image targets (1-3)

### Product Recognition & Intelligence
- 🤖 **ML-based product classification** using TensorFlow.js
- 🧠 **Teachable Machine integration** for custom model training
- 🎯 **90%+ accuracy** in distinguishing product variants
- ⚡ **Ultra-fast inference** (26-49ms response time)
- 🔍 **Distinguishes similar products** (e.g., different flavors/variants)

### Configuration & Data Management
- ⚙️ **Dual-mode configuration**: JSON files or Supabase database
- 🗄️ **Supabase integration** for dynamic product management
- 🎨 **Per-product customization**: colors, content, and buttons
- 🔗 **Interactive buttons** with custom links
- ✨ **Visual effects**: Edge glow and ambient lighting
- 📊 **Analytics tracking** (optional, via Supabase)

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
│   ├── ML_IMPLEMENTATION.md         # 🌟 ML setup & training guide
│   ├── QUICK_START.md               # 5-minute setup
│   ├── PRODUCTS_CONFIG_GUIDE.md     # 🌟 JSON configuration guide
│   ├── TARGET_MANAGEMENT_GUIDE.md   # 🌟 Image target (.mind files) guide
│   ├── SCHEMA.md                    # JSON schema reference
│   ├── SYSTEM_SUMMARY.md            # Configuration system overview
│   ├── PROJECT_OVERVIEW.md          # Complete project summary
│   └── PROJECT_PLAN.md              # Implementation roadmap
│
├── 🎨 Configuration
│   ├── products.json                # 🌟 Product definitions (JSON mode)
│   └── js/config.js                 # 🌟 Feature flags & Supabase credentials
│
├── 🌐 Application
│   ├── index.html                   # Main AR experience
│   ├── css/styles.css               # UI styling with glassmorphism
│   └── js/
│       ├── app.js                   # Core AR logic
│       ├── config-loader.js         # 🌟 JSON loader & UI generator
│       ├── supabase-config-loader.js # 🌟 Supabase loader
│       ├── ml-classifier.js         # 🌟 TensorFlow.js ML classifier
│       ├── particle-effects.js      # Edge glow visual effects
│       └── mlModels/                # 🌟 Trained ML models
│
├── 🗄️ Database
│   └── sql/migrations/              # Supabase migration scripts
│       ├── 001_add_edge_glow.sql
│       ├── 002_update_products_complete_view.sql
│       └── 003_populate_edge_glow_data.sql
│
└── 📁 Assets
    ├── targets/                     # .mind tracking files
    ├── models/                      # GLB 3D models
    ├── images/                      # UI images
    └── sounds/                      # Audio files (optional)
```

## Configuration System

The system supports **two configuration modes** - choose the one that fits your needs:

### Mode 1: JSON Configuration (Local/Static)
Perfect for simple deployments and testing. All products are configured in **`products.json`** - no code editing required!

### Mode 2: Supabase Configuration (Dynamic/Cloud)
Production-ready database integration for dynamic product management, analytics, and team collaboration.

**Toggle between modes in `js/config.js`:**
```javascript
features: {
  supabaseEnabled: false,  // Set to true for Supabase mode
}
```

### Managing Products via JSON

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
- ✅ Edge glow effects (intensity, opacity)

**📖 Complete Guide**: See [PRODUCTS_CONFIG_GUIDE.md](PRODUCTS_CONFIG_GUIDE.md)

## ML Product Classification

The system uses **TensorFlow.js** and **Teachable Machine** for intelligent product recognition.

### Why ML Classification?

When multiple similar products share the same image target (e.g., different product variants), the ML classifier automatically identifies which specific product is being scanned.

**Use Cases:**
- Different flavors of the same product
- Product variants (sizes, colors)
- Product lines with similar packaging

### How It Works

1. **Image Target Detection** - MindAR detects the product box
2. **ML Classification** - TensorFlow.js analyzes the camera feed
3. **Product Identification** - System loads the correct product (90%+ accuracy, 26-49ms)
4. **Content Display** - Shows variant-specific 3D model and UI

### Training Your Own Model

1. **Collect Images** - Take 50-100 photos of each product variant
2. **Train on Teachable Machine** - [teachablemachine.withgoogle.com](https://teachablemachine.withgoogle.com/)
3. **Export Model** - Download TensorFlow.js model files
4. **Add to Project** - Place in `js/mlModels/` directory

**📖 Complete Training Guide**: See [ML_IMPLEMENTATION.md](ML_IMPLEMENTATION.md)

### ML Configuration in products.json

```json
{
  "id": "product-1",
  "name": "Zyn Spearmint",
  "_mlNote": "ML model trained to recognize this variant (label: 'Spearmint')",
  "targetIndex": 0
}
```

## Supabase Integration

Cloud-based product management with PostgreSQL database and real-time capabilities.

### Features

- 🗄️ **Dynamic product management** - Update products without code changes
- 📊 **Analytics tracking** - Monitor product scans, button clicks, errors
- 👥 **Team collaboration** - Multiple users can manage products
- 🔄 **Real-time updates** - Changes reflect immediately
- 🚀 **Scalable** - Handles millions of products and events
- 🔒 **Secure** - Row-level security (RLS) policies

### Quick Setup

1. **Create Supabase Project** - [supabase.com](https://supabase.com)

2. **Run Migrations** - Execute SQL files in your Supabase dashboard:
   ```sql
   -- Run these in order:
   sql/migrations/001_add_edge_glow.sql
   sql/migrations/002_update_products_complete_view.sql
   sql/migrations/003_populate_edge_glow_data.sql
   ```

3. **Configure Credentials** - Update `js/config.js`:
   ```javascript
   supabase: {
     url: 'https://xxxxx.supabase.co',
     anonKey: 'eyJhbGc...'  // From Supabase Dashboard → Settings → API
   }
   ```

4. **Enable Supabase Mode**:
   ```javascript
   features: {
     supabaseEnabled: true,  // Switch from JSON to Supabase
     analyticsEnabled: true  // Optional: Track usage analytics
   }
   ```

### Database Schema

The system uses these tables:
- `products` - Product metadata
- `product_targets` - Image target configurations
- `product_models` - 3D model settings
- `product_ui_config` - UI colors, content, edge glow
- `product_buttons` - Interactive buttons
- `product_interactions` - Behavior settings
- `analytics_events` - Usage tracking (optional)

### Querying Products

The system uses materialized views for performance:
```sql
SELECT * FROM products_complete;  -- All products with full configuration
```

### Analytics Dashboard

When analytics are enabled, track:
- Product scan counts
- Popular products
- Button click rates
- Error rates
- User sessions

Query analytics:
```sql
SELECT
  product_id,
  event_type,
  COUNT(*) as event_count
FROM analytics_events
GROUP BY product_id, event_type;
```

## Technology Stack

### AR & 3D Rendering
- **MindAR** (v1.2+) - Image tracking
- **A-Frame** (v1.4+) - 3D rendering framework
- **aframe-extras** (v7.2+) - Animation support
- **Three.js** - 3D engine (via A-Frame)

### Machine Learning
- **TensorFlow.js** (v4.0+) - ML inference engine
- **Teachable Machine** - Model training platform
- **Image Classification** - Real-time product recognition

### Backend & Database
- **Supabase** - PostgreSQL database, authentication, storage
- **PostgreSQL** - Relational database with JSONB support
- **REST API** - Auto-generated from database schema

### UI & Effects
- **Glassmorphism** - Frosted glass UI effects
- **CSS3 Animations** - Smooth transitions
- **Edge Glow Effects** - Ambient lighting using CSS gradients

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

### AR & 3D
- [MindAR Documentation](https://hiukim.github.io/mind-ar-js-doc/)
- [A-Frame Documentation](https://aframe.io/docs/)
- [GLB Viewer](https://gltf-viewer.donmccurdy.com/)
- [Image Compiler Tool](https://hiukim.github.io/mind-ar-js-doc/tools/compile)

### Machine Learning
- [Teachable Machine](https://teachablemachine.withgoogle.com/) - Train custom models
- [TensorFlow.js Documentation](https://www.tensorflow.org/js)
- [ML_IMPLEMENTATION.md](ML_IMPLEMENTATION.md) - Our training guide

### Database & Backend
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL JSONB](https://www.postgresql.org/docs/current/datatype-json.html)
- [Supabase Dashboard](https://app.supabase.com/)

## License

MIT

## Support

For issues and questions, refer to:
- [MindAR GitHub](https://github.com/hiukim/mind-ar-js)
- [A-Frame Community](https://aframe.io/community/)
