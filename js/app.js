// AR Experience Logic
console.log('Image Recognition AR - Initializing...');

// DOM Elements
const loadingScreen = document.getElementById('loading-screen');
const instructionsScreen = document.getElementById('instructions-screen');
const trackingIndicator = document.getElementById('tracking-indicator');

// Get A-Frame scene
const sceneEl = document.querySelector('a-scene');

// ML Classifier instance (global)
let mlClassifier = null;
let mlReady = false;

// Current product tracking
let currentProduct = null;
let detectionInProgress = false;

// Listen for config ready event
window.addEventListener('ar-config-ready', async () => {
  console.log('✅ AR config ready');

  // Wait for MindAR's TensorFlow to be ready before initializing ML
  const initializeML = async () => {
    // Initialize ML Classifier with trained model
    if (window.MLClassifier && window.arConfig) {
      console.log('🔄 Initializing ML Classifier...');
      try {
        mlClassifier = new MLClassifier();
        await mlClassifier.initialize(window.arConfig.products);
        mlReady = mlClassifier.isReady();

        if (mlReady) {
          console.log('✅ ML Classifier initialized and ready');
          console.log('🤖 Model info:', mlClassifier.getModelInfo());
        } else {
          console.warn('⚠️ ML Classifier initialized but not ready');
        }
      } catch (error) {
        console.error('❌ ML Classifier initialization failed:', error);
        mlReady = false;
      }
    } else {
      console.warn('⚠️ MLClassifier or arConfig not available');
    }
  };

  // Check if TensorFlow is ready
  if (typeof tf !== 'undefined' && tf.ready) {
    await tf.ready();
    console.log('✅ TensorFlow.js ready for ML initialization');
    await initializeML();
  } else {
    // Wait for mindar-tf-ready event
    window.addEventListener('mindar-tf-ready', async () => {
      console.log('✅ MindAR TensorFlow ready signal received');
      await initializeML();
    }, { once: true });
  }
});

// Wait for scene, config, AND camera ready before starting MindAR
let sceneLoaded = false;
let configReady = false;
let cameraReady = false;

function tryStartAR() {
  if (!sceneLoaded || !configReady || !cameraReady) {
    console.log(`⏳ Waiting... Scene: ${sceneLoaded}, Config: ${configReady}, Camera: ${cameraReady}`);
    return; // Wait for all three conditions
  }

  console.log('✅ Scene, config, and camera ready - starting AR...');

  const arSystem = sceneEl.systems['mindar-image-system'];

  if (arSystem) {
    // Wait a bit more to ensure camera video stream is fully initialized
    setTimeout(() => {
      console.log('🚀 Starting MindAR...');

      try {
        arSystem.start();

        // Setup ML event listeners after MindAR starts
        setTimeout(() => {
          setupMLEventListeners();
        }, 1000);
      } catch (error) {
        console.error('❌ Failed to start MindAR:', error);
        console.error('   Error details:', error.message);
      }
    }, 1000); // Shorter delay now that we're waiting for camera
  } else {
    console.error('❌ MindAR system not found');
  }
}

sceneEl.addEventListener('loaded', () => {
  console.log('✅ A-Frame scene loaded');
  sceneLoaded = true;
  tryStartAR();
});

window.addEventListener('ar-config-ready', () => {
  console.log('✅ AR config ready in app.js');
  configReady = true;
  tryStartAR();
});

