/**
 * Module: date.js
 * Purpose: Provide resilient date formatting for UI display without throwing on invalid inputs.
 * Notes: Accepts Date, ISO string, timestamp; falls back to String(value) on parse errors for robustness.
 */
/**
 * Format a date-like value into a localized string.
 * @param {Date|string|number|null|undefined} value - Input value to format.
 * @param {Intl.DateTimeFormatOptions} [options] - Optional Intl formatting overrides.
 * @returns {string} Localized date/time or stringified fallback for invalid inputs.
 */
export function formatDate(value, options) {
  try {
    const d = value instanceof Date ? value : new Date(value);
    // Default: short date + time
    const fmt = new Intl.DateTimeFormat(undefined, options || {
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
    return fmt.format(d);
  } catch {
    return String(value);
  }
}

