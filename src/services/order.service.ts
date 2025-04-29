import { Database } from '../types/database.types';
import { api } from './api';

type Order = Database['public']['Tables']['Order']['Row'];
type OrderInsert = Database['public']['Tables']['Order']['Insert'];
type OrderUpdate = Database['public']['Tables']['Order']['Update'];

export const OrderService = {
  getAll: async () => {
    return api.orders.getAll();
  },

  getById: async (id: string) => {
    return api.orders.getById(id);
  },

  getByFamilyNumber: async (familyNumber: string) => {
    return api.orders.getByFamilyNumber(familyNumber);
  },

  create: async (orderData: Omit<OrderInsert, 'id' | 'created_at' | 'updated_at'>) => {
    // Set default values
    const now = new Date().toISOString();
    const defaultData: OrderInsert = {
      ...orderData,
      status: orderData.status || 'pending',
      delivery_type: orderData.delivery_type || 'pickup',
      is_new_client: orderData.is_new_client || false,
      approval_status: orderData.approval_status || 'pending',
      number_of_boxes: orderData.number_of_boxes || 1,
      additional_people: orderData.additional_people || {
        adults: 0,
        small_children: 0,
        school_aged: 0
      },
      created_at: now,
      updated_at: now
    };

    return api.orders.create(defaultData);
  },

  update: async (id: string, updates: Partial<OrderUpdate>) => {
    const updateData: OrderUpdate = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    return api.orders.update(id, updateData);
  },

  delete: async (id: string) => {
    return api.orders.delete(id);
  }
}; 