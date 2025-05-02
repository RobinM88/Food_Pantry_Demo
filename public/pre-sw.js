/**
 * Pre-Service Worker
 * 
 * This service worker runs before the main one and handles
 * problematic routes that might cause console errors
 */

// List of development-only routes to handle specially
const DEV_ROUTES = [
  '/src/main.tsx',
  '/src/registerSW.ts',
  '/@react-refresh',
  '/@vite/client',
  '/@vite-plugin-pwa/pwa-entry-point-loaded',
  '/manifest.json'
];

// Install event - cache basic resources
self.addEventListener('install', event => {
  self.skipWaiting(); // Activate immediately
  
  // Create empty responses for development routes
  event.waitUntil(
    caches.open('pre-sw-cache').then(cache => {
      // Create empty responses for each dev route
      return Promise.all(
        DEV_ROUTES.map(route => {
          const response = new Response('', {
            status: 200, 
            headers: { 'Content-Type': 'application/javascript' }
          });
          return cache.put(route, response);
        })
      );
    })
  );
});

// Activate event - claim clients immediately
self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

// Fetch event - handle problematic routes
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Only intercept specific problematic paths
  if (DEV_ROUTES.includes(url.pathname) || 
      url.pathname.startsWith('/@fs/') || 
      url.pathname.startsWith('/@id/')) {
    
    event.respondWith(
      // Try to get from cache first
      caches.match(url.pathname)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // If not in cache, create an empty response
          return new Response('', {
            status: 200,
            headers: { 'Content-Type': 'application/javascript' }
          });
        })
    );
    return;
  }
  
  // For all other requests, proceed normally
  // This lets the main service worker handle them
}); 