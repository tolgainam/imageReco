// ============================================================================
// ML PRODUCT CLASSIFIER - TensorFlow.js Image Classification
// ============================================================================
// Uses Teachable Machine trained model to identify products from camera feed
//
// Features:
// - Fast inference (30-50ms)
// - Runs entirely in browser (offline capable)
// - High accuracy for visually similar products
// - Confidence scoring
//
// Model trained on: Cool Mint vs Spearmint Zyn products
// ============================================================================

class MLClassifier {
  constructor() {
    this.model = null;
    this.initialized = false;
    this.isProcessing = false;
    this.modelURL = './js/mlModels/model.json';
    this.metadataURL = './js/mlModels/metadata.json';

    // Configuration
    this.config = {
      confidenceThreshold: 0.70, // 70% minimum confidence
      debugMode: window.CONFIG?.debug?.verbose ?? true,
      throttleInterval: 500, // Process twice per second (faster than OCR!)
      imageSize: 224 // Teachable Machine default
    };

    // Performance tracking
    this.stats = {
      totalClassifications: 0,
      successfulMatches: 0,
      failedMatches: 0,
      averageInferenceTime: 0
    };

    // Label mapping (from Teachable Machine to product IDs)
    this.labelMap = {
      'Cool Mint': 'product-2',
      'Spearmint': 'product-1'
    };

    console.log('🤖 MLClassifier initialized');
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  /**
   * Initialize the ML classifier with Teachable Machine model
   * @param {Array} products - Array of product objects from config
   */
  async initialize(products) {
    if (!products || products.length === 0) {
      console.warn('⚠️ No products provided to MLClassifier');
      return false;
    }

    console.log(`🔄 Loading ML model from ${this.modelURL}...`);
    const startTime = performance.now();

    try {
      // Check if TensorFlow.js and Teachable Machine are loaded
      if (typeof tf === 'undefined') {
        throw new Error('TensorFlow.js not loaded. Include tfjs script in HTML.');
      }

      if (typeof tmImage === 'undefined') {
        throw new Error('Teachable Machine library not loaded. Include tm-image script in HTML.');
      }

      // Load the Teachable Machine model
      this.model = await tmImage.load(this.modelURL, this.metadataURL);

      this.initialized = true;
      const loadTime = (performance.now() - startTime).toFixed(2);

      console.log(`✅ ML Model loaded successfully (${loadTime}ms)`);
      console.log(`📊 Model info:`, {
        inputShape: this.model.getInputShape ? this.model.getInputShape() : 'N/A',
        classes: this.model.getTotalClasses(),
        labels: this.model.getClassLabels()
      });

      return true;

    } catch (error) {
      console.error('❌ ML Model loading failed:', error);
      this.initialized = false;
      throw error;
    }
  }

  // ============================================================================
  // PRODUCT CLASSIFICATION
  // ============================================================================

  /**
   * Classify product from video element using ML model
   * @param {HTMLVideoElement} videoElement - Video source from camera
   * @returns {Promise<Object>} - Classification result with productId and confidence
   */
  async classifyProduct(videoElement) {
    if (!this.initialized) {
      console.warn('⚠️ MLClassifier not initialized');
      return null;
    }

    if (!videoElement || videoElement.readyState < 2) {
      console.warn('⚠️ Video element not ready');
      return null;
    }

    if (this.isProcessing) {
      console.log('⏭️ ML already processing, skipping...');
      return null;
    }

    this.isProcessing = true;
    const startTime = performance.now();

    try {
      // Run prediction on video element
      if (this.config.debugMode) {
        console.log('🤖 Running ML classification...');
      }

      const predictions = await this.model.predict(videoElement);

      // Process predictions
      const inferenceTime = performance.now() - startTime;

      // Sort by confidence
      predictions.sort((a, b) => b.probability - a.probability);

      const topPrediction = predictions[0];
      const confidence = topPrediction.probability;
      const label = topPrediction.className;

      // Log all predictions if debug mode
      if (this.config.debugMode) {
        console.log('═══════════════════════════════════');
        console.log('🤖 ML Classification Results:');
        predictions.forEach((pred, idx) => {
          const emoji = idx === 0 ? '✓' : '○';
          console.log(`  ${emoji} ${pred.className}: ${(pred.probability * 100).toFixed(1)}%`);
        });
      }

      // Update stats
      this.stats.totalClassifications++;
      this.stats.averageInferenceTime =
        (this.stats.averageInferenceTime * (this.stats.totalClassifications - 1) + inferenceTime) /
        this.stats.totalClassifications;

      // Check confidence threshold
      if (confidence < this.config.confidenceThreshold) {
        this.stats.failedMatches++;

        if (this.config.debugMode) {
          console.log(`⚠️ Low confidence: ${label} (${(confidence * 100).toFixed(1)}%)`);
          console.log(`   Threshold: ${(this.config.confidenceThreshold * 100).toFixed(0)}%`);
          console.log(`⚡ Inference time: ${inferenceTime.toFixed(2)}ms`);
          console.log('═══════════════════════════════════');
        }

        return null;
      }

      // Map label to product ID
      const productId = this.labelMap[label];

      if (!productId) {
        console.warn(`⚠️ Unknown label: ${label}`);
        this.stats.failedMatches++;
        return null;
      }

      this.stats.successfulMatches++;

      // Log success
      if (this.config.debugMode) {
        console.log(`✅ Product identified: ${productId} (${label})`);
        console.log(`📊 Confidence: ${(confidence * 100).toFixed(1)}%`);
        console.log(`⚡ Inference time: ${inferenceTime.toFixed(2)}ms`);
        console.log('═══════════════════════════════════');
      }

      return {
        productId: productId,
        confidence: confidence,
        label: label,
        allPredictions: predictions.map(p => ({
          label: p.className,
          productId: this.labelMap[p.className],
          confidence: p.probability
        })),
        inferenceTime: inferenceTime
      };

    } catch (error) {
      console.error('❌ ML classification failed:', error);
      return null;
    } finally {
      this.isProcessing = false;
    }
  }

  // ============================================================================
  // CONFIGURATION
  // ============================================================================

  /**
   * Set confidence threshold
   * @param {number} threshold - Threshold value (0-1)
   */
  setConfidenceThreshold(threshold) {
    if (threshold < 0 || threshold > 1) {
      console.warn('⚠️ Invalid threshold, must be between 0 and 1');
      return;
    }
    this.config.confidenceThreshold = threshold;
    console.log(`🔧 Confidence threshold set to ${(threshold * 100).toFixed(0)}%`);
  }

  /**
   * Enable or disable debug mode
   * @param {boolean} enabled - Debug mode state
   */
  setDebugMode(enabled) {
    this.config.debugMode = enabled;
    console.log(`🔧 Debug mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Update label mapping
   * @param {Object} mapping - Label to product ID mapping
   */
  setLabelMap(mapping) {
    this.labelMap = { ...mapping };
    console.log('🔧 Label mapping updated:', this.labelMap);
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Get performance statistics
   * @returns {Object} - Stats object
   */
  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.totalClassifications > 0
        ? (this.stats.successfulMatches / this.stats.totalClassifications * 100).toFixed(1) + '%'
        : 'N/A'
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      totalClassifications: 0,
      successfulMatches: 0,
      failedMatches: 0,
      averageInferenceTime: 0
    };
    console.log('📊 Statistics reset');
  }

  /**
   * Check if classifier is ready
   * @returns {boolean}
   */
  isReady() {
    return this.initialized && this.model !== null;
  }

  /**
   * Get model info
   * @returns {Object}
   */
  getModelInfo() {
    if (!this.model) {
      return null;
    }

    return {
      classes: this.model.getTotalClasses(),
      labels: this.model.getClassLabels(),
      inputShape: this.model.getInputShape ? this.model.getInputShape() : [1, 224, 224, 3],
      labelMap: this.labelMap
    };
  }

  /**
   * Dispose model and cleanup
   */
  async cleanup() {
    if (this.model) {
      console.log('🧹 Cleaning up ML model...');
      // Teachable Machine models handle cleanup automatically
      this.model = null;
      this.initialized = false;
      console.log('✅ ML model disposed');
    }
  }
}

// ============================================================================
// EXPORT
// ============================================================================

// Make available globally
window.MLClassifier = MLClassifier;

console.log('✅ MLClassifier module loaded');
