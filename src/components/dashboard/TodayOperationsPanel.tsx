import React from 'react';
import { motion, Variants } from 'motion/react';
import { Clock, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn, formatCurrency, hapticFeedback } from '../../utils';
import DailySafeSpendCard from '../DailySafeSpendCard';
import DailySimpleView from '../DailySimpleView';
import { Expense, Category, Account, Goal } from '../../types';

interface TodayOperationsPanelProps {
  dailyLimit: number;
  todaySpent: number;
  remainingToday: number;
  globalBudgetNum: number;
  currency: string;
  remainingDays: number;
  budgetDaysInMonth: number;
  rollingBudgetEnabled: boolean;
  totalSpent: number;
  todayExpenses: Expense[];
  categories: Category[];
  accounts: Account[];
  expenses: Expense[];
  goals: Goal[];
  remainingDailyBudget: number;
  todaySpending: number;
  dailyBudget: number;
  rollingBudget: number;
  totalNetWorth: number;
  totalMonthlyExpense: number;
  dailyAverage: number;
  recentTransactions: Expense[];
  budgetStatus: 'red' | 'orange' | 'green';
  handleQuickPresetClick: (preset: { label: string; amount: string; desc: string; categoryName: string }) => Promise<void>;
  handleQuickAddSubmit: (e: React.FormEvent) => Promise<void>;
  quickAmount: string;
  setQuickAmount: (val: string) => void;
  quickDescription: string;
  setQuickDescription: (val: string) => void;
  quickCategoryId: string;
  setQuickCategoryId: (val: string) => void;
  handleEdit: (expense: Expense) => void;
  deleteExpense: (id: string) => void | Promise<void>;
  repeatExpense: (id: string) => void | Promise<void>;
  setIsAddModalOpen: (open: boolean) => void;
  itemVariants: Variants;
}

