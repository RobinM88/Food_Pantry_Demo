/**
 * Validates if a string is a valid US phone number
 * @param phone The phone number to validate
 * @returns boolean indicating if the phone number is valid
 */
export const isValidUSPhoneNumber = (phone: string): boolean => {
  if (!phone) return false;
  
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

  // Exchange codes can now start with any digit (1-9)
  return true;
};

/**
 * Formats a phone number to the standard US format (XXX) XXX-XXXX
 * Safely handles undefined, null, or invalid input
 * @param value The phone number to format
 * @returns Formatted phone number or placeholder if invalid
 */
export const formatPhoneNumber = (value: string | null | undefined): string => {
  // Handle null, undefined, or empty values
  if (!value) {
    return 'N/A';
  }
  
  try {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Check if we have enough digits to format
    if (digits.length < 3) {
      return value; // Return original if too few digits
    }
    
    // Format as (XXX) XXX-XXXX
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
  } catch (error) {
    console.error('Error formatting phone number:', error);
    return value || 'N/A'; // Return original value on error instead of 'Invalid'
  }
};

/**
 * Normalizes a phone number for storage
 * @param phone The phone number to normalize
 * @returns Normalized phone number or null if invalid
 */
export const normalizePhoneNumber = (phone: string | null | undefined): string | null => {
  if (!phone) return null;
  
  try {
    const digits = phone.replace(/\D/g, '');
    return isValidUSPhoneNumber(digits) ? digits : null;
  } catch (error) {
    console.error('Error normalizing phone number:', error);
    return null;
  }
}; 