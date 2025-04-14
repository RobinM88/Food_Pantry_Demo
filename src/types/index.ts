import { Order } from './order';
import { CallType, CallOutcome } from './phoneLog';

export * from './client';
export * from './order';
export * from './phoneLog';

export type PhoneLog = {
  id: string;
  familySearchId: string;
  phoneNumber: string;
  callType: CallType;
  callOutcome: CallOutcome;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type NewOrder = Omit<Order, 'id'>;
export type UpdateOrder = Partial<Order> & Pick<Order, 'id'>;

export const REQUIRED_FIELDS = {
  first_name: 'First Name',
  last_name: 'Last Name',
  phone1: 'Primary Phone',
  zip_code: 'ZIP Code',
  address: 'Address (required unless unhoused)'
} as const;

export const DEFAULT_VALUES = {
  family_number: '',
  first_name: '',
  last_name: '',
  address: '',
  apt_number: '',
  zip_code: '',
  phone1: '',
  phone2: '',
  email: '',
  adults: 1,
  school_aged: 0,
  small_children: 0,
  family_size: 1,
  is_unhoused: false,
  is_temporary: false,
  temporary_members: {
    adults: 0,
    school_aged: 0,
    small_children: 0
  },
  member_status: 'pending',
  total_visits: 0,
  total_this_month: 0,
  food_notes: '',
  office_notes: ''
} as const; 