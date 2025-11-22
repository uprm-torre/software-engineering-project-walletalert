/**
 * Module: store.js
 * Purpose: Provide data access operations with an in-memory fallback when MongoDB is unavailable.
 * Notes: Each exported async function first attempts to use a live database connection; if absent, it uses Maps.
 * Design: Fallback enables fast local/unit testing without external services. Mongo path maps _id to id for uniformity.
 */
import { ObjectId } from 'mongodb';
import { getDb } from './db.js';

// In-memory fallback storage for development/demo when Mongo is not configured.
const memUsers = new Map(); // auth0_id -> { auth0_id, email, createdAt }
const memBudgets = new Map(); // auth0_id -> [ { id, auth0_id, name, amount, createdAt } ]
const memTx = new Map(); // auth0_id -> [ { id, auth0_id, amount, description, createdAt } ]
const memCategories = new Map(); // auth0_id -> [ { id, auth0_id, name, emoji, createdAt } ]

const DEFAULT_CATEGORIES = ['Groceries', 'Takeout', 'Utilities', 'Electronics', 'Other'];

function getCollections() {
    const db = getDb();
    if (!db) return null;
    return {
        usersCol: db.collection('users'),
        budgetsCol: db.collection('budgets'),
        txCol: db.collection('transactions'),
        categoriesCol: db.collection('categories'),
    };
}

function mapBudget(doc) {
    if (!doc) return null;
    const { _id, ...rest } = doc;
    return { id: String(_id), ...rest };
}

function mapTransaction(doc) {
    if (!doc) return null;
    const copy = { ...doc };
    if (copy._id) {
        copy.id = String(copy._id);
        delete copy._id;
    }
    return copy;
}

function mapCategory(doc) {
    if (!doc) return null;
    const copy = { ...doc };
    if (copy._id) {
        copy.id = String(copy._id);
        delete copy._id;
    }
    return copy;
}

function normalizeCategoryName(name) {
    return String(name || '').trim();
}

function normalizeEmojiValue(value) {
    if (value === null || value === undefined) return null;
    const trimmed = String(value).trim();
    if (!trimmed) return null;
    const glyphs = Array.from(trimmed);
    return glyphs.slice(0, 3).join('') || null;
}

function ensureMemCategories(auth0_id) {
    const list = memCategories.get(auth0_id);
    if (list && list.length) return list;
    const seeded = DEFAULT_CATEGORIES.map(name => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        auth0_id,
        name,
        emoji: null,
        createdAt: new Date(),
    }));
    memCategories.set(auth0_id, seeded);
    return seeded;
}

async function ensureDbCategories(categoriesCol, auth0_id) {
    const existing = await categoriesCol.find({ auth0_id }).toArray();
    if (existing.length) return existing;
    const docs = DEFAULT_CATEGORIES.map(name => ({
        auth0_id,
        name,
        emoji: null,
        createdAt: new Date(),
    }));
    if (docs.length) {
        try {
            await categoriesCol.insertMany(docs, { ordered: false });
        } catch (err) {
            // Ignore duplicate key errors caused by concurrent seeding
            if (!(err?.code === 11000)) {
                throw err;
            }
        }
    }
    return await categoriesCol.find({ auth0_id }).toArray();
}

/**
 * Upsert (create or update) a user by Auth0 id.
 * @param {string} auth0_id
 * @param {string} email
 * @returns {Promise<{user:Object,created:boolean}>}
 */
export async function upsertUser(auth0_id, email) {
    if (!auth0_id) return { user: null, created: false };
    const cols = getCollections();
    if (!cols) {
        const existed = memUsers.has(auth0_id);
        const existing = memUsers.get(auth0_id) || { auth0_id, email, createdAt: new Date() };
        if (email) existing.email = email;
        memUsers.set(auth0_id, existing);
        return { user: existing, created: !existed };
    }

    const { usersCol } = cols;
    const now = new Date();
    const res = await usersCol.findOneAndUpdate(
        { auth0_id },
        { $set: { email, updatedAt: now, auth0_id }, $setOnInsert: { createdAt: now } },
        { upsert: true, returnDocument: 'after' }
    );
    const created = !!(res.lastErrorObject && res.lastErrorObject.upserted);
    return { user: res.value, created };
}

/**
 * Retrieve a user by Auth0 id.
 * @param {string} auth0_id
 * @returns {Promise<Object|null>}
 */
export async function getUser(auth0_id) {
    if (!auth0_id) return null;
    const cols = getCollections();
    if (!cols) return memUsers.get(auth0_id) || null;
    const { usersCol } = cols;
    return await usersCol.findOne({ auth0_id });
}

/**
 * List budgets for a user.
 * @param {string} auth0_id
 * @returns {Promise<Array>}
 */
export async function listBudgets(auth0_id) {
    const cols = getCollections();
    if (!cols) return memBudgets.get(auth0_id) || [];
    const { budgetsCol } = cols;
    const docs = await budgetsCol.find({ auth0_id }).toArray();
    return docs.map(mapBudget);
}

