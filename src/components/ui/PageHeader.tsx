import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  subtitle, 
  action 
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8 text-right font-tajawal">
      <div className="space-y-1">
        <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[11px] md:text-xs text-slate-500 dark:text-slate-400 font-medium">
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
          {action}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
