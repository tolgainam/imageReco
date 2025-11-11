// ============================================================================
// CONFIGURATION
// ============================================================================
// Central configuration for AR Experience with Supabase integration
//
// This file manages:
// - Feature flags (enable/disable Supabase)
// - Supabase credentials
// - Analytics configuration
// - Fallback behavior
//
// Usage:
// - Update supabase.url and supabase.anonKey with your Supabase project credentials
// - Set features.supabaseEnabled = true to use Supabase
// - Set features.supabaseEnabled = false to use products.json
// - Set features.fallbackToJSON = true to automatically fallback if Supabase fails
// ============================================================================

const CONFIG = {
  // ============================================================================
  // FEATURE FLAGS
  // ============================================================================
  features: {
    /**
     * Enable/disable Supabase integration
     * true: Load products from Supabase database
     * false: Load products from products.json (static file)
     */
    supabaseEnabled: true,  // Set to true when ready to use Supabase

    /**
     * Enable/disable analytics tracking
     * Requires Supabase to be enabled
     * Tracks: page loads, product found/lost, button clicks, errors
     */
    analyticsEnabled: false,  // Set to true to track analytics

    /**
     * Fallback to products.json if Supabase fails
     * true: Automatically use products.json if Supabase error occurs
     * false: Show error message if Supabase fails
     *
     * Recommended: true (provides graceful degradation)
     */
    fallbackToJSON: false
  },

  // ============================================================================
  // SUPABASE CONFIGURATION
  // ============================================================================
  supabase: {
    /**
     * Supabase project URL
     * Find in: Supabase Dashboard → Settings → API → Project URL
     * Format: https://xxxxxxxxxxxxx.supabase.co
     */
    url: 'https://wqtmgnwhpmwztlemlwwd.supabase.co',  // TODO: Add your Supabase project URL here

    /**
     * Supabase anonymous (public) key
     * Find in: Supabase Dashboard → Settings → API → Project API keys → anon public
     *
     * SAFE TO EXPOSE: This key is designed for client-side use
     * RLS policies protect your data
     *
     * Format: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     */
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxdG1nbndocG13enRsZW1sd3dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3MTM2MjgsImV4cCI6MjA3ODI4OTYyOH0.bAWJ06kmUwQ2k0ku7uvr-1xbqj-vRpiFfmhWWrpJU1Y'  // TODO: Add your Supabase anon key here
  },

  // ============================================================================
  // FILE PATHS
  // ============================================================================
  paths: {
    /**
     * Path to products.json (fallback configuration)
     */
    productsJSON: './products.json',

    /**
     * Base path for local assets (when not using Supabase Storage)
     */
    assetsLocal: './assets'
  },

  // ============================================================================
  // ANALYTICS CONFIGURATION
  // ============================================================================
  analytics: {
    /**
     * Unique session ID for this user session
     * Generated automatically on page load
     */
    sessionId: generateSessionId(),

    /**
     * Events to track in analytics
     * All events are sent to analytics_events table in Supabase
     */
    trackEvents: [
      'page_loaded',         // Initial page load
      'product_found',       // Image target detected
      'product_lost',        // Image target lost
      'button_clicked',      // UI button clicked
      'model_loaded',        // 3D model successfully loaded
      'model_error',         // 3D model failed to load
      'target_error',        // Image target failed to load
      'error_occurred'       // General error
    ],

    /**
     * Batch analytics events
     * true: Send events in batches every N seconds
     * false: Send events immediately
     *
     * Recommended: false for real-time tracking
     */
    batchEvents: false,

    /**
     * Batch interval (milliseconds)
     * Only used if batchEvents = true
     */
    batchInterval: 5000  // 5 seconds
  },

  // ============================================================================
  // DEBUG CONFIGURATION
  // ============================================================================
  debug: {
    /**
     * Enable verbose console logging
     * true: Show detailed logs for debugging
     * false: Show minimal logs
     */
    verbose: true,

    /**
     * Log analytics events to console
     * Useful for debugging analytics tracking
     */
    logAnalytics: true,

    /**
     * Show performance metrics
     * Logs load times for config, models, targets
     */
    showPerformance: true
  },

  // ============================================================================
  // PERFORMANCE CONFIGURATION
  // ============================================================================
  performance: {
    /**
     * Timeout for loading configuration (milliseconds)
     * If Supabase doesn't respond in this time, fallback to products.json
     */
    configLoadTimeout: 10000,  // 10 seconds

    /**
     * Cache configuration in localStorage
     * true: Cache config for faster subsequent loads
     * false: Always fetch fresh config
     *
     * Recommended: true for production, false for development
     */
    cacheConfig: false,

    /**
     * Cache duration (milliseconds)
     * How long cached config is valid
     */
    cacheDuration: 3600000  // 1 hour
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate unique session ID
 * Format: session_[timestamp]_[random]
 * Example: session_1699564321456_k3j8h2x9p
 */
function generateSessionId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `session_${timestamp}_${random}`;
}

/**
 * Validate Supabase configuration
 * Returns true if Supabase is properly configured
 */
function validateSupabaseConfig() {
  if (!CONFIG.features.supabaseEnabled) {
    return false;
  }

  if (!CONFIG.supabase.url || CONFIG.supabase.url === '') {
    console.warn('⚠️ Supabase URL not configured');
    return false;
  }

  if (!CONFIG.supabase.anonKey || CONFIG.supabase.anonKey === '') {
    console.warn('⚠️ Supabase anon key not configured');
    return false;
  }

  // Validate URL format
  if (!CONFIG.supabase.url.match(/^https:\/\/[a-z0-9]+\.supabase\.co$/)) {
    console.warn('⚠️ Invalid Supabase URL format. Expected: https://xxxxxxxxxxxxx.supabase.co');
    return false;
  }

  // Validate key format (JWT)
  if (!CONFIG.supabase.anonKey.startsWith('eyJ')) {
    console.warn('⚠️ Invalid Supabase anon key format');
    return false;
  }

  return true;
}

/**
 * Log configuration status
 * Shows current configuration in console
 */
function logConfigStatus() {
  console.log('📋 Configuration Status:');
  console.log(`   Supabase enabled: ${CONFIG.features.supabaseEnabled}`);
  console.log(`   Analytics enabled: ${CONFIG.features.analyticsEnabled}`);
  console.log(`   Fallback to JSON: ${CONFIG.features.fallbackToJSON}`);

  if (CONFIG.features.supabaseEnabled) {
    const isValid = validateSupabaseConfig();
    console.log(`   Supabase config valid: ${isValid ? '✅' : '❌'}`);

    if (isValid) {
      console.log(`   Supabase URL: ${CONFIG.supabase.url}`);
      console.log(`   Session ID: ${CONFIG.analytics.sessionId}`);
    }
  } else {
    console.log(`   Using products.json: ${CONFIG.paths.productsJSON}`);
  }
}

// ============================================================================
// ENVIRONMENT DETECTION
// ============================================================================

/**
 * Detect if running in development or production
 */
function getEnvironment() {
  const hostname = window.location.hostname;

  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '') {
    return 'development';
  }

  return 'production';
}

