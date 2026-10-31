import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, AlertCircle, Sparkles, Hash } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { DispatchOrder, WarrantyRecord } from '../../../types/operations';
import { isSerialNumberTaken, addWarrantyRecord, inventoryItems, customers } from '../../../store/inMemoryDb';
import { dispatchService } from '../services/dispatchService';
import { useToast } from '../../../context/ToastContext';

interface SerialEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  dispatchOrder: DispatchOrder | null;
  onSuccess: () => void;
}

interface ItemSerialState {
  inventoryItemId: string;
  itemName: string;
  quantity: number;
  warrantyYears: number;
  serials: string[];
}

export const SerialEntryModal: React.FC<SerialEntryModalProps> = ({
  isOpen,
  onClose,
  dispatchOrder,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [itemsState, setItemsState] = useState<ItemSerialState[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or reset form when modal opens or dispatchOrder changes
  useEffect(() => {
    if (dispatchOrder) {
      const initial: ItemSerialState[] = dispatchOrder.items.map((item) => {
        const existingSerials = item.serialNumbers || [];
        const serials = Array.from({ length: item.quantity }, (_, i) => existingSerials[i] || '');
        return {
          inventoryItemId: item.inventoryItemId,
          itemName: item.itemName,
          quantity: item.quantity,
          warrantyYears: item.warrantyYears,
          serials,
        };
      });
      setItemsState(initial);
    } else {
      setItemsState([]);
    }
  }, [dispatchOrder, isOpen]);

  const handleSerialChange = (itemIdx: number, serialIdx: number, value: string) => {
    setItemsState((prev) => {
      const copy = [...prev];
      const targetItem = { ...copy[itemIdx] };
      const targetSerials = [...targetItem.serials];
      targetSerials[serialIdx] = value.trim();
      targetItem.serials = targetSerials;
      copy[itemIdx] = targetItem;
      return copy;
    });
  };

  // Quick auto-populate for demo/testing convenience
  const handleAutoGenerate = () => {
    if (!dispatchOrder) return;
    const nowSuffix = Math.floor(1000 + Math.random() * 9000);
    setItemsState((prev) =>
      prev.map((item, itemIdx) => {
        const prefix = item.itemName.toLowerCase().includes('inverter') ? 'INV' : 'PAN';
        const newSerials = item.serials.map((_, sIdx) => {
          return `SN-${prefix}-${nowSuffix}-${itemIdx + 1}${sIdx + 1}`;
        });
        return {
          ...item,
          serials: newSerials,
        };
      })
    );
    showToast('Demo Serials Generated', 'Populated unique serial numbers for testing.', 'info', 2000);
  };

  // Validation evaluation across all fields
  const validationMap = useMemo(() => {
    // Collect all entered serials to check intra-form duplicates
    const allEntered = itemsState.flatMap((item, itemIdx) =>
      item.serials.map((s, sIdx) => ({
        key: `${itemIdx}-${sIdx}`,
        serial: s.trim().toLowerCase(),
      }))
    );

    const map: Record<string, { isValid: boolean; error?: string }> = {};

    itemsState.forEach((item, itemIdx) => {
      item.serials.forEach((val, sIdx) => {
        const key = `${itemIdx}-${sIdx}`;
        const trimmed = val.trim();

        if (!trimmed) {
          map[key] = { isValid: false };
          return;
        }

        // Check if duplicate within this form
        const duplicateInForm =
          allEntered.filter((e) => e.serial === trimmed.toLowerCase()).length > 1;

        if (duplicateInForm) {
          map[key] = {
            isValid: false,
            error: 'Duplicate: Serial number entered twice in this form',
          };
          return;
        }

        // Check if taken in database (excluding the ones already belonging to this exact dispatch order)
        const alreadyInThisDispatch = dispatchOrder?.items.some((it) =>
          it.serialNumbers?.some((s) => s.trim().toLowerCase() === trimmed.toLowerCase())
        );

        if (!alreadyInThisDispatch && isSerialNumberTaken(trimmed)) {
          map[key] = {
            isValid: false,
            error: 'Serial number already registered in database',
          };
          return;
        }

        map[key] = { isValid: true };
      });
    });

    return map;
  }, [itemsState, dispatchOrder]);

  // Overall form validity
  const isFormValid = useMemo(() => {
    if (itemsState.length === 0) return false;
    for (let itemIdx = 0; itemIdx < itemsState.length; itemIdx++) {
      const item = itemsState[itemIdx];
      for (let sIdx = 0; sIdx < item.serials.length; sIdx++) {
        const key = `${itemIdx}-${sIdx}`;
        const status = validationMap[key];
        if (!status || !status.isValid) {
          return false;
        }
      }
    }
    return true;
  }, [itemsState, validationMap]);

  const handleSubmit = async () => {
    if (!dispatchOrder || !isFormValid) return;

    try {
      setIsSubmitting(true);

      const itemsWithSerials = itemsState.map((item) => ({
        inventoryItemId: item.inventoryItemId,
        serialNumbers: item.serials.map((s) => s.trim().toUpperCase()),
      }));

      // 1. Update dispatch order status to READY with serials
      await dispatchService.updateDispatchSerials(dispatchOrder.id, itemsWithSerials);

      // 2. Pre-create warranty records for these serials
      const nowIso = new Date().toISOString();
      const customer = customers.find((c) => c.id === dispatchOrder.customerId);

      itemsState.forEach((item) => {
        const invItem = inventoryItems.find((inv) => inv.id === item.inventoryItemId);
        const warrantyYears = item.warrantyYears || 5;
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + warrantyYears);

        item.serials.forEach((serial) => {
          const clean = serial.trim().toUpperCase();
          const newRecord: WarrantyRecord = {
            id: `war-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            serialNumber: clean,
            inventoryItemId: item.inventoryItemId,
            itemName: item.itemName,
            itemCategory: invItem?.category || 'SOLAR_PANEL',
            brand: invItem?.brand || 'SunPower Solar',
            model: invItem?.model || item.itemName,
            customerId: dispatchOrder.customerId,
            customerName: dispatchOrder.customerName,
            customerPhone: customer?.phone || '9876543210',
            dispatchOrderId: dispatchOrder.id,
            dispatchDate: nowIso,
            warrantyYears,
            warrantyExpiryDate: expiryDate.toISOString(),
            status: 'ACTIVE',
            installationDate: nowIso,
          };
          addWarrantyRecord(newRecord);
        });
      });

      showToast(
        'Serials Assigned Successfully',
        `${dispatchOrder.dispatchNumber} marked READY for transport. Warranty records registered.`,
        'success'
      );
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save serial numbers';
      showToast('Error Saving Serials', msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!dispatchOrder) return null;

  const totalRequired = itemsState.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalValid = Object.values(validationMap).filter((v) => v.isValid).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Enter Serial Numbers — ${dispatchOrder.dispatchNumber}`}
      description={`Customer: ${dispatchOrder.customerName} • Destination: ${dispatchOrder.customerAddress}`}
      size="xl"
      footer={
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge
              variant={isFormValid ? 'emerald' : 'amber'}
              size="md"
              dot
            >
              {totalValid} of {totalRequired} Serials Validated
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAutoGenerate}
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-solar-600" />}
            >
              Auto-fill Test Serials
            </Button>
          </div>

          <div className="flex items-center gap-2.5">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting}
              isLoading={isSubmitting}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Save & Mark Ready
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 flex items-start gap-3">
          <Hash className="w-4 h-4 text-solar-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-slate-800">
              Individual Component Serial Registration
            </p>
            <p className="mt-0.5 text-slate-500">
              Each physical unit must have an authentic manufacturer serial number recorded before warehouse gate-out.
              Real-time validation prevents duplicates across all dispatches and warranty registries.
            </p>
          </div>
        </div>

        {itemsState.map((item, itemIdx) => (
          <div
            key={item.inventoryItemId}
            className="border border-slate-200 rounded-xl p-4.5 bg-white shadow-xs space-y-3.5"
          >
            {/* Item header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
              <div>
                <h4 className="text-sm font-bold text-slate-900">{item.itemName}</h4>
                <p className="text-xs text-slate-500">
                  {item.warrantyYears} Years Manufacturer Warranty
                </p>
              </div>
              <Badge variant="sky" size="sm">
                Quantity: {item.quantity} Units Required
              </Badge>
            </div>

            {/* Serial input grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
              {item.serials.map((val, sIdx) => {
                const key = `${itemIdx}-${sIdx}`;
                const validation = validationMap[key];
                const hasText = val.length > 0;
                const isError = hasText && validation && !validation.isValid;
                const isSuccess = hasText && validation && validation.isValid;

                return (
                  <div key={sIdx} className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                      <span>Unit #{sIdx + 1} Serial Number</span>
                      {isSuccess && (
                        <span className="text-emerald-600 flex items-center gap-1 font-medium text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Valid & Unique
                        </span>
                      )}
                    </label>

                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={val}
                        onChange={(e) =>
                          handleSerialChange(itemIdx, sIdx, e.target.value.toUpperCase())
                        }
                        placeholder={`e.g. SN-${item.itemName.slice(0, 3).toUpperCase()}-990${sIdx + 1}`}
                        className={`w-full font-mono uppercase bg-white text-slate-900 placeholder:text-slate-400 text-xs rounded-lg border py-2 px-3 pr-9 transition-all duration-150 focus:outline-none focus:ring-2 ${
                          isError
                            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20 text-rose-900 bg-rose-50/20'
                            : isSuccess
                            ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/20'
                            : 'border-slate-300 focus:border-solar-600 focus:ring-solar-500/20'
                        }`}
                      />

                      <div className="absolute right-2.5 pointer-events-none flex items-center">
                        {isError && <AlertCircle className="w-4 h-4 text-rose-500" />}
                        {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      </div>
                    </div>

                    {isError && validation?.error && (
                      <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {validation.error}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};
