import React from 'react';
import { X } from 'lucide-react';
import { cn, hapticFeedback } from '../../utils';

interface AddExpenseTypeSelectorProps {
  type: 'expense' | 'income' | 'transfer';
  setType: (type: 'expense' | 'income' | 'transfer') => void;
  loading: boolean;
  onClose: () => void;
  onSubmit: () => void;
  bgColor: string;
  activeTabColor: string;
}

export const AddExpenseTypeSelector: React.FC<AddExpenseTypeSelectorProps> = ({
  type,
  setType,
  loading,
  onClose,
  onSubmit,
  bgColor,
  activeTabColor,
}) => {
  return (
    <div className={cn("flex flex-col text-white transition-colors duration-300 pb-4 pt-[env(safe-area-inset-top)] shrink-0", bgColor)}>
      <div className="flex items-center justify-between p-4">
        <button
          type="button"
          onClick={() => { hapticFeedback('light'); onClose(); }}
          className="p-2 hover:bg-white/10 rounded-xl transition-colors cursor-pointer mr-1"
        >
          <X size={24} />
        </button>
        
        <div className="flex-1 text-center font-semibold text-lg">
          {type === 'expense' ? 'إضافة مصروف' : type === 'income' ? 'إضافة دخل' : 'تحويل جديد'}
        </div>
        
        <div className="w-10"></div> {/* Spacer for centering */}
      </div>

      {/* Main Tabs (إيراد / مصروف / تحويل) */}
      <div className="flex w-full px-4 mt-2 mb-1">
        <div className="flex w-full bg-black/20 p-1 rounded-2xl backdrop-blur-md">
          <button
            type="button"
            onClick={() => { hapticFeedback('light'); setType('income'); }}
            className={cn(
              "flex-1 py-2 text-sm font-semibold transition-all rounded-xl cursor-pointer",
              type === 'income' ? activeTabColor : "text-white/70 hover:text-white"
            )}
          >
            دخل
          </button>
          <button
            type="button"
            onClick={() => { hapticFeedback('light'); setType('expense'); }}
            className={cn(
              "flex-1 py-2 text-sm font-semibold transition-all rounded-xl cursor-pointer",
              type === 'expense' ? activeTabColor : "text-white/70 hover:text-white"
            )}
          >
            مصروف
          </button>
          <button
            type="button"
            onClick={() => { hapticFeedback('light'); setType('transfer'); }}
            className={cn(
              "flex-1 py-2 text-sm font-semibold transition-all rounded-xl cursor-pointer",
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
