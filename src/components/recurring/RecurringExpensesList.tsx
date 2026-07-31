import React from 'react';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';
import { parseISO, format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Clock, Pencil, Trash, Calendar, AlertCircle, RefreshCcw } from 'lucide-react';
import { RecurringExpense, Category, RecurringInterval } from '../../types';
import { cn, formatCurrency, hapticFeedback } from '../../utils';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';
import { DynamicIcon } from '../DynamicIcon';

interface RecurringExpensesListProps {
  recurringExpenses: RecurringExpense[];
  categories: Category[];
  currency: string;
  handleEdit: (expense: RecurringExpense) => void;
  deleteRecurringExpense: (id: string) => void;
  intervalLabels: Record<RecurringInterval, string>;
  setIsAdding: (val: boolean) => void;
}

const RecurringExpensesList: React.FC<RecurringExpensesListProps> = ({
  recurringExpenses,
  categories,
  currency,
  handleEdit,
  deleteRecurringExpense,
  intervalLabels,
  setIsAdding,
}) => {
  return (
    <div className="space-y-3 md:space-y-4 px-2">
      <div className="flex items-center gap-2 md:gap-3">
        <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-500">
          <Clock className="size-3.5 md:size-4" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">قائمة المصاريف المتكررة</h2>
          <p className="text-[11px] font-medium text-slate-500">إدارة وجدولة مدفوعاتك الدورية</p>
        </div>
      </div>
      
      {recurringExpenses && recurringExpenses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {recurringExpenses.map(expense => {
            const category = categories.find(c => c.id === expense.categoryId);
            const daysUntil = Math.ceil((parseISO(expense.nextDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            const isSoon = daysUntil <= 3 && daysUntil >= 0;

            return (
              <motion.div 
                key={expense.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full"
              >
                <Card className="p-6 md:p-8 w-full group relative overflow-hidden" interactive>
                  <div className="relative z-10 flex flex-col gap-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-6 text-white",
                          category?.color || "bg-primary-500"
                        )} style={{ backgroundColor: category?.color }}>
                          {category?.icon ? (
                            <DynamicIcon name={category.icon} size={28} />
                          ) : (
                            <Clock size={28} />
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                            {expense.note || (expense.subcategoryId ? `${category?.name} - ${expense.subcategoryId}` : category?.name)}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-semibold text-primary-600 dark:text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded-md">
                              {intervalLabels[expense.interval]}
                            </span>
                            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                              {category?.name}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleEdit(expense)}
                          className="text-slate-300 hover:text-primary-500 p-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all active:scale-90 cursor-pointer"
                        >
                          <Pencil className="size-5" />
                        </button>
                        <button 
                          onClick={() => {
                            deleteRecurringExpense(expense.id);
                            toast.success('تم حذف المصروف المتكرر');
                          }}
                          className="text-slate-300 hover:text-rose-500 p-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all active:scale-90 cursor-pointer"
                        >
                          <Trash className="size-5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-end justify-between pt-4 border-t border-slate-100 dark:border-slate-800/50">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Calendar size={12} />
                          <span className="text-[11px] font-medium">
                            القادم: {format(parseISO(expense.nextDate), 'dd MMM yyyy', { locale: ar })}
                          </span>
                        </div>
                        {isSoon && (
                          <div className="flex items-center gap-1.5 text-rose-500 animate-pulse">
                            <AlertCircle size={12} />
                            <span className="text-[11px] font-semibold">يستحق قريباً</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                          {formatCurrency(expense.amount, currency)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Background Decoration */}
                  <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-primary-500/5 rounded-full blur-[60px] group-hover:bg-primary-500/10 transition-colors duration-700" />
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={RefreshCcw}
          title="لا توجد مصاريف متكررة"
          description="قم بإضافة مصاريفك الثابتة (مثل الإيجار أو الاشتراكات) ليتم تسجيلها وجدولتها تلقائياً عبر الأيام!"
          actionLabel="إضافة أول مصروف متكرر"
          onAction={() => {
            hapticFeedback('medium');
            setIsAdding(true);
          }}
        />
      )}
    </div>
  );
};

export default RecurringExpensesList;
