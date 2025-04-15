import { validateClient, validateOrder, validatePhoneLog, validateOrderBusinessRules, combineValidationResults } from './validationUtils';
import { Client, Order, PhoneLog } from '../types';
import { MemberStatus } from '../types/client';
import { CallType, CallOutcome } from '../types/phoneLog';

describe('validateClient', () => {
  it('should validate a valid client', () => {
    const validClient: Partial<Client> = {
      first_name: 'John',
      last_name: 'Doe',
      phone1: '(555) 123-4567',
      email: 'john.doe@example.com',
      zip_code: '12345',
      address: '123 Main St',
      adults: 2,
      school_aged: 1,
      small_children: 1,
      is_unhoused: false,
      is_temporary: false
    };

    const errors = validateClient(validClient);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('should require first name, last name, and primary phone', () => {
    const invalidClient: Partial<Client> = {
      email: 'john.doe@example.com'
    };

    const errors = validateClient(invalidClient);
    expect(errors.first_name).toBe('First Name is required');
    expect(errors.last_name).toBe('Last Name is required');
    expect(errors.phone1).toBe('Primary Phone is required');
    expect(errors.zip_code).toBe('ZIP Code is required');
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
    expect(errors.email).toBe('Please enter a valid email address');
  });

  it('should validate ZIP code format if provided', () => {
    const clientWithInvalidZip: Partial<Client> = {
      first_name: 'John',
      last_name: 'Doe',
      phone1: '(555) 123-4567',
      zip_code: '1234'
    };

    const errors = validateClient(clientWithInvalidZip);
    expect(errors.zip_code).toBe('Please enter a valid ZIP code (XXXXX or XXXXX-XXXX)');
  });

  it('should validate required numeric fields', () => {
    const clientWithInvalidNumbers: Partial<Client> = {
      first_name: 'John',
      last_name: 'Doe',
      phone1: '(555) 123-4567',
      zip_code: '12345',
      adults: 0
    };

    const errors = validateClient(clientWithInvalidNumbers);
    expect(errors.adults).toBe('Must have at least 1 adult');
    expect(errors.school_aged).toBe('Number of school aged children is required');
    expect(errors.small_children).toBe('Number of small children is required');
  });
});

describe('validateOrder', () => {
  const baseOrder: Order = {
    id: '1',
    family_search_id: '123',
    number_of_boxes: 2,
    pickup_date: new Date(),
    status: 'pending',
    created_at: new Date(),
    updated_at: new Date(),
    delivery_type: 'pickup',
    is_new_client: false,
    approval_status: 'pending',
    additional_people: {
      adults: 0,
      school_aged: 0,
      small_children: 0
    }
  };

  it('should validate a valid order', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const validOrder: Order = {
      ...baseOrder,
      pickup_date: tomorrow
    };

    const errors = validateOrder(validOrder);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('should require family search ID, number of boxes, and pickup date', () => {
    const invalidOrder: Order = {
      ...baseOrder,
      family_search_id: '',
      number_of_boxes: 0,
      pickup_date: null as any
    };

    const errors = validateOrder(invalidOrder);
    expect(errors.family_search_id).toBe('Family search ID is required');
    expect(errors.number_of_boxes).toBe('Must have at least 1 box');
    expect(errors.pickup_date).toBe('Pickup date is required');
  });

  it('should validate additional people if provided', () => {
    const orderWithInvalidAdditional: Order = {
      ...baseOrder,
      additional_people: {
        adults: -1,
        school_aged: -1,
        small_children: -1
      }
    };

    const errors = validateOrder(orderWithInvalidAdditional);
    expect(errors.additional_adults).toBe('Cannot be negative');
    expect(errors.additional_school_aged).toBe('Cannot be negative');
    expect(errors.additional_small_children).toBe('Cannot be negative');
  });
});

describe('validatePhoneLog', () => {
  const basePhoneLog: PhoneLog = {
    id: '1',
    phoneNumber: '(555) 123-4567',
    callType: 'incoming' as CallType,
    callOutcome: 'successful' as CallOutcome,
    createdAt: new Date(),
    updatedAt: new Date(),
    familySearchId: '123'
  };

  it('should validate a valid phone log', () => {
    const validPhoneLog: PhoneLog = {
      ...basePhoneLog
    };

    const errors = validatePhoneLog(validPhoneLog);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('should require phone number and call type', () => {
    const invalidPhoneLog: Partial<PhoneLog> = {
      ...basePhoneLog,
      phoneNumber: '',
      callType: undefined
    };

    const errors = validatePhoneLog(invalidPhoneLog as PhoneLog);
    expect(errors.phoneNumber).toBe('Phone number is required');
    expect(errors.callType).toBe('Call type is required');
  });

  it('should validate phone number format', () => {
    const phoneLogWithInvalidPhone: PhoneLog = {
      ...basePhoneLog,
      phoneNumber: '5551234567'
    };

    const errors = validatePhoneLog(phoneLogWithInvalidPhone);
    expect(errors.phoneNumber).toBe('Phone number must be in format (XXX) XXX-XXXX');
  });

  it('should validate call type', () => {
    const phoneLogWithInvalidType: Partial<PhoneLog> = {
      phoneNumber: '(555) 123-4567',
      callType: 'invalid' as any,
      callOutcome: 'successful'
    };

    const errors = validatePhoneLog(phoneLogWithInvalidType as PhoneLog);
    expect(errors.callType).toBe('Invalid call type');
  });

  it('should validate call outcome', () => {
    const phoneLogWithInvalidOutcome: Partial<PhoneLog> = {
      phoneNumber: '(555) 123-4567',
      callType: 'incoming',
      callOutcome: 'invalid' as any
    };

    const errors = validatePhoneLog(phoneLogWithInvalidOutcome as PhoneLog);
    expect(errors.callOutcome).toBe('Invalid call outcome');
  });
});

describe('validateOrderBusinessRules', () => {
  const validClient: Client = {
    id: '123',
    family_number: 'F123',
    first_name: 'John',
    last_name: 'Doe',
    phone1: '(555) 123-4567',
    member_status: MemberStatus.Active,
    is_unhoused: false,
    is_temporary: false,
    adults: 2,
    school_aged: 1,
    small_children: 0,
    last_visit: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    total_visits: 0,
    total_this_month: 0
  };

  const baseOrder: Order = {
    id: '1',
    family_search_id: '123',
    number_of_boxes: 1,
    pickup_date: new Date(),
    status: 'pending',
    created_at: new Date(),
    updated_at: new Date(),
    delivery_type: 'pickup',
    is_new_client: false,
    approval_status: 'pending',
    additional_people: {
      adults: 0,
      school_aged: 0,
      small_children: 0
    }
  };

  it('should validate order for active client', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const validOrder: Order = {
      ...baseOrder,
      pickup_date: tomorrow
    };

    const errors = validateOrderBusinessRules(validOrder, validClient);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it('should prevent orders for denied clients', () => {
    const deniedClient = { ...validClient, member_status: MemberStatus.Denied };
    const order: Order = {
      ...baseOrder
    };

    const errors = validateOrderBusinessRules(order, deniedClient);
    expect(errors.family_search_id).toBe('Cannot create orders for denied clients');
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

    const order: Order = {
      ...baseOrder,
      pickup_date: tomorrow
    };

    const errors = validateOrderBusinessRules(order, clientWithRecentVisit);
    expect(errors.pickup_date).toBe('Must wait 14 days between orders');
  });
});

describe('combineValidationResults', () => {
  it('should combine multiple validation results', () => {
    const clientErrors = { first_name: 'First Name is required' };
    const orderErrors = { pickup_date: 'Pickup date is required' };
    const businessRuleErrors = { family_search_id: 'Cannot create orders for denied clients' };

    const combined = combineValidationResults(clientErrors, orderErrors, businessRuleErrors);
    expect(combined).toEqual({
      first_name: 'First Name is required',
      pickup_date: 'Pickup date is required',
      family_search_id: 'Cannot create orders for denied clients'
    });
  });

  it('should handle empty validation results', () => {
    const result1 = {};
    const result2 = { error: 'Some error' };

    const combined = combineValidationResults(result1, result2);
    expect(combined).toEqual({ error: 'Some error' });
  });
}); 