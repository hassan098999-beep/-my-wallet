import React from 'react';
import { motion, useMotionValue, useTransform } from 'motion/react';
import { parseISO, format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Edit2, Repeat, Trash2, ArrowRightLeft } from 'lucide-react';
import { DynamicIcon } from './DynamicIcon';
import { formatCurrency, cn, hapticFeedback } from '../utils';
import { Expense, Category } from '../types';

interface SwipeableTransactionItemProps {
  expense: Expense;
  category: Category | undefined;
  currency: string;
  accountName?: string;
  onDelete: () => void;
  onRepeat: () => void;
  onEdit: () => void;
}

const SwipeableTransactionItem: React.FC<SwipeableTransactionItemProps> = ({ 
  expense, 
  category, 
  currency, 
  accountName,
  onDelete,
  onRepeat,
  onEdit
}) => {
  const x = useMotionValue(0);
  
  const formatExpenseDate = (dateString?: string) => {
    if (!dateString) return 'تاريخ غير محدد';
    try {
      const parsed = parseISO(dateString);
      if (!isNaN(parsed.getTime())) {
        return format(parsed, 'dd MMM', { locale: ar });
      }
    } catch (err) {
      console.error('Invalid date format:', dateString, err);
    }
    return dateString || 'تاريخ غير محدد';
  };
  
  // Dynamic action values based on drag gesture
  const opacity = useTransform(x, [-160, -120, 0], [1, 0.8, 0]);
  const scale = useTransform(x, [-160, -120, 0], [1, 0.9, 0.8]);
  const editX = useTransform(x, [-160, 0], [0, 60]);
  const repeatX = useTransform(x, [-160, 0], [0, 40]);
  const deleteX = useTransform(x, [-160, 0], [0, 20]);

  return (
    <div className="relative overflow-hidden rounded-2xl group/item shadow-xs border border-transparent hover:border-slate-100 dark:hover:border-slate-800/80 transition-all duration-350">
      {/* Background Actions Drawer */}
      <div className="absolute inset-0 flex justify-end items-center px-4 gap-2.5 bg-slate-50 dark:bg-slate-800/30">
        {!expense.isTransfer && (
          <>
            <motion.button
              style={{ opacity, scale, x: editX }}
              onClick={() => {
                hapticFeedback('medium');
                onEdit();
              }}
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20 hover:scale-105 active:scale-95 transition-transform shrink-0 cursor-pointer"
              title="تعديل العملية"
            >
              <Edit2 size={15} />
            </motion.button>
            <motion.button
              style={{ opacity, scale, x: repeatX }}
              onClick={() => {
                hapticFeedback('medium');
                onRepeat();
              }}
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-transform shrink-0 cursor-pointer"
              title="تكرار المعاملة"
            >
              <Repeat size={15} />
            </motion.button>
          </>
        )}
        <motion.button
          style={{ opacity, scale, x: deleteX }}
          onClick={() => {
            hapticFeedback('medium');
            onDelete();
          }}
          className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20 hover:scale-105 active:scale-95 transition-transform shrink-0 cursor-pointer"
          title="حذف العملية"
        >
          <Trash2 size={15} />
        </motion.button>
      </div>

      {/* Main Swipeable Item */}
      <motion.div
        style={{ x }}
        drag="x"
        dragConstraints={{ left: -160, right: 0 }}
        dragElastic={0.06}
        onDragEnd={(_, info) => {
          if (info.offset.x > -40) {
            x.set(0);
          } else if (info.offset.x < -80) {
            x.set(-160);
          }
        }}
        className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/40 p-4 flex items-center justify-between group cursor-grab active:cursor-grabbing z-10 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all duration-300 animate-fade-in text-right"
        dir="rtl"
      >
        {/* Visual Swipe Left Hint line */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-slate-100 dark:bg-slate-800 rounded-r-lg opacity-0 group-hover/item:opacity-100 transition-all duration-300" />

        <div className="flex items-center gap-4">
          <div 
            className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-xs transition-all duration-700 group-hover:scale-110 group-hover:rotate-6 shrink-0"
            style={{ backgroundColor: expense.isTransfer ? '#6366f1' : (category?.color || '#94a3b8') }}
          >
            {expense.isTransfer ? (
              <ArrowRightLeft size={18} />
            ) : (
              <DynamicIcon name={category?.icon || 'HelpCircle'} size={18} />
            )}
          </div>
          <div className="text-right">
            <h4 className="text-sm font-black text-slate-900 dark:text-white mb-1 leading-snug">
              {expense.note || (expense.isTransfer ? 'عملية تحويل' : category?.name)}
            </h4>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
              <span>{expense.isTransfer ? 'حساب في الحساب' : (category?.name || 'غير مجدول')}</span>
              {accountName && (
                <>
                  <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <span>{accountName}</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="text-left flex flex-col items-end shrink-0">
          <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(expense.amount, currency)}
          </span>
          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
            {formatExpenseDate(expense.date)}
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export const MemoizedSwipeableTransactionItem = React.memo(SwipeableTransactionItem, (prevProps, nextProps) => {
  return (
    prevProps.expense.id === nextProps.expense.id &&
    prevProps.expense.amount === nextProps.expense.amount &&
    prevProps.expense.date === nextProps.expense.date &&
    prevProps.expense.categoryId === nextProps.expense.categoryId &&
    prevProps.expense.note === nextProps.expense.note &&
    prevProps.currency === nextProps.currency &&
    prevProps.accountName === nextProps.accountName &&
    prevProps.category?.id === nextProps.category?.id
  );
});

export default MemoizedSwipeableTransactionItem;
