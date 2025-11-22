# WalletAlert Unit Tests

This folder contains unit tests for core WalletAlert modules across the API and web layers. Tests emphasize validation paths, boundary cases, and in-memory execution (no external services).

## Structure
```
unit-test/
├─ api/                       # API layer tests
│  ├─ auth.test.js            # Auth middleware (dev vs prod)
│  ├─ store.test.js           # In-memory store CRUD & validation
│  └─ routes-budgets.test.js  # Budget route handlers (mocked express)
├─ web/                       # Web utility tests
│  ├─ budget.test.js          # Budget period/start + filtering
│  ├─ categories.test.js      # Category presentation/color helpers
│  ├─ date.test.js            # Date formatting helper
│  └─ format.test.js          # Currency formatting helper
├─ package.json               # Test dependencies/scripts
└─ vitest.config.js           # Vitest configuration
```

## Setup
```bash
cd unit-test
npm install
```

## Running Tests
- All tests: `npm test`
- Watch mode: `npm test -- --watch`
- API only: `npm run test:api`
- Web only: `npm run test:web`
- Vitest UI: `npm run test:ui`
- Coverage: `npm run test:coverage` (install a provider such as `@vitest/coverage-v8` and configure `vitest.config.js` if you need reports)

## Coverage Highlights
- **API:** auth middleware branches; store CRUD/validation for users, budgets, transactions, categories; budget route handlers (GET/POST/PUT/DELETE) with validation via a lightweight express mock.
- **Web:** budget period start/filtering and current-period spending; category presentation/color hashing and overrides; date formatting fallbacks; currency formatting (numbers/strings/null, alternate currencies, fallback behavior).
- Requirement trace: 5+ core modules with 4+ tests each, targeting validation and edge cases as required.

## Notes
- Tests run fully in-memory—no MongoDB, Auth0, or HTTP server needed.
- Route tests stub express behavior; auth tests mock JWT validation.
- Add new suites by creating `.test.js` files under `api/` or `web/` and using standard Vitest `describe/it/expect`.
