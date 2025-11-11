import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Tooltip,
  Cell,
  Legend,
} from "recharts";
import { formatCurrency } from "../utils/format";
import { getCategoryColor, getCategoryPresentation } from "../utils/categories";

const TransactionsPie = ({
  transactions = [],
  categoryDisplayOptions = {},
}) => {
  const data = useMemo(() => {
    const byCategory = new Map();
    for (const t of transactions) {
      const category = t.category || "Uncategorized";
      const amount = Number(t.amount || 0);
      if (!Number.isFinite(amount) || amount <= 0) continue;
      byCategory.set(category, (byCategory.get(category) || 0) + amount);
    }
    return Array.from(byCategory.entries()).map(([name, value]) => {
      const presentation = getCategoryPresentation(name, categoryDisplayOptions);
      return {
        name: presentation.originalName,
        value,
        color: getCategoryColor(name, categoryDisplayOptions),
      };
    });
  }, [transactions, categoryDisplayOptions]);

  if (data.length === 0) {
    return <div className="empty-state">No expenses recorded for this view.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={120}
          innerRadius={56}
          paddingAngle={4}
          stroke="var(--color-background)"
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [
            formatCurrency(value),
            name,
          ]}
          contentStyle={{
            backgroundColor: "var(--color-surface)",
            borderColor: "var(--color-border)",
            borderRadius: 12,
            boxShadow: "var(--shadow-card)",
          }}
        />
        <Legend
          verticalAlign="bottom"
          align="center"
          wrapperStyle={{ fontSize: 12, color: "var(--color-text-muted)" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default TransactionsPie;
