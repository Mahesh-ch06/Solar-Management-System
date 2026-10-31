import React from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-white rounded-xl border border-slate-200 shadow-xs transition-all duration-200 text-slate-900',
          hoverable && 'hover:border-slate-300 hover:shadow-sm cursor-pointer',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('px-5 py-4 border-b border-slate-100 flex items-center justify-between', className)}
      {...props}
    >
      {children}
    </div>
  );
});
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => {
  return (
    <h3
      ref={ref}
      className={cn('text-sm font-semibold text-slate-900 tracking-tight', className)}
      {...props}
    >
      {children}
    </h3>
  );
});
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn('text-xs text-slate-500 mt-0.5', className)}
      {...props}
    >
      {children}
    </p>
  );
});
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div ref={ref} className={cn('p-5', className)} {...props}>
      {children}
    </div>
  );
});
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 rounded-b-xl flex items-center justify-between text-slate-600', className)}
      {...props}
    >
      {children}
    </div>
  );
});
CardFooter.displayName = 'CardFooter';
