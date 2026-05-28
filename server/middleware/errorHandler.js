/**
 * Custom API error class with status code support
 */
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global 404 handler — must be registered AFTER all routes
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
}

/**
 * Global error handler — must be registered LAST with app.use(errorHandler)
 *
 * Development: includes full stack trace
 * Production: stack trace is omitted unless NODE_ENV !== 'production'
 */
function errorHandler(err, req, res, next) {
  // Default to 500 if statusCode not set
  const statusCode = err.statusCode || 500;
  const isDev = process.env.NODE_ENV !== 'production';

  // Log full error server-side (always)
  console.error(`[ERROR] ${req.method} ${req.originalUrl} — ${err.statusCode || 500}: ${err.message}`);
  if (isDev && err.stack) {
    console.error(err.stack);
  }

  // Build consistent error envelope
  const envelope = {
    error: err.name === 'ApiError' || err.statusCode
      ? (err.message || 'Internal Server Error')
      : 'Internal Server Error',
    ...(isDev && { stack: err.stack })
  };

  // Include validation errors from Mongoose
  if (err.name === 'ValidationError' && err.errors) {
    envelope.error = 'Validation Error';
    envelope.details = Object.values(err.errors).map(e => e.message);
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    envelope.error = 'Invalid ID';
    envelope.message = `Resource not found for ID: ${err.value}`;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    envelope.error = 'Unauthorized';
    envelope.message = 'Invalid or missing authentication token';
  }
  if (err.name === 'TokenExpiredError') {
    envelope.error = 'Unauthorized';
    envelope.message = 'Authentication token has expired';
  }

  res.status(statusCode).json(envelope);
}

module.exports = { ApiError, errorHandler, notFoundHandler };
