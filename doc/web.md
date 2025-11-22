# WalletAlert Web Documentation

## Overview
- React single-page app with Auth0 authentication, Axios API client, and Vite tooling.
- Core features: user bootstrap, budgets, expenses, categories, charts, and quick-add forms.

## API Client
- `src/api/api.js`: Axios instance preconfigured with `VITE_API_BASE_URL` for all API calls.

## Utilities
- `utils/budget.js`:
  - `getCurrentPeriodStart(period)`: Start date for weekly (Monday) or monthly period.
  - `filterTransactionsByPeriod(transactions, period)`: Filters transactions to the active period.
  - `calculateCurrentPeriodSpending(transactions, budgets)`: Sum of spending in the current budget period (weekly prioritized).
  - `calculateSpendingByPeriod(transactions, budgets)`: Totals per budget period.
- `utils/categories.js`:
  - `hashStringToNumber(value)`, `getFallbackColor(name)`: Internal helpers to derive stable colors for unknown categories.
  - `CATEGORY_CONFIG_MAP`, `CATEGORY_KEYS`: Configured built-in categories and keys.
  - `getCategoryPresentation(name, options)`: Returns label/color/emoji/initials for a category.
  - `getCategoryColor(name, options)`: Convenience to fetch only the color.
- `utils/date.js`:
  - `formatDate(value, options)`: Localized date formatting with safe fallbacks.
- `utils/format.js`:
  - `formatCurrency(value, currency?, locale?)`: Currency formatter with graceful fallback.

## Components and Functions
- `main.jsx`: Reads Auth0 env vars, renders a helpful message if missing, otherwise wraps `<App />` in `Auth0Provider`.
- `App.jsx`: Boots the user by calling `POST /api/bootstrap` after login; renders top bar and either `LoginPanel` or `Dashboard`.
- `AuthButton.jsx`: Renders sign-in (loginWithRedirect) or log-out (logout with returnTo) buttons based on Auth0 state.
- `LoginPanel.jsx`: Welcome hero prompting Auth0 login.
- `Dashboard.jsx`:
  - Data loaders: `fetchCollections()` pulls budgets/transactions/categories; `refreshData()` refetches with loading state.
  - Filters/views: category filter state, list/table/pie toggle, derived totals and sorted transactions.
  - Budget handlers: `handleEditBudget()`, `handleDeleteBudget()` for inline edits/removal.
  - Transaction handlers: `handleEditTransaction()`, `handleDeleteTransaction()` for expense edits/removal.
  - Category handlers: `handleAddCategory()`, `handleUpdateCategoryEmoji()`, `handleDeleteCategory()`.
  - Renders stats, charts, transaction views, budget list, quick expense form, budget form, and category manager.
- `QuickExpenseForm.jsx`: `handleSubmit()` posts a new expense with validation and emits `onAdded`; syncs selected category to available options.
- `BudgetForm.jsx`: `handleSubmit()` posts a new budget after validating amount/period and resets form, calling `onCreated` when done.
- `CategoriesManager.jsx`:
  - Helpers: `normalizeEmoji()` for safe emoji length.
  - Actions: `handleSubmit()` creates category, `handleDelete()` removes, `handleEmojiUpdate()` prompts and updates emoji; memoizes sorted categories and override maps.
- `StatsCards.jsx`: Uses `calculateCurrentPeriodSpending()` to derive total budget, spent, remaining, and utilization percentages for display cards.
- `WeeklySummaryChart.jsx`:
  - Helpers: `startOfWeek()`, `startOfMonth()`, `buildWeeklySeries()`, `buildMonthlySeries()`, `sumBudget()`, etc., to shape chart data.
  - Renders a selectable weekly/monthly bar chart comparing spending vs. budget totals.
- `TransactionsPie.jsx`: Aggregates spending by category into pie-chart data, coloring slices via `getCategoryColor`; shows currency tooltips.
- UI primitives:
  - `ui/Button.jsx`: Styled button with `variant` prop (`primary`, `secondary`, `ghost`, `destructive`).
  - `ui/Input.jsx`: Text/number input with shared form styling.
  - `ui/Select.jsx`: Styled select element wrapper.
