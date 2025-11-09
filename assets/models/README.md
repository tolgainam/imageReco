# 3D Models

This folder contains GLB (GL Transmission Format Binary) 3D models.

## Supported Formats

- **GLB** (preferred): Binary format, includes textures
- **GLTF**: Text format (less common for web)

## Adding Models

1. **Export your 3D model as GLB**:
   - From Blender: File > Export > glTF 2.0 (.glb)
   - From Cinema 4D: Use Sketchfab plugin or converter
   - From Maya: Use glTF exporter plugin

2. **Optimize your model**:
   - Keep polygon count low (< 50k triangles for mobile)
   - Compress textures (1024x1024 or smaller)
   - Use Draco compression: https://gltf.report/

3. **Place GLB file in this folder**

4. **Reference in `index.html`**:
   ```html
   <a-assets>
     <a-asset-item id="myModel" src="./assets/models/your-model.glb"></a-asset-item>
   </a-assets>

   <a-entity mindar-image-target="targetIndex: 0">
     <a-gltf-model src="#myModel" scale="1 1 1"></a-gltf-model>
   </a-entity>
   ```

## Model Optimization Tips

### File Size
- Target: < 5MB per model (smaller is better for mobile)
- Use texture atlases to combine multiple textures
- Compress textures using tools like TinyPNG

### Geometry
- Use low-poly models for mobile
- Remove unnecessary geometry
- Merge meshes when possible

### Materials
- Use PBR materials (Metallic-Roughness workflow)
- Limit number of materials
- Bake lighting when possible

### Animations
- Include animations in the GLB file
- Name animations clearly
- Keep animation durations reasonable

## Tools

### Viewers
- **glTF Viewer**: https://gltf-viewer.donmccurdy.com/
- **Three.js Editor**: https://threejs.org/editor/

### Optimizers
- **glTF Report**: https://gltf.report/ (Draco compression)
- **glTF Transform**: https://gltf-transform.donmccurdy.com/

### Converters
- **FBX to GLB**: https://products.aspose.app/3d/conversion/fbx-to-glb
- **OBJ to GLB**: https://products.aspose.app/3d/conversion/obj-to-glb

## Animation Example

```html
<!-- Auto-play all animations -->
<a-gltf-model
  src="#myModel"
  animation-mixer="clip: *; loop: repeat">
</a-gltf-model>

<!-- Play specific animation -->
<a-gltf-model
  src="#myModel"
  animation-mixer="clip: Walk; loop: repeat">
</a-gltf-model>

<!-- Control via JavaScript -->
<a-gltf-model
  id="animated-model"
  src="#myModel"
  animation-mixer>
</a-gltf-model>

<script>
  const model = document.getElementById('animated-model');
  model.addEventListener('model-loaded', () => {
    model.setAttribute('animation-mixer', {
      clip: 'Jump',
      loop: 'once'
    });
  });
</script>
```

## Positioning & Scaling

Models are positioned relative to the image target center:

```html
<a-gltf-model
  src="#myModel"
  position="0 0.5 0"     <!-- x, y, z (y is up) -->
  rotation="0 90 0"      <!-- x, y, z degrees -->
  scale="0.5 0.5 0.5">   <!-- x, y, z multiplier -->
</a-gltf-model>
```

## Troubleshooting

**Model not showing:**
- Check browser console for errors
- Verify file path is correct
- Test model in glTF viewer first
- Check scale (might be too small/large)

**Performance issues:**
- Reduce polygon count
- Compress textures
- Use Draco compression
- Test on actual mobile device

**Animations not playing:**
- Verify animation exists in GLB
- Check animation name spelling
- Ensure `aframe-extras` is loaded
- Use `animation-mixer` component
