import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Drawer } from '../../../components/ui/Drawer';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { InventoryItem } from '../../../types/inventory';
import { inventoryItemSchema, InventoryItemFormData } from '../../../utils/validators';
import { inventoryService } from '../services/inventoryService';
import { useToast } from '../../../context/ToastContext';
import { Package, ShieldCheck, MapPin, Tag } from 'lucide-react';

export interface InventoryItemFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialItem?: InventoryItem | null;
}

const CATEGORY_OPTIONS = [
  { label: 'Solar Panels (Mono/Bifacial)', value: 'SOLAR_PANEL' },
  { label: 'Solar Inverters (On-Grid/Hybrid)', value: 'INVERTER' },
  { label: 'Batteries (Lithium/Lead-Acid)', value: 'BATTERY' },
  { label: 'Charge Controllers (MPPT/PWM)', value: 'CHARGE_CONTROLLER' },
  { label: 'Mounting Structures (GI/Aluminium)', value: 'MOUNTING_STRUCTURE' },
  { label: 'DC Cables (Solar Tinned Copper)', value: 'DC_WIRE' },
  { label: 'AC Cables (Armoured/Flexible)', value: 'AC_WIRE' },
  { label: 'Switchgear (ACDB / DCDB / SPD)', value: 'SWITCHGEAR' },
  { label: 'Earthing & Lightning Arresters', value: 'EARTHING' },
  { label: 'Connectors (MC4 & Hardware)', value: 'CONNECTOR' },
  { label: 'Other Spares & Tools', value: 'OTHER' },
];

const UNIT_OPTIONS = [
  { label: 'Nos (Pieces / Units)', value: 'Nos' },
  { label: 'Meters (Linear length)', value: 'Meters' },
  { label: 'Set (Combined Kit)', value: 'Set' },
  { label: 'Kg (Weight)', value: 'Kg' },
  { label: 'Job / Lumpsum', value: 'Job' },
];

