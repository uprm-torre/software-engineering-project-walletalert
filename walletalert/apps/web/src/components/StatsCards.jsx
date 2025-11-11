import React, { useMemo } from "react";
import { formatCurrency as fmtCur } from "../utils/format";

const formatPercent = (value) =>
  Number.isFinite(value) ? `${Math.round(value)}%` : "—";

const StatsCards = ({ budgets = [], transactions = [] }) => {
  const totals = useMemo(() => {
    const totalBudget = budgets.reduce((sum, budget) => {
      const amt = Number(budget.amount);
      return Number.isFinite(amt) ? sum + Math.max(0, amt) : sum;
    }, 0);

    const totalSpent = transactions.reduce((sum, tx) => {
      const amt = Number(tx.amount);
      return Number.isFinite(amt) && amt > 0 ? sum + amt : sum;
    }, 0);

    const remaining = totalBudget - totalSpent;
    const utilization =
      totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 999) : 0;

    return {
      totalBudget,
      totalSpent,
      remaining,
      utilization,
    };
  }, [budgets, transactions]);

  const { totalBudget, totalSpent, remaining, utilization } = totals;

  const fmtCurrency = (value) => fmtCur(value);

  const statusLabel = remaining >= 0 ? "On Track" : "Over Budget";
  const statusClass =
    remaining >= 0 ? "stat-card__delta--positive" : "stat-card__delta--negative";

  return (
    <div className="stat-grid" role="list">
      <article className="stat-card" data-accent="secondary" role="listitem">
        <h3 className="stat-card__label">Total Budget</h3>
        <div className="stat-card__value" aria-live="polite">
          {fmtCurrency(totalBudget)}
        </div>
        <p className="form-helper">Allocated across all active plans.</p>
      </article>

      <article className="stat-card" data-accent="accent" role="listitem">
        <h3 className="stat-card__label">Total Spent</h3>
        <div className="stat-card__value">{fmtCurrency(totalSpent)}</div>
        <p className="stat-card__delta stat-card__delta--negative">
          {formatPercent(utilization)} of budget used
        </p>
      </article>

      <article className="stat-card" data-accent={remaining >= 0 ? "success" : "error"} role="listitem">
        <h3 className="stat-card__label">Remaining</h3>
        <div className="stat-card__value">{fmtCurrency(remaining)}</div>
        <p className={`stat-card__delta ${statusClass}`}>
          {statusLabel}
        </p>
      </article>
    </div>
  );
};

export default StatsCards;
