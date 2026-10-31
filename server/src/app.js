/**
 * Express Application Setup
 * 
 * Purpose:
 * Central configuration of Express middleware and route mounting.
 * 
 * Why in this file?
 * Keeps Express app configuration separate from the HTTP network listener (server.js),
 * making testing clean and straightforward.
 */

import express from 'express';
import cors from 'cors';
import { config } from './config/config.js';
import { errorHandler } from './middleware/errorHandler.js';

// Module Routes
import authRoutes from './modules/auth/auth.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import customerRoutes from './modules/customers/customer.routes.js';
import surveyRoutes from './modules/surveys/survey.routes.js';
import quotationRoutes from './modules/quotations/quotation.routes.js';
import inventoryRoutes from './modules/inventory/inventory.routes.js';
import dispatchRoutes from './modules/dispatch/dispatch.routes.js';
import warrantyRoutes from './modules/warranties/warranty.routes.js';
import installationRoutes from './modules/installations/installation.routes.js';
import serviceRoutes from './modules/service/service.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';

const app = express();

// Standard Middlewares
app.use(cors({
  origin: true, // Allow frontend during local dev
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// ==============================================================================
// 4-Member Route Mounts
// ==============================================================================

// Member 1: Authentication & User Management
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);

// Member 1 Compatibility Aliases (for direct frontend /users and /api/auth integrations)
app.use('/api/v1/users', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', adminRoutes);

// Member 2: CRM Leads, Technical Surveys & Dynamic Quotations
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/surveys', surveyRoutes);
app.use('/api/v1/quotations', quotationRoutes);

// Member 3: Warehouse Inventory, Dispatch & Warranties
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/dispatch', dispatchRoutes);
app.use('/api/v1/warranties', warrantyRoutes);

// Member 4: Field Installations, Service Tickets & Executive Dashboard
app.use('/api/v1/installations', installationRoutes);
app.use('/api/v1/service-tickets', serviceRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// Centralized Error Handling Middleware (must be registered last)
app.use(errorHandler);

export default app;

