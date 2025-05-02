import { api } from './api';
import { toISOString, toDate } from '../utils/dateUtils';
import type { PhoneLog } from '../types';
import type { Client } from '../types';
import { db } from '../lib/indexedDB';
import { config } from '../config';

// Convert database response to frontend type
function toPhoneLog(dbLog: any): PhoneLog {
  return {
    id: dbLog.id,
    family_number: dbLog.family_number,
    phone_number: dbLog.phone_number,
    call_type: dbLog.call_type,
    call_outcome: dbLog.call_outcome,
    notes: dbLog.notes || '',
    created_at: toDate(dbLog.created_at) || new Date(),
    updated_at: toDate(dbLog.updated_at) || new Date(),
    client: dbLog.client
  };
}

// Convert frontend type to database format
function toPhoneLogDTO(phoneLog: Partial<PhoneLog>): Partial<any> {
  const dto: any = { ...phoneLog };
  
  if (phoneLog.created_at instanceof Date) {
    dto.created_at = toISOString(phoneLog.created_at);
  }
  
  if (phoneLog.updated_at instanceof Date) {
    dto.updated_at = toISOString(phoneLog.updated_at);
  }
  
  return dto;
}

export class PhoneLogService {
  static async getAll(): Promise<PhoneLog[]> {
    try {
      // Try to get from API first
      const response = await api.phoneLogs.getAll();
      const phoneLogs = response.map(toPhoneLog);
      
      // If offline mode is enabled, cache the results
      if (config.features.offlineMode) {
        try {
          // Store each phone log in IndexedDB (use raw response to avoid date conversion issues)
          for (const log of response) {
            await db.put('phoneLogs', log, true); // Skip sync for server-fetched data
          }
        } catch (err) {
          console.warn('Failed to cache phone logs in IndexedDB:', err);
        }
      }
      
      return phoneLogs;
    } catch (error) {
      console.error('Error fetching phone logs from API:', error);
      
      // If offline mode is enabled, try to get from IndexedDB
      if (config.features.offlineMode) {
        try {
          console.log('Attempting to load phone logs from IndexedDB...');
          const cachedLogs = await db.getAll<any>('phoneLogs');
          console.log(`Loaded ${cachedLogs.length} phone logs from IndexedDB`);
          
          // Load clients to join with phone logs
          const cachedClients = await db.getAll<Client>('clients');
          console.log(`Loaded ${cachedClients.length} clients for joining with phone logs`);
          
          // Process logs to include client information
          const processedLogs = cachedLogs.map(log => {
            // Add client information if available
            if (log && log.family_number && cachedClients.length > 0) {
              const matchingClient = cachedClients.find(client => 
                client.family_number === log.family_number
              );
              
              if (matchingClient) {
                // Only include the client fields needed
                log.client = {
                  id: matchingClient.id,
                  family_number: matchingClient.family_number,
                  first_name: matchingClient.first_name,
                  last_name: matchingClient.last_name,
                  phone1: matchingClient.phone1
                };
              }
            }
            
            return log;
          });
          
          return processedLogs.map(toPhoneLog);
        } catch (dbError) {
          console.error('Failed to fetch phone logs from IndexedDB:', dbError);
        }
      }
      
      // Re-throw original error if we couldn't get from IndexedDB
      throw error;
    }
  }

  static async getById(id: string): Promise<PhoneLog> {
    try {
      const response = await api.phoneLogs.getById(id);
      
      // Cache in IndexedDB if offline mode is enabled
      if (config.features.offlineMode) {
        await db.put('phoneLogs', response, true);
      }
      
      return toPhoneLog(response);
    } catch (error) {
      // If offline mode is enabled, try to get from IndexedDB
      if (config.features.offlineMode) {
        try {
          const cachedLog = await db.get('phoneLogs', id);
          if (cachedLog) return toPhoneLog(cachedLog);
        } catch (dbError) {
          console.error('Failed to fetch phone log from IndexedDB:', dbError);
        }
      }
      throw error;
    }
  }

