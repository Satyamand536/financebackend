const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const AppError = require('./core/errors/AppError');
const globalErrorHandler = require('./core/middlewares/error.middleware');

// Route modules
const authRoutes      = require('./modules/auth/auth.routes');
const financeRoutes   = require('./modules/finance/finance.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');
const userRoutes      = require('./modules/user/user.routes');

const app = express();

// ─────────────────────────────────────────────
// Global Security & Utility Middlewares
// ─────────────────────────────────────────────

// Set secure HTTP headers (XSS, clickjacking, MIME sniffing, etc.)
app.use(helmet());

// Enable Cross-Origin Resource Sharing
app.use(cors());

// JSON body parser — 10kb limit prevents large payload attacks
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// HTTP request logger — development only to avoid noise in prod logs
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─────────────────────────────────────────────
// Rate Limiting
// ─────────────────────────────────────────────

// Strict limit on auth routes to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});

// General API rate limiter — generous for normal app usage
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});

app.use('/api/v1/auth', authLimiter);
app.use('/api/v1', apiLimiter);

// ─────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────

app.get('/', (req, res) =>
  res.status(200).json({
    success: true,
    message: 'Welcome to the Finance Dashboard API!',
    version: 'v1',
    docs: 'See README.md for full API documentation'
  })
);

app.get('/health', (req, res) =>
  res.status(200).json({ success: true, status: 'OK', timestamp: new Date().toISOString() })
);

app.use('/api/v1/auth',      authRoutes);
app.use('/api/v1/users',     userRoutes);
app.use('/api/v1/finance',   financeRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// ─────────────────────────────────────────────
// Error Handling
// ─────────────────────────────────────────────

// Handle all unmatched routes
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Centralized global error handler
app.use(globalErrorHandler);

module.exports = app;
