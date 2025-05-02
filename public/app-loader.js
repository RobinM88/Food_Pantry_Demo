/**
 * Simple loader script to diagnose browser issues
 */

(function() {
  console.log('App loader script running');

  // Create a status display 
  function createStatusDisplay() {
    const container = document.createElement('div');
    container.id = 'loader-status';
    container.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 10px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
      max-width: 300px;
      z-index: 10000;
    `;
    document.body.appendChild(container);
    return container;
  }

  // Add status message
  function logStatus(message) {
    console.log(message);
    let container = document.getElementById('loader-status');
    if (!container) {
      container = createStatusDisplay();
    }
    const line = document.createElement('div');
    line.textContent = message;
    line.style.borderBottom = '1px solid rgba(255,255,255,0.2)';
    line.style.paddingBottom = '5px';
    line.style.marginBottom = '5px';
    container.appendChild(line);
  }

  // Try to detect browser issues
  function checkBrowserCompatibility() {
    logStatus('Checking browser compatibility...');
    
    // Check for basic ES6 support
    try {
      // Check arrow functions
      eval('() => {}');
      logStatus('✓ ES6 arrow functions supported');
    } catch (e) {
      logStatus('✗ ES6 arrow functions NOT supported');
    }
    
    // Check for fetch API
    if (window.fetch) {
      logStatus('✓ Fetch API supported');
    } else {
      logStatus('✗ Fetch API NOT supported');
    }
    
    // Check for localStorage
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      logStatus('✓ LocalStorage supported');
    } catch (e) {
      logStatus('✗ LocalStorage NOT supported');
    }
    
    // Check for service worker support
    if ('serviceWorker' in navigator) {
      logStatus('✓ Service Worker API supported');
    } else {
      logStatus('✗ Service Worker API NOT supported');
    }
  }

  // Create fallback UI if React doesn't load in 5 seconds
  function createFallbackUI() {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      logStatus('Root element not found!');
      return;
    }
    
    logStatus('Creating fallback UI');
    
    // Create a simple UI to help diagnose issues
    rootElement.innerHTML = `
      <div style="padding: 20px; margin: 20px auto; max-width: 800px; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
        <h1 style="color: #2E3766;">Food Pantry Application</h1>
        <div style="background-color: #f5f5f5; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2>Application Status</h2>
          <p>The React application is not loading correctly. This could be due to:</p>
          <ul>
            <li>JavaScript errors</li>
            <li>Missing or corrupt resources</li>
            <li>Service worker conflicts</li>
            <li>Browser incompatibility</li>
          </ul>
        </div>
        
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <a href="/reset.html" style="
            background-color: #2E3766;
            color: white;
            text-decoration: none;
            padding: 10px 15px;
            border-radius: 4px;
            display: inline-block;
          ">Reset Application</a>
          
          <a href="/debug.html" style="
            background-color: #4CAF50;
            color: white;
            text-decoration: none;
            padding: 10px 15px;
            border-radius: 4px;
            display: inline-block;
          ">Debug Tools</a>
          
          <a href="/test-page.html" style="
            background-color: #607D8B;
            color: white;
            text-decoration: none;
            padding: 10px 15px;
            border-radius: 4px;
            display: inline-block;
          ">Test Page</a>
          
          <button id="reloadBtn" style="
            background-color: #FF5722;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 4px;
            cursor: pointer;
          ">Reload Page</button>
        </div>
      </div>
    `;
    
    // Add reload button handler
    document.getElementById('reloadBtn').addEventListener('click', () => {
      window.location.reload();
    });
  }

  // Check if the application is loading
  function checkAppLoading() {
    logStatus('Checking if app is loading...');
    
    // If React hasn't rendered anything in 5 seconds, show fallback UI
    setTimeout(() => {
      const rootElement = document.getElementById('root');
      if (rootElement && rootElement.childNodes.length === 0) {
        logStatus('⚠️ React not rendering after 5 seconds');
        createFallbackUI();
      } else {
        logStatus('✓ Content is rendering');
      }
    }, 5000);
  }

  // Check for browser errors
  window.addEventListener('error', (event) => {
    logStatus(`Error: ${event.message} at ${event.filename}:${event.lineno}`);
  });

  // Start checks
  window.addEventListener('DOMContentLoaded', () => {
    logStatus('DOMContentLoaded event fired');
    checkBrowserCompatibility();
    checkAppLoading();
  });

  // Report that this script loaded
  logStatus('Loader script initialized');
})(); 