/**
 * Service Worker Registration
 * 
 * This file handles service worker registration for the application.
 * Currently, service workers are DISABLED to prevent further issues.
 */

// Check URL parameters to see if we should enable service workers
const urlParams = new URLSearchParams(window.location.search);
const noServiceWorker = urlParams.get('noserviceworker') === 'true';
const forceEnable = urlParams.get('enable_sw') === 'true';

// By default, disable service workers unless explicitly enabled
if (forceEnable && 'serviceWorker' in navigator) {
  console.log('Service workers are ENABLED because enable_sw=true was passed in URL');
  
  window.addEventListener('load', async () => {
    try {
      console.log('Registering service worker...');
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('Service worker registered successfully:', registration.scope);
    } catch (error) {
      console.error('Service worker registration failed:', error);
    }
  });
} else {
  console.log('Service workers are DISABLED to prevent issues');
  
  // Unregister any existing service workers
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
          console.log('Service worker unregistered');
        }
      } catch (error) {
        console.error('Error unregistering service worker:', error);
      }
    });
  }
} 