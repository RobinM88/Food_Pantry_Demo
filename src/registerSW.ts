// Only register service worker in production
if (import.meta.env?.MODE === 'production' && 'serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // First, try to unregister any existing service workers
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (let registration of registrations) {
        await registration.unregister();
      }

      // Then register the new service worker
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });
      console.log('ServiceWorker registration successful with scope:', registration.scope);
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('Service Worker update found!');
        newWorker?.addEventListener('statechange', () => {
          console.log('Service Worker state:', newWorker.state);
        });
      });
    } catch (error) {
      console.error('ServiceWorker registration failed:', error);
    }
  });

  // Handle controller change
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('Service Worker controller changed');
  });
} else {
  // In development, unregister any existing service workers
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      for (let registration of registrations) {
        registration.unregister();
      }
      console.log('Development mode: Service Workers unregistered');
    });
  }
} 