import { DashboardData, DashboardKPIs, PendingTask, RecentActivity } from '../../../types/dashboard';
import { ApiResponse } from '../../../types/common';
import { simulateMockApiCall } from '../../../mocks/mockService';
import {
  customers,
  quotations,
  orders,
  inventoryItems,
  serviceTickets,
  installationJobs,
  surveys,
  dispatchOrders,
} from '../../../store/inMemoryDb';
import { MOCK_DASHBOARD_DATA } from '../../../mocks/data/mockDashboard';

export const dashboardService = {
  async getDashboardData(): Promise<ApiResponse<DashboardData>> {
    // 1. Calculate dynamic KPIs directly from live database state
    const pendingQuotes = quotations.filter((q) => q.status === 'DRAFT' || q.status === 'SENT');
    const pendingQuotesTotal = pendingQuotes.reduce((acc, q) => acc + q.totalAmount, 0);

    const activeInstalls = installationJobs.filter((j) => j.stage !== 'COMMISSIONED');
    const completedInstalls = installationJobs.filter((j) => j.stage === 'COMMISSIONED');

    const openTickets = serviceTickets.filter((t) => t.status !== 'CLOSED' && t.status !== 'RESOLVED');
    const criticalTickets = openTickets.filter((t) => t.priority === 'CRITICAL');

    const panelsStock = inventoryItems
      .filter((i) => i.category === 'SOLAR_PANEL')
      .reduce((acc, i) => acc + i.currentStock, 0);

    const invertersStock = inventoryItems
      .filter((i) => i.category === 'INVERTER')
      .reduce((acc, i) => acc + i.currentStock, 0);

    const batteriesStock = inventoryItems
      .filter((i) => i.category === 'BATTERY')
      .reduce((acc, i) => acc + i.currentStock, 0);

    const lowStockCount = inventoryItems.filter((i) => i.currentStock <= i.lowStockThreshold).length;

    // Financial revenue computed from confirmed orders
    const totalOrderRevenue = orders.reduce((acc, o) => acc + o.totalAmount, 0);
    const monthlyRev = totalOrderRevenue > 0 ? totalOrderRevenue : 4850000;
    const monthlyExp = Math.round(monthlyRev * 0.738);
    const estProfit = monthlyRev - monthlyExp;
    const profitMargin = Number(((estProfit / monthlyRev) * 100).toFixed(1));

    const liveKPIs: DashboardKPIs = {
      totalEnquiries: {
        value: customers.length,
        trend: 14.5,
        newThisWeek: Math.max(1, customers.filter((c) => c.status === 'NEW').length),
      },
      pendingQuotations: {
        value: pendingQuotes.length,
        totalAmount: pendingQuotesTotal || 845000,
        urgentCount: pendingQuotes.filter((q) => q.status === 'SENT').length,
      },
      confirmedOrders: {
        value: orders.length,
        totalCapacityKW: orders.reduce((acc, o) => acc + o.capacityKW, 0) || 12,
        avgOrderValue: orders.length > 0 ? Math.round(totalOrderRevenue / orders.length) : 340000,
      },
      activeInstallations: {
        value: activeInstalls.length,
        inProgress: installationJobs.filter((j) => j.stage === 'IN_PROGRESS').length,
        scheduledThisWeek: installationJobs.filter((j) => j.stage === 'SCHEDULED').length,
      },
      completedInstallations: {
        value: completedInstalls.length || 38,
        monthlyTarget: 40,
        onTimeRate: 95.0,
      },
      availableInventory: {
        solarPanelsCount: panelsStock,
        invertersCount: invertersStock,
        batteriesCount: batteriesStock,
        lowStockAlerts: lowStockCount,
      },
      openServiceTickets: {
        value: openTickets.length,
        criticalCount: criticalTickets.length,
        avgResolutionHours: 4.8,
      },
      financials: {
        monthlyRevenue: monthlyRev,
        monthlyExpenses: monthlyExp,
        estimatedProfit: estProfit,
        profitMargin,
      },
    };

    // 2. Derive dynamic Pending Tasks from real entities
    const dynamicTasks: PendingTask[] = [];

    // Pending surveys
    const pendingSurvey = surveys.find((s) => s.status === 'PENDING' || s.status === 'SCHEDULED');
    if (pendingSurvey) {
      dynamicTasks.push({
        id: `task-surv-${pendingSurvey.id}`,
        title: `Site Survey Visit Required`,
        category: 'SURVEY',
        priority: 'HIGH',
        customerName: pendingSurvey.customerName,
        systemSize: `${pendingSurvey.recommendedCapacityKW || 3} kW`,
        dueDate: pendingSurvey.scheduledDate || 'Today, 2:00 PM',
        assignedTo: pendingSurvey.assignedTechnicianName,
        statusText: pendingSurvey.status === 'SCHEDULED' ? 'Scheduled with Customer' : 'Unassigned Survey',
      });
    }

    // Pending dispatches
    const pendingDispatch = dispatchOrders.find((d) => d.status === 'PENDING_SERIAL');
    if (pendingDispatch) {
      dynamicTasks.push({
        id: `task-disp-${pendingDispatch.id}`,
        title: `Serial Scanning & Gate Pass Verification`,
        category: 'DISPATCH',
        priority: 'CRITICAL',
        customerName: pendingDispatch.customerName,
        systemSize: 'Inverter + Panels',
        dueDate: 'Today, 4:00 PM',
        assignedTo: 'Warehouse Team',
        statusText: 'Serial Numbers Pending',
      });
    }

    // Open tickets
    const criticalTicket = serviceTickets.find((t) => t.priority === 'CRITICAL' && t.status !== 'RESOLVED');
    if (criticalTicket) {
      dynamicTasks.push({
        id: `task-tkt-${criticalTicket.id}`,
        title: `Urgent Fault Diagnosis (${criticalTicket.faultCode || 'E04'})`,
        category: 'SERVICE',
        priority: 'CRITICAL',
        customerName: criticalTicket.customerName,
        systemSize: 'Under Warranty',
        dueDate: 'Within 2 Hours',
        assignedTo: criticalTicket.assignedTechnicianName || 'Manoj Kumar',
        statusText: 'Technician Dispatched',
      });
    }

    // Installations in progress
    const activeInstall = installationJobs.find((j) => j.stage === 'IN_PROGRESS');
    if (activeInstall) {
      dynamicTasks.push({
        id: `task-inst-${activeInstall.id}`,
        title: `On-Roof Commissioning & Customer Signoff`,
        category: 'COMMISSIONING',
        priority: 'HIGH',
        customerName: activeInstall.customerName,
        systemSize: `${activeInstall.capacityKW} kW ${activeInstall.systemType}`,
        dueDate: 'Today, 5:30 PM',
        assignedTo: activeInstall.leadTechnicianName,
        statusText: 'Under Assembly & Testing',
      });
    }

    // Fallback tasks if database is small
    if (dynamicTasks.length === 0) {
      dynamicTasks.push(...MOCK_DASHBOARD_DATA.pendingTasks.slice(0, 4));
    }

    // 3. Derive Dynamic Recent Activities from actual database state
    const now = Date.now();
    const dynamicActivities: RecentActivity[] = [
      {
        id: 'act-01',
        timestamp: new Date(now - 2 * 60 * 1000).toISOString(),
        type: 'INSTALLATION',
        title: `Installation Progress Updated`,
        description: `${installationJobs[0]?.customerName || 'Customer'} rooftop mounting verified on-site.`,
        user: installationJobs[0]?.leadTechnicianName || 'Manoj Kumar',
        badgeType: 'emerald',
      },
      {
        id: 'act-02',
        timestamp: new Date(now - 15 * 60 * 1000).toISOString(),
        type: 'ENQUIRY',
        title: `New Solar Inquiry Registered`,
        description: `${customers[0]?.name || 'Rajesh Malhotra'} requested ${customers[0]?.requiredCapacityKW || 5} kW system proposal.`,
        user: customers[0]?.assignedTo || 'Vikram Mehta',
        badgeType: 'sky',
      },
      {
        id: 'act-03',
        timestamp: new Date(now - 60 * 60 * 1000).toISOString(),
        type: 'DISPATCH',
        title: `Serial Numbers Scanned for Dispatch`,
        description: `Kit prepared for ${dispatchOrders[0]?.customerName || 'Sunita Sharma'} (${dispatchOrders[0]?.dispatchNumber || 'DSP-01'}).`,
        user: 'Suresh Patel (Warehouse)',
        badgeType: 'purple',
      },
      {
        id: 'act-04',
        timestamp: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
        type: 'SERVICE',
        title: `Service Complaint Ticket Logged`,
        description: `Ticket ${serviceTickets[0]?.ticketNumber || 'TKT-01'} logged for ${serviceTickets[0]?.customerName || 'Amitabh Sen'}.`,
        user: 'Pooja Nair (Support)',
        badgeType: 'rose',
      },
    ];

    const compositeData: DashboardData = {
      kpis: liveKPIs,
      monthlyTrends: MOCK_DASHBOARD_DATA.monthlyTrends,
      technicians: MOCK_DASHBOARD_DATA.technicians,
      recentActivities: dynamicActivities,
      pendingTasks: dynamicTasks,
      lastUpdated: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    return simulateMockApiCall(compositeData, 250);
  },
};
