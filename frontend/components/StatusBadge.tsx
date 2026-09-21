import React from 'react';

interface StatusBadgeProps {
  status: string;
  className?: string;
  showDot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', showDot = true }) => {
  const normalized = status ? status.toUpperCase() : 'UNKNOWN';

  const getStyle = (s: string) => {
    switch (s) {
      case 'ASSIGNED':
        return {
          wrapper: 'bg-sky-50 text-sky-700 border-sky-200/80',
          dot: 'bg-sky-500',
        };
      case 'SUBMITTED':
      case 'PENDING':
        return {
          wrapper: 'bg-amber-50 text-amber-800 border-amber-200/80',
          dot: 'bg-amber-500',
        };
      case 'APPROVED':
      case 'ACTIVE':
        return {
          wrapper: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
          dot: 'bg-emerald-500',
        };
      case 'REJECTED':
      case 'INACTIVE':
        return {
          wrapper: 'bg-rose-50 text-rose-800 border-rose-200/80',
          dot: 'bg-rose-500',
        };
      default:
        return {
          wrapper: 'bg-slate-100 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
        };
    }
  };

  const style = getStyle(normalized);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide border ${style.wrapper} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />}
      {normalized}
    </span>
  );
};

export default StatusBadge;
