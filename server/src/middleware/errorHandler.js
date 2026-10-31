/**
 * Central Error Handling Middleware
 * 
 * Purpose:
 * Catches any unhandled errors or thrown exceptions across Express controllers.
 * Formats a consistent, informative JSON error response so the frontend can display toast messages.
 * 
 * Why in this file?
 * Eliminates repetitive try-catch blocks with boilerplate JSON formatting inside route files.
 */

export function errorHandler(err, req, res, next) {
  console.error('[API Error]:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
}

