import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Select from "./ui/Select";

const PAD = (value) => String(value).padStart(2, "0");

const formatRangeLabel = (start, end) => {
  const formatter = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  });
  return `${formatter.format(start)} – ${formatter.format(end)}`;
};

const formatMonthLabel = (date) => {
  const formatter = new Intl.DateTimeFormat(undefined, {
    month: "short",
    year: "numeric",
  });
  return formatter.format(date);
};

const toSafeDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const roundCurrency = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const startOfWeek = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  return d;
};

const startOfMonth = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(1);
  return d;
};

const weekKey = (date) =>
  `${date.getFullYear()}-${PAD(date.getMonth() + 1)}-${PAD(date.getDate())}`;
const monthKey = (date) =>
  `${date.getFullYear()}-${PAD(date.getMonth() + 1)}`;

const sumBudget = (budgets = [], period) =>
  budgets.reduce((total, budget) => {
    if (budget.period !== period) return total;
    const amount = Number(budget.amount);
    return Number.isFinite(amount) ? total + Math.max(0, amount) : total;
  }, 0);

const WEEK_BARS = 6;
const MONTH_BARS = 6;

const buildWeeklySeries = (transactions = [], budgetTotal) => {
  const totals = new Map();

  transactions.forEach((tx) => {
    const parsedAmount = Number(tx.amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return;
    const parsedDate = toSafeDate(tx.date || tx.createdAt);
    if (!parsedDate) return;
    const weekStart = startOfWeek(parsedDate);
    const key = weekKey(weekStart);
    const entry = totals.get(key) || { date: weekStart, spent: 0 };
    entry.spent += parsedAmount;
    totals.set(key, entry);
  });

  const list = [];
  const currentWeekStart = startOfWeek(new Date());
  for (let i = WEEK_BARS - 1; i >= 0; i -= 1) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(weekStart.getDate() - i * 7);
    const key = weekKey(weekStart);
    const entry = totals.get(key);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    list.push({
      name: formatRangeLabel(weekStart, weekEnd),
      spent: roundCurrency(entry ? entry.spent : 0),
      budget: roundCurrency(budgetTotal),
      key,
      isCurrent: i === 0,
    });
  }

  return list;
};

const buildMonthlySeries = (transactions = [], budgetTotal) => {
  const totals = new Map();

  transactions.forEach((tx) => {
    const parsedAmount = Number(tx.amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return;
    const parsedDate = toSafeDate(tx.date || tx.createdAt);
    if (!parsedDate) return;
    const monthStart = startOfMonth(parsedDate);
    const key = monthKey(monthStart);
    const entry = totals.get(key) || { date: monthStart, spent: 0 };
    entry.spent += parsedAmount;
    totals.set(key, entry);
  });

  const list = [];
  const currentMonthStart = startOfMonth(new Date());
  for (let i = MONTH_BARS - 1; i >= 0; i -= 1) {
    const monthStart = new Date(currentMonthStart);
    monthStart.setMonth(monthStart.getMonth() - i);
    const key = monthKey(monthStart);
    const entry = totals.get(key);
    list.push({
      name: formatMonthLabel(monthStart),
      spent: roundCurrency(entry ? entry.spent : 0),
      budget: roundCurrency(budgetTotal),
      key,
      isCurrent: i === 0,
    });
  }

  return list;
};

const PERIODS = [
  { value: "weekly", label: "Weekly", builder: buildWeeklySeries },
  { value: "monthly", label: "Monthly", builder: buildMonthlySeries },
];

/**
 * Bar chart that compares spending against budgets over recent weekly/monthly periods.
 *
 * @param {{ budgets?: Array, transactions?: Array }} props
 */
const WeeklySummaryChart = ({ budgets = [], transactions = [] }) => {
  const defaultPeriod = useMemo(() => {
    if (budgets.some((b) => b.period === "weekly")) return "weekly";
    if (budgets.some((b) => b.period === "monthly")) return "monthly";
    return "weekly";
  }, [budgets]);

  const [period, setPeriod] = useState(defaultPeriod);

  useEffect(() => {
    setPeriod(defaultPeriod);
  }, [defaultPeriod]);

  const activePeriod = useMemo(
    () => PERIODS.find((item) => item.value === period) || PERIODS[0],
    [period]
  );

  const budgetTotal = useMemo(
    () => sumBudget(budgets, activePeriod.value),
    [budgets, activePeriod.value]
  );

  const data = useMemo(
    () => activePeriod.builder(transactions, budgetTotal),
    [activePeriod, transactions, budgetTotal]
  );

  const hasData = data.some((item) => item.spent > 0 || item.budget > 0);

  return (
    <>
      <div className="chart-toolbar" role="group" aria-label="Spending period controls">
        <label htmlFor="summary-period">Period</label>
        <Select
          id="summary-period"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          style={{ maxWidth: 200 }}
        >
          {PERIODS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      {hasData ? (
        <div className="chart-wrapper" role="img" aria-label="Spending chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                cursor={{ fill: "rgba(14, 165, 233, 0.08)" }}
                formatter={(value) =>
                  typeof value === "number"
                    ? new Intl.NumberFormat(undefined, {
                        style: "currency",
                        currency: "USD",
                      }).format(value)
                    : value
                }
                contentStyle={{
                  backgroundColor: "var(--color-surface)",
                  borderColor: "var(--color-border)",
                  borderRadius: 12,
                  boxShadow: "var(--shadow-card)",
                }}
              />
              <Bar dataKey="budget" fill="#cbd5f5" radius={[8, 8, 0, 0]} />
              <Bar dataKey="spent" radius={[8, 8, 0, 0]}>
                {data.map((entry) => (
                  <Cell
                    key={entry.key}
                    fill="#0ea5e9"
                    fillOpacity={entry.isCurrent ? 1 : 0.5}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="empty-state">
          Add budgets or expenses to activate this insight.
        </div>
      )}
      {budgetTotal === 0 && (
        <p className="form-helper">
          Add a {activePeriod.label.toLowerCase()} budget to compare against
          spending.
        </p>
      )}
    </>
  );
};

export default WeeklySummaryChart;
