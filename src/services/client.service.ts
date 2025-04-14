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
  }
}; 