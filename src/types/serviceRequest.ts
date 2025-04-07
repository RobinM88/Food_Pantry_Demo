export enum VisitType {
  PickUp = 'pick_up',
  Delivery = 'delivery',
  ProxyPickUp = 'proxy_pick_up'
}

export enum VisitStatus {
  Pending = 'pending',
  Scheduled = 'scheduled',
  Completed = 'completed',
  NoShow = 'no_show',
  Cancelled = 'cancelled'
}

export interface ServiceRequest {
  id: string;
  familySearchId: string;
  requestDate: Date;
  notes: string;
  contactMethod: ContactMethod;
  actionTaken: string;
  assignedVisitDate: Date;
  
  // Additional people for this specific visit
  additionalPeople: {
    adults: number;
    smallChildren: number;
    schoolAged: number;
  };
  
  // Calculated totals including base family size
  visitTotals: {
    adults: number;
    smallChildren: number;
    schoolAged: number;
    total: number;
  };
  
  visitNotes?: string;
  visitType: VisitType;
  crateStatus: string;
  visitStatus: VisitStatus;
  numberOfBoxes: number;
  seasonalItems: string[];
  visitContact?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export type NewServiceRequest = Omit<ServiceRequest, 
  | 'id' 
  | 'visitTotals'
  | 'createdAt' 
  | 'updatedAt'
>;

export type UpdateServiceRequest = Partial<NewServiceRequest>; 