import React from 'react';
import { motion } from 'motion/react';
import { PieChart, CircleAlert, Calendar, Zap, AlertTriangle } from 'lucide-react';
import { DynamicIcon } from '../DynamicIcon';
import EmptyState from '../ui/EmptyState';
import { Category, Expense, BudgetPeriod } from '../../types';
import { cn, formatCurrency, hapticFeedback } from '../../utils';

interface BudgetCategoryListProps {
  categories: Category[];
  currentMonthExpenses: Expense[];
  currentWeekExpenses: Expense[];
  categoryBudgets: Record<string, string>;
  categoryPeriods: Record<string, BudgetPeriod>;
  handleCategoryBudgetChange: (id: string, value: string) => void;
  handleCategoryPeriodChange: (id: string, period: BudgetPeriod) => void;
  remainingDays: number;
  remainingDaysInWeek: number;
  currency: string;
  categoryStatusesLookup?: Record<string, any>;
  rollingBudgetEnabled?: boolean;
}

export const BudgetCategoryList: React.FC<BudgetCategoryListProps> = ({
  categories,
  currentMonthExpenses,
  currentWeekExpenses,
  categoryBudgets,
  categoryPeriods,
  handleCategoryBudgetChange,
  handleCategoryPeriodChange,
  remainingDays,
  remainingDaysInWeek,
  currency,
  categoryStatusesLookup,
  rollingBudgetEnabled = true,
}) => {
  // Grouped Categories mapped to standard system categories
  const groupedCategories = [
    { 
      id: 'need', 
      title: 'الاحتياجات الأساسية', 
      percentNum: 50,
      description: 'الفواتير، الأكل والشرب، النقل، الكراء ومصاريف التداوي. نوصي بتخصيص %50 كحد أقصى.',
      color: 'bg-rose-500', 
      textColor: 'text-rose-600 dark:text-rose-400',
      badgeBg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
      items: categories.filter(c => c.type === 'need' || !c.type) 
    },
    { 
      id: 'want', 
      title: 'الرغبات والكماليات', 
      percentNum: 30,
      description: 'القهوة، المطاعم، الشوبينغ، السفر والاشتراكات الترفيهية. نوصي ألا تتخطى مصاريف الرفاهية %30.',
      color: 'bg-amber-500', 
      textColor: 'text-amber-600 dark:text-amber-400',
      badgeBg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
      items: categories.filter(c => c.type === 'want') 
    },
    { 
      id: 'saving', 
      title: 'الادخار وبناء المستقبل', 
      percentNum: 20,
      description: 'حسابات الادخار، حصالة الطوارئ أو تسديد الالتزامات. حافظ على %20 على الأقل لبناء غدٍ أضمن.',
      color: 'bg-emerald-500', 
      textColor: 'text-emerald-600 dark:text-emerald-400',
      badgeBg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
      items: categories.filter(c => c.type === 'saving') 
    },
  ];

  return (
    <div className="space-y-8 text-right font-tajawal">
      <div className="flex items-center justify-between pb-3 border-b border-slate-150 dark:border-slate-800">
        <div>
          <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
            <PieChart size={17} className="text-indigo-500" />
            <span>ميزانيات الفئات الفردية</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">
            حدد سقفاً مخصصاً لكل فئة مع إمكانية اختيار دورة أسبوعية (مثل قفة السوق) أو شهرية
          </p>
        </div>
      </div>

      {groupedCategories.map((group, groupIdx) => (
        <motion.div 
          key={group.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: groupIdx * 0.08 }}
          className="space-y-4"
        >
          {/* Section Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <div className={cn("w-3 h-3 rounded-full shrink-0", group.color)} />
              <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>{group.title}</span>
                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md font-mono", group.badgeBg)}>
                  %{group.percentNum} المقترح
                </span>
              </h4>
            </div>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full font-mono">
              {group.items.length} فئات
            </span>
          </div>

          {/* Grid of category cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {group.items.length > 0 ? (
              group.items.map((cat) => {
                const period: BudgetPeriod = categoryPeriods[cat.id] || 'monthly';
                const isWeekly = period === 'weekly';

                const monthSpent = currentMonthExpenses
                  .filter(e => e.categoryId === cat.id)
                  .reduce((sum, e) => sum + e.amount, 0);

                const weekSpent = currentWeekExpenses
                  .filter(e => e.categoryId === cat.id)
                  .reduce((sum, e) => sum + e.amount, 0);

                const spent = isWeekly ? weekSpent : monthSpent;
                const catBudgetStr = categoryBudgets[cat.id] || '';
                const catBudgetNum = Number(catBudgetStr) || 0;

                const status = categoryStatusesLookup?.[cat.id];
                const effectiveLimit = (rollingBudgetEnabled && isWeekly && status?.effectiveLimit !== undefined) ? status.effectiveLimit : catBudgetNum;
                const pastSurplusDeficit = status?.pastSurplusDeficit || 0;

                const percentage = effectiveLimit > 0 ? (spent / effectiveLimit) * 100 : (spent > 0 ? 100 : 0);
                const isOver = effectiveLimit > 0 && spent > effectiveLimit;
                
                const catRemainingBudget = Math.max(0, effectiveLimit - spent);
                const activeRemainingDays = isWeekly ? remainingDaysInWeek : remainingDays;
                const catSafeDailySpend = (activeRemainingDays > 0 && catRemainingBudget > 0) ? (catRemainingBudget / activeRemainingDays) : 0;

                const equivalentMonthly = isWeekly && effectiveLimit > 0 ? Math.round(effectiveLimit * 4.333) : null;
                const equivalentWeekly = !isWeekly && effectiveLimit > 0 ? Math.round(effectiveLimit / 4.333) : null;

                return (
                  <div
                    key={cat.id}
                    className={cn(
                      "bg-white dark:bg-slate-900 border rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between shadow-2xs hover:border-slate-300 dark:hover:border-slate-700",
                      isOver 
                        ? "border-rose-200 dark:border-rose-900/50 bg-rose-50/15 dark:bg-rose-950/10" 
                        : "border-slate-200/80 dark:border-slate-800"
                    )}
                  >
                    <div className="space-y-3">
                      {/* Card Header: Icon, Name, Type & Period Toggle */}
                      <div className="flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div 
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                            style={{ backgroundColor: cat.color }}
                          >
                            <DynamicIcon name={cat.icon || 'Circle'} size={18} />
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-xs font-black text-slate-900 dark:text-white truncate">{cat.name}</h5>
                            <span className="text-[9px] text-slate-400 font-medium">
                              {cat.type === 'need' ? 'احتياج ضروري' : cat.type === 'want' ? 'رغبة وكماليات' : 'ادخار'}
                            </span>
                          </div>
                        </div>

                        {/* Interval Toggle: Weekly / Monthly */}
                        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              hapticFeedback('light');
                              handleCategoryPeriodChange(cat.id, 'weekly');
                            }}
                            className={cn(
                              "px-2 py-1 rounded-md text-[9px] font-black transition-all flex items-center gap-1 cursor-pointer",
                              isWeekly
                                ? "bg-amber-500 text-white shadow-2xs"
                                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                            )}
                            title="ميزانية أسبوعية"
                          >
                            <Zap size={9} />
                            <span>أسبوعي</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              hapticFeedback('light');
                              handleCategoryPeriodChange(cat.id, 'monthly');
                            }}
                            className={cn(
                              "px-2 py-1 rounded-md text-[9px] font-black transition-all flex items-center gap-1 cursor-pointer",
                              !isWeekly
                                ? "bg-indigo-600 text-white shadow-2xs"
                                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                            )}
                            title="ميزانية شهرية"
                          >
                            <Calendar size={9} />
                            <span>شهري</span>
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar & Status */}
                      <div className="space-y-1 bg-slate-50 dark:bg-slate-950/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/50">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-400 font-bold">
                            {isWeekly ? 'المصروف هذا الأسبوع:' : 'المصروف هذا الشهر:'}
                            <span className="text-slate-700 dark:text-slate-300 font-mono font-black mr-1">
                              {formatCurrency(spent, currency)}
                            </span>
                          </span>
                          <span className={cn(
                            "font-black font-mono px-1.5 py-0.5 rounded",
                            isOver ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400" :
                            percentage > 85 ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400" :
                            catBudgetNum > 0 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" :
                            "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                          )}>
                            {catBudgetNum === 0 ? 'غير محدد' : `${Math.round(percentage)}%`}
                          </span>
                        </div>

                        {/* Progress track */}
                        <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          {catBudgetNum > 0 && (
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, percentage)}%` }}
                              className={cn(
                                "h-full rounded-full transition-all duration-300",
                                isOver ? "bg-rose-500" : percentage > 85 ? "bg-amber-500" : isWeekly ? "bg-amber-500" : "bg-indigo-600"
                              )}
                            />
                          )}
                        </div>

                        {/* Rollover Note for Weekly categories */}
                        {rollingBudgetEnabled && isWeekly && catBudgetNum > 0 && pastSurplusDeficit !== 0 && (
                          <div className="text-[9px] font-bold pt-1 text-indigo-600 dark:text-indigo-300 flex justify-between items-center">
                            <span>متدحرجة 🔄:</span>
                            <span className="font-mono">
                              {formatCurrency(effectiveLimit, currency)} ({pastSurplusDeficit > 0 ? `+${formatCurrency(pastSurplusDeficit, currency)} فائض` : `-${formatCurrency(Math.abs(pastSurplusDeficit), currency)} عجز`})
                            </span>
                          </div>
                        )}

                        {/* Safe Daily Spend */}
                        {catBudgetNum > 0 && activeRemainingDays > 0 && !isOver && (
                          <div className="text-[9px] font-bold text-slate-400 flex justify-between items-center pt-1 border-t border-slate-200/40 dark:border-slate-800/40">
                            <span>المسموح اليومي ({activeRemainingDays} يوم):</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-mono font-black">
                              {formatCurrency(catSafeDailySpend, currency)} / يوم
                            </span>
                          </div>
                        )}

                        {/* Equivalents for reference */}
                        {equivalentMonthly && (
                          <div className="text-[9px] text-slate-400 flex justify-between items-center pt-0.5">
                            <span>المعادل التقديري للشهر:</span>
                            <span className="font-mono">~{formatCurrency(equivalentMonthly, currency)}</span>
                          </div>
                        )}
                        {equivalentWeekly && (
                          <div className="text-[9px] text-slate-400 flex justify-between items-center pt-0.5">
                            <span>المعادل التقديري للأسبوع:</span>
                            <span className="font-mono">~{formatCurrency(equivalentWeekly, currency)}</span>
                          </div>
                        )}

                        {isOver && (
                          <div className="text-[9px] font-bold text-rose-500 dark:text-rose-400 pt-1 flex items-center gap-1">
                            <AlertTriangle size={11} />
                            <span>تجاوزت سقف الميزانية المرصودة لهذه الفئة!</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom: Allocation Input & Remaining Balance */}
                    <div className="flex items-center justify-between gap-3 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex-1 relative">
                        <input
                          type="number"
                          inputMode="decimal"
                          value={catBudgetStr}
                          onChange={(e) => handleCategoryBudgetChange(cat.id, e.target.value)}
                          onFocus={(e) => {
                            if (!catBudgetStr || catBudgetStr === '0' || catBudgetStr === '0.00' || parseFloat(catBudgetStr) === 0) {
                              handleCategoryBudgetChange(cat.id, '');
                            } else {
                              const target = e.target;
                              setTimeout(() => {
                                try { target.setSelectionRange(0, target.value.length); } catch { target.select(); }
                              }, 50);
                            }
                          }}
                          className={cn(
                            "w-full bg-slate-50 dark:bg-slate-950/50 border rounded-xl px-3 py-1.5 text-xs font-black text-slate-900 dark:text-white outline-none transition-all text-center font-mono",
                            isWeekly 
                              ? "focus:border-amber-500 border-amber-200/50 dark:border-amber-900/30" 
                              : "focus:border-indigo-500 border-slate-200 dark:border-slate-800"
                          )}
                          placeholder={isWeekly ? "الميزانية الأسبوعية" : "الميزانية الشهرية"}
                        />
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">
                          {currency}
                        </span>
                      </div>
                      
                      <div className="text-left shrink-0">
                        <span className="text-[9px] font-bold text-slate-400 block">المتبقي</span>
                        <span className={cn(
                          "text-xs font-black font-mono",
                          (effectiveLimit - spent) >= 0 ? "text-emerald-500" : "text-rose-500"
                        )}>
                          {formatCurrency(effectiveLimit - spent, currency)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full">
                <EmptyState
                  icon={CircleAlert}
                  title="لا توجد فئات لهذا التصنيف"
                  description="انتقل لقسم الفئات لتفعيل أو تعديل تصنيفات الميزانية."
                />
              </div>
            )}
          </div>

        </motion.div>
      ))}
    </div>
  );
};

export default BudgetCategoryList;
