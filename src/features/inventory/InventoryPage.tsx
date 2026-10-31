import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PageHeader, QuickStat } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/Table';
import { InventoryItem, InventoryCategory } from '../../types/inventory';
import { inventoryService } from './services/inventoryService';
import { StockMovementDrawer } from './components/StockMovementDrawer';
import { InventoryItemFormDrawer } from './components/InventoryItemFormDrawer';
import { formatCurrency } from '../../utils/formatters';
import {
  Plus,
  ArrowLeftRight,
  Search,
  LayoutGrid,
  List,
  AlertTriangle,
  Package,
  MapPin,
  Barcode,
  Edit2,
  TrendingDown,
} from 'lucide-react';

type ViewMode = 'GRID' | 'TABLE';

const CATEGORIES: { id: 'ALL' | InventoryCategory; label: string }[] = [
  { id: 'ALL', label: 'All Items' },
  { id: 'SOLAR_PANEL', label: 'Solar Panels' },
  { id: 'INVERTER', label: 'Inverters' },
  { id: 'BATTERY', label: 'Batteries' },
  { id: 'CHARGE_CONTROLLER', label: 'Charge Controllers' },
  { id: 'MOUNTING_STRUCTURE', label: 'Structures' },
  { id: 'DC_WIRE', label: 'DC Wires' },
  { id: 'AC_WIRE', label: 'AC Wires' },
  { id: 'SWITCHGEAR', label: 'Switchgear' },
  { id: 'EARTHING', label: 'Earthing & Safety' },
  { id: 'CONNECTOR', label: 'Connectors' },
  { id: 'OTHER', label: 'Other Spares' },
];

const categoryBadgeVariants: Record<
  InventoryCategory,
  'solar' | 'amber' | 'sky' | 'purple' | 'slate' | 'emerald'
> = {
  SOLAR_PANEL: 'solar',
  INVERTER: 'sky',
  BATTERY: 'amber',
  CHARGE_CONTROLLER: 'purple',
  MOUNTING_STRUCTURE: 'slate',
  DC_WIRE: 'amber',
  AC_WIRE: 'slate',
  SWITCHGEAR: 'sky',
  EARTHING: 'emerald',
  CONNECTOR: 'slate',
  OTHER: 'slate',
};

