import React from 'react';
import { cn } from '../../utils/cn';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

export interface ToastProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-600" />,
  error: <AlertCircle className="w-5 h-5 text-rose-600" />,
  info: <Info className="w-5 h-5 text-sky-600" />,
};

const borderColors: Record<ToastType, string> = {
  success: 'border-emerald-200 bg-emerald-50/50',
  warning: 'border-amber-200 bg-amber-50/50',
  error: 'border-rose-200 bg-rose-50/50',
  info: 'border-sky-200 bg-sky-50/50',
};

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  return (
    <div
      className={cn(
        'w-80 pointer-events-auto rounded-xl border p-4 shadow-lg bg-white backdrop-blur-md transition-all duration-200 flex items-start gap-3',
        borderColors[toast.type]
      )}
    >
      <div className="shrink-0 mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <h5 className="text-sm font-semibold text-slate-900 leading-tight">
          {toast.title}
        </h5>
        {toast.message && (
          <p className="text-xs text-slate-600 mt-1 leading-normal">
            {toast.message}
          </p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
