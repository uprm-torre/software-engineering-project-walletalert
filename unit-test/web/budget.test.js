import { describe, it, expect } from 'vitest';
import {
  getCurrentPeriodStart,
  filterTransactionsByPeriod,
  calculateCurrentPeriodSpending
} from '../../walletalert/apps/web/src/utils/budget.js';

/**
 * File: budget.test.js
 * Purpose: Verify budget utility logic (period start, filtering, current spending calc) for UI state.
 * Scope: Weekly/monthly boundaries, transaction inclusion rules, invalid/legacy field handling (createdAt vs date).
 * Exclusions: Persistence, cross-user aggregation, future period projections.
 * Key Edge Cases: Unknown period fallback to monthly, filtering with mixed date fields, ignoring invalid amounts.
 */

describe('Budget Utilities', () => {
  describe('getCurrentPeriodStart', () => {
    // getCurrentPeriodStart returns a Date set to the beginning of the
    // specified period in local time (Monday 00:00 for weekly, 1st 00:00 for monthly).
    it('should return start of current week (Monday) for weekly period', () => {
      const start = getCurrentPeriodStart('weekly');

      expect(start).toBeInstanceOf(Date);
      expect(start.getDay()).toBe(1); // Monday
      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
      expect(start.getSeconds()).toBe(0);
    });

    it('should return start of current month for monthly period', () => {
      const start = getCurrentPeriodStart('monthly');

      expect(start).toBeInstanceOf(Date);
      expect(start.getDate()).toBe(1); // 1st day
      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
      expect(start.getSeconds()).toBe(0);
    });

    it('should default to monthly period for unknown period', () => {
      // Unknown periods fall back to monthly behavior to avoid accidental
      // yearly semantics in code that expects monthly/week granularity.
      const start = getCurrentPeriodStart('yearly');

      expect(start).toBeInstanceOf(Date);
      expect(start.getDate()).toBe(1);
    });
  });

  describe('filterTransactionsByPeriod', () => {
    const transactions = [
      { date: '2025-11-01T10:00:00Z', amount: 100 },
      { date: '2025-11-10T10:00:00Z', amount: 50 },
      { date: '2025-11-15T10:00:00Z', amount: 75 },
      { date: '2025-10-25T10:00:00Z', amount: 200 },
    ];

    it('should filter transactions for monthly period', () => {
      const filtered = filterTransactionsByPeriod(transactions, 'monthly');

      // Should include November transactions (current month)
      expect(filtered.length).toBeGreaterThan(0);
      filtered.forEach(tx => {
        const date = new Date(tx.date);
        expect(date.getMonth()).toBe(new Date().getMonth());
      });
    });

    it('should filter transactions for weekly period', () => {
      const thisWeekTransactions = [
        { date: new Date().toISOString(), amount: 50 },
        { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), amount: 30 },
        { date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), amount: 100 },
      ];

      const filtered = filterTransactionsByPeriod(thisWeekTransactions, 'weekly');

      expect(filtered.length).toBeGreaterThanOrEqual(1);
    });

    it('should return empty array for transactions before period start', () => {
      const oldTransactions = [
        { date: '2024-01-01T10:00:00Z', amount: 100 },
        { date: '2024-06-15T10:00:00Z', amount: 50 },
      ];

      const filtered = filterTransactionsByPeriod(oldTransactions, 'monthly');

      expect(filtered.length).toBe(0);
    });

    it('should handle transactions with createdAt instead of date', () => {
      // Some parts of the app store `createdAt` instead of `date`; ensure the
      // filter function accepts either field when determining period membership.
      const transactions = [
        { createdAt: new Date().toISOString(), amount: 50 },
        { createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), amount: 30 },
      ];

      const filtered = filterTransactionsByPeriod(transactions, 'weekly');

      expect(filtered.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('calculateCurrentPeriodSpending', () => {
    const currentDate = new Date().toISOString();
    const lastWeek = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();

    it('should calculate total spending for current period', () => {
      const transactions = [
        { date: currentDate, amount: 50 },
        { date: currentDate, amount: 30 },
        { date: lastWeek, amount: 100 },
      ];

      const budgets = [{ period: 'weekly', amount: 200 }];

      const total = calculateCurrentPeriodSpending(transactions, budgets);

      // Should only count this week's transactions
      expect(total).toBeGreaterThan(0);
      expect(total).toBeLessThanOrEqual(80);
    });

    it('should use weekly period if budgets include weekly', () => {
      const transactions = [
        { date: currentDate, amount: 50 },
      ];

      const budgets = [
        { period: 'weekly', amount: 100 },
        { period: 'monthly', amount: 500 }
      ];

      const total = calculateCurrentPeriodSpending(transactions, budgets);

      expect(total).toBe(50);
    });

    it('should default to monthly if no budgets provided', () => {
      const transactions = [
        { date: currentDate, amount: 100 },
      ];

      const budgets = [];

      const total = calculateCurrentPeriodSpending(transactions, budgets);

      expect(total).toBe(100);
    });

    it('should ignore invalid transaction amounts', () => {
      const transactions = [
        { date: currentDate, amount: 50 },
        { date: currentDate, amount: 'invalid' },
        { date: currentDate, amount: -10 },
        { date: currentDate, amount: null },
      ];

      const budgets = [{ period: 'monthly', amount: 500 }];

      const total = calculateCurrentPeriodSpending(transactions, budgets);

      expect(total).toBe(50);
    });

    it('should return 0 for empty transactions', () => {
      const transactions = [];
      const budgets = [{ period: 'monthly', amount: 500 }];

      const total = calculateCurrentPeriodSpending(transactions, budgets);

      expect(total).toBe(0);
    });
  });
});
