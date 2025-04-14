export type OrderStatus = 
  | 'pending'
  | 'approved'
  | 'denied'
  | 'confirmed'
  | 'ready'
  | 'picked_up'
  | 'completed'
  | 'cancelled';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface Order {
  id: string;
  family_search_id: string;
  status: OrderStatus;
  pickup_date?: Date;
  notes?: string;
  created_at: Date;
  updated_at: Date;
  delivery_type: 'pickup' | 'delivery';
  is_new_client: boolean;
  approval_status: ApprovalStatus;
  number_of_boxes: number;
  additional_people: {
    adults: number;
    small_children: number;
    school_aged: number;
  };
  visit_contact?: string;
}

export type NewOrder = Omit<Order, 'id' | 'created_at' | 'updated_at'>;
export type UpdateOrder = Partial<NewOrder>; 