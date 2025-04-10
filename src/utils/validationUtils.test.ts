import { validateClient, validateOrder, validatePhoneLog, validateOrderBusinessRules, combineValidationResults } from './validationUtils';
import { Client, Order, PhoneLog } from '../types';

describe('validateClient', () => {
  it('should validate a valid client', () => {
    const validClient: Partial<Client> = {
      firstName: 'John',
      lastName: 'Doe',
      phone1: '(555) 123-4567',
      email: 'john.doe@example.com',
      zipCode: '12345',
      familySize: 3
    };

    const errors = validateClient(validClient);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('should require first name, last name, and primary phone', () => {
    const invalidClient: Partial<Client> = {
      email: 'john.doe@example.com'
    };

    const errors = validateClient(invalidClient);
    expect(errors.firstName).toBe('First name is required');
    expect(errors.lastName).toBe('Last name is required');
    expect(errors.phone1).toBe('Primary phone number is required');
  });

  it('should validate phone number format', () => {
    const clientWithInvalidPhone: Partial<Client> = {
      firstName: 'John',
      lastName: 'Doe',
      phone1: '5551234567',
      phone2: '123-456-7890'
    };

    const errors = validateClient(clientWithInvalidPhone);
    expect(errors.phone1).toBe('Phone number must be in format (XXX) XXX-XXXX');
    expect(errors.phone2).toBe('Phone number must be in format (XXX) XXX-XXXX');
  });

  it('should validate email format if provided', () => {
    const clientWithInvalidEmail: Partial<Client> = {
      firstName: 'John',
      lastName: 'Doe',
      phone1: '(555) 123-4567',
      email: 'invalid-email'
    };

    const errors = validateClient(clientWithInvalidEmail);
    expect(errors.email).toBe('Invalid email format');
  });

  it('should validate ZIP code format if provided', () => {
    const clientWithInvalidZip: Partial<Client> = {
      firstName: 'John',
      lastName: 'Doe',
      phone1: '(555) 123-4567',
      zipCode: '1234'
    };

    const errors = validateClient(clientWithInvalidZip);
    expect(errors.zipCode).toBe('ZIP code must be in format XXXXX or XXXXX-XXXX');
  });

  it('should validate family size limits', () => {
    const clientWithInvalidFamilySize: Partial<Client> = {
      firstName: 'John',
      lastName: 'Doe',
      phone1: '(555) 123-4567',
      familySize: 0
    };

    const errors = validateClient(clientWithInvalidFamilySize);
    expect(errors.familySize).toBe('Family size must be at least 1');

    clientWithInvalidFamilySize.familySize = 21;
    const moreErrors = validateClient(clientWithInvalidFamilySize);
    expect(moreErrors.familySize).toBe('Family size cannot exceed 20');
  });
});

describe('validateOrder', () => {
  it('should validate a valid order', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const validOrder: Partial<Order> = {
      familySearchId: '123',
      numberOfBoxes: 2,
      pickupDate: tomorrow.toISOString(),
      status: 'pending'
    };

    const errors = validateOrder(validOrder);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('should require client, number of boxes, and pickup date', () => {
    const invalidOrder: Partial<Order> = {};

    const errors = validateOrder(invalidOrder);
    expect(errors.familySearchId).toBe('Client is required');
    expect(errors.numberOfBoxes).toBe('At least one box is required');
    expect(errors.pickupDate).toBe('Pickup date is required');
  });

  it('should validate pickup date is not in the past', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const orderWithPastDate: Partial<Order> = {
      familySearchId: '123',
      numberOfBoxes: 1,
      pickupDate: yesterday.toISOString()
    };

    const errors = validateOrder(orderWithPastDate);
    expect(errors.pickupDate).toBe('Pickup date cannot be in the past');
  });

  it('should validate pickup date is not too far in the future', () => {
    const farFuture = new Date();
    farFuture.setDate(farFuture.getDate() + 31);

    const orderWithFarDate: Partial<Order> = {
      familySearchId: '123',
      numberOfBoxes: 1,
      pickupDate: farFuture.toISOString()
    };

    const errors = validateOrder(orderWithFarDate);
    expect(errors.pickupDate).toBe('Pickup date cannot be more than 30 days in the future');
  });

  it('should validate order status', () => {
    const orderWithInvalidStatus: Partial<Order> = {
      familySearchId: '123',
      numberOfBoxes: 1,
      pickupDate: new Date().toISOString(),
      status: 'invalid_status' as any
    };

    const errors = validateOrder(orderWithInvalidStatus);
    expect(errors.status).toBe('Invalid status');
  });
});

describe('validatePhoneLog', () => {
  it('should validate a valid phone log', () => {
    const validPhoneLog: Partial<PhoneLog> = {
      phoneNumber: '(555) 123-4567',
      callType: 'incoming',
      callOutcome: 'completed'
    };

    const errors = validatePhoneLog(validPhoneLog);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('should require phone number, call type, and call outcome', () => {
    const invalidPhoneLog: Partial<PhoneLog> = {};

    const errors = validatePhoneLog(invalidPhoneLog);
    expect(errors.phoneNumber).toBe('Phone number is required');
    expect(errors.callType).toBe('Call type is required');
    expect(errors.callOutcome).toBe('Call outcome is required');
  });

  it('should validate phone number format', () => {
    const phoneLogWithInvalidPhone: Partial<PhoneLog> = {
      phoneNumber: '5551234567',
      callType: 'incoming',
      callOutcome: 'completed'
    };

    const errors = validatePhoneLog(phoneLogWithInvalidPhone);
    expect(errors.phoneNumber).toBe('Phone number must be in format (XXX) XXX-XXXX');
  });

  it('should validate call type', () => {
    const phoneLogWithInvalidType: Partial<PhoneLog> = {
      phoneNumber: '(555) 123-4567',
      callType: 'invalid' as any,
      callOutcome: 'completed'
    };

    const errors = validatePhoneLog(phoneLogWithInvalidType);
    expect(errors.callType).toBe('Invalid call type');
  });

  it('should validate call outcome', () => {
    const phoneLogWithInvalidOutcome: Partial<PhoneLog> = {
      phoneNumber: '(555) 123-4567',
      callType: 'incoming',
      callOutcome: 'invalid' as any
    };

    const errors = validatePhoneLog(phoneLogWithInvalidOutcome);
    expect(errors.callOutcome).toBe('Invalid call outcome');
  });
});

describe('validateOrderBusinessRules', () => {
  const validClient: Client = {
    id: '123',
    firstName: 'John',
    lastName: 'Doe',
    phone1: '(555) 123-4567',
    memberStatus: 'active',
    lastVisit: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  it('should validate order for active client', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const validOrder: Partial<Order> = {
      familySearchId: '123',
      numberOfBoxes: 1,
      pickupDate: tomorrow.toISOString()
    };

    const errors = validateOrderBusinessRules(validOrder, validClient);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('should prevent orders for inactive clients', () => {
    const inactiveClient = { ...validClient, memberStatus: 'inactive' };
    const order: Partial<Order> = {
      familySearchId: '123',
      numberOfBoxes: 1,
      pickupDate: new Date().toISOString()
    };

    const errors = validateOrderBusinessRules(order, inactiveClient);
    expect(errors.familySearchId).toBe('Cannot create orders for inactive clients');
  });

  it('should prevent orders for banned clients', () => {
    const bannedClient = { ...validClient, memberStatus: 'banned' };
    const order: Partial<Order> = {
      familySearchId: '123',
      numberOfBoxes: 1,
      pickupDate: new Date().toISOString()
    };

    const errors = validateOrderBusinessRules(order, bannedClient);
    expect(errors.familySearchId).toBe('Cannot create orders for banned clients');
  });

  it('should enforce 14-day wait period between orders', () => {
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    
    const clientWithRecentVisit = { 
      ...validClient, 
      lastVisit: tenDaysAgo.toISOString() 
    };

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const order: Partial<Order> = {
      familySearchId: '123',
      numberOfBoxes: 1,
      pickupDate: tomorrow.toISOString()
    };

    const errors = validateOrderBusinessRules(order, clientWithRecentVisit);
    expect(errors.pickupDate).toBe('Must wait 14 days between orders');
  });
});

describe('combineValidationResults', () => {
  it('should combine multiple validation results', () => {
    const clientErrors = { firstName: 'First name is required' };
    const orderErrors = { pickupDate: 'Pickup date is required' };
    const businessRuleErrors = { familySearchId: 'Cannot create orders for inactive clients' };

    const combined = combineValidationResults(clientErrors, orderErrors, businessRuleErrors);
    expect(combined).toEqual({
      firstName: 'First name is required',
      pickupDate: 'Pickup date is required',
      familySearchId: 'Cannot create orders for inactive clients'
    });
  });

  it('should handle empty validation results', () => {
    const result1 = {};
    const result2 = { error: 'Some error' };

    const combined = combineValidationResults(result1, result2);
    expect(combined).toEqual({ error: 'Some error' });
  });
}); 