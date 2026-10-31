import React from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Quotation, QuotationStatus } from '../../../types/quotation';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { Printer, Sun, Mail, Phone, MapPin, CheckCircle2 } from 'lucide-react';

export interface QuotationDetailModalProps {
  quotation: Quotation | null;
  isOpen: boolean;
  onClose: () => void;
  onConvertToOrder?: (quotationId: string) => void;
}

const statusBadgeConfig: Record<
  QuotationStatus,
  { variant: 'slate' | 'sky' | 'emerald' | 'rose' | 'purple'; label: string }
> = {
  DRAFT: { variant: 'slate', label: 'Draft' },
  SENT: { variant: 'sky', label: 'Sent to Customer' },
  APPROVED: { variant: 'emerald', label: 'Customer Approved' },
  REJECTED: { variant: 'rose', label: 'Rejected' },
  CONVERTED_TO_ORDER: { variant: 'purple', label: 'Converted to Order' },
  EXPIRED: { variant: 'rose', label: 'Expired' },
};

export const QuotationDetailModal: React.FC<QuotationDetailModalProps> = ({
  quotation,
  isOpen,
  onClose,
  onConvertToOrder,
}) => {
  if (!quotation) return null;

  const statusConfig = statusBadgeConfig[quotation.status] || {
    variant: 'slate',
    label: quotation.status,
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Quotation ${quotation.quotationNumber}`}
      description="Official Solar Installation Estimate & Bill of Materials"
      size="xl"
      footer={
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Issue Date: {formatDate(quotation.createdAt)}</span>
            <span>•</span>
            <span>Valid Until: {formatDate(quotation.validUntil)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Printer className="w-4 h-4 text-slate-600" />}
              onClick={handlePrint}
            >
              Print / Save PDF
            </Button>
            {quotation.status === 'APPROVED' && onConvertToOrder && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onConvertToOrder(quotation.id)}
              >
                Convert to Order
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6 printable-quotation">
        {/* Printable Header & Brand Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-solar-800 text-amber-400 flex items-center justify-center shadow-md shrink-0">
              <Sun className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  SunPower Solutions
                </h1>
                <Badge variant={statusConfig.variant} dot>
                  {statusConfig.label}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                MNRE Empanelled Channel Partner • Rooftop Solar EPC Specialist
              </p>
              <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" /> +91 (079) 4900-8800
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3" /> quotes@sunpowersolutions.in
                </span>
              </div>
            </div>
          </div>

          <div className="text-right sm:self-auto self-start">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Quotation Ref
            </div>
            <div className="text-lg font-bold font-mono text-solar-900">
              {quotation.quotationNumber}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Validity:{' '}
              <span className="font-semibold text-slate-700">
                {formatDate(quotation.validUntil)}
              </span>
            </div>
          </div>
        </div>

        {/* Customer & System Specification Block */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Customer Details
            </div>
            <h4 className="text-sm font-bold text-slate-900">{quotation.customerName}</h4>
            <div className="text-xs text-slate-600 mt-1 space-y-0.5">
              <div className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>Customer ID: {quotation.customerId}</span>
              </div>
              {quotation.surveyId && (
                <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verified Site Survey: {quotation.surveyId}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Solar System Configuration
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[11px]">System Capacity</span>
                <span className="font-bold text-slate-800 text-sm">
                  {quotation.capacityKW} kW
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[11px]">System Architecture</span>
                <span className="font-bold text-slate-800 text-sm">
                  {quotation.systemType === 'ON_GRID' ? 'On-Grid Grid-Tied' : 'Off-Grid (Battery)'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bill of Materials (BOM) Table */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Bill of Materials & Component Breakdown ({quotation.bomItems.length} Items)
            </h4>
            <span className="text-xs text-slate-400">Standard Tier-1 MNRE Specifications</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-100/90 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 font-semibold w-8">#</th>
                  <th className="py-2.5 px-3 font-semibold">Item & Technical Description</th>
                  <th className="py-2.5 px-3 font-semibold">Category</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Qty</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Unit</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Unit Rate</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {quotation.bomItems.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 font-medium text-slate-800">
                      {item.name}
                    </td>
                    <td className="py-2 px-3 text-slate-500">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-slate-100 font-medium">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center font-semibold text-slate-700">
                      {item.quantity}
                    </td>
                    <td className="py-2 px-3 text-center text-slate-500">
                      {item.unit}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-600 font-mono">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-2 px-3 text-right font-semibold text-slate-900 font-mono">
                      {formatCurrency(item.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Summary & Payment Milestone Block */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Terms & Notes */}
          <div className="space-y-3">
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 text-xs">
              <span className="font-semibold text-slate-800 block mb-1">
                Notes & Scope of Work
              </span>
              <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                {quotation.notes || 'Standard rooftop turnkey installation including testing & DISCOM net-metering commissioning.'}
              </p>
            </div>

            <div className="bg-amber-50/60 rounded-xl p-3.5 border border-amber-200/60 text-xs">
              <span className="font-semibold text-amber-900 block mb-1">
                PM Surya Ghar Scheme Note
              </span>
              <p className="text-amber-800 leading-relaxed">
                Central government subsidy will be directly credited to the customer bank account post net-meter synchronization and DISCOM verification.
              </p>
            </div>
          </div>

          {/* Pricing Ledger */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-2.5 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>BOM Equipment & Labour Subtotal</span>
              <span className="font-mono font-medium">{formatCurrency(quotation.subtotal)}</span>
            </div>

            <div className="flex justify-between items-center text-slate-600">
              <span>GST ({quotation.gstPercent}%)</span>
              <span className="font-mono font-medium">{formatCurrency(quotation.gstAmount)}</span>
            </div>

            {quotation.subsidyAmount > 0 && (
              <div className="flex justify-between items-center text-emerald-700 font-medium">
                <span>PM Surya Ghar Subsidy Deduction</span>
                <span className="font-mono">- {formatCurrency(quotation.subsidyAmount)}</span>
              </div>
            )}

            {quotation.discountAmount > 0 && (
              <div className="flex justify-between items-center text-emerald-700 font-medium">
                <span>Promotional Discount</span>
                <span className="font-mono">- {formatCurrency(quotation.discountAmount)}</span>
              </div>
            )}

            <div className="border-t border-slate-200 pt-2.5 mt-2 flex justify-between items-center">
              <span className="text-sm font-bold text-slate-900">Total Net Amount</span>
              <span className="text-base font-extrabold font-mono text-solar-900">
                {formatCurrency(quotation.totalAmount)}
              </span>
            </div>

            {/* Payment Ledger */}
            <div className="border-t border-dashed border-slate-200 pt-2.5 space-y-1.5">
              <div className="flex justify-between items-center text-slate-600">
                <span>Advance Paid / Received</span>
                <span className="font-mono font-semibold text-emerald-600">
                  {formatCurrency(quotation.advancePaid)}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-900 font-bold">
                <span>Remaining Balance Due</span>
                <span className="font-mono text-amber-600 text-sm">
                  {formatCurrency(quotation.balanceAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Standard Terms & Signoff Footer */}
        <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-400 flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-600 mb-0.5">Commercial Terms & Warranty:</p>
            <p>1. Solar PV Modules: 25-Year Performance Warranty.</p>
            <p>2. Grid Inverter: 5 to 10 Years Manufacturer Replacement Warranty.</p>
            <p>3. Balance of System & Workmanship: 1 Year Comprehensive Support.</p>
          </div>
          <div className="text-right sm:self-end">
            <p className="font-semibold text-slate-700">For SunPower Solutions Pvt. Ltd.</p>
            <div className="h-10"></div>
            <p className="text-[10px] text-slate-400">Authorized Technical Signatory</p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
