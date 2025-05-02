import type { Client } from '../types';
import { api } from './api';
import { db } from '../lib/indexedDB';
import { config } from '../config';

export const ClientService = {
  async getAll() {
    // Check network connection first
    const isOnline = navigator.onLine;
    
    // If offline mode is enabled and we're offline, go straight to IndexedDB
    if (config.features.offlineMode && !isOnline) {
      console.log('Device is offline, loading clients from IndexedDB...');
      try {
        const cachedClients = await db.getAll<Client>('clients');
        console.log(`Loaded ${cachedClients.length} clients from IndexedDB while offline`);
        
        // Make sure any offline-created clients have the created_offline flag
        return cachedClients.map(client => {
          if (client && typeof client === 'object' && 'id' in client && 
              !('created_offline' in client) && 
              typeof client.id === 'string' && 
              /^[0-9a-f]{8}-[0-9a-f]{4}/.test(client.id)) {
            return { ...client, created_offline: true } as Client;
          }
          return client;
        });
      } catch (dbError) {
        console.error('Failed to fetch clients from IndexedDB while offline:', dbError);
        throw new Error('Unable to load clients while offline. IndexedDB access failed.');
      }
    }
    
    // If we're online, try the API first
    try {
      if (!isOnline) {
        throw new Error('Device is offline, but offline mode is disabled');
      }
      
      console.log('Fetching clients from API...');
      const clients = await api.clients.getAll();
      console.log(`Successfully fetched ${clients.length} clients from API`);
      
      // If offline mode is enabled, cache the results
      if (config.features.offlineMode) {
        try {
          // Store each client in IndexedDB
          for (const client of clients) {
            await db.put('clients', client, true); // Skip sync for server-fetched data
          }
          console.log('Successfully cached clients in IndexedDB');
        } catch (err) {
          console.warn('Failed to cache clients in IndexedDB:', err);
        }
      }
      
      return clients;
    } catch (error) {
      console.error('Error fetching clients from API:', error);
      
      // If offline mode is enabled, try to get from IndexedDB as fallback
      if (config.features.offlineMode) {
        console.log('Falling back to IndexedDB for clients...');
        try {
          const cachedClients = await db.getAll<Client>('clients');
          console.log(`Loaded ${cachedClients.length} clients from IndexedDB as fallback`);
          
          // Make sure any offline-created clients have the created_offline flag
          const processedClients = cachedClients.map(client => {
            if (client && typeof client === 'object' && 'id' in client && 
                !('created_offline' in client) && 
                typeof client.id === 'string' && 
                /^[0-9a-f]{8}-[0-9a-f]{4}/.test(client.id)) {
              return { ...client, created_offline: true } as Client;
            }
            return client;
          });
          
          return processedClients;
        } catch (dbError) {
          console.error('Failed to fetch clients from IndexedDB as fallback:', dbError);
        }
      }
      
      // Re-throw original error if we couldn't get from IndexedDB
      throw error;
    }
  },

  async getById(id: string) {
    // Check network connection first
    const isOnline = navigator.onLine;
    
    // If offline mode is enabled and we're offline, go straight to IndexedDB
    if (config.features.offlineMode && !isOnline) {
      try {
        const cachedClient = await db.get<Client>('clients', id);
        if (cachedClient) {
          console.log(`Loaded client ${id} from IndexedDB while offline`);
          return cachedClient;
        }
        throw new Error(`Client ${id} not found in offline storage`);
      } catch (dbError) {
        console.error(`Failed to fetch client ${id} from IndexedDB while offline:`, dbError);
        throw new Error(`Unable to load client ${id} while offline`);
      }
    }

    try {
      if (!isOnline) {
        throw new Error('Device is offline, but offline mode is disabled');
      }
      
      const client = await api.clients.getById(id);
      
      // Cache in IndexedDB if offline mode is enabled
      if (config.features.offlineMode) {
        await db.put('clients', client, true);
      }
      
      return client;
    } catch (error) {
      // If offline mode is enabled, try to get from IndexedDB
      if (config.features.offlineMode) {
        try {
          const cachedClient = await db.get<Client>('clients', id);
          if (cachedClient) return cachedClient;
        } catch (dbError) {
          console.error('Failed to fetch client from IndexedDB:', dbError);
        }
      }
      throw error;
    }
  },

  async create(data: Omit<Client, 'id' | 'created_at' | 'updated_at'>) {
    try {
      // Try to create via API
      return await api.clients.create(data);
    } catch (error) {
      // If offline mode is enabled, store in IndexedDB and sync later
      if (config.features.offlineMode) {
        try {
          const now = new Date().toISOString();
          const clientData = {
            ...data,
            id: crypto.randomUUID(),
            created_at: now,
            updated_at: now,
            created_offline: true, // Mark this client as created offline
            member_status: 'pending' // Ensure it's marked as pending
          };
          
          await db.add('clients', clientData);
          console.log('Client stored in offline queue for later sync:', clientData.id);
          return clientData as unknown as Client;
        } catch (dbError) {
          console.error('Failed to store client in IndexedDB:', dbError);
        }
      }
      throw error;
    }
  },

  async update(id: string, data: Partial<Client>) {
    try {
      // Try to update via API
      return await api.clients.update(id, data);
    } catch (error) {
      // If offline mode is enabled, update in IndexedDB and sync later
      if (config.features.offlineMode) {
        try {
          // Get current client data
          const currentClient = await db.get<Client>('clients', id);
          if (currentClient) {
            const updatedClient = {
              ...currentClient,
              ...data,
              updated_at: new Date().toISOString()
            };
            
            await db.put('clients', updatedClient);
            console.log('Client updated in offline queue for later sync');
            return updatedClient;
          }
        } catch (dbError) {
          console.error('Failed to update client in IndexedDB:', dbError);
        }
      }
      throw error;
    }
  },

  async delete(id: string) {
    try {
      return await api.clients.delete(id);
    } catch (error) {
      // If offline mode is enabled, mark for deletion in sync queue
      if (config.features.offlineMode) {
        try {
          await db.delete('clients', id);
          console.log('Client marked for deletion in offline queue');
          return true;
        } catch (dbError) {
          console.error('Failed to mark client for deletion in IndexedDB:', dbError);
        }
      }
      throw error;
    }
  },

  async getByPhone(phone: string) {
    try {
      return await api.clients.getByPhone(phone);
    } catch (error) {
      // If offline mode is enabled, search in IndexedDB
      if (config.features.offlineMode) {
        try {
          const allClients = await db.getAll<Client>('clients');
          return allClients.filter(c => 
            c.phone1 === phone || c.phone2 === phone
          );
        } catch (dbError) {
          console.error('Failed to search clients by phone in IndexedDB:', dbError);
        }
      }
      throw error;
    }
  },

  async generateFamilyNumber() {
    try {
      const { data: lastClient } = await api.supabase
        .from('Client')
        .select('family_number')
        .order('family_number', { ascending: false })
        .limit(1);

      let nextNumber = 1;
      if (lastClient && lastClient.length > 0) {
        const lastNumber = parseInt(lastClient[0].family_number.substring(1));
        nextNumber = lastNumber + 1;
      }

      return `f${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      // If offline mode is enabled, generate from IndexedDB
      if (config.features.offlineMode) {
        try {
          const clients = await db.getAll<Client>('clients');
          let highestNumber = 0;
          
          clients.forEach(client => {
            if (client.family_number && client.family_number.startsWith('f')) {
              const num = parseInt(client.family_number.substring(1));
              if (!isNaN(num) && num > highestNumber) {
                highestNumber = num;
              }
            }
          });
          
          // Next available number
          let localNextNumber = highestNumber + 1;
          return `f${localNextNumber.toString().padStart(4, '0')}`;
        } catch (dbError) {
          console.error('Failed to generate family number from IndexedDB:', dbError);
          // Fallback to a temporary number with timestamp to ensure uniqueness
          const timestamp = Date.now().toString().slice(-5);
          return `fTMP${timestamp}`;
        }
      }
      throw error;
    }
  },

  async generateConnectedFamilyNumber() {
    try {
      const { data: lastConnection } = await api.supabase
        .from('ConnectedFamily')
        .select('connected_family_number')
        .order('connected_family_number', { ascending: false })
        .limit(1);

      let nextNumber = 1;
      if (lastConnection && lastConnection.length > 0) {
        const lastNumber = parseInt(lastConnection[0].connected_family_number.substring(2));
        nextNumber = lastNumber + 1;
      }

      return `cf${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      // If offline, generate a temporary connected family number with timestamp
      if (config.features.offlineMode) {
        const timestamp = Date.now().toString().slice(-6);
        return `cfTMP${timestamp}`;
      }
      throw error;
    }
  },

  /**
   * Get clients by status (for pending clients view)
   */
  async getByStatus(status: string) {
    try {
      // Try to get from API
      const { data, error } = await api.supabase
        .from('Client')
        .select('*')
        .eq('member_status', status);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching clients by status from API:', error);
      
      // If offline mode is enabled, try to get from IndexedDB
      if (config.features.offlineMode) {
        try {
          console.log(`Attempting to load ${status} clients from IndexedDB...`);
          const allClients = await db.getAll<Client>('clients');
          const filteredClients = allClients.filter((client: any) => client.member_status === status);
          console.log(`Found ${filteredClients.length} ${status} clients in IndexedDB`);
          return filteredClients;
        } catch (dbError) {
          console.error(`Failed to fetch ${status} clients from IndexedDB:`, dbError);
        }
      }
      
      throw error;
    }
  },
  
  /**
   * Debug function to list all clients in IndexedDB
   */
  async debugIndexedDB() {
    if (config.features.offlineMode) {
      return db.debugListAllClients();
    } else {
      console.log('Offline mode is not enabled');
      return [];
    }
  },

  async getByFamilyNumber(familyNumber: string) {
    // Check network connection first
    const isOnline = navigator.onLine;
    
    // If offline mode is enabled and we're offline, go straight to IndexedDB
    if (config.features.offlineMode && !isOnline) {
      try {
        const cachedClients = await db.getAll<Client>('clients');
        const matchingClient = cachedClients.find(client => client.family_number === familyNumber);
        
        if (matchingClient) {
          console.log(`Found client with family number ${familyNumber} in IndexedDB while offline`);
          return matchingClient;
        }
        throw new Error(`Client with family number ${familyNumber} not found in offline storage`);
      } catch (dbError) {
        console.error(`Failed to fetch client with family number ${familyNumber} from IndexedDB while offline:`, dbError);
        throw new Error(`Unable to load client with family number ${familyNumber} while offline`);
      }
    }

    try {
      if (!isOnline) {
        throw new Error('Device is offline, but offline mode is disabled');
      }
      
      const { data, error } = await api.supabase
        .from('Client')
        .select('*')
        .eq('family_number', familyNumber)
        .single();
      
      if (error) throw error;
      
      // Cache in IndexedDB if offline mode is enabled
      if (config.features.offlineMode) {
        await db.put('clients', data, true);
      }
      
      return data;
    } catch (error) {
      // If offline mode is enabled, try to get from IndexedDB
      if (config.features.offlineMode) {
        try {
          const cachedClients = await db.getAll<Client>('clients');
          const matchingClient = cachedClients.find(client => client.family_number === familyNumber);
          
          if (matchingClient) return matchingClient;
        } catch (dbError) {
          console.error(`Failed to fetch client by family number from IndexedDB:`, dbError);
        }
      }
      throw error;
    }
  },
}; 