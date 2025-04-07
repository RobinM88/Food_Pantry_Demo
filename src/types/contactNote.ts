export enum ContactMethod {
  Phone = 'phone',
  Email = 'email',
  InPerson = 'in_person',
  Other = 'other'
}

export enum ContactPurpose {
  RequestAssistance = 'request_assistance',
  UpdateInformation = 'update_information',
  SchedulePickup = 'schedule_pickup',
  Other = 'other'
}

export interface ContactNote {
  id: string;
  familySearchId: string;
  contactDate: Date;
  notes: string;
  contactPurpose: ContactPurpose;
  contactMethod: ContactMethod;
  
  createdAt: Date;
  updatedAt: Date;
}

export type NewContactNote = Omit<ContactNote, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateContactNote = Partial<NewContactNote>; 