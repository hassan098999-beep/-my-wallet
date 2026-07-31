import React from 'react';
import { X, Check, Zap } from 'lucide-react';
import { cn, hapticFeedback } from '../../utils';

interface AddExpenseTypeSelectorProps {
  type: 'expense' | 'income' | 'transfer';
  setType: (type: 'expense' | 'income' | 'transfer') => void;
  inputMode: 'quick' | 'calculator';
  setInputMode: (mode: 'quick' | 'calculator') => void;
  loading: boolean;
  onClose: () => void;
  onSubmit: () => void;
  bgColor: string;
  activeTabColor: string;
}

export const AddExpenseTypeSelector: React.FC<AddExpenseTypeSelectorProps> = ({
  type,
  setType,
  inputMode,
  setInputMode,
  loading,
  onClose,
  onSubmit,
  bgColor,
  activeTabColor,
}) => {
  return (
    <div className={cn("flex flex-col text-white transition-colors duration-300 pb-3 pt-[env(safe-area-inset-top)] shrink-0", bgColor)}>
      <div className="flex items-center justify-between p-4">
        <button
          type="button"
          onClick={() => { hapticFeedback('light'); onClose(); }}
          className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer mr-1"
        >
          <X size={24} />
        </button>
        
        {/* Mode Shifter Segmented Control inside Header */}
        <div className="inline-flex bg-black/20 p-0.5 rounded-xl border border-white/5 mx-auto shrink-0 select-none">
          <button
            type="button"
            onClick={() => { 
              hapticFeedback('light'); 
              setInputMode('quick'); 
              localStorage.setItem('masarifi_input_mode', 'quick'); 
            }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer",
              inputMode === 'quick' 
                ? "bg-white text-slate-900 shadow-sm" 
                : "text-white/70 hover:text-white"
            )}
          >
            <Zap size={11} className={cn("shrink-0", inputMode === 'quick' ? "text-amber-500 fill-amber-500" : "")} />
            <span>إدخال سريع⚡</span>
          </button>
          <button
            type="button"
            onClick={() => { 
              hapticFeedback('light'); 
              setInputMode('calculator'); 
              localStorage.setItem('masarifi_input_mode', 'calculator'); 
            }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer",
              inputMode === 'calculator' 
                ? "bg-white text-slate-900 shadow-sm" 
                : "text-white/70 hover:text-white"
            )}
          >
            <span className="shrink-0 text-[10px]">🧮</span>
            <span>آلة حاسبة</span>
          </button>
        </div>
      </div>

      {/* Main Tabs (إيراد / مصروف / تحويل) */}
      <div className="flex w-full px-4 mb-1">
        <div className="flex w-full bg-black/20 p-1 rounded-2xl backdrop-blur-md">
          <button
            type="button"
            onClick={() => { hapticFeedback('light'); setType('income'); }}
            className={cn(
              "flex-1 py-1.5 text-xs sm:text-sm font-semibold transition-all rounded-xl cursor-pointer",
              type === 'income' ? activeTabColor : "text-white/70 hover:text-white"
            )}
          >
            دخل
          </button>
          <button
            type="button"
            onClick={() => { hapticFeedback('light'); setType('expense'); }}
            className={cn(
              "flex-1 py-1.5 text-xs sm:text-sm font-semibold transition-all rounded-xl cursor-pointer",
              type === 'expense' ? activeTabColor : "text-white/70 hover:text-white"
            )}
          >
            مصروف
          </button>
          <button
            type="button"
            onClick={() => { hapticFeedback('light'); setType('transfer'); }}
            className={cn(
              "flex-1 py-1.5 text-xs sm:text-sm font-semibold transition-all rounded-xl cursor-pointer",
              type === 'transfer' ? activeTabColor : "text-white/70 hover:text-white"
            )}
          >
            تحويل
          </button>
        </div>
      </div>
    </div>
  );
};
