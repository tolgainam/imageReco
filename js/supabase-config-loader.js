// ============================================================================
// SUPABASE CONFIG LOADER
// ============================================================================
// Extends ARConfigLoader to load products from Supabase instead of products.json
//
// Features:
// - Load products from Supabase database
// - Automatic fallback to products.json on error
// - Analytics tracking integration
// - Real-time updates support (optional)
// - Performance monitoring
//
// Usage:
// const loader = new SupabaseConfigLoader();
// await loader.loadConfig();
// await loader.generateScene();
// ============================================================================

class SupabaseConfigLoader extends ARConfigLoader {
  constructor() {
    super();

    // Initialize Supabase client
    this.supabaseClient = new SupabaseClient();

    // Determine if we should use Supabase
    this.useSupabase = window.CONFIG?.features?.supabaseEnabled && this.supabaseClient.isReady();

    // Track performance
    this.loadStartTime = 0;
    this.loadEndTime = 0;

    // Real-time subscription
    this.subscription = null;

    console.log(`🔧 Config loader mode: ${this.useSupabase ? 'Supabase' : 'products.json'}`);
  }

  // ============================================================================
  // CONFIGURATION LOADING
  // ============================================================================

  /**
   * Load configuration
   * Tries Supabase first, falls back to products.json on error
   */
  async loadConfig() {
    this.loadStartTime = performance.now();

    console.log(`🔄 Loading config from ${this.useSupabase ? 'Supabase' : 'products.json'}...`);

    try {
      if (this.useSupabase) {
        return await this.loadFromSupabase();
      } else {
        return await this.loadFromJSON();
      }
    } catch (error) {
      console.error('❌ Error loading configuration:', error);

      // Try fallback if enabled
      if (this.useSupabase && window.CONFIG?.features?.fallbackToJSON) {
        console.warn('⚠️ Falling back to products.json...');
        this.useSupabase = false;
        return await this.loadFromJSON();
      }

      throw error;
    } finally {
      this.loadEndTime = performance.now();
      const loadTime = (this.loadEndTime - this.loadStartTime).toFixed(2);

      if (window.CONFIG.debug.showPerformance) {
        console.log(`⚡ Config load time: ${loadTime}ms`);
      }
    }
  }

  /**
   * Load configuration from Supabase
   * @private
   */
  async loadFromSupabase() {
    try {
      // Fetch products from Supabase
      const productsData = await this.supabaseClient.getProducts();

      if (!productsData || productsData.length === 0) {
        throw new Error('No products found in Supabase');
      }

      // Fetch global settings
      const globalSettingsData = await this.supabaseClient.getGlobalSettings();

      // Convert Supabase format to products.json format
      this.config = {
        products: this.convertProducts(productsData),
        globalSettings: this.convertGlobalSettings(globalSettingsData)
      };

      this.products = this.config.products;
      this.globalSettings = this.config.globalSettings;

      console.log('✅ Configuration loaded from Supabase');
      console.log(`📦 Products found: ${this.products.length}`);

      // DEBUG: Log complete product structure
      console.log('🔍 Product structure:', JSON.stringify(this.products[0], null, 2));

      // Validate configuration
      this.validateTargets();

      // NOTE: updateSceneConfig() is called in index.html after generateScene()
      // Don't call it here to avoid double-initialization of MindAR

      // Track page load event
      if (window.CONFIG.features.analyticsEnabled) {
        await this.supabaseClient.trackPageLoad();
      }

      return this.config;

    } catch (error) {
      console.error('❌ Error loading from Supabase:', error);
      throw error;
    }
  }

  /**
   * Load configuration from products.json
   * Uses parent class method
   * @private
   */
  async loadFromJSON() {
    const config = await super.loadConfig();
    // NOTE: updateSceneConfig() is called in index.html after generateScene()
    return config;
  }

  // ============================================================================
  // DATA CONVERSION
  // ============================================================================

