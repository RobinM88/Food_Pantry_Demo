import type { PhoneLog } from '../types';
import { api } from './api';

// Convert database response to frontend type
function toPhoneLog(dbLog: any): PhoneLog {
  return {
    id: dbLog.id,
    family_number: dbLog.family_number,
    phone_number: dbLog.phone_number,
    call_type: dbLog.call_type,
    call_outcome: dbLog.call_outcome,
    notes: dbLog.notes || '',
    created_at: dbLog.created_at ? new Date(dbLog.created_at) : new Date(),
    updated_at: dbLog.updated_at ? new Date(dbLog.updated_at) : new Date()
  };
}

export class PhoneLogService {
  static async getAll(): Promise<PhoneLog[]> {
    const response = await api.phoneLogs.getAll();
    return response.map(toPhoneLog);
  }

  static async getById(id: string): Promise<PhoneLog> {
    const response = await api.phoneLogs.getById(id);
    return toPhoneLog(response);
  }

  static async create(phoneLog: Omit<PhoneLog, 'id' | 'createdAt' | 'updatedAt'>): Promise<PhoneLog> {
    const response = await api.phoneLogs.create(phoneLog);
    return toPhoneLog(response);
  }

  static async update(id: string, updates: Partial<PhoneLog>): Promise<PhoneLog> {
    const response = await api.phoneLogs.update(id, updates);
    return toPhoneLog(response);
  }

  static async delete(id: string): Promise<void> {
    return api.phoneLogs.delete(id);
  }

  static async getByClientId(clientId: string): Promise<PhoneLog[]> {
    const response = await api.phoneLogs.getByClientId(clientId);
    return response.map(toPhoneLog);
  }

  static async getByPhoneNumber(phoneNumber: string): Promise<PhoneLog[]> {
    const response = await api.phoneLogs.getByPhoneNumber(phoneNumber);
    return response.map(toPhoneLog);
  }
} 