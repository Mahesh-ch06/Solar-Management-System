import {
  quotations,
  customers,
  surveys,
  orders,
  addQuotation as dbAddQuotation,
  updateQuotation as dbUpdateQuotation,
  addOrder as dbAddOrder,
  updateCustomer as dbUpdateCustomer,
} from '../../../store/inMemoryDb';
import { Quotation, QuotationStatus, Order } from '../../../types/quotation';
import { QuotationFormData } from '../../../utils/validators';
import { calculateBOM, calculateQuotationTotals } from '../../../utils/bomCalculator';
import { apiClient, USE_MOCK_DATA } from '../../../api/apiClient';

const delay = (ms: number = 150) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getQuotations(): Promise<Quotation[]> {
  if (!USE_MOCK_DATA) {
    try {
      const res = await apiClient.get<{ success: boolean; data: Quotation[] }>('/quotations');
      if (res.data?.success && Array.isArray(res.data.data)) {
        return res.data.data;
      }
    } catch (err) {
      console.warn('[quotationService] API getQuotations failed, falling back to local store:', err);
    }
  }
  await delay(150);
  return [...quotations];
}

export async function getQuotationById(id: string): Promise<Quotation | null> {
  if (!USE_MOCK_DATA) {
    try {
      const res = await apiClient.get<{ success: boolean; data: Quotation }>(`/quotations/${id}`);
      if (res.data?.success && res.data.data) {
        return res.data.data;
      }
    } catch (err) {
      console.warn('[quotationService] API getQuotationById failed, falling back to local store:', err);
    }
  }
  await delay(100);
  const quote = quotations.find((q) => q.id === id);
  return quote ? { ...quote } : null;
}

export async function addQuotation(data: QuotationFormData): Promise<Quotation> {
  if (!USE_MOCK_DATA) {
    try {
      const res = await apiClient.post<{ success: boolean; data: Quotation }>('/quotations', data);
      if (res.data?.success && res.data.data) {
        return res.data.data;
      }
    } catch (err) {
      console.warn('[quotationService] API addQuotation failed, falling back to local store:', err);
    }
  }

  await delay(200);
  const customer = customers.find((c) => c.id === data.customerId);
  const bomItems = calculateBOM(data.capacityKW, data.systemType);
  const gstPercent = data.gstPercent ?? 12;
  const { subtotal, gstAmount, totalAmount } = calculateQuotationTotals(
    bomItems,
    gstPercent,
    Number(data.subsidyAmount) || 0,
    Number(data.discountAmount) || 0
  );

  const advancePaid = Number(data.advancePaid) || 0;
  const balanceAmount = totalAmount - advancePaid;

  const quoteNumberSuffix = String(quotations.length + 85).padStart(4, '0');
  const newQuotation: Quotation = {
    id: `quot-${Date.now()}`,
    quotationNumber: `QT-2026-${quoteNumberSuffix}`,
    customerId: data.customerId,
    customerName: customer ? customer.name : 'Unknown Customer',
    surveyId: data.surveyId,
    capacityKW: Number(data.capacityKW),
    systemType: data.systemType,
    bomItems,
    subtotal,
    gstPercent,
    gstAmount,
    subsidyAmount: Number(data.subsidyAmount) || 0,
    discountAmount: Number(data.discountAmount) || 0,
    totalAmount,
    advancePaid,
    balanceAmount,
    status: 'DRAFT',
    validUntil: data.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    termsAndConditions: data.termsAndConditions || 'Standard 5-year solar warranty on workmanship and 25-year panel performance guarantee.',
    notes: data.notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  dbAddQuotation(newQuotation);
  return newQuotation;
}

export async function updateQuotationStatus(id: string, status: QuotationStatus): Promise<Quotation | null> {
  if (!USE_MOCK_DATA && status === 'ACCEPTED') {
    try {
      await apiClient.post(`/quotations/${id}/confirm-order`, {});
    } catch (err) {
      console.warn('[quotationService] API confirmOrder failed, falling back to local store:', err);
    }
  }

  await delay(150);
  const updated = dbUpdateQuotation(id, { status });
  return updated || null;
}

export async function createOrderFromQuotation(quotationId: string, advancePaid: number = 0): Promise<Order | null> {
  if (!USE_MOCK_DATA) {
    try {
      const res = await apiClient.post<{ success: boolean; order: Order }>(`/quotations/${quotationId}/confirm-order`, {
        advanceReceived: advancePaid,
      });
      if (res.data?.success && res.data.order) {
        return res.data.order;
      }
    } catch (err) {
      console.warn('[quotationService] API createOrderFromQuotation failed, falling back to local store:', err);
    }
  }

  await delay(200);
  const quote = quotations.find((q) => q.id === quotationId);
  if (!quote) return null;

  const count = orders.length + 1;
  const newOrder: Order = {
    id: `ord-${Date.now()}`,
    orderNumber: `ORD-2026-${String(count).padStart(3, '0')}`,
    quotationId: quote.id,
    customerId: quote.customerId,
    customerName: quote.customerName,
    capacityKW: quote.capacityKW,
    totalAmount: quote.totalAmount,
    advanceReceived: advancePaid,
    balanceDue: quote.totalAmount - advancePaid,
    paymentStatus: advancePaid >= quote.totalAmount ? 'PAID' : advancePaid > 0 ? 'PARTIALLY_PAID' : 'UNPAID',
    stage: 'ORDER_CONFIRMED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  dbAddOrder(newOrder);
  dbUpdateQuotation(quotationId, { status: 'ACCEPTED' });
  dbUpdateCustomer(quote.customerId, { status: 'CONVERTED' });

  return newOrder;
}

export async function getOrders(): Promise<Order[]> {
  if (!USE_MOCK_DATA) {
    try {
      const res = await apiClient.get<{ success: boolean; data: Order[] }>('/quotations/orders/list');
      if (res.data?.success && Array.isArray(res.data.data)) {
        return res.data.data;
      }
    } catch (err) {
      console.warn('[quotationService] API getOrders failed, falling back to local store:', err);
    }
  }
  await delay(150);
  return [...orders];
}

export async function getOrderById(id: string): Promise<Order | null> {
  if (!USE_MOCK_DATA) {
    try {
      const res = await apiClient.get<{ success: boolean; data: Order }>(`/quotations/orders/${id}`);
      if (res.data?.success && res.data.data) {
        return res.data.data;
      }
    } catch (err) {
      console.warn('[quotationService] API getOrderById failed, falling back to local store:', err);
    }
  }
  await delay(100);
  const order = orders.find((o) => o.id === id);
  return order ? { ...order } : null;
}
