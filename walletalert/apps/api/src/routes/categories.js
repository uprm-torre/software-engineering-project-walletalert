import express from "express";
import { listCategories, createCategory, updateCategory, deleteCategory } from "../store.js";

const router = express.Router();

router.get("/", async (req, res) => {
    const sub = req.auth.payload.sub;
    try {
        const categories = await listCategories(sub);
        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/", async (req, res) => {
    const sub = req.auth.payload.sub;
    const { name, emoji } = req.body;

    try {
        const created = await createCategory(sub, name, emoji);
        res.status(201).json(created);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.put("/:id", async (req, res) => {
    const sub = req.auth.payload.sub;
    const { id } = req.params;
    const { emoji } = req.body || {};

    try {
        const updated = await updateCategory(sub, id, { emoji });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete("/:id", async (req, res) => {
    const sub = req.auth.payload.sub;
    const { id } = req.params;

    try {
        const removed = await deleteCategory(sub, id);
        res.json({ removed });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

export default router;
