import {
  quotations,
  customers,
  surveys,
  orders,
  addQuotation as dbAddQuotation,
  updateQuotation as dbUpdateQuotation,
} from '../../../store/inMemoryDb';
import { Quotation, QuotationStatus, Order } from '../../../types/quotation';
import { Customer } from '../../../types/customer';
import { Survey } from '../../../types/survey';
import { QuotationFormData } from '../../../utils/validators';
import { calculateBOM, calculateQuotationTotals } from '../../../utils/bomCalculator';

const delay = (ms: number = 350) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getQuotations(): Promise<Quotation[]> {
  await delay(350);
  return [...quotations];
}

export async function getQuotationById(id: string): Promise<Quotation | null> {
  await delay(200);
  const quote = quotations.find((q) => q.id === id);
  return quote ? { ...quote } : null;
}

export async function addQuotation(data: QuotationFormData): Promise<Quotation> {
  await delay(350);
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
    validUntil: data.validUntil,
    notes: data.notes || '',
    termsConditions:
      '1. Validity of this quotation is 30 days from issue.\n2. 25% Advance payment required along with order confirmation.\n3. Delivery within 14 working days post DISCOM feasibility approval.\n4. PM Surya Ghar subsidy subject to central portal verification.',
    createdBy: 'Sales Desk',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  dbAddQuotation(newQuotation);
  return { ...newQuotation };
}

export async function updateQuotationStatus(
  id: string,
  status: QuotationStatus
): Promise<Quotation> {
  await delay(350);
  const updated = dbUpdateQuotation(id, { status });
  if (!updated) {
    throw new Error(`Quotation with id "${id}" not found`);
  }
  return { ...updated };
}

export async function convertToOrder(
  quotationId: string
): Promise<{ quotation: Quotation; order: Order }> {
  await delay(350);
  const quote = quotations.find((q) => q.id === quotationId);
  if (!quote) {
    throw new Error(`Quotation with id "${quotationId}" not found`);
  }

  const updatedQuote = dbUpdateQuotation(quotationId, {
    status: 'CONVERTED_TO_ORDER',
  });

  const orderNumberSuffix = String(orders.length + 45).padStart(4, '0');
  const newOrder: Order = {
    id: `ord-${Date.now()}`,
    orderNumber: `ORD-2026-${orderNumberSuffix}`,
    quotationId: quote.id,
    customerId: quote.customerId,
    customerName: quote.customerName,
    capacityKW: quote.capacityKW,
    systemType: quote.systemType,
    totalAmount: quote.totalAmount,
    advancePaid: quote.advancePaid,
    balanceAmount: quote.balanceAmount,
    status: quote.advancePaid > 0 ? 'ADVANCE_RECEIVED' : 'CONFIRMED',
    assignedTechnicianIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  orders.unshift(newOrder);

  return {
    quotation: { ...updatedQuote! },
    order: { ...newOrder },
  };
}

export async function getCustomers(): Promise<Customer[]> {
  await delay(150);
  return [...customers];
}

export async function getSurveys(): Promise<Survey[]> {
  await delay(150);
  return [...surveys];
}

export const quotationService = {
  getQuotations,
  getQuotationById,
  addQuotation,
  updateQuotationStatus,
  convertToOrder,
  getCustomers,
  getSurveys,
};
