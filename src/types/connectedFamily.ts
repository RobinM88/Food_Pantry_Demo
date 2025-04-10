import { Client } from './client';

export interface ConnectedFamily {
  id: string;
  clientId: string;
  connectedTo: string;
  client?: Client;
  connectedClient?: Client;
}

export type NewConnectedFamily = Omit<ConnectedFamily, 'id' | 'client' | 'connectedClient'>;
export type UpdateConnectedFamily = Partial<ConnectedFamily> & Pick<ConnectedFamily, 'id'>; 