const CACHE_NAME = 'food-pantry-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/pwa-512x512.png'
];

// Debug logging
const debug = (...args) => {
  console.log('[ServiceWorker]', ...args);
};

// Check if a request should be handled by the service worker
const shouldHandleRequest = (request) => {
  const url = new URL(request.url);
  
  // Skip development-specific requests
  if (url.pathname.startsWith('/@') ||          // Vite internal requests
      url.pathname.includes('/@react-refresh') ||
      url.pathname.includes('/@vite') ||
      url.pathname.endsWith('.tsx') ||          // Source files
      url.pathname.endsWith('.ts') ||
      url.pathname.includes('hot-update') ||    // HMR updates
      url.pathname.includes('ws') ||            // WebSocket
      url.hostname.includes('localhost:5173') || // Dev server
      url.hostname.includes('localhost:5174') || // Dev server alternate port
      url.pathname.includes('supabase')) {      // Supabase requests
    return false;
  }

  return true;
};

// Install event - cache static assets
self.addEventListener('install', event => {
  debug('Installing Service Worker');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        debug('Caching static assets');
        return cache.addAll(STATIC_ASSETS).catch(error => {
          debug('Failed to cache some assets:', error);
          // Continue even if some assets fail to cache
          return Promise.resolve();
        });
      })
      .catch(error => {
        debug('Error during installation:', error);
      })
  );
  // Activate worker immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  debug('Activating Service Worker');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            debug('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Ensure service worker takes control immediately
  self.clients.claim();
});

// Fetch event handler
self.addEventListener('fetch', event => {
  // Only handle GET requests that pass our filter
  if (event.request.method !== 'GET' || !shouldHandleRequest(event.request)) {
    debug('Skipping non-GET or development request:', event.request.url);
    return;
  }

  // Check if request is for a static asset
  const isStaticAsset = STATIC_ASSETS.some(asset => 
    event.request.url.endsWith(asset)
  );

  debug('Handling fetch for:', event.request.url, isStaticAsset ? '(static asset)' : '');

  event.respondWith(
    (async () => {
      try {
        // For static assets, try cache first
        if (isStaticAsset) {
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) {
            debug('Serving from cache:', event.request.url);
            return cachedResponse;
          }
        }

        // Network request
        debug('Fetching from network:', event.request.url);
        const response = await fetch(event.request);
        
        // Cache successful GET responses
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, response.clone());
          debug('Cached response for:', event.request.url);
        }
        
        return response;
      } catch (error) {
        debug('Fetch failed for:', event.request.url, error);
        
        // Check cache
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          debug('Serving from cache after fetch failure:', event.request.url);
          return cachedResponse;
        }

        // Return basic offline page for document requests
        if (event.request.mode === 'navigate') {
          debug('Serving offline page for navigation request');
          return new Response(
            `<!DOCTYPE html>
            <html>
              <head>
                <title>Offline - St. Trinity Food Pantry</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                  body { font-family: sans-serif; padding: 20px; text-align: center; }
                  h1 { color: #2E3766; }
                </style>
              </head>
              <body>
                <h1>You're Offline</h1>
                <p>Please check your internet connection and try again.</p>
              </body>
            </html>`,
            {
              headers: { 'Content-Type': 'text/html' }
            }
          );
        }

        // Return error response for other requests
        return new Response('Network error occurred', {
          status: 408,
          headers: { 'Content-Type': 'text/plain' }
        });
      }
    })()
  );
}); 