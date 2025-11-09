# Image Recognition AR Experience - Project Plan

## Overview
Build a web-based image recognition AR experience where users can scan product boxes to display 3D models, animations, and UI elements aligned with real-world orientation.

## Technology Stack

### Core Libraries
- **MindAR** (v1.2+) - Image tracking with 6DOF orientation awareness
- **A-Frame** (v1.4+) - 3D rendering framework (declarative HTML approach)
- **aframe-extras** (v7.2+) - GLB animation support
- **Three.js** (via A-Frame) - Underlying 3D engine

### Why This Stack?
- **MindAR**: Best open-source image tracking, works on iOS/Android, browser-based compiler
- **A-Frame**: Easiest framework for AR (HTML-based), excellent MindAR integration
- **Free**: MIT license, no costs
- **Orientation Tracking**: Full 6DOF tracking (position + rotation) aligns 3D content with physical object

## Project Requirements

### Functional Requirements
1. Track 1-3 image targets (product boxes)
2. Display GLB 3D models aligned to target orientation
3. Play GLB animations
4. Show custom HTML/CSS UI elements
5. Maintain spatial awareness (3D content rotates with physical box)
6. Work on iOS and Android mobile browsers

### Technical Requirements
- Responsive mobile design
- Fast loading times
- Graceful error handling
- Cross-browser compatibility
- No app installation required

## Project Structure

```
imageReco/
├── PROJECT_PLAN.md          # This file
├── README.md                # Setup and usage instructions
├── index.html               # Main AR experience
├── assets/
│   ├── targets/             # Image target files (.mind)
│   │   └── product-box.mind # Compiled tracking data
│   ├── models/              # GLB 3D models
│   │   └── example.glb      # Your 3D assets
│   └── images/              # UI images, icons
│       └── logo.png
├── css/
│   └── styles.css           # Custom UI styling
└── js/
    └── app.js               # Custom interactions/logic
```

## Implementation Phases

### Phase 1: Setup & Image Target Creation (Day 1)
**Goal**: Set up project foundation and create tracking targets

1. **Project Setup**
   - Create folder structure
   - Set up HTML with MindAR + A-Frame CDN links
   - Configure viewport for mobile

2. **Image Target Creation**
   - Photograph product box (high quality, good lighting)
   - Use MindAR Image Compiler: https://hiukim.github.io/mind-ar-js-doc/tools/compile
   - Validate image quality (check feature points visualization)
   - Generate `.mind` target file
   - Download and save to `assets/targets/`

3. **Basic AR Scene**
   - Create minimal A-Frame scene
   - Configure MindAR image tracking
   - Test camera access
   - Verify target detection with simple cube

**Deliverable**: Working AR scene that detects product box and shows basic 3D shape

---

### Phase 2: 3D Model Integration (Day 1-2)
**Goal**: Display and animate GLB models aligned to target

4. **Model Integration**
   - Add GLB model to assets
   - Create `<a-assets>` preloading
   - Position `<a-gltf-model>` within target entity
   - Test scale and positioning

5. **Animation Setup**
   - Add aframe-extras for animation support
   - Configure `animation-mixer` component
   - Test animation playback
   - Add play/pause controls if needed

6. **Orientation Testing**
   - Test with physical product box
   - Verify 3D content rotates/tilts with box
   - Adjust model position/rotation offsets
   - Optimize for smooth tracking

**Deliverable**: Animated 3D model perfectly aligned with product box orientation

---

### Phase 3: Custom UI Elements (Day 2-3)
**Goal**: Add interactive interface elements

7. **UI Structure**
   - Create HTML overlay elements (outside A-Frame scene)
   - Position using CSS (absolute/fixed)
   - Design for mobile screens

8. **UI Components**
   - Loading indicator
   - Instructions overlay ("Scan product box")
   - Info panels/buttons
   - Target tracking status indicator

9. **Interaction Logic**
   - Show/hide UI based on tracking state
   - Button click handlers
   - Smooth transitions/animations
   - Touch-friendly hit areas

**Deliverable**: Polished UI with instructions, status, and interactive elements

---

### Phase 4: Multi-Target Support (Day 3)
**Goal**: Support multiple product boxes

10. **Additional Targets**
    - Create tracking files for additional products
    - Combine into single `.mind` file (if possible) or use multiple
    - Configure target indices (0, 1, 2)

11. **Content Mapping**
    - Different 3D models per target
    - Unique UI information per product
    - Test simultaneous tracking (2-3 boxes)

