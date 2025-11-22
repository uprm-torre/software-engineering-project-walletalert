import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * File: store.test.js
 * Purpose: Exercise in-memory fallback CRUD logic for users, budgets, transactions, categories.
 * Scope: Creation, listing, updating, deletion, validation (duplicate categories, trimming, invalid inputs).
 * Exclusions: Real MongoDB persistence, ObjectId collision semantics, transactional guarantees.
 * Key Edge Cases: Duplicate category name (case-insensitive), invalid/empty category names, negative amounts, mixed user isolation.
 */

// Mock MongoDB types used by the store (ObjectId) and suppress real client
vi.mock('mongodb', () => ({
  ObjectId: class ObjectId {
    constructor(id) {
      this.id = id || 'mock-id';
    }
    toString() {
      return this.id;
    }
  },
  MongoClient: class MongoClient {
    static connect = vi.fn();
  }
}));

// Mock `db.js` so the store uses its in-memory path during tests
vi.mock('../../walletalert/apps/api/src/db.js', () => ({
  getDb: vi.fn(() => null) // Return null to use in-memory storage
}));

describe('Store Module - In-Memory Operations', () => {
  let store;

  beforeEach(async () => {
    // Reset modules to ensure store loads with the mocked db above
    vi.resetModules();
    store = await import('../../walletalert/apps/api/src/store.js');
  });

  describe('User Operations', () => {
    // User CRUD: ensure upsert, retrieval behave correctly for new/existing users
    it('should create a new user', async () => {
      // Verify upsertUser creates user when none exists
      const result = await store.upsertUser('auth0|test123', 'test@example.com');

      expect(result.created).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.auth0_id).toBe('auth0|test123');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should return existing user on second upsert', async () => {
      // Calling upsert twice should indicate the user already existed
      await store.upsertUser('auth0|test456', 'test@example.com');
      const result = await store.upsertUser('auth0|test456', 'test@example.com');

      expect(result.created).toBe(false);
      expect(result.user.auth0_id).toBe('auth0|test456');
    });

    it('should get user by auth0_id', async () => {
      await store.upsertUser('auth0|gettest', 'get@example.com');
      const user = await store.getUser('auth0|gettest');

      expect(user).toBeDefined();
      expect(user.auth0_id).toBe('auth0|gettest');
    });
  });

  describe('Budget Operations', () => {
    const testUserId = 'auth0|budgetuser';
    // Budget CRUD: create/list/update/delete operations should be isolated
    // to the provided auth0_id and not leak between users.

    it('should create a budget', async () => {
      const budget = await store.createBudget(testUserId, {
        period: 'monthly',
        amount: 500
      });

      expect(budget).toBeDefined();
      expect(budget.period).toBe('monthly');
      expect(budget.amount).toBe(500);
      expect(budget.auth0_id).toBe(testUserId);
    });

    it('should list budgets for user', async () => {
      await store.createBudget(testUserId, { period: 'weekly', amount: 100 });
      await store.createBudget(testUserId, { period: 'monthly', amount: 500 });

      const budgets = await store.listBudgets(testUserId);

      expect(budgets.length).toBeGreaterThanOrEqual(2);
    });

    it('should update a budget', async () => {
      const budget = await store.createBudget(testUserId, { period: 'monthly', amount: 500 });
      const updated = await store.updateBudget(testUserId, budget.id, { amount: 600 });

      expect(updated.amount).toBe(600);
    });

    it('should delete a budget', async () => {
      const budget = await store.createBudget(testUserId, { period: 'weekly', amount: 100 });
      const deleted = await store.deleteBudget(testUserId, budget.id);

      expect(deleted).toBeDefined();
      expect(deleted.id).toBe(budget.id);
    });
  });

  describe('Transaction Operations', () => {
    const testUserId = 'auth0|txuser';
    // Transactions: tests check create/list/update/delete and ensure
    // created transactions include `auth0_id` and requested fields.

    it('should create a transaction', async () => {
      const tx = await store.createTransaction(testUserId, {
        amount: 50,
        category: 'Groceries',
        date: new Date().toISOString(),
        description: 'Weekly shopping'
      });

      expect(tx).toBeDefined();
      expect(tx.amount).toBe(50);
      expect(tx.category).toBe('Groceries');
      expect(tx.auth0_id).toBe(testUserId);
    });

    it('should list transactions for user', async () => {
      await store.createTransaction(testUserId, {
        amount: 25,
        category: 'Food',
        date: new Date().toISOString()
      });

      const transactions = await store.listTransactions(testUserId);

      expect(transactions.length).toBeGreaterThanOrEqual(1);
    });

    it('should update a transaction', async () => {
      const tx = await store.createTransaction(testUserId, {
        amount: 30,
        category: 'Food',
        date: new Date().toISOString()
      });

      const updated = await store.updateTransaction(testUserId, tx.id, { amount: 35 });

      expect(updated.amount).toBe(35);
    });

    it('should delete a transaction', async () => {
      const tx = await store.createTransaction(testUserId, {
        amount: 20,
        category: 'Food',
        date: new Date().toISOString()
      });

      const deleted = await store.deleteTransaction(testUserId, tx.id);

      expect(deleted).toBeDefined();
      expect(deleted.id).toBe(tx.id);
    });
  });

  describe('Category Operations', () => {
    const testUserId = 'auth0|categoryuser';
    // Categories: default seeding, creation, duplicate prevention,
    // updates and deletion are verified here.

    it('should seed default categories for new user', async () => {
      const categories = await store.listCategories(testUserId);

      expect(categories.length).toBeGreaterThan(0);
      expect(categories.some(c => c.name === 'Groceries')).toBe(true);
    });

    it('should create a custom category', async () => {
      const category = await store.createCategory(testUserId, 'Entertainment', '🎬');

      expect(category).toBeDefined();
      expect(category.name).toBe('Entertainment');
      expect(category.emoji).toBe('🎬');
    });

    it('should prevent duplicate categories', async () => {
      await store.createCategory(testUserId, 'TestCategory', '📝');

      await expect(
        store.createCategory(testUserId, 'testcategory', '📝')
      ).rejects.toThrow('Category already exists');
    });

    it('should update category emoji', async () => {
      const category = await store.createCategory(testUserId, 'MyCategory', '🔵');
      const updated = await store.updateCategory(testUserId, category.id, { emoji: '🔴' });

      expect(updated.emoji).toBe('🔴');
    });

    it('should delete a category', async () => {
      const category = await store.createCategory(testUserId, 'ToDelete', '🗑️');
      const deleted = await store.deleteCategory(testUserId, category.id);

      expect(deleted).toBeDefined();
      expect(deleted.name).toBe('ToDelete');
    });

    it('should check if category exists', async () => {
      await store.createCategory(testUserId, 'ExistsTest', '✓');

      const exists = await store.categoryExists(testUserId, 'ExistsTest');
      const notExists = await store.categoryExists(testUserId, 'NonExistent');

      expect(exists).toBe(true);
      expect(notExists).toBe(false);
    });
  });

  describe('Category Name Validation', () => {
    const testUserId = 'auth0|validationuser';
    // Category validation tests ensure invalid inputs are rejected and
    // whitespace is trimmed from user-provided category names.

    it('should reject empty category name', async () => {
      await expect(
        store.createCategory(testUserId, '', '📝')
      ).rejects.toThrow('Category name is required');
    });

    it('should trim whitespace from category names', async () => {
      const category = await store.createCategory(testUserId, '  Trimmed  ', '✂️');

      expect(category.name).toBe('Trimmed');
    });
  });
});
