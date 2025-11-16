import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth0 } from "@auth0/auth0-react";
import api from "../api/api";
import WeeklySummaryChart from "./WeeklySummaryChart";
import TransactionsPie from "./TransactionsPie";
import QuickExpenseForm from "./QuickExpenseForm";
import BudgetForm from "./BudgetForm";
import StatsCards from "./StatsCards";
import CategoriesManager from "./CategoriesManager";
import { formatCurrency as fmtCur } from "../utils/format";
import { formatDate } from "../utils/date";
import { getCategoryPresentation } from "../utils/categories";
import Select from "./ui/Select";
import Button from "./ui/Button";

const VIEW_OPTIONS = [
  { value: "list", label: "List" },
  { value: "table", label: "Table" },
  { value: "pie", label: "Category Share" },
];

const Dashboard = () => {
  const { getAccessTokenSilently } = useAuth0();
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [transactionsView, setTransactionsView] = useState("list");

  const fetchCollections = useCallback(async () => {
    const token = await getAccessTokenSilently();
    const headers = { Authorization: `Bearer ${token}` };
    const [budgetsRes, transactionsRes, categoriesRes] = await Promise.all([
      api.get("/api/budgets", { headers }),
      api.get("/api/transactions", { headers }),
      api.get("/api/categories", { headers }),
    ]);

    setBudgets(budgetsRes.data || []);
    setTransactions(transactionsRes.data || []);
    setCategories(
      (categoriesRes.data || []).map((c) => ({
        ...c,
        name: (c.name || "").trim(),
        emoji: c.emoji ? c.emoji.trim() : "",
      }))
    );
  }, [getAccessTokenSilently]);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        await fetchCollections();
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [fetchCollections]);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      await fetchCollections();
    } catch (error) {
      console.error("Refresh error:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchCollections]);

  const fmt = (value) => fmtCur(value);

  const filterCategoryOptions = useMemo(() => {
    const set = new Set();
    categories.forEach((c) => {
      if (c.name) set.add(c.name);
    });
    transactions.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [categories, transactions]);

  useEffect(() => {
    if (
      categoryFilter !== "all" &&
      !filterCategoryOptions.includes(categoryFilter)
    ) {
      setCategoryFilter("all");
    }
  }, [categoryFilter, filterCategoryOptions]);

  const categoryPresentationOptions = useMemo(() => {
    const emojiOverrides = {};
    categories.forEach((c) => {
      if (c?.name && c?.emoji) {
        emojiOverrides[c.name.toLowerCase()] = { emoji: c.emoji };
      }
    });
    return { emojiOverrides };
  }, [categories]);

  const filteredTransactions = useMemo(() => {
    const filtered = categoryFilter === "all"
      ? transactions
      : transactions.filter((tx) => tx.category === categoryFilter);

    // Sort by date descending (newest first)
    return [...filtered].sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt || 0);
      const dateB = new Date(b.date || b.createdAt || 0);
      const timeA = dateA.getTime();
      const timeB = dateB.getTime();
      return timeB - timeA; // Descending order (newest first)
    });
  }, [categoryFilter, transactions]);

  const totalSpent = useMemo(
    () =>
      filteredTransactions.reduce((sum, tx) => {
        const amount = Number(tx.amount);
        return Number.isFinite(amount) && amount > 0 ? sum + amount : sum;
      }, 0),
    [filteredTransactions]
  );

  const handleDeleteBudget = async (id) => {
    if (!window.confirm("Delete this budget?")) return;
    try {
      const token = await getAccessTokenSilently();
      await api.delete(`/api/budgets/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      refreshData();
    } catch (err) {
      console.error("Delete budget error:", err);
      alert("Could not delete budget. See console.");
    }
  };

  const handleEditBudget = async (budget) => {
    const newAmount = window.prompt("New amount", String(budget.amount));
    if (newAmount === null) return;
    try {
      const token = await getAccessTokenSilently();
      const parsed = Number(newAmount);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        alert("Budget amount must be greater than zero.");
        return;
      }
      await api.put(
        `/api/budgets/${budget.id}`,
        { amount: parsed },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      refreshData();
    } catch (err) {
      console.error("Edit budget error:", err);
      alert("Could not update budget. See console.");
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    try {
      const token = await getAccessTokenSilently();
      await api.delete(`/api/transactions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      refreshData();
    } catch (err) {
      console.error("Delete transaction error:", err);
      alert("Could not delete expense. See console.");
    }
  };

  const handleEditTransaction = async (tx) => {
    const newAmount = window.prompt("New amount", String(tx.amount));
    if (newAmount === null) return;
    try {
      const token = await getAccessTokenSilently();
      const id = tx.id || tx._id;
      const parsed = Number(newAmount);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        alert("Expense amount must be greater than zero.");
        return;
      }
      await api.put(
        `/api/transactions/${id}`,
        { amount: parsed },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      refreshData();
    } catch (err) {
      console.error("Edit transaction error:", err);
      alert("Could not update expense. See console.");
    }
  };

  const handleAddCategory = async ({ name, emoji }) => {
    const trimmed = String(name || "").trim();
    if (!trimmed) throw new Error("Category name is required.");
    const token = await getAccessTokenSilently();
    await api.post(
      "/api/categories",
      { name: trimmed, emoji: emoji || undefined },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    await refreshData();
  };

  const handleUpdateCategoryEmoji = async (category, emoji) => {
    const token = await getAccessTokenSilently();
    await api.put(
      `/api/categories/${category.id}`,
      { emoji: emoji || null },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    await refreshData();
  };

  const handleDeleteCategory = async (category) => {
    const confirmed = window.confirm(
      `Delete category "${category.name}"? Existing expenses keep their current category.`
    );
    if (!confirmed) return;
    const token = await getAccessTokenSilently();
    await api.delete(`/api/categories/${category.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    await refreshData();
  };

  if (loading) {
    return (
      <div className="layout" role="presentation">
        <div className="layout__left">
          <section className="panel" aria-busy="true">
            <p>Loading your financial overview…</p>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="layout" role="presentation">
      <div className="layout__left">
        <section
          className="panel"
          aria-labelledby="wallet-dashboard-overview"
        >
          <header className="section-header">
            <div>
              <h2 className="section-title" id="wallet-dashboard-overview">
                Financial Snapshot
              </h2>
              <p className="form-helper">
                Monitor budgets, spending, and remaining balance at a glance.
              </p>
            </div>
          </header>
          <StatsCards budgets={budgets} transactions={transactions} />
        </section>

        <section className="panel chart-panel" aria-labelledby="spending-chart">
          <header className="section-header">
            <h2 className="section-title" id="spending-chart">
              Spending Summary
            </h2>
            <span className="section-meta">Last six periods</span>
          </header>
          <WeeklySummaryChart
            budgets={budgets}
            transactions={transactions}
          />
        </section>

        <section
          className="panel"
          aria-labelledby="recent-expenses-heading"
        >
          <header className="section-header">
            <div>
              <h2 className="section-title" id="recent-expenses-heading">
                Recent Expenses
              </h2>
              <p className="form-helper">
                Review transactions, adjust entries, or switch visualizations.
              </p>
            </div>
            <span className="chip" aria-label="Total spent">
              {fmt(totalSpent)} spent
            </span>
          </header>

          <div className="filters" role="group" aria-label="Expense filters">
            <label htmlFor="filter-category">Category</label>
            <Select
              id="filter-category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ maxWidth: 220 }}
            >
              <option value="all">All</option>
              {filterCategoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>

            <span className="filters__spacer" />

            <label htmlFor="filter-view">View</label>
            <Select
              id="filter-view"
              value={transactionsView}
              onChange={(e) => setTransactionsView(e.target.value)}
              style={{ maxWidth: 200 }}
            >
              {VIEW_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="empty-state">
              No expenses match the selected filters yet.
            </div>
          ) : transactionsView === "pie" ? (
            <TransactionsPie
              transactions={filteredTransactions}
              categoryDisplayOptions={categoryPresentationOptions}
            />
          ) : transactionsView === "table" ? (
            <div className="table-wrapper" role="region" aria-live="polite">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Category</th>
                    <th scope="col" style={{ textAlign: "right" }}>
                      Amount
                    </th>
                    <th scope="col" style={{ textAlign: "right" }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx) => {
                    const style = getCategoryPresentation(
                      tx.category,
                      categoryPresentationOptions
                    );
                    const identifier = tx.id || tx._id;
                    const icon = style.emoji || style.initials;
                    return (
                      <tr key={identifier}>
                        <td data-label="Date">{formatDate(tx.date)}</td>
                        <td data-label="Category">
                          <span
                            className="category-chip"
                            style={{ backgroundColor: `${style.color}22` }}
                          >
                            <span
                              className="category-chip__emoji"
                              role="img"
                              aria-label={`${style.originalName} category`}
                            >
                              {icon}
                            </span>
                            {style.originalName}
                          </span>
                        </td>
                        <td
                          data-label="Amount"
                          style={{ textAlign: "right" }}
                        >
                          {fmt(tx.amount)}
                        </td>
                        <td data-label="Actions" className="table-actions-cell">
                          <div className="table-actions">
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => handleEditTransaction(tx)}
                            >
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => handleDeleteTransaction(identifier)}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="expense-list" role="list">
              {filteredTransactions.map((tx) => {
                const style = getCategoryPresentation(
                  tx.category,
                  categoryPresentationOptions
                );
                const identifier = tx.id || tx._id;
                const icon = style.emoji || style.initials;
                return (
                  <article
                    key={identifier}
                    className="expense-item"
                    role="listitem"
                  >
                    <div
                      className="expense-item__icon"
                      style={{ backgroundColor: style.color }}
                      role="img"
                      aria-label={`${style.originalName} category`}
                    >
                      {icon}
                    </div>
                    <div className="expense-item__details">
                      <span className="expense-item__title">
                        {tx.category || "Uncategorized"}
                      </span>
                      <span className="expense-item__meta">
                        {formatDate(tx.date)}
                      </span>
                    </div>
                    <div className="expense-item__actions">
                      <div className="expense-item__amount">
                        {fmt(tx.amount)}
                      </div>
                      <div className="action-buttons">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => handleEditTransaction(tx)}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => handleDeleteTransaction(identifier)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <aside className="layout__right" aria-label="Quick actions">
        <section className="panel sidebar-section" aria-labelledby="quick-add">
          <div className="sidebar-section__header">
            <h2 className="sidebar-section__title" id="quick-add">
              Add Expense
            </h2>
            <span className="section-meta">Log activity instantly</span>
          </div>
          <QuickExpenseForm
            onAdded={refreshData}
            categories={categories.map((c) => c.name)}
          />
        </section>

        <section
          className="panel sidebar-section"
          aria-labelledby="budget-create"
        >
          <div className="sidebar-section__header">
            <h2 className="sidebar-section__title" id="budget-create">
              Create Budget
            </h2>
            <span className="section-meta">Benchmark your targets</span>
          </div>
          <BudgetForm onCreated={refreshData} />
        </section>

        <section className="panel sidebar-section" aria-labelledby="budgets">
          <div className="sidebar-section__header">
            <h2 className="sidebar-section__title" id="budgets">
              Active Budgets
            </h2>
            <span className="section-meta">
              {budgets.length} active
            </span>
          </div>
          {budgets.length === 0 ? (
            <div className="empty-state">
              Create your first budget to track progress.
            </div>
          ) : (
            <ul className="budget-list" role="list">
              {budgets.map((budget) => (
                <li className="budget-item" key={budget.id} role="listitem">
                  <div className="budget-item__details">
                    <span className="budget-item__period">
                      {budget.period}
                    </span>
                    <span className="budget-item__amount">
                      {fmt(budget.amount)}
                    </span>
                  </div>
                  <div className="budget-item__actions">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => handleEditBudget(budget)}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => handleDeleteBudget(budget.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          className="panel sidebar-section"
          aria-labelledby="category-manager-title"
        >
          <CategoriesManager
            categories={categories}
            onCreate={handleAddCategory}
            onDelete={handleDeleteCategory}
            onUpdateEmoji={handleUpdateCategoryEmoji}
          />
        </section>
      </aside>
    </div>
  );
};

export default Dashboard;
