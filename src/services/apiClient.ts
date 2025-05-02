import { supabase } from '../lib/supabase';
import { db } from '../lib/indexedDB';
import { syncService } from './syncService';
import { config } from '../config';

/**
 * Generic API client that handles both online and offline operations
 */
class ApiClient {
  /**
   * Fetch data with offline support
   * @param entity Entity type (clients, orders, etc.)
   * @param id Optional id for single item fetch
   */
  async fetch<T>(entity: string, id?: string): Promise<T | T[]> {
    try {
      // Check if we're online
      if (syncService.getOnlineStatus()) {
        // Online mode: fetch from Supabase
        const { data, error } = id
          ? await supabase.from(entity).select('*').eq('id', id).single()
          : await supabase.from(entity).select('*');
          
        if (error) throw error;
        
        // Store in IndexedDB for offline access if enabled
        if (config.features.offlineMode) {
          if (id && data) {
            await db.put(entity, data, true);
          } else if (Array.isArray(data)) {
            // Store each item individually for better offline access
            for (const item of data) {
              await db.put(entity, item, true);
            }
          }
        }
        
        return data as any;
      } else {
        // Offline mode: fetch from IndexedDB
        if (!config.features.offlineMode) {
          throw new Error('Network error: You are offline and offline mode is disabled');
        }
        
        if (id) {
          const item = await db.get<T>(entity, id);
          if (!item) throw new Error(`${entity} with id ${id} not found in offline storage`);
          return item;
        } else {
          return await db.getAll<T>(entity);
        }
      }
    } catch (error) {
      console.error(`Error fetching ${entity}${id ? ` (${id})` : ''}:`, error);
      
      // If we're offline but have data in IndexedDB, try to return that
      if (config.features.offlineMode && !syncService.getOnlineStatus()) {
        try {
          if (id) {
            const item = await db.get<T>(entity, id);
            if (item) return item;
          } else {
            return await db.getAll<T>(entity);
          }
        } catch (dbError) {
          console.error('Error fetching from offline storage:', dbError);
        }
      }
      
      // Re-throw the original error if we couldn't recover
      throw error;
    }
  }

  /**
   * Create a new item with offline support
   * @param entity Entity type (clients, orders, etc.)
   * @param data Item data
   */
  async create<T extends { id: string }>(entity: string, data: T): Promise<T> {
    try {
      // Generate id if not provided
      if (!data.id) {
        data.id = crypto.randomUUID();
      }
      
      // Add timestamps if not provided
      if (!('createdAt' in data)) {
        (data as any).createdAt = new Date().toISOString();
      }
      if (!('updatedAt' in data)) {
        (data as any).updatedAt = new Date().toISOString();
      }
      
      // Check if we're online
      if (syncService.getOnlineStatus()) {
        // Online mode: create in Supabase
        const { data: createdData, error } = await supabase
          .from(entity)
          .insert(data)
          .select()
          .single();
          
        if (error) throw error;
        
        // Store in IndexedDB for offline access
        if (config.features.offlineMode) {
          await db.put(entity, createdData);
        }
        
        return createdData as T;
      } else {
        // Offline mode: store in IndexedDB
        if (!config.features.offlineMode) {
          throw new Error('Network error: You are offline and offline mode is disabled');
        }
        
        await db.add(entity, data);
        return data;
      }
    } catch (error) {
      console.error(`Error creating ${entity}:`, error);
      
      // If we're offline but offline mode is enabled, store locally
      if (config.features.offlineMode && !syncService.getOnlineStatus()) {
        await db.add(entity, data);
        return data;
      }
      
      throw error;
    }
  }

  /**
   * Update an item with offline support
   * @param entity Entity type (clients, orders, etc.)
   * @param id Item id
   * @param data Item data
   */
  async update<T extends { id: string }>(entity: string, id: string, data: Partial<T>): Promise<T> {
    try {
      // Add updated timestamp
      const updateData = {
        ...data,
        updatedAt: new Date().toISOString(),
        id
      };
      
      // Check if we're online
      if (syncService.getOnlineStatus()) {
        // Online mode: update in Supabase
        const { data: updatedData, error } = await supabase
          .from(entity)
          .update(updateData)
          .eq('id', id)
          .select()
          .single();
          
        if (error) throw error;
        
        // Update in IndexedDB for offline access
        if (config.features.offlineMode) {
          await db.put(entity, updatedData);
        }
        
        return updatedData as T;
      } else {
        // Offline mode: update in IndexedDB
        if (!config.features.offlineMode) {
          throw new Error('Network error: You are offline and offline mode is disabled');
        }
        
        // Get existing item first
        const existingItem = await db.get<T>(entity, id);
        if (!existingItem) {
          throw new Error(`${entity} with id ${id} not found in offline storage`);
        }
        
        // Merge with existing data
        const mergedData = { ...existingItem, ...updateData } as T;
        await db.put(entity, mergedData);
        
        return mergedData;
      }
    } catch (error) {
      console.error(`Error updating ${entity} (${id}):`, error);
      
      // If we're offline but offline mode is enabled, try to update locally
      if (config.features.offlineMode && !syncService.getOnlineStatus()) {
        try {
          const existingItem = await db.get<T>(entity, id);
          if (existingItem) {
            const mergedData = { 
              ...existingItem, 
              ...data, 
              updatedAt: new Date().toISOString() 
            } as T;
            
            await db.put(entity, mergedData);
            return mergedData;
          }
        } catch (dbError) {
          console.error('Error updating in offline storage:', dbError);
        }
      }
      
      throw error;
    }
  }

  /**
   * Delete an item with offline support
   * @param entity Entity type (clients, orders, etc.)
   * @param id Item id
   */
  async delete(entity: string, id: string): Promise<void> {
    try {
      // Map API entity names to IndexedDB store names
      const storeEntity = entity === 'Client' ? 'clients' : entity.toLowerCase();
      
      // Check if we're online
      if (syncService.getOnlineStatus()) {
        // Online mode: delete from Supabase
        const { error } = await supabase
          .from(entity)
          .delete()
          .eq('id', id);
          
        if (error) throw error;
        
        // Delete from IndexedDB
        if (config.features.offlineMode) {
          await db.delete(storeEntity, id);
        }
      } else {
        // Offline mode: delete from IndexedDB
        if (!config.features.offlineMode) {
          throw new Error('Network error: You are offline and offline mode is disabled');
        }
        
        await db.delete(storeEntity, id);
      }
    } catch (error) {
      console.error(`Error deleting ${entity} (${id}):`, error);
      
      // If we're offline but offline mode is enabled, delete locally
      if (config.features.offlineMode && !syncService.getOnlineStatus()) {
        try {
          // Map API entity names to IndexedDB store names
          const storeEntity = entity === 'Client' ? 'clients' : entity.toLowerCase();
          await db.delete(storeEntity, id);
        } catch (dbError) {
          console.error('Error deleting from offline storage:', dbError);
          throw dbError;
        }
      } else {
        throw error;
      }
    }
  }
}

export const apiClient = new ApiClient(); 