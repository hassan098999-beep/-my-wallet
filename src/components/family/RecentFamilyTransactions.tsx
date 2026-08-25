import React, { useState } from 'react';
import { motion } from 'motion/react';
import { History, Plus, Filter, ArrowUpRight, ShoppingBag } from 'lucide-react';
import { formatCurrency, hapticFeedback } from '../../utils';
import { parseISO, format } from 'date-fns';
import { Expense, Category } from '../../types';
import { DynamicIcon } from '../DynamicIcon';

interface RecentFamilyTransactionsProps {
  expenses: Expense[];
  categories: Category[];
  currency: string;
  onAddExpenseClick: () => void;
}

export const RecentFamilyTransactions: React.FC<RecentFamilyTransactionsProps> = ({
  expenses,
  categories,
  currency,
  onAddExpenseClick,
}) => {
  const [filterPillar, setFilterPillar] = useState<string>('all');

  const categoriesMap = new Map(categories.map(c => [c.id, c]));

  // Filter expenses
  const familyExpenses = expenses
    .filter(e => !e.isTransfer)
    .slice(0, 10);

  return (
    <div className="space-y-4 text-right" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <History size={18} className="text-indigo-500" />
            <span>سجل العمليات والمشتريات المعيشية الأخيرة</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            آخر المعاملات المسجلة للبيت ومستلزمات الأسرة
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            hapticFeedback('medium');
            onAddExpenseClick();
          }}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer active:scale-95 shadow-2xs self-start sm:self-auto"
        >
          <Plus size={14} />
          <span>إضافة مصروف عائلي</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 md:p-5 shadow-2xs">
        {familyExpenses.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {familyExpenses.map((exp) => {
              const cat = categoriesMap.get(exp.categoryId);
              return (
                <div 
                  key={exp.id} 
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 px-2 rounded-xl transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                      style={{ backgroundColor: cat?.color || '#10b981' }}
                    >
                      <DynamicIcon name={cat?.icon || 'Circle'} size={18} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                        {exp.note || cat?.name || 'مصروف عائلي'}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 font-medium">
                        <span>{cat?.name || 'عام'}</span>
                        <span>•</span>
                        <span className="font-mono">
                          {exp.date ? format(parseISO(exp.date), 'yyyy/MM/dd') : '—'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-left shrink-0">
                    <span className="text-xs font-black font-mono text-rose-500 dark:text-rose-400 block">
                      -{formatCurrency(exp.amount, currency)}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold block mt-0.5">
                      {exp.paymentMethod === 'card' ? 'بطاقة' : 'نقداً'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 font-medium text-xs">
            لا توجد عمليات مسجلة لهذا الشهر حتى الآن.
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentFamilyTransactions;