  /**
   * Convert Supabase products to products.json format
   * @private
   */
  convertProducts(supabaseProducts) {
    return supabaseProducts.map(p => {
      // Extract first items from arrays (current implementation supports one target, one model per product)
      const targetData = Array.isArray(p.product_targets) && p.product_targets.length > 0
        ? p.product_targets[0]
        : null;

      const modelData = Array.isArray(p.product_models) && p.product_models.length > 0
        ? p.product_models[0]
        : null;

      const uiData = p.product_ui_config || null;

      const buttonsData = Array.isArray(p.product_buttons)
        ? p.product_buttons.sort((a, b) => a.button_order - b.button_order)
        : [];

      // Convert target data
      const target = this.convertTarget(targetData);

      // Convert UI data
      const ui = this.convertUI(uiData, buttonsData);

      // Default interactions (not stored in database, using sensible defaults)
      const interactions = {
        onFound: {
          showUI: true,
          playSound: false,
          soundPath: './assets/sounds/found.mp3'
        },
        onLost: {
          hideUI: true,
          pauseAnimation: false
        }
      };

      return {
        id: p.product_id,
        name: p.name,
        description: p.description || '',
        targetIndex: p.target_index,
        target: target,
        model: this.convertModel(modelData),
        ui: ui,
        interactions: interactions
      };
    });
  }

  /**
   * Convert Supabase target data to products.json format
   * @private
   */
  convertTarget(targetData) {
    if (!targetData) {
      console.warn('⚠️ No target data found for product');
      return {
        imagePath: '',
        imagePreview: ''
      };
    }

    // WORKAROUND: Use local .mind files instead of Supabase CDN
    // Supabase CDN corrupts binary .mind files (known MindAR issue with CDNs)
    let imagePath = targetData.mind_file_path || targetData.mind_file_url || '';

    console.log(`🔍 Original imagePath from DB: "${imagePath}" (length: ${imagePath.length})`);

    // If it's a Supabase URL, use local path instead
    if (imagePath.includes('supabase.co')) {
      const filename = imagePath.split('/').pop();
      imagePath = `./assets/targets/${filename}`;
      console.log(`🔧 Using local .mind file instead of CDN: ${imagePath}`);
    }

    // Ensure path is clean (no extra whitespace)
    imagePath = imagePath.trim();

    console.log(`✅ Final imagePath: "${imagePath}" (length: ${imagePath.length})`);

    return {
      imagePath: imagePath,
      imagePreview: targetData.preview_image_path || targetData.preview_image_url || ''
    };
  }

  /**
   * Convert Supabase UI data to products.json format
   * @private
   */
  convertUI(uiData, buttonsData) {
    if (!uiData) {
      console.warn('⚠️ No UI data found for product');
      return {
        colors: {
          primary: '#4CC3D9',
          secondary: '#667eea',
          background: 'rgba(0, 0, 0, 0.85)',
          text: '#ffffff'
        },
        edgeGlow: {
          enabled: false,
          glowIntensity: 100,
          glowOpacity: 0.3
        },
        content: {
          title: 'Product',
          subtitle: '',
          description: '',
          features: []
        },
        buttons: []
      };
    }

    return {
      colors: {
        primary: uiData.color_primary || '#4CC3D9',
        secondary: uiData.color_secondary || '#667eea',
        background: uiData.color_background || 'rgba(0, 0, 0, 0.85)',
        text: uiData.color_text || '#ffffff'
      },
      edgeGlow: {
        enabled: uiData.edge_glow_enabled ?? false,
        glowIntensity: uiData.edge_glow_intensity ?? 100,
        glowOpacity: uiData.edge_glow_opacity ?? 0.3
      },
      content: {
        title: uiData.title || 'Product',
        subtitle: uiData.subtitle || '',
        description: uiData.description_text || '',
        features: uiData.features || []
      },
      buttons: buttonsData.map(btn => ({
        id: btn.button_id,
        label: btn.label,
        icon: btn.icon,
        link: btn.link,
        style: btn.button_style,
        position: btn.position
      }))
    };
  }

