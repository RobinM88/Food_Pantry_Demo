import { Client } from './client';

export type CallType = 'incoming' | 'outgoing';
export type CallOutcome = 'successful' | 'voicemail' | 'no_answer' | 'wrong_number' | 'disconnected';

export interface PhoneLog {
  id: string;
  familySearchId: string;
  phoneNumber: string;
  callType: CallType;
  callOutcome: CallOutcome;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PhoneLogFormState {
  phoneNumber: string;
  callType: CallType;
  callOutcome: CallOutcome;
  notes: string;
  selectedClient: Client | null;
  matchingClients: Client[];
  showNewClientForm: boolean;
}

export type NewPhoneLog = Omit<PhoneLog, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdatePhoneLog = Partial<NewPhoneLog>; 