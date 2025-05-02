// Define the missing types based on the Prisma schema
type OrderStatus = 
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

type DeliveryType = 'pickup' | 'delivery';

type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface Database {
  public: {
    Tables: {
      Client: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          // Add all your client fields here
          family_number?: string;
          first_name: string;
          last_name: string;
          email?: string;
          address?: string;
          apt_number?: string;
          zip_code?: string;
          phone1?: string;
          phone2?: string;
          is_unhoused?: boolean;
          is_temporary?: boolean;
          adults?: number;
          school_aged?: number;
          small_children?: number;
          temporary_members?: number;
          family_size?: number;
          food_notes?: string;
          office_notes?: string;
          total_visits?: number;
          total_this_month?: number;
          member_status?: string;
          last_visit?: string;
        };
        Insert: Omit<Database['public']['Tables']['Client']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['Client']['Insert']>;
      };
      ConnectedFamily: {
        Row: {
          id: string;
          family_number: string;
          connected_family_number: string;
          relationship_type: string;
        };
        Insert: {
          id?: string;
          family_number: string;
          connected_family_number: string;
          relationship_type?: string;
        };
        Update: {
          id?: string;
          family_number?: string;
          connected_family_number?: string;
          relationship_type?: string;
        };
      };
      Order: {
        Row: {
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
        };
        Insert: {
          id?: string;
          family_number: string;
          status?: OrderStatus;
          pickup_date?: string | null;
          notes?: string | null;
          delivery_type?: DeliveryType;
          is_new_client?: boolean;
          approval_status?: ApprovalStatus;
          number_of_boxes?: number;
          additional_people?: {
            adults: number;
            school_aged: number;
            small_children: number;
          };
          visit_contact?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          family_number?: string;
          status?: OrderStatus;
          pickup_date?: string | null;
          notes?: string | null;
          delivery_type?: DeliveryType;
          is_new_client?: boolean;
          approval_status?: ApprovalStatus;
          number_of_boxes?: number;
          additional_people?: {
            adults: number;
            school_aged: number;
            small_children: number;
          };
          visit_contact?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
} 