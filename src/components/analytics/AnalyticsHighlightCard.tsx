import React from 'react';
import { motion, Variants } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles, 
  Lightbulb, 
  TriangleAlert, 
  Flame,
  CheckCircle2,
  PieChart
} from 'lucide-react';
import { formatCurrency, cn } from '../../utils';

interface AnalyticsHighlightCardProps {
  netBalance: number;
  totalMonthlyIncome: number;
  totalMonthlyExpense: number;
  currency: string;
  expenseDiff: number;
  incomeDiff: number;
  prevMonthExpenses: number;
  prevMonthIncome: number;
  categoryData: { id: string; name: string; value: number; color?: string; icon?: string }[];
  insights: any[];
  aiInsights?: any;
  itemVariants: Variants;
}

export const AnalyticsHighlightCard: React.FC<AnalyticsHighlightCardProps> = React.memo(({
  netBalance,
  totalMonthlyIncome,
  totalMonthlyExpense,
  currency,
  expenseDiff,
  incomeDiff,
  prevMonthExpenses,
  prevMonthIncome,
  categoryData,
  insights,
  aiInsights,
  itemVariants
}) => {
  // 1. Pick the single most important behavioral insight
  const topInsight = React.useMemo(() => {
    // Priority: Warning insight > High AI advice > Positive insight > General insight
    const warningInsight = insights.find(i => i.type === 'warning');
    if (warningInsight) {
      return {
        title: warningInsight.title,
        description: warningInsight.description,
        type: 'warning' as const
      };
    }

    const highAiAdvice = aiInsights?.advice?.find((a: any) => a.priority === 'high');
    if (highAiAdvice) {
      return {
        title: highAiAdvice.title,
        description: highAiAdvice.advice,
        type: 'ai' as const
      };
    }

    if (insights.length > 0) {
      return {
        title: insights[0].title,
        description: insights[0].description,
        type: insights[0].type as 'positive' | 'warning' | 'info'
      };
    }

    if (aiInsights?.advice && aiInsights.advice.length > 0) {
      return {
        title: aiInsights.advice[0].title,
        description: aiInsights.advice[0].advice,
        type: 'ai' as const
      };
    }

    // Default smart insight based on numbers if no manual insight exists
    if (totalMonthlyExpense > 0 && totalMonthlyIncome > 0) {
      const savingRate = Math.round((netBalance / totalMonthlyIncome) * 100);
      if (savingRate >= 20) {
        return {
          title: 'أداء ادخار متقدم ومثالي',
          description: `حققت نسبة ادخار بلغت ${savingRate}% من إجمالي دخلك في هذه الفترة، استمر في هذا المسار المنضبط.`,
          type: 'positive' as const
        };
      } else if (savingRate < 0) {
        return {
          title: 'تجاوز في سقف الإنفاق',
          description: 'المصروفات الحالية تفوق إجمالي المقبوضات لهذه الفترة، ينصح بترشيد بنود الكماليات والمصاريف غير الأساسية.',
          type: 'warning' as const
        };
      }
    }

    return {
      title: 'متابعة حية للسيولة',
      description: 'سجل المزيد من العمليات اليومية للحصول على تشخيص مالي ذكي وسلوكيات إنفاق متقدمة.',
      type: 'info' as const
    };
  }, [insights, aiInsights, totalMonthlyExpense, totalMonthlyIncome, netBalance]);

  // 2. Top 3 Spending Categories (Name + Percentage of total only)
  const top3Categories = React.useMemo(() => {
    if (!categoryData || categoryData.length === 0 || totalMonthlyExpense <= 0) {
      return [];
    }
    return categoryData.slice(0, 3).map(cat => {
      const pct = Math.round((cat.value / totalMonthlyExpense) * 100);
      return {
        id: cat.id,
        name: cat.name,
        percentage: pct,
        value: cat.value,
        color: cat.color || '#6366f1'
      };
    });
  }, [categoryData, totalMonthlyExpense]);

  const isSurplus = netBalance >= 0;

  return (
    <motion.div
      variants={itemVariants}
      className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-4 sm:p-6 border border-slate-800 shadow-lg relative overflow-hidden text-right"
      dir="rtl"
    >
      {/* Subtle background ambient glows */}
      <div className="absolute -top-16 -right-16 w-56 h-56 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-4 sm:gap-5">
        {/* Header Strip: Title & Badges */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30 shrink-0">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                <span>الأهم الآن</span>
                <span className="text-[10px] text-indigo-300 font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/20">
                  الملخص التنفيذي المباشر
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={cn(
              "text-[10px] sm:text-xs font-black px-2.5 py-1 rounded-full border flex items-center gap-1 shrink-0",
              isSurplus 
                ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" 
                : "bg-rose-500/15 text-rose-300 border-rose-500/30"
            )}>
              {isSurplus ? (
                <>
                  <CheckCircle2 size={12} className="text-emerald-400" />
                  <span>فائض نقدي متاح</span>
                </>
              ) : (
                <>
                  <TriangleAlert size={12} className="text-rose-400" />
                  <span>عجز مؤقت في الفترة</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Main Content Grid: [Net Balance & Comparisons] + [Top 3 Categories] */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
          
          {/* 1. Prominent Net Balance & Period Comparisons (7 cols on lg) */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-[11px] font-bold text-slate-400 block mb-1">
                صافي التدفق المالي (الدخل - المصروفات)
              </span>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className={cn(
                  "text-2xl sm:text-3xl lg:text-4xl font-black font-mono tracking-tight",
                  isSurplus ? "text-emerald-400" : "text-rose-400"
                )}>
                  {formatCurrency(netBalance, currency)}
                </span>
                {totalMonthlyIncome > 0 && (
                  <span className="text-xs text-slate-400 font-medium">
                    (وفر {Math.max(0, Math.round((netBalance / totalMonthlyIncome) * 100))}%)
                  </span>
                )}
              </div>
            </div>

            {/* Comparison with Previous Period Badges */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {/* Expense Diff Comparison */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between">
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 font-bold block truncate">مقارنة المصروفات</span>
                  <span className="text-xs sm:text-sm font-black font-mono text-white truncate block">
                    {formatCurrency(totalMonthlyExpense, currency)}
                  </span>
                </div>
                {prevMonthExpenses > 0 ? (
                  <div className={cn(
                    "flex items-center gap-0.5 text-[11px] font-black font-mono px-2 py-1 rounded-xl shrink-0",
                    expenseDiff <= 0 
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                      : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  )}>
                    {expenseDiff <= 0 ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                    <span>{Math.abs(expenseDiff).toFixed(0)}%</span>
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-500 font-bold">فترة أولى</span>
                )}
              </div>

              {/* Income Diff Comparison */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between">
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 font-bold block truncate">مقارنة المقبوضات</span>
                  <span className="text-xs sm:text-sm font-black font-mono text-white truncate block">
                    {formatCurrency(totalMonthlyIncome, currency)}
                  </span>
                </div>
                {prevMonthIncome > 0 ? (
                  <div className={cn(
                    "flex items-center gap-0.5 text-[11px] font-black font-mono px-2 py-1 rounded-xl shrink-0",
                    incomeDiff >= 0 
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                      : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  )}>
                    {incomeDiff >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    <span>{Math.abs(incomeDiff).toFixed(0)}%</span>
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-500 font-bold">فترة أولى</span>
                )}
              </div>
            </div>
          </div>

          {/* 2. Compact Top 3 Spending Categories (5 cols on lg) */}
          <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black text-slate-300 flex items-center gap-1.5">
                <PieChart size={13} className="text-indigo-400" />
                <span>أعلى 3 تصنيفات إنفاقاً</span>
              </span>
              <span className="text-[9px] text-slate-400 font-semibold">من إجمالي المصاريف</span>
            </div>

            {top3Categories.length > 0 ? (
              <div className="space-y-2">
                {top3Categories.map((cat, idx) => (
                  <div key={cat.id || idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-200 truncate flex items-center gap-1.5">
                        <span 
                          className="w-2 h-2 rounded-full shrink-0" 
                          style={{ backgroundColor: cat.color }} 
                        />
                        <span className="truncate">{cat.name}</span>
                      </span>
                      <span className="font-mono text-indigo-300 shrink-0">{cat.percentage}%</span>
                    </div>
                    {/* Compact progress bar */}
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{ 
                          width: `${Math.min(100, Math.max(5, cat.percentage))}%`,
                          backgroundColor: cat.color 
                        }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-slate-400 text-xs font-bold">
                لا توجد مصاريف مسجلة في هذه الفترة بعد.
              </div>
            )}
          </div>
        </div>

        {/* 3. Single Most Impactful Behavioral Insight Strip */}
        <div className={cn(
          "rounded-2xl p-3 sm:p-3.5 border flex items-start gap-3 transition-all",
          topInsight.type === 'warning' ? "bg-rose-500/10 border-rose-500/30 text-rose-100" :
          topInsight.type === 'positive' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-100" :
          "bg-indigo-500/10 border-indigo-500/30 text-indigo-100"
        )}>
          <div className={cn(
            "p-1.5 rounded-xl shrink-0 mt-0.5",
            topInsight.type === 'warning' ? "bg-rose-500/20 text-rose-400" :
            topInsight.type === 'positive' ? "bg-emerald-500/20 text-emerald-400" :
            "bg-indigo-500/20 text-indigo-400"
          )}>
            {topInsight.type === 'warning' ? <TriangleAlert size={15} /> :
             topInsight.type === 'positive' ? <TrendingUp size={15} /> :
             <Lightbulb size={15} />}
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black tracking-wide">
                {topInsight.title}
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-white/10 text-white/80">
                رؤية سلوكية رئيسية
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
              {topInsight.description}
            </p>
          </div>
        </div>

      </div>
    </motion.div>
  );
});

AnalyticsHighlightCard.displayName = 'AnalyticsHighlightCard';
