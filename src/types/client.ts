// Enums for standardization
export enum MemberStatus {
  Active = 'active',
  Inactive = 'inactive',
  Pending = 'pending'
}

export interface Client {
  // Primary identifiers
  familyNumber: string;
  searchKey: string;          // Calculated: firstName + lastName + familyNumber
  
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
  familySize: number;         // Calculated: adults + schoolAged + smallChildren
  
  // Temporary family members (if isTemporary is true)
  temporaryMembers?: {
    adults: number;
    schoolAged: number;
    smallChildren: number;
  };
  
  // Notes and additional information
  foodNotes?: string;
  officeNotes?: string;
  
  // Tracking and relationships
  totalVisits: number;        // Calculated from ServiceRequests
  totalThisMonth: number;     // Calculated from ServiceRequests
  connectedFamilies?: string[]; // Array of related familyNumbers
  memberStatus: MemberStatus;
  
  // Address and phone verification
  softAddressCheck?: number;  // Calculated: count of common addresses
  hardAddressCheck?: number;  // Calculated: count of exact address matches
  phoneCheck1?: number;       // Calculated: count of common phone1
  phoneCheck2?: number;       // Calculated: count of common phone2
  
  // System fields
  createdAt: Date;
  updatedAt: Date;
  lastVisit?: Date;
}

export interface NewClient {
  familyNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  address: string;
  aptNumber?: string;
  zipCode: string;
  phone1: string;
  phone2?: string;
  isUnhoused: boolean;
  isTemporary: boolean;
  adults: number;
  schoolAged: number;
  smallChildren: number;
  temporaryMembers: {
    adults: number;
    schoolAged: number;
    smallChildren: number;
  };
  foodNotes?: string;
  officeNotes?: string;
  connectedFamilies?: string[];
  memberStatus: MemberStatus;
}

export type UpdateClient = Partial<NewClient>; 