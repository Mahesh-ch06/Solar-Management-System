import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'emerald' | 'amber' | 'rose' | 'sky' | 'slate' | 'purple' | 'solar';
  size?: 'sm' | 'md';
  dot?: boolean;
}

const variantStyles: Record<string, string> = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 font-medium',
  amber: 'bg-amber-50 text-amber-800 border-amber-200/80 font-medium',
  rose: 'bg-rose-50 text-rose-700 border-rose-200/80 font-medium',
  sky: 'bg-sky-50 text-sky-700 border-sky-200/80 font-medium',
  slate: 'bg-slate-100 text-slate-700 border-slate-200 font-medium',
  purple: 'bg-purple-50 text-purple-700 border-purple-200/80 font-medium',
  solar: 'bg-amber-50 text-amber-900 border-amber-300 font-semibold',
};

const dotColors: Record<string, string> = {
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  sky: 'bg-sky-500',
  slate: 'bg-slate-400',
  purple: 'bg-purple-500',
  solar: 'bg-amber-500',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'slate',
  size = 'md',
  dot = false,
  className,
  ...props
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium border rounded-full transition-colors',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full mr-1.5 shrink-0',
            dotColors[variant]
          )}
        />
      )}
      {children}
    </span>
  );
};
