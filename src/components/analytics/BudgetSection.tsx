import React from 'react';
import { motion, Variants } from 'motion/react';
import { 
  Target, 
  TriangleAlert, 
  ShieldCheck, 
  Activity, 
  TrendingUp, 
  PieChart, 
  ArrowUpRight,
  CheckCircle2,
  Sliders,
  Wallet
} from 'lucide-react';
import { formatCurrency, cn, hapticFeedback } from '../../utils';
import { DynamicIcon } from '../DynamicIcon';
import { Link } from 'react-router-dom';
import { Category, Expense, Budget } from '../../types';

interface BudgetSectionProps {
  budget: Budget | undefined;
  rangeType: 'monthly' | 'custom';
  selectedMonth: string;
  totalMonthlyExpense: number;
  totalMonthlyIncome: number;
  currency: string;
  categories: Category[];
  categoryData: any[];
  filteredExpenses: Expense[];
  itemVariants: Variants;
}

export const BudgetSection: React.FC<BudgetSectionProps> = ({
  budget,
  rangeType,
  selectedMonth,
  totalMonthlyExpense,
  totalMonthlyIncome,
  currency,
  categories,
  categoryData,
  filteredExpenses,
  itemVariants,
}) => {
  // Computations for spending structure by category nature
  const budgetRuleStats = React.useMemo(() => {
    const needAmt = filteredExpenses
      .filter(e => {
        const cat = categories.find(c => c.id === e.categoryId);
        return cat?.type === 'need' || !cat?.type;
      })
      .reduce((sum, e) => sum + e.amount, 0);
      
    const wantAmt = filteredExpenses
      .filter(e => categories.find(c => c.id === e.categoryId)?.type === 'want')
      .reduce((sum, e) => sum + e.amount, 0);
      
    const savingAmt = filteredExpenses
      .filter(e => categories.find(c => c.id === e.categoryId)?.type === 'saving')
      .reduce((sum, e) => sum + e.amount, 0);

    const totalCalculated = totalMonthlyExpense > 0 ? totalMonthlyExpense : 1;
    const needPercent = (needAmt / totalCalculated) * 100;
    const wantPercent = (wantAmt / totalCalculated) * 100;
    const savingPercent = (savingAmt / totalCalculated) * 100;

    // Allocated budgets for each bucket
    const needBudget = categories
      .filter(c => c.type === 'need' || !c.type)
      .reduce((sum, c) => sum + (budget?.categoryBudgets?.[c.id] || 0), 0);

    const wantBudget = categories
      .filter(c => c.type === 'want')
      .reduce((sum, c) => sum + (budget?.categoryBudgets?.[c.id] || 0), 0);

    const savingBudget = categories
      .filter(c => c.type === 'saving')
      .reduce((sum, c) => sum + (budget?.categoryBudgets?.[c.id] || 0), 0);

    return {
      buckets: [
        { 
          type: 'need', 
          label: 'الاحتياجات الضرورية', 
          amount: needAmt,
          percent: needPercent,
          allocatedBudget: needBudget,
          color: 'bg-indigo-500', 
          textColor: 'text-indigo-600 dark:text-indigo-400',
          bgLight: 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900/50',
          icon: ShieldCheck,
          description: 'الإيجار، الفواتير، الغذاء، الدواء والنقل الأساسي.'
        },
        { 
          type: 'want', 
          label: 'الرغبات ونمط الحياة', 
          amount: wantAmt,
          percent: wantPercent,
          allocatedBudget: wantBudget,
          color: 'bg-amber-500', 
          textColor: 'text-amber-600 dark:text-amber-400',
          bgLight: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50',
          icon: Target,
          description: 'المطاعم، الترفيه، التسوق، والأنشطة الترويحية.'
        },
        { 
          type: 'saving', 
          label: 'الادخار والاستثمار', 
          amount: savingAmt,
          percent: savingPercent,
          allocatedBudget: savingBudget,
          color: 'bg-emerald-500', 
          textColor: 'text-emerald-600 dark:text-emerald-400',
          bgLight: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50',
          icon: TrendingUp,
          description: 'حساب الطوارئ، الذهب، وصناديق الاستثمار والمدخرات.'
        }
      ]
    };
  }, [filteredExpenses, categories, totalMonthlyExpense, budget]);

  const hasMasterBudget = Boolean(budget && budget.amount > 0);
  const budgetAmount = budget?.amount || 0;
  const budgetSpentPercent = hasMasterBudget ? Math.min(100, Math.round((totalMonthlyExpense / budgetAmount) * 100)) : 0;
  const isOverBudget = hasMasterBudget && totalMonthlyExpense > budgetAmount;

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* 1. Master Budget Card */}
      {hasMasterBudget && rangeType === 'monthly' ? (
        <motion.div 
          variants={itemVariants} 
          className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden"
        >
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className={cn(
                "p-2 rounded-xl border",
                isOverBudget 
                  ? "bg-rose-50 dark:bg-rose-950/40 text-rose-500 border-rose-200 dark:border-rose-900/50" 
                  : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 border-indigo-200 dark:border-indigo-900/50"
              )}>
                <Target size={18} />
              </div>
              <div>
                <h3 className="text-sm md:text-base font-black text-slate-900 dark:text-white">الميزانية الكلية المستهدفة</h3>
                <p className="text-[11px] font-semibold text-slate-400">سقف المصاريف المحدد لشهر {selectedMonth}</p>
              </div>
            </div>

            <Link 
              to="/budget" 
              className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
            >
              <span>تعديل الميزانية</span>
              <ArrowUpRight size={12} />
            </Link>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-3">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-xs font-black text-slate-700 dark:text-slate-300">نسبة الاستهلاك الإجمالية</span>
                <p className="text-[10px] font-semibold text-slate-400 mt-0.5">
                  {isOverBudget ? 'تم تجاوز الميزانية' : `المتبقي: ${formatCurrency(budgetAmount - totalMonthlyExpense, currency)}`}
                </p>
              </div>
              <div className="text-left font-mono">
                <span className="text-base md:text-lg font-black text-slate-900 dark:text-white">{formatCurrency(totalMonthlyExpense, currency)}</span>
                <span className="text-xs text-slate-400 mx-1">/</span>
                <span className="text-xs font-bold text-slate-500">{formatCurrency(budgetAmount, currency)}</span>
              </div>
            </div>

            <div className="h-2.5 w-full bg-slate-200/70 dark:bg-slate-700/70 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (totalMonthlyExpense / budgetAmount) * 100)}%` }}
                transition={{ duration: 0.8 }}
                className={cn(
                  "h-full rounded-full transition-all",
                  isOverBudget ? "bg-rose-500" : 
                  totalMonthlyExpense > budgetAmount * 0.85 ? "bg-amber-500" : "bg-emerald-500"
                )}
              />
            </div>

            {isOverBudget && (
              <div className="text-[11px] font-black text-rose-600 dark:text-rose-400 flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50">
                <TriangleAlert size={14} className="shrink-0" />
                <span>تجاوزت الميزانية الإجمالية بمقدار {formatCurrency(totalMonthlyExpense - budgetAmount, currency)}</span>
              </div>
            )}
          </div>

          {/* Individual Category Caps */}
          {budget?.categoryBudgets && Object.keys(budget.categoryBudgets).length > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-1.5">
                <Sliders size={13} className="text-indigo-500" />
                <span>متابعة سقوف الفئات المخصصة:</span>
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(budget.categoryBudgets).map(([categoryId, amount]) => {
                  const category = categories.find(c => c.id === categoryId);
                  if (!category) return null;
                  const spent = categoryData.find(d => d.id === categoryId)?.value || 0;
                  const numericAmount = Number(amount) || 0;
                  const percentage = numericAmount > 0 ? (spent / numericAmount) * 100 : 0;
                  const isCatOver = spent > numericAmount;

                  return (
                    <div 
                      key={categoryId} 
                      className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-between"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0" style={{ backgroundColor: category.color }}>
                            <DynamicIcon name={category.icon || 'Circle'} size={12} />
                          </div>
                          <span className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">{category.name}</span>
                        </div>
                        <div className="text-left font-mono shrink-0 text-xs">
                          <span className={cn("font-black", isCatOver ? "text-rose-500" : "text-slate-900 dark:text-white")}>
                            {formatCurrency(spent, currency)}
                          </span>
                          <span className="text-[10px] text-slate-400 mx-1">/</span>
                          <span className="text-[10px] text-slate-400">{formatCurrency(numericAmount, currency)}</span>
                        </div>
                      </div>

                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, percentage)}%` }}
                          transition={{ duration: 0.8 }}
                          className={cn(
                            "h-full rounded-full",
                            isCatOver ? "bg-rose-500" : 
                            percentage > 85 ? "bg-amber-500" : "bg-emerald-500"
                          )}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 text-center flex flex-col items-center justify-center py-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 flex items-center justify-center mb-3">
            <Target size={24} />
          </div>
          <h4 className="text-sm font-black text-slate-900 dark:text-white">لم يتم تعيين ميزانية لهذا الشهر بعد</h4>
          <p className="text-xs text-slate-400 font-medium max-w-xs mt-1 leading-relaxed">
            حدد سقفاً شهرياً لمصاريفك للتحكم في النفقات والحصول على تنبيهات تجاوز الميزانية.
          </p>
          <Link
            to="/budget"
            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer"
          >
            ضبط الميزانية الآن
          </Link>
        </div>
      )}

      {/* 2. Modern Spending Structure Board */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-sm md:text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>هيكل توزيع المصاريف حسب طبيعة الإنفاق</span>
              <span className="text-xs">⚖️</span>
            </h3>
            <p className="text-[11px] font-semibold text-slate-400">
              توزيع المصاريف الفعلية والميزانيات المرصودة بين الضروريات، نمط الحياة، والمدخرات
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {budgetRuleStats.buckets.map((bucket) => {
            const hasAllocated = bucket.allocatedBudget > 0;
            const isOverAllocated = hasAllocated && bucket.amount > bucket.allocatedBudget;
            
            return (
              <motion.div 
                key={bucket.type} 
                variants={itemVariants} 
                className={cn(
                  "rounded-3xl p-5 border flex flex-col justify-between transition-all bg-white dark:bg-slate-900",
                  bucket.bgLight
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs", bucket.color)}>
                      <bucket.icon size={18} />
                    </div>
                    <div className="text-left font-mono">
                      <span className={cn("text-lg font-black", isOverAllocated ? "text-rose-500" : bucket.textColor)}>
                        {Math.round(bucket.percent)}%
                      </span>
                      <p className="text-[9px] font-black text-slate-400">من إجمالي المصاريف</p>
                    </div>
                  </div>

                  <div className="space-y-1 mb-4">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">{bucket.label}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{bucket.description}</p>
                  </div>
                </div>

                <div className="space-y-2 mt-auto pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                  <div className="flex justify-between items-center text-xs font-mono font-bold">
                    <span className="text-slate-900 dark:text-white">{formatCurrency(bucket.amount, currency)}</span>
                    {hasAllocated && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        الميزانية: {formatCurrency(bucket.allocatedBudget, currency)}
                      </span>
                    )}
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ 
                        width: `${Math.min(100, hasAllocated ? (bucket.amount / bucket.allocatedBudget) * 100 : bucket.percent)}%` 
                      }}
                      transition={{ duration: 1 }}
                      className={cn(
                        "h-full rounded-full",
                        isOverAllocated ? "bg-rose-500" : bucket.color
                      )}
                    />
                  </div>

                  {isOverAllocated && (
                    <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400 text-[10px] font-black">
                      <TriangleAlert size={11} />
                      <span>تجاوز الميزانية المرصودة</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
