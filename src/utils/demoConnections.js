// This file adds demo connected family data to IndexedDB
// Run this in the browser console when needed

(async function addDemoConnectedFamilies() {
  try {
    // Use the existing IndexedDB API from the app
    const db = window.db || window.appDB;
    
    if (!db) {
      console.error('Could not find IndexedDB API. Make sure this script runs after the app loads.');
      return;
    }
    
    // Demo connection groups with consistent IDs
    const demoConnections = [
      // Group 1: John Smith and Jane Doe
      {
        id: 'demo-conn-1001',
        family_number: 'f1001',
        connected_family_number: 'cf000001',
        relationship_type: 'parent',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'demo-conn-1002',
        family_number: 'f1002',
        connected_family_number: 'cf000001',
        relationship_type: 'child',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      // Group 2: Robert Johnson and Mary Williams
      {
        id: 'demo-conn-1003',
        family_number: 'f1003',
        connected_family_number: 'cf000002',
        relationship_type: 'spouse',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'demo-conn-1004',
        family_number: 'f1004',
        connected_family_number: 'cf000002',
        relationship_type: 'spouse',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    console.log('Adding demo connected families data...');
    
    // Define the store name (might be different in your app)
    const STORE_NAME = 'connectedFamilies';
    
    // Try different methods to add the data
    // Method 1: Using app's db API
    if (typeof db.put === 'function') {
      for (const conn of demoConnections) {
        await db.put(STORE_NAME, conn, true);
        console.log(`Added demo connection: ${conn.id}`);
      }
    }
    // Method 2: Direct IndexedDB access
    else {
      // Open connection to the database
      const dbRequest = indexedDB.open('food-pantry-db', 1);
      
      dbRequest.onsuccess = function(event) {
        const db = event.target.result;
        
        // Check if store exists
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          console.error(`Store ${STORE_NAME} does not exist`);
          return;
        }
        
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        for (const conn of demoConnections) {
          store.put(conn);
          console.log(`Added demo connection: ${conn.id}`);
        }
        
        transaction.oncomplete = function() {
          console.log('All demo connections added');
        };
        
        transaction.onerror = function(error) {
          console.error('Transaction error:', error);
        };
      };
      
      dbRequest.onerror = function(event) {
        console.error('Database error:', event.target.error);
      };
    }
    
    console.log('Demo data setup completed!');
  } catch (error) {
    console.error('Error adding demo connected families data:', error);
  }
})(); 