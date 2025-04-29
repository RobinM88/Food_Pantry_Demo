import { Client, NewClient } from '../types/client';
import { Order, NewOrder } from '../types/order';
import { PhoneLog } from '../types';
import { mockClients, mockPhoneLogs } from './mockData';

interface TestData {
  clients: Client[];
  newClients: NewClient[];
  orders: Order[];
  phoneLogs: PhoneLog[];
}

const STORAGE_KEY = 'food_pantry_test_data';

// Initialize storage with mock data if empty
const initializeStorageWithMockData = () => {
  const storedData = localStorage.getItem(STORAGE_KEY);
  if (!storedData) {
    const initialData: TestData = {
      clients: mockClients,
      newClients: [],
      orders: [],
      phoneLogs: mockPhoneLogs
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
    if (!storedData) {
      return {
        clients: mockClients,
        newClients: [],
        orders: [],
        phoneLogs: mockPhoneLogs
      };
    }

    const data = JSON.parse(storedData);
    
    // Convert date strings back to Date objects
    data.clients = data.clients.map((client: Client) => ({
      ...client,
      created_at: new Date(client.created_at),
      updated_at: new Date(client.updated_at),
      last_visit: client.last_visit ? new Date(client.last_visit) : undefined
    }));

    data.orders = data.orders.map((order: Order) => ({
      ...order,
      created_at: new Date(order.created_at),
      updated_at: new Date(order.updated_at),
      pickup_date: order.pickup_date ? new Date(order.pickup_date) : undefined
    }));

    data.phoneLogs = data.phoneLogs.map((log: PhoneLog) => ({
      ...log,
      created_at: new Date(log.created_at),
      updated_at: new Date(log.updated_at)
    }));
    
    return data;
  } catch (error) {
    console.error('Error loading test data:', error);
    // Return mock data as fallback
    return {
      clients: mockClients,
      newClients: [],
      orders: [],
      phoneLogs: mockPhoneLogs
    };
  }
};

export const saveTestData = (data: TestData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving test data:', error);
  }
};

export const addNewClient = (client: Client): void => {
  const data = loadTestData();
  data.clients.push(client);
  saveTestData(data);
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
    created_at: new Date(),
    updated_at: new Date()
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
      updated_at: new Date()
    };
    saveTestData(data);
  }
};

export const getOrders = (): Order[] => {
  return loadTestData().orders;
};

export const getOrdersByClientId = (clientId: string): Order[] => {
  return loadTestData().orders.filter(o => o.family_search_id === clientId);
};

export const deleteOrder = (orderId: string): void => {
  const data = loadTestData();
  data.orders = data.orders.filter(o => o.id !== orderId);
  saveTestData(data);
  console.log('Order deleted:', orderId);
};

export const addPhoneLog = (phoneLog: PhoneLog): void => {
  const data = loadTestData();
  data.phoneLogs.push(phoneLog);
  saveTestData(data);
};

export const updatePhoneLog = (updatedLog: PhoneLog): void => {
  const data = loadTestData();
  const index = data.phoneLogs.findIndex(log => log.id === updatedLog.id);
  if (index !== -1) {
    data.phoneLogs[index] = updatedLog;
    saveTestData(data);
  }
};

export const getPhoneLogs = (): PhoneLog[] => {
  return loadTestData().phoneLogs;
};

export const getPhoneLogsByClientId = (clientId: string): PhoneLog[] => {
  return loadTestData().phoneLogs.filter(pl => pl.family_search_id === clientId);
};

function convertDates(data: any) {
  if (data.created_at) {
    data.created_at = new Date(data.created_at);
  }
  if (data.updated_at) {
    data.updated_at = new Date(data.updated_at);
  }
  if (data.last_visit) {
    data.last_visit = data.last_visit ? new Date(data.last_visit) : null;
  }
  if (data.pickup_date) {
    data.pickup_date = data.pickup_date ? new Date(data.pickup_date) : null;
  }
  return data;
} 