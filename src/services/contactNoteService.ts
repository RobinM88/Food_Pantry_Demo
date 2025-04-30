import { ContactNote, NewContactNote } from '../types';

const BASE_URL = '/api/contact-notes';

export async function createContactNote(data: NewContactNote): Promise<ContactNote> {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to create contact note');
  }

  return response.json();
}

export async function getContactNotes(familyNumber?: string): Promise<ContactNote[]> {
  const url = familyNumber ? `${BASE_URL}?family_number=${familyNumber}` : BASE_URL;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to fetch contact notes');
  }

  return response.json();
}

export async function getContactNote(id: string): Promise<ContactNote> {
  const response = await fetch(`${BASE_URL}/${id}`);

  if (!response.ok) {
    throw new Error('Failed to fetch contact note');
  }

  return response.json();
}

export async function updateContactNote(id: string, data: Partial<NewContactNote>): Promise<ContactNote> {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update contact note');
  }

  return response.json();
}

export async function deleteContactNote(id: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete contact note');
  }
} 