import { Database } from '../types/database.types';
import { api } from './api';
import { toISOString } from '../utils/dateUtils';
import { Order as OrderType, NewOrder } from '../types/order';
import { db } from '../lib/indexedDB';
import { config } from '../config';
import { Client } from '../types';

type OrderInsert = Database['public']['Tables']['Order']['Insert'];
type OrderUpdate = Database['public']['Tables']['Order']['Update'];

export const OrderService = {
  getAll: async () => {
    // Check network connection first
    const isOnline = navigator.onLine;
    
    // If offline mode is enabled and we're offline, go straight to IndexedDB
    if (config.features.offlineMode && !isOnline) {
      console.log('Device is offline, loading orders from IndexedDB...');
      try {
        const cachedOrders = await db.getAll<OrderType>('orders');
        console.log(`Loaded ${cachedOrders.length} orders from IndexedDB while offline`);
        
        // Get all clients to populate order.Client property
        const cachedClients = await db.getAll<Client>('clients');
        
        // Make sure any offline-created orders have the created_offline flag and client info
        const processedOrders = cachedOrders.map(order => {
          let processedOrder = order;
          
          // Add created_offline flag if needed
          if (order && typeof order === 'object' && 'id' in order && 
              !('created_offline' in order) && 
              typeof order.id === 'string' && 
              /^[0-9a-f]{8}-[0-9a-f]{4}/.test(order.id)) {
            processedOrder = { ...order, created_offline: true } as OrderType;
          }
          
          // Add Client property with client information if available
          if (processedOrder.family_number && cachedClients.length > 0) {
            const matchingClient = cachedClients.find(client => 
              client.family_number === processedOrder.family_number
            );
            
            if (matchingClient) {
              // Create a Client property with just the fields needed for display
              processedOrder = {
                ...processedOrder,
                Client: {
                  first_name: matchingClient.first_name,
                  last_name: matchingClient.last_name
                }
              };
            }
          }
          
          return processedOrder;
        });
        
        return processedOrders;
      } catch (dbError) {
        console.error('Failed to fetch orders from IndexedDB while offline:', dbError);
        throw new Error('Unable to load orders while offline. IndexedDB access failed.');
      }
    }
    
    // If we're online, try the API first
    try {
      if (!isOnline) {
        throw new Error('Device is offline, but offline mode is disabled');
      }
      
      console.log('Fetching orders from API...');
      const orders = await api.orders.getAll();
      console.log(`Successfully fetched ${orders.length} orders from API`);
      
      // If offline mode is enabled, cache the results
      if (config.features.offlineMode) {
        try {
          // Store each order in IndexedDB
          for (const order of orders) {
            await db.put('orders', order, true); // Skip sync for server-fetched data
          }
          console.log('Successfully cached orders in IndexedDB');
        } catch (err) {
          console.warn('Failed to cache orders in IndexedDB:', err);
        }
      }
      
      return orders;
    } catch (error) {
      console.error('Error fetching orders from API:', error);
      
      // If offline mode is enabled, try to get from IndexedDB as fallback
      if (config.features.offlineMode) {
        console.log('Falling back to IndexedDB for orders...');
        try {
          const cachedOrders = await db.getAll<OrderType>('orders');
          console.log(`Loaded ${cachedOrders.length} orders from IndexedDB as fallback`);
          
          // Get all clients to populate order.Client property
          const cachedClients = await db.getAll<Client>('clients');
          
          // Make sure any offline-created orders have the created_offline flag and client info
          const processedOrders = cachedOrders.map(order => {
            let processedOrder = order;
            
            // Add created_offline flag if needed
            if (order && typeof order === 'object' && 'id' in order && 
                !('created_offline' in order) && 
                typeof order.id === 'string' && 
                /^[0-9a-f]{8}-[0-9a-f]{4}/.test(order.id)) {
              processedOrder = { ...order, created_offline: true } as OrderType;
            }
            
            // Add Client property with client information if available
            if (processedOrder.family_number && cachedClients.length > 0) {
              const matchingClient = cachedClients.find(client => 
                client.family_number === processedOrder.family_number
              );
              
              if (matchingClient) {
                // Create a Client property with just the fields needed for display
                processedOrder = {
                  ...processedOrder,
                  Client: {
                    first_name: matchingClient.first_name,
                    last_name: matchingClient.last_name
                  }
                };
              }
            }
            
            return processedOrder;
          });
          
          return processedOrders;
        } catch (dbError) {
          console.error('Failed to fetch orders from IndexedDB as fallback:', dbError);
        }
      }
      
      // Re-throw original error if we couldn't get from IndexedDB
      throw error;
    }
  },

  getById: async (id: string) => {
    // Check network connection first
    const isOnline = navigator.onLine;
    
    // If offline mode is enabled and we're offline, go straight to IndexedDB
    if (config.features.offlineMode && !isOnline) {
      try {
        const cachedOrder = await db.get<OrderType>('orders', id);
        if (cachedOrder) {
          console.log(`Loaded order ${id} from IndexedDB while offline`);
          
          // Get client information
          if (cachedOrder.family_number) {
            try {
              const cachedClients = await db.getAll<Client>('clients');
              const matchingClient = cachedClients.find(client => 
                client.family_number === cachedOrder.family_number
              );
              
              if (matchingClient) {
                return {
                  ...cachedOrder,
                  Client: {
                    first_name: matchingClient.first_name,
                    last_name: matchingClient.last_name
                  }
                };
              }
            } catch (err) {
              console.error('Error finding client for order:', err);
            }
          }
          
          return cachedOrder;
        }
        throw new Error(`Order ${id} not found in offline storage`);
      } catch (dbError) {
        console.error(`Failed to fetch order ${id} from IndexedDB while offline:`, dbError);
        throw new Error(`Unable to load order ${id} while offline`);
      }
    }
    
    // Try the API if we're online
    try {
      if (!isOnline) {
        throw new Error('Device is offline, but offline mode is disabled');
      }
      
      const order = await api.orders.getById(id);
      
      // Cache in IndexedDB if offline mode is enabled
      if (config.features.offlineMode) {
        await db.put('orders', order, true);
      }
      
      return order;
    } catch (error) {
      // If offline mode is enabled, try to get from IndexedDB
      if (config.features.offlineMode) {
        try {
          const cachedOrder = await db.get<OrderType>('orders', id);
          if (cachedOrder) {
            // Get client information
            if (cachedOrder.family_number) {
              try {
                const cachedClients = await db.getAll<Client>('clients');
                const matchingClient = cachedClients.find(client => 
                  client.family_number === cachedOrder.family_number
                );
                
                if (matchingClient) {
                  return {
                    ...cachedOrder,
                    Client: {
                      first_name: matchingClient.first_name,
                      last_name: matchingClient.last_name
                    }
                  };
                }
              } catch (err) {
                console.error('Error finding client for order:', err);
              }
            }
            
            return cachedOrder;
          }
        } catch (dbError) {
          console.error('Failed to fetch order from IndexedDB:', dbError);
        }
      }
      throw error;
    }
  },

  getByFamilyNumber: async (familyNumber: string) => {
    try {
      return api.orders.getByFamilyNumber(familyNumber);
    } catch (error) {
      // If offline mode is enabled, try to get from IndexedDB
      if (config.features.offlineMode) {
        try {
          const allOrders = await db.getAll<OrderType>('orders');
          return allOrders.filter(order => order.family_number === familyNumber);
        } catch (dbError) {
          console.error('Failed to fetch orders by family number from IndexedDB:', dbError);
        }
      }
      throw error;
    }
  },

  create: async (orderData: NewOrder) => {
    // Convert any Date objects to ISO strings
    const now = new Date().toISOString();
    
    // Handle pickup_date conversion from Date to string
    const pickupDateStr = orderData.pickup_date ? toISOString(orderData.pickup_date) : null;
    
    const defaultData: OrderInsert = {
      ...orderData,
      pickup_date: pickupDateStr,
      status: orderData.status || 'pending',
      delivery_type: orderData.delivery_type || 'pickup',
      is_new_client: orderData.is_new_client || false,
      approval_status: orderData.approval_status || 'pending',
      number_of_boxes: orderData.number_of_boxes || 1,
      additional_people: orderData.additional_people || {
        adults: 0,
        small_children: 0,
        school_aged: 0
      },
      created_at: now,
      updated_at: now
    };

    try {
      // Check if we're offline before even trying the API call
      if (!navigator.onLine && config.features.offlineMode) {
        throw new Error('Offline mode: Creating order locally');
      }
      
      // Try to create with API 
      const createdOrder = await api.orders.create(defaultData);
      return createdOrder;
    } catch (error) {
      console.log('Error in order creation, checking if offline:', error);
      // Check if it's a network error
      const isNetworkError = 
        error instanceof Error && 
        (error.message.includes('Failed to fetch') || 
         error.message.includes('NetworkError') ||
         error.message.includes('network') ||
         error.message.includes('Offline mode') ||
         !navigator.onLine);

      // If it's a network error or offline mode is enabled, store in IndexedDB
      if (isNetworkError || config.features.offlineMode) {
        try {
          // IMPORTANT: Always set status to pending for offline orders
          // and ensure created_offline is true
          const offlineData = {
            ...defaultData,
            id: crypto.randomUUID(),
            status: 'pending',
            approval_status: 'pending',
            created_offline: true
          };
          
          // Log comprehensive information about the offline order
          console.log('Creating offline order with data:', JSON.stringify(offlineData, null, 2));
          
          // We use the add method without the skipSync parameter, so it adds to the sync queue
          await db.add('orders', offlineData);
          console.log('Order stored in offline queue for later sync:', offlineData.id);
          
          // First check if the order was successfully saved in IndexedDB
          const savedOrder = await db.get('orders', offlineData.id);
          if (!savedOrder) {
            console.error('Failed to verify offline order in IndexedDB:', offlineData.id);
          } else {
            console.log('Successfully verified offline order in IndexedDB:', savedOrder);
            
            // Also check that it was added to the sync queue
            const pendingCount = await db.getPendingSyncCount();
            console.log(`Current pending sync items: ${pendingCount}`);
          }
          
          return offlineData;
        } catch (dbError) {
          console.error('Failed to store order in IndexedDB:', dbError);
          throw dbError;
        }
      }
      throw error;
    }
  },

  update: async (id: string, updates: Partial<OrderType>) => {
    try {
      // Extract and convert pickup_date if it exists
      const { pickup_date, ...otherUpdates } = updates;
      
      // Create update object with proper types
      const updateData: OrderUpdate = {
        ...otherUpdates as any, // Cast to any to avoid type conflicts
        updated_at: new Date().toISOString()
      };
      
      // Add pickup_date if it exists
      if (pickup_date !== undefined) {
        updateData.pickup_date = pickup_date instanceof Date 
          ? toISOString(pickup_date) 
          : pickup_date;
      }

      return api.orders.update(id, updateData);
    } catch (error) {
      // If offline mode is enabled, update in IndexedDB and sync later
      if (config.features.offlineMode) {
        try {
          // Get current order data
          const currentOrder = await db.get('orders', id);
          if (currentOrder) {
            // Extract and convert pickup_date if it exists
            const { pickup_date, ...otherUpdates } = updates;
            
            // Create update object
            const updateData: any = {
              ...otherUpdates,
              updated_at: new Date().toISOString()
            };
            
            // Add pickup_date if it exists
            if (pickup_date !== undefined) {
              updateData.pickup_date = pickup_date instanceof Date 
                ? toISOString(pickup_date) 
                : pickup_date;
            }
            
            const updatedOrder = {
              ...currentOrder,
              ...updateData
            };
            
            await db.put('orders', updatedOrder);
            console.log('Order updated in offline queue for later sync');
            return updatedOrder;
          }
        } catch (dbError) {
          console.error('Failed to update order in IndexedDB:', dbError);
        }
      }
      throw error;
    }
  },

  delete: async (id: string) => {
    // Check network connection first
    const isOnline = navigator.onLine;
    console.log(`OrderService.delete: Deleting order ${id}, network status: ${isOnline ? 'online' : 'offline'}`);
    
    // If offline mode is enabled and we're offline, go straight to IndexedDB
    if (config.features.offlineMode && !isOnline) {
      console.log(`OrderService.delete: Offline mode handling for order ${id}`);
      try {
        // Check if the order exists in IndexedDB first
        const existingOrder = await db.get('orders', id);
        console.log(`OrderService.delete: Order ${id} exists in IndexedDB:`, !!existingOrder);
        
        if (!existingOrder) {
          console.warn(`OrderService.delete: Order ${id} not found in IndexedDB`);
          // Return true anyway to prevent UI errors when order doesn't exist locally
          return true;
        }
        
        // Delete the order from IndexedDB without skipping sync
        console.log(`OrderService.delete: Deleting order ${id} from IndexedDB`);
        await db.delete('orders', id, false);
        console.log(`OrderService.delete: Order ${id} successfully deleted from IndexedDB and marked for sync`);
        
        // Verify the order was deleted
        const checkOrder = await db.get('orders', id);
        console.log(`OrderService.delete: Verification - order ${id} still exists:`, !!checkOrder);
        
        return true;
      } catch (dbError) {
        console.error(`OrderService.delete: Failed to delete order ${id} from IndexedDB:`, dbError);
        
        // For UI purposes, return true even if there was an error
        // This prevents the UI from showing an error when the network is down
        console.log(`OrderService.delete: Returning success=true despite error for better UX`);
        return true;
      }
    }
    
    // Online path - try the API
    try {
      if (!isOnline) {
        throw new Error('Device is offline, but offline mode is disabled');
      }
      
      const result = await api.orders.delete(id);
      console.log(`OrderService.delete: Successfully deleted order ${id} via API`);
      return result;
    } catch (error) {
      console.log(`OrderService.delete: Error deleting order ${id}:`, error);
      
      // Check if it's a network error
      const isNetworkError = 
        error instanceof Error && 
        (error.message.includes('Failed to fetch') || 
         error.message.includes('NetworkError') ||
         error.message.includes('network') ||
         !navigator.onLine);
         
      // If offline mode is enabled and we hit a network error, try local deletion
      if (config.features.offlineMode && isNetworkError) {
        console.log(`OrderService.delete: Network error detected, falling back to IndexedDB deletion`);
        try {
          // Try to get the order first to check if it exists
          const existingOrder = await db.get('orders', id);
          
          if (!existingOrder) {
            console.log(`OrderService.delete: Order ${id} not found in IndexedDB during fallback`);
            // Return true anyway to prevent UI errors when order doesn't exist locally
            return true;
          }
          
          // Delete the order from IndexedDB without skipping sync
          await db.delete('orders', id, false);
          console.log(`OrderService.delete: Successfully deleted order ${id} from IndexedDB during fallback`);
          
          return true;
        } catch (dbError) {
          console.error(`OrderService.delete: Failed to delete order ${id} from IndexedDB during fallback:`, dbError);
          
          // For UI purposes, return true even if there was an error
          // This prevents the UI from showing an error when the network is down
          return true;
        }
      }
      
      // If we get here, it's not a network error or offline mode isn't enabled
      throw error;
    }
  }
}; 