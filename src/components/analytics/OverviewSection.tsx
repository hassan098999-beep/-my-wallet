import React from 'react';
import { motion, Variants } from 'motion/react';
import { 
  Target, 
  Activity, 
  ArrowDownRight, 
  ArrowUpRight, 
  TrendingUp, 
  Lightbulb, 
  Sparkles, 
  ShieldCheck, 
  TriangleAlert,
  Flame,
  Award,
  Wallet,
  Zap,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { formatCurrency, cn, hapticFeedback } from '../../utils';
import { Link } from 'react-router-dom';

interface OverviewSectionProps {
  netBalance: number;
  totalMonthlyIncome: number;
  totalMonthlyExpense: number;
  currency: string;
  filteredExpensesLength: number;
  filteredIncomeLength: number;
  prevMonthExpenses: number;
  prevMonthIncome: number;
  expenseDiff: number;
  incomeDiff: number;
  averageDailyExpense: number;
  highestExpenseDay: { date: string; fullDate: string; expenseAmount: number };
  categoryData: any[];
  insights: any[];
  aiInsights: any;
  itemVariants: Variants;
  dailyBudget: number;
  overBudgetDaysCount?: number;
  noSpendDaysCount?: number;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({
  netBalance,
  totalMonthlyIncome,
  totalMonthlyExpense,
  currency,
  filteredExpensesLength,
  filteredIncomeLength,
  prevMonthExpenses,
  prevMonthIncome,
  expenseDiff,
  incomeDiff,
  averageDailyExpense,
  highestExpenseDay,
  categoryData,
  insights,
  aiInsights,
  itemVariants,
  dailyBudget,
  overBudgetDaysCount = 0,
  noSpendDaysCount = 0,
}) => {
  const savingsRate = totalMonthlyIncome > 0 ? Math.max(0, Math.round((netBalance / totalMonthlyIncome) * 100)) : 0;

  // Calculate comprehensive Financial Health Score (0 - 100)
  const healthScore = React.useMemo(() => {
    let score = 50; // base score

    // 1. Savings Rate factor (up to +35 or -20)
    if (savingsRate >= 25) score += 35;
    else if (savingsRate >= 15) score += 25;
    else if (savingsRate >= 5) score += 10;
    else if (savingsRate <= 0 && totalMonthlyIncome > 0) score -= 25;

    // 2. Budget adherence (up to +15)
    if (netBalance >= 0) score += 10;
    
    // 3. No-spend days factor (up to +10)
    if (noSpendDaysCount >= 5) score += 10;
    else if (noSpendDaysCount >= 2) score += 5;

    // 4. Overbudget days deduction (up to -15)
    if (overBudgetDaysCount > 10) score -= 15;
    else if (overBudgetDaysCount > 5) score -= 8;

    return Math.min(100, Math.max(10, score));
  }, [savingsRate, totalMonthlyIncome, netBalance, noSpendDaysCount, overBudgetDaysCount]);

  const scoreTier = React.useMemo(() => {
    if (healthScore >= 80) return { label: 'عافية مالية ممتازة 🌟', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', desc: 'أداؤك المالي ممتاز ويوفر هوامش أمان وادخار قوية.' };
    if (healthScore >= 60) return { label: 'وضع مالي منضبط 🎯', color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', desc: 'نفقاتك متوازنة مع دخلك، مع إمكانية تحسين هوامش الادخار.' };
    if (healthScore >= 40) return { label: 'يحتاج إلى ترشيد ⚠️', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', desc: 'الإنفاق متقارب مع الدخل، ينصح بمراجعة الرغبات والكماليات.' };
    return { label: 'في دائرة الخطر 🚨', color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20', desc: 'المصاريف تفوق الدخل أو تقترب من استنزافه بالكامل، يتطلب تدخلاً سريعاً.' };
  }, [healthScore]);

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* 1. Primary Financial Health & Net Liquidity Hero Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Financial Health Score Dial (5 cols on lg) */}
        <motion.div 
          variants={itemVariants} 
          className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 rounded-3xl p-6 text-white border border-slate-800 shadow-md relative overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300 flex items-center gap-1.5">
                <Sparkles size={13} className="text-amber-400" />
                <span>مؤشر العافية المالية الذكي</span>
              </span>
              <span className={cn("text-[10px] font-black px-2.5 py-1 rounded-full border", scoreTier.bg, scoreTier.color, scoreTier.border)}>
                {scoreTier.label}
              </span>
            </div>

            <div className="my-5 flex items-center justify-center gap-6">
              {/* Circular Gauge */}
              <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="46"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-white/10"
                  />
                  <motion.circle
                    cx="56"
                    cy="56"
                    r="46"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeDasharray="289"
                    initial={{ strokeDashoffset: 289 }}
                    animate={{ strokeDashoffset: 289 - (289 * (healthScore / 100)) }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className={healthScore >= 70 ? "text-emerald-400" : healthScore >= 50 ? "text-indigo-400" : healthScore >= 35 ? "text-amber-400" : "text-rose-400"}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black font-mono tracking-tighter">{healthScore}</span>
                  <span className="text-[9px] text-slate-400 font-bold uppercase">من 100</span>
                </div>
              </div>

              {/* Quick Health Breakdown Factors */}
              <div className="space-y-2 text-xs flex-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300 font-bold">نسبة الادخار:</span>
                  <span className={cn("font-mono font-black", savingsRate >= 20 ? "text-emerald-400" : savingsRate > 0 ? "text-indigo-300" : "text-rose-400")}>
                    {savingsRate}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300 font-bold">التحكم في النفقات:</span>
                  <span className={cn("font-mono font-black", netBalance >= 0 ? "text-emerald-400" : "text-rose-400")}>
                    {netBalance >= 0 ? 'فائض مالي' : 'عجز مسجل'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300 font-bold">أيام بلا صرف:</span>
                  <span className="font-mono font-black text-amber-400">
                    {noSpendDaysCount} أيام
                  </span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-300 font-medium leading-relaxed bg-white/5 p-3 rounded-2xl border border-white/5">
            {scoreTier.desc}
          </p>
        </motion.div>

        {/* 3 Core Inflow/Outflow/Net Cards (7 cols on lg) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Net Surplus Card */}
          <motion.div 
            variants={itemVariants} 
            className={cn(
              "rounded-3xl p-5 border flex flex-col justify-between transition-all",
              netBalance >= 0 
                ? "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs" 
                : "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50"
            )}
          >
            <div>
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">الصافي المتبقي</span>
                <Wallet size={16} className={netBalance >= 0 ? "text-emerald-500" : "text-rose-500"} />
              </div>
              <div className={cn("text-xl md:text-2xl font-black font-mono", netBalance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                {formatCurrency(Math.abs(netBalance), currency)}
              </div>
            </div>

            <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-bold">
              <span className="text-slate-400">حالة الرصيد:</span>
              <span className={cn(netBalance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                {netBalance >= 0 ? `توفير ${savingsRate}%` : 'عجز مطلوب تغطيته'}
              </span>
            </div>
          </motion.div>

          {/* Income Card */}
          <motion.div 
            variants={itemVariants} 
            className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">إجمالي المقبوضات</span>
                <ArrowDownRight size={16} className="text-emerald-500" />
              </div>
              <div className="text-xl md:text-2xl font-black font-mono text-slate-900 dark:text-white">
                {formatCurrency(totalMonthlyIncome, currency)}
              </div>
            </div>

            <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-bold">
              <span className="text-slate-400">{filteredIncomeLength} مصادر دخل</span>
              {prevMonthIncome > 0 && (
                <span className={cn("font-mono", incomeDiff >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500")}>
                  {incomeDiff >= 0 ? '+' : ''}{incomeDiff.toFixed(0)}%
                </span>
              )}
            </div>
          </motion.div>

          {/* Expenses Card */}
          <motion.div 
            variants={itemVariants} 
            className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">إجمالي المصروفات</span>
                <ArrowUpRight size={16} className="text-rose-500" />
              </div>
              <div className="text-xl md:text-2xl font-black font-mono text-slate-900 dark:text-white">
                {formatCurrency(totalMonthlyExpense, currency)}
              </div>
            </div>

            <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-bold">
              <span className="text-slate-400">{filteredExpensesLength} عملية صرف</span>
              {prevMonthExpenses > 0 && (
                <span className={cn("font-mono", expenseDiff <= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500")}>
                  {expenseDiff >= 0 ? '+' : ''}{expenseDiff.toFixed(0)}%
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* 2. Secondary Practical KPI Indicators Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { 
            label: 'متوسط الصرف اليومي', 
            value: formatCurrency(averageDailyExpense, currency), 
            icon: <Activity size={14} className="text-indigo-500" />,
            sub: 'معدل الحرق اليومي'
          },
          { 
            label: 'أعلى يوم صرفاً', 
            value: highestExpenseDay.date !== '-' ? `${highestExpenseDay.fullDate}` : '-', 
            icon: <Flame size={14} className="text-rose-500" />,
            sub: highestExpenseDay.expenseAmount > 0 ? formatCurrency(highestExpenseDay.expenseAmount, currency) : 'لا يوجد'
          },
          { 
            label: 'أكبر فئة استهلاكاً', 
            value: categoryData.length > 0 ? categoryData[0].name : '-', 
            icon: <Target size={14} className="text-amber-500" />,
            sub: categoryData.length > 0 ? formatCurrency(categoryData[0].value, currency) : '-'
          },
          { 
            label: 'صافي التوفير المحقق', 
            value: `${savingsRate}%`, 
            icon: <Award size={14} className="text-emerald-500" />,
            sub: savingsRate >= 20 ? 'ممتاز (فوق الهدف)' : 'مقبول'
          }
        ].map((item, idx) => (
          <motion.div 
            key={idx}
            variants={itemVariants} 
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{item.label}</span>
              {item.icon}
            </div>
            <span className="text-xs md:text-sm font-black text-slate-900 dark:text-white font-mono truncate">{item.value}</span>
            <span className="text-[9px] font-bold text-slate-400 truncate mt-0.5">{item.sub}</span>
          </motion.div>
        ))}
      </div>

      {/* 3. Behavioral Engine Insights & AI Advisor Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-1">
        {/* Behavioral Engine Insights */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="p-1.5 bg-amber-500/10 rounded-xl text-amber-500">
              <Lightbulb size={16} />
            </div>
            <div>
              <h3 className="text-xs md:text-sm font-black text-slate-900 dark:text-white">نصائح سلوكية وتشخيص مالي</h3>
              <p className="text-[10px] text-slate-400 font-semibold">استنتاجات تلقائية من أنماط حركاتك المالية</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {insights.slice(0, 2).map((insight) => (
              <motion.div
                key={insight.id}
                variants={itemVariants}
                className={cn(
                  "p-4 rounded-2xl border text-right transition-all",
                  insight.type === 'warning' ? "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40" :
                  insight.type === 'positive' ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40" :
                  "bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/40"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "p-2 rounded-xl shrink-0 mt-0.5",
                    insight.type === 'warning' ? "bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400" :
                    insight.type === 'positive' ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400" :
                    "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400"
                  )}>
                    {insight.type === 'warning' ? <TriangleAlert size={14} /> :
                     insight.type === 'positive' ? <TrendingUp size={14} /> :
                     <Activity size={14} />}
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">{insight.title}</h4>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{insight.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
            {insights.length === 0 && (
              <div className="text-center py-6 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs font-bold">
                سيقوم النظام بتحليل بياناتك السلوكية تلقائياً بمجرد تسجيل المزيد من العمليات.
              </div>
            )}
          </div>
        </div>

        {/* AI Advisor Tips with Gemini */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-500/10 rounded-xl text-indigo-500">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="text-xs md:text-sm font-black text-slate-900 dark:text-white">توجيهات المستشار الذكي</h3>
                <p className="text-[10px] text-slate-400 font-semibold">رؤى مالية مدعومة بالذكاء الاصطناعي</p>
              </div>
            </div>
            <Link 
              to="/assistant" 
              onClick={() => hapticFeedback('light')} 
              className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
            >
              <span>محادثة المستشار</span>
              <span>←</span>
            </Link>
          </div>

          {aiInsights?.advice && aiInsights.advice.length > 0 ? (
            <div className="space-y-2.5">
              {aiInsights.advice.slice(0, 2).map((item: any, idx: number) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  className={cn(
                    "p-4 rounded-2xl border transition-all bg-white dark:bg-slate-900",
                    item.priority === 'high' ? 'border-rose-200 dark:border-rose-900/50' : 
                    item.priority === 'medium' ? 'border-amber-200 dark:border-amber-900/50' : 
                    'border-emerald-200 dark:border-emerald-900/50'
                  )}
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">{item.title}</h4>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[9px] font-black border shrink-0",
                      item.priority === 'high' ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200' : 
                      item.priority === 'medium' ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200' : 
                      'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200'
                    )}>
                      {item.priority === 'high' ? 'أولوية قصوى' : item.priority === 'medium' ? 'توجيه متوسط' : 'إرشاد'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium mb-2">
                    {item.advice}
                  </p>
                  {item.actionItem && (
                    <div className="flex items-center gap-1.5 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                      <ShieldCheck size={13} className="text-indigo-500 shrink-0" />
                      <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 truncate">{item.actionItem}</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 text-center flex flex-col items-center justify-center min-h-[140px]">
              <Sparkles size={20} className="text-indigo-500 mb-1.5" />
              <p className="text-xs font-black text-slate-900 dark:text-white mb-0.5">تحليل مالي بالذكاء الاصطناعي</p>
              <p className="text-[10px] text-slate-400 font-medium mb-3 max-w-[220px]">
                احصل على خطة وتوصيات مخصصة لدخلك ومصاريفك الحالية.
              </p>
              <Link 
                to="/assistant" 
                onClick={() => hapticFeedback('medium')} 
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black transition-all shadow-xs cursor-pointer"
              >
                طلب تحليل فوري
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
