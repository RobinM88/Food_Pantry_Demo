import { Client, ServiceRequest } from '../types';

export const calculateSearchKey = (client: Client): string => {
  return `${client.firstName}${client.lastName}${client.familyNumber}`.toLowerCase();
};

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

export const calculateVisitTotals = (
  serviceRequests: ServiceRequest[],
  familyNumber: string
): { totalVisits: number; totalThisMonth: number } => {
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const clientVisits = serviceRequests.filter(sr => sr.familySearchId === familyNumber);
  
  const totalVisits = clientVisits.length;
  const totalThisMonth = clientVisits.filter(visit => {
    const visitDate = new Date(visit.assignedVisitDate);
    return visitDate.getMonth() === thisMonth && visitDate.getFullYear() === thisYear;
  }).length;

  return { totalVisits, totalThisMonth };
};

export const calculateVisitTotalsForRequest = (
  client: Client,
  additionalPeople: ServiceRequest['additionalPeople']
): ServiceRequest['visitTotals'] => {
  return {
    adults: client.adults + (additionalPeople.adults || 0),
    smallChildren: client.smallChildren + (additionalPeople.smallChildren || 0),
    schoolAged: client.schoolAged + (additionalPeople.schoolAged || 0),
    total: calculateFamilySize(client) + 
           (additionalPeople.adults || 0) + 
           (additionalPeople.smallChildren || 0) + 
           (additionalPeople.schoolAged || 0)
  };
}; 