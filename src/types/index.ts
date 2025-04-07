export * from './client';
export * from './order';
export * from './phoneLog';

export type PhoneLog = {
  id: string;
  familySearchId: string;
  phoneNumber: string;
  callType: 'incoming' | 'outgoing';
  callOutcome: 'completed' | 'voicemail' | 'no_answer' | 'wrong_number';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};

export interface Order {
  id: string;
  familySearchId: string;
  status: 'pending' | 'scheduled' | 'picked_up' | 'cancelled' | 'no_show';
  pickupDate: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type NewOrder = Omit<Order, 'id'>;
export type UpdateOrder = Partial<Order> & Pick<Order, 'id'>; 