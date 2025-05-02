/**
 * Service Worker Injector
 * 
 * Ensures the service worker is properly registered and handles console suppression
 * early, before the application starts loading
 */
(function() {
  // Known patterns to suppress in console
  const suppressPatterns = [
    'Precaching did not find a match for',
    'No route found for',
    'workbox',
    '/@vite/client',
    '/@react-refresh',
    '/src/main.tsx',
    '/src/registerSW.ts',
    '/@vite-plugin-pwa',
    '/manifest.json'
  ];
  
  // Create a function to check if a message matches any of our patterns
  function shouldSuppressMessage(message) {
    if (typeof message !== 'string') return false;
    return suppressPatterns.some(pattern => message.includes(pattern));
  }
  
  // Helper function to create a message filter
  function createMessageFilter(originalFn) {
    return function(...args) {
      // Join the arguments to check if any of them include our patterns
      const message = args.join(' ');
      if (shouldSuppressMessage(message)) {
        // Skip this message
        return;
      }
      // Call the original function
      return originalFn.apply(console, args);
    };
  }
  
  // Override console methods as early as possible
  if (window.console) {
    // Save original methods
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalLog = console.log;
    
    // Replace with filtered versions
    console.error = createMessageFilter(originalError);
    console.warn = createMessageFilter(originalWarn);
    
    // Also monitor logs for specific patterns
    console.log = function(...args) {
      const message = args.join(' ');
      if (args.length > 0 && 
          typeof args[0] === 'string' && 
          args[0].includes('workbox') && 
          shouldSuppressMessage(message)) {
        // Skip workbox logs
        return;
      }
      return originalLog.apply(console, args);
    };
  }
  
  // Register the pre-service worker as early as possible
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/pre-sw.js', {
        scope: '/'
      }).then(function() {
        // Successfully registered pre-service worker
      }).catch(function(error) {
        // Only log errors that aren't related to our suppression patterns
        if (!shouldSuppressMessage(error.message)) {
          console.error('Pre-service worker registration failed:', error);
        }
      });
    });
  }
})(); 