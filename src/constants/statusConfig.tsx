import React from 'react';
import { cn } from '../utils/cn';

// Generic status badge lookup maps used across all modules
export const ENQUIRY_STATUS_CONFIG: Record<string, { label: string; variant: 'sky' | 'purple' | 'amber' | 'emerald' | 'rose' | 'slate' }> = {
  NEW: { label: 'New', variant: 'sky' },
  CONTACTED: { label: 'Contacted', variant: 'purple' },
  SURVEY_SCHEDULED: { label: 'Survey Scheduled', variant: 'amber' },
  SURVEY_DONE: { label: 'Survey Done', variant: 'amber' },
  QUOTATION_SENT: { label: 'Quotation Sent', variant: 'sky' },
  CONVERTED: { label: 'Converted', variant: 'emerald' },
  CLOSED_LOST: { label: 'Closed/Lost', variant: 'rose' },
};

export const SURVEY_STATUS_CONFIG: Record<string, { label: string; variant: 'sky' | 'amber' | 'emerald' | 'rose' | 'slate' }> = {
  PENDING: { label: 'Pending', variant: 'slate' },
  SCHEDULED: { label: 'Scheduled', variant: 'sky' },
  COMPLETED: { label: 'Completed', variant: 'amber' },
  APPROVED: { label: 'Approved', variant: 'emerald' },
  REJECTED: { label: 'Rejected', variant: 'rose' },
};

export const QUOTATION_STATUS_CONFIG: Record<string, { label: string; variant: 'slate' | 'sky' | 'emerald' | 'rose' | 'purple' | 'amber' }> = {
  DRAFT: { label: 'Draft', variant: 'slate' },
  SENT: { label: 'Sent', variant: 'sky' },
  APPROVED: { label: 'Approved', variant: 'emerald' },
  REJECTED: { label: 'Rejected', variant: 'rose' },
  CONVERTED_TO_ORDER: { label: 'Converted', variant: 'purple' },
  EXPIRED: { label: 'Expired', variant: 'rose' },
};

export const DISPATCH_STATUS_CONFIG: Record<string, { label: string; variant: 'slate' | 'amber' | 'sky' | 'emerald' | 'purple' }> = {
  DRAFT: { label: 'Draft', variant: 'slate' },
  PENDING_SERIAL: { label: 'Pending Serials', variant: 'amber' },
  READY: { label: 'Ready to Dispatch', variant: 'sky' },
  DISPATCHED: { label: 'Dispatched', variant: 'purple' },
  DELIVERED: { label: 'Delivered', variant: 'emerald' },
};

export const WARRANTY_STATUS_CONFIG: Record<string, { label: string; variant: 'emerald' | 'amber' | 'rose' }> = {
  ACTIVE: { label: 'Active', variant: 'emerald' },
  EXPIRING_SOON: { label: 'Expiring Soon', variant: 'amber' },
  EXPIRED: { label: 'Expired', variant: 'rose' },
};

export const TICKET_STATUS_CONFIG: Record<string, { label: string; variant: 'slate' | 'sky' | 'amber' | 'emerald' | 'rose' }> = {
  OPEN: { label: 'Open', variant: 'sky' },
  ASSIGNED: { label: 'Assigned', variant: 'amber' },
  IN_PROGRESS: { label: 'In Progress', variant: 'amber' },
  RESOLVED: { label: 'Resolved', variant: 'emerald' },
  CLOSED: { label: 'Closed', variant: 'slate' },
};

export const TICKET_PRIORITY_CONFIG: Record<string, { label: string; variant: 'slate' | 'sky' | 'amber' | 'rose' }> = {
  LOW: { label: 'Low', variant: 'slate' },
  MEDIUM: { label: 'Medium', variant: 'sky' },
  HIGH: { label: 'High', variant: 'amber' },
  CRITICAL: { label: 'Critical', variant: 'rose' },
};

// List of solar technicians
export const SOLAR_TECHNICIANS = [
  { id: 'tech-01', name: 'Manoj Kumar' },
  { id: 'tech-02', name: 'Deepak Joshi' },
  { id: 'tech-03', name: 'Amit Rawat' },
  { id: 'tech-04', name: 'Vikas Singh' },
  { id: 'tech-05', name: 'Rohit Verma' },
  { id: 'tech-06', name: 'Pawan Yadav' },
  { id: 'tech-07', name: 'Sandeep Chauhan' },
  { id: 'tech-08', name: 'Dinesh Pal' },
  { id: 'tech-09', name: 'Gaurav Bisht' },
  { id: 'tech-10', name: 'Harish Rana' },
  { id: 'tech-11', name: 'Kuldeep Negi' },
  { id: 'tech-12', name: 'Mohit Saini' },
  { id: 'tech-13', name: 'Rajinder Gill' },
  { id: 'tech-14', name: 'Suraj Thapa' },
  { id: 'tech-15', name: 'Vinod Tiwari' },
];

export const SALES_EXECUTIVES = [
  { id: 'sales-01', name: 'Vikram Mehta' },
  { id: 'sales-02', name: 'Priya Kapoor' },
  { id: 'sales-03', name: 'Rohit Gupta' },
];

// Filter tab pill group component
interface FilterTabProps {
  tabs: { key: string; label: string; count?: number }[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
}

export const FilterTabs: React.FC<FilterTabProps> = ({ tabs, active, onChange, className }) => (
  <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
    {tabs.map((tab) => (
      <button
        key={tab.key}
        onClick={() => onChange(tab.key)}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150',
          active === tab.key
            ? 'bg-amber-500 text-slate-950 font-bold border-amber-500 shadow-xs'
            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-800'
        )}
      >
        {tab.label}
        {tab.count !== undefined && (
          <span
            className={cn(
              'text-[10px] font-bold rounded-full px-1.5 py-0.5',
              active === tab.key ? 'bg-amber-600/80 text-slate-950 font-extrabold' : 'bg-slate-100 text-slate-600'
            )}
          >
            {tab.count}
          </span>
        )}
      </button>
    ))}
  </div>
);
