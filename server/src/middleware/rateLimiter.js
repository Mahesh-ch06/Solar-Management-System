/**
 * In-Memory Sliding Window Rate Limiter
 * 
 * Purpose:
 * Protects sensitive authentication and submission endpoints against
 * brute-force password guessing and volumetric DoS attacks without
 * requiring external Redis or key-value infrastructure.
 */

export function createRateLimiter({
  windowMs = 60 * 1000,
  max = 60,
  message = 'Too many requests from this IP, please try again after a minute.',
} = {}) {
  const clients = new Map();

  // Clean expired windows every 2 minutes
  const interval = setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of clients.entries()) {
      if (now > entry.resetTime) {
        clients.delete(ip);
      }
    }
  }, 2 * 60 * 1000);
  interval.unref();

  return (req, res, next) => {
    // In automated testing environments, bypass rate limiting to prevent test interference
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
    const now = Date.now();

    let entry = clients.get(ip);
    if (!entry || now > entry.resetTime) {
      entry = { count: 1, resetTime: now + windowMs };
      clients.set(ip, entry);
    } else {
      entry.count += 1;
    }

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - entry.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000));

    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        success: false,
        error: message,
        message,
        retryAfter,
      });
    }

    next();
  };
}