export const TodayOperationsPanel: React.FC<TodayOperationsPanelProps> = ({
  dailyLimit,
  todaySpent,
  remainingToday,
  globalBudgetNum,
  currency,
  remainingDays,
  budgetDaysInMonth,
  rollingBudgetEnabled,
  totalSpent,
  todayExpenses,
  categories,
  accounts,
  expenses,
  goals,
  remainingDailyBudget,
  todaySpending,
  dailyBudget,
  rollingBudget,
  totalNetWorth,
  totalMonthlyExpense,
  dailyAverage,
  recentTransactions,
  budgetStatus,
  handleQuickPresetClick,
  handleQuickAddSubmit,
  quickAmount,
  setQuickAmount,
  quickDescription,
  setQuickDescription,
  quickCategoryId,
  setQuickCategoryId,
  handleEdit,
  deleteExpense,
  repeatExpense,
  setIsAddModalOpen,
  itemVariants,
}) => {
  return (
    <>
      {/* 3. Today Panel ("لوحة اليوم") */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4 max-w-5xl mx-auto w-full text-right"
      >
        <div className="flex justify-between items-center pb-2 border-b border-slate-50 dark:border-slate-800/50">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono">
              {new Date().toLocaleDateString('ar-TN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
          <h2 className="text-[--text-h2] font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Clock size={16} className="text-emerald-500" />
            <span>لوحة عمليات اليوم</span>
          </h2>
        </div>

        {/* Visual Safe to Spend Daily Budget Progress Indicator */}
        <DailySafeSpendCard
          dailyLimit={dailyLimit}
          todaySpent={todaySpent}
          remainingToday={remainingToday}
          globalBudgetNum={globalBudgetNum}
          currency={currency}
          remainingDays={remainingDays}
          daysInMonth={budgetDaysInMonth}
          rollingBudgetEnabled={rollingBudgetEnabled}
          totalSpentMonth={totalSpent}
          onOpenAddExpense={() => setIsAddModalOpen(true)}
        />

        {/* Transaction list for today */}
        <div className="space-y-2">
          {todayExpenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 px-4 bg-slate-50/50 dark:bg-slate-850/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">لم تسجل أي عملية صرف اليوم بعد. حافظ على الانضباط!</p>
              <button
                onClick={() => {
                  hapticFeedback('medium');
                  setIsAddModalOpen(true);
                }}
                className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black py-2.5 px-5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus size={14} />
                <span>سجل أول عملية لليوم 🚀</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
              {todayExpenses.map(exp => {
                const cat = categories.find(c => c.id === exp.categoryId);
                return (
                  <div key={exp.id} className="py-3 flex justify-between items-center gap-4 hover:bg-slate-50/30 dark:hover:bg-slate-800/10 px-2 rounded-xl transition-colors">
                    {/* Action buttons (Delete / Edit) */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          hapticFeedback('medium');
                          handleEdit(exp);
                        }}
                        className="p-1.5 text-xs font-black text-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-lg cursor-pointer"
                        title="تعديل"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={async () => {
                          hapticFeedback('heavy');
                          if (confirm('هل أنت متأكد من حذف هذه المعاملة؟')) {
                            try {
                              await deleteExpense(exp.id);
                              toast.success('تم حذف العملية بنجاح');
                            } catch(e) {
                              toast.error('حدث خطأ أثناء الحذف');
                            }
                          }
                        }}
                        className="p-1.5 text-xs font-black text-rose-500 bg-rose-50/50 dark:bg-rose-950/20 rounded-lg cursor-pointer"
                        title="حذف"
                      >
                        حذف
                      </button>
                    </div>

                    {/* Left: Amount & Payment info */}
                    <div className="text-left flex flex-col shrink-0 font-sans">
                      <span className={cn(
                        "text-sm font-black",
                        exp.isTransfer ? "text-slate-500" : "text-rose-500 dark:text-rose-400"
                      )}>
                        {exp.isTransfer ? '' : '-'}{formatCurrency(exp.amount, currency)}
                      </span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold mt-0.5 font-tajawal">
                        {exp.paymentMethod === 'cash' ? 'نقداً 💵' : exp.paymentMethod === 'card' ? 'بطاقة بنكية 💳' : 'آخر'}
                      </span>
                    </div>

                    {/* Right: Category Icon, Name, and Note */}
                    <div className="flex items-center gap-3 text-right flex-1 min-w-0">
                      <div className="hidden sm:block shrink-0">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-700 dark:text-slate-300">
                          {cat?.name.substring(0, 2) || '📦'}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-800 dark:text-white truncate">
                          {exp.note || cat?.name || 'مصروف عام'}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold truncate mt-0.5">
                          {cat?.name || 'بدون تصنيف'} {exp.subcategoryId ? `• ${exp.subcategoryId}` : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>

      <DailySimpleView
        categories={categories}
        accounts={accounts}
        expenses={expenses}
        goals={goals}
        currency={currency}
        remainingDailyBudget={remainingDailyBudget}
        todaySpending={todaySpending}
        dailyBudget={dailyBudget}
        rollingBudget={rollingBudget}
        totalNetWorth={totalNetWorth}
        totalMonthlyExpense={totalMonthlyExpense}
        dailyAverage={dailyAverage}
        recentTransactions={recentTransactions}
        budgetStatus={budgetStatus}
        globalBudgetNum={globalBudgetNum}
        remainingDays={remainingDays}
        daysInMonth={budgetDaysInMonth}
        totalSpentMonth={totalSpent}
        handleQuickPresetClick={handleQuickPresetClick}
        handleQuickAddSubmit={handleQuickAddSubmit}
        quickAmount={quickAmount}
        setQuickAmount={setQuickAmount}
        quickDescription={quickDescription}
        setQuickDescription={setQuickDescription}
        quickCategoryId={quickCategoryId}
        setQuickCategoryId={setQuickCategoryId}
        setIsAddModalOpen={setIsAddModalOpen}
        handleEdit={handleEdit}
        deleteExpense={deleteExpense}
        repeatExpense={repeatExpense}
      />
    </>
  );
};
