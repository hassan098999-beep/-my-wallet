import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Sparkles, 
  UtensilsCrossed, 
  Baby, 
  House, 
  HeartPulse, 
  Coffee, 
  BusFront, 
  Clock, 
  ArrowRight,
  Edit2,
  Repeat,
  Trash2,
  Wallet
} from 'lucide-react';
import { formatCurrency, cn, hapticFeedback } from '../utils';
import { Category, Account, Expense, Goal } from '../types';
import { DynamicIcon } from './DynamicIcon';
import { parseISO, format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { DailySafeSpendCard } from './DailySafeSpendCard';

interface DailySimpleViewProps {
  categories: Category[];
  accounts: Account[];
  expenses: Expense[];
  goals: Goal[];
  currency: string;
  remainingDailyBudget: number;
  todaySpending: number;
  dailyBudget: number;
  rollingBudget: number;
  totalNetWorth: number;
  totalMonthlyExpense: number;
  dailyAverage: number;
  recentTransactions: Expense[];
  budgetStatus: 'red' | 'orange' | 'green';
  globalBudgetNum?: number;
  remainingDays?: number;
  daysInMonth?: number;
  totalSpentMonth?: number;
  handleQuickPresetClick: (preset: any) => void;
  handleQuickAddSubmit: (e: React.FormEvent) => void;
  quickAmount: string;
  setQuickAmount: (v: string) => void;
  quickDescription: string;
  setQuickDescription: (v: string) => void;
  quickCategoryId: string;
  setQuickCategoryId: (v: string) => void;
  setIsAddModalOpen: (v: boolean) => void;
  handleEdit: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  repeatExpense: (id: string) => void;
}

const DailySimpleView: React.FC<DailySimpleViewProps> = ({
  categories,
  accounts,
  currency,
  remainingDailyBudget,
  todaySpending,
  dailyBudget,
  rollingBudget,
  totalNetWorth,
  totalMonthlyExpense,
  recentTransactions,
  budgetStatus,
  globalBudgetNum = 0,
  remainingDays = 30,
  daysInMonth = 30,
  totalSpentMonth = 0,
  handleQuickPresetClick,
  handleQuickAddSubmit,
  quickAmount,
  setQuickAmount,
  quickDescription,
  setQuickDescription,
  quickCategoryId,
  setQuickCategoryId,
  setIsAddModalOpen,
  handleEdit,
  deleteExpense,
  repeatExpense
}) => {
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

  return (
    <div className="space-y-6 max-w-3xl mx-auto text-right" dir="rtl">
      
      {/* A. Visual Safe To Spend Progress Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <DailySafeSpendCard
          dailyLimit={dailyBudget || rollingBudget}
          todaySpent={todaySpending}
          remainingToday={remainingDailyBudget}
          globalBudgetNum={globalBudgetNum}
          currency={currency}
          remainingDays={remainingDays}
          daysInMonth={daysInMonth}
          totalSpentMonth={totalSpentMonth}
          onOpenAddExpense={() => setIsAddModalOpen(true)}
        />
      </motion.div>

      {/* C. Clean Recent Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 md:p-6 shadow-sm space-y-4"
      >
        <div className="flex justify-between items-center pb-2 border-b border-slate-50 dark:border-slate-800/60">
          <div className="space-y-0.5">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">آخر الحركات المالية المنجزة</h3>
            <p className="text-[10px] text-slate-400 font-extrabold leading-tight">كبسات تحرك سريعة تظهر بجانب المصروف للعمل الفوري</p>
          </div>
          <Link to="/transactions" className="text-[10px] font-black text-indigo-500 hover:underline">عرض جميع الحركات</Link>
        </div>

        <div className="space-y-2">
          {recentTransactions.slice(0, 4).map((expense) => {
            const expenseCategory = categories.find(c => c.id === expense.categoryId);
            const expenseAccount = accounts.find(a => a.id === expense.accountId);
            
            return (
              <div 
                key={expense.id}
                className="bg-slate-50/50 dark:bg-slate-950/20 hover:bg-slate-100/50 dark:hover:bg-slate-950/40 p-4 border border-slate-100 dark:border-slate-850/80 rounded-2xl flex items-center justify-between gap-4 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-3xs shrink-0"
                    style={{ backgroundColor: expense.isTransfer ? '#6366f1' : (expenseCategory?.color || '#94a3b8') }}
                  >
                    {expense.isTransfer ? <ArrowRight className="rotate-45" size={16} /> : <DynamicIcon name={expenseCategory?.icon || 'HelpCircle'} size={16} />}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                      {expense.note || (expense.isTransfer ? 'عملية تحويل' : expenseCategory?.name)}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mt-1">
                      <span>{expense.isTransfer ? 'عملية تحويل' : (expenseCategory?.name || 'غير مصنف')}</span>
                      {expenseAccount && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700" />
                          <span>{expenseAccount.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-left font-sans">
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      {formatCurrency(expense.amount, currency)}
                    </span>
                    <span className="block text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                      {formatExpenseDate(expense.date)}
                    </span>
                  </div>

                  {/* Accessible inline tactile operations instead of hidden swipe mechanics */}
                  <div className="flex items-center gap-1 border-r border-slate-200/50 dark:border-slate-805/50 pr-3 rtl:border-r-0 rtl:pl-0 rtl:border-l rtl:pl-3">
                    <button
                      type="button"
                      onClick={() => {
                        hapticFeedback('medium');
                        handleEdit(expense);
                      }}
                      className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
                      title="تعديل"
                    >
                      <Edit2 size={11} />
                    </button>
                    {!expense.isTransfer && (
                      <button
                        type="button"
                        onClick={() => {
                          hapticFeedback('medium');
                          repeatExpense(expense.id);
                          toast.success('تم تكرار العملية');
                        }}
                        className="w-7 h-7 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
                        title="تكرار"
                      >
                        <Repeat size={11} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        hapticFeedback('medium');
                        deleteExpense(expense.id);
                        toast.success('تم حذف العملية');
                      }}
                      className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {recentTransactions.length === 0 && (
            <div className="py-8 text-center text-slate-400 text-xs font-bold bg-slate-50/50 dark:bg-slate-950/10 rounded-2xl">
              لا تتوفر أي معاملات مسجلة حتى الآن. ابدأ بكافة كبسات الدفتر السريع! 🍼🥖
            </div>
          )}
        </div>
      </motion.div>

    </div>
  );
};

export default DailySimpleView;
