import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { checkJwt } from "./auth.js";
import bootstrapRoutes from "./routes/bootstrap.js";
import budgetRoutes from "./routes/budgets.js";
import transactionRoutes from "./routes/transactions.js";
import categoryRoutes from "./routes/categories.js";
import { connect as connectDb, ensureIndexes } from './db.js';

dotenv.config();
const app = express();

// Robust CORS config to support Authorization header from web app
const allowedOrigins = [
  process.env.WEB_ORIGIN,
  'https://walletalert-web.onrender.com',
  'http://localhost:5173',
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());


// Health check route
app.get("/api/health", (req, res) => res.json({ ok: true }));

// Root route: helpful message instead of Express default "Cannot GET /"
app.get("/", (req, res) => {
  res.send("WalletAlert API - available endpoints: /api/health, /api/bootstrap, /api/budgets, /api/transactions");
});

// User bootstrap route (in-memory)
app.use("/api/bootstrap", bootstrapRoutes);

// Budget routes (protected)
app.use("/api/budgets", checkJwt, budgetRoutes);

// Transaction routes (protected)
app.use("/api/transactions", checkJwt, transactionRoutes);

// Category routes (protected)
app.use("/api/categories", checkJwt, categoryRoutes);

// Profile endpoint
app.get("/api/profile", checkJwt, (req, res) => {
  // Return basic info from the token; extend to use your DB later if needed
  res.json({ sub: req.auth.payload.sub, scopes: req.auth.payload.scope || null });
});

const port = process.env.PORT || 3000;

async function start() {
  await connectDb();
  // create required indexes if they don't exist
  await ensureIndexes();
  app.listen(port, () => console.log(`API running on http://localhost:${port}`));
}

start();
