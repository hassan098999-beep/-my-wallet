import React from 'react';
import { motion } from 'motion/react';
import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Trash, Pencil, Copy, Calendar, Building2, ArrowDown, ArrowRightLeft } from 'lucide-react';
import { DynamicIcon } from './DynamicIcon';
import { formatCurrency, cn } from '../utils';
import { PaymentMethod, Category, Account } from '../types';

interface TransactionItemProps {
  transaction: any;
  categories: Category[];
  accounts: Account[];
  currency: string;
  index: number;
  onEdit: (t: any) => void;
  onDelete: (id: string, type: 'expense' | 'income') => void;
  onDuplicate: (t: any) => void;
  getPaymentIcon: (method: PaymentMethod) => React.ReactNode;
  getPaymentLabel: (method: PaymentMethod) => string;
}

const TransactionItemComponent: React.FC<TransactionItemProps> = ({
  transaction,
  categories,
  accounts,
  currency,
  index,
  onEdit,
  onDelete,
  onDuplicate,
  getPaymentIcon,
  getPaymentLabel,
}) => {
  const isExpense = transaction.type === 'expense';
  const isTransfer = transaction.isTransfer;
  const category = isExpense && !isTransfer ? categories.find(c => c.id === (transaction as any).categoryId) : null;
  const typeColor = isTransfer ? 'text-indigo-500' : (!isExpense ? 'text-emerald-500' : category?.type === 'need' ? 'text-indigo-500' : category?.type === 'want' ? 'text-amber-500' : 'text-rose-500');
  const bgColor = isTransfer ? '#6366f1' : (!isExpense ? '#10b981' : category?.color || '#f43f5e');

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="relative overflow-hidden"
    >
      {/* Swipe Background (Delete Button) */}
      <div className="absolute inset-0 bg-rose-500 flex items-center justify-end px-6">
        <div className="flex flex-col items-center gap-1 text-white">
          <Trash size={24} />
          <span className="text-[10px] font-black uppercase">حذف</span>
        </div>
      </div>

      <motion.div 
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: -100, right: 0 }}
        dragElastic={0.1}
        onDragEnd={(e, info) => {
          if (info.offset.x < -70) {
            onDelete(transaction.id, transaction.type);
          }
        }}
        className={cn(
          "relative z-10 p-6 md:p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-8 md:gap-12 transition-all group bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 last:border-0"
        )}
      >
        <div className="flex items-start sm:items-center gap-6 md:gap-10 flex-1 min-w-0">
          <div 
            className={cn("w-14 h-14 md:w-24 md:h-24 rounded-2xl md:rounded-3xl flex items-center justify-center text-white shrink-0 shadow-sm transition-all duration-700 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-emerald-500/20", typeColor.replace('text-', 'bg-'))}
            style={{ 
              backgroundColor: bgColor,
              boxShadow: `0 20px 40px -10px ${bgColor}40`
            }}
          >
            {isTransfer ? (
              <ArrowRightLeft className="size-7 md:size-12" />
            ) : !isExpense ? (
              <ArrowDown className="size-7 md:size-12" />
            ) : category?.icon ? (
              <DynamicIcon name={category.icon} className="size-7 md:size-12" />
            ) : (
              <span className="text-2xl md:text-4xl font-black">{category?.name?.charAt(0) || '?'}</span>
            )}
          </div>
          <div className="space-y-3 md:space-y-4 flex-1 min-w-0">
            <div className="flex flex-col gap-1">
              <h4 className="font-black text-slate-900 dark:text-white text-lg md:text-3xl leading-tight truncate tracking-tight">
                {isTransfer ? (isExpense ? (transaction as any).note : (transaction as any).source) : (!isExpense ? (transaction as any).source : ((transaction as any).note || ((transaction as any).subcategoryId ? `${category?.name} - ${(transaction as any).subcategoryId}` : category?.name)))}
              </h4>
              <div className="flex items-center gap-3">
                <span className={cn("text-[10px] md:text-xs font-black uppercase tracking-[0.2em]", typeColor)}>
                  {isTransfer ? 'تحويل مالي' : (!isExpense ? 'دخل' : category?.type === 'need' ? 'احتياجات' : category?.type === 'want' ? 'رغبات' : 'ادخار')}
                </span>
                {(transaction as any).subcategoryId && !isTransfer && (
                  <span className="text-[9px] md:text-[11px] font-black uppercase tracking-widest text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full">
                    {(transaction as any).subcategoryId}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 md:gap-x-8 gap-y-3 text-xs md:text-lg font-bold text-slate-400 dark:text-slate-500">
              <span className="flex items-center gap-2.5 whitespace-nowrap">
                <Calendar className="size-4 md:size-6 shrink-0 text-slate-300 dark:text-slate-600" />
                {format(parseISO(transaction.date), 'dd MMM yyyy', { locale: ar })}
              </span>
              <span className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/30 px-4 md:px-6 py-2 rounded-2xl whitespace-nowrap truncate max-w-[180px] sm:max-w-none border border-slate-200/5 dark:border-slate-700/5">
                {isTransfer ? <ArrowRightLeft size={18} className="shrink-0" /> : (isExpense ? getPaymentIcon((transaction as any).paymentMethod) : <Building2 size={18} className="shrink-0" />)}
                <span className="truncate font-black text-[10px] md:text-sm uppercase tracking-widest">
                  {transaction.accountId ? (
                    accounts.find(a => a.id === transaction.accountId)?.name || 'حساب محذوف'
                  ) : (
                    isExpense ? getPaymentLabel((transaction as any).paymentMethod) : 'بدون حساب'
                  )}
                </span>
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between sm:justify-center gap-8 md:gap-12 sm:w-auto w-full border-t sm:border-t-0 pt-6 md:pt-10 sm:pt-0 border-slate-100 dark:border-slate-800 shrink-0">
          <div className="text-right sm:text-center">
            <div className={cn("text-2xl md:text-5xl font-black tracking-tighter leading-none", !isExpense ? "text-emerald-500" : "text-slate-900 dark:text-white")}>
              {!isExpense ? '+' : ''}{formatCurrency(transaction.amount, currency)}
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            {!isTransfer && isExpense && (
              <button 
                onClick={() => onDuplicate(transaction)}
                className="p-3 md:p-4 text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-2xl md:rounded-3xl transition-all opacity-100 sm:opacity-0 group-hover:opacity-100 shadow-sm"
                title="تكرار"
              >
                <Copy className="size-5 md:size-8" />
              </button>
            )}

            {!isTransfer && (
              <button 
                onClick={() => onEdit(transaction)}
                className="p-3 md:p-4 text-slate-300 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-2xl md:rounded-3xl transition-all opacity-100 sm:opacity-0 group-hover:opacity-100 shadow-sm"
                title="تعديل"
              >
                <Pencil className="size-5 md:size-8" />
              </button>
            )}
            
            <button 
              onClick={() => onDelete(transaction.id, transaction.type)}
              className="p-3 md:p-4 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl md:rounded-3xl transition-all opacity-100 sm:opacity-0 group-hover:opacity-100 shadow-sm"
              title="حذف"
            >
              <Trash className="size-5 md:size-8" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export const TransactionItem = React.memo(TransactionItemComponent);
