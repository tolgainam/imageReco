/**
 * Product Configuration Loader
 * Loads products.json and dynamically generates AR scene
 */

class ARConfigLoader {
  constructor() {
    this.products = [];
    this.globalSettings = {};
    this.currentProduct = null;
  }

  /**
   * Load configuration from JSON file
   */
  async loadConfig() {
    try {
      const response = await fetch('./products.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      this.products = data.products;
      this.globalSettings = data.globalSettings;

      console.log('✅ Configuration loaded successfully');
      console.log(`📦 Products found: ${this.products.length}`);

      // Validate configuration
      this.validateTargets();

      return data;
    } catch (error) {
      console.error('❌ Error loading configuration:', error);
      throw error;
    }
  }

  /**
   * Validate target configuration
   */
  validateTargets() {
    if (this.products.length === 0) {
      console.warn('⚠️ No products defined in products.json');
      return;
    }

    const paths = this.products.map(p => p.target.imagePath);
    const uniquePaths = [...new Set(paths)];

    console.log('🎯 Target validation:');
    console.log(`   Total products: ${this.products.length}`);
    console.log(`   Unique .mind files: ${uniquePaths.length}`);

    if (uniquePaths.length === 1) {
      console.log(`   ✅ All products use: ${uniquePaths[0]}`);
      if (this.products.length > 1) {
        console.log(`   ℹ️ Multiple products will be tracked from single .mind file`);
      }
    } else {
      console.error('   ❌ Multiple different .mind files detected:');
      uniquePaths.forEach((path, i) => {
        const productsUsingThis = this.products.filter(p => p.target.imagePath === path);
        console.error(`      ${i + 1}. ${path} (used by ${productsUsingThis.length} product(s))`);
      });
      console.error('   ⚠️ MindAR can only load ONE .mind file at a time!');
      console.error('   💡 Solution: Compile all product images into one combined .mind file');
      console.error('   🔗 Use: https://hiukim.github.io/mind-ar-js-doc/tools/compile');
    }
  }

  /**
   * Generate A-Frame scene based on configuration
   */
  generateScene() {
    const scene = document.querySelector('a-scene');
    const assets = document.querySelector('a-assets') || this.createAssetsElement(scene);

    // Clear existing targets
    const existingTargets = scene.querySelectorAll('[mindar-image-target]');
    existingTargets.forEach(target => target.remove());

    // Generate assets and targets for each product
    this.products.forEach((product, index) => {
      // Add model to assets
      const assetItem = document.createElement('a-asset-item');
      assetItem.setAttribute('id', product.id);
      assetItem.setAttribute('src', product.model.path);
      assets.appendChild(assetItem);

      // Create target entity
      const target = this.createTargetEntity(product);
      scene.appendChild(target);
    });

    console.log('Scene generated with', this.products.length, 'products');
  }

  /**
   * Create assets element if it doesn't exist
   */
  createAssetsElement(scene) {
    const assets = document.createElement('a-assets');
    // Insert before camera
    const camera = scene.querySelector('a-camera');
    scene.insertBefore(assets, camera);
    return assets;
  }

  /**
   * Create target entity for a product
   */
  createTargetEntity(product) {
    const entity = document.createElement('a-entity');
    entity.setAttribute('mindar-image-target', `targetIndex: ${product.targetIndex}`);
    entity.setAttribute('data-product-id', product.id);

    // Create model
    const model = document.createElement('a-gltf-model');
    model.setAttribute('src', `#${product.id}`);
    model.setAttribute('position', `${product.model.position.x} ${product.model.position.y} ${product.model.position.z}`);
    model.setAttribute('rotation', `${product.model.rotation.x} ${product.model.rotation.y} ${product.model.rotation.z}`);
    model.setAttribute('scale', `${product.model.scale.x} ${product.model.scale.y} ${product.model.scale.z}`);

    // Add animation if enabled
    if (product.model.animation.enabled) {
      model.setAttribute('animation-mixer', `clip: ${product.model.animation.clip}; loop: ${product.model.animation.loop}`);
    }

    entity.appendChild(model);

    // Add event listeners
    this.attachEventListeners(entity, product);

    return entity;
  }

  /**
   * Attach event listeners to target entity
   */
  attachEventListeners(entity, product) {
    entity.addEventListener('targetFound', () => {
      console.log(`Product found: ${product.name}`);
      this.currentProduct = product;
      this.onProductFound(product);
    });

    entity.addEventListener('targetLost', () => {
      console.log(`Product lost: ${product.name}`);
      this.onProductLost(product);
      this.currentProduct = null;
    });
  }

  /**
   * Handle product found event
   */
  onProductFound(product) {
    // Update UI
    if (product.interactions.onFound.showUI) {
      this.showProductUI(product);
    }

    // Play sound if configured
    if (product.interactions.onFound.playSound && product.interactions.onFound.soundPath) {
      this.playSound(product.interactions.onFound.soundPath);
    }

    // Apply custom colors
    this.applyProductColors(product.ui.colors);

    // Show tracking indicator
    const trackingIndicator = document.getElementById('tracking-indicator');
    if (trackingIndicator) {
      trackingIndicator.classList.remove('hidden');
      this.updateTrackingIndicator(product);
    }

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('ar-product-found', { detail: product }));
  }

