import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  subtitle, 
  badge,
  action 
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5 mb-5 md:mb-6 text-right font-tajawal">
      <div className="space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight [text-wrap:balance]">
            {title}
          </h1>
          {badge && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
          {action}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
