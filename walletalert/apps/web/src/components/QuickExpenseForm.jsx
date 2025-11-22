import React, { useEffect, useMemo, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import api from "../api/api";
import Input from "./ui/Input";
import Select from "./ui/Select";
import Button from "./ui/Button";

/**
 * Quick-add expense form for logging a single transaction with minimal inputs.
 * Validates amount/category, posts to /api/transactions, and notifies parent via onAdded.
 *
 * @param {{ onAdded?: function, categories?: string[] }} props
 */
const QuickExpenseForm = ({ onAdded, categories = [] }) => {
  const { getAccessTokenSilently } = useAuth0();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const categoryOptions = useMemo(
    () => categories.filter((item) => Boolean(item)),
    [categories]
  );

  useEffect(() => {
    if (!categoryOptions.length) {
      setCategory("");
      return;
    }
    if (!categoryOptions.includes(category)) {
      setCategory(categoryOptions[0]);
    }
  }, [categoryOptions, category]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!categoryOptions.length) {
      setError("Add a category before logging expenses.");
      return;
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Expense amount must be greater than zero.");
      return;
    }

    setLoading(true);
    try {
      const token = await getAccessTokenSilently();
      const payload = {
        amount: parsedAmount,
        category,
        date: new Date().toISOString(),
        description: category,
      };
      const res = await api.post("/api/transactions", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAmount("");
      setCategory(categoryOptions[0] || "");
      if (onAdded) onAdded(res.data);
    } catch (err) {
      console.error("Add expense error:", err?.response?.data || err.message || err);
      setError(err?.response?.data?.error || "Could not add expense. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <div className="form-field">
        <label className="form-label" htmlFor="quick-amount">
          Amount
        </label>
        <Input
          id="quick-amount"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          aria-invalid={Boolean(error)}
          required
        />
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor="quick-category">
          Category
        </label>
        <Select
          id="quick-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          disabled={!categoryOptions.length}
          aria-disabled={!categoryOptions.length}
        >
          {categoryOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
        {!categoryOptions.length && (
          <span className="form-helper">
            Add at least one category to start tracking expenses.
          </span>
        )}
      </div>

      {error && (
        <span className="form-error" role="alert">
          {error}
        </span>
      )}

      <Button
        type="submit"
        disabled={loading || !categoryOptions.length}
        aria-busy={loading}
      >
        {loading ? "Logging..." : "Add Expense"}
      </Button>
    </form>
  );
};

export default QuickExpenseForm;