/**
 * Create a budget for a user.
 * @param {string} auth0_id
 * @param {{period:string,amount:number}} budget
 * @returns {Promise<Object>}
 */
export async function createBudget(auth0_id, budget) {
    const cols = getCollections();
    if (!cols) {
        const list = memBudgets.get(auth0_id) || [];
        const id = String(Date.now());
        const doc = { id, auth0_id, ...budget, createdAt: new Date() };
        list.push(doc);
        memBudgets.set(auth0_id, list);
        return doc;
    }
    const { budgetsCol } = cols;
    const doc = { auth0_id, ...budget, createdAt: new Date() };
    const res = await budgetsCol.insertOne(doc);
    const created = await budgetsCol.findOne({ _id: res.insertedId });
    return mapBudget(created);
}

/**
 * Update a budget by id for a user.
 * @param {string} auth0_id
 * @param {string} id
 * @param {Object} changes
 * @returns {Promise<Object>}
 */
export async function updateBudget(auth0_id, id, changes) {
    const cols = getCollections();
    if (!cols) {
        const list = memBudgets.get(auth0_id) || [];
        const idx = list.findIndex(b => b.id === id);
        if (idx === -1) throw new Error('Budget not found');
        list[idx] = { ...list[idx], ...changes };
        memBudgets.set(auth0_id, list);
        return list[idx];
    }
    const { budgetsCol } = cols;
    const _id = new ObjectId(id);
    const res = await budgetsCol.findOneAndUpdate(
        { _id, auth0_id },
        { $set: changes },
        { returnDocument: 'after' }
    );
    if (!res.value) throw new Error('Budget not found');
    return mapBudget(res.value);
}

/**
 * Delete a user's budget by id.
 * @param {string} auth0_id
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function deleteBudget(auth0_id, id) {
    const cols = getCollections();
    if (!cols) {
        const list = memBudgets.get(auth0_id) || [];
        const idx = list.findIndex(b => b.id === id);
        if (idx === -1) throw new Error('Budget not found');
        const [removed] = list.splice(idx, 1);
        memBudgets.set(auth0_id, list);
        return removed;
    }
    const { budgetsCol } = cols;
    const _id = new ObjectId(id);
    const res = await budgetsCol.findOneAndDelete({ _id, auth0_id });
    if (!res.value) throw new Error('Budget not found');
    return mapBudget(res.value);
}

/**
 * List transactions for a user.
 * @param {string} auth0_id
 * @returns {Promise<Array>}
 */
export async function listTransactions(auth0_id) {
    const cols = getCollections();
    if (!cols) return memTx.get(auth0_id) || [];
    const { txCol } = cols;
    const docs = await txCol.find({ auth0_id }).toArray();
    return docs.map(mapTransaction);
}

/**
 * Create a transaction for a user.
 * @param {string} auth0_id
 * @param {{amount:number,date?:string,description?:string,category?:string}} tx
 * @returns {Promise<Object>}
 */
export async function createTransaction(auth0_id, tx) {
    const cols = getCollections();
    if (!cols) {
        const list = memTx.get(auth0_id) || [];
        const doc = { id: String(Date.now()), auth0_id, ...tx, createdAt: new Date() };
        list.push(doc);
        memTx.set(auth0_id, list);
        return doc;
    }
    const { txCol } = cols;
    const res = await txCol.insertOne({ auth0_id, ...tx, createdAt: new Date() });
    const created = await txCol.findOne({ _id: res.insertedId });
    return mapTransaction(created);
}

/**
 * Update a transaction by id.
 * @param {string} auth0_id
 * @param {string} id
 * @param {Object} changes
 * @returns {Promise<Object>}
 */
export async function updateTransaction(auth0_id, id, changes) {
    const cols = getCollections();
    if (!cols) {
        const list = memTx.get(auth0_id) || [];
        const idx = list.findIndex(t => t.id === id);
        if (idx === -1) throw new Error('Transaction not found');
        list[idx] = { ...list[idx], ...changes };
        memTx.set(auth0_id, list);
        return list[idx];
    }
    const { txCol } = cols;
    const _id = new ObjectId(id);
    const existing = await txCol.findOne({ _id, auth0_id });
    if (!existing) throw new Error('Transaction not found');
    const res = await txCol.findOneAndUpdate({ _id, auth0_id }, { $set: changes }, { returnDocument: 'after' });
    return mapTransaction(res.value);
}

/**
 * Delete a transaction by id.
 * @param {string} auth0_id
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function deleteTransaction(auth0_id, id) {
    const cols = getCollections();
    if (!cols) {
        const list = memTx.get(auth0_id) || [];
        const idx = list.findIndex(t => t.id === id);
        if (idx === -1) throw new Error('Transaction not found');
        const [removed] = list.splice(idx, 1);
        memTx.set(auth0_id, list);
        return removed;
    }
    const { txCol } = cols;
    const _id = new ObjectId(id);
    const res = await txCol.findOneAndDelete({ _id, auth0_id });
    if (!res.value) throw new Error('Transaction not found');
    return mapTransaction(res.value);
}

/**
 * List categories for a user (seeding defaults if absent).
 * @param {string} auth0_id
 * @returns {Promise<Array>}
 */
