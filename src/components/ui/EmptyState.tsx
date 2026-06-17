import React from 'react';
import { LucideIcon } from 'lucide-react';
import { hapticFeedback } from '../../utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4 bg-white/40 dark:bg-slate-900/20 backdrop-blur-md rounded-card border-2 border-dashed border-slate-100 dark:border-slate-800/80 mx-auto w-full max-w-lg transition-all duration-300">
      <div className="w-14 h-14 rounded-button bg-slate-50 dark:bg-slate-800/50 border border-slate-100/50 dark:border-slate-800 flex items-center justify-center text-slate-400 mb-4 shrink-0 shadow-inner">
        <Icon className="size-7 text-slate-400 dark:text-slate-500" />
      </div>
      <h3 className="text-sm md:text-base font-black text-slate-900 dark:text-white mb-1.5 uppercase tracking-tight font-tajawal">
        {title}
      </h3>
      <p className="text-[11px] md:text-xs text-slate-500 dark:text-slate-400 font-medium max-w-xs mx-auto leading-relaxed mb-5 font-tajawal">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={() => {
            hapticFeedback('medium');
            onAction();
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-button bg-primary-500 hover:bg-primary-600 active:scale-95 text-white text-xs font-black shadow-md shadow-primary-500/10 transition-all cursor-pointer font-tajawal hover:scale-[1.01] motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
        >
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
};

export default EmptyState;
