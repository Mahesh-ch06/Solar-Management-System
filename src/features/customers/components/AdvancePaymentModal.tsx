import React, { useState, useEffect } from 'react';
import { Customer } from '../../../types/customer';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useToast } from '../../../context/ToastContext';
import { emailService } from '../../../services/emailService';
import { IndianRupee, Mail, CheckCircle2 } from 'lucide-react';

interface AdvancePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onSuccess?: () => void;
}

export const AdvancePaymentModal: React.FC<AdvancePaymentModalProps> = ({
  isOpen,
  onClose,
  customer,
  onSuccess,
}) => {
  const { showToast } = useToast();

  const [advanceAmount, setAdvanceAmount] = useState<number>(30000);
  const [paymentMethod, setPaymentMethod] = useState('UPI / Net Banking (DISCOM Verified)');
  const [transactionId, setTransactionId] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (customer) {
      const kw = customer.requiredCapacityKW || 3;
      // Default advance: ~₹20,000 per kW or ₹30,000–₹50,000
      const calculatedAdvance = kw <= 2 ? 25000 : kw <= 3 ? 35000 : kw * 15000;
      setAdvanceAmount(calculatedAdvance);

      const targetEmail =
        customer.email?.trim() ||
        (customer.phone === '7013295712'
          ? 'maheshch1094@gmail.com'
          : `${customer.phone.replace(/\D/g, '')}@customer.sunpower.in`);
      setRecipientEmail(targetEmail);

      const randomTxn = `TXN${Date.now().toString().slice(-8)}`;
      setTransactionId(randomTxn);
    }
  }, [customer]);

  if (!customer) return null;

  const totalCost = (customer.requiredCapacityKW || 3) * 75000;
  const bookingRef = `ADV-${customer.id.replace(/\D/g, '').slice(-4) || '2026'}`;
  const receiptNumber = `RCP-2026-${customer.id.replace(/\D/g, '').slice(-4) || '1021'}`;

  const handleSendAdvanceReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail.trim()) {
      showToast('Validation Error', 'Recipient email address is required', 'error');
      return;
    }

    try {
      setIsSending(true);
      const res = await emailService.notifyAdvancePaymentReceived({
        toEmail: recipientEmail.trim(),
        customerName: customer.name,
        advanceAmount: Number(advanceAmount),
        totalProjectCost: totalCost,
        bookingReference: bookingRef,
        paymentMethod: paymentMethod.trim(),
        transactionId: transactionId.trim() || `TXN${Date.now().toString().slice(-8)}`,
        receiptNumber: receiptNumber,
        capacityKW: customer.requiredCapacityKW || 3,
      });

      if (res.isSimulatedFallback) {
        showToast(
          'Receipt Queued (Simulated)',
          `Advance receipt for ₹${advanceAmount.toLocaleString('en-IN')} queued for ${recipientEmail}.`,
          'info'
        );
      } else {
        showToast(
          'Advance Receipt Dispatched',
          `Advance payment receipt of ₹${advanceAmount.toLocaleString('en-IN')} sent to ${recipientEmail} via EmailJS.`,
          'success'
        );
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send advance payment receipt';
      showToast('Dispatch Error', msg, 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Send Advance Payment Receipt (EmailJS)"
      description="Issue official booking receipt for customer project confirmation & DISCOM portal filing."
      size="md"
    >
      <form onSubmit={handleSendAdvanceReceipt} className="space-y-4 text-slate-900">
        {/* Customer Badge Row */}
        <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
          <div>
            <p className="font-bold text-slate-900">{customer.name}</p>
            <p className="text-slate-500 font-mono text-[11px]">{customer.phone} • {customer.city}</p>
          </div>
          <div className="text-right">
            <span className="font-bold text-amber-700 bg-amber-100/80 px-2.5 py-0.5 rounded-full">
              {customer.requiredCapacityKW || 3} kW Rooftop Solar
            </span>
            <p className="text-[10px] text-slate-500 mt-0.5">Est. Project: ₹{totalCost.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Advance Amount */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Advance Amount Received (₹) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
            <Input
              type="number"
              min={1000}
              step={500}
              value={advanceAmount}
              onChange={(e) => setAdvanceAmount(Number(e.target.value))}
              required
              className="pl-8 text-sm font-semibold font-mono"
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Standard booking deposit: 15% - 25% of total project cost.
          </p>
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Payment Mode & Gateway
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="UPI / Net Banking (DISCOM Verified)">UPI / Net Banking (DISCOM Verified)</option>
            <option value="NEFT / RTGS Bank Transfer">NEFT / RTGS Bank Transfer</option>
            <option value="Direct DISCOM DBT Account Transfer">Direct DISCOM DBT Account Transfer</option>
            <option value="Cheque / DD">Cheque / Demand Draft</option>
          </select>
        </div>

        {/* Transaction ID & Receipt Number */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Transaction UTR / Ref</label>
            <Input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="e.g. UPI-20261031-987"
              className="font-mono text-xs"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Receipt Number</label>
            <input
              type="text"
              readOnly
              value={receiptNumber}
              className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-600 select-all"
            />
          </div>
        </div>

        {/* Recipient Email Address */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Recipient Customer Email (EmailJS) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Mail className="w-4 h-4" />
            </span>
            <Input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="customer@email.com"
              required
              className="pl-9 text-xs"
            />
          </div>
          <p className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Configured with Master Universal EmailJS template ({bookingRef})
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSending}
            className="border-slate-300 text-slate-700"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSending}
            leftIcon={<IndianRupee className="w-3.5 h-3.5" />}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
          >
            Dispatch Advance Receipt (EmailJS)
          </Button>
        </div>
      </form>
    </Modal>
  );
};
