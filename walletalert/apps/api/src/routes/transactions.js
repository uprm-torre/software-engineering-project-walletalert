import express from "express";
import { listTransactions, createTransaction, updateTransaction, deleteTransaction, categoryExists } from "../store.js";

const router = express.Router();

router.post('/', async (req, res) => {
    const sub = req.auth.payload.sub;
    const { amount, category, date, description } = req.body;

    const normalizedAmount = Number(amount);
    if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
        return res.status(400).json({ error: 'Expense amount must be greater than zero.' });
    }
    if (!category || typeof category !== 'string') {
        return res.status(400).json({ error: 'Expense category is required.' });
    }

    const trimmedCategory = category.trim();
    if (!(await categoryExists(sub, trimmedCategory))) {
        return res.status(400).json({ error: 'Category does not exist. Create it first before logging expenses.' });
    }

    try {
        const tx = await createTransaction(sub, {
            amount: normalizedAmount,
            category: trimmedCategory,
            date,
            description,
        });
        res.status(201).json(tx);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.get('/', async (req, res) => {
    const sub = req.auth.payload.sub;
    try {
        const txs = await listTransactions(sub);
        res.json(txs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', async (req, res) => {
    const sub = req.auth.payload.sub;
    const { id } = req.params;
    const changes = { ...req.body };

    if (changes.amount !== undefined) {
        const normalizedAmount = Number(changes.amount);
        if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
            return res.status(400).json({ error: 'Expense amount must be greater than zero.' });
        }
        changes.amount = normalizedAmount;
    }

    if (changes.category !== undefined) {
        if (!changes.category || typeof changes.category !== 'string') {
            return res.status(400).json({ error: 'Expense category is required.' });
        }
        const trimmedCategory = changes.category.trim();
        if (!(await categoryExists(sub, trimmedCategory))) {
            return res.status(400).json({ error: 'Category does not exist. Create it first before logging expenses.' });
        }
        changes.category = trimmedCategory;
    }

    try {
        const updated = await updateTransaction(sub, id, changes);
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    const sub = req.auth.payload.sub;
    const { id } = req.params;
    try {
        const removed = await deleteTransaction(sub, id);
        res.json({ removed });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

export default router;
