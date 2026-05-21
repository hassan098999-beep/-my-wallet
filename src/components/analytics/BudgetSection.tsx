import React from 'react';
import { motion } from 'motion/react';
import { Target, TriangleAlert, ShieldCheck, Activity, TrendingUp } from 'lucide-react';
import { formatCurrency, cn, hapticFeedback } from '../../utils';
import { DynamicIcon } from '../DynamicIcon';

interface BudgetSectionProps {
  budget: any;
  rangeType: 'monthly' | 'custom';
  selectedMonth: string;
  totalMonthlyExpense: number;
  totalMonthlyIncome: number;
  currency: string;
  categories: any[];
  categoryData: any[];
  filteredExpenses: any[];
  itemVariants: any;
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
  // Computations for 50/30/20 rule
  const getBudgetAmountsAndPercents = () => {
    const needAmt = filteredExpenses
      .filter(e => categories.find(c => c.id === e.categoryId)?.type === 'need')
      .reduce((sum, e) => sum + e.amount, 0);
      
    const wantAmt = filteredExpenses
      .filter(e => categories.find(c => c.id === e.categoryId)?.type === 'want')
      .reduce((sum, e) => sum + e.amount, 0);
      
    const savingAmt = filteredExpenses
      .filter(e => categories.find(c => c.id === e.categoryId)?.type === 'saving')
      .reduce((sum, e) => sum + e.amount, 0);

    const targetIncome = totalMonthlyIncome || 1;
    const needPercent = (needAmt / targetIncome) * 100;
    const wantPercent = (wantAmt / targetIncome) * 100;
    const savingPercent = (savingAmt / targetIncome) * 100;

    // Scores
    const needScore = Math.max(0, 100 - Math.max(0, (needAmt / (targetIncome * 0.5) - 1) * 100));
    const wantScore = Math.max(0, 100 - Math.max(0, (wantAmt / (targetIncome * 0.3) - 1) * 100));
    const savingScore = Math.min(100, (savingAmt / (targetIncome * 0.2)) * 100);

    const performanceScore = Math.round((needScore + wantScore + savingScore) / 3);

    return {
      performanceScore,
      buckets: [
        { 
          type: 'need', 
          label: 'الاحتياجات', 
          target: 50, 
          amount: needAmt,
          percent: needPercent,
          color: 'bg-indigo-500', 
          textColor: 'text-indigo-600 dark:text-indigo-400',
          icon: ShieldCheck,
          description: 'الإيجار، الفواتير، الغذاء، الدواء والنقل.'
        },
        { 
          type: 'want', 
          label: 'الرغبات والترفيه', 
          target: 30, 
          amount: wantAmt,
          percent: wantPercent,
          color: 'bg-amber-500', 
          textColor: 'text-amber-600 dark:text-amber-400',
          icon: Target,
          description: 'المطاعم، ترفيه، تسوق كمالي، المأكولات الخفيفة.'
        },
        { 
          type: 'saving', 
          label: 'الادخار والاستثمار', 
          target: 20, 
          amount: savingAmt,
          percent: savingPercent,
          color: 'bg-emerald-500', 
          textColor: 'text-emerald-600 dark:text-emerald-400',
          icon: TrendingUp,
          description: 'حساب الطوارئ، الذهب، وصناديق الاستثمار.'
        }
      ]
    };
  };

  const { performanceScore, buckets } = getBudgetAmountsAndPercents();