  /**
   * Handle product lost event
   */
  onProductLost(product) {
    // Hide UI
    if (product.interactions.onLost.hideUI) {
      this.hideProductUI();
    }

    // Hide tracking indicator
    const trackingIndicator = document.getElementById('tracking-indicator');
    if (trackingIndicator) {
      trackingIndicator.classList.add('hidden');
    }

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('ar-product-lost', { detail: product }));
  }

  /**
   * Show product-specific UI
   */
  showProductUI(product) {
    // Remove existing product UI
    const existingUI = document.getElementById('product-ui');
    if (existingUI) {
      existingUI.remove();
    }

    // Create product UI container
    const productUI = document.createElement('div');
    productUI.id = 'product-ui';
    productUI.className = 'product-ui-container';
    productUI.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      width: 90%;
      max-width: 500px;
      background: ${product.ui.colors.background};
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 20px;
      color: ${product.ui.colors.text};
      z-index: 1001;
      animation: slideUp 0.3s ease;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    `;

    // Add content
    const content = `
      <div class="product-content">
        <h2 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 700;">${product.ui.content.title}</h2>
        <p style="margin: 0 0 12px 0; font-size: 14px; opacity: 0.9;">${product.ui.content.subtitle}</p>
        <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.5; opacity: 0.85;">${product.ui.content.description}</p>
        ${this.generateFeaturesList(product.ui.content.features)}
        ${this.generateButtons(product.ui.buttons, product.ui.colors)}
      </div>
    `;

    productUI.innerHTML = content;
    document.getElementById('ui-container').appendChild(productUI);

    // Add button click handlers
    this.attachButtonListeners(product);
  }

  /**
   * Generate features list HTML
   */
  generateFeaturesList(features) {
    if (!features || features.length === 0) return '';

    const items = features.map(feature => `
      <li style="margin-bottom: 6px; font-size: 13px; opacity: 0.9;">
        <span style="margin-right: 8px;">✓</span>${feature}
      </li>
    `).join('');

    return `
      <ul style="margin: 0 0 20px 0; padding-left: 0; list-style: none;">
        ${items}
      </ul>
    `;
  }

  /**
   * Generate buttons HTML
   */
  generateButtons(buttons, colors) {
    if (!buttons || buttons.length === 0) return '';

    const buttonsHTML = buttons.map(button => {
      const isPrimary = button.style === 'primary';
      const bgColor = isPrimary ? colors.primary : colors.secondary;

      return `
        <button
          id="${button.id}"
          class="product-button"
          data-link="${button.link}"
          style="
            flex: 1;
            padding: 12px 20px;
            background: ${bgColor};
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: all 0.2s ease;
            min-height: 48px;
          "
          onmouseover="this.style.opacity='0.9'; this.style.transform='scale(0.98)'"
          onmouseout="this.style.opacity='1'; this.style.transform='scale(1)'"
          ontouchstart="this.style.opacity='0.9'; this.style.transform='scale(0.98)'"
          ontouchend="this.style.opacity='1'; this.style.transform='scale(1)'"
        >
          <span style="font-size: 18px;">${button.icon}</span>
          <span>${button.label}</span>
        </button>
      `;
    }).join('');

    return `
      <div style="display: flex; gap: 12px; margin-top: 20px;">
        ${buttonsHTML}
      </div>
    `;
  }

  /**
   * Attach button click listeners
   */
  attachButtonListeners(product) {
    product.ui.buttons.forEach(button => {
      const btnElement = document.getElementById(button.id);
      if (btnElement) {
        btnElement.addEventListener('click', (e) => {
          e.preventDefault();
          console.log(`Button clicked: ${button.label}`, button.link);

          // Dispatch custom event
          window.dispatchEvent(new CustomEvent('ar-button-click', {
            detail: {
              product: product,
              button: button
            }
          }));

          // Open link
          if (button.link) {
            window.open(button.link, '_blank');
          }
        });
      }
    });
  }

  /**
   * Hide product UI
   */
  hideProductUI() {
    const productUI = document.getElementById('product-ui');
    if (productUI) {
      productUI.style.animation = 'slideDown 0.3s ease';
      setTimeout(() => productUI.remove(), 300);
    }
  }

  /**
   * Apply product-specific colors
   */
  applyProductColors(colors) {
    const trackingIndicator = document.getElementById('tracking-indicator');
    if (trackingIndicator) {
      trackingIndicator.style.background = colors.primary;
    }
  }

  /**
   * Update tracking indicator with product name
   */
  updateTrackingIndicator(product) {
    const trackingIndicator = document.getElementById('tracking-indicator');
    if (trackingIndicator) {
      const textSpan = trackingIndicator.querySelector('.text');
      if (textSpan) {
        textSpan.textContent = `Tracking: ${product.name}`;
      }
    }
  }

  /**
   * Play sound
   */
  playSound(soundPath) {
    const audio = new Audio(soundPath);
    audio.play().catch(err => console.error('Error playing sound:', err));
  }

  /**
   * Update MindAR scene configuration
   */
  updateSceneConfig() {
    const scene = document.querySelector('a-scene');
    if (!scene) {
      console.error('❌ A-Frame scene not found');
      return;
    }

    // Determine which .mind file to use
    const paths = this.products.map(p => p.target.imagePath);
    const uniquePaths = [...new Set(paths)];

    let targetSrc;
    if (uniquePaths.length === 1) {
      // All products use the same .mind file (recommended)
      targetSrc = uniquePaths[0];
    } else {
      // Fallback: use first product's target (but show warning)
      targetSrc = this.products[0].target.imagePath;
      console.warn('⚠️ Using first product\'s target due to multiple .mind files');
    }

    console.log(`🎯 Setting image target source: ${targetSrc}`);

    // Update scene with target
    scene.setAttribute('mindar-image', `imageTargetSrc: ${targetSrc}; autoStart: false; uiLoading: no; uiError: no; uiScanning: no;`);

    // Log configuration
    console.log('📱 MindAR configuration:');
    console.log(`   Target file: ${targetSrc}`);
    console.log(`   Products configured: ${this.products.length}`);
    this.products.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.name} (targetIndex: ${p.targetIndex})`);
    });
  }

  /**
   * Get product by ID
   */
  getProductById(id) {
    return this.products.find(p => p.id === id);
  }

  /**
   * Get product by target index
   */
  getProductByTargetIndex(index) {
    return this.products.find(p => p.targetIndex === index);
  }

  /**
   * Get current product being tracked
   */
  getCurrentProduct() {
    return this.currentProduct;
  }
}

// Add animations to document
const style = document.createElement('style');
style.textContent = `
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }

  @keyframes slideDown {
    from {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
    to {
      opacity: 0;
      transform: translateX(-50%) translateY(20px);
    }
  }

  .product-button:active {
    transform: scale(0.95) !important;
  }
`;
document.head.appendChild(style);

// Export for use in other scripts
window.ARConfigLoader = ARConfigLoader;
