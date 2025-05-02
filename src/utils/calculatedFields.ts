import { Client, Order } from '../types';

export const calculateFamilySize = (client: Client): number => {
  const baseSize = client.adults + client.school_aged + client.small_children;
  if (client.is_temporary && client.temporary_members) {
    return baseSize +
           client.temporary_members.adults +
           client.temporary_members.school_aged +
           client.temporary_members.small_children;
  }
  return baseSize;
};

export const calculateAddressMatches = (
  clients: Client[],
  currentClient: Client
): { softMatch: number; hardMatch: number } => {
  let softMatch = 0;
  let hardMatch = 0;

  clients.forEach(client => {
    if (client.family_number === currentClient.family_number) return;

    if (client.address?.toLowerCase() === currentClient.address?.toLowerCase()) {
      softMatch++;
      if (client.apt_number?.toLowerCase() === currentClient.apt_number?.toLowerCase()) {
        hardMatch++;
      }
    }
  });

  return { softMatch, hardMatch };
};

export const calculatePhoneMatches = (
  clients: Client[],
  currentClient: Client
): { phone1Matches: number; phone2Matches: number } => {
  let phone1Matches = 0;
  let phone2Matches = 0;

  clients.forEach(client => {
    if (client.family_number === currentClient.family_number) return;

    if (client.phone1 === currentClient.phone1) phone1Matches++;
    if (client.phone2 === currentClient.phone2) phone2Matches++;
    if (client.phone1 === currentClient.phone2) phone2Matches++;
    if (client.phone2 === currentClient.phone1) phone1Matches++;
  });

  return { phone1Matches, phone2Matches };
};

export const calculateTotalVisits = (orders: Order[]): number => {
  return orders.length;
};

export const calculateTotalThisMonth = (orders: Order[]): number => {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return orders.filter(order => new Date(order.created_at) >= firstDayOfMonth).length;
};

export const checkForDuplicateAddress = (client: Client, clients: Client[]): boolean => {
  for (const currentClient of clients) {
    if (client.family_number === currentClient.family_number) continue;
    
    // Check for exact address match
    if (client.address && currentClient.address) {
      if (client.apt_number?.toLowerCase() === currentClient.apt_number?.toLowerCase()) {
        if (client.address.toLowerCase() === currentClient.address.toLowerCase()) {
          return true;
        }
      }
    }
  }
  return false;
};

export const checkForDuplicatePhone = (client: Client, clients: Client[]): boolean => {
  for (const currentClient of clients) {
    if (client.family_number === currentClient.family_number) continue;
    
    // Check for phone number matches
    if (client.phone1) {
      if (client.phone1 === currentClient.phone1 || client.phone1 === currentClient.phone2) {
        return true;
      }
    }
    if (client.phone2) {
      if (client.phone2 === currentClient.phone1 || client.phone2 === currentClient.phone2) {
        return true;
      }
    }
  }
  return false;
};

export const getClientOrders = (orders: Order[], familyNumber: string): Order[] => {
  return orders.filter(o => o.family_number === familyNumber);
};

export const calculateVisitTotals = (
  additionalPeople: {
    adults: number;
    smallChildren: number;
    schoolAged: number;
  }
): {
  adults: number;
  smallChildren: number;
  schoolAged: number;
  total: number;
} => {
  return {
    adults: additionalPeople.adults,
    smallChildren: additionalPeople.smallChildren,
    schoolAged: additionalPeople.schoolAged,
    total: additionalPeople.adults + additionalPeople.smallChildren + additionalPeople.schoolAged
  };
}; 