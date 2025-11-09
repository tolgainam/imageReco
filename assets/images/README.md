# UI Images

This folder contains images and icons for the user interface.

## Supported Formats

- **PNG**: For images with transparency
- **JPG/JPEG**: For photos and images without transparency
- **SVG**: For icons and logos (best for scalability)
- **WebP**: Modern format with better compression

## Common UI Elements

- **Logo**: Company or app logo
- **Icons**: Buttons, indicators, symbols
- **Backgrounds**: Overlay backgrounds
- **Illustrations**: Onboarding graphics

## Usage Example

### In HTML
```html
<div id="instructions-screen">
  <img src="./assets/images/logo.png" alt="Logo">
  <p>Instructions here...</p>
</div>
```

### In CSS
```css
.button {
  background-image: url('../assets/images/icon.png');
  background-size: contain;
}
```

### In JavaScript
```javascript
const img = document.createElement('img');
img.src = './assets/images/icon.png';
document.body.appendChild(img);
```

## Optimization Tips

- Compress images before adding (use TinyPNG or ImageOptim)
- Use appropriate formats:
  - PNG for transparency
  - JPG for photos
  - SVG for icons/logos
- Keep file sizes small (< 200KB per image)
- Use responsive images with `srcset` for different screen sizes

## Naming Convention

Use descriptive, lowercase names with hyphens:
- `logo-white.png`
- `icon-close.svg`
- `button-info.png`
- `background-gradient.jpg`
