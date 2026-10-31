import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Mail,
  Send,
  Award,
  Check,
  Copy,
  QrCode,
} from 'lucide-react';
import { warrantyService } from './services/warrantyService';
import { WarrantyRecord, WarrantyStatus } from '../../types/operations';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Drawer } from '../../components/ui/Drawer';
import { Modal } from '../../components/ui/Modal';
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
import { emailService } from '../../services/emailService';
import { customers } from '../../store/inMemoryDb';

type StatusFilter = 'ALL' | WarrantyStatus;

export const WarrantyPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('serial') || '');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('ALL');
  const [selectedRecord, setSelectedRecord] = useState<WarrantyRecord | null>(null);

  // Digital Warranty Certificate Modal State
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [certificateRecord, setCertificateRecord] = useState<WarrantyRecord | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [copiedSerial, setCopiedSerial] = useState<string | null>(null);

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
        record.model.toLowerCase().includes(q) ||
        (record.customerPhone && record.customerPhone.includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [records, selectedStatus, searchQuery]);

  // Helper to resolve customer email from database or phone
  const getCustomerEmail = (record: WarrantyRecord): string => {
    if (record.customerEmail) return record.customerEmail;
    const match = customers.find(
      (c) => c.id === record.customerId || c.phone === record.customerPhone
    );
    if (match?.email) return match.email;
    const cleanPhone = record.customerPhone ? record.customerPhone.replace(/\D/g, '') : 'client';
    return `${cleanPhone}@customer.sunpower.in`;
  };

  // Copy Serial Number to clipboard
  const handleCopySerial = (serial: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(serial);
    setCopiedSerial(serial);
    showToast('Copied', `Serial ${serial} copied to clipboard`, 'info', 1500);
    setTimeout(() => setCopiedSerial(null), 2500);
  };

  // Open Certificate Modal
  const handleOpenCertificate = (record: WarrantyRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCertificateRecord(record);
    setRecipientEmail(getCustomerEmail(record));
    setIsCertificateModalOpen(true);
  };

  // Dispatch Warranty Certificate via EmailJS
  const handleSendCertificateEmail = async (record: WarrantyRecord, emailAddress?: string) => {
    const toEmail = (emailAddress || recipientEmail || getCustomerEmail(record)).trim();
    if (!toEmail) {
      showToast('Validation Error', 'Please enter a valid customer email address.', 'error');
      return;
    }

    try {
      setIsSendingEmail(true);
      const res = await emailService.notifyWarrantyCertificate({
        toEmail,
        customerName: record.customerName,
        serialNumber: record.serialNumber,
        itemName: record.itemName,
        itemCategory: record.itemCategory,
        brand: record.brand,
        model: record.model,
        warrantyYears: record.warrantyYears,
        warrantyExpiryDate: formatDate(record.warrantyExpiryDate),
        dispatchDate: formatDate(record.dispatchDate),
        status: record.status,
      });

      if (res.isSimulatedFallback) {
        showToast(
          'Email Queued (Simulated)',
          `Warranty certificate for ${record.serialNumber} queued for ${toEmail}. Set VITE_EMAILJS_* in .env to send via live server.`,
          'info'
        );
      } else {
        showToast(
          'Certificate Emailed',
          `Official warranty certificate for ${record.serialNumber} dispatched to ${toEmail} via EmailJS.`,
          'success'
        );
      }
      setIsCertificateModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to dispatch email';
      showToast('Email Error', msg, 'error');
    } finally {
      setIsSendingEmail(false);
    }
  };

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
            Active Protection
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
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Warranty & Serial Registry
            </h1>
            <Badge variant="amber" size="sm" className="font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-amber-600" />
              OEM Protection Ledger
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Global repository of customer-assigned serial numbers, active warranty lifespans, digital certificates, and automated EmailJS dispatches.
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
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-amber-600' : ''}`} />}
            className="border-slate-200"
          >
            Sync Registry
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs border-l-4 border-l-emerald-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Active Warranties
            </p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">
              {isLoading ? <Skeleton className="h-7 w-16" /> : summaryMetrics.totalActive}
            </h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Fully covered under OEM SLA
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs border-l-4 border-l-amber-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Expiring in 60 Days
            </p>
            <h3 className="text-2xl font-extrabold text-amber-600 mt-1 font-mono">
              {isLoading ? <Skeleton className="h-7 w-16" /> : summaryMetrics.expiringSoon}
            </h3>
            <p className="text-[11px] text-amber-700 font-semibold mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Eligible for AMC extension
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs border-l-4 border-l-rose-500 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Expired This Year
            </p>
            <h3 className="text-2xl font-extrabold text-rose-600 mt-1 font-mono">
              {isLoading ? <Skeleton className="h-7 w-16" /> : summaryMetrics.expiredThisYear}
            </h3>
            <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" /> Requires billable repairs
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Input
              className="text-sm py-2.5 pl-10 shadow-inner bg-slate-50/60 border-slate-200 focus:bg-white"
              placeholder="Search by Serial UID (e.g. INV-2026-GW-50912), Customer Name, Phone, Brand, or Model..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-700"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 whitespace-nowrap">
              Showing <strong>{filteredRecords.length}</strong> of {records.length} records
            </span>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
            Filter:
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
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  selectedStatus === tab
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
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
                      ? 'bg-amber-600 text-slate-950'
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
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
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
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80">
                <TableHead>Serial UID</TableHead>
                <TableHead>Equipment & OEM</TableHead>
                <TableHead>Customer / Contact</TableHead>
                <TableHead>Dispatch Date</TableHead>
                <TableHead>Warranty SLA</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record) => {
                const countdown = getDaysRemainingInfo(record);
                const isCopied = copiedSerial === record.serialNumber;

                return (
                  <TableRow
                    key={record.id}
                    onClick={() => setSelectedRecord(record)}
                    className="cursor-pointer hover:bg-amber-50/30 transition-colors"
                  >
                    {/* Serial UID with copy button */}
                    <TableCell className="font-mono text-xs font-bold text-slate-900">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 group">
                        <span className="font-mono">{record.serialNumber}</span>
                        <button
                          type="button"
                          onClick={(e) => handleCopySerial(record.serialNumber, e)}
                          title="Copy serial number"
                          className="text-slate-400 hover:text-amber-600 transition-colors cursor-pointer"
                        >
                          {isCopied ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </TableCell>

                    {/* Product & OEM */}
                    <TableCell>
                      <div className="font-bold text-slate-900 text-xs">
                        {record.itemName}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                          {record.brand}
                        </span>
                        <span>•</span>
                        <span>{record.model}</span>
                      </div>
                    </TableCell>

                    {/* Customer */}
                    <TableCell>
                      <div className="font-semibold text-slate-900 text-xs">
                        {record.customerName}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Phone className="w-2.5 h-2.5 text-slate-400" />
                          {record.customerPhone}
                        </span>
                      </div>
                    </TableCell>

                    {/* Dispatch Date */}
                    <TableCell className="text-xs text-slate-600">
                      {formatDate(record.dispatchDate)}
                    </TableCell>

                    {/* Warranty Period */}
                    <TableCell>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 font-mono">
                        <Award className="w-3 h-3 text-amber-600" />
                        {record.warrantyYears} Years
                      </span>
                    </TableCell>

                    {/* Expiry Date */}
                    <TableCell className="text-xs text-slate-800 font-medium">
                      <div>{formatDate(record.warrantyExpiryDate)}</div>
                      <div className={`text-[11px] mt-0.5 ${countdown.color}`}>
                        {countdown.text}
                      </div>
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell>{getStatusBadge(record.status)}</TableCell>

                    {/* Actions Column */}
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Email Certificate button (EmailJS) */}
                        <Button
                          variant="outline"
                          size="sm"
                          title="Email digital warranty certificate to customer via EmailJS"
                          leftIcon={<Mail className="w-3.5 h-3.5 text-amber-600" />}
                          onClick={() => handleOpenCertificate(record)}
                          className="h-8 px-2.5 text-xs hover:border-amber-400 hover:bg-amber-50/60"
                        >
                          Certificate
                        </Button>

                        {/* Service Ticket button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Log a warranty service ticket for this serial"
                          leftIcon={<Wrench className="w-3.5 h-3.5 text-slate-600" />}
                          onClick={() => navigate(`/service-tickets?serial=${record.serialNumber}`)}
                          className="h-8 px-2 text-xs text-slate-600 hover:text-slate-900"
                        >
                          Ticket
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Digital Warranty Certificate Modal (with EmailJS Dispatch) */}
      {isCertificateModalOpen && certificateRecord && (
        <Modal
          isOpen={isCertificateModalOpen}
          onClose={() => setIsCertificateModalOpen(false)}
          title="Digital OEM Warranty Certificate"
          description={`Official solar hardware warranty credential issued for ${certificateRecord.customerName}`}
          size="lg"
          footer={
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Printer className="w-3.5 h-3.5" />}
                onClick={() => window.print()}
              >
                Print / Save PDF
              </Button>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCertificateModalOpen(false)}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={isSendingEmail}
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                  onClick={() => handleSendCertificateEmail(certificateRecord, recipientEmail)}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                >
                  Send via EmailJS
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-5">
            {/* Certificate Canvas / Card View */}
            <div className="p-6 rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50/50 via-white to-orange-50/40 relative shadow-xs">
              {/* Watermark / Seal */}
              <div className="flex items-start justify-between border-b border-amber-200/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xl shadow-xs">
                    ☀️
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                      SunPower Solutions ERP
                    </h3>
                    <p className="text-[11px] font-bold text-amber-700 uppercase tracking-widest">
                      OEM Hardware Limited Warranty Certificate
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                    Certificate UID
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-800">
                    CERT-SP-2026-{certificateRecord.serialNumber.replace(/\D/g, '').slice(-5) || '88102'}
                  </span>
                </div>
              </div>

              {/* Certificate Body */}
              <div className="py-4 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-xl bg-white/80 border border-amber-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      Registered Customer
                    </span>
                    <p className="text-sm font-bold text-slate-900 mt-0.5">
                      {certificateRecord.customerName}
                    </p>
                    <p className="text-[11px] text-slate-500">Phone: {certificateRecord.customerPhone}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-white/80 border border-amber-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      Hardware Identity (Serial UID)
                    </span>
                    <p className="text-sm font-mono font-bold text-amber-800 mt-0.5">
                      {certificateRecord.serialNumber}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {certificateRecord.brand} • {certificateRecord.model}
                    </p>
                  </div>
                </div>

                {/* Hardware Specification */}
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{certificateRecord.itemName}</span>
                    <Badge variant="emerald" size="sm">
                      {certificateRecord.warrantyYears} Years Coverage
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 text-slate-600 border-t border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Dispatch Date</span>
                      <span className="font-semibold">{formatDate(certificateRecord.dispatchDate)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Valid Until</span>
                      <span className="font-semibold text-emerald-700">
                        {formatDate(certificateRecord.warrantyExpiryDate)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">SLA Support</span>
                      <span className="font-semibold text-slate-800">48-Hr On-Site Service</span>
                    </div>
                  </div>
                </div>

                {/* Simulated Barcode Banner */}
                <div className="pt-2 flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                      Machine Readable UID Verification Barcode
                    </span>
                    <div className="h-6 flex items-center gap-1 opacity-90 overflow-hidden">
                      {Array.from({ length: 42 }).map((_, i) => (
                        <span
                          key={i}
                          className={`bg-slate-800 h-full ${
                            i % 4 === 0 ? 'w-1.5' : i % 3 === 0 ? 'w-1' : 'w-0.5'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-white border border-slate-300 rounded-lg flex items-center justify-center text-slate-700">
                    <QrCode className="w-8 h-8" />
                  </div>
                </div>
              </div>
            </div>

            {/* EmailJS Dispatch Box */}
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-700" />
                <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                  EmailJS Customer Dispatch
                </h4>
              </div>
              <p className="text-xs text-slate-600">
                Send this official warranty certificate with serial UID, coverage terms, and digital claim link directly to the customer's verified inbox:
              </p>
              <div className="flex items-center gap-2">
                <Input
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="customer@email.com"
                  className="bg-white border-amber-300 text-slate-900 text-xs py-2"
                />
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={isSendingEmail}
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                  onClick={() => handleSendCertificateEmail(certificateRecord, recipientEmail)}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shrink-0"
                >
                  Send Certificate
                </Button>
              </div>
            </div>
          </div>
        </Modal>
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
                if (selectedRecord) {
                  handleOpenCertificate(selectedRecord);
                }
              }}
            >
              Open Certificate
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
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
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

            {/* Quick Email Dispatch Box */}
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-600" />
                  Email Warranty Certificate
                </span>
                <span className="text-[10px] font-mono text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                  EmailJS
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                Dispatch an official warranty credential with serial UID and OEM terms to customer email:
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center bg-white border-amber-300 text-amber-900 font-bold hover:bg-amber-100/70"
                leftIcon={<Send className="w-3.5 h-3.5 text-amber-600" />}
                onClick={() => handleOpenCertificate(selectedRecord)}
              >
                Open & Email Certificate ({getCustomerEmail(selectedRecord)})
              </Button>
            </div>

            {/* Serial Barcode Tag */}
            <div className="bg-slate-50 border border-slate-200 text-slate-900 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-mono font-bold">
                  Component Hardware Identity (UID)
                </span>
                <button
                  type="button"
                  onClick={() => handleCopySerial(selectedRecord.serialNumber)}
                  className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  Copy UID
                </button>
              </div>
              <p className="text-xl font-mono font-bold tracking-wider text-amber-700">
                {selectedRecord.serialNumber}
              </p>
              <div className="h-6 w-full flex items-center gap-1 opacity-80 overflow-hidden">
                {Array.from({ length: 48 }).map((_, i) => (
                  <span
                    key={i}
                    className={`bg-slate-800 h-full ${
                      i % 3 === 0 ? 'w-1' : i % 2 === 0 ? 'w-0.5' : 'w-1.5'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Equipment Details Card */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-amber-600" />
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
                <User className="w-3.5 h-3.5 text-amber-600" />
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
                  <span className="text-slate-400 block">Customer Email</span>
                  <span className="font-semibold text-slate-900 truncate block">
                    {getCustomerEmail(selectedRecord)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Dispatch Date</span>
                  <span className="font-semibold text-slate-900">
                    {formatDate(selectedRecord.dispatchDate)}
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
