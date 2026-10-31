/**
 * [Member 4] Executive Dashboard & Financial Analytics Controller
 * 
 * Purpose:
 * Aggregates high-level KPIs across all modules: sales conversion rates, revenue pipeline,
 * active installation stages, open warranty service tickets, and warehouse valuation.
 * 
 * Why in this file?
 * Provides unified cross-table SQL aggregation queries for executive reports.
 */

import { db } from '../../db/database.js';

export const dashboardController = {
  /**
   * GET /api/v1/dashboard/metrics
   * Aggregated cross-system KPIs for the Executive Management Dashboard
   */
  getMetrics(req, res, next) {
    try {
      const customerCount = db.prepare('SELECT COUNT(*) as count FROM customers').get().count;
      const convertedCount = db.prepare("SELECT COUNT(*) as count FROM customers WHERE status = 'CONVERTED'").get().count;
      const activeJobsCount = db.prepare("SELECT COUNT(*) as count FROM installation_jobs WHERE stage != 'COMMISSIONED'").get().count;
      const openTicketsCount = db.prepare("SELECT COUNT(*) as count FROM service_tickets WHERE status != 'CLOSED' AND status != 'RESOLVED'").get().count;

      const revenueRow = db.prepare('SELECT COALESCE(SUM(totalAmount), 0) as totalRevenue, COALESCE(SUM(advanceReceived), 0) as totalAdvance, COALESCE(SUM(balanceDue), 0) as totalPending FROM orders').get();
      const lowStockCount = db.prepare('SELECT COUNT(*) as count FROM inventory_items WHERE currentStock <= lowStockThreshold').get().count;

      // Pipeline status distribution
      const pipelineBreakdown = db.prepare(`
        SELECT status, COUNT(*) as count 
        FROM customers 
        GROUP BY status
      `).all();

      return res.status(200).json({
        success: true,
        data: {
          totalCustomers: customerCount,
          convertedCustomers: convertedCount,
          activeInstallationJobs: activeJobsCount,
          openServiceTickets: openTicketsCount,
          totalRevenue: revenueRow.totalRevenue,
          totalAdvanceCollected: revenueRow.totalAdvance,
          totalPendingReceivables: revenueRow.totalPending,
          lowStockAlerts: lowStockCount,
          pipelineBreakdown,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/finance/summary
   * P&L and Cash Flow Summary
   */
  getFinanceSummary(req, res, next) {
    try {
      const ordersSummary = db.prepare(`
        SELECT 
          COUNT(*) as totalOrders,
          COALESCE(SUM(totalAmount), 0) as totalContractedValue,
          COALESCE(SUM(advanceReceived), 0) as totalAdvanceReceived,
          COALESCE(SUM(balanceDue), 0) as totalBalanceDue
        FROM orders
      `).get();

      const avgMargin = db.prepare('SELECT AVG(grossMarginPercent) as avgMargin FROM quotations WHERE status = \'ACCEPTED\'').get();

      return res.status(200).json({
        success: true,
        data: {
          ...ordersSummary,
          averageGrossMarginPercent: avgMargin.avgMargin ? Math.round(avgMargin.avgMargin * 10) / 10 : 25.0,
        },
      });
    } catch (err) {
      next(err);
    }
  },
};

