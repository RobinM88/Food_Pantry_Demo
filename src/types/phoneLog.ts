export interface PhoneLog {
  id: string;
  clientId: string;
  callDate: Date;
  callType: CallType;
  outcome: CallOutcome;
  notes: string;
  followUpRequired: boolean;
  followUpDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type CallType = 'incoming' | 'outgoing';

export type CallOutcome = 
  | 'order-placed'
  | 'order-updated'
  | 'order-cancelled'
  | 'information-request'
  | 'no-answer'
  | 'wrong-number'
  | 'other';

export type NewPhoneLog = Omit<PhoneLog, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdatePhoneLog = Partial<NewPhoneLog>; 