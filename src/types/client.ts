// Enums for standardization
export enum MemberStatus {
  Active = 'active',
  Inactive = 'inactive',
  Pending = 'pending',
  Suspended = 'suspended',
  Banned = 'banned',
  Denied = 'denied'
}

export interface Client {
  // Primary identifiers
  id: string;
  family_number: string;
  
  // Basic information
  first_name: string;
  last_name: string;
  email?: string;
  address?: string;
  apt_number?: string;
  zip_code?: string;
  phone1: string;
  phone2?: string;
  
  // Status flags
  is_unhoused: boolean;
  is_temporary: boolean;
  
  // Household composition
  adults: number;
  school_aged: number;
  small_children: number;
  family_size?: number;
  
  // Connected families
  connected_families?: string[];
  
  // Temporary family members
  temporary_members?: {
    adults: number;
    school_aged: number;
    small_children: number;
  };
  
  // Notes and additional information
  food_notes?: string;
  office_notes?: string;
  
  // Tracking and status
  member_status: MemberStatus;
  total_visits: number;
  total_this_month: number;
  
  // System fields
  created_at: string;
  updated_at: string;
  last_visit?: string | null;
}

export interface NewClient {
  family_number: string;
  first_name: string;
  last_name: string;
  email?: string;
  address?: string;
  apt_number?: string;
  zip_code?: string;
  phone1: string;
  phone2?: string;
  is_unhoused: boolean;
  is_temporary: boolean;
  adults: number;
  school_aged: number;
  small_children: number;
  family_size?: number;
  temporary_members?: {
    adults: number;
    school_aged: number;
    small_children: number;
  };
  food_notes?: string;
  office_notes?: string;
  member_status: MemberStatus;
  total_visits: number;
  total_this_month: number;
}

// Default values for new clients
export const defaultNewClient: NewClient = {
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
  office_notes: ''
};

export type UpdateClient = Partial<NewClient>; 