import React from 'react';
import { Delete, ChevronLeft } from 'lucide-react';
import { cn } from '../utils';

interface NumericKeypadProps {
  onPress: (value: string) => void;
  onDelete: () => void;
  onClear: () => void;
  className?: string;
  type?: 'expense' | 'income' | 'transfer';
  hideQuickAdd?: boolean;
  variant?: 'default' | 'glass';
}

const NumericKeypad: React.FC<NumericKeypadProps> = ({ onPress, onDelete, onClear, className, type = 'expense', hideQuickAdd = false, variant = 'default' }) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'delete'];
  const quickAdds = type === 'expense' ? ['+5', '+10', '+50', '+100'] : ['+100', '+500', '+1000', '+5000'];

  return (
    <div className={cn("w-full max-w-md mx-auto space-y-4", className)}>
      {/* Quick Add Buttons - Modern Pill Style */}
      {!hideQuickAdd && (
        <div className="grid grid-cols-4 gap-3">
          {quickAdds.map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => onPress(val)}
              className={cn(
                "py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 border",
                variant === 'glass'
                  ? "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border-white/10"
                  : "bg-slate-100 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 border-slate-200/50 dark:border-slate-700/30"
              )}
            >
              {val}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {keys.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              if (key === 'delete') onDelete();
              else onPress(key);
            }}
            className={cn(
              "h-14 md:h-16 rounded-[2rem] flex items-center justify-center text-2xl md:text-3xl font-black transition-all active:scale-90 select-none touch-manipulation relative overflow-hidden group",
              variant === 'glass'
                ? key === 'delete'
                  ? "bg-white/5 text-white/40 hover:text-rose-400 border border-transparent"
                  : "bg-white/10 text-white border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:bg-white/20"
                : key === 'delete'
                  ? "bg-slate-100 dark:bg-slate-800/40 text-slate-400 hover:text-rose-500 border border-transparent" 
                  : "bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-2 border-slate-100 dark:border-slate-800/50 shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:border-slate-200 dark:hover:border-slate-700"
            )}
          >
            {/* Button Tap Effect */}
            <div className={cn(
              "absolute inset-0 opacity-0 group-active:opacity-100 transition-opacity",
              variant === 'glass' ? "bg-white/10" : "bg-slate-900/5 dark:bg-white/5"
            )} />
            
            {key === 'delete' ? (
              <Delete size={24} />
            ) : (
              <span className="relative z-10">{key}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default NumericKeypad;
