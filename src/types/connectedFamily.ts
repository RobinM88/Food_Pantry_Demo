import { Client } from './client';

export type RelationshipType = 'Siblings' | 'Parent/Child' | 'Extended Family' | 'Other';

export interface ConnectedFamily {
  id: string;
  clientId: string;
  connectedTo: string;
  relationshipType: RelationshipType;
  client?: Client;
  connectedClient?: Client;
}

export type NewConnectedFamily = Omit<ConnectedFamily, 'id' | 'client' | 'connectedClient'>;
export type UpdateConnectedFamily = Partial<ConnectedFamily> & Pick<ConnectedFamily, 'id'>; 