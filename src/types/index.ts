// Base types and enums used across multiple files
export type ContactMethod = 'phone' | 'email' | 'in-person' | 'text' | 'other';
export type ContactPurpose = 'general' | 'scheduling' | 'follow-up' | 'emergency' | 'other';
export type RelationshipType = 'parent' | 'child' | 'spouse' | 'sibling' | 'other';

// Re-export types from individual files
export * from './client';
export * from './order';
export * from './phoneLog';
export * from './contactNote';
export * from './connectedFamily';

// Import Order type for use in Client interface
import { Order } from './order';

// Base types and enums
export type CallType = 'incoming' | 'outgoing';
export type CallOutcome = 'successful' | 'voicemail' | 'no_answer' | 'wrong_number' | 'disconnected';
export type OrderStatus = 
  | 'pending'
  | 'approved'
  | 'denied'
  | 'confirmed'
  | 'ready'
  | 'out_for_delivery'
  | 'picked_up'
  | 'delivered'
  | 'no_show'
  | 'failed_delivery'
  | 'cancelled'
  | 'scheduled'
  | 'in_queue'
  | 'completed';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export enum MemberStatus {
  Active = 'active',
  Inactive = 'inactive',
  Pending = 'pending',
  Suspended = 'suspended',
  Banned = 'banned',
  Denied = 'denied'
}

// Client types
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

// Phone Log types
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

// Contact Note types
export interface ContactNote {
  id: string;
  family_number: string;
  contact_method: ContactMethod;
  contact_purpose: ContactPurpose;
  notes: string;
  contact_date: Date;
  created_at: Date;
  updated_at: Date;
  client?: Client;
}

// Connected Family types
export interface ConnectedFamily {
  id: string;
  family_number: string;
  connected_family_number: string;
  relationship_type: RelationshipType;
  client?: Client;
}

// Derived types
export type NewClient = Omit<Client, 'id' | 'created_at' | 'updated_at' | 'orders' | 'phone_logs' | 'connected_families'>;
export type UpdateClient = Partial<NewClient>;

export type NewPhoneLog = Omit<PhoneLog, 'id' | 'created_at' | 'updated_at' | 'client'>;
export type UpdatePhoneLog = Partial<NewPhoneLog>;

export type NewContactNote = Omit<ContactNote, 'id' | 'created_at' | 'updated_at' | 'client'>;
export type UpdateContactNote = Partial<NewContactNote>;

export type NewConnectedFamily = Omit<ConnectedFamily, 'id' | 'client'>;
export type UpdateConnectedFamily = Partial<NewConnectedFamily>;

// Constants
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
  member_status: MemberStatus.Pending,
  total_visits: 0,
  total_this_month: 0,
  food_notes: '',
  office_notes: '',
  last_visit: null
} as const; 