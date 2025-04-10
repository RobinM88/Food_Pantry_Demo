import { Client, MemberStatus } from '../types/client';
import { Order } from '../types/order';
import { PhoneLog } from '../types';

export const mockClients: Client[] = [
  {
    id: 'c1',
    familyNumber: 'f1001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@email.com',
    address: '123 Main St',
    aptNumber: 'Apt 1A',
    zipCode: '12345',
    phone1: '(314) 123-4567',
    phone2: '',
    isUnhoused: false,
    isTemporary: false,
    adults: 2,
    smallChildren: 1,
    schoolAged: 2,
    familySize: 5,
    temporaryMembers: {
      adults: 0,
      schoolAged: 0,
      smallChildren: 0
    },
    foodNotes: '',
    officeNotes: '',
    memberStatus: MemberStatus.Active,
    totalVisits: 5,
    totalThisMonth: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastVisit: new Date()
  },
  {
    id: 'c2',
    familyNumber: 'f1002',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@email.com',
    address: '456 Oak St',
    aptNumber: '',
    zipCode: '12346',
    phone1: '(314) 234-5678',
    phone2: '',
    isUnhoused: false,
    isTemporary: true,
    adults: 1,
    smallChildren: 0,
    schoolAged: 1,
    familySize: 2,
    temporaryMembers: {
      adults: 0,
      schoolAged: 0,
      smallChildren: 0
    },
    foodNotes: '',
    officeNotes: '',
    memberStatus: MemberStatus.Active,
    totalVisits: 3,
    totalThisMonth: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastVisit: new Date()
  }
];

export const mockOrders: Order[] = [
  {
    id: '1',
    familySearchId: 'f1001',
    status: 'pending',
    pickupDate: new Date(),
    notes: 'First time client',
    createdAt: new Date(),
    updatedAt: new Date(),
    deliveryType: 'pickup',
    isNewClient: true,
    approvalStatus: 'pending',
    numberOfBoxes: 1,
    additionalPeople: {
      adults: 2,
      smallChildren: 1,
      schoolAged: 2
    },
    visitContact: 'John Doe'
  },
  {
    id: '2',
    familySearchId: 'f1002',
    status: 'approved',
    pickupDate: new Date(),
    notes: 'Regular client',
    createdAt: new Date(),
    updatedAt: new Date(),
    deliveryType: 'delivery',
    isNewClient: false,
    approvalStatus: 'approved',
    numberOfBoxes: 2,
    additionalPeople: {
      adults: 1,
      smallChildren: 0,
      schoolAged: 1
    },
    visitContact: 'Jane Smith'
  }
];

export const mockPhoneLogs: PhoneLog[] = [
  {
    id: '1',
    familySearchId: 'f1001',
    phoneNumber: '(314) 123-4567',
    callType: 'incoming',
    callOutcome: 'completed',
    notes: 'Requested food assistance',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    familySearchId: 'f1002',
    phoneNumber: '(314) 234-5678',
    callType: 'outgoing',
    callOutcome: 'voicemail',
    notes: 'Left message about order status',
    createdAt: new Date('2023-03-23'),
    updatedAt: new Date('2023-03-23'),
  },
  {
    id: '3',
    familySearchId: 'f1003',
    phoneNumber: '(314) 345-6789',
    callType: 'incoming',
    callOutcome: 'no_answer',
    notes: 'No answer, will try again later',
    createdAt: new Date('2023-03-24'),
    updatedAt: new Date('2023-03-24'),
  }
]; 