export const InventoryItemFormDrawer: React.FC<InventoryItemFormDrawerProps> = ({
  isOpen,
  onClose,
  initialItem,
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const isEditing = Boolean(initialItem);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<InventoryItemFormData>({
    resolver: zodResolver(inventoryItemSchema),
    defaultValues: {
      sku: '',
      name: '',
      brand: '',
      model: '',
      category: 'SOLAR_PANEL',
      unit: 'Nos',
      currentStock: 0,
      lowStockThreshold: 10,
      unitCostPrice: 1000,
      unitSellingPrice: 1200,
      warrantyYears: 5,
      hasSerialNumbers: true,
      specifications: '',
      location: '',
    },
  });

  // Re-populate when initialItem changes
  useEffect(() => {
    if (initialItem && isOpen) {
      reset({
        sku: initialItem.sku,
        name: initialItem.name,
        brand: initialItem.brand,
        model: initialItem.model,
        category: initialItem.category,
        unit: initialItem.unit,
        currentStock: initialItem.currentStock,
        lowStockThreshold: initialItem.lowStockThreshold,
        unitCostPrice: initialItem.unitCostPrice,
        unitSellingPrice: initialItem.unitSellingPrice,
        warrantyYears: initialItem.warrantyYears,
        hasSerialNumbers: initialItem.hasSerialNumbers,
        specifications: initialItem.specifications || '',
        location: initialItem.location || '',
      });
    } else if (!initialItem && isOpen) {
      reset({
        sku: '',
        name: '',
        brand: '',
        model: '',
        category: 'SOLAR_PANEL',
        unit: 'Nos',
        currentStock: 0,
        lowStockThreshold: 10,
        unitCostPrice: 1000,
        unitSellingPrice: 1200,
        warrantyYears: 5,
        hasSerialNumbers: true,
        specifications: '',
        location: '',
      });
    }
  }, [initialItem, isOpen, reset]);

  // Mutation for Add/Update
  const itemMutation = useMutation({
    mutationFn: (data: InventoryItemFormData) => {
      if (isEditing && initialItem) {
        return inventoryService.updateItem(initialItem.id, data);
      }
      return inventoryService.addItem(data);
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
      showToast(
        isEditing ? 'Item Updated' : 'Item Registered',
        `Equipment ${saved.name} (${saved.sku}) saved to warehouse inventory.`,
        'success'
      );
      reset();
      onClose();
    },
    onError: (err: Error) => {
      showToast('Save Failed', err.message || 'Could not save inventory item.', 'error');
    },
  });

  const onSubmit = (data: InventoryItemFormData) => {
    itemMutation.mutate(data);
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Item: ${initialItem?.name}` : 'Add New Inventory Item'}
      description="Record new equipment specifications, warehouse location, pricing and stock alert thresholds"
      width="lg"
      className="max-w-[580px]"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            form="inventory-item-form"
            isLoading={itemMutation.isPending}
          >
            {isEditing ? 'Save Changes' : 'Register Equipment'}
          </Button>
        </div>
      }
    >
      <form
        id="inventory-item-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5 text-xs"
      >
        {/* Core Identifiers */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100">
            <Tag className="w-4 h-4 text-solar-700" />
            <span>Equipment Identity & Category</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="SKU Code *"
              placeholder="e.g. SP-WAA-540"
              error={errors.sku?.message}
              {...register('sku')}
            />

            <Select
              label="Inventory Category *"
              options={CATEGORY_OPTIONS}
              error={errors.category?.message}
              {...register('category')}
            />
          </div>

          <Input
            label="Item Description / Name *"
            placeholder="e.g. Mono PERC 540W Solar Panel"
            error={errors.name?.message}
            {...register('name')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Brand / Manufacturer *"
              placeholder="e.g. Waaree, Adani, Solis, Polycab"
              error={errors.brand?.message}
              {...register('brand')}
            />

            <Input
              label="Model Number / Series *"
              placeholder="e.g. WXS-540-144"
              error={errors.model?.message}
              {...register('model')}
            />
          </div>
        </div>

        {/* Stock & Measurement Units */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100">
            <Package className="w-4 h-4 text-solar-700" />
            <span>Stock Levels & Unit of Measure</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Measurement Unit *"
              options={UNIT_OPTIONS}
              error={errors.unit?.message}
              {...register('unit')}
            />

            <Input
              label="Current Stock Quantity *"
              type="number"
              error={errors.currentStock?.message}
              {...register('currentStock', { valueAsNumber: true })}
            />

            <Input
              label="Low Stock Alert Threshold *"
              type="number"
              error={errors.lowStockThreshold?.message}
              helperText="Warns when stock falls below this"
              {...register('lowStockThreshold', { valueAsNumber: true })}
            />
          </div>
        </div>

        {/* Pricing & Commercials */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100">
            <ShieldCheck className="w-4 h-4 text-solar-700" />
            <span>Valuation & Warranty Terms</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Unit Cost Price (₹) *"
              type="number"
              error={errors.unitCostPrice?.message}
              {...register('unitCostPrice', { valueAsNumber: true })}
            />

            <Input
              label="Unit Selling Price (₹) *"
              type="number"
              error={errors.unitSellingPrice?.message}
              {...register('unitSellingPrice', { valueAsNumber: true })}
            />

            <Input
              label="Warranty (Years) *"
              type="number"
              error={errors.warrantyYears?.message}
              {...register('warrantyYears', { valueAsNumber: true })}
            />
          </div>

          {/* Serial Number Tracking Toggle */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-800 block">
                Serial Number Tracking Required
              </span>
              <p className="text-[11px] text-slate-500">
                Track individual serial numbers for dispatch scanning and manufacturer RMA warranties.
              </p>
            </div>
            <Controller
              control={control}
              name="hasSerialNumbers"
              render={({ field }) => (
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="w-4 h-4 rounded text-solar-600 focus:ring-solar-500 cursor-pointer"
                />
              )}
            />
          </div>
        </div>

        {/* Location & Specs */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100">
            <MapPin className="w-4 h-4 text-solar-700" />
            <span>Warehouse Bin Location & Technical Specs</span>
          </div>

          <Input
            label="Warehouse Rack / Bay Location"
            placeholder="e.g. Bay A - Rack 01 / Shelf B4"
            error={errors.location?.message}
            {...register('location')}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Technical Specifications & Key Features
            </label>
            <textarea
              rows={2}
              placeholder="e.g. 540W Mono PERC, 21.2% module efficiency, 144 half-cut cells, IP68 junction box..."
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-solar-500/20 focus:border-solar-600"
              {...register('specifications')}
            />
            {errors.specifications && (
              <p className="text-xs text-rose-600 font-medium">
                {errors.specifications.message}
              </p>
            )}
          </div>
        </div>
      </form>
    </Drawer>
  );
};
