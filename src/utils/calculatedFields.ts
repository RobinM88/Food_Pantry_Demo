import { Client, Order } from '../types';

export const calculateFamilySize = (client: Client): number => {
  const baseSize = client.adults + client.schoolAged + client.smallChildren;
  if (client.isTemporary && client.temporaryMembers) {
    return baseSize + 
           client.temporaryMembers.adults + 
           client.temporaryMembers.schoolAged + 
           client.temporaryMembers.smallChildren;
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
    if (client.familyNumber === currentClient.familyNumber) return;

    if (client.address?.toLowerCase() === currentClient.address?.toLowerCase()) {
      softMatch++;
      if (client.aptNumber?.toLowerCase() === currentClient.aptNumber?.toLowerCase()) {
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
    if (client.familyNumber === currentClient.familyNumber) return;

    if (client.phone1 === currentClient.phone1) phone1Matches++;
    if (client.phone2 === currentClient.phone2) phone2Matches++;
    if (client.phone1 === currentClient.phone2) phone2Matches++;
    if (client.phone2 === currentClient.phone1) phone1Matches++;
  });

  return { phone1Matches, phone2Matches };
};

export const calculateTotalVisits = (
  familyNumber: string,
  orders: Order[]
): number => {
  const clientVisits = orders.filter(order => order.familySearchId === familyNumber);
  return clientVisits.length;
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