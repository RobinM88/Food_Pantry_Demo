export interface Order {
  id: string;
  clientId: string;
  status: OrderStatus;
  pickupDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deliveryType: 'pickup' | 'delivery';
  isNewClient: boolean;
  approvalStatus: 'pending' | 'approved' | 'denied';
}

export type OrderStatus = 'pending' | 'approved' | 'denied' | 'scheduled' | 'ready' | 'picked_up' | 'cancelled' | 'no_show';

export type NewOrder = Omit<Order, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateOrder = Partial<NewOrder>; 