  /**
   * Convert Supabase model to products.json format
   * @private
   */
  convertModel(modelData) {
    if (!modelData) {
      console.warn('⚠️ No model data found for product');
      return {
        path: '',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        animation: { enabled: false }
      };
    }

    return {
      path: modelData.glb_file_url || modelData.model_path || '',
      position: {
        x: modelData.position_x ?? 0,
        y: modelData.position_y ?? 0,
        z: modelData.position_z ?? 0
      },
      rotation: {
        x: modelData.rotation_x ?? 0,
        y: modelData.rotation_y ?? 0,
        z: modelData.rotation_z ?? 0
      },
      scale: {
        x: modelData.scale_x ?? 1,
        y: modelData.scale_y ?? 1,
        z: modelData.scale_z ?? 1
      },
      animation: {
        enabled: modelData.animation_enabled ?? false,
        clip: modelData.animation_clip ?? '*',
        loop: modelData.animation_loop ?? 'repeat'
      }
    };
  }

  /**
   * Convert Supabase global settings to products.json format
   * @private
   */
  convertGlobalSettings(settingsData) {
    if (!settingsData || !settingsData.setting_value) {
      console.warn('⚠️ No global settings found, using defaults');
      return {
        multipleTargets: true,
        maxSimultaneousTargets: 3,
        defaultColors: {
          primary: '#4CC3D9',
          secondary: '#667eea',
          background: 'rgba(0, 0, 0, 0.85)',
          text: '#ffffff'
        },
        loading: {
          title: 'Loading AR Experience',
          subtitle: 'Please wait...',
          backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        },
        instructions: {
          title: 'Point Camera at Product',
          subtitle: 'Align your camera with the product to see the AR experience',
          backgroundColor: 'rgba(0, 0, 0, 0.75)'
        }
      };
    }

    // Extract settings from JSONB setting_value field
    const settings = settingsData.setting_value;

    return {
      multipleTargets: settings.multipleTargets ?? true,
      maxSimultaneousTargets: settings.maxSimultaneousTargets ?? 3,
      defaultColors: settings.defaultColors ?? {
        primary: '#4CC3D9',
        secondary: '#667eea',
        background: 'rgba(0, 0, 0, 0.85)',
        text: '#ffffff'
      },
      loading: settings.loading ?? {
        title: 'Loading AR Experience',
        subtitle: 'Please wait...',
        backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      },
      instructions: settings.instructions ?? {
        title: 'Point Camera at Product',
        subtitle: 'Align your camera with the product to see the AR experience',
        backgroundColor: 'rgba(0, 0, 0, 0.75)'
      }
    };
  }

  // ============================================================================
  // EVENT TRACKING (OVERRIDE PARENT METHODS)
  // ============================================================================

  /**
   * Override: Handle product found event
   * Adds analytics tracking
   */
  onProductFound(product) {
    // Call parent method for UI updates
    super.onProductFound(product);

    // Track analytics
    if (this.useSupabase && window.CONFIG.features.analyticsEnabled) {
      this.supabaseClient.trackProductFound(product.id);
    }
  }

  /**
   * Override: Handle product lost event
   * Adds analytics tracking
   */
  onProductLost(product) {
    // Call parent method for UI updates
    super.onProductLost(product);

    // Track analytics
    if (this.useSupabase && window.CONFIG.features.analyticsEnabled) {
      this.supabaseClient.trackProductLost(product.id);
    }
  }

