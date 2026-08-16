import React from 'react';
import { motion } from 'motion/react';
import { PieChart, CircleAlert, Calendar, Zap } from 'lucide-react';
import { DynamicIcon } from '../DynamicIcon';
import Card from '../ui/Card';
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
}) => {
  // Grouped Categories mapped to standard system categories
  const groupedCategories = [
    { 
      id: 'need', 
      title: 'الاحتياجات الضرورية والمصاريف الأساسية', 
      percentNum: 50,
      description: 'الفواتير، الأكل والشرب، النقل، الكراء ومصاريف التداوي. نوصي بتخصيص %50 كحد أقصى للتحكم في قفة العائلة.',
      color: 'bg-rose-500', 
      items: categories.filter(c => c.type === 'need' || !c.type) 
    },
    { 
      id: 'want', 
      title: 'الرغبات ومصاريف الرفاهية والكماليات', 
      percentNum: 30,
      description: 'القهوة، المطاعم، الشوبينغ، السفر والاشتراكات الترفيهية. نوصي ألا تتخطى مصاريف الرفاهية %30.',
      color: 'bg-amber-500', 
      items: categories.filter(c => c.type === 'want') 
    },
    { 
      id: 'saving', 
      title: 'الادخار الشخصي والاستثمار وبناء المستقبل', 
      percentNum: 20,
      description: 'حسابات الإدخار، حصالة الأطفال، الاستثمار أو تسديد الديون الطارئة. حافظ على %20 على الأقل لبناء غدٍ أضمن.',
      color: 'bg-emerald-500', 
      items: categories.filter(c => c.type === 'saving') 
    },
  ];

  return (
    <div className="space-y-10">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
          <PieChart size={18} className="text-indigo-500" />
          <span>تنظيم وتفصيل ميزانية الفئات الفردية</span>
        </h3>
        <p className="text-xs text-slate-400 mt-1 font-bold">
          خصّص ميزانية دقيقة لكل فئة وحدد فترتها (أسبوعياً لمصاريف كالسوق والقفة، أو شهرياً للترفيه والفواتير)
        </p>
      </div>

      {groupedCategories.map((group, groupIdx) => (
        <motion.div 
          key={group.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: groupIdx * 0.12 }}
          className="space-y-4"
        >
          {/* Header of Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-1">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className={cn("w-3.5 h-3.5 rounded-full shadow-xs", group.color)} />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>{group.title}</span>
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-mono">%{group.percentNum} المقترح</span>
                </h4>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold max-w-3xl leading-relaxed">
                {group.description}
              </p>
            </div>
            <span className="text-[10px] font-semibold text-slate-500 shrink-0 self-start md:self-center bg-slate-50 dark:bg-slate-850 px-2.5 py-1 rounded-full border border-slate-100 dark:border-slate-800 font-mono">{group.items.length} فئات فعالة</span>
          </div>

          {/* Grid of details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                const percentage = catBudgetNum > 0 ? (spent / catBudgetNum) * 100 : 0;
                const isOver = catBudgetNum > 0 && spent > catBudgetNum;
                
                const catRemainingBudget = Math.max(0, catBudgetNum - spent);
                const activeRemainingDays = isWeekly ? remainingDaysInWeek : remainingDays;
                const catSafeDailySpend = (activeRemainingDays > 0 && catRemainingBudget > 0) ? (catRemainingBudget / activeRemainingDays) : 0;

                const equivalentMonthly = isWeekly && catBudgetNum > 0 ? Math.round(catBudgetNum * 4.333) : null;
                const equivalentWeekly = !isWeekly && catBudgetNum > 0 ? Math.round(catBudgetNum / 4.333) : null;

                return (
                  <Card
                    key={cat.id}
                    className={cn(
                      "p-5 border-2 transition-all relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs flex flex-col justify-between",
                      isOver 
                        ? "border-rose-200 dark:border-rose-800/40 bg-rose-50/20 dark:bg-rose-950/10" 
                        : "border-slate-100 dark:border-slate-800/60"
                    )}
                    interactive
                  >
                    <div>
                      {/* Top components of Card */}
                      <div className="flex items-start gap-3.5 mb-4">
                        <div 
                          className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform shrink-0 mt-0.5"
                          style={{ backgroundColor: cat.color }}
                        >
                          <DynamicIcon name={cat.icon || 'Circle'} size={22} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <h5 className="text-xs font-black text-slate-900 dark:text-white truncate">{cat.name}</h5>
                              <p className="text-[9px] text-slate-450 dark:text-slate-500 font-bold mt-0.5">
                                {cat.type === 'need' ? 'احتياج ضروري' : cat.type === 'want' ? 'رفاهية وكماليات' : 'إدخار واستثمار'}
                              </p>
                            </div>
                            
                            {/* Segmented Weekly / Monthly interval switch */}
                            <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  hapticFeedback('light');
                                  handleCategoryPeriodChange(cat.id, 'weekly');
                                }}
                                className={cn(
                                  "px-2 py-1 rounded-md text-[9px] font-black transition-all flex items-center gap-1 cursor-pointer",
                                  isWeekly
                                    ? "bg-amber-500 text-white shadow-xs"
                                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                )}
                                title="ميزانية تتجدد كل أسبوع (مثال: قفة السوق)"
                              >
                                <Zap size={10} />
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
                                    ? "bg-indigo-600 text-white shadow-xs"
                                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                )}
                                title="ميزانية للشهر بالكامل (مثال: الفواتير أو الترفيه)"
                              >
                                <Calendar size={10} />
                                <span>شهري</span>
                              </button>
                            </div>
                          </div>

                          {/* Spent Indicator */}
                          <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-slate-100/60 dark:border-slate-800/40 text-xs">
                            <span className="text-[10px] text-slate-400 font-bold">
                              {isWeekly ? 'صرف هذا الأسبوع:' : 'صرف هذا الشهر:'}
                            </span>
                            <span className={cn("text-xs font-black font-mono", spent > 0 ? "text-slate-800 dark:text-slate-200" : "text-slate-400")}>
                              {formatCurrency(spent, currency)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Display Progress Indicator */}
                      <div className="space-y-3.5 mb-4">
                        <div className="space-y-1.5 p-2.5 rounded-lg bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100/50 dark:border-slate-800/40">
                          <div className="flex justify-between items-center text-[10px]">
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400 font-bold">حالة الصرف:</span>
                              <span className={cn(
                                "text-[8px] font-black px-1.5 py-0.5 rounded-md",
                                isWeekly ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300" : "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300"
                              )}>
                                {isWeekly ? '⚡ دورة أسبوعية' : '🗓️ دورة شهرية'}
                              </span>
                            </div>
                            <span className={cn(
                              "font-black font-sans px-1.5 py-0.5 rounded-md text-[9px]",
                              isOver ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400" :
                              percentage > 85 ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400" :
                              catBudgetNum > 0 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" :
                              "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            )}>
                              {catBudgetNum === 0 ? 'غير محدد' : `${Math.round(percentage)}%`}
                            </span>
                          </div>

                          <div className="h-2 bg-slate-150 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner relative">
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
                          
                          {/* Smart Daily Safe Spend Indicator & Burn Rate Velocity */}
                          {catBudgetNum > 0 && activeRemainingDays > 0 && !isOver && (() => {
                            const totalDays = isWeekly ? 7 : 30;
                            const daysElapsed = Math.max(1, totalDays - activeRemainingDays + 1);
                            const currentDailyRate = spent > 0 ? spent / daysElapsed : 0;
                            const daysUntilExhaustion = currentDailyRate > 0 ? Math.floor((catBudgetNum - spent) / currentDailyRate) : null;
                            const isFastBurning = daysUntilExhaustion !== null && daysUntilExhaustion < activeRemainingDays;

                            return (
                              <div className="mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-800/50 space-y-1.5">
                                <div className="flex justify-between items-center">
                                  <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">
                                    {isWeekly ? `مسموح الصرف اليومي (${activeRemainingDays} أيام متبقية):` : `مسموح الصرف اليومي (${activeRemainingDays} يوم متبقٍ):`}
                                  </span>
                                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 font-mono">
                                    {formatCurrency(catSafeDailySpend, currency)} <span className="text-[8px] font-bold text-slate-400">/ يوم</span>
                                  </span>
                                </div>

                                {spent > 0 && (
                                  <div className="flex justify-between items-center text-[9px]">
                                    <span className="text-slate-400 font-bold flex items-center gap-1">
                                      <span>معدل الصرف اليومي الفعلي:</span>
                                      {isFastBurning && <span className="text-[8px] font-black text-amber-500 animate-pulse">⚠️ سريع</span>}
                                    </span>
                                    <span className={cn(
                                      "font-black font-mono",
                                      isFastBurning ? "text-amber-600 dark:text-amber-400" : "text-slate-600 dark:text-slate-300"
                                    )}>
                                      {formatCurrency(currentDailyRate, currency)} <span className="text-[8px] text-slate-400">/ يوم</span>
                                    </span>
                                  </div>
                                )}

                                {isFastBurning && daysUntilExhaustion !== null && (
                                  <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40 text-[9px] font-bold text-amber-800 dark:text-amber-300 flex justify-between items-center">
                                    <span>نفاد الميزانية المتوقع:</span>
                                    <span className="font-black text-rose-600 dark:text-rose-400">خلال {Math.max(1, daysUntilExhaustion)} أيام فقط ⚡</span>
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          {/* Equivalent period info for smart budgeting */}
                          {equivalentMonthly && (
                            <div className="text-[9px] font-bold text-slate-400 flex justify-between items-center pt-1 border-t border-dashed border-slate-200/40 dark:border-slate-800/40">
                              <span>المعادل التقديري للشهر:</span>
                              <span className="font-mono text-slate-600 dark:text-slate-300">~{formatCurrency(equivalentMonthly, currency)}</span>
                            </div>
                          )}
                          {equivalentWeekly && (
                            <div className="text-[9px] font-bold text-slate-400 flex justify-between items-center pt-1 border-t border-dashed border-slate-200/40 dark:border-slate-800/40">
                              <span>المعادل التقديري للأسبوع:</span>
                              <span className="font-mono text-slate-600 dark:text-slate-300">~{formatCurrency(equivalentWeekly, currency)}</span>
                            </div>
                          )}

                          {catBudgetNum > 0 && isOver && (
                             <div className="mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-800/50 flex justify-between items-center">
                               <span className="text-[9px] font-bold text-rose-500 dark:text-rose-400">
                                 {isWeekly ? 'تجاوزت الميزانية المحددة لهذا الأسبوع!' : 'تجاوزت الميزانية الشهرية!'}
                               </span>
                             </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Input allocation and remaining display */}
                    <div className="flex items-center justify-between gap-4 mt-auto">
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
                                try {
                                  target.setSelectionRange(0, target.value.length);
                                } catch (err) {
                                  target.select();
                                }
                              }, 50);
                            }
                          }}
                          onClick={(e) => {
                            if (!catBudgetStr || catBudgetStr === '0' || catBudgetStr === '0.00' || parseFloat(catBudgetStr) === 0) {
                              handleCategoryBudgetChange(cat.id, '');
                            } else {
                              const target = e.target as HTMLInputElement;
                              setTimeout(() => {
                                try {
                                  target.setSelectionRange(0, target.value.length);
                                } catch (err) {
                                  target.select();
                                }
                              }, 50);
                            }
                          }}
                          className={cn(
                            "w-full bg-slate-50 dark:bg-slate-950/40 border rounded-xl px-4 py-2.5 text-xs font-black text-slate-900 dark:text-white outline-none transition-all text-center font-mono",
                            isWeekly 
                              ? "focus:border-amber-500 border-amber-200/60 dark:border-amber-900/30" 
                              : "focus:border-indigo-500 border-slate-250 dark:border-slate-800"
                          )}
                          placeholder={isWeekly ? "الميزانية الأسبوعية" : "الميزانية الشهرية"}
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">
                          {currency} {isWeekly ? '/ أس' : '/ ش'}
                        </span>
                      </div>
                      
                      <div className="text-left shrink-0 font-sans">
                        <p className="text-[9px] font-bold text-slate-400 mb-0.5">
                          {isWeekly ? 'باقي الأسبوع' : 'باقي الشهر'}
                        </p>
                        <p className={cn(
                          "text-xs font-black font-mono",
                          (catBudgetNum - spent) >= 0 ? "text-emerald-500" : "text-rose-500"
                        )}>
                          {formatCurrency(catBudgetNum - spent, currency)}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-full">
                <EmptyState
                  icon={CircleAlert}
                  title="لا توجد فئات مخصصة لهذا التصنيف حالياً"
                  description="انتقل لقسم الفئات لتفعيل أو تعديل تصنيفات الميزانية الذكية وتأمينها."
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
