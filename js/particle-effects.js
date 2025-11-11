// ============================================================================
// EDGE GLOW EFFECTS SYSTEM - Glowing edges for immersive AR experience
// ============================================================================
// Creates ambient edge glow using product's primary color
// Subtle glow around all screen edges for enhanced immersion
// ============================================================================

class ParticleEffects {
  constructor() {
    this.glowOverlay = null;
    this.isActive = false;
    this.currentColor = '#4CC3D9'; // Default color
    this.glowIntensity = 100; // Glow spread distance
    this.glowOpacity = 0.3; // Overall opacity

    console.log('✨ EdgeGlow initialized');
  }

  /**
   * Initialize edge glow effect
   * @param {string} color - Primary color for glow (hex)
   * @param {Object} options - Configuration options
   */
  start(color = '#4CC3D9', options = {}) {
    if (this.isActive) {
      this.stop();
    }

    this.currentColor = color;
    this.glowIntensity = options.glowIntensity || 100;
    this.glowOpacity = options.glowOpacity || 0.3;

    // Create overlay if it doesn't exist
    if (!this.glowOverlay) {
      this.createGlowOverlay();
    }

    // Update glow effect
    this.updateGlow();

    // Show overlay
    this.glowOverlay.style.display = 'block';
    this.isActive = true;

    console.log(`✨ Edge glow started with color: ${color}`);
  }

  /**
   * Create glow overlay element
   */
  createGlowOverlay() {
    this.glowOverlay = document.createElement('div');
    this.glowOverlay.id = 'edge-glow-overlay';
    this.glowOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 100;
      display: none;
    `;

    document.body.appendChild(this.glowOverlay);
  }

  /**
   * Update glow effect with current color
   */
  updateGlow() {
    if (!this.glowOverlay) return;

    const rgba = this.hexToRGBA(this.currentColor, this.glowOpacity);
    const rgbaTransparent = this.hexToRGBA(this.currentColor, 0);

    // Create gradient from edges inward
    this.glowOverlay.style.background = `
      radial-gradient(
        ellipse at center,
        ${rgbaTransparent} 0%,
        ${rgbaTransparent} 60%,
        ${rgba} 100%
      )
    `;

    // Alternative: box-shadow based glow
    this.glowOverlay.style.boxShadow = `
      inset 0 0 ${this.glowIntensity}px ${this.glowIntensity / 2}px ${rgba}
    `;
  }

  /**
   * Stop edge glow effects
   */
  stop() {
    this.isActive = false;

    if (this.glowOverlay) {
      this.glowOverlay.style.display = 'none';
    }

    console.log('✨ Edge glow stopped');
  }

  /**
   * Change glow color (for switching products)
   */
  changeColor(color) {
    this.currentColor = color;
    this.updateGlow();
    console.log(`✨ Edge glow color changed to: ${color}`);
  }

  /**
   * Convert hex color to RGBA
   */
  hexToRGBA(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  /**
   * Cleanup
   */
  cleanup() {
    this.stop();
    if (this.glowOverlay && this.glowOverlay.parentNode) {
      this.glowOverlay.parentNode.removeChild(this.glowOverlay);
    }
    this.glowOverlay = null;
  }
}

// ============================================================================
// EXPORT
// ============================================================================

window.ParticleEffects = ParticleEffects;
console.log('✅ EdgeGlow module loaded');
