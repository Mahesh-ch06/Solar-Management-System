export interface DashboardKPIs {
  totalEnquiries: {
    value: number;
    trend: number; // percentage change
    newThisWeek: number;
  };
  pendingQuotations: {
    value: number;
    totalAmount: number;
    urgentCount: number;
  };
  confirmedOrders: {
    value: number;
    totalCapacityKW: number;
    avgOrderValue: number;
  };
  activeInstallations: {
    value: number;
    inProgress: number;
    scheduledThisWeek: number;
  };
  completedInstallations: {
    value: number;
    monthlyTarget: number;
    onTimeRate: number; // percentage
  };
  availableInventory: {
    solarPanelsCount: number;
    invertersCount: number;
    batteriesCount: number;
    lowStockAlerts: number;
  };
  openServiceTickets: {
    value: number;
    criticalCount: number;
    avgResolutionHours: number;
  };
  financials: {
    monthlyRevenue: number;
    monthlyExpenses: number;
    estimatedProfit: number;
    profitMargin: number; // percentage
  };
}

export interface MonthlyTrendData {
  month: string;
  planned: number;
  completed: number;
  capacityKW: number;
  revenueLakhs: number;
  expensesLakhs: number;
}

export interface TechnicianStatus {
  id: string;
  name: string;
  phone: string;
  status: 'ON_FIELD' | 'AT_WAREHOUSE' | 'AVAILABLE' | 'ON_LEAVE';
  currentProject?: {
    id: string;
    customerName: string;
    location: string;
    capacityKW: number;
    stage: 'SURVEY' | 'INSTALLATION' | 'SERVICE';
  };
  completedTodayCount: number;
}

export interface RecentActivity {
  id: string;
  timestamp: string;
  type: 'ENQUIRY' | 'SURVEY' | 'QUOTATION' | 'ORDER' | 'DISPATCH' | 'INSTALLATION' | 'SERVICE' | 'PAYMENT';
  title: string;
  description: string;
  user: string;
  badgeType: 'emerald' | 'amber' | 'sky' | 'rose' | 'purple';
}

export interface PendingTask {
  id: string;
  title: string;
  category: 'SURVEY' | 'QUOTATION' | 'DISPATCH' | 'COMMISSIONING' | 'SERVICE';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  customerName: string;
  systemSize: string;
  dueDate: string;
  assignedTo: string;
  statusText: string;
}

export interface DashboardData {
  kpis: DashboardKPIs;
  monthlyTrends: MonthlyTrendData[];
  technicians: TechnicianStatus[];
  recentActivities: RecentActivity[];
  pendingTasks: PendingTask[];
  lastUpdated: string;
}
