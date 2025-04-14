export type OrderStatus = 
  | 'pending'
  | 'approved'
  | 'denied'
  | 'confirmed'
  | 'ready'
  | 'out_for_delivery'
  | 'picked_up'
  | 'delivered'
  | 'no_show'
  | 'failed_delivery'
  | 'cancelled'
  | 'scheduled'
  | 'in_queue'
  | 'completed';

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