import { Order, Client, PhoneLog } from '../types';

// Client Validations
export const validateClient = (client: Partial<Client>): Record<string, string> => {
  const errors: Record<string, string> = {};

  // Required Fields
  if (!client.firstName?.trim()) {
    errors.firstName = 'First name is required';
  }
  if (!client.lastName?.trim()) {
    errors.lastName = 'Last name is required';
  }
  if (!client.phone1?.trim()) {
    errors.phone1 = 'Primary phone number is required';
  }

  // Phone Number Format (XXX) XXX-XXXX
  const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
  if (client.phone1 && !phoneRegex.test(client.phone1)) {
    errors.phone1 = 'Phone number must be in format (XXX) XXX-XXXX';
  }
  if (client.phone2 && !phoneRegex.test(client.phone2)) {
    errors.phone2 = 'Phone number must be in format (XXX) XXX-XXXX';
  }

  // Email Format (if provided)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (client.email && !emailRegex.test(client.email)) {
    errors.email = 'Invalid email format';
  }

  // ZIP Code Format (if provided)
  const zipRegex = /^\d{5}(-\d{4})?$/;
  if (client.zipCode && !zipRegex.test(client.zipCode)) {
    errors.zipCode = 'ZIP code must be in format XXXXX or XXXXX-XXXX';
  }

  // Family Size Validation
  if (client.familySize !== undefined) {
    if (client.familySize < 1) {
      errors.familySize = 'Family size must be at least 1';
    }
    if (client.familySize > 20) {
      errors.familySize = 'Family size cannot exceed 20';
    }
  }

  return errors;
};

// Order Validations
export const validateOrder = (order: Partial<Order>): Record<string, string> => {
  const errors: Record<string, string> = {};

  // Required Fields
  if (!order.familySearchId?.trim()) {
    errors.familySearchId = 'Client is required';
  }
  if (!order.numberOfBoxes || order.numberOfBoxes < 1) {
    errors.numberOfBoxes = 'At least one box is required';
  }
  if (!order.pickupDate) {
    errors.pickupDate = 'Pickup date is required';
  }

  // Pickup Date Validation
  if (order.pickupDate) {
    const pickupDate = new Date(order.pickupDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (pickupDate < today) {
      errors.pickupDate = 'Pickup date cannot be in the past';
    }

    // Validate pickup date is within 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    if (pickupDate > thirtyDaysFromNow) {
      errors.pickupDate = 'Pickup date cannot be more than 30 days in the future';
    }
  }

  // Status Validation
  const validStatuses = [
    'pending', 'approved', 'denied', 'scheduled', 
    'ready', 'picked_up', 'cancelled', 'no_show'
  ];
  if (order.status && !validStatuses.includes(order.status)) {
    errors.status = 'Invalid status';
  }

  return errors;
};

// Phone Log Validations
export const validatePhoneLog = (phoneLog: Partial<PhoneLog>): Record<string, string> => {
  const errors: Record<string, string> = {};

  // Required Fields
  if (!phoneLog.phoneNumber?.trim()) {
    errors.phoneNumber = 'Phone number is required';
  }
  if (!phoneLog.callType) {
    errors.callType = 'Call type is required';
  }
  if (!phoneLog.callOutcome) {
    errors.callOutcome = 'Call outcome is required';
  }

  // Phone Number Format
  const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
  if (phoneLog.phoneNumber && !phoneRegex.test(phoneLog.phoneNumber)) {
    errors.phoneNumber = 'Phone number must be in format (XXX) XXX-XXXX';
  }

  // Call Type Validation
  const validCallTypes = ['incoming', 'outgoing'];
  if (phoneLog.callType && !validCallTypes.includes(phoneLog.callType)) {
    errors.callType = 'Invalid call type';
  }

  // Call Outcome Validation
  const validOutcomes = ['completed', 'voicemail', 'no_answer', 'wrong_number'];
  if (phoneLog.callOutcome && !validOutcomes.includes(phoneLog.callOutcome)) {
    errors.callOutcome = 'Invalid call outcome';
  }

  return errors;
};

// Business Rule Validations
export const validateOrderBusinessRules = (
  order: Partial<Order>, 
  client: Client | undefined
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!client) {
    errors.familySearchId = 'Client not found';
    return errors;
  }

  // Check client status
  if (client.memberStatus === 'inactive') {
    errors.familySearchId = 'Cannot create orders for inactive clients';
  }
  if (client.memberStatus === 'banned') {
    errors.familySearchId = 'Cannot create orders for banned clients';
  }

  // Check frequency of orders
  if (order.pickupDate) {
    const pickupDate = new Date(order.pickupDate);
    const lastVisit = client.lastVisit ? new Date(client.lastVisit) : null;

    if (lastVisit) {
      const daysSinceLastVisit = Math.floor(
        (pickupDate.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastVisit < 14) {
        errors.pickupDate = 'Must wait 14 days between orders';
      }
    }
  }

  return errors;
};

// Helper function to combine multiple validation results
export const combineValidationResults = (
  ...validationResults: Record<string, string>[]
): Record<string, string> => {
  return validationResults.reduce((combined, current) => ({
    ...combined,
    ...current
  }), {});
}; 