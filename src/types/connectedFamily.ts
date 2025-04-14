import { Client } from './client';

export type RelationshipType = 'parent' | 'child' | 'spouse' | 'sibling' | 'other';

export interface ConnectedFamily {
  id: string;
  client_id: string;
  connected_to: string;
  relationship_type: RelationshipType;
  client?: Client;
  connected_client?: Client;
}

export type NewConnectedFamily = Omit<ConnectedFamily, 'id' | 'client' | 'connected_client'>;
export type UpdateConnectedFamily = Partial<ConnectedFamily> & Pick<ConnectedFamily, 'id'>; 