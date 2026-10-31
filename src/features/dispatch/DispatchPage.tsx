import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Truck,
  Plus,
  ChevronDown,
  ChevronRight,
  Barcode,
  Send,
  CheckCircle,
  PackageCheck,
  Search,
  RefreshCw,
  MapPin,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { dispatchService } from './services/dispatchService';
import { DispatchOrder, DispatchStatus } from '../../types/operations';
import { SerialEntryModal } from './components/SerialEntryModal';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/Table';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { customers, inventoryItems } from '../../store/inMemoryDb';

type FilterTab = 'ALL' | DispatchStatus;

export const DispatchPage: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Modal States
  const [serialModalOrder, setSerialModalOrder] = useState<DispatchOrder | null>(null);
  const [dispatchModalOrder, setDispatchModalOrder] = useState<DispatchOrder | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form State for Mark Dispatched
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [isMarkingDispatched, setIsMarkingDispatched] = useState(false);

  // Form State for Create Dispatch
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [selectedItem1Id, setSelectedItem1Id] = useState(inventoryItems[0]?.id || '');
  const [item1Qty, setItem1Qty] = useState(4);
  const [selectedItem2Id, setSelectedItem2Id] = useState(inventoryItems[2]?.id || '');
  const [item2Qty, setItem2Qty] = useState(1);
  const [isCreatingDispatch, setIsCreatingDispatch] = useState(false);

  // Fetch dispatch orders
  const {
    data: response,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['dispatchOrders'],
    queryFn: () => dispatchService.getDispatchOrders(),
    staleTime: 1000 * 30,
  });

  const dispatchOrders = response?.data || [];

  // Filter & Search Logic
  const filteredOrders = useMemo(() => {
    return dispatchOrders.filter((order) => {
      const matchesTab = activeTab === 'ALL' || order.status === activeTab;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        order.dispatchNumber.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.customerAddress.toLowerCase().includes(q) ||
        (order.vehicleNumber && order.vehicleNumber.toLowerCase().includes(q)) ||
        order.items.some((it) =>
          it.itemName.toLowerCase().includes(q) ||
          it.serialNumbers?.some((s) => s.toLowerCase().includes(q))
        );
      return matchesTab && matchesSearch;
    });
  }, [dispatchOrders, activeTab, searchQuery]);

  const toggleRowExpansion = (orderId: string) => {
    setExpandedRowId((prev) => (prev === orderId ? null : orderId));
  };

  const handleOpenDispatchModal = (order: DispatchOrder, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDispatchModalOrder(order);
    setVehicleNumber(order.vehicleNumber || 'HR-26-DM-4182');
    setDriverName(order.driverName || 'Ramesh Yadav');
  };

  const handleConfirmDispatched = async () => {
    if (!dispatchModalOrder) return;
    if (!vehicleNumber.trim() || !driverName.trim()) {
      showToast('Validation Error', 'Vehicle number and driver name are required.', 'error');
      return;
    }

    try {
      setIsMarkingDispatched(true);
      await dispatchService.markDispatched(
        dispatchModalOrder.id,
        vehicleNumber.trim().toUpperCase(),
        driverName.trim()
      );
      showToast(
        'Dispatch Order In-Transit',
        `${dispatchModalOrder.dispatchNumber} marked as DISPATCHED. Customer warranty records auto-activated.`,
        'success'
      );
      setDispatchModalOrder(null);
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to mark dispatched';
      showToast('Error', msg, 'error');
    } finally {
      setIsMarkingDispatched(false);
    }
  };

  const handleCreateDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === selectedCustomerId);
    if (!cust) return;

    const item1 = inventoryItems.find((i) => i.id === selectedItem1Id);
    const item2 = inventoryItems.find((i) => i.id === selectedItem2Id);

    const itemsToDispatch = [];
    if (item1 && item1Qty > 0) {
      itemsToDispatch.push({
        inventoryItemId: item1.id,
        itemName: item1.name,
        quantity: item1Qty,
        serialNumbers: [],
        warrantyYears: item1.warrantyYears,
      });
    }
    if (item2 && item2Qty > 0) {
      itemsToDispatch.push({
        inventoryItemId: item2.id,
        itemName: item2.name,
        quantity: item2Qty,
        serialNumbers: [],
        warrantyYears: item2.warrantyYears,
      });
    }

    if (itemsToDispatch.length === 0) {
      showToast('Error', 'Please select at least one item with valid quantity.', 'error');
      return;
    }

    try {
      setIsCreatingDispatch(true);
      await dispatchService.createDispatch({
        customerId: cust.id,
        customerName: cust.name,
        customerAddress: cust.address + ', ' + cust.city,
        items: itemsToDispatch,
      });

      showToast(
        'Dispatch Order Created',
        'New dispatch order queued in PENDING_SERIAL status.',
        'success'
      );
      setIsCreateModalOpen(false);
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create dispatch';
      showToast('Error', msg, 'error');
    } finally {
      setIsCreatingDispatch(false);
    }
  };

  const getStatusBadgeVariant = (status: DispatchStatus) => {
    switch (status) {
      case 'DRAFT':
        return 'slate';
      case 'PENDING_SERIAL':
        return 'amber';
      case 'READY':
        return 'sky';
      case 'DISPATCHED':
        return 'emerald';
      case 'DELIVERED':
        return 'purple';
      default:
        return 'slate';
    }
  };

  const tabs: { label: string; value: FilterTab; count?: number }[] = [
    { label: 'All Dispatches', value: 'ALL', count: dispatchOrders.length },
    {
      label: 'Draft',
      value: 'DRAFT',
      count: dispatchOrders.filter((d) => d.status === 'DRAFT').length,
    },
    {
      label: 'Pending Serial',
      value: 'PENDING_SERIAL',
      count: dispatchOrders.filter((d) => d.status === 'PENDING_SERIAL').length,
    },
    {
      label: 'Ready for Transit',
      value: 'READY',
      count: dispatchOrders.filter((d) => d.status === 'READY').length,
    },
    {
      label: 'Dispatched',
      value: 'DISPATCHED',
      count: dispatchOrders.filter((d) => d.status === 'DISPATCHED').length,
    },
    {
      label: 'Delivered',
      value: 'DELIVERED',
      count: dispatchOrders.filter((d) => d.status === 'DELIVERED').length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Dispatch & Serial Number Tracking
            </h1>
            <Badge variant="solar" size="sm">
              Supply Chain
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Assign individual panel and inverter serial numbers, issue gate passes, and activate product warranties.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetch();
              showToast('Refreshed', 'Dispatch records refreshed.', 'info', 1500);
            }}
            isLoading={isFetching && !isLoading}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create Dispatch
          </Button>
        </div>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3 rounded-xl border border-slate-200">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === tab.value
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === tab.value
                      ? 'bg-amber-600/80 text-slate-950 font-extrabold'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="w-full md:w-72">
          <Input
            placeholder="Search dispatch #, customer, serial..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-3.5 h-3.5" />}
          />
        </div>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No dispatch orders found"
          description={
            searchQuery
              ? `No dispatches match the search term "${searchQuery}". Try adjusting your filters.`
              : 'There are currently no dispatch orders in this category.'
          }
          actionLabel="Create Dispatch"
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Dispatch #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items Count</TableHead>
              <TableHead>Serial Numbers Status</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => {
              const isExpanded = expandedRowId === order.id;
              const totalUnits = order.items.reduce((acc, it) => acc + it.quantity, 0);
              const totalEnteredSerials = order.items.reduce(
                (acc, it) => acc + (it.serialNumbers?.filter(Boolean).length || 0),
                0
              );
              const isSerialsComplete = totalEnteredSerials >= totalUnits && totalUnits > 0;

              return (
                <React.Fragment key={order.id}>
                  <TableRow
                    onClick={() => toggleRowExpansion(order.id)}
                    className="cursor-pointer select-none group"
                  >
                    <TableCell className="text-slate-400">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-solar-800" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
                      )}
                    </TableCell>

                    <TableCell className="font-bold text-slate-900 font-mono text-xs">
                      <div className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-solar-700" />
                        <span>{order.dispatchNumber}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-sans block mt-0.5">
                        Order Ref: {order.orderId}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="font-semibold text-slate-900">{order.customerName}</div>
                      <div className="text-xs text-slate-500 truncate max-w-xs flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{order.customerAddress}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="font-semibold text-slate-800">
                        {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                      </span>
                      <span className="text-xs text-slate-500 block">
                        ({totalUnits} units total)
                      </span>
                    </TableCell>

                    <TableCell>
                      {isSerialsComplete ? (
                        <Badge variant="emerald" size="sm" dot>
                          All Assigned ({totalEnteredSerials}/{totalUnits})
                        </Badge>
                      ) : (
                        <Badge variant="amber" size="sm" dot>
                          Missing Serials ({totalEnteredSerials}/{totalUnits})
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(order.status)} size="sm">
                        {order.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-xs text-slate-600">
                      <div>{formatDate(order.createdAt)}</div>
                      {order.dispatchedAt && (
                        <span className="text-[11px] text-emerald-700 block mt-0.5">
                          Sent: {formatDate(order.dispatchedAt)}
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {order.status === 'PENDING_SERIAL' && (
                          <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<Barcode className="w-3.5 h-3.5" />}
                            onClick={() => setSerialModalOrder(order)}
                          >
                            Enter Serials
                          </Button>
                        )}

                        {order.status === 'READY' && (
                          <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<Send className="w-3.5 h-3.5" />}
                            onClick={(e) => handleOpenDispatchModal(order, e)}
                          >
                            Mark Dispatched
                          </Button>
                        )}

                        {order.status === 'DISPATCHED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<PackageCheck className="w-3.5 h-3.5 text-emerald-600" />}
                            onClick={async () => {
                              await dispatchService.markDelivered(order.id);
                              showToast('Delivered', `${order.dispatchNumber} marked as DELIVERED.`, 'success');
                              refetch();
                            }}
                          >
                            Mark Delivered
                          </Button>
                        )}

                        {order.status === 'DELIVERED' && (
                          <span className="text-xs text-purple-700 font-semibold flex items-center gap-1 justify-end">
                            <CheckCircle className="w-3.5 h-3.5" /> Delivered
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Expandable Serial Numbers Details Row */}
                  {isExpanded && (
                    <TableRow className="bg-slate-50/70 hover:bg-slate-50/90">
                      <TableCell colSpan={8} className="p-4 pl-12">
                        <div className="bg-white rounded-xl border border-slate-200/90 p-4.5 space-y-4 shadow-xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                            <div>
                              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                Manifest & Serial Numbers Audit Trail
                              </h4>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Verified component serial identifiers linked to customer warranty certificate
                              </p>
                            </div>
                            {order.vehicleNumber && (
                              <div className="flex items-center gap-3 text-xs bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                                <span className="text-slate-600">
                                  Vehicle: <strong className="text-slate-900">{order.vehicleNumber}</strong>
                                </span>
                                <span className="text-slate-300">|</span>
                                <span className="text-slate-600">
                                  Driver: <strong className="text-slate-900">{order.driverName}</strong>
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="space-y-3.5">
                            {order.items.map((item, idx) => (
                              <div
                                key={idx}
                                className="p-3 rounded-lg bg-slate-50/70 border border-slate-200/70 space-y-2"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-900">
                                      {item.itemName}
                                    </span>
                                    <Badge variant="slate" size="sm">
                                      Qty: {item.quantity}
                                    </Badge>
                                    <span className="text-[11px] text-slate-500">
                                      ({item.warrantyYears}y warranty)
                                    </span>
                                  </div>
                                  <span className="text-[11px] font-semibold text-slate-500">
                                    {item.serialNumbers?.filter(Boolean).length || 0} of {item.quantity} Recorded
                                  </span>
                                </div>

                                {item.serialNumbers && item.serialNumbers.length > 0 ? (
                                  <div className="flex flex-wrap gap-2 pt-1">
                                    {item.serialNumbers.map((sn, sIdx) => (
                                      <div
                                        key={sIdx}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200/80 text-emerald-800 font-mono text-xs shadow-2xs"
                                      >
                                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                        <span className="font-semibold">{sn}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-amber-700 italic flex items-center gap-1.5 pt-1">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    No serial numbers recorded yet. Click 'Enter Serials' to assign units.
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Serial Entry Modal */}
      <SerialEntryModal
        isOpen={Boolean(serialModalOrder)}
        onClose={() => setSerialModalOrder(null)}
        dispatchOrder={serialModalOrder}
        onSuccess={() => {
          refetch();
        }}
      />

      {/* Mark Dispatched Modal */}
      <Modal
        isOpen={Boolean(dispatchModalOrder)}
        onClose={() => setDispatchModalOrder(null)}
        title={`Confirm Outbound Dispatch — ${dispatchModalOrder?.dispatchNumber}`}
        description={`Record transport logistics for ${dispatchModalOrder?.customerName}. This will auto-activate manufacturer warranty records.`}
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDispatchModalOrder(null)}
              disabled={isMarkingDispatched}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmDispatched}
              isLoading={isMarkingDispatched}
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              Confirm Dispatch
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-800 space-y-1">
            <p className="font-semibold flex items-center gap-1.5 text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Automated Warranty Registration
            </p>
            <p className="text-emerald-700">
              Upon dispatch confirmation, each verified serial number will immediately transition to ACTIVE status
              in the Warranty Registry.
            </p>
          </div>

          <Input
            label="Vehicle Registration Number"
            placeholder="e.g. HR-26-DM-4182"
            value={vehicleNumber}
            onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
            required
            helperText="Commercial cargo vehicle or tempo registration number"
          />

          <Input
            label="Driver Full Name"
            placeholder="e.g. Ramesh Yadav"
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
            required
            helperText="Authorized driver / delivery personnel"
          />

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
            <span className="font-medium text-slate-800">Destination:</span>{' '}
            {dispatchModalOrder?.customerAddress}
          </div>
        </div>
      </Modal>

      {/* Create Dispatch Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Dispatch Order"
        description="Initiate warehouse staging and item serial assignment for an approved solar installation."
        size="lg"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isCreatingDispatch}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateDispatchSubmit}
              isLoading={isCreatingDispatch}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Create Dispatch Order
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateDispatchSubmit} className="space-y-4">
          <Select
            label="Select Customer & Project"
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            options={customers.map((c) => ({
              label: `${c.name} (${c.requiredCapacityKW} kW - ${c.city})`,
              value: c.id,
            }))}
            required
          />

          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Equipment to Dispatch
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <Select
                  label="Primary Item (Solar Panels)"
                  value={selectedItem1Id}
                  onChange={(e) => setSelectedItem1Id(e.target.value)}
                  options={inventoryItems
                    .filter((i) => i.category === 'SOLAR_PANEL')
                    .map((i) => ({
                      label: `${i.name} (Stock: ${i.currentStock})`,
                      value: i.id,
                    }))}
                />
              </div>
              <div>
                <Input
                  label="Quantity"
                  type="number"
                  min={1}
                  max={100}
                  value={item1Qty}
                  onChange={(e) => setItem1Qty(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <Select
                  label="Secondary Item (Inverter / Battery)"
                  value={selectedItem2Id}
                  onChange={(e) => setSelectedItem2Id(e.target.value)}
                  options={inventoryItems
                    .filter((i) => i.category === 'INVERTER' || i.category === 'BATTERY')
                    .map((i) => ({
                      label: `${i.name} (Stock: ${i.currentStock})`,
                      value: i.id,
                    }))}
                />
              </div>
              <div>
                <Input
                  label="Quantity"
                  type="number"
                  min={1}
                  max={20}
                  value={item2Qty}
                  onChange={(e) => setItem2Qty(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
