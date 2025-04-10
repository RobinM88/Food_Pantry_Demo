export interface Order {
  id: string;
  familySearchId: string;
  status: OrderStatus;
  pickupDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deliveryType: 'pickup' | 'delivery';
  isNewClient: boolean;
  approvalStatus: 'pending' | 'approved' | 'denied';
  numberOfBoxes: number;
  additionalPeople: {
    adults: number;
    smallChildren: number;
    schoolAged: number;
  };
  seasonalItems: string[];
  visitContact?: string;
}

export type OrderStatus = 'pending' | 'approved' | 'denied' | 'scheduled' | 'ready' | 'picked_up' | 'cancelled' | 'no_show' | 'in_queue';

export type NewOrder = Omit<Order, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateOrder = Partial<NewOrder>; 