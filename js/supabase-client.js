// ============================================================================
// SUPABASE CLIENT
// ============================================================================
// Manages all interactions with Supabase backend
//
// Features:
// - Product data fetching
// - Analytics event tracking
// - Error handling
// - Performance monitoring
//
// Usage:
// const client = new SupabaseClient();
// const products = await client.getProducts();
// await client.trackEvent('product_found', 'product-1');
// ============================================================================

class SupabaseClient {
  constructor() {
    this.client = null;
    this.isInitialized = false;
    this.cache = new Map();
    this.eventQueue = [];
    this.startTime = performance.now();

    this.initialize();
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  /**
   * Initialize Supabase client
   * Validates configuration and creates client instance
   */
  initialize() {
    // Validate configuration
    if (!window.CONFIG?.supabase?.url || !window.CONFIG?.supabase?.anonKey) {
      console.warn('⚠️ Supabase credentials not configured in CONFIG');
      return;
    }

    if (!window.supabase) {
      console.error('❌ Supabase library not loaded. Include <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>');
      return;
    }

    try {
      // Create Supabase client
      this.client = window.supabase.createClient(
        window.CONFIG.supabase.url,
        window.CONFIG.supabase.anonKey
      );

      this.isInitialized = true;

      const initTime = (performance.now() - this.startTime).toFixed(2);
      console.log(`✅ Supabase client initialized (${initTime}ms)`);

      // Start event queue processing if analytics enabled
      if (window.CONFIG.features.analyticsEnabled && window.CONFIG.analytics.batchEvents) {
        this.startEventQueueProcessor();
      }

    } catch (error) {
      console.error('❌ Error initializing Supabase client:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Check if client is ready to use
   */
  isReady() {
    return this.isInitialized && this.client !== null;
  }

  // ============================================================================
  // PRODUCT DATA FETCHING
  // ============================================================================

  /**
   * Get all published products from database
   * Fetches products with all related data via joins
   *
   * @returns {Promise<Array>} Array of products with nested relations
   */
  async getProducts() {
    if (!this.isReady()) {
      throw new Error('Supabase client not initialized');
    }

    const startTime = performance.now();

    try {
      // Check cache first
      if (this.isCacheValid('products')) {
        console.log('📦 Using cached products');
        return this.cache.get('products').data;
      }

      console.log('🔄 Fetching products from Supabase...');

      // Query products with all related tables
      const { data, error } = await this.client
        .from('products')
        .select(`
          *,
          product_targets (*),
          product_models (*),
          product_ui_config (*),
          product_buttons (*)
        `)
        .eq('status', 'published')
        .order('target_index', { ascending: true });

      if (error) {
        console.error('❌ Error fetching products:', error);
        throw new Error(`Failed to fetch products: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.warn('⚠️ No products found in database');
        return [];
      }

      const loadTime = (performance.now() - startTime).toFixed(2);
      console.log(`✅ Fetched ${data.length} product(s) from Supabase (${loadTime}ms)`);

      // Cache products
      if (window.CONFIG.performance.cacheConfig) {
        this.setCacheItem('products', data);
      }

      // Log performance metric
      if (window.CONFIG.debug.showPerformance) {
        console.log(`⚡ Product fetch performance: ${loadTime}ms`);
      }

      return data;

    } catch (error) {
      console.error('❌ Error in getProducts:', error);
      throw error;
    }
  }

  /**
   * Get single product by ID
   *
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} Product data
   */
  async getProduct(productId) {
    if (!this.isReady()) {
      throw new Error('Supabase client not initialized');
    }

    try {
      const { data, error } = await this.client
        .from('products_complete')
        .select('*')
        .eq('product_id', productId)
        .single();

      if (error) {
        console.error(`❌ Error fetching product ${productId}:`, error);
        throw error;
      }

      return data;

    } catch (error) {
      console.error(`❌ Error in getProduct(${productId}):`, error);
      throw error;
    }
  }

  /**
   * Get global settings
   *
   * @returns {Promise<Object>} Global settings
   */
  async getGlobalSettings() {
    if (!this.isReady()) {
      throw new Error('Supabase client not initialized');
    }

    try {
      // Check cache first
      if (this.isCacheValid('globalSettings')) {
        return this.cache.get('globalSettings').data;
      }

      const { data, error } = await this.client
        .from('global_settings')
        .select('*')
        .eq('setting_key', 'ar_config')
        .maybeSingle();

      if (error) {
        console.error('❌ Error fetching global settings:', error);
        return null;
      }

      if (!data) {
        console.warn('⚠️ No global settings found in database');
        return null;
      }

      // Cache settings
      if (window.CONFIG.performance.cacheConfig) {
        this.setCacheItem('globalSettings', data);
      }

      return data;

    } catch (error) {
      console.error('❌ Error in getGlobalSettings:', error);
      return null;
    }
  }

  // ============================================================================
  // ANALYTICS TRACKING
  // ============================================================================

  /**
   * Track analytics event
   *
   * @param {string} eventType - Type of event (e.g., 'product_found')
   * @param {string|null} productId - Product ID (optional)
   * @param {Object} metadata - Additional event data (optional)
   */
  async trackEvent(eventType, productId = null, metadata = {}) {
    // Skip if analytics disabled
    if (!window.CONFIG.features.analyticsEnabled) {
      return;
    }

    if (!this.isReady()) {
      console.warn('⚠️ Cannot track event: Supabase client not initialized');
      return;
    }

    // Check if this event type should be tracked
    if (!window.CONFIG.analytics.trackEvents.includes(eventType)) {
      return;
    }

    // Create event object
    const event = {
      event_type: eventType,
      product_id: productId,
      session_id: window.CONFIG.analytics.sessionId,
      metadata: metadata,
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight
    };

    // Log if debugging enabled
    if (window.CONFIG.debug.logAnalytics) {
      console.log('📊 Analytics event:', eventType, productId || '', metadata);
    }

    // Batch events or send immediately
    if (window.CONFIG.analytics.batchEvents) {
      this.eventQueue.push(event);
    } else {
      await this.sendEvent(event);
    }
  }

  /**
   * Send single event to database
   * @private
   */
  async sendEvent(event) {
    try {
      const { error } = await this.client
        .from('analytics_events')
        .insert(event);

      if (error) {
        console.error('❌ Analytics error:', error);
      }

    } catch (error) {
      console.error('❌ Error sending analytics event:', error);
    }
  }

  /**
   * Send batch of events
   * @private
   */
  async sendEventBatch() {
    if (this.eventQueue.length === 0) {
      return;
    }

    try {
      const events = [...this.eventQueue];
      this.eventQueue = [];

      const { error } = await this.client
        .from('analytics_events')
        .insert(events);

      if (error) {
        console.error('❌ Batch analytics error:', error);
        // Re-add failed events to queue
        this.eventQueue.push(...events);
      } else {
        console.log(`📊 Sent ${events.length} analytics events`);
      }

    } catch (error) {
      console.error('❌ Error sending analytics batch:', error);
    }
  }

  /**
   * Start event queue processor
   * Sends batched events at regular intervals
   * @private
   */
  startEventQueueProcessor() {
    setInterval(() => {
      this.sendEventBatch();
    }, window.CONFIG.analytics.batchInterval);

    console.log(`📊 Analytics batch processor started (interval: ${window.CONFIG.analytics.batchInterval}ms)`);
  }

  /**
   * Flush event queue
   * Send all pending events immediately
   */
  async flushEventQueue() {
    await this.sendEventBatch();
  }

  // ============================================================================
  // ANALYTICS HELPER METHODS
  // ============================================================================

  /**
   * Track page load
   */
  async trackPageLoad() {
    await this.trackEvent('page_loaded', null, {
      url: window.location.href,
      referrer: document.referrer
    });
  }

  /**
   * Track product found
   */
  async trackProductFound(productId) {
    await this.trackEvent('product_found', productId);
  }

  /**
   * Track product lost
   */
  async trackProductLost(productId) {
    await this.trackEvent('product_lost', productId);
  }

  /**
   * Track button click
   */
  async trackButtonClick(productId, buttonId) {
    await this.trackEvent('button_clicked', productId, { buttonId });
  }

  /**
   * Track model loaded
   */
  async trackModelLoaded(productId, loadTime) {
    await this.trackEvent('model_loaded', productId, { loadTime });
  }

  /**
   * Track error
   */
  async trackError(errorType, productId, errorMessage) {
    await this.trackEvent('error_occurred', productId, {
      errorType,
      errorMessage
    });
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  /**
   * Set cache item with expiration
   * @private
   */
  setCacheItem(key, data) {
    this.cache.set(key, {
      data: data,
      timestamp: Date.now()
    });
  }

  /**
   * Check if cached item is still valid
   * @private
   */
  isCacheValid(key) {
    if (!this.cache.has(key)) {
      return false;
    }

    const cached = this.cache.get(key);
    const age = Date.now() - cached.timestamp;

    return age < window.CONFIG.performance.cacheDuration;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Cache cleared');
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Check Supabase connection
   * @returns {Promise<boolean>} True if connected
   */
  async checkConnection() {
    if (!this.isReady()) {
      return false;
    }

    try {
      const { data, error } = await this.client
        .from('products')
        .select('count')
        .limit(1);

      return !error;

    } catch (error) {
      console.error('❌ Connection check failed:', error);
      return false;
    }
  }

  /**
   * Get storage URL for file
   *
   * @param {string} bucket - Bucket name
   * @param {string} path - File path
   * @returns {string} Public URL
   */
  getStorageUrl(bucket, path) {
    if (!this.isReady()) {
      console.warn('⚠️ Supabase client not initialized');
      return null;
    }

    const { data } = this.client.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  /**
   * Upload file to storage
   *
   * @param {string} bucket - Bucket name
   * @param {string} path - File path
   * @param {File} file - File object
   * @returns {Promise<string>} Public URL
   */
  async uploadFile(bucket, path, file) {
    if (!this.isReady()) {
      throw new Error('Supabase client not initialized');
    }

    try {
      const { data, error } = await this.client.storage
        .from(bucket)
        .upload(path, file, {
          upsert: true
        });

      if (error) {
        console.error(`❌ Error uploading file to ${bucket}/${path}:`, error);
        throw error;
      }

      // Get public URL
      const publicUrl = this.getStorageUrl(bucket, path);

      console.log(`✅ Uploaded file to ${bucket}/${path}`);

      return publicUrl;

    } catch (error) {
      console.error('❌ Error in uploadFile:', error);
      throw error;
    }
  }

  // ============================================================================
  // REALTIME SUBSCRIPTIONS (OPTIONAL)
  // ============================================================================

  /**
   * Subscribe to product changes (real-time updates)
   *
   * @param {Function} callback - Function to call when products change
   * @returns {Object} Subscription object
   */
  subscribeToProducts(callback) {
    if (!this.isReady()) {
      console.warn('⚠️ Cannot subscribe: Supabase client not initialized');
      return null;
    }

    console.log('🔔 Subscribing to product changes...');

    const subscription = this.client
      .channel('products-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          console.log('🔔 Product changed:', payload);
          callback(payload);
        }
      )
      .subscribe();

    return subscription;
  }

  /**
   * Unsubscribe from real-time updates
   *
   * @param {Object} subscription - Subscription object
   */
  unsubscribe(subscription) {
    if (subscription) {
      this.client.removeChannel(subscription);
      console.log('🔕 Unsubscribed from changes');
    }
  }
}

// ============================================================================
// MAKE AVAILABLE GLOBALLY
// ============================================================================

window.SupabaseClient = SupabaseClient;

console.log('✅ SupabaseClient loaded');
