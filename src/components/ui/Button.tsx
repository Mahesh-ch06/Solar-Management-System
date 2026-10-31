import React from 'react';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'amber';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<string, string> = {
  primary:
    'bg-[#f59e0b] text-slate-950 font-semibold hover:bg-[#d97706] active:bg-[#b45309] shadow-xs focus:ring-[#f59e0b]/40 border border-transparent',
  secondary:
    'bg-slate-100 text-slate-800 font-semibold hover:bg-slate-200 active:bg-slate-300 shadow-xs focus:ring-slate-400/20 border border-slate-200',
  outline:
    'bg-white text-slate-700 font-medium hover:bg-slate-50 active:bg-slate-100 border border-slate-300 shadow-xs focus:ring-slate-400/20',
  ghost:
    'bg-transparent text-slate-600 font-medium hover:bg-slate-100 active:bg-slate-200 hover:text-slate-900 focus:ring-slate-400/20 border border-transparent',
  danger:
    'bg-rose-600 text-white font-medium hover:bg-rose-700 active:bg-rose-800 shadow-xs focus:ring-rose-500/30 border border-transparent',
  amber:
    'bg-[#f59e0b] text-slate-950 font-semibold hover:bg-[#d97706] active:bg-[#b45309] shadow-xs focus:ring-[#f59e0b]/40 border border-transparent',
};

const sizeStyles: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs font-medium rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm font-medium rounded-lg gap-2',
  lg: 'px-5 py-2.5 text-base font-medium rounded-xl gap-2.5',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center transition-all duration-150 select-none cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-offset-1',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
