import { ConnectedFamily } from '../types/connectedFamily';
import { api } from './api';
import { v4 as uuidv4 } from 'uuid';

export const ConnectedFamilyService = {
  async getByClientId(clientId: string) {
    const { data, error } = await api.supabase
      .from('ConnectedFamily')
      .select('*')
      .eq('client_id', clientId);
    
    if (error) throw error;
    return data;
  },

  async create(data: Omit<ConnectedFamily, 'id'>) {
    const formattedData = {
      id: uuidv4(),
      client_id: data.client_id,
      connected_to: data.connected_to,
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
      .eq('client_id', clientId);
    
    if (error) throw error;
  }
}; 