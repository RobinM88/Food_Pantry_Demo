// Basic service worker for offline support
self.__WB_MANIFEST = self.__WB_MANIFEST || [];

// URLs to cache on install
const urlsToCache = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Cache names
const CACHE_NAME = 'food-pantry-cache-v1';

// Check for demo mode
const isDemoMode = self.location.search.includes('demo=true') || 
                  (caches.match('demo-flag').then(r => !!r).catch(() => false));

// Installation
self.addEventListener('install', event => {
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Activation
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

// Fetch handler
self.addEventListener('fetch', event => {
  // Ignore non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Ignore problematic development paths
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/@') || 
      url.pathname.startsWith('/src/') || 
      url.pathname.includes('react-refresh')) {
    return;
  }
  
  // In demo mode, block requests to example.com and other real APIs
  if (isDemoMode && (
    url.hostname === 'example.com' || 
    url.hostname.endsWith('.supabase.co') ||
    url.pathname.includes('/api/')
  )) {
    event.respondWith(
      new Response(JSON.stringify({ error: 'Demo mode - No external API requests' }), {
        headers: { 'Content-Type': 'application/json' }
      })
    );
    return;
  }
  
  // Navigation requests - network first with cache fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(event.request)
            .then(response => {
              if (response) {
                return response;
              }
              return caches.match('/offline.html');
            });
        })
    );
    return;
  }
  
  // Static assets - cache first with network fallback
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        
        return fetch(event.request)
          .then(response => {
            // Don't cache responses that aren't successful
            if (!response || response.status !== 200) {
              return response;
            }
            
            // Clone the response before caching
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
              
            return response;
          })
          .catch(error => {
            // Return error response
            console.error('Fetch failed:', error);
            return new Response('Network error', { status: 408 });
          });
      })
  );
});

// Message handler
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
}); 