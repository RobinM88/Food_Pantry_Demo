/**
 * Custom script to handle Workbox errors that might appear in the console.
 * This is loaded before the main application to ensure errors are suppressed
 * as early as possible.
 */
(function() {
  // Don't do anything in production mode
  if (window.location.hostname !== 'localhost' && 
      !window.location.hostname.includes('127.0.0.1')) {
    return;
  }
  
  // Save original console methods
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;
  
  // Patterns to suppress
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
  
  // Replace console methods
  console.warn = function(...args) {
    // Join the arguments into a string for pattern matching
    const message = args.join(' ');
    
    // Check if any suppress pattern is in the message
    if (suppressPatterns.some(pattern => message.includes(pattern))) {
      // Skip logging this warning
      return;
    }
    
    // Pass through to original console.warn for non-suppressed warnings
    originalConsoleWarn.apply(console, args);
  };
  
  console.error = function(...args) {
    // Join the arguments into a string for pattern matching
    const message = args.join(' ');
    
    // Check if any suppress pattern is in the message
    if (suppressPatterns.some(pattern => message.includes(pattern))) {
      // Skip logging this error
      return;
    }
    
    // Pass through to original console.error for non-suppressed errors
    originalConsoleError.apply(console, args);
  };
  
  console.log('🔧 Development-only Workbox warnings are being suppressed by custom.js');
})(); 