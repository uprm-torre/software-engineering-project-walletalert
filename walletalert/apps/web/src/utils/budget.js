
/**
 * Get the start date for the current budget period
 * @param {string} period - "weekly" or "monthly"
 * @returns {Date} The start date of the current period
 */
export function getCurrentPeriodStart(period) {
  const now = new Date();
  
  if (period === "weekly") {
    // Start of the current week (Monday)
    const day = now.getDay();
    const diff = (day + 6) % 7; // Days since Monday
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - diff);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  }
  
  if (period === "monthly") {
    // Start of the current month (1st day)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);
    return monthStart;
  }
  
  // Default: start of current month
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  monthStart.setHours(0, 0, 0, 0);
  return monthStart;
}

/**
 * Filter transactions to only include those in the current period
 * @param {Array} transactions - All transactions
 * @param {string} period - "weekly" or "monthly"
 * @returns {Array} Filtered transactions
 */
export function filterTransactionsByPeriod(transactions, period) {
  const periodStart = getCurrentPeriodStart(period);
  
  return transactions.filter(tx => {
    const txDate = new Date(tx.date || tx.createdAt);
    return txDate >= periodStart;
  });
}

/**
 * Calculate total spent for transactions in the current budget periods
 * @param {Array} transactions - All transactions
 * @param {Array} budgets - All budgets with their periods
 * @returns {number} Total spent in current periods
 */
export function calculateCurrentPeriodSpending(transactions, budgets) {
  // Get all unique periods from budgets
  const periods = [...new Set(budgets.map(b => b.period))];
  
  // If no budgets, use monthly as default
  if (periods.length === 0) {
    periods.push("monthly");
  }
  
  // Use the most restrictive period (weekly is more restrictive than monthly)
  const activePeriod = periods.includes("weekly") ? "weekly" : "monthly";
  
  const filteredTransactions = filterTransactionsByPeriod(transactions, activePeriod);
  
  return filteredTransactions.reduce((sum, tx) => {
    const amt = Number(tx.amount);
    return Number.isFinite(amt) && amt > 0 ? sum + amt : sum;
  }, 0);
}

/**
 * Calculate spending for each budget period separately
 * @param {Array} transactions - All transactions
 * @param {Array} budgets - All budgets with their periods
 * @returns {Object} Spending totals by period { weekly: number, monthly: number }
 */
export function calculateSpendingByPeriod(transactions, budgets) {
  const periods = {
    weekly: 0,
    monthly: 0
  };
  
  budgets.forEach(budget => {
    const period = budget.period || "monthly";
    const filteredTxs = filterTransactionsByPeriod(transactions, period);
    
    const spent = filteredTxs.reduce((sum, tx) => {
      const amt = Number(tx.amount);
      return Number.isFinite(amt) && amt > 0 ? sum + amt : sum;
    }, 0);
    
    periods[period] += spent;
  });
  
  return periods;
}
