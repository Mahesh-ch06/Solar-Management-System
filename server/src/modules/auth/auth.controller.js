/**
 * [Member 1] Authentication Controller
 * 
 * Purpose:
 * Handles employee login, registration, session verification, and administrator authentication.
 * Issues JSON Web Tokens (JWT) for authenticated requests.
 * 
 * Why in this file?
 * Encapsulates all authentication business logic in a dedicated module,
 * completely decoupled from sales, warehouse, and installations code.
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../../db/database.js';
import { config } from '../../config/config.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_STAFF_ROLES = ['SALES', 'TECHNICIAN', 'WAREHOUSE_MANAGER', 'SUPPORT_AGENT'];
const DUMMY_BCRYPT_HASH = '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012';

export const authController = {
  /**
   * POST /api/v1/auth/login
   * Authenticates user credentials and checks approval status
   */
  login(req, res, next) {
    try {
      const { email, password } = req.body || {};

      if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required and must be valid strings.',
          message: 'Email and password are required.',
        });
      }

      const normalizedEmail = email.trim().toLowerCase();
      if (!EMAIL_REGEX.test(normalizedEmail)) {
        return res.status(400).json({
          success: false,
          error: 'Please provide a valid email address.',
          message: 'Please provide a valid email address.',
        });
      }

      if (password.length > 128) {
        return res.status(400).json({
          success: false,
          error: 'Password exceeds maximum permitted length (128 characters).',
          message: 'Password exceeds maximum permitted length (128 characters).',
        });
      }

      const stmt = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)');
      const user = stmt.get(normalizedEmail);

      if (!user) {
        // Constant-time execution to prevent timing-based user enumeration attacks
        try { bcrypt.compareSync(password, DUMMY_BCRYPT_HASH); } catch (_) {}
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password.',
          message: 'Invalid email or password.',
        });
      }

      // Verify bcrypt password hash
      const isPasswordValid = bcrypt.compareSync(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password.',
          message: 'Invalid email or password.',
        });
      }

      // Check account approval status
      if (user.status === 'PENDING_APPROVAL') {
        return res.status(403).json({
          success: false,
          error: 'Your account is pending administrator approval. Please contact your manager.',
          message: 'Your account is pending administrator approval. Please contact your manager.',
        });
      }

      if (user.status === 'SUSPENDED') {
        return res.status(403).json({
          success: false,
          error: 'This account has been deactivated. Please contact IT support.',
          message: 'This account has been deactivated. Please contact IT support.',
        });
      }

      // Generate JWT Token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
          department: user.department,
        },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      // Return user profile (exclude password)
      const { password: _, ...userProfile } = user;

      return res.status(200).json({
        success: true,
        message: 'Authentication successful.',
        token,
        user: userProfile,
        data: {
          token,
          user: userProfile,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/auth/admin-login
   * Dedicated login for System Administrators and Directors
   */
  adminLogin(req, res, next) {
    try {
      const { email, password } = req.body || {};

      if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required and must be valid strings.',
          message: 'Email and password are required.',
        });
      }

      const normalizedEmail = email.trim().toLowerCase();
      if (!EMAIL_REGEX.test(normalizedEmail)) {
        return res.status(400).json({
          success: false,
          error: 'Please provide a valid administrator email address.',
          message: 'Please provide a valid administrator email address.',
        });
      }

      if (password.length > 128) {
        return res.status(400).json({
          success: false,
          error: 'Password exceeds maximum permitted length (128 characters).',
          message: 'Password exceeds maximum permitted length (128 characters).',
        });
      }

      const stmt = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)');
      const user = stmt.get(normalizedEmail);

      if (!user) {
        // Constant-time execution to prevent timing-based user enumeration attacks
        try { bcrypt.compareSync(password, DUMMY_BCRYPT_HASH); } catch (_) {}
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password.',
          message: 'Invalid email or password.',
        });
      }

      const isPasswordValid = bcrypt.compareSync(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password.',
          message: 'Invalid email or password.',
        });
      }

      // Enforce Admin / Director privilege
      if (!['ADMIN', 'DIRECTOR'].includes(user.role)) {
        return res.status(403).json({
          success: false,
          error: 'Access restricted: Only authorized System Administrators and Directors can log in through the Admin Portal.',
          message: 'Access restricted: Only authorized System Administrators and Directors can log in through the Admin Portal.',
        });
      }

      if (user.status === 'PENDING_APPROVAL') {
        return res.status(403).json({
          success: false,
          error: 'Your administrator account is pending approval.',
          message: 'Your administrator account is pending approval.',
        });
      }

      if (user.status === 'SUSPENDED') {
        return res.status(403).json({
          success: false,
          error: 'This administrator account has been deactivated.',
          message: 'This administrator account has been deactivated.',
        });
      }

      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
          department: user.department,
        },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      const { password: _, ...userProfile } = user;

      return res.status(200).json({
        success: true,
        message: 'Administrator authentication successful.',
        token,
        user: userProfile,
        data: {
          token,
          user: userProfile,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/auth/register
   * Employee self-registration (Default status: PENDING_APPROVAL)
   * Disallows privilege escalation to ADMIN/DIRECTOR during self-registration
   */
  register(req, res, next) {
    try {
      const { name, email, password, phone, role, department } = req.body || {};

      if (!name || typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Full name is required and must be at least 2 characters long.',
          message: 'Full name is required and must be at least 2 characters long.',
        });
      }

      if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
        return res.status(400).json({
          success: false,
          error: 'A valid email address is required.',
          message: 'A valid email address is required.',
        });
      }

      if (!password || typeof password !== 'string' || password.length < 6 || password.length > 128) {
        return res.status(400).json({
          success: false,
          error: 'Password is required and must be between 6 and 128 characters.',
          message: 'Password is required and must be between 6 and 128 characters.',
        });
      }

      let cleanPhone = null;
      if (phone !== undefined && phone !== null && String(phone).trim() !== '') {
        const digits = String(phone).trim().replace(/\D/g, '');
        if (digits.length < 10) {
          return res.status(400).json({
            success: false,
            error: 'Phone number must contain at least 10 digits.',
            message: 'Phone number must contain at least 10 digits.',
          });
        }
        cleanPhone = String(phone).trim();
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Check if email already registered
      const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(normalizedEmail);
      if (existing) {
        return res.status(409).json({
          success: false,
          error: 'An account with this email address already exists.',
          message: 'An account with this email address already exists.',
        });
      }

      // Security check: self-registration cannot grant ADMIN or DIRECTOR privileges
      let assignedRole = 'SALES';
      if (role && ALLOWED_STAFF_ROLES.includes(role)) {
        assignedRole = role;
      }

      const id = `usr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      const passwordHash = bcrypt.hashSync(password, 10);
      const cleanDept = department ? String(department).trim() : 'Field / Commercial Operations';

      const insert = db.prepare(`
        INSERT INTO users (id, name, email, password, phone, role, department, status, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING_APPROVAL', datetime('now'), datetime('now'))
      `);

      insert.run(
        id,
        name.trim(),
        normalizedEmail,
        passwordHash,
        cleanPhone,
        assignedRole,
        cleanDept
      );

      return res.status(201).json({
        success: true,
        message: 'Registration request submitted successfully. Awaiting Administrator verification.',
        userId: id,
        data: {
          id,
          name: name.trim(),
          email: normalizedEmail,
          phone: cleanPhone,
          role: assignedRole,
          department: cleanDept,
          status: 'PENDING_APPROVAL',
        },
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/auth/me
   * Fetches active profile of the current JWT token holder
   */
  getMe(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: 'Authentication token missing or invalid.',
          message: 'Authentication token missing or invalid.',
        });
      }

      const stmt = db.prepare(`
        SELECT id, name, email, phone, role, department, status, roleAssignedBy, roleAssignedAt, createdAt, updatedAt 
        FROM users 
        WHERE id = ?
      `);
      const user = stmt.get(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User account not found.',
          message: 'User account not found.',
        });
      }

      if (user.status === 'SUSPENDED') {
        return res.status(403).json({
          success: false,
          error: 'This account has been deactivated. Please contact IT support.',
          message: 'This account has been deactivated. Please contact IT support.',
        });
      }

      return res.status(200).json({
        success: true,
        user,
        data: user,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/auth/logout
   * Session termination endpoint
   */
  logout(req, res) {
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
      timestamp: new Date().toISOString(),
    });
  },
};
