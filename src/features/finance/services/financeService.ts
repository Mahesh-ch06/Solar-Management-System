import { ApiResponse } from '../../../types/common';
import { MonthlyTrendData } from '../../../types/dashboard';
import { orders, customers } from '../../../store/inMemoryDb';
import { wrapResponse } from '../../../services/apiResponse';
import { apiClient, USE_MOCK_DATA } from '../../../api/apiClient';

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
   * Retrieves aggregated financial data derived directly from confirmed orders
   */
  async getFinanceOverview(): Promise<ApiResponse<FinanceOverviewData>> {
    if (!USE_MOCK_DATA) {
      try {
        await apiClient.get('/dashboard/finance-summary');
      } catch (err) {
        console.warn('[financeService] API finance-summary failed, using local calculation:', err);
      }
    }

    const totalOrderRevenue = orders.reduce((acc, o) => acc + o.totalAmount, 0);
    const monthlyRevenue = totalOrderRevenue;

    // Calculate Job-wise P&L from store orders
    let totalHardwareCost = 0;
    let totalLabourCost = 0;

    const jobWisePnL: JobProfitability[] = orders.map((order) => {
      const partsCost = Math.round(order.capacityKW * 31500 + (order.systemType === 'OFF_GRID' ? 95000 : 0));
      const labourCost = Math.round(order.capacityKW * 4500 + 2000);
      const grossProfit = order.totalAmount - partsCost - labourCost;
      const marginPercent = order.totalAmount > 0 ? Number(((grossProfit / order.totalAmount) * 100).toFixed(1)) : 0;

      totalHardwareCost += partsCost;
      totalLabourCost += labourCost;

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

    const overheadAndAdmin = Math.round(monthlyRevenue * 0.08);
    const monthlyExpenses = totalHardwareCost + totalLabourCost + overheadAndAdmin;
    const netProfit = monthlyRevenue - monthlyExpenses;
    const profitMarginPercent = monthlyRevenue > 0 ? Number(((netProfit / monthlyRevenue) * 100).toFixed(1)) : 0;

    // Calculate Outstanding Payments
    const now = Date.now();
    const outstandingPayments: OutstandingPayment[] = orders
      .filter((o) => o.balanceAmount > 0)
      .map((order) => {
        const cust = customers.find((c) => c.id === order.customerId);
        const orderDate = new Date(order.createdAt).getTime();
        const daysPending = Math.max(1, Math.floor((now - orderDate) / (1000 * 60 * 60 * 24)));
        const isOverdue = daysPending > 21;
        const paidPercentage = order.totalAmount > 0 ? Math.round((order.advancePaid / order.totalAmount) * 100) : 0;

        return {
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerId: order.customerId,
          customerName: order.customerName,
          customerPhone: cust?.phone || '—',
          totalAmount: order.totalAmount,
          advancePaid: order.advancePaid,
          balanceDue: order.balanceAmount,
          paidPercentage,
          isOverdue,
          daysPending,
        };
      });

    const monthlyTrends: MonthlyTrendData[] = [
      { month: 'May', planned: 0, completed: 0, capacityKW: 0, revenueLakhs: 0, expensesLakhs: 0 },
      { month: 'Jun', planned: 0, completed: 0, capacityKW: 0, revenueLakhs: 0, expensesLakhs: 0 },
      { month: 'Jul', planned: 0, completed: 0, capacityKW: 0, revenueLakhs: 0, expensesLakhs: 0 },
      { month: 'Aug', planned: 0, completed: 0, capacityKW: 0, revenueLakhs: 0, expensesLakhs: 0 },
      { month: 'Sep', planned: 0, completed: 0, capacityKW: 0, revenueLakhs: 0, expensesLakhs: 0 },
      {
        month: 'Oct',
        planned: 0,
        completed: orders.length,
        capacityKW: orders.reduce((acc, o) => acc + o.capacityKW, 0),
        revenueLakhs: Number((monthlyRevenue / 100000).toFixed(2)),
        expensesLakhs: Number((monthlyExpenses / 100000).toFixed(2)),
      },
    ];

    const data: FinanceOverviewData = {
      monthlyRevenue,
      monthlyExpenses,
      netProfit,
      profitMarginPercent,
      monthlyTrends,
      jobWisePnL,
      outstandingPayments,
      expenseBreakdown: {
        inventoryPurchases: totalHardwareCost,
        labourCosts: totalLabourCost,
        overheadAndAdmin,
        totalExpenses: monthlyExpenses,
      },
    };

    return wrapResponse<FinanceOverviewData>(data);
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
    return wrapResponse<boolean>(true, 'Payment recorded successfully');
  },
};
