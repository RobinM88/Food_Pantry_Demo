import { createClient } from '@supabase/supabase-js';
import type { Client, PhoneLog, ConnectedFamily } from '../types';
import type { Database } from '../types/database.types';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { db } from '../lib/indexedDB';
import { STORES } from '../lib/indexedDB';

// Only validate environment variables in non-demo mode
if (!config.app.isDemoMode) {
  if (!import.meta.env.VITE_SUPABASE_URL) {
    throw new Error('Missing VITE_SUPABASE_URL environment variable');
  }

  if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
    throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable');
  }
}

// Use config values which handle demo mode properly
const supabaseUrl = config.supabase.url;
const supabaseKey = config.supabase.anonKey;

// Debug environment variables in non-demo mode
if (!config.app.isDemoMode) {
  console.log('Environment Check:', {
    url: supabaseUrl,
    keyLength: supabaseKey.length,
    keyPrefix: supabaseKey.substring(0, 10)
  });
}

// Create Supabase client (will use a valid URL even in demo mode)
const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Initialize Supabase connection only in non-demo mode
async function initializeSupabase() {
  // Skip in demo mode
  if (config.app.isDemoMode) {
    console.log('Demo mode: Skipping Supabase initialization');
    return;
  }
  
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return;
    }

    console.log('Supabase initialized:', {
      hasSession: !!session,
      authenticated: !!session?.access_token
    });

    if (session) {
      // Test database connection with auth token
      const { error } = await supabase
        .from('Client')
        .select('id')
        .limit(1);

      if (error) {
        console.error('Database connection test failed:', error);
      } else {
        console.log('Database connection test successful');
      }
    }
  } catch (error) {
    console.error('Supabase initialization error:', error);
  }
}

// Initialize on load if not in demo mode
if (!config.app.isDemoMode) {
  initializeSupabase();
}

