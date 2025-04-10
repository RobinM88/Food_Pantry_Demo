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
  approvalStatus: ApprovalStatus;
  numberOfBoxes: number;
  additionalPeople: {
    adults: number;
    smallChildren: number;
    schoolAged: number;
  };
  visitContact?: string;
}

export type OrderStatus = 'pending' | 'approved' | 'completed' | 'cancelled' | 'scheduled' | 'ready' | 'picked_up' | 'no_show' | 'in_queue';
export type ApprovalStatus = 'pending' | 'approved' | 'denied';

export type NewOrder = Omit<Order, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateOrder = Partial<NewOrder>; 