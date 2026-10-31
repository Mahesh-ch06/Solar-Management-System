import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { cn } from '../../../utils/cn';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
  trend?: {
    value: number;
    label?: string;
    isPositiveGood?: boolean;
  };
  accentColor?: 'solar' | 'emerald' | 'amber' | 'rose' | 'sky' | 'purple';
  onClick?: () => void;
}

const accentStyles = {
  solar: {
    iconBg: 'bg-amber-50 text-amber-700 border border-amber-200',
    cardBorder: 'border-l-4 border-l-amber-500',
  },
  emerald: {
    iconBg: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    cardBorder: 'border-l-4 border-l-emerald-500',
  },
  amber: {
    iconBg: 'bg-amber-50 text-amber-700 border border-amber-200',
    cardBorder: 'border-l-4 border-l-amber-500',
  },
  rose: {
    iconBg: 'bg-rose-50 text-rose-700 border border-rose-200',
    cardBorder: 'border-l-4 border-l-rose-500',
  },
  sky: {
    iconBg: 'bg-sky-50 text-sky-700 border border-sky-200',
    cardBorder: 'border-l-4 border-l-sky-500',
  },
  purple: {
    iconBg: 'bg-purple-50 text-purple-700 border border-purple-200',
    cardBorder: 'border-l-4 border-l-purple-500',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  subtitle,
  trend,
  accentColor = 'solar',
  onClick,
}) => {
  const styles = accentStyles[accentColor];

  return (
    <Card
      hoverable
      onClick={onClick}
      className={cn(
        'p-5 transition-all duration-200 cursor-default bg-white border-slate-200 shadow-xs hover:shadow-sm',
        styles.cardBorder,
        onClick && 'cursor-pointer hover:border-slate-300'
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <h4 className="text-2xl font-bold text-slate-900 mt-1.5 tracking-tight font-mono">
            {value}
          </h4>
        </div>
        <div className={cn('p-2.5 rounded-xl shrink-0', styles.iconBg)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          {trend ? (
            <div className="flex items-center gap-1 font-semibold">
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-medium',
                  trend.value >= 0
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-rose-50 text-rose-700'
                )}
              >
                {trend.value >= 0 ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                )}
                {Math.abs(trend.value)}%
              </span>
              <span className="text-slate-500 font-normal text-[11px] ml-1">
                {trend.label || 'vs last month'}
              </span>
            </div>
          ) : (
            <div />
          )}

          {subtitle && (
            <span className="text-slate-500 text-[11px] font-medium">{subtitle}</span>
          )}
        </div>
      )}
    </Card>
  );
};