  /**
   * Override: Attach button click listeners
   * Adds analytics tracking
   */
  attachButtonListeners(product) {
    product.ui.buttons.forEach(button => {
      const btnElement = document.getElementById(button.id);
      if (btnElement) {
        btnElement.addEventListener('click', (e) => {
          e.preventDefault();
          console.log(`Button clicked: ${button.label}`, button.link);

          // Track analytics
          if (this.useSupabase && window.CONFIG.features.analyticsEnabled) {
            this.supabaseClient.trackButtonClick(product.id, button.id);
          }

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
   * Override: Create target entity
   * Adds model load tracking
   */
  createTargetEntity(product) {
    const entity = super.createTargetEntity(product);

    // Track model load performance
    const model = entity.querySelector('a-gltf-model');
    if (model) {
      const modelLoadStart = performance.now();

      model.addEventListener('model-loaded', () => {
        const loadTime = (performance.now() - modelLoadStart).toFixed(2);
        console.log(`✅ Model loaded: ${product.name} (${loadTime}ms)`);

        // Track analytics
        if (this.useSupabase && window.CONFIG.features.analyticsEnabled) {
          this.supabaseClient.trackModelLoaded(product.id, parseFloat(loadTime));
        }
      });

      model.addEventListener('model-error', (event) => {
        console.error(`❌ Model error for ${product.name}:`, event.detail);

        // Track error
        if (this.useSupabase && window.CONFIG.features.analyticsEnabled) {
          this.supabaseClient.trackError('model_error', product.id, event.detail?.message || 'Unknown error');
        }
      });
    }

    return entity;
  }

  // ============================================================================
  // REAL-TIME UPDATES (OPTIONAL)
  // ============================================================================

  /**
   * Enable real-time product updates
   * Automatically refreshes scene when products change in database
   */
  enableRealTimeUpdates() {
    if (!this.useSupabase) {
      console.warn('⚠️ Real-time updates require Supabase to be enabled');
      return;
    }

    console.log('🔔 Enabling real-time product updates...');

    this.subscription = this.supabaseClient.subscribeToProducts(async (payload) => {
      console.log('🔔 Product data changed, reloading configuration...');

      try {
        // Reload configuration
        await this.loadFromSupabase();

        // Regenerate scene
        this.generateScene();

        console.log('✅ Scene updated with latest product data');

      } catch (error) {
        console.error('❌ Error updating scene:', error);
      }
    });
  }

  /**
   * Disable real-time updates
   */
  disableRealTimeUpdates() {
    if (this.subscription) {
      this.supabaseClient.unsubscribe(this.subscription);
      this.subscription = null;
      console.log('🔕 Real-time updates disabled');
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Check if using Supabase
   */
  isUsingSupabase() {
    return this.useSupabase;
  }

  /**
   * Switch to Supabase mode
   */
  async switchToSupabase() {
    if (this.useSupabase) {
      console.log('ℹ️ Already using Supabase');
      return;
    }

    if (!window.CONFIG?.features?.supabaseEnabled) {
      console.error('❌ Supabase is not enabled in CONFIG');
      return;
    }

    this.useSupabase = true;
    console.log('🔄 Switching to Supabase mode...');

    await this.loadConfig();
    this.generateScene();

    console.log('✅ Switched to Supabase mode');
  }

  /**
   * Switch to products.json mode
   */
  async switchToJSON() {
    if (!this.useSupabase) {
      console.log('ℹ️ Already using products.json');
      return;
    }

    this.useSupabase = false;
    console.log('🔄 Switching to products.json mode...');

    await this.loadConfig();
    this.generateScene();

    console.log('✅ Switched to products.json mode');
  }

  /**
   * Reload configuration
   * Useful for manual refresh after database changes
   */
  async reload() {
    console.log('🔄 Reloading configuration...');

    // Clear cache
    if (this.supabaseClient) {
      this.supabaseClient.clearCache();
    }

    // Reload config
    await this.loadConfig();

    // Regenerate scene
    this.generateScene();

    console.log('✅ Configuration reloaded');
  }

  /**
   * Get configuration source
   */
  getConfigSource() {
    return this.useSupabase ? 'Supabase' : 'products.json';
  }

  /**
   * Get load performance stats
   */
  getLoadStats() {
    return {
      source: this.getConfigSource(),
      loadTime: (this.loadEndTime - this.loadStartTime).toFixed(2) + 'ms',
      productsCount: this.products.length,
      timestamp: new Date().toISOString()
    };
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  /**
   * Cleanup on page unload
   * Flushes analytics queue and removes subscriptions
   */
  async cleanup() {
    console.log('🧹 Cleaning up...');

    // Disable real-time updates
    this.disableRealTimeUpdates();

    // Flush analytics queue
    if (this.useSupabase && window.CONFIG.features.analyticsEnabled) {
      await this.supabaseClient.flushEventQueue();
      console.log('✅ Analytics queue flushed');
    }

    console.log('✅ Cleanup complete');
  }
}

// ============================================================================
// PAGE UNLOAD HANDLER
// ============================================================================

// Flush analytics on page unload
window.addEventListener('beforeunload', async () => {
  if (window.arConfig && window.arConfig.cleanup) {
    await window.arConfig.cleanup();
  }
});

// ============================================================================
// MAKE AVAILABLE GLOBALLY
// ============================================================================

window.SupabaseConfigLoader = SupabaseConfigLoader;

console.log('✅ SupabaseConfigLoader loaded');
