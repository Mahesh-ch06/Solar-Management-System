import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Search,
  RefreshCw,
  User,
  Package,
  Wrench,
  Phone,
  Printer,
} from 'lucide-react';
import { warrantyService } from './services/warrantyService';
import { WarrantyRecord, WarrantyStatus } from '../../types/operations';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Drawer } from '../../components/ui/Drawer';
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

type StatusFilter = 'ALL' | WarrantyStatus;

export const WarrantyPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('ALL');
  const [selectedRecord, setSelectedRecord] = useState<WarrantyRecord | null>(null);

  // Fetch warranty records
  const {
    data: response,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['warrantyRecords'],
    queryFn: () => warrantyService.getWarrantyRecords(),
    staleTime: 1000 * 60,
  });

  const records = response?.data || [];

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalActive = records.filter((r) => r.status === 'ACTIVE').length;
    const expiringSoon = records.filter((r) => {
      if (r.status === 'EXPIRING_SOON') return true;
      const days = Math.ceil(
        (new Date(r.warrantyExpiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return days > 0 && days <= 60 && r.status !== 'EXPIRED';
    }).length;
    const expiredThisYear = records.filter((r) => r.status === 'EXPIRED').length;

    return { totalActive, expiringSoon, expiredThisYear };
  }, [records]);

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const matchesStatus = selectedStatus === 'ALL' || record.status === selectedStatus;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        record.serialNumber.toLowerCase().includes(q) ||
        record.customerName.toLowerCase().includes(q) ||
        record.itemName.toLowerCase().includes(q) ||
        record.brand.toLowerCase().includes(q) ||
        record.model.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [records, selectedStatus, searchQuery]);

  // Compute Days Remaining helper
  const getDaysRemainingInfo = (record: WarrantyRecord) => {
    const expiryTime = new Date(record.warrantyExpiryDate).getTime();
    const now = Date.now();
    const diffDays = Math.ceil((expiryTime - now) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0 || record.status === 'EXPIRED') {
      const ago = Math.abs(diffDays);
      return {
        text: ago === 0 ? 'Expired today' : `Expired ${ago}d ago`,
        color: 'text-rose-600 font-semibold',
      };
    }

    if (diffDays <= 60) {
      return {
        text: `${diffDays} days left`,
        color: 'text-amber-700 font-bold',
      };
    }

    if (diffDays > 365) {
      const years = (diffDays / 365.25).toFixed(1);
      return {
        text: `${years} yrs (${diffDays.toLocaleString()}d)`,
        color: 'text-slate-600',
      };
    }

    return {
      text: `${diffDays} days left`,
      color: 'text-emerald-700 font-medium',
    };
  };

  const getStatusBadge = (status: WarrantyStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Badge variant="emerald" size="sm" dot>
            Active
          </Badge>
        );
      case 'EXPIRING_SOON':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Expiring Soon
          </span>
        );
      case 'EXPIRED':
        return (
          <Badge variant="rose" size="sm" dot>
            Expired
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Warranty & Serial Registry
            </h1>
            <Badge variant="emerald" size="sm">
              Live Registry
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Global repository of customer-assigned serial numbers, active warranty lifespans, and automated claims validation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetch();
              showToast('Refreshed', 'Warranty database updated.', 'info', 1500);
            }}
            isLoading={isFetching && !isLoading}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />}
          >
            Sync Registry
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4.5 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Active Warranties
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
              {isLoading ? <Skeleton className="h-7 w-16" /> : summaryMetrics.totalActive}
            </h3>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Fully covered under OEM SLA
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Expiring in 60 Days
            </p>
            <h3 className="text-2xl font-extrabold text-amber-600 mt-1">
              {isLoading ? <Skeleton className="h-7 w-16" /> : summaryMetrics.expiringSoon}
            </h3>
            <p className="text-[11px] text-amber-600 font-medium mt-0.5 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Eligible for AMC extension
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Expired This Year
            </p>
            <h3 className="text-2xl font-extrabold text-rose-600 mt-1">
              {isLoading ? <Skeleton className="h-7 w-16" /> : summaryMetrics.expiredThisYear}
            </h3>
            <p className="text-[11px] text-rose-600 font-medium mt-0.5 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" /> Requires billable repairs
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Large Search Bar at top */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs space-y-3">
        <div className="relative">
          <Input
            className="text-base py-3 pl-11 shadow-inner placeholder:text-slate-400"
            placeholder="Search by Serial Number, Customer Name, or Product (e.g. SN-INV-88219, Priya, Tata)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-5 h-5 text-slate-400" />}
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100 overflow-x-auto">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">
            Status:
          </span>
          {(['ALL', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED'] as StatusFilter[]).map((tab) => {
            const count =
              tab === 'ALL'
                ? records.length
                : records.filter((r) => r.status === tab).length;

            return (
              <button
                key={tab}
                onClick={() => setSelectedStatus(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  selectedStatus === tab
                    ? 'bg-solar-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>
                  {tab === 'ALL'
                    ? 'All Units'
                    : tab === 'ACTIVE'
                    ? 'Active'
                    : tab === 'EXPIRING_SOON'
                    ? 'Expiring Soon'
                    : 'Expired'}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    selectedStatus === tab
                      ? 'bg-solar-900 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Warranties Table */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : filteredRecords.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No warranty records match your criteria"
          description={
            searchQuery
              ? `No equipment matches "${searchQuery}". Verify the serial number format or customer spelling.`
              : 'No warranty entries available for the selected status tab.'
          }
          actionLabel="Clear Search Filter"
          onAction={() => {
            setSearchQuery('');
            setSelectedStatus('ALL');
          }}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Serial Number</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Dispatch Date</TableHead>
              <TableHead>Warranty Period</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Days Remaining</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.map((record) => {
              const countdown = getDaysRemainingInfo(record);

              return (
                <TableRow
                  key={record.id}
                  onClick={() => setSelectedRecord(record)}
                  className="cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <TableCell className="font-mono text-xs font-bold text-slate-900">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800">
                      <span>{record.serialNumber}</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="font-semibold text-slate-900 text-xs">
                      {record.itemName}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {record.brand} • {record.model}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="font-medium text-slate-900 text-xs">
                      {record.customerName}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Phone className="w-2.5 h-2.5" />
                      {record.customerPhone}
                    </div>
                  </TableCell>

                  <TableCell className="text-xs text-slate-600">
                    {formatDate(record.dispatchDate)}
                  </TableCell>

                  <TableCell>
                    <span className="text-xs font-semibold text-slate-800">
                      {record.warrantyYears} Years
                    </span>
                  </TableCell>

                  <TableCell className="text-xs text-slate-800 font-medium">
                    {formatDate(record.warrantyExpiryDate)}
                  </TableCell>

                  <TableCell>{getStatusBadge(record.status)}</TableCell>

                  <TableCell className="text-right text-xs">
                    <span className={countdown.color}>{countdown.text}</span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Warranty Detail Panel (Right Side Drawer) */}
      <Drawer
        isOpen={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        title="Component Warranty Certificate"
        description={`Serial Identifier: ${selectedRecord?.serialNumber}`}
        width="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Printer className="w-3.5 h-3.5" />}
              onClick={() => {
                showToast(
                  'Warranty Card',
                  `Digital certificate generated for ${selectedRecord?.serialNumber}`,
                  'info'
                );
              }}
            >
              Print Card
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Wrench className="w-3.5 h-3.5" />}
              onClick={() => {
                const serial = selectedRecord?.serialNumber;
                setSelectedRecord(null);
                navigate(`/service-tickets?serial=${serial}`);
              }}
            >
              Log Service Ticket
            </Button>
          </div>
        }
      >
        {selectedRecord && (
          <div className="space-y-6">
            {/* Status Highlight Banner */}
            <div
              className={`p-4 rounded-xl border flex items-center justify-between ${
                selectedRecord.status === 'ACTIVE'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : selectedRecord.status === 'EXPIRING_SOON'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-3">
                {selectedRecord.status === 'ACTIVE' ? (
                  <ShieldCheck className="w-8 h-8 text-emerald-600 shrink-0" />
                ) : selectedRecord.status === 'EXPIRING_SOON' ? (
                  <AlertTriangle className="w-8 h-8 text-amber-600 shrink-0" />
                ) : (
                  <ShieldAlert className="w-8 h-8 text-rose-600 shrink-0" />
                )}
                <div>
                  <h4 className="text-sm font-bold capitalize">
                    {selectedRecord.status === 'ACTIVE'
                      ? 'Protected Under Warranty'
                      : selectedRecord.status === 'EXPIRING_SOON'
                      ? 'Warranty Expiring Shortly'
                      : 'Warranty Expired'}
                  </h4>
                  <p className="text-xs opacity-90">
                    {getDaysRemainingInfo(selectedRecord).text}
                  </p>
                </div>
              </div>
              <Badge
                variant={
                  selectedRecord.status === 'ACTIVE'
                    ? 'emerald'
                    : selectedRecord.status === 'EXPIRING_SOON'
                    ? 'amber'
                    : 'rose'
                }
              >
                {selectedRecord.status}
              </Badge>
            </div>

            {/* Serial Barcode Tag */}
            <div className="bg-slate-900 text-white rounded-xl p-4 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-mono">
                Component Hardware Identity (UID)
              </span>
              <p className="text-xl font-mono font-bold tracking-wider text-solar-400">
                {selectedRecord.serialNumber}
              </p>
              <div className="h-6 w-full flex items-center gap-1 opacity-70 overflow-hidden">
                {Array.from({ length: 48 }).map((_, i) => (
                  <span
                    key={i}
                    className={`bg-white h-full ${i % 3 === 0 ? 'w-1' : i % 2 === 0 ? 'w-0.5' : 'w-1.5'}`}
                  />
                ))}
              </div>
            </div>

            {/* Equipment Details Card */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-solar-700" />
                Product Specification
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Product Name</span>
                  <span className="font-semibold text-slate-900">{selectedRecord.itemName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Category</span>
                  <span className="font-semibold text-slate-900">{selectedRecord.itemCategory}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Brand / OEM</span>
                  <span className="font-semibold text-slate-900">{selectedRecord.brand}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Model Number</span>
                  <span className="font-semibold text-slate-900">{selectedRecord.model}</span>
                </div>
              </div>
            </div>

            {/* Customer & Installation Details */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-solar-700" />
                Customer & Deployment
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Customer Name</span>
                  <span className="font-semibold text-slate-900">{selectedRecord.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Phone Contact</span>
                  <span className="font-semibold text-slate-900">{selectedRecord.customerPhone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Dispatch Date</span>
                  <span className="font-semibold text-slate-900">
                    {formatDate(selectedRecord.dispatchDate)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Installation Date</span>
                  <span className="font-semibold text-slate-900">
                    {selectedRecord.installationDate
                      ? formatDate(selectedRecord.installationDate)
                      : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Warranty Period</span>
                  <span className="font-semibold text-slate-900">
                    {selectedRecord.warrantyYears} Years Coverage
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Expiry Date</span>
                  <span className="font-semibold text-slate-900">
                    {formatDate(selectedRecord.warrantyExpiryDate)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
