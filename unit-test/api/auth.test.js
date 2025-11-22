import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * File: auth.test.js
 * Purpose: Validate dev vs production Auth0-auth middleware branches without external network calls.
 * Scope: Dynamic import of `checkJwt` under NODE_ENV variations, header override behavior, export shape.
 * Exclusions: Real JWT signature/claim verification (handled in future integration tests), token expiry logic.
 * Key Edge Cases: Missing Authorization header in dev mode, custom dev headers (x-dev-sub/email), production export presence.
 */

describe('Auth Module', () => {
  beforeEach(() => {
    // Reset module cache so each test imports a fresh copy
    // and environment variables take effect for the dynamic import.
    vi.resetModules();
  });

  describe('Development Mode', () => {
    // Development-mode middleware is permissive: when NODE_ENV=development
    // the middleware injects a fake user payload so local development is easier.
    it('should allow requests without Authorization header', async () => {
      process.env.NODE_ENV = 'development';

      const req = {
        headers: {},
        auth: null
      };
      const res = {};
      const next = vi.fn();

      // Import the module after setting NODE_ENV so the dev branch is used.
      // In dev-mode the middleware injects a fake `req.auth` if no Authorization
      // header is provided — call it synchronously to simulate middleware.
      const { checkJwt } = await import('../../walletalert/apps/api/src/auth.js');

      checkJwt(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.auth).toBeDefined();
      expect(req.auth.payload.sub).toBeDefined();
    });

    it('should use custom dev headers if provided', async () => {
      process.env.NODE_ENV = 'development';

      const req = {
        headers: {
          'x-dev-sub': 'test-user-123',
          'x-dev-email': 'test@example.com'
        },
        auth: null
      };
      const res = {};
      const next = vi.fn();

      // When `x-dev-sub` and `x-dev-email` headers are present, the dev middleware
      // should populate the `req.auth.payload` values with them.
      const { checkJwt } = await import('../../walletalert/apps/api/src/auth.js');

      checkJwt(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.auth.payload.sub).toBe('test-user-123');
      expect(req.auth.payload.email).toBe('test@example.com');
    });
  });

  describe('Production Mode', () => {
    // Production-mode uses the real Auth0 middleware. Here we only assert
    // the module exports the middleware function (token validation is
    // exercised in integration tests with real tokens).
    it('should require valid JWT in production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.AUTH0_AUDIENCE = 'test-audience';
      process.env.AUTH0_ISSUER_BASE_URL = 'https://test.auth0.com';

      // We don't verify an actual token here — just that the module exports
      // a function (the real middleware) when in production mode.
      const { checkJwt } = await import('../../walletalert/apps/api/src/auth.js');

      expect(checkJwt).toBeDefined();
      expect(typeof checkJwt).toBe('function');
    });
  });
});
