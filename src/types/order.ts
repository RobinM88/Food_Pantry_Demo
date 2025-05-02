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

export type DeliveryType = 'pickup' | 'delivery';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

// Raw order data as it comes from the API
export interface OrderDTO {
  id: string;
  family_number: string;
  status: OrderStatus;
  pickup_date: string | null;
  notes: string | null;
  delivery_type: DeliveryType;
  is_new_client: boolean;
  approval_status: ApprovalStatus;
  number_of_boxes: number;
  additional_people: {
    adults: number;
    school_aged: number;
    small_children: number;
  };
  visit_contact: string | null;
  created_at: string;
  updated_at: string;
  created_offline?: boolean;
  Client?: {
    first_name: string;
    last_name: string;
  };
}

// Order with Date objects for use in the application
export interface Order {
  id: string;
  family_number: string;
  status: OrderStatus;
  pickup_date: Date | null;
  notes: string | null;
  delivery_type: DeliveryType;
  is_new_client: boolean;
  approval_status: ApprovalStatus;
  number_of_boxes: number;
  additional_people: {
    adults: number;
    school_aged: number;
    small_children: number;
  };
  visit_contact: string | null;
  created_at: Date;
  updated_at: Date;
  created_offline?: boolean;
  Client?: {
    first_name: string;
    last_name: string;
  };
}

export type NewOrder = Omit<Order, 'id' | 'created_at' | 'updated_at' | 'Client'>;
export type UpdateOrder = Partial<NewOrder>; 