// Setup ML event listeners for targets
function setupMLEventListeners() {
  const targets = document.querySelectorAll('[mindar-image-target]');
  console.log(`🎯 Setting up ML event listeners for ${targets.length} target(s)`);

  targets.forEach((target, index) => {
    // Target found
    target.addEventListener('targetFound', async (event) => {
      console.log(`Target ${index} found`);
      trackingIndicator.classList.remove('hidden');

      // Run ML classification if ready
      if (mlReady && mlClassifier && !detectionInProgress) {
        detectionInProgress = true;

        // Small delay to ensure stable tracking
        setTimeout(async () => {
          try {
            const videoElement = document.querySelector('video');

            if (!videoElement || videoElement.readyState < 2) {
              console.warn('⚠️ Video not ready for ML classification');
              detectionInProgress = false;
              return;
            }

            console.log('🤖 Running ML classification to identify product...');

            const result = await mlClassifier.classifyProduct(videoElement);

            if (result && result.confidence >= mlClassifier.config.confidenceThreshold) {
              console.log(`✅ Product identified: ${result.productId} (${result.label}) - ${(result.confidence * 100).toFixed(1)}%`);

              // Find the matched product
              const matchedProduct = window.arConfig.products.find(p => p.id === result.productId);

              if (matchedProduct) {
                currentProduct = matchedProduct;

                // Update tracking indicator with product name
                const trackingText = trackingIndicator.querySelector('.text');
                if (trackingText) {
                  trackingText.textContent = `Tracking: ${matchedProduct.name}`;
                }

                // Dispatch custom event for product identification
                window.dispatchEvent(new CustomEvent('product-identified', {
                  detail: {
                    product: matchedProduct,
                    confidence: result.confidence,
                    label: result.label,
                    inferenceTime: result.inferenceTime,
                    targetIndex: index
                  }
                }));

                // Call product found handler if available
                if (window.arConfig.onProductFound) {
                  window.arConfig.onProductFound(matchedProduct);
                }
              }
            } else if (result) {
              console.log(`⚠️ Low confidence: ${result.label} (${(result.confidence * 100).toFixed(1)}%)`);
              console.log('   Threshold:', (mlClassifier.config.confidenceThreshold * 100).toFixed(0) + '%');
            } else {
              console.warn('⚠️ No product match found');
            }
          } catch (error) {
            console.error('❌ Error during ML classification:', error);
          } finally {
            detectionInProgress = false;
          }
        }, 500); // 500ms delay for stable tracking
      }
    });

    // Target lost
    target.addEventListener('targetLost', (event) => {
      console.log(`Target ${index} lost`);
      trackingIndicator.classList.add('hidden');

      // Reset tracking indicator text
      const trackingText = trackingIndicator.querySelector('.text');
      if (trackingText) {
        trackingText.textContent = 'Tracking';
      }

      // Clear detection state
      detectionInProgress = false;

      // Call product lost handler if available
      if (currentProduct && window.arConfig.onProductLost) {
        window.arConfig.onProductLost(currentProduct);
      }

      currentProduct = null;

      // Dispatch custom event
      window.dispatchEvent(new CustomEvent('product-lost', {
        detail: { targetIndex: index }
      }));
    });
  });
}

// Handle errors
window.addEventListener('error', (event) => {
  console.error('Error:', event.error);

  // Show error message to user
  if (loadingScreen.classList.contains('active')) {
    loadingScreen.querySelector('p').textContent = 'Error loading AR. Please refresh.';
  }
});

// Handle camera permissions and wait for video to be ready
navigator.mediaDevices?.getUserMedia({ video: true })
  .then((stream) => {
    console.log('📹 Camera permission granted');

    // Wait for video element to be created and ready
    const waitForVideo = setInterval(() => {
      const videoElement = document.querySelector('video');

      if (videoElement && videoElement.readyState >= 2) {
        console.log('✅ Camera video stream ready');
        clearInterval(waitForVideo);
        cameraReady = true;
        tryStartAR();

        // Stop the test stream since A-Frame will create its own
        stream.getTracks().forEach(track => track.stop());
      }
    }, 100);

    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(waitForVideo);
      if (!cameraReady) {
        console.warn('⚠️ Camera video timeout, starting anyway');
        cameraReady = true;
        tryStartAR();
        stream.getTracks().forEach(track => track.stop());
      }
    }, 10000);
  })
  .catch((err) => {
    console.error('❌ Camera permission denied:', err);
    alert('Camera access is required for AR experience. Please enable camera permissions.');
  });

// Prevent accidental page refresh on mobile
let touchStartY = 0;
document.addEventListener('touchstart', (e) => {
  touchStartY = e.touches[0].clientY;
}, { passive: false });

document.addEventListener('touchmove', (e) => {
  const touchY = e.touches[0].clientY;
  const touchDelta = touchY - touchStartY;

  // Prevent pull-to-refresh
  if (touchDelta > 0 && window.scrollY === 0) {
    e.preventDefault();
  }
}, { passive: false });

// Cleanup on page unload
window.addEventListener('beforeunload', async () => {
  if (mlClassifier && mlClassifier.cleanup) {
    await mlClassifier.cleanup();
  }
});

// Log when AR system is ready
console.log('AR Experience script loaded');
