import type { PhoneLog } from '../types';
import { api } from './api';

export class PhoneLogService {
  static async getAll(): Promise<PhoneLog[]> {
    return api.phoneLogs.getAll();
  }

  static async getById(id: string): Promise<PhoneLog> {
    return api.phoneLogs.getById(id);
  }

  static async create(phoneLog: Omit<PhoneLog, 'id' | 'createdAt' | 'updatedAt'>): Promise<PhoneLog> {
    return api.phoneLogs.create(phoneLog);
  }

  static async update(id: string, updates: Partial<PhoneLog>): Promise<PhoneLog> {
    return api.phoneLogs.update(id, updates);
  }

  static async delete(id: string): Promise<void> {
    return api.phoneLogs.delete(id);
  }

  static async getByClientId(clientId: string): Promise<PhoneLog[]> {
    return api.phoneLogs.getByClientId(clientId);
  }

  static async getByPhoneNumber(phoneNumber: string): Promise<PhoneLog[]> {
    return api.phoneLogs.getByPhoneNumber(phoneNumber);
  }
} 