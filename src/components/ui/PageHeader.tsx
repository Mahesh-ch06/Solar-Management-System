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
        {breadcrumb && <div className="mb-1 text-xs text-slate-500 font-medium">{breadcrumb}</div>}
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 truncate">{title}</h1>
        {subtitle && (
          <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
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
  slate: 'bg-white border-slate-200 text-slate-800',
  sky: 'bg-sky-50/80 border-sky-200 text-sky-900',
  emerald: 'bg-emerald-50/80 border-emerald-200 text-emerald-900',
  amber: 'bg-amber-50/80 border-amber-200 text-amber-950',
  rose: 'bg-rose-50/80 border-rose-200 text-rose-900',
  purple: 'bg-purple-50/80 border-purple-200 text-purple-900',
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
      'px-4 py-2.5 rounded-xl border text-xs font-medium transition-all text-left shadow-xs',
      colorMap[color],
      onClick && 'hover:border-slate-300 hover:shadow-sm cursor-pointer',
      !onClick && 'cursor-default'
    )}
  >
    <span className="text-xl font-bold block leading-tight text-slate-900 font-mono">{value}</span>
    <span className="text-xs text-slate-600 mt-0.5 block">{label}</span>
  </button>
);
