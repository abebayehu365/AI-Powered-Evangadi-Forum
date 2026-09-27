/**
 * addon.js — Standalone Express server for new ForumStudy features.
 *
 * Runs on port 3002 (or ADDON_PORT env var) so zero existing files are modified.
 * Start with: node addon.js  (or: nodemon addon.js)
 *
 * Features served:
 *   POST/GET  /api/addon/ratings/...  — Answer ratings
 *   POST/GET  /api/addon/reports/...  — Content reporting
 *   POST/GET  /api/addon/support/...  — AI support bot
 *   GET/PUT   /api/addon/profiles/... — User profiles
 *   POST/GET  /api/addon/follows/...  — Follow / follower
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { db } from './db/config.js';
import { errorHandler } from './src/middleware/error-handler.js';

// Route modules
import ratingRoutes  from './src/api/rating/routes/rating.routes.js';
import reportRoutes  from './src/api/report/routes/report.routes.js';
import supportRoutes from './src/api/support/routes/support.routes.js';
import profileRoutes from './src/api/profile/routes/profile.routes.js';
import followRoutes  from './src/api/follow/routes/follow.routes.js';

const app = express();
const port = process.env.ADDON_PORT || 3002;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', server: 'addon', timestamp: new Date() }),
);

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/addon/ratings',  ratingRoutes);
app.use('/api/addon/reports',  reportRoutes);
app.use('/api/addon/support',  supportRoutes);
app.use('/api/addon/profiles', profileRoutes);
app.use('/api/addon/follows',  followRoutes);

// ── Error handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
const start = async () => {
  try {
    const conn = await db.getConnection();
    console.log('Addon server: DB connection OK');
    conn.release();

    app.listen(port, () =>
      console.log(`Addon server running at http://localhost:${port}`),
    );
  } catch (err) {
    console.error('Addon server: failed to connect to DB:', err.message);
    process.exit(1);
  }
};

start();
