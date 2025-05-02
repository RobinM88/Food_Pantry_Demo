/**
 * Utility functions for date handling
 * Handles conversion between ISO string timestamps (from API) and JavaScript Date objects
 */

/**
 * Convert a string timestamp to a Date object
 * @param timestamp The timestamp string from the API
 * @returns A JavaScript Date object, or null if timestamp is null/undefined
 */
export function toDate(timestamp: string | null | undefined): Date | null {
  if (!timestamp) return null;
  return new Date(timestamp);
}

/**
 * Convert a Date object to an ISO string timestamp for API requests
 * @param date The Date object to convert
 * @returns An ISO string timestamp, or null if date is null/undefined
 */
export function toISOString(date: Date | null | undefined): string | null {
  if (!date) return null;
  return date instanceof Date ? date.toISOString() : null;
}

/**
 * Format a date for display
 * @param date The date to format (can be Date object or string)
 * @param format Optional format string
 * @returns Formatted date string, or empty string if date is invalid
 */
export function formatDate(date: Date | string | null | undefined, format: string = 'yyyy-MM-dd'): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Simple formatter - can be expanded with more options
  try {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    
    return format
      .replace('yyyy', String(year))
      .replace('MM', month)
      .replace('dd', day);
  } catch (err) {
    console.error('Error formatting date:', err);
    return '';
  }
} 