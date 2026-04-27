require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const runMigrations = require('./config/migrate');
const authRoutes = require('./routes/auth.routes');
const contentRoutes = require('./routes/content.routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Rate limiter for the public broadcast endpoint
const broadcastLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Apply rate limiter only to public broadcast endpoint
app.use('/api/content/live', broadcastLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// 404 handler
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

async function start() {
  await runMigrations();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});

// Graceful shutdown — close DB pool on SIGTERM/SIGINT
const pool = require('./config/db');
function shutdown(signal) {
  console.log(`${signal} received. Closing server...`);
  pool.end(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

module.exports = app;
