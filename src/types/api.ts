import { CallType, CallOutcome } from './phoneLog';

export interface ApiPhoneLog {
  id: string;
  family_search_id: string;
  phone_number: string;
  call_type: CallType;
  call_outcome: CallOutcome;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type NewApiPhoneLog = Omit<ApiPhoneLog, 'id' | 'created_at' | 'updated_at'>;
export type UpdateApiPhoneLog = Partial<NewApiPhoneLog>; 