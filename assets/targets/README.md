# Image Targets

This folder contains compiled `.mind` files for image tracking.

## Creating Image Targets

1. **Take a high-quality photo** of your product box:
   - Good lighting
   - High resolution (300+ DPI recommended)
   - Clear, complex features (not too simple)
   - Avoid reflections and blur

2. **Visit the MindAR Image Compiler**:
   - URL: https://hiukim.github.io/mind-ar-js-doc/tools/compile

3. **Upload your image**:
   - Click "Start" to upload
   - Wait for processing

4. **Check tracking quality**:
   - Red circles = feature points (more is better)
   - Good distribution across image = better tracking
   - If too few points, try a different image with more detail

5. **Download the `.mind` file**:
   - Click "Download Compiled" button
   - Save file to this folder

6. **Update `index.html`**:
   ```html
   <a-scene mindar-image="imageTargetSrc: ./assets/targets/YOUR-FILE.mind;">
   ```

## File Naming

- Use descriptive names: `product-box-front.mind`
- Keep names lowercase with hyphens
- No spaces in filenames

## Multiple Targets

To track multiple images:

1. Compile each image separately to get individual `.mind` files
2. You can either:
   - Use separate `.mind` files and switch between them
   - Or compile multiple images into one `.mind` file using the compiler's multi-image feature

Example for multiple targets:
```html
<!-- Single .mind file with multiple images -->
<a-entity mindar-image-target="targetIndex: 0"><!-- First image --></a-entity>
<a-entity mindar-image-target="targetIndex: 1"><!-- Second image --></a-entity>
<a-entity mindar-image-target="targetIndex: 2"><!-- Third image --></a-entity>
```

## Tips for Good Tracking

- **High contrast**: Images with varying colors and brightness
- **Complex patterns**: More details = better tracking
- **Avoid**: Plain colors, simple logos, very symmetrical designs
- **Size**: Larger physical prints track better than small ones
- **Lighting**: Test in different lighting conditions
