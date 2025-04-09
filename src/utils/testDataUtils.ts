import fs from 'fs';
import path from 'path';
import { Client, NewClient } from '../types/client';
import { Order, NewOrder } from '../types/order';
import { PhoneLog } from '../types';

const TEST_DATA_PATH = path.join(process.cwd(), 'src/utils/testData.json');

interface TestData {
  clients: Client[];
  newClients: NewClient[];
  orders: Order[];
  phoneLogs: PhoneLog[];
}

export const loadTestData = (): TestData => {
  try {
    const data = fs.readFileSync(TEST_DATA_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading test data:', error);
    return { clients: [], newClients: [], orders: [], phoneLogs: [] };
  }
};

export const saveTestData = (data: TestData): void => {
  try {
    fs.writeFileSync(TEST_DATA_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving test data:', error);
  }
};

export const addNewClient = (client: NewClient): void => {
  const data = loadTestData();
  data.newClients.push(client);
  saveTestData(data);
};

export const addExistingClient = (client: Client): void => {
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
  return loadTestData().orders.filter(o => o.clientId === clientId);
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
  return loadTestData().phoneLogs.filter(pl => pl.clientId === clientId);
}; 