export const api = {
  supabase,
  clients: {
    async getAll() {
      // In demo mode, go straight to IndexedDB
      if (config.app.isDemoMode) {
        console.log('Demo mode: Loading clients from IndexedDB directly');
        try {
          const clients = await db.getAll(STORES.CLIENTS);
          console.log(`Demo mode: Loaded ${clients.length} clients from IndexedDB`);
          return clients;
        } catch (error) {
          console.error('Demo mode: Error loading clients from IndexedDB:', error);
          return [];
        }
      }
      
      try {
        console.log('Fetching clients...');
        
        const { data, error } = await supabase
          .from('Client')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching clients:', {
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          throw error;
        }

        console.log(`Successfully fetched ${data?.length || 0} clients`);
        return data;
      } catch (error) {
        console.error('Unexpected error in getAll:', error);
        throw error;
      }
    },

    async getById(id: string) {
      // In demo mode, go straight to IndexedDB
      if (config.app.isDemoMode) {
        console.log(`Demo mode: Loading client ${id} from IndexedDB directly`);
        return await db.get(STORES.CLIENTS, id);
      }
      
      const { data, error } = await supabase
        .from('Client')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },

    async create(client: Omit<Client, 'id' | 'created_at' | 'updated_at'>) {
      // Convert camelCase to snake_case for database
      const now = new Date().toISOString();
      const clientData = {
        id: uuidv4(), // Add generated UUID
        family_number: client.family_number,
        first_name: client.first_name,
        last_name: client.last_name,
        email: client.email,
        address: client.address,
        apt_number: client.apt_number,
        zip_code: client.zip_code,
        phone1: client.phone1,
        phone2: client.phone2,
        is_unhoused: client.is_unhoused,
        is_temporary: client.is_temporary,
        adults: client.adults,
        school_aged: client.school_aged,
        small_children: client.small_children,
        temporary_members: client.temporary_members,
        family_size: client.family_size,
        food_notes: client.food_notes,
        office_notes: client.office_notes,
        total_visits: client.total_visits,
        total_this_month: client.total_this_month,
        member_status: client.member_status,
        last_visit: client.last_visit,
        created_at: now,
        updated_at: now
      };
      
      const { data, error } = await supabase
        .from('Client')
        .insert([clientData])
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      return data;
    },

    async update(id: string, updates: Partial<Client>) {
      // Convert camelCase to snake_case for database
      const { connected_families, ...clientData } = updates;
      
      const { data, error } = await supabase
        .from('Client')
        .update(clientData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      return data;
    },

    async delete(id: string) {
      try {
        // Log what we're trying to delete
        console.log('Attempting to delete client with ID:', id);
        
        // Make explicit call to supabase with error handling
        const { error } = await supabase
          .from('Client')
          .delete()
          .eq('id', id);
        
        if (error) {
          console.error('Supabase delete error:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          throw error;
        }

        console.log('Successfully deleted client from Supabase:', id);
        
        // Also delete from IndexedDB if offline mode is enabled
        if (config.features.offlineMode) {
          try {
            // Using the correct store name 'clients' from STORES.CLIENTS
            await db.delete('clients', id);
            console.log('Successfully deleted client from IndexedDB:', id);
          } catch (e) {
            console.error('Failed to delete from IndexedDB:', e);
          }
        }
      } catch (error) {
        console.error('Client deletion failed:', error);
        throw error;
      }
    },

    async getByPhone(phone: string) {
      const { data, error } = await supabase
        .from('Client')
        .select('*')
        .or(`phone1.eq.${phone},phone2.eq.${phone}`);
      
      if (error) throw error;
      return data;
    }
  },

  orders: {
    async getAll() {
      // In demo mode, go straight to IndexedDB
      if (config.app.isDemoMode) {
        console.log('Demo mode: Loading orders from IndexedDB directly');
        try {
          const orders = await db.getAll(STORES.ORDERS);
          console.log(`Demo mode: Loaded ${orders.length} orders from IndexedDB`);
          return orders;
        } catch (error) {
          console.error('Demo mode: Error loading orders from IndexedDB:', error);
          return [];
        }
      }
      
      // Regular API call for non-demo mode
      const { data, error } = await supabase
        .from('Order')
        .select(`
          *,
          Client (
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    
    async getById(id: string) {
      // In demo mode, go straight to IndexedDB
      if (config.app.isDemoMode) {
        console.log(`Demo mode: Loading order ${id} from IndexedDB directly`);
        return await db.get(STORES.ORDERS, id);
      }
      
      const { data, error } = await supabase
        .from('Order')
        .select(`
          *,
          Client (
            first_name,
            last_name
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    
    async create(order: any) {
      // In demo mode, add directly to IndexedDB
      if (config.app.isDemoMode) {
        console.log('Demo mode: Creating order in IndexedDB directly');
        const now = new Date();
        const newOrder = {
          ...order,
          id: crypto.randomUUID(),
          created_at: now,
          updated_at: now
        };
        
        await db.add(STORES.ORDERS, newOrder);
        return newOrder;
      }
      
      const { data, error } = await supabase
        .from('Order')
        .insert([order])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    
    async update(id: string, updates: any) {
      // In demo mode, update in IndexedDB
      if (config.app.isDemoMode) {
        console.log(`Demo mode: Updating order ${id} in IndexedDB directly`);
        
        // Get current order
        const currentOrder = await db.get(STORES.ORDERS, id);
        if (!currentOrder) {
          throw new Error(`Order with ID ${id} not found`);
        }
        
        // Apply updates
        const updatedOrder = {
          ...currentOrder,
          ...updates,
          updated_at: new Date()
        };
        
        await db.put(STORES.ORDERS, updatedOrder, true);
        return updatedOrder;
      }
      
      const { data, error } = await supabase
        .from('Order')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    
    async delete(id: string) {
      // In demo mode, delete from IndexedDB
      if (config.app.isDemoMode) {
        console.log(`Demo mode: Deleting order ${id} from IndexedDB directly`);
        
        try {
          // First check if the order exists
          const order = await db.get(STORES.ORDERS, id);
          if (!order) {
            console.log(`Demo mode: Order ${id} not found, nothing to delete`);
            return true;
          }
          
          // Delete the order
          await db.delete(STORES.ORDERS, id, true);
          console.log(`Demo mode: Successfully deleted order ${id}`);
          return true;
        } catch (error) {
          console.error(`Demo mode: Error deleting order ${id}:`, error);
          throw error;
        }
      }
      
      const { error } = await supabase
        .from('Order')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    },
    
    async getByFamilyNumber(familyNumber: string) {
      // In demo mode, filter from IndexedDB
      if (config.app.isDemoMode) {
        console.log(`Demo mode: Loading orders for family ${familyNumber} from IndexedDB directly`);
        
        try {
          const allOrders = await db.getAll(STORES.ORDERS);
          const familyOrders = allOrders.filter((order: any) => order.family_number === familyNumber);
          console.log(`Demo mode: Found ${familyOrders.length} orders for family ${familyNumber}`);
          return familyOrders;
        } catch (error) {
          console.error(`Demo mode: Error loading orders for family ${familyNumber}:`, error);
          return [];
        }
      }
      
      const { data, error } = await supabase
        .from('Order')
        .select(`
          *,
          Client (
            first_name,
            last_name
          )
        `)
        .eq('family_number', familyNumber)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  },

  phoneLogs: {
    async getAll() {
      // In demo mode, go straight to IndexedDB
      if (config.app.isDemoMode) {
        console.log('Demo mode: Loading phone logs from IndexedDB directly');
        try {
          const logs = await db.getAll(STORES.PHONE_LOGS);
          console.log(`Demo mode: Loaded ${logs.length} phone logs from IndexedDB`);
          return logs;
        } catch (error) {
          console.error('Demo mode: Error loading phone logs from IndexedDB:', error);
          return [];
        }
      }
      
      const { data, error } = await supabase
        .from('PhoneLog')
        .select(`
          *,
          client:Client(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },

    async getById(id: string) {
      const { data, error } = await supabase
        .from('PhoneLog')
        .select(`
          *,
          client:Client(*)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },

    async create(phoneLog: Omit<PhoneLog, 'id' | 'created_at' | 'updated_at'>) {
      // Format data for Supabase - match schema exactly
      const now = new Date().toISOString();
      const phoneLogData = {
        id: uuidv4(), // Generate ID for the phone log
        family_number: phoneLog.family_number,
        phone_number: phoneLog.phone_number,
        call_type: phoneLog.call_type,
        call_outcome: phoneLog.call_outcome,
        notes: phoneLog.notes || undefined,
        created_at: now,
        updated_at: now
      };

      console.log('Creating phone log with formatted data:', phoneLogData); // Debug log

      try {
        const { data, error } = await supabase
          .from('PhoneLog')
          .insert([phoneLogData])
          .select(`
            id,
            family_number,
            phone_number,
            call_type,
            call_outcome,
            notes,
            created_at,
            updated_at
          `)
          .single();
        
        if (error) {
          console.error('Supabase error details:', {
            error,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
          throw error;
        }
        return data;
      } catch (error) {
        console.error('Detailed error:', error);
        throw error;
      }
    },

    async update(id: string, updates: Partial<PhoneLog>) {
      // Convert camelCase to snake_case
      const dbUpdates: any = {};
      if (updates.family_number) dbUpdates.family_number = updates.family_number;
      if (updates.phone_number) dbUpdates.phone_number = updates.phone_number;
      if (updates.call_type) dbUpdates.call_type = updates.call_type;
      if (updates.call_outcome) dbUpdates.call_outcome = updates.call_outcome;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes || undefined;

      const { data, error } = await supabase
        .from('PhoneLog')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async delete(id: string) {
      const { error } = await supabase
        .from('PhoneLog')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },

    async getByClientId(clientId: string) {
      const { data, error } = await supabase
        .from('PhoneLog')
        .select('*')
        .eq('family_number', clientId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },

    async getByPhoneNumber(phoneNumber: string) {
      const { data, error } = await supabase
        .from('PhoneLog')
        .select('*')
        .eq('phone_number', phoneNumber)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  },

  connectedFamilies: {
    async getAll() {
      // In demo mode, go straight to IndexedDB
      if (config.app.isDemoMode) {
        console.log('Demo mode: Getting all connected families from IndexedDB');
        try {
          let connectedFamilies = await db.getAll(STORES.CONNECTED_FAMILIES);
          // If no connections found in IndexedDB, provide some demo data
          if (!connectedFamilies || connectedFamilies.length === 0) {
            console.log('Demo mode: No connected families found, creating demo data');
            
            // Create demo connection groups with consistent IDs
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
            
            console.log('Demo mode: Saving sample connected family data to IndexedDB');
            // Store the demo data in IndexedDB
            for (const conn of demoConnections) {
              await db.put(STORES.CONNECTED_FAMILIES, conn as any, true);
            }
            connectedFamilies = demoConnections;
          }
          return connectedFamilies;
        } catch (error) {
          // In demo mode, return empty array rather than throwing
          console.log('Demo mode: Returning empty connected families list');
          return [];
        }
      }
      
      try {
        const { data, error } = await supabase
          .from('ConnectedFamily')
          .select('*');
        
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error fetching connected families from API:', error);
        throw error;
      }
    },

    async getByClientId(clientId: string) {
      // In demo mode, return consistent demo data without making network calls
      if (config.app.isDemoMode) {
        console.log(`Demo mode: Getting connected families for client ${clientId}`);
        try {
          // First try to get from IndexedDB
          const allConnections = await db.getAll(STORES.CONNECTED_FAMILIES);
          
          // In demo mode, include connections where the client is either the family_number OR
          // the connected_family_number - this is necessary to show all connections properly
          let clientConnections = allConnections.filter((conn: any) => {
            // Direct match on family_number
            if (conn.family_number === clientId) return true;
            
            // Check if this client is in a connection group
            // This helps show the other side of the relationship
            if (conn.connected_family_number === 'cf000001' && 
                (clientId === 'f1001' || clientId === 'f1002')) {
              return true;
            }
            
            if (conn.connected_family_number === 'cf000002' && 
                (clientId === 'f1003' || clientId === 'f1004')) {
              return true;
            }
            
            return false;
          });
          
          // If we didn't find connections but this is a known family number,
          // create demo connections
          if ((!clientConnections || clientConnections.length === 0) && 
              ['f1001', 'f1002', 'f1003', 'f1004'].includes(clientId)) {
            
            // Demo connection data by client ID
            const demoConnectionsMap: Record<string, any[]> = {
              // For clients in group 1 (f1001 and f1002)
              'f1001': [
                {
                  id: `conn-demo-${Date.now()}-1a`,
                  family_number: 'f1002', // Show Jane Doe as connection for John Smith
                  connected_family_number: 'cf000001',
                  relationship_type: 'child',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
              ],
              'f1002': [
                {
                  id: `conn-demo-${Date.now()}-2a`,
                  family_number: 'f1001', // Show John Smith as connection for Jane Doe
                  connected_family_number: 'cf000001',
                  relationship_type: 'parent', 
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
              ],
              // For clients in group 2 (f1003 and f1004)
              'f1003': [
                {
                  id: `conn-demo-${Date.now()}-3a`,
                  family_number: 'f1004', // Show Mary Williams as connection for Robert Johnson
                  connected_family_number: 'cf000002',
                  relationship_type: 'spouse',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
              ],
              'f1004': [
                {
                  id: `conn-demo-${Date.now()}-4a`,
                  family_number: 'f1003', // Show Robert Johnson as connection for Mary Williams
                  connected_family_number: 'cf000002',
                  relationship_type: 'spouse',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
              ]
            };
            
            // Get the client's demo connections
            clientConnections = demoConnectionsMap[clientId] || [];
            
            if (clientConnections.length > 0) {
              // Store in IndexedDB
              for (const conn of clientConnections) {
                await db.put(STORES.CONNECTED_FAMILIES, conn as any, true);
              }
              console.log(`Demo mode: Created demo connections for client ${clientId}`);
            }
          }
          
          console.log(`Demo mode: Found ${clientConnections.length} connected families for client ${clientId}`);
          return clientConnections;
        } catch (error) {
          // On error, just return empty array instead of throwing an error
          console.log(`Demo mode: Returning empty connected families for client ${clientId}`);
          return [];
        }
      }
      
      try {
        const { data, error } = await supabase
          .from('ConnectedFamily')
          .select('*')
          .eq('family_number', clientId);
        
        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error fetching connected families from API:', error);
        throw error;
      }
    },

    async create(connectedFamily: Omit<ConnectedFamily, 'id'>) {
      // In demo mode, go straight to IndexedDB
      if (config.app.isDemoMode) {
        console.log('Demo mode: Creating connected family in IndexedDB');
        try {
          const familyWithId = {
            ...connectedFamily,
            id: uuidv4(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          return await db.add(STORES.CONNECTED_FAMILIES, familyWithId);
        } catch (error) {
          console.log('Demo mode: Error creating connected family, returning mock data');
          // Return a mock success result instead of throwing
          return {
            ...connectedFamily,
            id: uuidv4()
          };
        }
      }
      
      const { data, error } = await supabase
        .from('ConnectedFamily')
        .insert([connectedFamily])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },

    async delete(id: string) {
      // In demo mode, go straight to IndexedDB
      if (config.app.isDemoMode) {
        console.log(`Demo mode: Deleting connected family ${id} from IndexedDB`);
        try {
          await db.delete(STORES.CONNECTED_FAMILIES, id);
        } catch (error) {
          console.log(`Demo mode: Error deleting connected family ${id}, ignoring`);
          // Suppress the error in demo mode
        }
        return true;
      }
      
      const { error } = await supabase
        .from('ConnectedFamily')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    },

    async deleteByClientId(clientId: string) {
      // In demo mode, handle this through IndexedDB
      if (config.app.isDemoMode) {
        console.log(`Demo mode: Deleting all connected families for client ${clientId} from IndexedDB`);
        try {
          const allConnections = await db.getAll(STORES.CONNECTED_FAMILIES);
          const clientConnections = allConnections.filter((conn: any) => conn.family_number === clientId);
          
          for (const conn of clientConnections) {
            await db.delete(STORES.CONNECTED_FAMILIES, (conn as any).id);
          }
        } catch (error) {
          console.log(`Demo mode: Error deleting connected families for client ${clientId}, ignoring`);
          // Suppress the error in demo mode
        }
        return true;
      }
      
      const { error } = await supabase
        .from('ConnectedFamily')
        .delete()
        .eq('family_number', clientId);
      
      if (error) throw error;
      return true;
    },

    async getConnection(clientId: string, connectedTo: string) {
      // In demo mode, return null without making API calls
      if (config.app.isDemoMode) {
        console.log(`Demo mode: Getting connection between clients ${clientId} and ${connectedTo} from IndexedDB`);
        try {
          const allConnections = await db.getAll(STORES.CONNECTED_FAMILIES);
          return allConnections.find(
            (conn: any) => conn.family_number === clientId && conn.connected_family_number === connectedTo
          );
        } catch (error) {
          // Just return null on error instead of warning
          console.log(`Demo mode: Error getting connection between clients ${clientId} and ${connectedTo}, returning null`);
          return null;
        }
      }
      
      const { data, error } = await supabase
        .from('ConnectedFamily')
        .select('*')
        .eq('family_number', clientId)
        .eq('connected_family_number', connectedTo)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    }
  }
}; 