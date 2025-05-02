/**
 * Reset Service Worker
 * 
 * This script unregisters all service workers and clears caches
 * to recover from a broken state.
 */
(function() {
  // Only run on load
  window.addEventListener('load', async function() {
    console.log('Running service worker reset script...');
    
    try {
      // Unregister all service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        console.log(`Found ${registrations.length} service worker registrations`);
        
        for (const registration of registrations) {
          const unregistered = await registration.unregister();
          console.log(`Unregistered service worker: ${unregistered}`);
        }
      }
      
      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        console.log(`Found ${cacheNames.length} caches`);
        
        await Promise.all(
          cacheNames.map(async name => {
            const deleted = await caches.delete(name);
            console.log(`Deleted cache ${name}: ${deleted}`);
            return deleted;
          })
        );
      }
      
      console.log('Service worker reset complete. Reloading page in 1 second...');
      
      // Show message to user
      const message = document.createElement('div');
      message.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #2E3766;
        color: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        text-align: center;
        font-family: sans-serif;
        max-width: 320px;
        z-index: 9999;
      `;
      message.innerHTML = `
        <h3 style="margin-top:0">Reset Complete</h3>
        <p>All service workers have been unregistered and caches cleared.</p>
        <p>Page will reload automatically in 1 second...</p>
      `;
      document.body.appendChild(message);
      
      // Reload the page after a delay
      setTimeout(() => {
        window.location.href = '/?reset=true';
      }, 1000);
    } catch (error) {
      console.error('Error during reset:', error);
      alert(`Error during reset: ${error.message}`);
    }
  });
})(); 