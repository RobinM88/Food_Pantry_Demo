export interface PhoneLog {
  id: string;
  familySearchId: string;
  phoneNumber: string;
  callType: 'incoming' | 'outgoing';
  callOutcome: 'completed' | 'voicemail' | 'no_answer' | 'wrong_number';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type NewPhoneLog = Omit<PhoneLog, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdatePhoneLog = Partial<NewPhoneLog>; 