export async function listCategories(auth0_id) {
    const cols = getCollections();
    if (!cols) {
        const list = ensureMemCategories(auth0_id);
        return list;
    }
    const { categoriesCol } = cols;
    const docs = await ensureDbCategories(categoriesCol, auth0_id);
    return docs.map(mapCategory);
}

/**
 * Create a category (preventing duplicates, trimming name, normalizing emoji).
 * @param {string} auth0_id
 * @param {string} name
 * @param {string|null} emojiValue
 * @returns {Promise<Object>}
 */
export async function createCategory(auth0_id, name, emojiValue) {
    const trimmed = normalizeCategoryName(name);
    if (!trimmed) throw new Error('Category name is required.');
    const emoji = normalizeEmojiValue(emojiValue);

    const cols = getCollections();
    if (!cols) {
        const list = ensureMemCategories(auth0_id);
        if (list.some(c => c.name.toLowerCase() === trimmed.toLowerCase())) {
            throw new Error('Category already exists.');
        }
        const doc = {
            id: String(Date.now()),
            auth0_id,
            name: trimmed,
            emoji,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        list.push(doc);
        memCategories.set(auth0_id, list);
        return doc;
    }
    const { categoriesCol } = cols;
    const existing = await categoriesCol.findOne({ auth0_id, name: { $regex: `^${trimmed}$`, $options: 'i' } });
    if (existing) throw new Error('Category already exists.');
    const now = new Date();
    const doc = {
        auth0_id,
        name: trimmed,
        emoji,
        createdAt: now,
        updatedAt: now,
    };
    const res = await categoriesCol.insertOne(doc);
    const created = await categoriesCol.findOne({ _id: res.insertedId });
    return mapCategory(created);
}

/**
 * Update a category's emoji.
 * @param {string} auth0_id
 * @param {string} id
 * @param {{emoji:string}} updates
 * @returns {Promise<Object>}
 */
export async function updateCategory(auth0_id, id, updates = {}) {
    if (!id) throw new Error('Category id is required.');
    if (!Object.prototype.hasOwnProperty.call(updates, 'emoji')) {
        throw new Error('Emoji update is required.');
    }
    const emoji = normalizeEmojiValue(updates.emoji);

    const cols = getCollections();
    if (!cols) {
        const list = ensureMemCategories(auth0_id);
        const idx = list.findIndex(c => c.id === id);
        if (idx === -1) throw new Error('Category not found');
        const updated = {
            ...list[idx],
            emoji,
            updatedAt: new Date(),
        };
        list[idx] = updated;
        memCategories.set(auth0_id, list);
        return updated;
    }

    const { categoriesCol } = cols;
    const _id = new ObjectId(id);
    const now = new Date();
    const updateDoc = {
        $set: {
            emoji,
            updatedAt: now,
        },
    };
    const res = await categoriesCol.findOneAndUpdate(
        { _id, auth0_id },
        updateDoc,
        { returnDocument: 'after' }
    );
    if (!res.value) throw new Error('Category not found');
    return mapCategory(res.value);
}

/**
 * Delete a category by id.
 * @param {string} auth0_id
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function deleteCategory(auth0_id, id) {
    const cols = getCollections();
    if (!cols) {
        const list = ensureMemCategories(auth0_id);
        const idx = list.findIndex(c => c.id === id);
        if (idx === -1) throw new Error('Category not found');
        const [removed] = list.splice(idx, 1);
        memCategories.set(auth0_id, list);
        return removed;
    }
    const { categoriesCol } = cols;
    const _id = new ObjectId(id);
    const res = await categoriesCol.findOneAndDelete({ _id, auth0_id });
    if (!res.value) throw new Error('Category not found');
    return mapCategory(res.value);
}

/**
 * Check if a category exists (case-insensitive) for a user.
 * @param {string} auth0_id
 * @param {string} name
 * @returns {Promise<boolean>}
 */
export async function categoryExists(auth0_id, name) {
    const trimmed = normalizeCategoryName(name);
    if (!trimmed) return false;

    const cols = getCollections();
    if (!cols) {
        const list = ensureMemCategories(auth0_id);
        return list.some(c => c.name.toLowerCase() === trimmed.toLowerCase());
    }
    const { categoriesCol } = cols;
    const found = await categoriesCol.findOne({ auth0_id, name: { $regex: `^${trimmed}$`, $options: 'i' } });
    return !!found;
}

export default {
    upsertUser,
    getUser,
    listBudgets,
    createBudget,
    updateBudget,
    deleteBudget,
    listTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    listCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    categoryExists,
};
