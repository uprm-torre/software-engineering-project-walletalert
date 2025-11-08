import express from "express";
import { upsertUser } from "../store.js";
import { checkJwt } from "../auth.js";

const router = express.Router();

// Informational GET: guide callers that bootstrap is POST-only (avoid default "Cannot GET /api/bootstrap")
router.get("/", (req, res) => {
    res.status(405).json({ error: "Method Not Allowed", message: "Bootstrap is POST-only. Use POST /api/bootstrap" });
});

// Protected bootstrap: take auth0_id from validated token (req.auth.payload.sub)
router.post("/", checkJwt, async (req, res) => {
    const auth0_id = req.auth?.payload?.sub;
    const email = req.auth?.payload?.email || null;
    if (!auth0_id) return res.status(400).json({ error: "auth0_id missing in token" });

    const { user, created } = await upsertUser(auth0_id, email);
    if (created) return res.status(201).json({ user, created: true });
    return res.status(200).json({ user, created: false });
});

export default router;
