import React from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { Clock, Activity, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';
import SwipeableTransactionItem from '../SwipeableTransactionItem';
import { cn, hapticFeedback } from '../../utils';
import { Expense, Category, Account } from '../../types';

interface TransactionHistorySectionProps {
  recentTransactions: Expense[];
  categories: Category[];
  accounts: Account[];
  currency: string;
  txFilter: 'all' | 'expense' | 'income';
  setTxFilter: (filter: 'all' | 'expense' | 'income') => void;
  deleteExpense: (id: string) => void | Promise<void>;
  repeatExpense: (id: string) => void | Promise<void>;
  handleEdit: (expense: Expense) => void;
  setIsAddModalOpen: (open: boolean) => void;
  itemVariants: Variants;
}

export const TransactionHistorySection: React.FC<TransactionHistorySectionProps> = ({
  recentTransactions,
  categories,
  accounts,
  currency,
  txFilter,
  setTxFilter,
  deleteExpense,
  repeatExpense,
  handleEdit,
  setIsAddModalOpen,
  itemVariants,
}) => {
  return (
    <motion.div variants={itemVariants}>
      <Card className="flex flex-col min-h-[500px] p-6 sm:p-7">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/65">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-button flex items-center justify-center text-indigo-600 shadow-inner">
              <Clock size={22} />
            </div>
            <div>
              <h2 className="text-[--text-h2] font-semibold text-slate-900 dark:text-white">آخر العمليات المكتملة</h2>
              <p className="text-[--text-body] font-medium text-slate-500 mt-0.5">اسحب على أي معاملة لتكرارها أو حذفها</p>
            </div>
          </div>

          {/* Sliging Filter Indicator pills */}
          <div className="flex bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200/5">
            {[
              { id: 'all' as const, label: 'الكل' },
              { id: 'expense' as const, label: 'المصاريف' },
              { id: 'income' as const, label: 'التحويلات/المداخيل' },
            ].map((op) => (
              <button
                key={op.id}
                onClick={() => {
                  hapticFeedback('light');
                  setTxFilter(op.id);
                }}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer",
                  txFilter === op.id 
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs" 
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                {op.label}
              </button>
            ))}
          </div>
        </div>

        {/* List Content */}
        <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 pr-1 text-right" dir="rtl">
          <AnimatePresence mode="popLayout">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((expense, idx) => (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <SwipeableTransactionItem 
                    expense={expense} 
                    category={categories.find(c => c.id === expense.categoryId)}
                    currency={currency}
                    accountName={accounts.find(a => a.id === expense.accountId)?.name}
                    onDelete={() => {
                      hapticFeedback('medium');
                      deleteExpense(expense.id);
                      toast.success('تم حذف العملية');
                    }}
                    onRepeat={() => {
                      hapticFeedback('medium');
                      repeatExpense(expense.id);
                      toast.success('تم تكرار العملية بنجاح');
                    }}
                    onEdit={() => {
                      hapticFeedback('medium');
                      handleEdit(expense);
                    }}
                  />
                </motion.div>
              ))
            ) : (
              <EmptyState
                icon={Activity}
                title="لا تتوفر أي معاملات ضمن الفئة"
                description="ابدأ بإنشاء أولى المصاريف لتبدأ عجائب الذكاء المالي وسلوكيات الادخار بالعمل معك!"
                actionLabel="إضافة أول عملية"
                onAction={() => setIsAddModalOpen(true)}
              />
            )}
          </AnimatePresence>
        </div>

        <div className="pt-4 mt-6 border-t border-slate-100 dark:border-slate-850 text-center">
          <Link 
            to="/transactions" 
            className="inline-flex items-center gap-2 hover:gap-3 text-xs font-black text-indigo-500 hover:text-indigo-600 transition-all py-2 px-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <span>استعراض شامل وجدولة كافة الفلاتر للعمليات</span>
            <ArrowRight size={14} className="rtl:rotate-180" />
          </Link>
        </div>
      </Card>
    </motion.div>
  );
};
