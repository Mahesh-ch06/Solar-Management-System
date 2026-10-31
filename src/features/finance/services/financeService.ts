import { ApiResponse } from '../../../types/common';
import { MonthlyTrendData } from '../../../types/dashboard';
import { orders, customers } from '../../../store/inMemoryDb';
import { MOCK_DASHBOARD_DATA } from '../../../mocks/data/mockDashboard';
import { simulateMockApiCall } from '../../../mocks/mockService';

export interface JobProfitability {
  orderId: string;
  orderNumber: string;
  customerName: string;
  capacityKW: number;
  systemType: 'ON_GRID' | 'OFF_GRID';
  revenue: number;
  partsCost: number;
  labourCost: number;
  grossProfit: number;
  marginPercent: number;
}

export interface OutstandingPayment {
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  advancePaid: number;
  balanceDue: number;
  paidPercentage: number;
  isOverdue: boolean;
  daysPending: number;
}

export interface ExpenseBreakdown {
  inventoryPurchases: number;
  labourCosts: number;
  overheadAndAdmin: number;
  totalExpenses: number;
}

export interface FinanceOverviewData {
  monthlyRevenue: number;
  monthlyExpenses: number;
  netProfit: number;
  profitMarginPercent: number;
  monthlyTrends: MonthlyTrendData[];
  jobWisePnL: JobProfitability[];
  outstandingPayments: OutstandingPayment[];
  expenseBreakdown: ExpenseBreakdown;
}

export const financeService = {
  /**
   * Retrieves aggregated director's financial data
   */
  async getFinanceOverview(): Promise<ApiResponse<FinanceOverviewData>> {
    const monthlyRevenue = 4850000; // ₹48.5 Lakhs
    const monthlyExpenses = 3580000; // ₹35.8 Lakhs
    const netProfit = monthlyRevenue - monthlyExpenses;
    const profitMarginPercent = Number(((netProfit / monthlyRevenue) * 100).toFixed(1));

    // Calculate Job-wise P&L from store orders
    const jobWisePnL: JobProfitability[] = orders.map((order) => {
      // Estimated hardware cost based on capacityKW (~₹31,000 per kW)
      const partsCost = Math.round(order.capacityKW * 31500 + (order.systemType === 'OFF_GRID' ? 95000 : 0));
      // Estimated labour cost (~₹4,500 per kW + ₹2,000 commissioning)
      const labourCost = Math.round(order.capacityKW * 4500 + 2000);
      const grossProfit = order.totalAmount - partsCost - labourCost;
      const marginPercent = Number(((grossProfit / order.totalAmount) * 100).toFixed(1));

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        capacityKW: order.capacityKW,
        systemType: order.systemType,
        revenue: order.totalAmount,
        partsCost,
        labourCost,
        grossProfit,
        marginPercent,
      };
    });

    // Calculate Outstanding Payments
    const now = Date.now();
    const outstandingPayments: OutstandingPayment[] = orders
      .filter((o) => o.balanceAmount > 0)
      .map((order) => {
        const cust = customers.find((c) => c.id === order.customerId);
        const orderDate = new Date(order.createdAt).getTime();
        const daysPending = Math.max(1, Math.floor((now - orderDate) / (1000 * 60 * 60 * 24)));
        const isOverdue = daysPending > 21; // Overdue if past 21 days
        const paidPercentage = Math.round((order.advancePaid / order.totalAmount) * 100);

        return {
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerId: order.customerId,
          customerName: order.customerName,
          customerPhone: cust?.phone || '9876543210',
          totalAmount: order.totalAmount,
          advancePaid: order.advancePaid,
          balanceDue: order.balanceAmount,
          paidPercentage,
          isOverdue,
          daysPending,
        };
      });

    // Expenses breakdown
    const inventoryPurchases = Math.round(monthlyExpenses * 0.68); // ~68%
    const labourCosts = Math.round(monthlyExpenses * 0.18); // ~18%
    const overheadAndAdmin = monthlyExpenses - inventoryPurchases - labourCosts; // ~14%

    const data: FinanceOverviewData = {
      monthlyRevenue,
      monthlyExpenses,
      netProfit,
      profitMarginPercent,
      monthlyTrends: MOCK_DASHBOARD_DATA.monthlyTrends,
      jobWisePnL,
      outstandingPayments,
      expenseBreakdown: {
        inventoryPurchases,
        labourCosts,
        overheadAndAdmin,
        totalExpenses: monthlyExpenses,
      },
    };

    return simulateMockApiCall<FinanceOverviewData>(data, 350);
  },

  /**
   * Records a customer balance payment
   */
  async recordPayment(orderId: string, amount: number): Promise<ApiResponse<boolean>> {
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      order.advancePaid += amount;
      order.balanceAmount = Math.max(0, order.totalAmount - order.advancePaid);
      order.updatedAt = new Date().toISOString();
    }
    return simulateMockApiCall<boolean>(true, 350);
  },
};
