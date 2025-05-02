const CACHE_NAME = 'food-pantry-cache-v4';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/offline.html',
  '/app-loader.js',
  '/sw-injector.js',
  '/assets/index-s3V4GORz.js',
  '/assets/vendor-Db_gg_cT.js',
  '/assets/ui-BjqvvWFt.js',
  '/assets/browser-B1cOgO3g.js',
  '/assets/index-C_jsmz29.css'
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
      url.hostname.includes('localhost:5173')) { // Dev server
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
        // Add index.html explicitly with no cache-busting for offline fallback
        cache.add(new Request('/index.html', { cache: 'reload' }));
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
    .then(() => {
      // Ensure service worker takes control immediately
      debug('Service worker claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event handler
self.addEventListener('fetch', event => {
  // Only handle GET requests that should be handled
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);
  
  // Skip handling of development server requests
  if (!shouldHandleRequest(event.request)) {
    debug('Skipping development request:', event.request.url);
    return;
  }

  // Handle navigation requests differently (pages)
  if (event.request.mode === 'navigate') {
    debug('Handling navigation request:', url.pathname);
    event.respondWith(
      // Try network first, fallback to cache, then to /index.html
      fetch(event.request)
        .then(response => {
          // Cache successful navigation response
          if (response.ok) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                debug('Caching navigation response for:', url.pathname);
                cache.put(event.request, responseToCache);
              });
          }
          return response;
        })
        .catch(error => {
          debug('Navigation fetch failed, trying cache:', error);
          
          return caches.match(event.request)
            .then(cachedResponse => {
              if (cachedResponse) {
                debug('Serving navigation from cache:', url.pathname);
                return cachedResponse;
              }
              
              // If we don't have the specific page, try index.html
              debug('No cached page, trying index.html as fallback');
              return caches.match('/index.html')
                .then(indexResponse => {
                  if (indexResponse) {
                    return indexResponse;
                  }
                  
                  // Last resort - basic offline page
                  return new Response(
                    `<!DOCTYPE html>
                    <html>
                      <head>
                        <title>Offline - Food Pantry App</title>
                        <meta name="viewport" content="width=device-width, initial-scale=1">
                        <style>
                          body { font-family: sans-serif; padding: 20px; text-align: center; }
                          h1 { color: #2E3766; }
                        </style>
                      </head>
                      <body>
                        <h1>You're Offline</h1>
                        <p>The Food Pantry app can't be loaded right now. Please check your connection.</p>
                        <button onclick="window.location.reload()">Try Again</button>
                      </body>
                    </html>`,
                    { headers: { 'Content-Type': 'text/html' } }
                  );
                });
            });
        })
    );
    return;
  }
  
  // Special handling for JS and CSS assets - cache first for faster loads
  if (url.pathname.endsWith('.js') || 
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.html')) {
    
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            // Return the cached version first (cache-first strategy for assets)
            debug('Serving asset from cache:', event.request.url);
            
            // In the background, try to update the cache
            fetch(event.request)
              .then(response => {
                if (response.ok) {
                  caches.open(CACHE_NAME)
                    .then(cache => cache.put(event.request, response));
                }
              })
              .catch(err => debug('Background fetch failed:', err));
              
            return cachedResponse;
          }
          
          // If not in cache, try network
          return fetch(event.request)
            .then(response => {
              // Cache the response for future
              if (response.ok) {
                const responseToCache = response.clone();
                caches.open(CACHE_NAME)
                  .then(cache => cache.put(event.request, responseToCache));
              }
              return response;
            })
            .catch(error => {
              debug('Asset fetch failed:', error);
              return new Response('Network error occurred', { 
                status: 408, 
                headers: { 'Content-Type': 'text/plain' } 
              });
            });
        })
    );
    return;
  }
  
  // For other resources (images, API calls, etc.), use network-first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        
        // Cache successful responses
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseToCache);
            debug('Cached network response for:', event.request.url);
          });
        
        return response;
      })
      .catch(error => {
        debug('Fetch failed, checking cache:', event.request.url, error);
        
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              debug('Serving from cache after network failure:', event.request.url);
              return cachedResponse;
            }
            
            // For API requests that fail and aren't cached
            if (url.pathname.includes('/api/') || url.hostname.includes('supabase')) {
              return new Response(JSON.stringify({ error: 'You are offline' }), {
                headers: { 'Content-Type': 'application/json' }
              });
            }
            
            // For other resources like images
            return new Response('Resource unavailable while offline', {
              status: 503,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
}); 