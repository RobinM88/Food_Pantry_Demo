import { formatPhoneNumber } from '../phoneNumberUtils';

describe('formatPhoneNumber', () => {
  test('formats a complete phone number correctly', () => {
    expect(formatPhoneNumber('1234567890')).toBe('123-456-7890');
    expect(formatPhoneNumber('5551234567')).toBe('555-123-4567');
  });

  test('handles phone numbers with non-digit characters', () => {
    expect(formatPhoneNumber('(123) 456-7890')).toBe('123-456-7890');
    expect(formatPhoneNumber('123.456.7890')).toBe('123-456-7890');
    expect(formatPhoneNumber('123 456 7890')).toBe('123-456-7890');
  });

  test('handles partial phone numbers', () => {
    expect(formatPhoneNumber('123')).toBe('123');
    expect(formatPhoneNumber('1234')).toBe('123-4');
    expect(formatPhoneNumber('12345')).toBe('123-45');
    expect(formatPhoneNumber('123456')).toBe('123-456');
    expect(formatPhoneNumber('1234567')).toBe('123-456-7');
    expect(formatPhoneNumber('12345678')).toBe('123-456-78');
    expect(formatPhoneNumber('123456789')).toBe('123-456-789');
  });

  test('handles empty or invalid input', () => {
    expect(formatPhoneNumber('')).toBe('');
    expect(formatPhoneNumber('abc')).toBe('');
    expect(formatPhoneNumber('123abc456')).toBe('123-456');
  });
}); 