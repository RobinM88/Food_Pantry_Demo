import { Client } from './client';

export type CallType = 'incoming' | 'outgoing';

export type CallOutcome = 
  | 'successful' 
  | 'voicemail' 
  | 'no_answer' 
  | 'wrong_number' 
  | 'disconnected';

export interface PhoneLog {
  id: string;
  family_number: string;
  phone_number: string;
  call_type: CallType;
  call_outcome: CallOutcome;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  client?: Client;
}

export type NewPhoneLog = Omit<PhoneLog, 'id' | 'created_at' | 'updated_at' | 'client'>;
export type UpdatePhoneLog = Partial<NewPhoneLog>;

// Form state type for managing phone log forms
export interface PhoneLogFormState {
  phone_number: string;
  call_type: CallType;
  call_outcome: CallOutcome;
  notes: string;
  selected_client: Client | null;
  matching_clients: Client[];
  show_new_client_form: boolean;
} 