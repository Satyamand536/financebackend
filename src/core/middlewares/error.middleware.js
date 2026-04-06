const AppError = require('../errors/AppError');

// ─────────────────────────────────────────────
// Error Type Handlers
// ─────────────────────────────────────────────

/**
 * Handles Mongoose CastError (e.g., invalid ObjectId format in URL params).
 * Example: GET /api/v1/users/not-a-valid-id
 */
const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: '${err.value}'. Please provide a valid value.`;
  return new AppError(message, 400);
};

/**
 * Handles Mongoose duplicate key error (code 11000).
 * Example: registering with an email that already exists.
 * Compatible with both Mongoose v5 (errmsg) and v6+ (keyValue).
 */
const handleDuplicateFieldsDB = err => {
  // Mongoose v6+ provides err.keyValue; fall back to parsing err.message
  let value;
  if (err.keyValue) {
    value = Object.values(err.keyValue).join(', ');
  } else {
    const match = err.message.match(/(['"])(\\?.)*?\1/);
    value = match ? match[0] : 'unknown';
  }
  const message = `Duplicate field value: '${value}'. Please use a different value.`;
  return new AppError(message, 400);
};

/**
 * Handles Mongoose ValidationError (schema-level validation failures).
 * Example: creating a record without a required field.
 */
const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError       = () => new AppError('Invalid token. Please log in again.', 401);
const handleJWTExpiredError = () => new AppError('Your token has expired. Please log in again.', 401);

// ─────────────────────────────────────────────
// Response Formatters
// ─────────────────────────────────────────────

/**
 * Development mode: include full error details and stack trace.
 * Never use in production — leaks internal implementation details.
 */
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    status:  err.status,
    message: err.message,
    error:   err,
    stack:   err.stack
  });
};

/**
 * Production mode: only reveal details for operational errors
 * (i.e., AppError instances we intentionally threw).
 * For unexpected programming bugs, return a generic message.
 */
const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  }

  // Log unknown errors server-side so we can investigate
  console.error('UNEXPECTED ERROR 💥', err);

  // Send a safe, generic response to the client
  res.status(500).json({
    success: false,
    message: 'Something went wrong. Please try again later.'
  });
};

// ─────────────────────────────────────────────
// Global Error Handler Middleware
// ─────────────────────────────────────────────

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status     = err.status     || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = Object.assign(Object.create(Object.getPrototypeOf(err)), err);
    error.message = err.message;
    error.name    = err.name;

    if (error.name === 'CastError')           error = handleCastErrorDB(error);
    if (error.code === 11000)                 error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError')     error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError')   error = handleJWTError();
    if (error.name === 'TokenExpiredError')   error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};
