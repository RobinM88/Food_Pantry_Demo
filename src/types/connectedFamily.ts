import { RelationshipType } from './index';
import { Client } from './client';

export interface ConnectedFamily {
  id: string;
  family_number: string;
  connected_family_number: string;
  relationship_type: RelationshipType;
}

/**
 * @deprecated Use ConnectedFamily interface instead
 */
export interface ConnectedFamilyLegacy {
  id: string;
  family_number: string;
  connected_family_number: string;
  relationship_type: RelationshipType;
}

export type NewConnectedFamily = Omit<ConnectedFamily, 'id' | 'client'>;
export type UpdateConnectedFamily = Partial<NewConnectedFamily>; 