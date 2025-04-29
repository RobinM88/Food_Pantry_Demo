import { Order } from './order';
import { PhoneLog } from './phoneLog';
import { ConnectedFamily } from './connectedFamily';

export enum MemberStatus {
  Active = 'active',
  Inactive = 'inactive',
  Pending = 'pending',
  Suspended = 'suspended',
  Banned = 'banned',
  Denied = 'denied'
}

export interface Client {
  id: string;
  family_number: string;
  first_name: string;
  last_name: string;
  email?: string;
  address: string;
  apt_number?: string;
  zip_code: string;
  phone1: string;
  phone2?: string;
  is_unhoused: boolean;
  is_temporary: boolean;
  member_status: MemberStatus;
  family_size: number;
  adults: number;
  school_aged: number;
  small_children: number;
  temporary_members?: {
    adults: number;
    school_aged: number;
    small_children: number;
  };
  food_notes?: string;
  office_notes?: string;
  total_visits: number;
  total_this_month: number;
  last_visit?: Date | null;
  created_at: Date;
  updated_at: Date;
  orders?: Order[];
  phone_logs?: PhoneLog[];
  connected_families?: ConnectedFamily[];
}

export type NewClient = Omit<Client, 'id' | 'created_at' | 'updated_at' | 'orders' | 'phone_logs' | 'connected_families'>;

export const defaultNewClient: NewClient = {
  family_number: '',
  first_name: '',
  last_name: '',
  phone1: '',
  phone2: '',
  email: '',
  address: '',
  apt_number: '',
  zip_code: '',
  member_status: MemberStatus.Pending,
  is_unhoused: false,
  is_temporary: false,
  family_size: 1,
  adults: 1,
  school_aged: 0,
  small_children: 0,
  temporary_members: {
    adults: 0,
    school_aged: 0,
    small_children: 0
  },
  food_notes: '',
  office_notes: '',
  last_visit: null,
  total_visits: 0,
  total_this_month: 0
};

export type UpdateClient = Partial<NewClient>; 