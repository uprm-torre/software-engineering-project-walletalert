# WalletAlert API Documentation

## Overview
- Node/Express API that secures requests with Auth0 JWTs (production) while supporting a permissive dev mode with in-memory data stores.
- MongoDB is used when configured; an in-memory fallback keeps local development and tests working without external services.

## Module Index

### src/index.js
- Wires global middleware (CORS, JSON parser), health check (`GET /api/health`), friendly root message, Auth0-protected routes, and starts the server on `PORT` (default 3000).
- `start()`: connects to MongoDB via `connectDb()`, ensures indexes, and begins listening.

### src/auth.js
- `checkJwt(req,res,next)`: Production middleware that validates Auth0 JWTs. In dev it allows requests without Authorization by injecting a default identity, and attempts real validation when a token is present.

### src/db.js
- `connect()`: Builds or consumes `MONGO_URI`, connects to MongoDB, and caches the database handle (warns and returns null if connection fails or env vars are missing).
- `getDb()`: Returns the cached database handle (or undefined when not connected).
- `close()`: Closes the MongoDB client if one is open.
- `ensureIndexes()`: Creates common indexes for users, budgets, categories, and transactions; safe to call repeatedly.

### src/store.js (data access with in-memory fallback)
- Internal helpers:
  - `getCollections()`: Returns Mongo collection handles or null when DB is unavailable.
  - `mapBudget()/mapTransaction()/mapCategory()`: Normalize Mongo `_id` to `id`.
  - `normalizeCategoryName()/normalizeEmojiValue()`: Trim inputs and coerce emoji strings to a safe length or null.
  - `ensureMemCategories()/ensureDbCategories()`: Seed default categories for a user in memory or Mongo.
- User operations:
  - `upsertUser(auth0_id, email)`: Create or update user by Auth0 id; returns `{user, created}`.
  - `getUser(auth0_id)`: Fetch user document.
- Budget operations:
  - `listBudgets(auth0_id)`: List all budgets for a user.
  - `createBudget(auth0_id, budget)`: Insert budget (period/amount/categories); returns created document.
  - `updateBudget(auth0_id, id, changes)`: Patch budget fields; throws if missing.
  - `deleteBudget(auth0_id, id)`: Remove budget; throws if not found.
- Transaction operations:
  - `listTransactions(auth0_id)`: List all transactions for a user.
  - `createTransaction(auth0_id, tx)`: Insert transaction (amount/category/date/description).
  - `updateTransaction(auth0_id, id, changes)`: Patch transaction; validates existence.
  - `deleteTransaction(auth0_id, id)`: Remove transaction; throws if not found.
- Category operations:
  - `listCategories(auth0_id)`: Return categories, seeding defaults if none exist.
  - `createCategory(auth0_id, name, emoji)`: Create category with duplicate/name validation.
  - `updateCategory(auth0_id, id, updates)`: Update emoji for a category; validates inputs.
  - `deleteCategory(auth0_id, id)`: Remove category; throws if not found.
  - `categoryExists(auth0_id, name)`: Case-insensitive existence check.

### Routes
- `routes/bootstrap.js`:
  - `GET /api/bootstrap`: Returns 405 with guidance (route is POST-only).
  - `POST /api/bootstrap`: Auth0-protected; upserts the user from token claims and returns `{user, created}`.
- `routes/budgets.js`:
  - `POST /api/budgets`: Create budget with validation for amount/period.
  - `GET /api/budgets`: List budgets for authenticated user.
  - `PUT /api/budgets/:id`: Update budget amount/period with validation.
  - `DELETE /api/budgets/:id`: Delete a budget.
- `routes/transactions.js`:
  - `POST /api/transactions`: Create expense; validates amount and ensures category exists.
  - `GET /api/transactions`: List transactions for authenticated user.
  - `PUT /api/transactions/:id`: Update amount/category (validates both).
  - `DELETE /api/transactions/:id`: Delete transaction.
- `routes/categories.js`:
  - `GET /api/categories`: List categories (defaults seeded when empty).
  - `POST /api/categories`: Create category with duplicate/name validation.
  - `PUT /api/categories/:id`: Update category emoji.
  - `DELETE /api/categories/:id`: Delete category.
