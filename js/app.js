// AR Experience Logic
console.log('Image Recognition AR - Initializing...');

// DOM Elements
const loadingScreen = document.getElementById('loading-screen');
const instructionsScreen = document.getElementById('instructions-screen');
const trackingIndicator = document.getElementById('tracking-indicator');

// Get A-Frame scene
const sceneEl = document.querySelector('a-scene');

// Wait for scene to load
sceneEl.addEventListener('loaded', () => {
  console.log('A-Frame scene loaded');

  // Get AR system
  const arSystem = sceneEl.systems['mindar-image-system'];

  // Hide loading, show instructions
  setTimeout(() => {
    loadingScreen.classList.remove('active');
    instructionsScreen.classList.add('active');
  }, 500);

  // Start AR after a delay to ensure imageTargetSrc is set
  setTimeout(() => {
    console.log('Starting MindAR...');
    arSystem.start();
    instructionsScreen.classList.remove('active');
  }, 2000);
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
