import { openDB, IDBPDatabase } from 'idb';
import { config } from '../config';

const DB_NAME = 'food-pantry-db';
const DB_VERSION = 2;

// Define store names as constants to avoid typos
export const STORES = {
  CLIENTS: 'clients',
  ORDERS: 'orders',
  PHONE_LOGS: 'phoneLogs',
  CONTACT_NOTES: 'contactNotes',
  CONNECTED_FAMILIES: 'connectedFamilies',
  SYNC_QUEUE: 'syncQueue'
};

// Types for sync queue
export interface SyncQueueItem {
  id: string;
  operation: 'create' | 'update' | 'delete';
  entity: 'client' | 'order' | 'phoneLog' | 'contactNote' | 'connectedFamily';
  data: any;
  timestamp: number;
  retryCount: number;
}

/**
 * IndexedDB Manager for offline data storage
 */
export class IndexedDBManager {
  private db: IDBPDatabase | null = null;
  private initPromise: Promise<void> | null = null;
  private isInitializing = false;

  constructor() {
    // Only initialize if offline mode is enabled
    if (config.features.offlineMode) {
      this.initPromise = this.init();
    }
  }

  /**
   * Initialize the database
   */
  async init(): Promise<void> {
    if (this.db) return;
    if (this.isInitializing) {
      await this.initPromise;
      return;
    }

    this.isInitializing = true;

    try {
      this.db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion, newVersion, transaction) {
          console.log(`Upgrading IndexedDB from version ${oldVersion} to ${newVersion}`);
          
          // Create object stores if they don't exist
          if (!db.objectStoreNames.contains(STORES.CLIENTS)) {
            const clientStore = db.createObjectStore(STORES.CLIENTS, { keyPath: 'id' });
            // Add an index for member_status to help with finding pending clients
            clientStore.createIndex('member_status', 'member_status');
          }
          
          if (!db.objectStoreNames.contains(STORES.ORDERS)) {
            db.createObjectStore(STORES.ORDERS, { keyPath: 'id' });
          }
          
          if (!db.objectStoreNames.contains(STORES.PHONE_LOGS)) {
            db.createObjectStore(STORES.PHONE_LOGS, { keyPath: 'id' });
          }
          
          if (!db.objectStoreNames.contains(STORES.CONTACT_NOTES)) {
            db.createObjectStore(STORES.CONTACT_NOTES, { keyPath: 'id' });
          }
          
          // Add the Connected Families store
          if (!db.objectStoreNames.contains(STORES.CONNECTED_FAMILIES)) {
            console.log('Creating connectedFamilies store in IndexedDB');
            db.createObjectStore(STORES.CONNECTED_FAMILIES, { keyPath: 'id' });
          }
          
          if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
            const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' });
            syncStore.createIndex('timestamp', 'timestamp');
          }
        }
      });
      
      console.log('IndexedDB initialized successfully with version', DB_VERSION);
      this.isInitializing = false;
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
      this.isInitializing = false;
      throw error;
    }
  }

  /**
   * Ensure database is initialized before operations
   */
  private async ensureDB(): Promise<IDBPDatabase> {
    if (!config.features.offlineMode) {
      throw new Error('Offline mode is disabled. Enable it in your environment configuration.');
    }
    
    if (!this.db) {
      await this.init();
    }
    
    if (!this.db) {
      throw new Error('IndexedDB not initialized');
    }
    
    return this.db;
  }

  /**
   * Add an item to a store
   */
  async add<T extends { id: string }>(storeName: string, item: T): Promise<T> {
    const db = await this.ensureDB();
    await db.add(storeName, item);
    await this.addToSyncQueue('create', storeName, item);
    return item;
  }

  /**
   * Get an item by id
   */
  async get<T>(storeName: string, id: string): Promise<T | undefined> {
    const db = await this.ensureDB();
    return db.get(storeName, id);
  }

  /**
   * Get all items from a store
   */
  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.ensureDB();
    return db.getAll(storeName);
  }

  /**
   * Update an item
   */
  async put<T extends { id: string }>(storeName: string, item: T, skipSync: boolean = false): Promise<T> {
    const db = await this.ensureDB();
    await db.put(storeName, item);
    
    // Only add to sync queue if explicitly requested (for actual data modifications)
    if (!skipSync) {
      await this.addToSyncQueue('update', storeName, item);
    }
    
    return item;
  }

  /**
   * Delete an item
   */
  async delete(storeName: string, id: string, skipSync: boolean = false): Promise<void> {
    const db = await this.ensureDB();
    await db.delete(storeName, id);
    
    // Only add to sync queue if explicitly requested (for actual deletions)
    if (!skipSync) {
      await this.addToSyncQueue('delete', storeName, { id });
    }
  }

  /**
   * Add an operation to the sync queue
   */
  private async addToSyncQueue(
    operation: 'create' | 'update' | 'delete',
    entity: string,
    data: any
  ): Promise<void> {
    const db = await this.ensureDB();
    
    // Convert store names to entity types
    const entityMap: Record<string, SyncQueueItem['entity']> = {
      [STORES.CLIENTS]: 'client',
      [STORES.ORDERS]: 'order',
      [STORES.PHONE_LOGS]: 'phoneLog',
      [STORES.CONTACT_NOTES]: 'contactNote',
      [STORES.CONNECTED_FAMILIES]: 'connectedFamily'
    };
    
    const entityType = entityMap[entity] as SyncQueueItem['entity'];
    if (!entityType) {
      console.error(`Unknown entity type for store: ${entity}`);
      return;
    }
    
    const syncItem: SyncQueueItem = {
      id: crypto.randomUUID(),
      operation,
      entity: entityType,
      data,
      timestamp: Date.now(),
      retryCount: 0
    };
    
    await db.add(STORES.SYNC_QUEUE, syncItem);
  }

  /**
   * Process the sync queue when online
   */
  async processSyncQueue(): Promise<void> {
    try {
      const db = await this.ensureDB();
      const queue = await db.getAllFromIndex(STORES.SYNC_QUEUE, 'timestamp');
      
      console.log(`Processing sync queue with ${queue.length} items`);
      
      if (queue.length === 0) {
        return; // Nothing to process
      }
      
      // Import api dynamically to avoid circular dependency
      const { api } = await import('../services/api');
      
      // Check authentication status
      const { data: { session }, error: authError } = await api.supabase.auth.getSession();
      
      if (authError || !session) {
        console.error('Authentication error during sync:', authError || 'No active session');
        throw new Error('Authentication required for synchronization');
      }
      
      console.log('Authentication status:', {
        authenticated: !!session.access_token,
        user: session.user?.email || 'unknown'
      });
      
      // Track successful syncs to update UI
      let syncedCount = 0;
      
      // Process each queue item
      for (const item of queue) {
        try {
          console.log(`Processing sync item: ${item.operation} ${item.entity} ${item.data?.id || 'N/A'}`);
          console.log('Item data:', JSON.stringify(item.data, null, 2));
          
          let success = false;
          
          // Process based on entity type and operation
          switch (item.entity) {
            case 'client':
              success = await this.syncClientItem(item, api);
              break;
            case 'order':
              success = await this.syncOrderItem(item, api);
              break;
            case 'phoneLog':
              success = await this.syncPhoneLogItem(item, api);
              break;
            default:
              console.warn(`Unknown entity type: ${item.entity}`);
              success = false;
          }
          
          if (success) {
            // Remove from sync queue if successful
            await db.delete(STORES.SYNC_QUEUE, item.id);
            console.log(`Successfully synced and removed item from queue: ${item.id}`);
            syncedCount++;
          } else {
            // Increment retry count
            item.retryCount++;
            if (item.retryCount < 3) {
              await db.put(STORES.SYNC_QUEUE, item);
              console.log(`Incremented retry count for item: ${item.id}, count: ${item.retryCount}`);
            } else {
              // Remove after max retries
              console.warn(`Max retries reached for sync item: ${item.id}, removing from queue`);
              await db.delete(STORES.SYNC_QUEUE, item.id);
              syncedCount++; // Count as processed even though it failed
            }
          }
        } catch (error) {
          console.error('Error processing sync item:', error);
          // Keep item in queue for retry
          item.retryCount++;
          if (item.retryCount < 3) {
            await db.put(STORES.SYNC_QUEUE, item);
          } else {
            // Remove after max retries
            await db.delete(STORES.SYNC_QUEUE, item.id);
            syncedCount++; // Count as processed even though it failed
          }
        }
      }
      
      // Double-check that all items were processed
      if (syncedCount > 0) {
        console.log(`Synced ${syncedCount} items. Verifying sync queue is empty...`);
        
        // Add a small delay to ensure IndexedDB is updated
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Force refresh the count
        const remainingCount = await this.getPendingSyncCount();
        console.log(`Queue verification completed. Remaining items: ${remainingCount}`);
      }
    } catch (error) {
      console.error('Error processing sync queue:', error);
    }
  }
  
  /**
   * Sync a client item to the server
   */
  private async syncClientItem(item: SyncQueueItem, api: any): Promise<boolean> {
    if (item.operation === 'create') {
      console.log('Creating client in Supabase:', item.data.id);
      
      // For offline-created clients, we need to prepare the data for Supabase
      const clientData = { ...item.data };
      
      // Convert string dates to ISO strings if they're Date objects
      if (clientData.created_at && clientData.created_at instanceof Date) {
        clientData.created_at = clientData.created_at.toISOString();
      }
      if (clientData.updated_at && clientData.updated_at instanceof Date) {
        clientData.updated_at = clientData.updated_at.toISOString();
      }
      if (clientData.last_visit && clientData.last_visit instanceof Date) {
        clientData.last_visit = clientData.last_visit.toISOString();
      }
      
      // Remove any properties Supabase might reject
      delete clientData.created_offline;
      
      // For clients created offline, we need to create them via the API
      const { data, error } = await api.supabase
        .from('Client')
        .insert([clientData])
        .select();
        
      if (error) {
        console.error('Failed to create client:', error);
        console.error('Error details:', error?.details, error?.message);
        return false;
      }
      
      console.log('Successfully created client in Supabase:', item.data.id);
      console.log('Response data:', data);
      return true;
    }
    else if (item.operation === 'update') {
      console.log('Updating client in Supabase:', item.data.id);
      
      // Prepare update data
      const { id, created_at, updated_at, created_offline, ...updates } = item.data;
      
      // Set updated_at to now
      updates.updated_at = new Date().toISOString();
      
      const { data, error } = await api.supabase
        .from('Client')
        .update(updates)
        .eq('id', id)
        .select();
        
      if (error) {
        console.error('Failed to update client:', error);
        console.error('Error details:', error?.details, error?.message);
        return false;
      }
      
      console.log('Successfully updated client:', id);
      console.log('Response data:', data);
      return true;
    }
    else if (item.operation === 'delete') {
      console.log('Deleting client in Supabase:', item.data.id);
      
      const { error } = await api.supabase
        .from('Client')
        .delete()
        .eq('id', item.data.id);
        
      if (error) {
        console.error('Failed to delete client:', error);
        console.error('Error details:', error?.details, error?.message);
        return false;
      }
      
      console.log('Successfully deleted client:', item.data.id);
      return true;
    }
    
    return false;
  }
  
  /**
   * Sync an order item to the server
   */
  private async syncOrderItem(item: SyncQueueItem, api: any): Promise<boolean> {
    if (item.operation === 'create') {
      console.log('Creating order in Supabase:', item.data.id);
      
      // Prepare the data for Supabase
      const orderData = { ...item.data };
      
      // Convert dates if needed
      if (orderData.created_at && orderData.created_at instanceof Date) {
        orderData.created_at = orderData.created_at.toISOString();
      }
      if (orderData.updated_at && orderData.updated_at instanceof Date) {
        orderData.updated_at = orderData.updated_at.toISOString();
      }
      if (orderData.pickup_date && orderData.pickup_date instanceof Date) {
        orderData.pickup_date = orderData.pickup_date.toISOString();
      }
      
      // Remove any properties Supabase might reject
      delete orderData.created_offline;
      
      const { data, error } = await api.supabase
        .from('Order')
        .insert([orderData])
        .select();
        
      if (error) {
        console.error('Failed to create order:', error);
        console.error('Error details:', error?.details, error?.message);
        return false;
      }
      
      console.log('Successfully created order in Supabase:', item.data.id);
      console.log('Response data:', data);
      return true;
    }
    else if (item.operation === 'update') {
      console.log('Updating order in Supabase:', item.data.id);
      
      // Prepare update data
      const { id, created_at, updated_at, created_offline, ...updates } = item.data;
      
      // Set updated_at to now
      updates.updated_at = new Date().toISOString();
      
      const { data, error } = await api.supabase
        .from('Order')
        .update(updates)
        .eq('id', id)
        .select();
        
      if (error) {
        console.error('Failed to update order:', error);
        console.error('Error details:', error?.details, error?.message);
        return false;
      }
      
      console.log('Successfully updated order:', id);
      console.log('Response data:', data);
      return true;
    }
    else if (item.operation === 'delete') {
      console.log('Deleting order in Supabase:', item.data.id);
      
      const { error } = await api.supabase
        .from('Order')
        .delete()
        .eq('id', item.data.id);
        
      if (error) {
        console.error('Failed to delete order:', error);
        console.error('Error details:', error?.details, error?.message);
        return false;
      }
      
      console.log('Successfully deleted order:', item.data.id);
      return true;
    }
    
    return false;
  }
  
  /**
   * Sync a phone log item to the server
   */
  private async syncPhoneLogItem(item: SyncQueueItem, api: any): Promise<boolean> {
    if (item.operation === 'create') {
      console.log('Creating phone log in Supabase:', item.data.id);
      
      // Prepare the data for Supabase
      const phoneLogData = { ...item.data };
      
      // Convert dates if needed
      if (phoneLogData.created_at && phoneLogData.created_at instanceof Date) {
        phoneLogData.created_at = phoneLogData.created_at.toISOString();
      }
      if (phoneLogData.updated_at && phoneLogData.updated_at instanceof Date) {
        phoneLogData.updated_at = phoneLogData.updated_at.toISOString();
      }
      
      // Remove any properties Supabase might reject
      delete phoneLogData.created_offline;
      
      const { data, error } = await api.supabase
        .from('PhoneLog')
        .insert([phoneLogData])
        .select();
        
      if (error) {
        console.error('Failed to create phone log:', error);
        console.error('Error details:', error?.details, error?.message);
        return false;
      }
      
      console.log('Successfully created phone log in Supabase:', item.data.id);
      console.log('Response data:', data);
      return true;
    }
    else if (item.operation === 'update') {
      console.log('Updating phone log in Supabase:', item.data.id);
      
      // Prepare update data
      const { id, created_at, updated_at, created_offline, ...updates } = item.data;
      
      // Set updated_at to now
      updates.updated_at = new Date().toISOString();
      
      const { data, error } = await api.supabase
        .from('PhoneLog')
        .update(updates)
        .eq('id', id)
        .select();
        
      if (error) {
        console.error('Failed to update phone log:', error);
        console.error('Error details:', error?.details, error?.message);
        return false;
      }
      
      console.log('Successfully updated phone log:', id);
      console.log('Response data:', data);
      return true;
    }
    else if (item.operation === 'delete') {
      console.log('Deleting phone log in Supabase:', item.data.id);
      
      const { error } = await api.supabase
        .from('PhoneLog')
        .delete()
        .eq('id', item.data.id);
        
      if (error) {
        console.error('Failed to delete phone log:', error);
        console.error('Error details:', error?.details, error?.message);
        return false;
      }
      
      console.log('Successfully deleted phone log:', item.data.id);
      return true;
    }
    
    return false;
  }

  /**
   * Count items in the sync queue
   * Useful for showing a badge when there are pending changes
   */
  async getPendingSyncCount(): Promise<number> {
    try {
      const db = await this.ensureDB();
      return (await db.getAllFromIndex(STORES.SYNC_QUEUE, 'timestamp')).length;
    } catch (error) {
      console.error('Error counting pending sync items:', error);
      return 0;
    }
  }

  /**
   * Clear all data (useful for logout)
   */
  async clearAllData(): Promise<void> {
    if (!this.db) return;
    
    try {
      await this.db.clear(STORES.CLIENTS);
      await this.db.clear(STORES.ORDERS);
      await this.db.clear(STORES.PHONE_LOGS);
      await this.db.clear(STORES.CONTACT_NOTES);
      await this.db.clear(STORES.CONNECTED_FAMILIES);
      await this.db.clear(STORES.SYNC_QUEUE);
      console.log('All local data cleared');
    } catch (error) {
      console.error('Error clearing IndexedDB data:', error);
    }
  }

  /**
   * Debug helper to list all clients in IndexedDB
   */
  async debugListAllClients(): Promise<any[]> {
    try {
      const db = await this.ensureDB();
      const clients = await db.getAll(STORES.CLIENTS);
      console.log('--- All clients in IndexedDB ---');
      console.table(clients.map(client => ({
        id: client.id,
        family_number: client.family_number,
        name: `${client.first_name} ${client.last_name}`,
        member_status: client.member_status,
        created_offline: client.created_offline ? 'Yes' : 'No'
      })));
      console.log('--------------------------------');
      return clients;
    } catch (error) {
      console.error('Error listing clients:', error);
      return [];
    }
  }
}

// Create a singleton instance
export const db = new IndexedDBManager(); 