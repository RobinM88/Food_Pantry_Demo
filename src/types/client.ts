// Enums for standardization
export enum MemberStatus {
  Active = 'active',
  Inactive = 'inactive',
  Pending = 'pending',
  Suspended = 'suspended',
  Banned = 'banned'
}

export interface Client {
  // Primary identifiers
  familyNumber: string;
  
  // Basic information
  firstName: string;
  lastName: string;
  email?: string;
  address: string;
  aptNumber?: string;
  zipCode: string;
  phone1: string;
  phone2?: string;
  
  // Status flags
  isUnhoused: boolean;
  isTemporary: boolean;
  
  // Household composition
  adults: number;
  schoolAged: number;
  smallChildren: number;
  familySize: number; // Total family size including temporary members
  
  // Temporary family members (only present if isTemporary is true)
  temporaryMembers?: {
    adults: number;
    schoolAged: number;
    smallChildren: number;
  };
  
  // Notes and additional information
  foodNotes?: string;
  officeNotes?: string;
  
  // Tracking and relationships
  connectedFamilies?: string[]; // Array of related familyNumbers
  memberStatus: MemberStatus;
  totalVisits: number;
  totalThisMonth: number;
  
  // System fields
  createdAt: Date;
  updatedAt: Date;
  lastVisit?: Date;
}

export interface NewClient {
  // Primary identifiers
  familyNumber: string;
  
  // Basic information
  firstName: string;
  lastName: string;
  email?: string;
  address: string;
  aptNumber?: string;
  zipCode: string;
  phone1: string;
  phone2?: string;
  
  // Status flags
  isUnhoused: boolean;
  isTemporary: boolean;
  
  // Household composition
  adults: number;
  schoolAged: number;
  smallChildren: number;
  
  // Temporary family members (only present if isTemporary is true)
  temporaryMembers?: {
    adults: number;
    schoolAged: number;
    smallChildren: number;
  };
  
  // Notes and additional information
  foodNotes?: string;
  officeNotes?: string;
  
  // Tracking and relationships
  connectedFamilies?: string[]; // Array of related familyNumbers
  memberStatus: MemberStatus;
  totalVisits: number;
  totalThisMonth: number;
}

// Default values for new clients
export const defaultNewClient: NewClient = {
  familyNumber: '',
  firstName: '',
  lastName: '',
  address: '',
  aptNumber: '',
  zipCode: '',
  phone1: '',
  phone2: '',
  email: '',
  adults: 1,
  schoolAged: 0,
  smallChildren: 0,
  isUnhoused: false,
  isTemporary: false,
  temporaryMembers: {
    adults: 0,
    schoolAged: 0,
    smallChildren: 0
  },
  memberStatus: MemberStatus.Pending,
  totalVisits: 0,
  totalThisMonth: 0,
  foodNotes: '',
  officeNotes: '',
  connectedFamilies: []
};

export type UpdateClient = Partial<NewClient>; 