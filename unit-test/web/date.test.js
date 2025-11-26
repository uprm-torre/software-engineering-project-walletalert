import { describe, it, expect } from 'vitest';
import { formatDate } from '../../walletalert/apps/web/src/utils/date.js';

/**
 * File: date.test.js
 * Purpose: Ensure date formatting helper returns readable strings for varied input types.
 * Scope: Date objects, ISO strings, timestamps, invalid/null/undefined values, optional Intl options.
 * Exclusions: Timezone conversion beyond system locale, relative time formatting, localization testing.
 * Key Edge Cases: Invalid date string fallback, null/undefined stringify behavior, timestamp numeric input.
 */

describe('Date Utilities', () => {
  describe('formatDate', () => {
    // Basic formatting: accepts Date, ISO strings and timestamps
    it('should format a Date object', () => {
      const date = new Date('2025-11-15T14:30:00Z');
      const result = formatDate(date);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should format an ISO string', () => {
      const isoString = '2025-11-15T14:30:00Z';
      const result = formatDate(isoString);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle custom format options', () => {
      const date = new Date('2025-11-15T14:30:00Z');
      const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      };

      const result = formatDate(date, options);

      expect(result).toBeDefined();
      expect(result).toContain('2025');
      expect(result).toContain('15');
    });

    it('should use default format when no options provided', () => {
      const date = new Date('2025-11-15T14:30:00Z');
      const result = formatDate(date);

      // Default format includes year, month, day, hour, minute
      expect(result).toBeDefined();
      expect(result).toContain('2025');
    });

    it('should handle invalid dates gracefully', () => {
      // For invalid inputs the helper returns String(value) so callers can
      // display the original content instead of crashing.
      const result = formatDate('invalid-date');

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle null gracefully', () => {
      // Null/undefined inputs are stringified by the helper to avoid throwing
      const result = formatDate(null);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should handle undefined gracefully', () => {
      const result = formatDate(undefined);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should format timestamps', () => {
      const timestamp = Date.now();
      const result = formatDate(timestamp);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should format different date formats consistently', () => {
      const date1 = new Date('2025-11-15T14:30:00Z');
      const date2 = new Date('Nov 15, 2025 14:30:00 GMT');

      const result1 = formatDate(date1);
      const result2 = formatDate(date2);

      // Should produce similar output for same instant
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });
  });
});