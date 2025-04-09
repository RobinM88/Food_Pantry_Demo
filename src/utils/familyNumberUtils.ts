import { Client } from '../types';

export const generateNextFamilyNumber = (clients: Client[]): string => {
  // Find the highest family number currently in use
  const highestNumber = clients.reduce((max, client) => {
    // Extract the number part after 'f' if it exists
    const numberPart = client.familyNumber.startsWith('f') 
      ? client.familyNumber.substring(1) 
      : client.familyNumber;
    const currentNumber = parseInt(numberPart);
    return isNaN(currentNumber) ? max : Math.max(max, currentNumber);
  }, 1000); // Start from 1000 if no clients exist
  
  // Return the next number with 'f' prefix
  return `f${highestNumber + 1}`;
}; 