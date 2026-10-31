/**
 * Authentication & Authorization Middleware
 * 
 * Purpose:
 * 1. `authenticateToken`: Verifies the incoming HTTP Bearer JWT token.
 * 2. `requireRoles`: Enforces Role-Based Access Control (RBAC) so only authorized roles
 *    (e.g., ADMIN, SALES, TECHNICIAN, etc.) can access specific API endpoints.
 * 
 * Why in this file?
 * Centralizing auth checks prevents duplicating JWT verification logic across all controller routes.
 */

import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  // Token usually comes as: "Bearer <token>"
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.split(' ')[1] 
    : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. No authorization token provided.',
      message: 'Authentication required. No authorization token provided.',
    });
  }

  jwt.verify(token, config.jwtSecret, (err, decodedUser) => {
    if (err) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired authorization token.',
        message: 'Invalid or expired authorization token.',
      });
    }

    // Attach decoded user info (id, email, role, name, department) to the request object
    req.user = decodedUser;
    next();
  });
}

/**
 * RBAC Middleware: Verifies that the authenticated user possesses one of the allowed roles.
 * Usage: router.get('/admin/users', authenticateToken, requireRoles('ADMIN', 'DIRECTOR'), controllerFn);
 */
export function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Requires one of the following roles: ${allowedRoles.join(', ')}`,
        message: `Access denied. Requires one of the following roles: ${allowedRoles.join(', ')}`,
      });
    }
    next();
  };
}


