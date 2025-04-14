import { Client } from './client';

export type RelationshipType = 'Siblings' | 'Parent/Child' | 'Extended Family' | 'Other';

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