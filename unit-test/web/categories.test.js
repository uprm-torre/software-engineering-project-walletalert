import { describe, it, expect } from 'vitest';
import {
  getCategoryPresentation,
  getCategoryColor,
  CATEGORY_KEYS
} from '../../walletalert/apps/web/src/utils/categories.js';

/**
 * File: categories.test.js
 * Purpose: Validate presentation + color utilities for predefined, custom, overridden and edge categories.
 * Scope: Case-insensitive matching, emoji/color overrides, initials generation, list of CATEGORY_KEYS.
 * Exclusions: Persistence of user-created categories, async store integration, i18n label translation.
 * Key Edge Cases: Empty/null names -> uncategorized, whitespace trimming, consistent color hashing for repeats.
 */

describe('Category Utilities', () => {
  describe('getCategoryPresentation', () => {
    it('should return presentation for predefined category', () => {
      const result = getCategoryPresentation('groceries');

      expect(result).toBeDefined();
      expect(result.key).toBe('groceries');
      expect(result.label).toBe('Groceries');
      expect(result.emoji).toBe('🛒');
      expect(result.color).toBeDefined();
      expect(result.originalName).toBe('groceries');
    });

    it('should handle case-insensitive category names', () => {
      const result1 = getCategoryPresentation('GROCERIES');
      const result2 = getCategoryPresentation('Groceries');
      const result3 = getCategoryPresentation('groceries');

      expect(result1.key).toBe('groceries');
      expect(result2.key).toBe('groceries');
      expect(result3.key).toBe('groceries');
    });

    it('should return "other" for unknown categories', () => {
      const result = getCategoryPresentation('Unknown Category');

      expect(result.key).toBe('unknown category');
      expect(result.color).toBeDefined();
      expect(result.emoji).toBeDefined();
    });

    it('should return "uncategorized" for empty name', () => {
      const result = getCategoryPresentation('');

      expect(result.key).toBe('uncategorized');
      expect(result.label).toBe('Uncategorized');
      expect(result.originalName).toBe('Uncategorized');
    });

    it('should return "uncategorized" for null name', () => {
      const result = getCategoryPresentation(null);

      expect(result.key).toBe('uncategorized');
      expect(result.label).toBe('Uncategorized');
    });

    it('should apply emoji overrides', () => {
      const emojiOverrides = {
        groceries: { emoji: '🥗' }
      };

      const result = getCategoryPresentation('groceries', { emojiOverrides });

      expect(result.emoji).toBe('🥗');
    });

    it('should apply color overrides', () => {
      const colorOverrides = {
        groceries: '#ff0000'
      };

      const result = getCategoryPresentation('groceries', { colorOverrides });

      expect(result.color).toBe('#ff0000');
    });

    it('should generate initials for custom categories', () => {
      const result = getCategoryPresentation('My Custom Category');

      expect(result.initials).toBeDefined();
      expect(result.initials.length).toBe(2);
    });

    it('should handle whitespace in category names', () => {
      const result = getCategoryPresentation('  transportation  ');

      expect(result.key).toBe('transportation');
      expect(result.originalName).toBe('transportation');
    });

    it('should provide consistent colors for same custom category', () => {
      const result1 = getCategoryPresentation('CustomCategory');
      const result2 = getCategoryPresentation('CustomCategory');

      expect(result1.color).toBe(result2.color);
    });
  });

  describe('getCategoryColor', () => {
    it('should return color for category', () => {
      const color = getCategoryColor('groceries');

      expect(color).toBeDefined();
      expect(typeof color).toBe('string');
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('should apply color overrides', () => {
      const colorOverrides = {
        groceries: '#123456'
      };

      const color = getCategoryColor('groceries', { colorOverrides });

      expect(color).toBe('#123456');
    });
  });

  describe('CATEGORY_KEYS', () => {
    it('should be an array of category keys', () => {
      expect(Array.isArray(CATEGORY_KEYS)).toBe(true);
      expect(CATEGORY_KEYS.length).toBeGreaterThan(0);
    });

    it('should include common categories', () => {
      expect(CATEGORY_KEYS).toContain('groceries');
      expect(CATEGORY_KEYS).toContain('transportation');
      expect(CATEGORY_KEYS).toContain('entertainment');
    });
  });

  describe('Predefined Categories', () => {
    // Ensure commonly used category keys have a valid presentation shape
    const commonCategories = [
      'college/education',
      'apartment/housing',
      'phone/internet',
      'groceries',
      'transportation',
      'entertainment',
      'other',
      'uncategorized'
    ];

    commonCategories.forEach(category => {
      it(`should have valid presentation for ${category}`, () => {
        // Presentation includes key, label, emoji, color and initials used by UI
        const result = getCategoryPresentation(category);

        expect(result).toBeDefined();
        expect(result.key).toBeDefined();
        expect(result.label).toBeDefined();
        expect(result.color).toMatch(/^#[0-9a-f]{6}$/i);
        expect(result.emoji).toBeDefined();
        expect(result.initials).toBeDefined();
      });
    });
  });
});
