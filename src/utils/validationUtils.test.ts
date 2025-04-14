import { validateClient, validateOrder, validatePhoneLog, validateOrderBusinessRules, combineValidationResults } from './validationUtils';
import { Client, Order, PhoneLog } from '../types';

describe('validateClient', () => {
  it('should validate a valid client', () => {
    const validClient: Partial<Client> = {
      first_name: 'John',
      last_name: 'Doe',
      phone1: '(555) 123-4567',
      email: 'john.doe@example.com',
      zip_code: '12345',
      family_size: 3
    };

    const errors = validateClient(validClient);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('should require first name, last name, and primary phone', () => {
    const invalidClient: Partial<Client> = {
      email: 'john.doe@example.com'
    };

    const errors = validateClient(invalidClient);
    expect(errors.first_name).toBe('First name is required');
    expect(errors.last_name).toBe('Last name is required');
    expect(errors.phone1).toBe('Primary phone number is required');
  });

  it('should validate phone number format', () => {
    const clientWithInvalidPhone: Partial<Client> = {
      first_name: 'John',
      last_name: 'Doe',
      phone1: '5551234567',
      phone2: '123-456-7890'
    };

    const errors = validateClient(clientWithInvalidPhone);
    expect(errors.phone1).toBe('Phone number must be in format (XXX) XXX-XXXX');
    expect(errors.phone2).toBe('Phone number must be in format (XXX) XXX-XXXX');
  });

  it('should validate email format if provided', () => {
    const clientWithInvalidEmail: Partial<Client> = {
      first_name: 'John',
      last_name: 'Doe',
      phone1: '(555) 123-4567',
      email: 'invalid-email'
    };

    const errors = validateClient(clientWithInvalidEmail);
    expect(errors.email).toBe('Invalid email format');
  });

  it('should validate ZIP code format if provided', () => {
    const clientWithInvalidZip: Partial<Client> = {
      first_name: 'John',
      last_name: 'Doe',
      phone1: '(555) 123-4567',
      zip_code: '1234'
    };

    const errors = validateClient(clientWithInvalidZip);
    expect(errors.zip_code).toBe('ZIP code must be in format XXXXX or XXXXX-XXXX');
  });

  it('should validate family size limits', () => {
    const clientWithInvalidFamilySize: Partial<Client> = {
      first_name: 'John',
      last_name: 'Doe',
      phone1: '(555) 123-4567',
      family_size: 0
    };

    const errors = validateClient(clientWithInvalidFamilySize);
    expect(errors.family_size).toBe('Family size must be at least 1');

    clientWithInvalidFamilySize.family_size = 21;
    const moreErrors = validateClient(clientWithInvalidFamilySize);
    expect(moreErrors.family_size).toBe('Family size cannot exceed 20');
  });
});

describe('validateOrder', () => {
  it('should validate a valid order', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const validOrder: Partial<Order> = {
      family_search_id: '123',
      number_of_boxes: 2,
      pickup_date: tomorrow.toISOString(),
      status: 'pending'
    };

    const errors = validateOrder(validOrder);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('should require client, number of boxes, and pickup date', () => {
    const invalidOrder: Partial<Order> = {};

    const errors = validateOrder(invalidOrder);
    expect(errors.family_search_id).toBe('Client is required');
    expect(errors.number_of_boxes).toBe('At least one box is required');
    expect(errors.pickup_date).toBe('Pickup date is required');
  });

  it('should validate pickup date is not in the past', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const orderWithPastDate: Partial<Order> = {
      family_search_id: '123',
      number_of_boxes: 1,
      pickup_date: yesterday.toISOString()
    };

    const errors = validateOrder(orderWithPastDate);
    expect(errors.pickup_date).toBe('Pickup date cannot be in the past');
  });

  it('should validate pickup date is not too far in the future', () => {
    const farFuture = new Date();
    farFuture.setDate(farFuture.getDate() + 31);

    const orderWithFarDate: Partial<Order> = {
      family_search_id: '123',
      number_of_boxes: 1,
      pickup_date: farFuture.toISOString()
    };

    const errors = validateOrder(orderWithFarDate);
    expect(errors.pickup_date).toBe('Pickup date cannot be more than 30 days in the future');
  });

  it('should validate order status', () => {
    const orderWithInvalidStatus: Partial<Order> = {
      family_search_id: '123',
      number_of_boxes: 1,
      pickup_date: new Date().toISOString(),
      status: 'invalid_status' as any
    };

    const errors = validateOrder(orderWithInvalidStatus);
    expect(errors.status).toBe('Invalid status');
  });
});

describe('validatePhoneLog', () => {
  it('should validate a valid phone log', () => {
    const validPhoneLog: Partial<PhoneLog> = {
      phone_number: '(555) 123-4567',
      call_type: 'incoming',
      call_outcome: 'completed'
    };

    const errors = validatePhoneLog(validPhoneLog);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('should require phone number, call type, and call outcome', () => {
    const invalidPhoneLog: Partial<PhoneLog> = {};

    const errors = validatePhoneLog(invalidPhoneLog);
    expect(errors.phone_number).toBe('Phone number is required');
    expect(errors.call_type).toBe('Call type is required');
    expect(errors.call_outcome).toBe('Call outcome is required');
  });

  it('should validate phone number format', () => {
    const phoneLogWithInvalidPhone: Partial<PhoneLog> = {
      phone_number: '5551234567',
      call_type: 'incoming',
      call_outcome: 'completed'
    };

    const errors = validatePhoneLog(phoneLogWithInvalidPhone);
    expect(errors.phone_number).toBe('Phone number must be in format (XXX) XXX-XXXX');
  });

  it('should validate call type', () => {
    const phoneLogWithInvalidType: Partial<PhoneLog> = {
      phone_number: '(555) 123-4567',
      call_type: 'invalid' as any,
      call_outcome: 'completed'
    };

    const errors = validatePhoneLog(phoneLogWithInvalidType);
    expect(errors.call_type).toBe('Invalid call type');
  });

  it('should validate call outcome', () => {
    const phoneLogWithInvalidOutcome: Partial<PhoneLog> = {
      phone_number: '(555) 123-4567',
      call_type: 'incoming',
      call_outcome: 'invalid' as any
    };

    const errors = validatePhoneLog(phoneLogWithInvalidOutcome);
    expect(errors.call_outcome).toBe('Invalid call outcome');
  });
});

describe('validateOrderBusinessRules', () => {
  const validClient: Client = {
    id: '123',
    first_name: 'John',
    last_name: 'Doe',
    phone1: '(555) 123-4567',
    member_status: 'active',
    last_visit: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  it('should validate order for active client', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const validOrder: Partial<Order> = {
      family_search_id: '123',
      number_of_boxes: 1,
      pickup_date: tomorrow.toISOString()
    };

    const errors = validateOrderBusinessRules(validOrder, validClient);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('should prevent orders for inactive clients', () => {
    const inactiveClient = { ...validClient, member_status: 'inactive' };
    const order: Partial<Order> = {
      family_search_id: '123',
      number_of_boxes: 1,
      pickup_date: new Date().toISOString()
    };

    const errors = validateOrderBusinessRules(order, inactiveClient);
    expect(errors.family_search_id).toBe('Cannot create orders for inactive clients');
  });

  it('should prevent orders for banned clients', () => {
    const bannedClient = { ...validClient, member_status: 'banned' };
    const order: Partial<Order> = {
      family_search_id: '123',
      number_of_boxes: 1,
      pickup_date: new Date().toISOString()
    };

    const errors = validateOrderBusinessRules(order, bannedClient);
    expect(errors.family_search_id).toBe('Cannot create orders for banned clients');
  });

  it('should enforce 14-day wait period between orders', () => {
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    
    const clientWithRecentVisit = { 
      ...validClient, 
      last_visit: tenDaysAgo.toISOString() 
    };

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const order: Partial<Order> = {
      family_search_id: '123',
      number_of_boxes: 1,
      pickup_date: tomorrow.toISOString()
    };

    const errors = validateOrderBusinessRules(order, clientWithRecentVisit);
    expect(errors.pickup_date).toBe('Must wait 14 days between orders');
  });
});

describe('combineValidationResults', () => {
  it('should combine multiple validation results', () => {
    const clientErrors = { first_name: 'First name is required' };
    const orderErrors = { pickup_date: 'Pickup date is required' };
    const businessRuleErrors = { family_search_id: 'Cannot create orders for inactive clients' };

    const combined = combineValidationResults(clientErrors, orderErrors, businessRuleErrors);
    expect(combined).toEqual({
      first_name: 'First name is required',
      pickup_date: 'Pickup date is required',
      family_search_id: 'Cannot create orders for inactive clients'
    });
  });

  it('should handle empty validation results', () => {
    const result1 = {};
    const result2 = { error: 'Some error' };

    const combined = combineValidationResults(result1, result2);
    expect(combined).toEqual({ error: 'Some error' });
  });
}); 