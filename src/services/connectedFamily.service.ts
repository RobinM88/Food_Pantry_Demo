import { ConnectedFamily } from '../types/connectedFamily';
import { api } from './api';

export const ConnectedFamilyService = {
  async getByClientId(clientId: string) {
    const { data, error } = await api.supabase
      .from('ConnectedFamily')
      .select('*')
      .eq('clientId', clientId);
    
    if (error) throw error;
    return data;
  },

  async create(data: Omit<ConnectedFamily, 'id'>) {
    const { data: newConnection, error } = await api.supabase
      .from('ConnectedFamily')
      .insert([data])
      .select()
      .single();
    
    if (error) throw error;
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
      .eq('clientId', clientId);
    
    if (error) throw error;
  }
}; 