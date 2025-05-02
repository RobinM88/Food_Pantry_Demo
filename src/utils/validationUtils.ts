import { Order, Client, MemberStatus, REQUIRED_FIELDS } from '../types';
import type { NewClient } from '../types/client';

type ValidationErrors = Record<string, string>;

// Client Validations
export const validateClient = (client: NewClient | Partial<Client>): ValidationErrors => {
  const errors: ValidationErrors = {};

  // Required Fields
  if (!client.first_name?.trim()) {
    errors.first_name = `${REQUIRED_FIELDS.first_name} is required`;
  }
  if (!client.last_name?.trim()) {
    errors.last_name = `${REQUIRED_FIELDS.last_name} is required`;
  }
  if (!client.phone1?.trim()) {
    errors.phone1 = `${REQUIRED_FIELDS.phone1} is required`;
  }
  if (!client.zip_code?.trim()) {
    errors.zip_code = `${REQUIRED_FIELDS.zip_code} is required`;
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
    errors.email = 'Please enter a valid email address';
  }

  // ZIP Code Format (if provided)
  const zipRegex = /^\d{5}(-\d{4})?$/;
  if (client.zip_code && !zipRegex.test(client.zip_code)) {
    errors.zip_code = 'Please enter a valid ZIP code (XXXXX or XXXXX-XXXX)';
  }

  // Address is required unless unhoused
  if (!client.is_unhoused && !client.address?.trim()) {
    errors.address = REQUIRED_FIELDS.address;
  }

  // Validate numeric fields
  if (typeof client.adults === 'undefined' || client.adults < 1) {
    errors.adults = 'Must have at least 1 adult';
  }

  if (typeof client.school_aged === 'undefined') {
    errors.school_aged = 'Number of school aged children is required';
  } else if (client.school_aged < 0) {
    errors.school_aged = 'Cannot be negative';
  }

  if (typeof client.small_children === 'undefined') {
    errors.small_children = 'Number of small children is required';
  } else if (client.small_children < 0) {
    errors.small_children = 'Cannot be negative';
  }

  // Validate member status if provided
  if (client.member_status && !Object.values(MemberStatus).includes(client.member_status)) {
    errors.member_status = 'Invalid member status';
  }

  // Validate temporary members if applicable
  if (client.is_temporary && client.temporary_members) {
    if (typeof client.temporary_members.adults === 'undefined' || client.temporary_members.adults < 0) {
      errors.temporaryAdults = 'Cannot be negative';
    }
    if (typeof client.temporary_members.school_aged === 'undefined' || client.temporary_members.school_aged < 0) {
      errors.temporarySchoolAged = 'Cannot be negative';
    }
    if (typeof client.temporary_members.small_children === 'undefined' || client.temporary_members.small_children < 0) {
      errors.temporarySmallChildren = 'Cannot be negative';
    }
  }

  // Validate system-managed fields if it's a NewClient
  if ('total_visits' in client) {
    if (typeof client.total_visits !== 'undefined' && client.total_visits < 0) {
      errors.total_visits = 'Total visits cannot be negative';
    }
    if (typeof client.total_this_month !== 'undefined' && client.total_this_month < 0) {
      errors.total_this_month = 'Total visits this month cannot be negative';
    }
  }

  return errors;
};

// Order Validations
export const validateOrder = (order: Order): ValidationErrors => {
  const errors: ValidationErrors = {};

  // Required Fields
  if (!order.family_number?.trim()) {
    errors.family_number = 'Family number is required';
  }

  // Pickup Date Validation
  if (!order.pickup_date || order.pickup_date === null) {
    errors.pickup_date = 'Pickup date is required';
  }

  // Number of Boxes Validation
  if (typeof order.number_of_boxes === 'undefined' || order.number_of_boxes < 1) {
    errors.number_of_boxes = 'Must have at least 1 box';
  }

  // Additional People Validation
  if (order.additional_people) {
    if (typeof order.additional_people.adults === 'undefined' || order.additional_people.adults < 0) {
      errors.additional_adults = 'Cannot be negative';
    }
    if (typeof order.additional_people.school_aged === 'undefined' || order.additional_people.school_aged < 0) {
      errors.additional_school_aged = 'Cannot be negative';
    }
    if (typeof order.additional_people.small_children === 'undefined' || order.additional_people.small_children < 0) {
      errors.additional_small_children = 'Cannot be negative';
    }
  }

  return errors;
};

// Phone Log Validations
export function validatePhoneLog(log: any) {
  const errors: Record<string, string> = {};
  const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;

  // Required fields
  if (!log.phone_number?.trim()) {
    errors.phone_number = 'Phone number is required';
  }
  if (!log.call_type?.trim()) {
    errors.call_type = 'Call type is required';
  }

  // Format validation
  if (log.phone_number && !phoneRegex.test(log.phone_number)) {
    errors.phone_number = 'Phone number must be in format (XXX) XXX-XXXX';
  }

  // Enum validation
  if (log.call_type && !['incoming', 'outgoing'].includes(log.call_type)) {
    errors.call_type = 'Invalid call type';
  }

  if (log.call_outcome && !['successful', 'voicemail', 'no_answer', 'wrong_number', 'disconnected'].includes(log.call_outcome)) {
    errors.call_outcome = 'Invalid call outcome';
  }

  return errors;
}

// Business Rule Validations
export const validateOrderBusinessRules = (
  order: Partial<Order>, 
  client: Client | undefined
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!client) {
    errors.family_number = 'Client not found';
    return errors;
  }

  // Check client status
  if (client.member_status === MemberStatus.Denied) {
    errors.family_number = 'Cannot create orders for denied clients';
  }

  // Check frequency of orders
  if (order.pickup_date) {
    const pickup_date = new Date(order.pickup_date);
    const lastVisit = client.last_visit ? new Date(client.last_visit) : null;

    if (lastVisit) {
      const daysSinceLastVisit = Math.floor(
        (pickup_date.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastVisit < 14) {
        errors.pickup_date = 'Must wait 14 days between orders';
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