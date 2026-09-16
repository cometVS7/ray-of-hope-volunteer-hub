import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  accentColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  accentColor = 'border-l-indigo-600',
}) => {
  return (
    <div className={`bg-white rounded-lg p-5 shadow-sm border border-slate-200 border-l-4 ${accentColor}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        {icon && <div className="text-slate-400 p-2 bg-slate-50 rounded-lg">{icon}</div>}
      </div>
    </div>
  );
};

export default StatCard;
