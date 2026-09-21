import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: string;
  colorScheme?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  colorScheme = 'indigo',
}) => {
  const schemeStyles = {
    indigo: {
      border: 'hover:border-indigo-300',
      iconBg: 'bg-indigo-50 text-indigo-600',
      glow: 'group-hover:text-indigo-600',
    },
    emerald: {
      border: 'hover:border-emerald-300',
      iconBg: 'bg-emerald-50 text-emerald-600',
      glow: 'group-hover:text-emerald-600',
    },
    amber: {
      border: 'hover:border-amber-300',
      iconBg: 'bg-amber-50 text-amber-600',
      glow: 'group-hover:text-amber-600',
    },
    rose: {
      border: 'hover:border-rose-300',
      iconBg: 'bg-rose-50 text-rose-600',
      glow: 'group-hover:text-rose-600',
    },
    sky: {
      border: 'hover:border-sky-300',
      iconBg: 'bg-sky-50 text-sky-600',
      glow: 'group-hover:text-sky-600',
    },
  };

  const currentScheme = schemeStyles[colorScheme];

  return (
    <div
      className={`group bg-white rounded-2xl p-5 border border-slate-200/90 shadow-mooney-card card-dimensional transition-all duration-200 ${currentScheme.border}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-3xl font-extrabold text-slate-900 tracking-tight transition-colors ${currentScheme.glow}`}>
              {value}
            </span>
            {trend && (
              <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full">
                {trend}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-500 mt-1.5 font-medium">{subtitle}</p>}
        </div>

        {icon && (
          <div className={`p-3 rounded-xl ${currentScheme.iconBg} shadow-xs transition-transform duration-200 group-hover:scale-110`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