  return (
    <div className="space-y-8">
      {/* Overview General Limits Tracker */}
      {budget && rangeType === 'monthly' && selectedMonth === budget.month ? (
        <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-850 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500">
              <Target size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">الحدود والميزانية الكلية</h3>
              <p className="text-[9px] font-bold text-slate-400 leading-none mt-1">المصاريف الكلية ومستهدفات الفئات الفردية</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Master Budget overall */}
            <div className="bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex justify-between items-end mb-2.5">
                <div>
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200">الميزانية الإجمالية لهذا الشهر</span>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-slate-900 dark:text-white">{formatCurrency(totalMonthlyExpense, currency)}</span>
                  <span className="text-[10px] text-slate-400 mx-1">/</span>
                  <span className="text-xs font-bold text-slate-500">{formatCurrency(budget.amount, currency)}</span>
                </div>
              </div>

              <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (totalMonthlyExpense / budget.amount) * 100)}%` }}
                  transition={{ duration: 0.8 }}
                  className={cn(
                    "h-full rounded-full",
                    totalMonthlyExpense > budget.amount ? "bg-rose-500" : 
                    totalMonthlyExpense > budget.amount * 0.85 ? "bg-amber-500" : "bg-emerald-500"
                  )}
                />
              </div>

              {totalMonthlyExpense > budget.amount && (
                <div className="text-[10px] font-bold text-rose-500 mt-2 flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/20 p-2 rounded-xl border border-rose-100/20">
                  <TriangleAlert size={12} />
                  لقد تخطيت ميزانيتك الكلية بزيادة {formatCurrency(totalMonthlyExpense - budget.amount, currency)}
                </div>
              )}
            </div>

            {/* Custom Category Limits mapping */}
            {budget.categoryBudgets && Object.keys(budget.categoryBudgets).length > 0 && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-850">
                <h4 className="text-xs font-black text-slate-705 dark:text-slate-300 mb-4 uppercase">الميزانيات المستهدفة والمستهلك منها لكل فئة:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(budget.categoryBudgets).map(([categoryId, amount]) => {
                    const category = categories.find(c => c.id === categoryId);
                    if (!category) return null;
                    const spent = categoryData.find(d => d.id === categoryId)?.value || 0;
                    const numericAmount = Number(amount) || 0;
                    const percentage = numericAmount > 0 ? (spent / numericAmount) * 100 : 0;
                    
                    return (
                      <div key={categoryId} className="p-3 bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-5.5 h-5.5 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: category.color }}>
                              <DynamicIcon name={category.icon || 'Circle'} size={11} />
                            </div>
                            <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">{category.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-black text-slate-900 dark:text-white">{formatCurrency(spent, currency)}</span>
                            <span className="text-[9px] text-slate-400 mx-1">/</span>
                            <span className="text-[10px] font-bold text-slate-500">{formatCurrency(numericAmount, currency)}</span>
                          </div>
                        </div>
                        <div className="h-1.5 w-full bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, percentage)}%` }}
                            transition={{ duration: 0.8 }}
                            className={cn(
                              "h-full rounded-full",
                              percentage > 100 ? "bg-rose-500" : 
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
          </div>
        </motion.div>
      ) : (
        <div className="bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-850 text-center flex flex-col items-center justify-center py-10">
          <Target className="text-slate-400 dark:text-slate-500 mb-2" size={28} />
          <h4 className="text-xs font-black text-slate-900 dark:text-white">لم تقم بتعيين ميزانية لهذا الشهر</h4>
          <p className="text-[10px] text-slate-400 font-bold max-w-[280px] mt-1.5 leading-relaxed">
            لضبط أهداف الادخار والحصول على تنبيهات لتجاوز الحد المسموح، يرجى التوجه لصفحة الموازنة.
          </p>
        </div>
      )}

      {/* Modern 50/30/20 Bento Board */}
      <div className="space-y-5">
        <div className="flex items-center justify-between px-1">
          <div className="space-y-0.5">
            <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">قاعدة التوزيع الذكي 50/30/20</h3>
            <p className="text-[9px] text-slate-400 font-bold">نموذج التوازن المالي الأمثل للاحتياجات، الرغبات، والمدخرات</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Circular compliance gauge card */}
          <motion.div 
            variants={itemVariants}
            className="md:col-span-1 bg-slate-950 dark:bg-black rounded-3xl p-6 text-white relative overflow-hidden shadow-sm flex flex-col justify-between items-center text-center border border-slate-900"
          >
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-505/20 rounded-full blur-2xl pointer-events-none" />
            
            <div className="space-y-1 w-full">
              <p className="text-[9px] font-black opacity-50 uppercase tracking-widest leading-none">مؤشر الصحة المالية</p>
              <h4 className="text-sm font-black tracking-tight mt-1">مدى جودة الصرف</h4>
            </div>

            <div className="my-6 relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  className="text-white/5"
                />
                <motion.circle
                  cx="56"
                  cy="56"
                  r="48"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeDasharray="301.6"
                  initial={{ strokeDashoffset: 301.6 }}
                  animate={{ strokeDashoffset: 301.6 - (301.6 * (performanceScore / 100)) }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="text-indigo-500"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black tracking-tighter">{performanceScore}</span>
                <span className="text-[8px] opacity-40 uppercase tracking-wider font-bold">من 100</span>
              </div>
            </div>

            <p className="text-[9px] font-bold text-slate-400 leading-relaxed max-w-[140px]">
              كلما اقتربت النسبة من 100، كلما كان تخطيطك ممتازاً للادخار والمصاريف.
            </p>
          </motion.div>

          {/* Three buckets bento cards */}
          <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
            {buckets.map((bucket) => {
              const targetAmount = totalMonthlyIncome * (bucket.target / 100);
              const isOver = bucket.type !== 'saving' ? bucket.percent > bucket.target : bucket.percent < bucket.target;
              
              return (
                <motion.div 
                  key={bucket.type} 
                  variants={itemVariants} 
                  className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-850 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white", bucket.color)}>
                        <bucket.icon size={20} />
                      </div>
                      <div className="text-right">
                        <span className={cn("text-xl font-black", (bucket.type !== 'saving' && bucket.percent > bucket.target) ? "text-rose-500" : bucket.textColor)}>
                          {Math.round(bucket.percent)}%
                        </span>
                        <p className="text-[8px] font-black text-slate-400 tracking-wider">المستهدف: {bucket.target}%</p>
                      </div>
                    </div>

                    <div className="space-y-1 mb-4">
                      <h4 className="text-xs font-black text-slate-805 dark:text-white">{bucket.label}</h4>
                      <p className="text-[9px] text-slate-400 font-bold leading-relaxed">{bucket.description}</p>
                    </div>
                  </div>

                  <div className="space-y-3.5 mt-auto">
                    <div className="flex justify-between items-end text-[10px]">
                      <span className="font-black text-slate-900 dark:text-white">
                        {formatCurrency(bucket.amount, currency)}
                      </span>
                      <span className="text-[8px] font-bold text-slate-400">
                        من {formatCurrency(targetAmount, currency)}
                      </span>
                    </div>

                    <div className="w-full bg-slate-55 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, performanceScore > 0 ? bucket.percent : 0)}%` }}
                        transition={{ duration: 1 }}
                        className={cn("h-full rounded-full", (bucket.type !== 'saving' && bucket.percent > bucket.target) ? "bg-rose-500" : bucket.color)}
                      />
                    </div>

                    {bucket.type !== 'saving' && bucket.percent > bucket.target && (
                      <div className="flex items-center gap-1.5 text-rose-500 bg-rose-50/50 dark:bg-rose-950/20 px-2 py-1.5 rounded-xl border border-rose-100/25 text-[8px] font-bold">
                        <TriangleAlert size={10} />
                        تجاوز نسبة الاستحقاق الأفضل
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
