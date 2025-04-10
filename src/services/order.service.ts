import type { Order } from '../types';
import { api } from './api';

export class OrderService {
  static async getAll(): Promise<Order[]> {
    return api.orders.getAll();
  }

  static async getById(id: string): Promise<Order> {
    return api.orders.getById(id);
  }

  static async create(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    return api.orders.create(order);
  }

  static async update(id: string, updates: Partial<Order>): Promise<Order> {
    return api.orders.update(id, updates);
  }

  static async delete(id: string): Promise<void> {
    return api.orders.delete(id);
  }

  static async getByClientId(clientId: string): Promise<Order[]> {
    return api.orders.getByClientId(clientId);
  }
} 