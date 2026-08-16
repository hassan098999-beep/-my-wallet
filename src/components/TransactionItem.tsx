import React from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'motion/react';
import { format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Trash, Pencil, Copy, ArrowDown, ArrowRightLeft, ChevronRight, Check, Coins } from 'lucide-react';
import { DynamicIcon } from './DynamicIcon';
import { formatCurrency, cn, hapticFeedback } from '../utils';
import { PaymentMethod, Category, Account } from '../types';

interface TransactionItemProps {
  transaction: any;
  categories: Category[];
  accounts: Account[];
  currency: string;
  index: number;
  onEdit: (t: any) => void;
  onEditAmount?: (t: any) => void;
  onDelete: (id: string, type: 'expense' | 'income') => void;
  onDuplicate: (t: any) => void;
  getPaymentIcon: (method: PaymentMethod) => React.ReactNode;
  getPaymentLabel: (method: PaymentMethod) => string;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (transaction: any) => void;
}

const TransactionItemComponent: React.FC<TransactionItemProps> = ({
  transaction,
  categories,
  accounts,
  currency,
  index,
  onEdit,
  onEditAmount,
  onDelete,
  onDuplicate,
  getPaymentIcon,
  getPaymentLabel,
  isSelectionMode,
  isSelected,
  onToggleSelect,
}) => {
  const isExpense = transaction.type === 'expense';
  const isTransfer = transaction.isTransfer;
  const category = isExpense && !isTransfer ? categories.find(c => c.id === (transaction as any).categoryId) : null;
  const typeColor = isTransfer ? 'text-indigo-500' : (!isExpense ? 'text-emerald-500' : category?.type === 'need' ? 'text-indigo-500' : category?.type === 'want' ? 'text-amber-500' : 'text-rose-500');
  const bgColor = isTransfer ? '#6366f1' : (!isExpense ? '#10b981' : category?.color || '#f43f5e');

  const [showConfirmDelete, setShowConfirmDelete] = React.useState(false);
  
  const x = useMotionValue(0);
  
  // Dynamic values for buttons based on swipe (swiping right in RTL reveals left side)
  const opacity = useTransform(x, [0, 100, 200], [0, 0.8, 1]);
  const scale = useTransform(x, [0, 100, 200], [0.8, 0.9, 1]);
  const repeatX = useTransform(x, [0, 200], [-70, 0]);
  const editAmountX = useTransform(x, [0, 200], [-50, 0]);
  const editX = useTransform(x, [0, 200], [-30, 0]);
  const deleteX = useTransform(x, [0, 200], [-10, 0]);

  const handleDuplicate = () => {
    hapticFeedback('medium');
    onDuplicate(transaction);
    x.set(0);
  };

  const handleEdit = () => {
    hapticFeedback('medium');
    onEdit(transaction);
    x.set(0);
  };

  const handleEditAmount = () => {
    hapticFeedback('medium');
    if (onEditAmount) {
      onEditAmount(transaction);
    } else {
      onEdit(transaction);
    }
    x.set(0);
  };

  const handleDeleteClick = () => {
    hapticFeedback('medium');
    setShowConfirmDelete(true);
    x.set(0);
  };

  const confirmDelete = () => {
    hapticFeedback('heavy');
    onDelete(transaction.id, transaction.type);
    setShowConfirmDelete(false);
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, height: 0, x: -20, scale: 0.98 }}
      animate={{ opacity: 1, height: 'auto', x: 0, scale: 1 }}
      exit={{ opacity: 0, height: 0, scale: 0.98 }}
      transition={{ 
        duration: 0.4, 
        ease: [0.16, 1, 0.3, 1], // Spring-like ease out
        opacity: { duration: 0.3 },
        layout: { duration: 0.3, ease: "easeInOut" }
      }}
      className="relative overflow-hidden"
    >
      <AnimatePresence>
        {showConfirmDelete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-6"
          >
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <p className="text-sm md:text-lg font-bold text-slate-900 dark:text-white">هل أنت متأكد من حذف هذه المعاملة؟</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowConfirmDelete(false)} 
                  className="px-4 py-2 md:px-6 md:py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs md:text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  إلغاء
                </button>
                <button 
                  onClick={confirmDelete} 
                  className="px-4 py-2 md:px-6 md:py-2.5 rounded-xl bg-rose-500 text-white font-semibold text-xs md:text-sm shadow-md shadow-rose-500/20 active:scale-95 transition-all outline outline-2 outline-rose-500/0 hover:outline-rose-500 hover:bg-white hover:text-rose-500 dark:hover:bg-slate-900"
                >
                  تأكيد الحذف
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Swipe Background (Action Buttons) */}
      <div className="absolute inset-y-0 left-0 flex items-center justify-start pl-4 pr-3 gap-1.5 md:gap-2 bg-slate-50 dark:bg-slate-800/50 w-full z-0 border-b border-slate-100 dark:border-slate-800">
        {!isTransfer && isExpense && (
          <motion.button
            style={{ opacity, scale, x: repeatX }}
            onClick={handleDuplicate}
            className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm active:scale-95 transition-transform shrink-0"
            title="تكرار العملية"
          >
            <Copy size={15} />
          </motion.button>
        )}
        <motion.button
          style={{ opacity, scale, x: editAmountX }}
          onClick={handleEditAmount}
          className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm active:scale-95 transition-transform shrink-0"
          title="تعديل المبلغ"
        >
          <Coins size={15} />
        </motion.button>
        {!isTransfer && (
          <motion.button
            style={{ opacity, scale, x: editX }}
            onClick={handleEdit}
            className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-sm active:scale-95 transition-transform shrink-0"
            title="تعديل كافة التفاصيل"
          >
            <Pencil size={15} />
          </motion.button>
        )}
        <motion.button
          style={{ opacity, scale, x: deleteX }}
          onClick={handleDeleteClick}
          className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-sm active:scale-95 transition-transform shrink-0"
          title="حذف"
        >
          <Trash size={15} />
        </motion.button>
      </div>

      <motion.div 
        style={{ x }}
        drag={isSelectionMode ? false : "x"}
        dragDirectionLock
        dragConstraints={{ left: 0, right: 180 }}
        dragElastic={0.1}
        onDragEnd={(e, info) => {
          if (!isSelectionMode && info.offset.x > 60) {
            hapticFeedback('medium');
            x.set(180);
          } else {
            x.set(0);
          }
        }}
        onClick={() => {
          if (isSelectionMode && onToggleSelect) {
            hapticFeedback('light');
            onToggleSelect(transaction);
          }
        }}
        className={cn(
          "relative z-10 px-3.5 py-2.5 md:px-5 md:py-3 flex items-center justify-between gap-3 md:gap-4 transition-colors group bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 last:border-0 min-h-[56px]",
          isSelectionMode ? "cursor-pointer" : "cursor-grab active:cursor-grabbing",
          isSelected && isSelectionMode && "bg-indigo-50/40 dark:bg-indigo-950/20"
        )}
      >
        {/* Swipe Hint Indicator (Mobile only) */}
        {!isSelectionMode && (
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center sm:hidden opacity-20 text-slate-400 pointer-events-none">
            <ChevronRight size={16} />
          </div>
        )}

        <div className="flex items-center gap-2.5 md:gap-3.5 flex-1 min-w-0">
          {isSelectionMode && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                hapticFeedback('light');
                onToggleSelect?.(transaction);
              }}
              className="flex items-center justify-center shrink-0 cursor-pointer p-0.5"
            >
              <div
                className={cn(
                  "size-5 md:size-6 rounded-md md:rounded-lg border-2 flex items-center justify-center transition-all",
                  isSelected
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-sm scale-105"
                    : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-indigo-400"
                )}
              >
                {isSelected && <Check className="size-3 md:size-4 stroke-[3]" />}
              </div>
            </div>
          )}

          <div 
            className={cn("w-9 h-9 md:w-11 md:h-11 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm transition-all duration-300 group-hover:scale-105", typeColor.replace('text-', 'bg-'))}
            style={{ 
              backgroundColor: bgColor,
            }}
          >
            {isTransfer ? (
              <ArrowRightLeft className="size-4 md:size-5" />
            ) : !isExpense ? (
              <ArrowDown className="size-4 md:size-5" />
            ) : category?.icon ? (
              <DynamicIcon name={category.icon} className="size-4 md:size-5" />
            ) : (
              <span className="text-xs md:text-sm font-bold">{category?.name?.charAt(0) || '?'}</span>
            )}
          </div>

          <div className="flex flex-col min-w-0 flex-1 gap-0.5">
            <div className="flex items-center gap-2 min-w-0">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs md:text-sm leading-tight truncate">
                {isTransfer 
                  ? (isExpense ? (transaction as any).note : (transaction as any).source) 
                  : (!isExpense 
                      ? (transaction as any).source 
                      : ((transaction as any).note || ((transaction as any).subcategoryId ? `${category?.name} - ${(transaction as any).subcategoryId}` : category?.name))
                    )}
              </h4>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
              <span className={cn("font-bold shrink-0", typeColor)}>
                {isTransfer ? 'تحويل مالي' : (!isExpense ? 'دخل' : category?.type === 'need' ? 'احتياجات' : category?.type === 'want' ? 'رغبات' : 'ادخار')}
              </span>
              {(transaction as any).subcategoryId && !isTransfer && (
                <>
                  <span className="opacity-40">·</span>
                  <span className="shrink-0 text-emerald-600 dark:text-emerald-400 font-semibold">
                    {(transaction as any).subcategoryId}
                  </span>
                </>
              )}
              <span className="opacity-40">·</span>
              <span className="shrink-0 truncate max-w-[90px] sm:max-w-[140px]">
                {transaction.accountId ? (
                  accounts.find(a => a.id === transaction.accountId)?.name || 'حساب محذوف'
                ) : (
                  isExpense ? getPaymentLabel((transaction as any).paymentMethod) : 'بدون حساب'
                )}
              </span>
              <span className="opacity-40">·</span>
              <span className="shrink-0 text-slate-400 dark:text-slate-500">
                {format(parseISO(transaction.date), 'dd MMM yyyy', { locale: ar })}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          {/* Interactive Amount Badge with quick edit click */}
          <button
            type="button"
            onClick={(e) => {
              if (!isSelectionMode) {
                e.stopPropagation();
                handleEditAmount();
              }
            }}
            title="انقر لتعديل مبلغ العملية مباشرة"
            className={cn(
              "group/amount flex items-center gap-1 px-2 py-1 rounded-xl transition-all",
              !isSelectionMode && "hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer active:scale-95"
            )}
          >
            <div className={cn(
              "text-sm md:text-base font-black tracking-tight leading-none font-mono dir-ltr transition-colors", 
              isTransfer ? "text-slate-900 dark:text-white" : (!isExpense ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")
            )}>
              {isTransfer ? '' : (!isExpense ? '+' : '-')} {formatCurrency(transaction.amount, currency)}
            </div>
            {!isSelectionMode && (
              <Coins className="size-3 text-slate-400 opacity-0 group-hover/amount:opacity-100 transition-opacity hidden sm:block" />
            )}
          </button>

          <div className="hidden sm:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Quick Amount Edit Button */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleEditAmount();
              }}
              className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-all"
              title="تعديل المبلغ"
            >
              <Coins className="size-4" />
            </button>

            {!isTransfer && isExpense && (
              <button 
                onClick={(e) => { 
                  e.stopPropagation();
                  hapticFeedback('light'); 
                  onDuplicate(transaction); 
                }}
                className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all"
                title="تكرار"
              >
                <Copy className="size-4" />
              </button>
            )}

            {!isTransfer && (
              <button 
                onClick={(e) => { 
                  e.stopPropagation();
                  hapticFeedback('light'); 
                  onEdit(transaction); 
                }}
                className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                title="تعديل كافة التفاصيل"
              >
                <Pencil className="size-4" />
              </button>
            )}
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteClick();
              }}
              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"
              title="حذف"
            >
              <Trash className="size-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export const TransactionItem = React.memo(TransactionItemComponent, (prevProps, nextProps) => {
  return (
    prevProps.transaction.id === nextProps.transaction.id &&
    prevProps.transaction.amount === nextProps.transaction.amount &&
    prevProps.transaction.date === nextProps.transaction.date &&
    prevProps.transaction.categoryId === nextProps.transaction.categoryId &&
    prevProps.transaction.note === nextProps.transaction.note &&
    prevProps.transaction.accountId === nextProps.transaction.accountId &&
    prevProps.currency === nextProps.currency &&
    prevProps.isSelectionMode === nextProps.isSelectionMode &&
    prevProps.isSelected === nextProps.isSelected
  );
});

