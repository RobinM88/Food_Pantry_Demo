export interface Order {
  id: string;
  clientId: string;
  items: OrderItem[];
  status: OrderStatus;
  pickupDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  category: string;
  notes?: string;
}

export type OrderStatus = 'pending' | 'approved' | 'denied' | 'confirmed' | 'ready' | 'picked_up' | 'cancelled' | 'scheduled' | 'no_show';

export type NewOrder = Omit<Order, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateOrder = Partial<NewOrder>; 