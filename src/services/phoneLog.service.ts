import type { PhoneLog } from '../types';
import { api } from './api';

// Convert database response to frontend type
function toPhoneLog(dbLog: any): PhoneLog {
  return {
    id: dbLog.id,
    familySearchId: dbLog.family_search_id,
    phoneNumber: dbLog.phone_number,
    callType: dbLog.call_type,
    callOutcome: dbLog.call_outcome,
    notes: dbLog.notes || '',
    createdAt: new Date(dbLog.created_at),
    updatedAt: new Date(dbLog.updated_at)
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