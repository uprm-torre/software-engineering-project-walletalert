import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * File: routes-budgets.test.js
 * Purpose: Validate budget REST routes (CRUD + validation) independent of real Express & datastore.
 * Scope: POST/GET/PUT/DELETE behaviors, input validation, defaulting, error handling with mocked store.
 * Exclusions: Middleware stacking beyond auth stub, real Express internals, authentication token validation.
 * Key Edge Cases: Negative/zero amounts, invalid period values, default weekly period, not-found deletion error path.
 */

// Mock a minimal Express implementation so tests run without installing express
vi.mock('express', () => {
  // Simple router implementation with param support
  const Router = () => {
    const routes = [];
    const router = (req, res, next) => {
      const method = req.method.toLowerCase();
      // Normalize URL (strip query)
      const urlPath = (req.url || '/').split('?')[0];
      for (const r of routes) {
        if (r.method !== method) continue;
        // Build regex from path (support :param)
        const keys = [];
        const pattern = r.path
          .replace(/\//g, '\\/')
          .replace(/:([^/]+)/g, (_, key) => {
            keys.push(key);
            return '([^\\/]+)';
          });
        const regex = new RegExp('^' + pattern + '$');
        const m = regex.exec(urlPath);
        if (m) {
          req.params = {};
          keys.forEach((k, i) => (req.params[k] = m[i + 1]));
          return r.handler(req, res, next);
        }
      }
      return next();
    };
    ['get', 'post', 'put', 'delete'].forEach((method) => {
      router[method] = (path, handler) => routes.push({ method, path, handler });
    });
    return router;
  };

  // express() app factory
  const expressFactory = () => {
    const middlewares = [];
    // ensure res has helper methods
    const enhanceRes = (req, res, next) => {
      res.json = (obj) => {
        if (!res.headersSent) res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(obj));
      };
      res.status = (code) => {
        res.statusCode = code;
        return res;
      };
      next();
    };
    middlewares.push(enhanceRes);

    const app = (req, res) => {
      let idx = 0;
      const next = (err) => {
        const mw = middlewares[idx++];
        if (!mw) {
          if (!res.writableEnded) res.end();
          return;
        }
        try {
          mw(req, res, next);
        } catch (e) {
          res.statusCode = 500;
          res.end();
        }
      };
      next();
    };

    app.use = (pathOrMw, maybeMw) => {
      if (typeof pathOrMw === 'string') {
        const path = pathOrMw;
        const router = maybeMw;
        middlewares.push((req, res, next) => {
          if (req.url && (req.url === path || req.url.startsWith(path + '/') || req.url.startsWith(path + '?'))) {
            // strip mount path
            const originalUrl = req.url;
            req.url = req.url.slice(path.length) || '/';
            router(req, res, (err) => {
              req.url = originalUrl;
              next(err);
            });
          } else {
            next();
          }
        });
      } else {
        middlewares.push(pathOrMw);
      }
    };

    app.json = () => (req, res, next) => {
      let body = '';
      req.on && req.on('data', (chunk) => (body += chunk));
      req.on && req.on('end', () => {
        try {
          req.body = body ? JSON.parse(body) : {};
        } catch (e) {
          req.body = {};
        }
        next();
      });
    };

    return app;
  };

  // json parser export: returns middleware that parses JSON bodies
  const json = () => (req, res, next) => {
    let body = '';
    req.on && req.on('data', (chunk) => (body += chunk));
    req.on && req.on('end', () => {
      try {
        req.body = body ? JSON.parse(body) : {};
      } catch (e) {
        req.body = {};
      }
      next();
    });
  };

  return { default: expressFactory, __esModule: true, Router, json };
});
import request from 'supertest';

// Mock the store module
vi.mock('../../walletalert/apps/api/src/store.js', () => ({
  listBudgets: vi.fn(),
  createBudget: vi.fn(),
  updateBudget: vi.fn(),
  deleteBudget: vi.fn()
}));

