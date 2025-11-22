import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

let client;
let db;

/**
 * Connect to MongoDB using MONGO_URI or assembled credentials.
 * @returns {Promise<import('mongodb').Db|null>} Database handle or null when unavailable.
 */
export async function connect() {
  // Prefer explicit MONGO_URI. If not provided, build one from components
  let uri = process.env.MONGO_URI;
  if (!uri) {
    const user = process.env.MONGO_USER;
    const pass = process.env.MONGO_PASSWORD;
    const host = process.env.MONGO_HOST; // e.g. walletallert-dev.skudajs.mongodb.net
    if (!user || !pass || !host) {
      console.warn('MONGO_URI not set and missing MONGO_USER/MONGO_PASSWORD/MONGO_HOST; skipping MongoDB connection');
      return null;
    }
    const encoded = encodeURIComponent(pass);
    uri = `mongodb+srv://${user}:${encoded}@${host}/?retryWrites=true&w=majority&appName=WalletAllert-dev`;
    console.log('Built Mongo URI from env components');
  }
  try {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(process.env.MONGO_DB_NAME || 'walletalert');
    console.log('MongoDB connected', db.databaseName);
    return db;
  } catch (err) {
    console.warn(`MongoDB connection skipped: ${err.message}`);
    client = undefined;
    db = undefined;
    return null;
  }
}

/**
 * Retrieve the cached database connection (if connected).
 * @returns {import('mongodb').Db|undefined}
 */
export function getDb() {
  return db;
}

/**
 * Close the MongoDB client if present.
 * @returns {Promise<void>}
 */
export async function close() {
  if (client) await client.close();
}

// Ensure common indexes used by the app. Safe to call multiple times.
/**
 * Create common indexes for the application collections; no-op when DB is absent.
 * @returns {Promise<void>}
 */
export async function ensureIndexes() {
  const database = getDb();
  if (!database) {
    console.warn('ensureIndexes: no DB connection, skipping index creation');
    return;
  }

  try {
    await database.collection('users').createIndex({ auth0_id: 1 }, { unique: true });
    await database.collection('budgets').createIndex({ auth0_id: 1 });
    await database.collection('categories').createIndex({ auth0_id: 1, name: 1 }, { unique: true });
    await database.collection('transactions').createIndex({ auth0_id: 1 });
    await database.collection('transactions').createIndex({ budgetId: 1 });
    await database.collection('transactions').createIndex({ createdAt: -1 });
    console.log('MongoDB: ensured indexes for users, budgets, categories, transactions');
  } catch (err) {
    console.error('MongoDB: error ensuring indexes', err);
  }
}
