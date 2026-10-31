import React from 'react';
import { cn } from '../../utils/cn';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumb?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  actions,
  breadcrumb,
  className,
}) => {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3', className)}>
      <div className="min-w-0">
        {breadcrumb && <div className="mb-1">{breadcrumb}</div>}
        <h1 className="text-xl font-bold tracking-tight text-slate-900 truncate">{title}</h1>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};

// Stat summary row used on most module pages
interface QuickStatProps {
  label: string;
  value: string | number;
  color?: 'slate' | 'sky' | 'emerald' | 'amber' | 'rose' | 'purple';
  onClick?: () => void;
}

const colorMap: Record<string, string> = {
  slate: 'bg-slate-50 border-slate-200 text-slate-700',
  sky: 'bg-sky-50 border-sky-200 text-sky-700',
  emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  amber: 'bg-amber-50 border-amber-200 text-amber-700',
  rose: 'bg-rose-50 border-rose-200 text-rose-700',
  purple: 'bg-purple-50 border-purple-200 text-purple-700',
};

export const QuickStat: React.FC<QuickStatProps> = ({
  label,
  value,
  color = 'slate',
  onClick,
}) => (
  <button
    onClick={onClick}
    className={cn(
      'px-4 py-2 rounded-lg border text-xs font-medium transition-all text-left',
      colorMap[color],
      onClick && 'hover:shadow-sm cursor-pointer',
      !onClick && 'cursor-default'
    )}
  >
    <span className="text-lg font-bold block leading-tight">{value}</span>
    <span className="opacity-80">{label}</span>
  </button>
);