describe('Budget Routes', () => {
  let app;
  let store;

  beforeEach(async () => {
    vi.resetModules();

    // Import mocked store
    store = await import('../../walletalert/apps/api/src/store.js');

    // Create Express app (use mocked express)
    const { default: express } = await import('express');
    app = express();
    // mount json parser if available
    if (typeof (await import('express')).json === 'function') {
      app.use((await import('express')).json());
    }

    // Mock auth middleware
    app.use((req, res, next) => {
      req.auth = {
        payload: {
          sub: 'auth0|testuser'
        }
      };
      next();
    });

    // Import and use budget routes
    const budgetRoutes = await import('../../walletalert/apps/api/src/routes/budgets.js');
    app.use('/api/budgets', budgetRoutes.default);
  });

  describe('POST /api/budgets', () => {
    // Create budget endpoint: validates body, defaults, and calls store.createBudget
    it('should create a new budget', async () => {
      const mockBudget = {
        id: '123',
        period: 'monthly',
        amount: 500,
        auth0_id: 'auth0|testuser'
      };

      store.createBudget.mockResolvedValue(mockBudget);

      const response = await request(app)
        .post('/api/budgets')
        .send({
          period: 'monthly',
          amount: 500
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockBudget);
      expect(store.createBudget).toHaveBeenCalledWith(
        'auth0|testuser',
        expect.objectContaining({
          period: 'monthly',
          amount: 500
        })
      );
    });

    it('should reject invalid amount', async () => {
      // negative amounts are invalid input and should be rejected with 400
      const response = await request(app)
        .post('/api/budgets')
        .send({
          period: 'monthly',
          amount: -100
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('greater than zero');
    });

    it('should reject invalid period', async () => {
      // invalid period values should be rejected (only weekly/monthly allowed)
      const response = await request(app)
        .post('/api/budgets')
        .send({
          period: 'yearly',
          amount: 500
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('weekly or monthly');
    });

    it('should default to weekly period', async () => {
      // When `period` is omitted, route should default to 'weekly'
      const mockBudget = {
        id: '123',
        period: 'weekly',
        amount: 100,
        auth0_id: 'auth0|testuser'
      };

      store.createBudget.mockResolvedValue(mockBudget);

      const response = await request(app)
        .post('/api/budgets')
        .send({
          amount: 100
        });

      expect(response.status).toBe(201);
      expect(store.createBudget).toHaveBeenCalledWith(
        'auth0|testuser',
        expect.objectContaining({
          period: 'weekly'
        })
      );
    });
  });

  describe('GET /api/budgets', () => {
    // List budgets: ensures the authenticated user's budgets are returned
    it('should return list of budgets', async () => {
      const mockBudgets = [
        { id: '1', period: 'weekly', amount: 100 },
        { id: '2', period: 'monthly', amount: 500 }
      ];

      store.listBudgets.mockResolvedValue(mockBudgets);

      const response = await request(app)
        .get('/api/budgets');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockBudgets);
      expect(store.listBudgets).toHaveBeenCalledWith('auth0|testuser');
    });

    it('should handle empty budget list', async () => {
      store.listBudgets.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/budgets');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('PUT /api/budgets/:id', () => {
    // Update endpoint: validates inputs and calls store.updateBudget
    it('should update a budget', async () => {
      const mockUpdated = {
        id: '123',
        period: 'monthly',
        amount: 600,
        auth0_id: 'auth0|testuser'
      };

      store.updateBudget.mockResolvedValue(mockUpdated);

      const response = await request(app)
        .put('/api/budgets/123')
        .send({
          amount: 600
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockUpdated);
      expect(store.updateBudget).toHaveBeenCalledWith(
        'auth0|testuser',
        '123',
        expect.objectContaining({ amount: 600 })
      );
    });

    it('should reject invalid amount on update', async () => {
      // amount must be > 0 when updating
      const response = await request(app)
        .put('/api/budgets/123')
        .send({
          amount: 0
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('greater than zero');
    });
  });

  describe('DELETE /api/budgets/:id', () => {
    // Delete endpoint: returns removed object or error if not found
    it('should delete a budget', async () => {
      const mockDeleted = {
        id: '123',
        period: 'monthly',
        amount: 500
      };

      store.deleteBudget.mockResolvedValue(mockDeleted);

      const response = await request(app)
        .delete('/api/budgets/123');

      expect(response.status).toBe(200);
      expect(response.body.removed).toEqual(mockDeleted);
      expect(store.deleteBudget).toHaveBeenCalledWith('auth0|testuser', '123');
    });

    it('should handle budget not found', async () => {
      // store.deleteBudget may reject — route should catch and return 400
      store.deleteBudget.mockRejectedValue(new Error('Budget not found'));

      const response = await request(app)
        .delete('/api/budgets/999');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Budget not found');
    });
  });
});
