import { describe, it, expect } from 'vitest';
import { formatCurrency } from '../../walletalert/apps/web/src/utils/format.js';

/**
 * File: format.test.js
 * Purpose: Validate currency formatting helper for numerical, string, null/undefined inputs.
 * Scope: USD baseline, alternate currency codes, invalid code fallback, rounding, large/small values.
 * Exclusions: Locale-specific grouping beyond default, high-precision (>2dp) financial rounding rules.
 * Key Edge Cases: Negative values, invalid currency code -> USD, very small decimals, string numeric coercion.
 */

describe('Format Utilities', () => {
  describe('formatCurrency', () => {
    it('should format positive numbers as USD currency', () => {
      const result = formatCurrency(1234.56);

      // Should contain the number formatted as currency
      expect(result).toContain('1,234.56');
      expect(result).toContain('$');
    });

    it('should format zero', () => {
      const result = formatCurrency(0);

      expect(result).toContain('0');
      expect(result).toContain('$');
    });

    it('should format negative numbers', () => {
      const result = formatCurrency(-50.25);

      expect(result).toContain('50.25');
      expect(result).toContain('$');
    });

    it('should handle string numbers', () => {
      const result = formatCurrency('123.45');

      expect(result).toContain('123.45');
      expect(result).toContain('$');
    });

    it('should handle null or undefined as zero', () => {
      const resultNull = formatCurrency(null);
      const resultUndefined = formatCurrency(undefined);

      expect(resultNull).toContain('0');
      expect(resultUndefined).toContain('0');
    });

    it('should format with different currency', () => {
      const result = formatCurrency(100, 'EUR');

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should use fallback for invalid currency', () => {
      const result = formatCurrency(100, 'INVALID');

      // When an unknown currency code is provided the helper falls back to
      // USD formatting so callers get a predictable string instead of an error.
      expect(result).toBe('$100.00');
    });

    it('should round to 2 decimal places', () => {
      const result1 = formatCurrency(10.999);
      const result2 = formatCurrency(10.001);

      expect(result1).toContain('11.00');
      expect(result2).toContain('10.00');
    });

    it('should handle large numbers', () => {
      const result = formatCurrency(1000000.50);

      expect(result).toContain('1,000,000.50');
      expect(result).toContain('$');
    });

    it('should handle very small numbers', () => {
      const result = formatCurrency(0.01);

      expect(result).toContain('0.01');
      expect(result).toContain('$');
    });
  });
});
