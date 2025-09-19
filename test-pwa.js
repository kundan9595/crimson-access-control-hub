// Simple PWA test script
console.log('🔍 Testing PWA functionality...');

// Test 1: Check if manifest exists
fetch('/manifest.webmanifest')
  .then(response => {
    if (response.ok) {
      console.log('✅ Manifest file exists');
      return response.json();
    } else {
      throw new Error('Manifest not found');
    }
  })
  .then(manifest => {
    console.log('📋 Manifest details:', manifest);
    console.log(`✅ App Name: ${manifest.name}`);
    console.log(`✅ Short Name: ${manifest.short_name}`);
    console.log(`✅ Theme Color: ${manifest.theme_color}`);
    console.log(`✅ Display Mode: ${manifest.display}`);
    console.log(`✅ Icons: ${manifest.icons.length} icon(s) defined`);
  })
  .catch(error => {
    console.error('❌ Manifest error:', error);
  });

// Test 2: Check if service worker is available
if ('serviceWorker' in navigator) {
  console.log('✅ Service Worker API available');
  
  navigator.serviceWorker.getRegistration()
    .then(registration => {
      if (registration) {
        console.log('✅ Service Worker registered:', registration.scope);
        console.log('✅ Service Worker state:', registration.active?.state);
      } else {
        console.log('⚠️ Service Worker not registered yet');
      }
    })
    .catch(error => {
      console.error('❌ Service Worker error:', error);
    });
} else {
  console.log('❌ Service Worker not supported');
}

// Test 3: Check if app is installable
if ('BeforeInstallPromptEvent' in window) {
  console.log('✅ Install prompt API available');
} else {
  console.log('⚠️ Install prompt API not available (may still work)');
}

// Test 4: Check if running in standalone mode
const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
const isInWebAppiOS = (window.navigator).standalone === true;

if (isStandalone || isInWebAppiOS) {
  console.log('✅ App is running in standalone mode (installed as PWA)');
} else {
  console.log('ℹ️ App is running in browser mode (not installed yet)');
}

// Test 5: Check online status
console.log(`🌐 Online status: ${navigator.onLine ? 'Online' : 'Offline'}`);

// Test 6: Check if icons exist
const iconTests = [
  '/favicon.ico',
  '/icon.svg'
];

iconTests.forEach(iconPath => {
  fetch(iconPath)
    .then(response => {
      if (response.ok) {
        console.log(`✅ Icon exists: ${iconPath}`);
      } else {
        console.log(`❌ Icon missing: ${iconPath}`);
      }
    })
    .catch(error => {
      console.log(`❌ Icon error: ${iconPath}`, error);
    });
});

console.log('🎉 PWA test complete! Check the results above.');