/**
 * Auto-configure based on environment
 * Adjust settings for dev vs prod
 */
function autoConfigureEnvironment() {
  const env = getEnvironment();

  if (env === 'development') {
    // Development: More verbose logging, no caching
    CONFIG.debug.verbose = true;
    CONFIG.debug.logAnalytics = true;
    CONFIG.performance.cacheConfig = false;
  } else {
    // Production: Less logging, enable caching
    CONFIG.debug.verbose = false;
    CONFIG.debug.logAnalytics = false;
    CONFIG.performance.cacheConfig = true;
  }

  console.log(`🌍 Environment: ${env}`);
}

// ============================================================================
// INITIALIZATION
// ============================================================================

// Auto-configure on load
autoConfigureEnvironment();

// Log configuration status
if (CONFIG.debug.verbose) {
  logConfigStatus();
}

// Make CONFIG globally available
window.CONFIG = CONFIG;

// Expose helper functions
window.validateSupabaseConfig = validateSupabaseConfig;
window.logConfigStatus = logConfigStatus;

// ============================================================================
// USAGE EXAMPLES
// ============================================================================
//
// Example 1: Enable Supabase
// ----------------------------
// CONFIG.features.supabaseEnabled = true;
// CONFIG.supabase.url = 'https://abcdefgh.supabase.co';
// CONFIG.supabase.anonKey = 'eyJhbGc...';
//
// Example 2: Disable Supabase (use products.json)
// ------------------------------------------------
// CONFIG.features.supabaseEnabled = false;
//
// Example 3: Enable analytics
// ----------------------------
// CONFIG.features.supabaseEnabled = true;
// CONFIG.features.analyticsEnabled = true;
//
// Example 4: Check configuration
// -------------------------------
// validateSupabaseConfig(); // Returns true/false
// logConfigStatus();        // Logs to console
//
// ============================================================================

console.log('✅ Configuration loaded');
