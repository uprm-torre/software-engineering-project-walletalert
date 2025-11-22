import express from "express";
import { listBudgets, createBudget, updateBudget, deleteBudget } from "../store.js";

const router = express.Router();

/**
 * Budget routes: create/list/update/delete budgets for the authenticated user.
 */
// Create a new budget
router.post("/", async (req, res) => {
    const { period, amount, categories } = req.body;
    const sub = req.auth.payload.sub; // auth0 user id

    const normalizedAmount = Number(amount);
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
        return res.status(400).json({ error: "Budget amount must be greater than zero." });
    }

    const allowedPeriods = ["weekly", "monthly"];
    if (period && !allowedPeriods.includes(period)) {
        return res.status(400).json({ error: "Budget period must be weekly or monthly." });
    }

    try {
        const budget = await createBudget(sub, {
            period: period || "weekly",
            amount: normalizedAmount,
            categories,
        });
        res.status(201).json(budget);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get all budgets for the authenticated user
router.get("/", async (req, res) => {
    const sub = req.auth.payload.sub; // auth0 user id

    try {
        const budgets = await listBudgets(sub);
        res.json(budgets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update a budget
router.put('/:id', async (req, res) => {
    const sub = req.auth.payload.sub;
    const { id } = req.params;
    const changes = { ...req.body };

    if (changes.amount !== undefined) {
        const normalizedAmount = Number(changes.amount);
        if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
            return res.status(400).json({ error: "Budget amount must be greater than zero." });
        }
        changes.amount = normalizedAmount;
    }

    if (changes.period) {
        const allowedPeriods = ["weekly", "monthly"];
        if (!allowedPeriods.includes(changes.period)) {
            return res.status(400).json({ error: "Budget period must be weekly or monthly." });
        }
    }

    try {
        const updated = await updateBudget(sub, id, changes);
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete a budget
router.delete('/:id', async (req, res) => {
    const sub = req.auth.payload.sub;
    const { id } = req.params;
    try {
        const removed = await deleteBudget(sub, id);
        res.json({ removed });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

export default router;
