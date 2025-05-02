/**
 * Service Worker Utilities
 * 
 * Utility functions for handling service worker related functionality
 */

/**
 * Suppresses specific Workbox console errors to avoid cluttering the console
 * during development mode
 */
export function suppressWorkboxWarnings() {
  if (!('console' in window)) return;
  
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;
  
  // Known patterns to suppress
  const suppressPatterns = [
    'Precaching did not find a match for',
    'No route found for',
    'workbox.precaching',
    '/@vite/client',
    '/@react-refresh',
    '/src/main.tsx',
    '/src/registerSW.ts',
    '/@vite-plugin-pwa',
    '/manifest.json'
  ];
  
  // Replace console.warn and console.error with filtered versions
  console.warn = function(...args) {
    const errorString = args.join(' ');
    if (suppressPatterns.some(pattern => errorString.includes(pattern))) {
      // Suppress the warning
      return;
    }
    originalConsoleWarn.apply(console, args);
  };
  
  console.error = function(...args) {
    const errorString = args.join(' ');
    if (suppressPatterns.some(pattern => errorString.includes(pattern))) {
      // Suppress the error
      return;
    }
    originalConsoleError.apply(console, args);
  };
  
  // Log once that warnings are being suppressed
  console.log('🔧 Development-only service worker warnings are being suppressed');
}

/**
 * Registers additional handlers for development-only routes
 * Call this during development to handle routes that might cause console warnings
 */
export function registerDevRouteHandlers() {
  if (!('serviceWorker' in navigator)) return;
  
  // We only need this in development mode
  if (import.meta.env.PROD) return;
  
  // Send a message to the service worker to register dev route handlers
  navigator.serviceWorker.ready.then(registration => {
    registration.active?.postMessage({
      type: 'REGISTER_DEV_ROUTES',
      devPaths: [
        '/src/main.tsx',
        '/src/registerSW.ts',
        '/@react-refresh',
        '/@vite/client',
        '/@vite-plugin-pwa/pwa-entry-point-loaded',
        '/manifest.json'
      ]
    });
  }).catch(error => {
    console.log('Failed to register dev route handlers:', error);
  });
} 