export const InventoryPage: React.FC = () => {
  const queryClient = useQueryClient();

  // State
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | InventoryCategory>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('GRID');
  const [showOnlyLowStock, setShowOnlyLowStock] = useState(false);

  // Drawers
  const [isMovementDrawerOpen, setIsMovementDrawerOpen] = useState(false);
  const [selectedMovementItemId, setSelectedMovementItemId] = useState<string | undefined>(
    undefined
  );

  const [isItemFormDrawerOpen, setIsItemFormDrawerOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);

  // Queries
  const {
    data: items = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['inventoryItems'],
    queryFn: inventoryService.getInventoryItems,
  });

  // Calculate low stock items
  const lowStockItems = useMemo(() => {
    return items.filter((item) => item.currentStock <= item.lowStockThreshold);
  }, [items]);

  // Total valuation
  const totalStockValuation = useMemo(() => {
    return items.reduce((acc, item) => acc + item.currentStock * item.unitCostPrice, 0);
  }, [items]);

  // Counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: items.length };
    items.forEach((item) => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, [items]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }
      if (showOnlyLowStock && item.currentStock > item.lowStockThreshold) {
        return false;
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesSku = item.sku.toLowerCase().includes(query);
        const matchesBrand = item.brand.toLowerCase().includes(query);
        const matchesModel = item.model.toLowerCase().includes(query);
        if (!matchesName && !matchesSku && !matchesBrand && !matchesModel) {
          return false;
        }
      }
      return true;
    });
  }, [items, selectedCategory, showOnlyLowStock, searchTerm]);

  // Action handlers
  const handleOpenMovement = (itemId?: string) => {
    setSelectedMovementItemId(itemId);
    setIsMovementDrawerOpen(true);
  };

  const handleOpenAddItem = () => {
    setItemToEdit(null);
    setIsItemFormDrawerOpen(true);
  };

  const handleOpenEditItem = (item: InventoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setItemToEdit(item);
    setIsItemFormDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Warehouse Inventory & Stock Control"
        subtitle="Live component tracking across 11 solar equipment categories with automated low-stock warnings"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ArrowLeftRight className="w-4 h-4 text-slate-600" />}
              onClick={() => handleOpenMovement()}
            >
              Add Stock Movement
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={handleOpenAddItem}
            >
              Add Item
            </Button>
          </div>
        }
      />

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <QuickStat
          label="Total SKUs"
          value={items.length}
          color="slate"
          onClick={() => {
            setSelectedCategory('ALL');
            setShowOnlyLowStock(false);
          }}
        />
        <QuickStat
          label="Low Stock Alerts"
          value={lowStockItems.length}
          color={lowStockItems.length > 0 ? 'rose' : 'emerald'}
          onClick={() => setShowOnlyLowStock((prev) => !prev)}
        />
        <QuickStat
          label="Stock Valuation"
          value={formatCurrency(totalStockValuation)}
          color="amber"
        />
        <QuickStat
          label="Equipment Categories"
          value={CATEGORIES.length - 1}
          color="sky"
        />
      </div>

      {/* Low Stock Alert Banner */}
      {lowStockItems.length > 0 && (
        <div className="bg-rose-50 border border-rose-200/90 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-rose-100 text-rose-700 shrink-0 mt-0.5 sm:mt-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-rose-900 text-sm">
                Low Stock Threshold Alert ({lowStockItems.length} Items Below Minimum)
              </h4>
              <p className="text-rose-700 mt-0.5 leading-relaxed">
                Reorder required for:{' '}
                <span className="font-semibold">
                  {lowStockItems.map((i) => `${i.name} (${i.currentStock} ${i.unit})`).join(', ')}
                </span>
                . Initiate purchase requisitions to avoid installation delays.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-rose-300 text-rose-700 hover:bg-rose-100 shrink-0 self-end sm:self-auto"
            onClick={() => setShowOnlyLowStock((prev) => !prev)}
          >
            {showOnlyLowStock ? 'Show All Stock' : 'Filter Low Stock Only'}
          </Button>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Category Pills & Filters */}
        <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/50">
          {/* Top row: search + view mode toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="w-full sm:w-80">
              <Input
                placeholder="Search by SKU, brand, model or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => setShowOnlyLowStock((prev) => !prev)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  showOnlyLowStock
                    ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                <span>Low Stock ({lowStockItems.length})</span>
              </button>

              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('GRID')}
                  className={`p-1.5 rounded-md transition-all ${
                    viewMode === 'GRID'
                      ? 'bg-solar-800 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('TABLE')}
                  className={`p-1.5 rounded-md transition-all ${
                    viewMode === 'TABLE'
                      ? 'bg-solar-800 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Table View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Category Filter Pills (All + 11 categories) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const count = categoryCounts[cat.id] || 0;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    isSelected
                      ? 'bg-solar-800 text-white shadow-xs'
                      : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isSelected
                        ? 'bg-solar-900/80 text-amber-300'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Skeleton className="h-44 w-full" />
            <Skeleton className="h-44 w-full" />
            <Skeleton className="h-44 w-full" />
          </div>
        ) : isError ? (
          <div className="p-8">
            <EmptyState
              icon={AlertTriangle}
              title="Failed to Load Inventory"
              description="Could not connect to the warehouse database. Please retry."
              actionLabel="Retry"
              onAction={() => queryClient.invalidateQueries({ queryKey: ['inventoryItems'] })}
            />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Package}
              title="No Inventory Items Found"
              description={
                searchTerm || showOnlyLowStock
                  ? 'No items matched your current filter criteria.'
                  : 'Start adding solar components, panels, inverters and mounting gear to your warehouse.'
              }
              actionLabel="Add Equipment"
              onAction={handleOpenAddItem}
            />
          </div>
        ) : viewMode === 'GRID' ? (
          /* Card Grid View */
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => {
              const isLowStock = item.currentStock <= item.lowStockThreshold;
              const badgeVariant = categoryBadgeVariants[item.category] || 'slate';

              return (
                <div
                  key={item.id}
                  onClick={() => handleOpenMovement(item.id)}
                  className={`group relative bg-white rounded-xl border p-4 transition-all duration-150 cursor-pointer flex flex-col justify-between hover:shadow-card-hover ${
                    isLowStock
                      ? 'border-rose-300 hover:border-rose-400 bg-rose-50/10'
                      : 'border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  <div>
                    {/* Top Header: Category & Low Stock Badges */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Badge variant={badgeVariant} size="sm">
                        {item.category.replace('_', ' ')}
                      </Badge>
                      <div className="flex items-center gap-1.5">
                        {isLowStock ? (
                          <Badge variant="rose" size="sm" dot>
                            Low Stock
                          </Badge>
                        ) : (
                          <Badge variant="emerald" size="sm" dot>
                            In Stock
                          </Badge>
                        )}
                        <button
                          onClick={(e) => handleOpenEditItem(item, e)}
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                          title="Edit Equipment Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Item Name & Model */}
                    <div className="space-y-0.5">
                      <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-solar-800 transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {item.brand} • <span className="font-mono">{item.model}</span>
                      </p>
                    </div>

                    {/* SKU & Location */}
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                      <span className="flex items-center gap-1 font-mono">
                        <Barcode className="w-3 h-3 text-slate-400" />
                        {item.sku}
                      </span>
                      {item.location && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          {item.location}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stock & Valuation Stats */}
                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-end justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                        Available Stock
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span
                          className={`text-xl font-extrabold font-mono ${
                            isLowStock ? 'text-rose-600' : 'text-slate-900'
                          }`}
                        >
                          {item.currentStock}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          {item.unit}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Threshold: {item.lowStockThreshold} {item.unit}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                        Cost Rate
                      </span>
                      <span className="text-sm font-bold font-mono text-slate-800">
                        {formatCurrency(item.unitCostPrice)}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        MRP: {formatCurrency(item.unitSellingPrice)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Equipment & Manufacturer</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-center">Current Stock</TableHead>
                <TableHead className="text-center">Min. Threshold</TableHead>
                <TableHead className="text-right">Cost Price</TableHead>
                <TableHead className="text-right">Selling Price</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => {
                const isLowStock = item.currentStock <= item.lowStockThreshold;
                const badgeVariant = categoryBadgeVariants[item.category] || 'slate';

                return (
                  <TableRow
                    key={item.id}
                    onClick={() => handleOpenMovement(item.id)}
                    className="cursor-pointer"
                  >
                    <TableCell className="font-mono text-xs font-bold text-slate-700">
                      {item.sku}
                    </TableCell>

                    <TableCell>
                      <div className="font-bold text-slate-900">{item.name}</div>
                      <div className="text-xs text-slate-400">
                        {item.brand} • {item.model}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant={badgeVariant} size="sm">
                        {item.category.replace('_', ' ')}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-center font-mono">
                      <span
                        className={`text-sm font-bold ${
                          isLowStock ? 'text-rose-600' : 'text-slate-900'
                        }`}
                      >
                        {item.currentStock}
                      </span>{' '}
                      <span className="text-xs text-slate-500">{item.unit}</span>
                    </TableCell>

                    <TableCell className="text-center text-xs text-slate-500 font-mono">
                      {item.lowStockThreshold} {item.unit}
                    </TableCell>

                    <TableCell className="text-right font-mono text-xs font-semibold text-slate-700">
                      {formatCurrency(item.unitCostPrice)}
                    </TableCell>

                    <TableCell className="text-right font-mono text-xs font-semibold text-slate-700">
                      {formatCurrency(item.unitSellingPrice)}
                    </TableCell>

                    <TableCell className="text-xs text-slate-500">
                      {item.location || '—'}
                    </TableCell>

                    <TableCell>
                      <Badge variant={isLowStock ? 'rose' : 'emerald'} size="sm" dot>
                        {isLowStock ? 'Low Stock' : 'Optimal'}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <div
                        className="flex items-center justify-end gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs px-2 py-1"
                          onClick={() => handleOpenMovement(item.id)}
                        >
                          Move Stock
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="px-2 py-1"
                          onClick={(e) => handleOpenEditItem(item, e)}
                          title="Edit Details"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Stock Movement Drawer */}
      <StockMovementDrawer
        isOpen={isMovementDrawerOpen}
        onClose={() => setIsMovementDrawerOpen(false)}
        preselectedItemId={selectedMovementItemId}
      />

      {/* Add / Edit Inventory Item Drawer */}
      <InventoryItemFormDrawer
        isOpen={isItemFormDrawerOpen}
        onClose={() => setIsItemFormDrawerOpen(false)}
        initialItem={itemToEdit}
      />
    </div>
  );
};