  static async create(phoneLog: Omit<PhoneLog, 'id' | 'created_at' | 'updated_at'>): Promise<PhoneLog> {
    try {
      // Prepare the data for the API by converting dates
      const phoneLogDTO = toPhoneLogDTO({
        ...phoneLog,
        created_at: new Date(),
        updated_at: new Date()
      });
      
      const response = await api.phoneLogs.create(phoneLogDTO as any);
      return toPhoneLog(response);
    } catch (error) {
      // If offline mode is enabled, store in IndexedDB and sync later
      if (config.features.offlineMode) {
        try {
          const now = new Date();
          const phoneLogData = {
            ...phoneLog,
            id: crypto.randomUUID(),
            created_at: now,
            updated_at: now,
            created_offline: true
          };
          
          // Convert to DTO format to ensure consistent date formats
          const phoneLogDTO = toPhoneLogDTO(phoneLogData as any);
          
          // Make sure id is included
          const finalData = {
            ...phoneLogDTO,
            id: phoneLogData.id
          };
          
          await db.add('phoneLogs', finalData);
          console.log('Phone log stored in offline queue for later sync:', finalData.id);
          return toPhoneLog(finalData);
        } catch (dbError) {
          console.error('Failed to store phone log in IndexedDB:', dbError);
        }
      }
      throw error;
    }
  }

  static async update(id: string, updates: Partial<PhoneLog>): Promise<PhoneLog> {
    try {
      const updatesDTO = toPhoneLogDTO(updates);
      const response = await api.phoneLogs.update(id, updatesDTO);
      return toPhoneLog(response);
    } catch (error) {
      // If offline mode is enabled, update in IndexedDB and sync later
      if (config.features.offlineMode) {
        try {
          // Get current phone log data
          const currentLog = await db.get<PhoneLog>('phoneLogs', id);
          if (currentLog) {
            // Create update object
            const updatesDTO = toPhoneLogDTO({
              ...updates,
              updated_at: new Date()
            });
            
            const updatedLog = {
              ...currentLog,
              ...updatesDTO,
              id // Ensure id is included
            };
            
            await db.put('phoneLogs', updatedLog);
            console.log('Phone log updated in offline queue for later sync');
            return toPhoneLog(updatedLog);
          }
        } catch (dbError) {
          console.error('Failed to update phone log in IndexedDB:', dbError);
        }
      }
      throw error;
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      return api.phoneLogs.delete(id);
    } catch (error) {
      // If offline mode is enabled, mark for deletion in sync queue
      if (config.features.offlineMode) {
        try {
          await db.delete('phoneLogs', id);
          console.log('Phone log marked for deletion in offline queue');
          return;
        } catch (dbError) {
          console.error('Failed to mark phone log for deletion in IndexedDB:', dbError);
        }
      }
      throw error;
    }
  }

  static async getByClientId(clientId: string): Promise<PhoneLog[]> {
    try {
      const response = await api.phoneLogs.getByClientId(clientId);
      return response.map(toPhoneLog);
    } catch (error) {
      // If offline mode is enabled, search in IndexedDB
      if (config.features.offlineMode) {
        try {
          const allLogs = await db.getAll<PhoneLog>('phoneLogs');
          return allLogs
            .filter(log => log.client && log.client.id === clientId)
            .map(toPhoneLog);
        } catch (dbError) {
          console.error('Failed to search phone logs by client ID in IndexedDB:', dbError);
        }
      }
      throw error;
    }
  }

  static async getByPhoneNumber(phoneNumber: string): Promise<PhoneLog[]> {
    try {
      const response = await api.phoneLogs.getByPhoneNumber(phoneNumber);
      return response.map(toPhoneLog);
    } catch (error) {
      // If offline mode is enabled, search in IndexedDB
      if (config.features.offlineMode) {
        try {
          const allLogs = await db.getAll<PhoneLog>('phoneLogs');
          return allLogs
            .filter(log => log.phone_number === phoneNumber)
            .map(toPhoneLog);
        } catch (dbError) {
          console.error('Failed to search phone logs by phone number in IndexedDB:', dbError);
        }
      }
      throw error;
    }
  }
} 