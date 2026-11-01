/**
 * HTTP Security Headers Middleware
 * 
 * Purpose:
 * Hardens the API against common web vulnerabilities:
 * - MIME-type confusion attacks (X-Content-Type-Options)
 * - Clickjacking (X-Frame-Options)
 * - Cross-site scripting in legacy browsers (X-XSS-Protection)
 * - Referrer information leakage (Referrer-Policy)
 */

export function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
}

