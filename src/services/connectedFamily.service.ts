import { ConnectedFamily } from '../types/connectedFamily';
import { api } from './api';
import { v4 as uuidv4 } from 'uuid';
import { ClientService } from './client.service';

export const ConnectedFamilyService = {
  async getByClientId(clientId: string) {
    const { data, error } = await api.supabase
      .from('ConnectedFamily')
      .select('*')
      .eq('family_number', clientId);
    
    if (error) throw error;
    return data;
  },

  async create(data: Omit<ConnectedFamily, 'id'>) {
    // Generate a new connected family number if one isn't provided
    const connected_family_number = data.connected_family_number.startsWith('cf') 
      ? data.connected_family_number 
      : await ClientService.generateConnectedFamilyNumber();

    const formattedData = {
      id: uuidv4(),
      family_number: data.family_number,
      connected_family_number,
      relationship_type: data.relationship_type
    };

    console.log('Creating connection with data:', formattedData);

    const { data: newConnection, error } = await api.supabase
      .from('ConnectedFamily')
      .insert([formattedData])
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    return newConnection;
  },

  async delete(id: string) {
    const { error } = await api.supabase
      .from('ConnectedFamily')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async deleteByClientId(clientId: string) {
    const { error } = await api.supabase
      .from('ConnectedFamily')
      .delete()
      .eq('family_number', clientId);
    
    if (error) throw error;
  }
}; 