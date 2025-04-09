import { Client, Order, PhoneLog, MemberStatus } from '../types';

export const mockClients: Client[] = [
  {
    familyNumber: 'f1001',
    firstName: 'john',
    lastName: 'doe',
    email: 'john.doe@example.com',
    address: '123 Main St',
    aptNumber: '',
    zipCode: '12345',
    phone1: '(314) 123-4567',
    phone2: '',
    isUnhoused: false,
    isTemporary: false,
    adults: 2,
    schoolAged: 1,
    smallChildren: 1,
    temporaryMembers: {
      adults: 0,
      schoolAged: 0,
      smallChildren: 0
    },
    familySize: 4,
    foodNotes: 'Prefers gluten-free items',
    officeNotes: '',
    totalVisits: 5,
    totalThisMonth: 1,
    connectedFamilies: [],
    memberStatus: MemberStatus.Active,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-03-01'),
    lastVisit: new Date('2024-02-29')
  },
  {
    familyNumber: 'f1002',
    firstName: 'jane',
    lastName: 'smith',
    email: 'jane.smith@example.com',
    address: '456 Oak Ave',
    aptNumber: '',
    zipCode: '12345',
    phone1: '(314) 234-5678',
    phone2: '',
    isUnhoused: false,
    isTemporary: true,
    adults: 1,
    schoolAged: 2,
    smallChildren: 0,
    temporaryMembers: {
      adults: 1,
      schoolAged: 1,
      smallChildren: 0
    },
    familySize: 3,
    foodNotes: 'Allergic to peanuts',
    officeNotes: '',
    totalVisits: 3,
    totalThisMonth: 1,
    connectedFamilies: [],
    memberStatus: MemberStatus.Active,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-03-01'),
    lastVisit: new Date('2024-02-29')
  },
  {
    familyNumber: 'f1003',
    firstName: 'robert',
    lastName: 'johnson',
    email: '',
    address: '',
    zipCode: '12345',
    phone1: '(314) 345-6789',
    phone2: '',
    isUnhoused: true,
    isTemporary: false,
    adults: 1,
    schoolAged: 0,
    smallChildren: 0,
    temporaryMembers: {
      adults: 0,
      schoolAged: 0,
      smallChildren: 0
    },
    familySize: 1,
    foodNotes: '',
    officeNotes: '',
    totalVisits: 0,
    totalThisMonth: 0,
    connectedFamilies: [],
    memberStatus: MemberStatus.Pending,
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-01'),
    lastVisit: undefined
  }
];

export const mockOrders: Order[] = [
  {
    id: '1',
    familySearchId: 'f1001',
    status: 'pending',
    notes: 'Gluten-free items requested',
    pickupDate: new Date('2024-03-20'),
    createdAt: new Date(),
    updatedAt: new Date(),
    deliveryType: 'pickup',
    isNewClient: false,
    approvalStatus: 'pending',
    numberOfBoxes: 2,
    additionalPeople: {
      adults: 0,
      smallChildren: 0,
      schoolAged: 0
    },
    visitTotals: {
      adults: 1,
      smallChildren: 0,
      schoolAged: 0,
      total: 1
    },
    seasonalItems: ['Spring vegetables'],
    visitContact: '(314) 123-4567'
  },
  {
    id: '2',
    familySearchId: 'f1002',
    status: 'scheduled',
    notes: 'Client requested low-sodium options',
    pickupDate: new Date('2023-04-02'),
    createdAt: new Date(),
    updatedAt: new Date(),
    deliveryType: 'delivery',
    isNewClient: false,
    approvalStatus: 'approved',
    numberOfBoxes: 3,
    additionalPeople: {
      adults: 1,
      smallChildren: 0,
      schoolAged: 0
    },
    visitTotals: {
      adults: 3,
      smallChildren: 0,
      schoolAged: 0,
      total: 3
    },
    seasonalItems: ['Spring vegetables', 'Fruits'],
    visitContact: '(314) 234-5678'
  },
  {
    id: '3',
    familySearchId: 'f1003',
    status: 'picked_up',
    notes: 'Client requested extra fruits',
    pickupDate: new Date('2023-03-15'),
    createdAt: new Date(),
    updatedAt: new Date(),
    deliveryType: 'pickup',
    isNewClient: true,
    approvalStatus: 'approved',
    numberOfBoxes: 1,
    additionalPeople: {
      adults: 0,
      smallChildren: 0,
      schoolAged: 0
    },
    visitTotals: {
      adults: 1,
      smallChildren: 0,
      schoolAged: 0,
      total: 1
    },
    seasonalItems: ['Fruits'],
    visitContact: '(314) 345-6789'
  },
  {
    id: '4',
    familySearchId: 'f1001',
    status: 'cancelled',
    notes: 'Client called to cancel',
    pickupDate: new Date('2023-03-10'),
    createdAt: new Date(),
    updatedAt: new Date(),
    deliveryType: 'pickup',
    isNewClient: false,
    approvalStatus: 'denied',
    numberOfBoxes: 2,
    additionalPeople: {
      adults: 0,
      smallChildren: 0,
      schoolAged: 0
    },
    visitTotals: {
      adults: 1,
      smallChildren: 0,
      schoolAged: 0,
      total: 1
    },
    seasonalItems: ['Spring vegetables'],
    visitContact: '(314) 123-4567'
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