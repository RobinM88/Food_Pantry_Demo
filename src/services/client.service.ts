import type { Client } from '../types';
import { api } from './api';

export const ClientService = {
  async getAll() {
    return api.clients.getAll();
  },

  async getById(id: string) {
    const clients = await api.clients.getAll();
    return clients.find(c => c.id === id);
  },

  async create(data: Omit<Client, 'id' | 'created_at' | 'updated_at'>) {
    // Ensure all fields are in snake_case before sending to API
    return api.clients.create(data);
  },

  async update(id: string, data: Partial<Client>) {
    // Ensure all fields are in snake_case before sending to API
    return api.clients.update(id, data);
  },

  async delete(id: string) {
    return api.clients.delete(id);
  },

  async getByPhone(phone: string) {
    return api.clients.getByPhone(phone);
  },

  async generateFamilyNumber() {
    const { data: lastClient } = await api.supabase
      .from('Client')
      .select('family_number')
      .order('family_number', { ascending: false })
      .limit(1);

    let nextNumber = 1;
    if (lastClient && lastClient.length > 0) {
      const lastNumber = parseInt(lastClient[0].family_number.substring(1));
      nextNumber = lastNumber + 1;
    }

    return `f${nextNumber.toString().padStart(4, '0')}`;
  },

  async generateConnectedFamilyNumber() {
    const { data: lastConnection } = await api.supabase
      .from('ConnectedFamily')
      .select('connected_family_number')
      .order('connected_family_number', { ascending: false })
      .limit(1);

    let nextNumber = 1;
    if (lastConnection && lastConnection.length > 0) {
      const lastNumber = parseInt(lastConnection[0].connected_family_number.substring(2));
      nextNumber = lastNumber + 1;
    }

    return `cf${nextNumber.toString().padStart(4, '0')}`;
  }
}; 