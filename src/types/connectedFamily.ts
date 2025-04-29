import { RelationshipType } from './index';
import { Client } from './client';

export interface ConnectedFamily {
  id: string;
  family_number: string;
  connected_family_number: string;
  relationship_type: RelationshipType;
}

// For backward compatibility with existing code
export interface ConnectedFamilyLegacy {
  id: string;
  client_id: string;
  connected_to: string;
  relationship_type: RelationshipType;
}

export type NewConnectedFamily = Omit<ConnectedFamily, 'id' | 'client'>;
export type UpdateConnectedFamily = Partial<NewConnectedFamily>; 