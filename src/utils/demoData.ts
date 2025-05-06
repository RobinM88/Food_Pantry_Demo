import { db } from '../lib/indexedDB';
import { Client, MemberStatus } from '../types/client';
import { Order } from '../types/order';
import { PhoneLog } from '../types/phoneLog';
import { STORES } from '../lib/indexedDB';
import { config } from '../config';

/**
 * Sample clients for demo mode
 */
const sampleClients: Client[] = [
  {
    id: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
    family_number: 'f1001',
    first_name: 'John',
    last_name: 'Smith',
    phone1: '5551234567',
    phone2: '',
    email: 'john.smith@example.com',
    address: '123 Main St',
    apt_number: '',
    zip_code: '12345',
    is_unhoused: false,
    is_temporary: false,
    family_size: 4,
    adults: 2,
    school_aged: 1,
    small_children: 1,
    temporary_members: {
      adults: 0,
      school_aged: 0,
      small_children: 0
    },
    member_status: MemberStatus.Active,
    food_notes: '',
    office_notes: 'Sample client for demo purposes',
    total_visits: 5,
    total_this_month: 1,
    last_visit: new Date(),
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: '2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q',
    family_number: 'f1002',
    first_name: 'Jane',
    last_name: 'Doe',
    phone1: '5559876543',
    phone2: '',
    email: 'jane.doe@example.com',
    address: '456 Oak St',
    apt_number: '',
    zip_code: '67890',
    is_unhoused: false,
    is_temporary: false,
    family_size: 3,
    adults: 1,
    school_aged: 1,
    small_children: 1,
    temporary_members: {
      adults: 0,
      school_aged: 0,
      small_children: 0
    },
    member_status: MemberStatus.Active,
    food_notes: '',
    office_notes: 'Single parent household',
    total_visits: 3,
    total_this_month: 1,
    last_visit: new Date(),
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r',
    family_number: 'f1003',
    first_name: 'Robert',
    last_name: 'Johnson',
    phone1: '5554567890',
    phone2: '',
    email: 'robert.johnson@example.com',
    address: '789 Pine St',
    apt_number: '',
    zip_code: '23456',
    is_unhoused: false,
    is_temporary: false,
    family_size: 5,
    adults: 2,
    school_aged: 2,
    small_children: 0,
    temporary_members: {
      adults: 0,
      school_aged: 0,
      small_children: 1
    },
    member_status: MemberStatus.Pending,
    food_notes: 'Has dietary restrictions',
    office_notes: '',
    total_visits: 0,
    total_this_month: 0,
    last_visit: null,
    created_at: new Date(),
    updated_at: new Date()
  }
];

/**
 * Sample orders for demo mode
 */
const sampleOrders: Order[] = [
  {
    id: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
    family_number: 'f1001',
    status: 'completed',
    delivery_type: 'pickup',
    pickup_date: new Date(),
    number_of_boxes: 2,
    notes: 'Sample order for demo purposes',
    additional_people: {
      adults: 2,
      small_children: 1,
      school_aged: 1
    },
    is_new_client: false,
    approval_status: 'approved',
    created_at: new Date(),
    updated_at: new Date(),
    visit_contact: null,
    Client: {
      first_name: 'John',
      last_name: 'Smith'
    }
  },
  {
    id: '2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q',
    family_number: 'f1002',
    status: 'pending',
    delivery_type: 'delivery',
    pickup_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    number_of_boxes: 1,
    notes: 'Urgent need',
    additional_people: {
      adults: 1,
      small_children: 2,
      school_aged: 0
    },
    is_new_client: false,
    approval_status: 'pending',
    created_at: new Date(),
    updated_at: new Date(),
    visit_contact: null,
    Client: {
      first_name: 'Jane',
      last_name: 'Doe'
    }
  },
  {
    id: '3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r',
    family_number: 'f1003',
    status: 'pending',
    delivery_type: 'pickup',
    pickup_date: new Date(),
    number_of_boxes: 3,
    notes: 'First order for Robert Johnson',
    additional_people: {
      adults: 2,
      small_children: 1,
      school_aged: 2
    },
    is_new_client: true,
    approval_status: 'pending',
    created_at: new Date(),
    updated_at: new Date(),
    visit_contact: null,
    Client: {
      first_name: 'Robert',
      last_name: 'Johnson'
    }
  }
];

/**
 * Sample phone logs for demo mode
 */
const samplePhoneLogs: PhoneLog[] = [
  {
    id: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
    family_number: 'f1001',
    phone_number: '5551234567',
    call_type: 'incoming',
    call_outcome: 'successful',
    notes: 'Client scheduled a pickup for Thursday',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: '2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q',
    family_number: 'f1002',
    phone_number: '5559876543',
    call_type: 'outgoing',
    call_outcome: 'voicemail',
    notes: 'Client called with questions about services',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  }
];

/**
 * Sample connected families for demo mode
 */
const sampleConnectedFamilies = [
  {
    id: '1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
    family_number: 'f1001',
    connected_family_number: 'cf0001',
    relationship_type: 'relative',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: '2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q',
    family_number: 'f1002',
    connected_family_number: 'cf0001',
    relationship_type: 'relative',
    created_at: new Date(),
    updated_at: new Date()
  }
];

/**
 * Seed the IndexedDB with sample data for demo mode
 */
export async function seedDemoData() {
  if (!config.features.seedDemoData) {
    console.log('Demo mode data seeding is disabled');
    return;
  }

  try {
    console.log('Seeding demo data...');
    
    // Check if data already exists
    const existingClients = await db.getAll(STORES.CLIENTS);
    if (existingClients.length > 0) {
      console.log('Demo data already seeded - skipping');
      return;
    }
    
    // Seed clients
    for (const client of sampleClients) {
      await db.put(STORES.CLIENTS, client, true);
    }
    console.log(`Seeded ${sampleClients.length} clients`);
    
    // Seed orders
    for (const order of sampleOrders) {
      await db.put(STORES.ORDERS, order, true);
    }
    console.log(`Seeded ${sampleOrders.length} orders`);
    
    // Seed phone logs
    for (const log of samplePhoneLogs) {
      await db.put(STORES.PHONE_LOGS, log, true);
    }
    console.log(`Seeded ${samplePhoneLogs.length} phone logs`);
    
    // Seed connected families
    for (const connection of sampleConnectedFamilies) {
      await db.put(STORES.CONNECTED_FAMILIES, connection, true);
    }
    console.log(`Seeded ${sampleConnectedFamilies.length} connected families`);
    
    console.log('Demo data seeding complete!');
  } catch (error) {
    console.error('Error seeding demo data:', error);
  }
} 