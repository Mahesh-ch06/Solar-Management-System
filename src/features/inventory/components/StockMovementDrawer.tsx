import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer } from '../../../components/ui/Drawer';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import { inventoryService } from '../services/inventoryService';
import { useToast } from '../../../context/ToastContext';
import { formatDate } from '../../../utils/formatters';
import {
  ArrowDownLeft,
  ArrowUpRight,
  SlidersHorizontal,
  History,
} from 'lucide-react';

const movementSchema = z.object({
  inventoryItemId: z.string().min(1, 'Select an inventory item'),
  movementType: z.enum(['INWARD', 'OUTWARD', 'ADJUSTMENT']),
  quantity: z
    .number({ invalid_type_error: 'Enter a valid quantity' })
    .positive('Quantity must be greater than zero'),
  reason: z
    .string()
    .min(3, 'Reason must be at least 3 characters')
    .max(200, 'Reason too long'),
  reference: z
    .string()
    .min(2, 'Enter reference number (e.g. PO, DO, or Dispatch ID)')
    .max(50),
});

type MovementFormData = z.infer<typeof movementSchema>;

export interface StockMovementDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedItemId?: string;
}

export const StockMovementDrawer: React.FC<StockMovementDrawerProps> = ({
  isOpen,
  onClose,
  preselectedItemId,
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: items = [] } = useQuery({
    queryKey: ['inventoryItems'],
    queryFn: inventoryService.getInventoryItems,
    enabled: isOpen,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<MovementFormData>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      inventoryItemId: preselectedItemId || '',
      movementType: 'INWARD',
      quantity: 1,
      reason: '',
      reference: '',
    },
  });

  // Watch fields for live recalculation
  const selectedItemId = watch('inventoryItemId');
  const movementType = watch('movementType');
  const quantity = Number(watch('quantity')) || 0;

  // Selected item object
  const selectedItem = useMemo(
    () => items.find((i) => i.id === selectedItemId),
    [items, selectedItemId]
  );

  // Recent movements for this item
  const { data: recentMovements = [] } = useQuery({
    queryKey: ['stockMovements', selectedItemId],
    queryFn: () => inventoryService.getStockMovements(selectedItemId),
    enabled: isOpen && !!selectedItemId,
  });

  // Keep item selected if passed via prop
  useEffect(() => {
    if (preselectedItemId && isOpen) {
      setValue('inventoryItemId', preselectedItemId);
    }
  }, [preselectedItemId, isOpen, setValue]);

  // Projected stock calculation
  const projectedStock = useMemo(() => {
    if (!selectedItem) return 0;
    if (movementType === 'INWARD') {
      return selectedItem.currentStock + quantity;
    } else if (movementType === 'OUTWARD') {
      return Math.max(0, selectedItem.currentStock - quantity);
    } else {
      // For adjustment, can be an addition or correction
      return selectedItem.currentStock + quantity;
    }
  }, [selectedItem, movementType, quantity]);

  const recordMutation = useMutation({
    mutationFn: (data: MovementFormData) =>
      inventoryService.recordStockMovement({
        inventoryItemId: data.inventoryItemId,
        movementType: data.movementType,
        quantity: data.quantity,
        reason: data.reason,
        reference: data.reference,
        performedBy: 'Store Manager',
      }),
    onSuccess: (mov) => {
      queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
      queryClient.invalidateQueries({ queryKey: ['stockMovements'] });
      showToast(
        'Stock Updated',
        `Successfully logged ${mov.movementType} of ${mov.quantity} units for ${mov.itemName}.`,
        'success'
      );
      reset();
      onClose();
    },
    onError: (err: Error) => {
      showToast('Movement Error', err.message || 'Failed to record stock movement.', 'error');
    },
  });

  const onSubmit = (data: MovementFormData) => {
    if (movementType === 'OUTWARD' && selectedItem && quantity > selectedItem.currentStock) {
      showToast(
        'Insufficient Stock',
        `Cannot issue ${quantity} units. Only ${selectedItem.currentStock} units available in warehouse.`,
        'error'
      );
      return;
    }
    recordMutation.mutate(data);
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Record Stock Movement"
      description="Track inward procurement, outward dispatch, or warehouse adjustments"
      width="md"
      className="max-w-[540px]"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs">
            {selectedItem && (
              <span className="text-slate-500">
                New Stock:{' '}
                <strong className="font-bold text-slate-800">
                  {projectedStock} {selectedItem.unit}
                </strong>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              form="stock-movement-form"
              isLoading={recordMutation.isPending}
            >
              Confirm Movement
            </Button>
          </div>
        </div>
      }
    >
      <form
        id="stock-movement-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5 text-xs"
      >
        {/* Item Selection */}
        <div className="space-y-1">
          <Select
            label="Inventory Item *"
            error={errors.inventoryItemId?.message}
            options={[
              { label: '-- Select Item to Move --', value: '' },
              ...items.map((i) => ({
                label: `[${i.sku}] ${i.name} (Stock: ${i.currentStock} ${i.unit})`,
                value: i.id,
              })),
            ]}
            {...register('inventoryItemId')}
          />
        </div>

        {/* Selected Item Stock Card */}
        {selectedItem && (
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] font-mono text-slate-400 block">{selectedItem.sku}</span>
                <span className="font-bold text-slate-800 text-sm">{selectedItem.name}</span>
                <p className="text-[11px] text-slate-500">
                  {selectedItem.brand} • {selectedItem.model} • Location: {selectedItem.location || 'Main Yard'}
                </p>
              </div>
              <Badge variant={selectedItem.currentStock <= selectedItem.lowStockThreshold ? 'rose' : 'emerald'} dot>
                {selectedItem.currentStock <= selectedItem.lowStockThreshold ? 'Low Stock' : 'In Stock'}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/80 text-center">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Current</span>
                <span className="font-bold text-slate-800 text-sm">
                  {selectedItem.currentStock} {selectedItem.unit}
                </span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Threshold</span>
                <span className="font-semibold text-slate-600 text-sm">
                  {selectedItem.lowStockThreshold} {selectedItem.unit}
                </span>
              </div>
              <div
                className={`p-2 rounded-lg border text-center ${
                  movementType === 'INWARD'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : movementType === 'OUTWARD'
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                <span className="text-[10px] uppercase font-semibold block">Projected</span>
                <span className="font-extrabold text-sm">
                  {projectedStock} {selectedItem.unit}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Movement Type */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 block">Movement Type *</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setValue('movementType', 'INWARD')}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                movementType === 'INWARD'
                  ? 'bg-emerald-50 border-emerald-600 text-emerald-900 ring-1 ring-emerald-500 font-bold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
              <span>Inward (GRN)</span>
            </button>

            <button
              type="button"
              onClick={() => setValue('movementType', 'OUTWARD')}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                movementType === 'OUTWARD'
                  ? 'bg-rose-50 border-rose-600 text-rose-900 ring-1 ring-rose-500 font-bold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 text-rose-600" />
              <span>Outward (Issue)</span>
            </button>

            <button
              type="button"
              onClick={() => setValue('movementType', 'ADJUSTMENT')}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                movementType === 'ADJUSTMENT'
                  ? 'bg-amber-50 border-amber-600 text-amber-900 ring-1 ring-amber-500 font-bold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 text-amber-600" />
              <span>Adjustment</span>
            </button>
          </div>
        </div>

        {/* Quantity & Reference */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label={`Quantity (${selectedItem ? selectedItem.unit : 'Units'}) *`}
            type="number"
            min={1}
            error={errors.quantity?.message}
            {...register('quantity', { valueAsNumber: true })}
          />

          <Input
            label="Reference # *"
            placeholder="e.g. PO-2026-0415 / DO-0192"
            error={errors.reference?.message}
            {...register('reference')}
          />
        </div>

        {/* Reason */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700">Reason / Notes *</label>
          <textarea
            rows={2}
            placeholder="e.g. Received shipment from manufacturer, or issued for customer installation #ORD-2026-0042..."
            className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-solar-500/20 focus:border-solar-600"
            {...register('reason')}
          />
          {errors.reason && (
            <p className="text-xs text-rose-600 font-medium">{errors.reason.message}</p>
          )}
        </div>

        {/* Recent Item Movement History */}
        {recentMovements.length > 0 && (
          <div className="pt-2 border-t border-slate-200 space-y-2">
            <div className="flex items-center gap-1.5 text-slate-700 font-bold">
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>Recent Movement History ({recentMovements.length})</span>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {recentMovements.slice(0, 5).map((m) => (
                <div
                  key={m.id}
                  className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-[11px]"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-bold ${
                        m.movementType === 'INWARD'
                          ? 'text-emerald-700'
                          : m.movementType === 'OUTWARD'
                          ? 'text-rose-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {m.movementType === 'INWARD' ? '+' : m.movementType === 'OUTWARD' ? '-' : '±'}
                      {m.quantity}
                    </span>
                    <span className="text-slate-600 truncate max-w-[170px]">{m.reason}</span>
                  </div>
                  <div className="text-right text-slate-400 shrink-0 font-mono">
                    {formatDate(m.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </form>
    </Drawer>
  );
};
