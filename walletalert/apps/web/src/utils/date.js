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

