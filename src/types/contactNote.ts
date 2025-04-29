import { ContactMethod, ContactPurpose } from './index';

export interface ContactNote {
  id: string;
  family_search_id: string;
  contact_method: ContactMethod;
  contact_purpose: ContactPurpose;
  notes: string;
  contact_date: Date;
  created_at: Date;
  updated_at: Date;
}

export type NewContactNote = Omit<ContactNote, 'id' | 'created_at' | 'updated_at'>;
export type UpdateContactNote = Partial<NewContactNote>; 