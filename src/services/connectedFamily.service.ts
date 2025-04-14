import { ConnectedFamily } from '../types/connectedFamily';
import { api } from './api';

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
      client_id: data.clientId,
      connected_to: data.connectedTo,
      relationship_type: data.relationshipType
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