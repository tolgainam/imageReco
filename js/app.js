// AR Experience Logic
console.log('Image Recognition AR - Initializing...');

// DOM Elements
const loadingScreen = document.getElementById('loading-screen');
const instructionsScreen = document.getElementById('instructions-screen');
const trackingIndicator = document.getElementById('tracking-indicator');

// Get A-Frame scene
const sceneEl = document.querySelector('a-scene');

// Flags to track readiness
let sceneLoaded = false;
let configReady = false;

// Check if both scene and config are ready, then start MindAR
function tryStartMindAR() {
  if (!sceneLoaded || !configReady) {
    console.log(`⏳ Waiting... Scene loaded: ${sceneLoaded}, Config ready: ${configReady}`);
    return;
  }

  console.log('✅ Both scene and config ready, starting MindAR...');

  // Get AR system
  const arSystem = sceneEl.systems['mindar-image-system'];

  // DEBUG: Check if imageTargetSrc is set
  const mindARAttr = sceneEl.getAttribute('mindar-image');
  console.log('🔍 MindAR attribute before start:', mindARAttr);

  if (!mindARAttr || !mindARAttr.imageTargetSrc || mindARAttr.imageTargetSrc === '') {
    console.error('❌ ERROR: imageTargetSrc not set!');
    return;
  }

  // Start MindAR
  setTimeout(() => {
    console.log('🚀 Starting MindAR...');
    arSystem.start();
  }, 500);
}

// Wait for scene to load
sceneEl.addEventListener('loaded', () => {
  console.log('A-Frame scene loaded');
  sceneLoaded = true;
  tryStartMindAR();
});

// Wait for AR configuration to be ready
window.addEventListener('ar-config-ready', () => {
  console.log('AR configuration ready');
  configReady = true;
  tryStartMindAR();
});

// Track target found/lost events
document.addEventListener('DOMContentLoaded', () => {
  const targets = document.querySelectorAll('[mindar-image-target]');

  targets.forEach((target, index) => {
    // Target found
    target.addEventListener('targetFound', (event) => {
      console.log(`Target ${index} found`);
      trackingIndicator.classList.remove('hidden');

      // Add your custom logic here
      // Example: trigger animations, show UI elements, etc.
    });

    // Target lost
    target.addEventListener('targetLost', (event) => {
      console.log(`Target ${index} lost`);
      trackingIndicator.classList.add('hidden');

      // Add your custom logic here
      // Example: pause animations, hide UI elements, etc.
    });
  });
});

// Handle errors
window.addEventListener('error', (event) => {
  console.error('Error:', event.error);

  // Show error message to user
  if (loadingScreen.classList.contains('active')) {
    loadingScreen.querySelector('p').textContent = 'Error loading AR. Please refresh.';
  }
});

// Handle camera permissions
navigator.mediaDevices?.getUserMedia({ video: true })
  .then(() => {
    console.log('Camera permission granted');
  })
  .catch((err) => {
    console.error('Camera permission denied:', err);
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

// Log when AR system is ready
console.log('AR Experience script loaded');
