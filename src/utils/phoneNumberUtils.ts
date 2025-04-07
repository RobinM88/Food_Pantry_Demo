/**
 * Validates if a string is a valid US phone number
 * @param phone The phone number to validate
 * @returns boolean indicating if the phone number is valid
 */
export const isValidUSPhoneNumber = (phone: string): boolean => {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Check if we have exactly 10 digits
  if (digits.length !== 10) {
    return false;
  }

  // Check if the area code starts with a valid digit (2-9)
  if (!/^[2-9]/.test(digits)) {
    return false;
  }

  // Check if the exchange code (next 3 digits) starts with a valid digit (2-9)
  if (!/^[2-9]/.test(digits.substring(3, 4))) {
    return false;
  }

  return true;
};

/**
 * Formats a phone number to the standard US format (XXX) XXX-XXXX
 * @param value The phone number to format
 * @returns Formatted phone number
 */
export const formatPhoneNumber = (value: string): string => {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX
  if (digits.length <= 3) {
    return digits;
  } else if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  } else {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
};

/**
 * Normalizes a phone number for storage
 * @param phone The phone number to normalize
 * @returns Normalized phone number or null if invalid
 */
export const normalizePhoneNumber = (phone: string): string | null => {
  const digits = phone.replace(/\D/g, '');
  return isValidUSPhoneNumber(digits) ? digits : null;
}; 