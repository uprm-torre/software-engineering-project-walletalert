import React, { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import api from "../api/api";
import Input from "./ui/Input";
import Select from "./ui/Select";
import Button from "./ui/Button";

/**
 * Form for creating a budget entry with amount and period fields.
 * Performs basic validation then POSTs /api/budgets; notifies parent via onCreated.
 *
 * @param {{ onCreated?: function }} props
 */
const BudgetForm = ({ onCreated }) => {
  const { getAccessTokenSilently } = useAuth0();
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState("weekly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Budget amount must be greater than zero.");
      return;
    }

    setLoading(true);
    try {
      const token = await getAccessTokenSilently();
      const payload = { period, amount: parsedAmount };
      await api.post("/api/budgets", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAmount("");
      setPeriod("weekly");
      if (onCreated) onCreated();
    } catch (err) {
      console.error("Create budget error:", err?.response?.data || err.message || err);
      setError(err?.response?.data?.error || "Could not create budget. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      <div className="form-field">
        <label className="form-label" htmlFor="budget-amount">
          Amount
        </label>
        <Input
          id="budget-amount"
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          aria-invalid={Boolean(error)}
          required
        />
      </div>

      <div className="form-field">
        <label className="form-label" htmlFor="budget-period">
          Period
        </label>
        <Select
          id="budget-period"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
        >
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </Select>
      </div>

      {error && (
        <span className="form-error" role="alert">
          {error}
        </span>
      )}

      <Button type="submit" disabled={loading} aria-busy={loading}>
        {loading ? "Saving..." : "Create Budget"}
      </Button>
    </form>
  );
};

export default BudgetForm;
