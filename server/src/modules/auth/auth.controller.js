/**
 * [Member 1] Authentication Controller
 * 
 * Purpose:
 * Handles employee login, registration, and session verification.
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

export const authController = {
  /**
   * POST /api/v1/auth/login
   * Authenticates user credentials and checks approval status
   */
  login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password are required.' });
      }

      const stmt = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)');
      const user = stmt.get(email.trim());

      if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid email or password.' });
      }

      // Verify bcrypt password hash
      const isPasswordValid = bcrypt.compareSync(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, error: 'Invalid email or password.' });
      }

      // Check account approval status
      if (user.status === 'PENDING_APPROVAL') {
        return res.status(403).json({
          success: false,
          error: 'Your account is pending administrator approval. Please contact your manager.',
        });
      }

      if (user.status === 'SUSPENDED') {
        return res.status(403).json({
          success: false,
          error: 'This account has been deactivated. Please contact IT support.',
        });
      }

      // Generate JWT Token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      // Return user profile (exclude password)
      const { password: _, ...userProfile } = user;

      return res.status(200).json({
        success: true,
        token,
        user: userProfile,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/auth/register
   * Employee self-registration (Default status: PENDING_APPROVAL)
   */
  register(req, res, next) {
    try {
      const { name, email, password, phone, role, department } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ success: false, error: 'Name, email, and password are required.' });
      }

      // Check if email already registered
      const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());
      if (existing) {
        return res.status(409).json({ success: false, error: 'An account with this email address already exists.' });
      }

      const id = `usr-${Date.now().toString(36)}`;
      const passwordHash = bcrypt.hashSync(password, 10);
      const assignedRole = role || 'SALES';

      const insert = db.prepare(`
        INSERT INTO users (id, name, email, password, phone, role, department, status, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING_APPROVAL', datetime('now'), datetime('now'))
      `);

      insert.run(id, name.trim(), email.trim().toLowerCase(), passwordHash, phone || null, assignedRole, department || null);

      return res.status(201).json({
        success: true,
        message: 'Registration request submitted successfully. Awaiting Administrator verification.',
        userId: id,
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
      const stmt = db.prepare('SELECT id, name, email, phone, role, department, status, createdAt, updatedAt FROM users WHERE id = ?');
      const user = stmt.get(req.user.id);

      if (!user) {
        return res.status(404).json({ success: false, error: 'User account not found.' });
      }

      return res.status(200).json({
        success: true,
        user,
      });
    } catch (err) {
      next(err);
    }
  },
};

