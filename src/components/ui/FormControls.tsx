import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface SearchInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  className,
}) => (
  <div className={cn('relative flex items-center', className)}>
    <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-white text-sm text-slate-900 placeholder:text-slate-400 rounded-lg border border-slate-300 pl-9 pr-9 py-2 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all shadow-xs"
    />
    {value && (
      <button
        onClick={() => onChange('')}
        className="absolute right-3 text-slate-400 hover:text-slate-600"
      >
        <X className="w-4 h-4" />
      </button>
    )}
  </div>
);

// Confirm dialog
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 animate-fade-in text-slate-900">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-600 mt-2 leading-relaxed">{message}</p>
        <div className="flex items-center justify-end gap-2.5 mt-5">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              'px-4 py-2 text-xs font-semibold rounded-lg text-white transition-colors',
              variant === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// Status change dropdown component
interface StatusDropdownProps {
  currentStatus: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

export const StatusDropdown: React.FC<StatusDropdownProps> = ({
  currentStatus,
  options,
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const current = options.find(o => o.value === currentStatus);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs px-2.5 py-1 rounded border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-1 transition-colors shadow-xs"
      >
        {current?.label || currentStatus}
        <svg className="w-3 h-3 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 min-w-[160px]">
            {options.filter(o => o.value !== currentStatus).map(option => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
