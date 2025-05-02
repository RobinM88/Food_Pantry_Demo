import { api } from './api';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../lib/indexedDB';
import { config } from '../config';
import { STORES } from '../lib/indexedDB';
import type { Client } from '../types';

export const ConnectedFamilyService = {
  async getByClientId(clientId: string) {
    try {
      // First, get this client's connection group
      const { data: connections, error } = await api.supabase
        .from('ConnectedFamily')
        .select('*')
        .eq('family_number', clientId);
      
      if (error) throw error;

      if (!connections || connections.length === 0) return [];

      // Then get all families in the same connection groups
      const connectionGroups = connections.map(c => c.connected_family_number);
      const { data: groupConnections, error: groupError } = await api.supabase
        .from('ConnectedFamily')
        .select('*')
        .in('connected_family_number', connectionGroups);

      if (groupError) throw groupError;
      
      // If offline mode is enabled, cache the results
      if (config.features.offlineMode) {
        try {
          // Store connected families in IndexedDB using the correct store constant
          for (const connection of groupConnections || []) {
            await db.put(STORES.CONNECTED_FAMILIES, connection, true);
          }
          console.log('Successfully cached connected families in IndexedDB');
        } catch (err) {
          console.warn('Failed to cache connected families in IndexedDB:', err);
        }
      }
      
      return groupConnections || [];
    } catch (error) {
      console.error('Error fetching connected families from API:', error);
      
      // If offline mode is enabled, try to get from IndexedDB
      if (config.features.offlineMode) {
        console.log('Falling back to IndexedDB for connected families...');
        try {
          const allConnections = await db.getAll(STORES.CONNECTED_FAMILIES);
          
          // Filter connections related to this client
          const clientConnections = allConnections.filter(
            conn => conn.family_number === clientId
          );
          
          if (clientConnections.length === 0) {
            return [];
          }
          
          // Get all connections in the same groups
          const connectionGroups = clientConnections.map(c => c.connected_family_number);
          const groupConnections = allConnections.filter(
            conn => connectionGroups.includes(conn.connected_family_number)
          );
          
          console.log(`Found ${groupConnections.length} connected families in IndexedDB`);
          return groupConnections;
        } catch (dbError) {
          console.error('Failed to fetch connected families from IndexedDB:', dbError);
          return [];
        }
      }
      
      // Return empty array to prevent UI errors
      return [];
    }
  },

  async create(data: { family_number: string, connected_family_number: string, relationship_type: string }) {
    try {
      // Generate a new cf number if not provided
      const cfNumber = data.connected_family_number.startsWith('cf') 
        ? data.connected_family_number 
        : await this.generateConnectedFamilyNumber();

      // Create connection records for both families
      const connections = [
        {
          id: uuidv4(),
          family_number: data.family_number,
          connected_family_number: cfNumber,
          relationship_type: data.relationship_type
        }
      ];

      console.log('Creating connection with data:', connections);
      
      // Check if we're offline before even trying the API call
      if (!navigator.onLine && config.features.offlineMode) {
        throw new Error('Device is offline, creating connection locally');
      }

      const { data: newConnections, error } = await api.supabase
        .from('ConnectedFamily')
        .insert(connections)
        .select();
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      return newConnections[0];
    } catch (error) {
      console.log('Error in connection creation, checking if offline:', error);
      
      // If offline mode is enabled, store in IndexedDB and sync later
      if (config.features.offlineMode) {
        try {
          // Generate a new cf number if not provided
          const cfNumber = data.connected_family_number.startsWith('cf') 
            ? data.connected_family_number 
            : `cfTMP${Date.now().toString().slice(-6)}`;
            
          const connectionData = {
            id: uuidv4(),
            family_number: data.family_number,
            connected_family_number: cfNumber,
            relationship_type: data.relationship_type,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_offline: true
          };
          
          await db.add(STORES.CONNECTED_FAMILIES, connectionData);
          console.log('Connection stored in offline queue for later sync:', connectionData.id);
          return connectionData;
        } catch (dbError) {
          console.error('Failed to store connection in IndexedDB:', dbError);
          throw dbError;
        }
      }
      throw error;
    }
  },

  async delete(id: string) {
    try {
      // Check if we're offline before even trying the API call
      if (!navigator.onLine && config.features.offlineMode) {
        throw new Error('Device is offline, deleting connection locally');
      }
      
      // First get the connection to find its group
      const { data: connection, error: getError } = await api.supabase
        .from('ConnectedFamily')
        .select('*')
        .eq('id', id)
        .single();

      if (getError) throw getError;

      // Delete all connections in this group
      const { error } = await api.supabase
        .from('ConnectedFamily')
        .delete()
        .eq('connected_family_number', connection.connected_family_number);
      
      if (error) throw error;
    } catch (error) {
      console.log('Error in connection deletion, checking if offline:', error);
      
      // If offline mode is enabled, mark for deletion in sync queue
      if (config.features.offlineMode) {
        try {
          // Get the connection to find its group
          const connection = await db.get(STORES.CONNECTED_FAMILIES, id);
          if (connection) {
            // Delete all connections with the same connected_family_number
            const allConnections = await db.getAll(STORES.CONNECTED_FAMILIES);
            const groupConnections = allConnections.filter(
              conn => conn.connected_family_number === connection.connected_family_number
            );
            
            // Delete each connection in the group
            for (const conn of groupConnections) {
              await db.delete(STORES.CONNECTED_FAMILIES, conn.id);
            }
            
            console.log('Connections marked for deletion in offline queue');
            return true;
          } else {
            throw new Error('Connection not found in offline storage');
          }
        } catch (dbError) {
          console.error('Failed to mark connections for deletion in IndexedDB:', dbError);
          // Return true anyway to prevent UI errors
          return true;
        }
      }
      throw error;
    }
  },

  async deleteByClientId(clientId: string) {
    try {
      // Check if we're offline before even trying the API call
      if (!navigator.onLine && config.features.offlineMode) {
        throw new Error('Device is offline, deleting connections locally');
      }
      
      // First get all connection groups this client is part of
      const { data: connections, error: getError } = await api.supabase
        .from('ConnectedFamily')
        .select('connected_family_number')
        .eq('family_number', clientId);

      if (getError) throw getError;

      if (!connections || connections.length === 0) return;

      // Delete all connections in these groups
      const { error } = await api.supabase
        .from('ConnectedFamily')
        .delete()
        .in('connected_family_number', connections.map(c => c.connected_family_number));
      
      if (error) throw error;
    } catch (error) {
      console.log('Error in client connections deletion, checking if offline:', error);
      
      // If offline mode is enabled, handle deletion in IndexedDB
      if (config.features.offlineMode) {
        try {
          // Get all connections for this client
          const allConnections = await db.getAll(STORES.CONNECTED_FAMILIES);
          const clientConnections = allConnections.filter(conn => conn.family_number === clientId);
          
          if (clientConnections.length === 0) return;
          
          // Get all connection groups this client is part of
          const connectionGroups = clientConnections.map(c => c.connected_family_number);
          
          // Delete all connections in these groups
          for (const conn of allConnections) {
            if (connectionGroups.includes(conn.connected_family_number)) {
              await db.delete(STORES.CONNECTED_FAMILIES, conn.id);
            }
          }
          
          console.log('Client connections marked for deletion in offline queue');
          return;
        } catch (dbError) {
          console.error('Failed to mark client connections for deletion in IndexedDB:', dbError);
          return;
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
        .like('connected_family_number', 'cf%')
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

  // Helper function to convert between family number formats
  convertFamilyNumber(familyNumber: string, addPrefix: boolean = true): string {
    if (addPrefix) {
      return familyNumber.startsWith('cf') ? familyNumber : `cf${familyNumber}`;
    } else {
      return familyNumber.startsWith('cf') ? familyNumber.substring(2) : familyNumber;
    }
  }
}; 