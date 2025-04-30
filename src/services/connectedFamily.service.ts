import { ConnectedFamily } from '../types/connectedFamily';
import { api } from './api';
import { v4 as uuidv4 } from 'uuid';
import { ClientService } from './client.service';

export const ConnectedFamilyService = {
  async getByClientId(clientId: string) {
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
    return groupConnections || [];
  },

  async create(data: { family_number: string, connected_family_number: string, relationship_type: string }) {
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

    const { data: newConnections, error } = await api.supabase
      .from('ConnectedFamily')
      .insert(connections)
      .select();
    
    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    return newConnections[0];
  },

  async delete(id: string) {
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
  },

  async deleteByClientId(clientId: string) {
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
  },

  async generateConnectedFamilyNumber() {
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