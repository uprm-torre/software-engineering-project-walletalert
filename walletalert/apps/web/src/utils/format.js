export function formatCurrency(value, currency = 'USD', locale) {
  const n = Number(value || 0);
  try {
    return n.toLocaleString(locale || undefined, { style: 'currency', currency });
  } catch {
    return `$${n.toFixed(2)}`;
  }
}