12. **Performance Testing**
    - Monitor frame rate
    - Optimize model poly counts
    - Compress textures
    - Test on lower-end devices

**Deliverable**: System tracks 2-3 different product boxes with unique content

---

### Phase 5: Testing & Optimization (Day 4)
**Goal**: Production-ready deployment

13. **Cross-Device Testing**
    - Test on iOS Safari (iPhone)
    - Test on Android Chrome
    - Test on various screen sizes
    - Verify camera permissions

14. **Performance Optimization**
    - Compress GLB models (Draco compression)
    - Optimize texture sizes
    - Minimize JavaScript
    - Add service worker for caching (optional)

15. **Error Handling**
    - Camera access denied
    - No WebGL support
    - Poor lighting conditions
    - Target not found timeout

16. **Deployment**
    - Choose hosting (GitHub Pages, Netlify, Vercel)
    - Configure HTTPS (required for camera access)
    - Add meta tags for SEO
    - Final QA testing

**Deliverable**: Production-ready AR experience deployed to public URL

---

## Key Technical Details

### MindAR Image Tracking
- **Browser Compiler**: https://hiukim.github.io/mind-ar-js-doc/tools/compile
- **Good Target Images**: High DPI (300+), high contrast, complex features
- **Feature Points**: Red circles in compiler show tracking quality
- **6DOF Tracking**: Position (x, y, z) + Rotation (pitch, yaw, roll)

### A-Frame Integration
```html
<script src="https://aframe.io/releases/1.4.0/aframe.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js"></script>
<script src="https://cdn.jsdelivr.net/gh/c-frame/aframe-extras@7.2.0/dist/aframe-extras.min.js"></script>

<a-scene mindar-image="imageTargetSrc: ./assets/targets/product-box.mind;" vr-mode-ui="enabled: false">
  <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>

  <a-entity mindar-image-target="targetIndex: 0">
    <a-gltf-model
      animation-mixer
      src="#myModel"
      position="0 0 0"
      rotation="0 0 0"
      scale="0.5 0.5 0.5">
    </a-gltf-model>
  </a-entity>
</a-scene>
```

### GLB Animation
```html
<a-assets>
  <a-asset-item id="myModel" src="./assets/models/product.glb"></a-asset-item>
</a-assets>

<a-gltf-model
  animation-mixer="clip: *; loop: repeat"
  src="#myModel">
</a-gltf-model>
```

### Custom UI Overlay
```html
<div id="ui-overlay" style="position: fixed; top: 0; left: 0; z-index: 1000;">
  <div id="instructions">Point camera at product box</div>
  <button id="info-btn">Learn More</button>
</div>
```

## Features Delivered

### Core Features
✅ Image target tracking with full 6DOF orientation
✅ GLB 3D models aligned to physical product box
✅ Smooth animations
✅ Custom HTML/CSS UI overlays
✅ Works on iOS and Android browsers
✅ 1-3 simultaneous image targets

### Limitations (vs. 8th Wall)
❌ No SLAM/world anchoring (content tied to image)
❌ No curved image targets
❌ Less sophisticated tracking algorithms
❌ No hand/face tracking
❌ Content disappears when image is lost

## Timeline

- **Prototype**: 1-2 days
- **Production-ready**: 3-4 days
- **Total Development**: 4-5 days

## Resources

### Documentation
- MindAR Docs: https://hiukim.github.io/mind-ar-js-doc/
- A-Frame Docs: https://aframe.io/docs/
- aframe-extras: https://github.com/c-frame/aframe-extras

### Tools
- MindAR Compiler: https://hiukim.github.io/mind-ar-js-doc/tools/compile
- GLB Viewer: https://gltf-viewer.donmccurdy.com/
- GLB Compressor: https://gltf.report/

### Examples
- MindAR Examples: https://github.com/hiukim/mind-ar-js/tree/master/examples
- A-Frame Examples: https://aframe.io/examples/

## Success Criteria

1. **Tracking Accuracy**: 3D content smoothly follows product box orientation
2. **Performance**: 30+ FPS on mid-range smartphones
3. **User Experience**: Intuitive, loads in <5 seconds
4. **Compatibility**: Works on iOS 12+ and Android 8+
5. **Reliability**: Consistent tracking in various lighting conditions

## Next Steps

1. Review this plan
2. Set up project folder structure
3. Install/configure development environment
4. Begin Phase 1: Image target creation

---

**Last Updated**: 2025-11-09
**Version**: 1.0
**Status**: Planning Complete - Ready for Implementation
