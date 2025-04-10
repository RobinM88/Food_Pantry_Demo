import { Client } from './client';

export type CallType = 'incoming' | 'outgoing';
export type CallOutcome = 'completed' | 'voicemail' | 'no_answer' | 'wrong_number';

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