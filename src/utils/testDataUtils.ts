import { Client, NewClient } from '../types/client';
import { Order, NewOrder } from '../types/order';
import { PhoneLog } from '../types';
import { MemberStatus } from '../types';

interface TestData {
  clients: Client[];
  newClients: NewClient[];
  orders: Order[];
  phoneLogs: PhoneLog[];
}

const STORAGE_KEY = 'food_pantry_test_data';

// Mock data for initial load
const mockClients: Client[] = [
  {
    familyNumber: 'f1001',
    firstName: 'john',
    lastName: 'doe',
    email: 'john.doe@example.com',
    address: '123 Main St',
    zipCode: '12345',
    phone1: '(555) 123-4567',
    isUnhoused: false,
    isTemporary: false,
    adults: 2,
    schoolAged: 1,
    smallChildren: 1,
    familySize: 4,
    memberStatus: MemberStatus.Active,
    totalVisits: 5,
    totalThisMonth: 1,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-03-01'),
    lastVisit: new Date('2024-03-01')
  },
  {
    familyNumber: 'f1002',
    firstName: 'jane',
    lastName: 'smith',
    email: 'jane.smith@example.com',
    address: '456 Oak Ave',
    zipCode: '12345',
    phone1: '(555) 234-5678',
    isUnhoused: false,
    isTemporary: true,
    adults: 1,
    schoolAged: 2,
    smallChildren: 0,
    familySize: 3,
    temporaryMembers: {
      adults: 1,
      schoolAged: 1,
      smallChildren: 0
    },
    memberStatus: MemberStatus.Active,
    totalVisits: 3,
    totalThisMonth: 1,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-03-01'),
    lastVisit: new Date('2024-03-01')
  },
  {
    familyNumber: 'f1003',
    firstName: 'robert',
    lastName: 'johnson',
    email: '',
    address: '',
    zipCode: '12345',
    phone1: '(555) 345-6789',
    isUnhoused: true,
    isTemporary: false,
    adults: 1,
    schoolAged: 0,
    smallChildren: 0,
    familySize: 1,
    memberStatus: MemberStatus.Pending,
    totalVisits: 0,
    totalThisMonth: 0,
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-01'),
    lastVisit: undefined
  }
];

const defaultTestData: TestData = {
  clients: [],
  newClients: [],
  orders: [],
  phoneLogs: []
};

// Initialize storage with mock data if empty
const initializeStorageWithMockData = () => {
  const storedData = localStorage.getItem(STORAGE_KEY);
  if (!storedData) {
    const initialData: TestData = {
      ...defaultTestData,
      clients: mockClients
    };
    saveTestData(initialData);
    console.log('Initialized storage with mock data');
  }
};

export const loadTestData = (): TestData => {
  try {
    // Initialize mock data if storage is empty
    initializeStorageWithMockData();
    
    const storedData = localStorage.getItem(STORAGE_KEY);
    const data = storedData ? JSON.parse(storedData) : defaultTestData;
    
    // Convert date strings back to Date objects
    data.clients = data.clients.map((client: Client) => ({
      ...client,
      createdAt: new Date(client.createdAt),
      updatedAt: new Date(client.updatedAt),
      lastVisit: client.lastVisit ? new Date(client.lastVisit) : undefined
    }));
    
    console.log('Data loaded successfully:', {
      clientsCount: data.clients.length,
      newClientsCount: data.newClients.length,
      ordersCount: data.orders.length,
      phoneLogsCount: data.phoneLogs.length
    });
    return data;
  } catch (error) {
    console.error('Error loading test data:', error);
    return defaultTestData;
  }
};

export const saveTestData = (data: TestData): void => {
  try {
    const jsonData = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, jsonData);
    console.log('Data saved successfully:', {
      clientsCount: data.clients.length,
      newClientsCount: data.newClients.length,
      ordersCount: data.orders.length,
      phoneLogsCount: data.phoneLogs.length
    });
  } catch (error) {
    console.error('Error saving test data:', error);
  }
};

export const addNewClient = (client: Client): void => {
  const data = loadTestData();
  console.log('Current data before adding:', data);
  data.clients.push(client);
  saveTestData(data);
  console.log('Data after adding client:', data);
};

export const updateClient = (updatedClient: Client): void => {
  const data = loadTestData();
  const index = data.clients.findIndex(c => c.familyNumber === updatedClient.familyNumber);
  if (index !== -1) {
    data.clients[index] = updatedClient;
    saveTestData(data);
  }
};

export const deleteClient = (familyNumber: string): void => {
  const data = loadTestData();
  data.clients = data.clients.filter(c => c.familyNumber !== familyNumber);
  saveTestData(data);
  console.log('Client deleted:', familyNumber);
};

export const getClients = (): Client[] => {
  return loadTestData().clients;
};

export const getNewClients = (): NewClient[] => {
  return loadTestData().newClients;
};

export const addOrder = (order: NewOrder): void => {
  const data = loadTestData();
  const newOrder: Order = {
    ...order,
    id: `o${data.orders.length + 1}`,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  data.orders.push(newOrder);
  saveTestData(data);
};

export const updateOrder = (updatedOrder: Order): void => {
  const data = loadTestData();
  const index = data.orders.findIndex(o => o.id === updatedOrder.id);
  if (index !== -1) {
    data.orders[index] = {
      ...updatedOrder,
      updatedAt: new Date()
    };
    saveTestData(data);
  }
};

export const getOrders = (): Order[] => {
  return loadTestData().orders;
};

export const getOrdersByClientId = (clientId: string): Order[] => {
  return loadTestData().orders.filter(o => o.familySearchId === clientId);
};

export const addPhoneLog = (phoneLog: PhoneLog): void => {
  const data = loadTestData();
  const newPhoneLog: PhoneLog = {
    ...phoneLog,
    id: `pl${data.phoneLogs.length + 1}`,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  data.phoneLogs.push(newPhoneLog);
  saveTestData(data);
};

export const updatePhoneLog = (updatedPhoneLog: PhoneLog): void => {
  const data = loadTestData();
  const index = data.phoneLogs.findIndex(pl => pl.id === updatedPhoneLog.id);
  if (index !== -1) {
    data.phoneLogs[index] = {
      ...updatedPhoneLog,
      updatedAt: new Date()
    };
    saveTestData(data);
  }
};

export const getPhoneLogs = (): PhoneLog[] => {
  return loadTestData().phoneLogs;
};

export const getPhoneLogsByClientId = (clientId: string): PhoneLog[] => {
  return loadTestData().phoneLogs.filter(pl => pl.familySearchId === clientId);
}; 