/**
 * Module: format.js
 * Purpose: Currency formatting utility with graceful fallback for invalid locale/currency codes.
 * Notes: Returns '$<amount>' fallback if Intl formatting fails; null/undefined treated as 0.
 */
/**
 * Format a numeric value as currency.
 * @param {number|string|null|undefined} value - Value to format (coerced to number; falsy -> 0).
 * @param {string} [currency='USD'] - ISO 4217 currency code.
 * @param {string} [locale] - Optional BCP 47 locale; defaults to environment locale.
 * @returns {string} Formatted currency string.
 */
export function formatCurrency(value, currency = 'USD', locale) {
  const n = Number(value || 0);
  try {
    return n.toLocaleString(locale || undefined, { style: 'currency', currency });
  } catch {
    return `$${n.toFixed(2)}`;
  }
}

