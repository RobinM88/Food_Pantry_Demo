/**
 * Offline Test Utility
 * 
 * This script helps test and debug the offline functionality of the application.
 * It provides tools to check cache status and simulate offline conditions.
 */

// Self-invoking function to avoid polluting global scope
(function() {
  // Create a simple debug UI if in development mode
  if (window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1')) {
    window.addEventListener('load', () => {
      // Create debug tools container
      const debugTools = document.createElement('div');
      debugTools.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px;
        border-radius: 5px;
        font-family: monospace;
        font-size: 12px;
        z-index: 9999;
        display: none;
      `;
      
      // Create toggle button
      const toggleButton = document.createElement('button');
      toggleButton.textContent = '🔧 Debug';
      toggleButton.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        background: #2E3766;
        color: white;
        border: none;
        padding: 5px 10px;
        border-radius: 5px;
        z-index: 10000;
        cursor: pointer;
      `;
      
      // Create debug tools content
      const content = document.createElement('div');
      debugTools.appendChild(content);
      
      // Append elements to body
      document.body.appendChild(debugTools);
      document.body.appendChild(toggleButton);
      
      // Toggle debug panel on click
      toggleButton.addEventListener('click', () => {
        if (debugTools.style.display === 'none') {
          debugTools.style.display = 'block';
          toggleButton.textContent = '❌ Close';
          updateDebugInfo();
        } else {
          debugTools.style.display = 'none';
          toggleButton.textContent = '🔧 Debug';
        }
      });
      
      // Function to update debug info
      async function updateDebugInfo() {
        if (debugTools.style.display === 'none') return;
        
        content.innerHTML = `
          <h4 style="margin:0 0 10px 0">Offline Debug Tools</h4>
          <div>Online status: ${navigator.onLine ? '🟢 Online' : '🔴 Offline'}</div>
          <div>Service Worker: ${navigator.serviceWorker.controller ? '✅ Active' : '❌ Not controlling page'}</div>
          <div style="margin-top:10px">
            <button id="debugClearCache">Clear Cache</button>
            <button id="debugReloadSW">Reload SW</button>
            <button id="debugSimOffline">Simulate Offline</button>
          </div>
          <div style="margin-top:10px">Cache Status:</div>
          <div id="cacheStatus">Loading...</div>
        `;
        
        // Add event listeners
        document.getElementById('debugClearCache').addEventListener('click', clearCaches);
        document.getElementById('debugReloadSW').addEventListener('click', reloadServiceWorker);
        document.getElementById('debugSimOffline').addEventListener('click', toggleOfflineSimulation);
        
        // Check cache status
        checkCacheStatus();
      }
      
      // Function to check cache status
      async function checkCacheStatus() {
        const statusElement = document.getElementById('cacheStatus');
        if (!statusElement) return;
        
        if (!('caches' in window)) {
          statusElement.textContent = 'Cache API not supported';
          return;
        }
        
        try {
          const cacheNames = await window.caches.keys();
          if (cacheNames.length === 0) {
            statusElement.textContent = 'No caches found';
            return;
          }
          
          let status = '';
          for (const cacheName of cacheNames) {
            const cache = await window.caches.open(cacheName);
            const keys = await cache.keys();
            status += `<div>${cacheName}: ${keys.length} items</div>`;
          }
          statusElement.innerHTML = status;
        } catch (error) {
          statusElement.textContent = `Error: ${error.message}`;
        }
      }
      
      // Function to clear all caches
      async function clearCaches() {
        try {
          const cacheNames = await window.caches.keys();
          await Promise.all(cacheNames.map(name => window.caches.delete(name)));
          alert('All caches cleared successfully');
          checkCacheStatus();
        } catch (error) {
          alert(`Error clearing caches: ${error.message}`);
        }
      }
      
      // Function to reload service worker
      async function reloadServiceWorker() {
        try {
          if (!navigator.serviceWorker.controller) {
            alert('No active service worker found');
            return;
          }
          
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map(reg => reg.update()));
          alert('Service worker update requested. Reloading page...');
          setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
          alert(`Error reloading service worker: ${error.message}`);
        }
      }
      
      // Simulate going offline
      function toggleOfflineSimulation() {
        const button = document.getElementById('debugSimOffline');
        if (!button) return;
        
        // Check if we're already simulating offline
        if (button.textContent.includes('Stop Simulation')) {
          // Turn off the simulation
          window.dispatchEvent(new Event('online'));
          button.textContent = 'Simulate Offline';
          alert('Offline simulation stopped');
        } else {
          // Start the simulation
          window.dispatchEvent(new Event('offline'));
          button.textContent = 'Stop Simulation';
          alert('Offline simulation started (network requests will still go through, but the app will think it\'s offline)');
        }
      }
      
      // Update info on online/offline changes
      window.addEventListener('online', updateDebugInfo);
      window.addEventListener('offline', updateDebugInfo);
    });
  }
  
  // Listen for service worker lifecycle events
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('Service Worker controller changed, page will reload');
      window.location.reload();
    });
    
    // Check if we need to claim clients
    if (navigator.serviceWorker.controller === null) {
      navigator.serviceWorker.ready.then(registration => {
        if (registration.active) {
          registration.active.postMessage({ type: 'CLAIM_CLIENTS' });
        }
      });
    }
  }
  
  // Monitor the offline status
  function handleOfflineStatus() {
    if (navigator.onLine) {
      document.documentElement.classList.remove('offline-mode');
    } else {
      document.documentElement.classList.add('offline-mode');
    }
  }
  
  // Set initial status
  handleOfflineStatus();
  
  // Listen for connectivity changes
  window.addEventListener('online', handleOfflineStatus);
  window.addEventListener('offline', handleOfflineStatus);
})(); 