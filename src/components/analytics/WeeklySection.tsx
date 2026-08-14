import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Lightbulb, 
  ArrowUpRight, 
  Award,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Zap,
  Flame,
  ShieldCheck
} from 'lucide-react';
import { formatCurrency, cn, hapticFeedback } from '../../utils';
import { Expense, Category } from '../../types';
import { subDays, format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';

interface WeeklySectionProps {
  expenses: Expense[];
  categories: Category[];
  currency: string;
  itemVariants: Variants;
}

export const WeeklySection: React.FC<WeeklySectionProps> = ({
  expenses,
  categories,
  currency,
  itemVariants,
}) => {
  // 1. Generate the last 7 days (including today)
  const currentWeekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i));
  }, []);

  // 2. Map day name and calculate spending for each day
  const weeklyData = useMemo(() => {
    const ARABIC_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    
    return currentWeekDays.map((day, index) => {
      const dayOfWeekIndex = day.getDay();
      let dayLabel = ARABIC_DAYS[dayOfWeekIndex];
      
      if (index === 6) {
        dayLabel = 'اليوم';
      } else if (index === 5) {
        dayLabel = 'أمس';
      }

      const dateStr = format(day, 'yyyy-MM-dd');
      const prevWeekDay = subDays(day, 7);
      const prevDateStr = format(prevWeekDay, 'yyyy-MM-dd');

      // Calculate spent this week
      const thisWeekSpent = expenses
        .filter(e => {
          if (e.isTransfer) return false;
          const eDate = e.date.split('T')[0];
          return eDate === dateStr;
        })
        .reduce((sum, e) => sum + e.amount, 0);

      // Calculate spent same day last week
      const lastWeekSpent = expenses
        .filter(e => {
          if (e.isTransfer) return false;
          const eDate = e.date.split('T')[0];
          return eDate === prevDateStr;
        })
        .reduce((sum, e) => sum + e.amount, 0);

      return {
        dayLabel,
        fullDateThis: format(day, 'dd MMMM', { locale: ar }),
        fullDateLast: format(prevWeekDay, 'dd MMMM', { locale: ar }),
        thisWeek: thisWeekSpent,
        lastWeek: lastWeekSpent,
        difference: thisWeekSpent - lastWeekSpent
      };
    });
  }, [expenses, currentWeekDays]);

  // KPIs
  const totalThisWeek = useMemo(() => weeklyData.reduce((sum, d) => sum + d.thisWeek, 0), [weeklyData]);
  const totalLastWeek = useMemo(() => weeklyData.reduce((sum, d) => sum + d.lastWeek, 0), [weeklyData]);
  
  const percentChange = useMemo(() => {
    if (totalLastWeek === 0) return 0;
    return ((totalThisWeek - totalLastWeek) / totalLastWeek) * 100;
  }, [totalThisWeek, totalLastWeek]);

  const noSpendDaysThisWeek = useMemo(() => weeklyData.filter(d => d.thisWeek === 0).length, [weeklyData]);
  const noSpendDaysLastWeek = useMemo(() => weeklyData.filter(d => d.lastWeek === 0).length, [weeklyData]);

  // Category and Spike analysis
  const categoryAnalysis = useMemo(() => {
    const thisWeekStartStr = format(subDays(new Date(), 6), 'yyyy-MM-dd');
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const prevWeekStartStr = format(subDays(new Date(), 13), 'yyyy-MM-dd');
    const prevWeekEndStr = format(subDays(new Date(), 7), 'yyyy-MM-dd');

    const thisWeekExpenses = expenses.filter(e => !e.isTransfer && e.date.split('T')[0] >= thisWeekStartStr && e.date.split('T')[0] <= todayStr);
    const lastWeekExpenses = expenses.filter(e => !e.isTransfer && e.date.split('T')[0] >= prevWeekStartStr && e.date.split('T')[0] <= prevWeekEndStr);

    const catThisSums: Record<string, number> = {};
    thisWeekExpenses.forEach(e => {
      catThisSums[e.categoryId] = (catThisSums[e.categoryId] || 0) + e.amount;
    });

    const catLastSums: Record<string, number> = {};
    lastWeekExpenses.forEach(e => {
      catLastSums[e.categoryId] = (catLastSums[e.categoryId] || 0) + e.amount;
    });

    let highestCatId = '';
    let highestCatAmount = 0;
    Object.entries(catThisSums).forEach(([catId, amount]) => {
      if (amount > highestCatAmount) {
         highestCatAmount = amount;
         highestCatId = catId;
      }
    });

    const highestCategory = categories.find(c => c.id === highestCatId);
    const highestCatLastAmount = catLastSums[highestCatId] || 0;

    return {
      highestCategory,
      highestCatAmount,
      highestCatLastAmount,
      thisWeekExpensesCount: thisWeekExpenses.length,
      lastWeekExpensesCount: lastWeekExpenses.length
    };
  }, [expenses, categories]);

  // Smart advice compilation based on spending behaviors
  const smartAdvices = useMemo(() => {
    const list: any[] = [];

    // 1. Overall Trend Advice
    if (totalThisWeek < totalLastWeek && totalLastWeek > 0) {
      list.push({
        id: 'trend-success',
        title: 'إنجاز مالي رائع! وتيرة المصاريف في انخفاض 🥳',
        description: `نجحت في تقليص مصروفاتك لهذا الأسبوع بمقدار ${formatCurrency(totalLastWeek - totalThisWeek, currency)} مقارنة بالأسبوع السابق (انخفاض ${Math.abs(percentChange).toFixed(0)}%).`,
        action: 'فرصة مثالية لتحويل هذا الفائض إلى هدف ادخاري نشط أو الخزينة النقدية.',
        type: 'positive',
        icon: <Award className="text-emerald-500" size={18} />
      });
    } else if (totalThisWeek > totalLastWeek && totalLastWeek > 0) {
      list.push({
        id: 'trend-warning',
        title: 'تنبيه: وتيرة الصرف ارتفعت عن الأسبوع الماضي ⚠️',
        description: `ارتفعت مصروفاتك هذا الأسبوع بنسبة ${percentChange.toFixed(0)}% (+${formatCurrency(totalThisWeek - totalLastWeek, currency)}).`,
        action: 'ينصح بالحد من المشتريات غير الأساسية في الأيام الثلاثة القادمة لاستعادة توازن الميزانية.',
        type: 'warning',
        icon: <AlertCircle className="text-amber-500" size={18} />
      });
    } else {
      list.push({
        id: 'trend-neutral',
        title: 'ثبات ممتاز في وتيرة الإنفاق ⚖️',
        description: 'تقارب مستويات الصرف أسبوعاً بعد أسبوع يعكس استقرار نمط معيشتك وسهولة التنبؤ بمصاريف نهاية الشهر.',
        action: 'استمر في تسجيل العمليات بدقة لتفادي أي مصاريف عشوائية غير محسوبة.',
        type: 'neutral',
        icon: <Lightbulb className="text-indigo-500" size={18} />
      });
    }

    // 2. High Category Advice
    if (categoryAnalysis.highestCategory) {
      const catName = categoryAnalysis.highestCategory.name;
      list.push({
        id: 'cat-highest',
        title: `الفئة الأكثر استهلاكاً هذا الأسبوع: ${catName} 🔍`,
        description: `شكلت فئة "${catName}" الحصة الكبرى من مصاريف الأسبوع بمجموع ${formatCurrency(categoryAnalysis.highestCatAmount, currency)}.`,
        action: `حدد سقفاً مسبقاً لفئة "${catName}" للأسبوع القادم لضمان عدم استنزاف الميزانية.`,
        type: 'neutral',
        icon: <Sparkles className="text-indigo-500" size={18} />
      });
    }

    // 3. No-Spend Days Advice
    if (noSpendDaysThisWeek > 0) {
      list.push({
        id: 'no-spend-success',
        title: `أيام الانضباط التام: ${noSpendDaysThisWeek} أيام بلا مصاريف 🛡️`,
        description: `حققت ${noSpendDaysThisWeek} أيام خالية من الصرف خلال الـ 7 أيام الأخيرة.`,
        action: 'الأيام الخالية من الصرف تعزز الانضباط الذاتي وتحد من الشراء الاندفاعي.',
        type: 'positive',
        icon: <CheckCircle2 className="text-emerald-500" size={18} />
      });
    }

    return list;
  }, [totalThisWeek, totalLastWeek, percentChange, categoryAnalysis, noSpendDaysThisWeek, currency]);

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* 1. Comparison Summary Cards */}
      <motion.div 
        variants={itemVariants} 
        className="grid grid-cols-1 sm:grid-cols-3 gap-3.5"
      >
        {/* This Week */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">الأسبوع الحالي (7 أيام)</span>
            <Calendar size={16} className="text-indigo-500" />
          </div>
          <div className="text-xl md:text-2xl font-black font-mono text-slate-900 dark:text-white">
            {formatCurrency(totalThisWeek, currency)}
          </div>
          <span className="text-[10px] text-slate-400 font-bold mt-2">
            {categoryAnalysis.thisWeekExpensesCount} عمليات صرف
          </span>
        </div>

        {/* Last Week */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">الأسبوع الماضي (المطابق)</span>
            <Calendar size={16} className="text-slate-400" />
          </div>
          <div className="text-xl md:text-2xl font-black font-mono text-slate-700 dark:text-slate-300">
            {formatCurrency(totalLastWeek, currency)}
          </div>
          <span className="text-[10px] text-slate-400 font-bold mt-2">
            {categoryAnalysis.lastWeekExpensesCount} عمليات صرف سابقة
          </span>
        </div>

        {/* Weekly Variance Delta */}
        <div className={cn(
          "p-5 rounded-3xl border shadow-xs flex flex-col justify-between transition-all",
          percentChange < 0 
            ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50" 
            : percentChange > 0 
              ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50"
              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800"
        )}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">فارق المقارنة</span>
            {percentChange <= 0 ? <TrendingDown size={16} className="text-emerald-500" /> : <TrendingUp size={16} className="text-rose-500" />}
          </div>
          <div className={cn(
            "text-xl md:text-2xl font-black font-mono",
            percentChange <= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
          )}>
            {percentChange > 0 ? '+' : ''}{percentChange.toFixed(0)}%
          </div>
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-2">
            {percentChange < 0 ? `وفرت ${formatCurrency(totalLastWeek - totalThisWeek, currency)}` : percentChange > 0 ? `زيادة ${formatCurrency(totalThisWeek - totalLastWeek, currency)}` : 'متطابق تماماً'}
          </span>
        </div>
      </motion.div>

      {/* 2. Interactive Day-by-Day Comparative Area Chart */}
      <motion.div 
        variants={itemVariants}
        className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Zap size={18} />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-black text-slate-900 dark:text-white">مقارنة الصرف اليومي (أسبوع مقابل أسبوع)</h3>
              <p className="text-[11px] font-semibold text-slate-400">تتبع تغير النمط الاستهلاكي يوماً بيوم</p>
            </div>
          </div>
        </div>

        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorThisWeek" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorLastWeek" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.35} />
              <XAxis dataKey="dayLabel" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} width={35} />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', background: '#0f172a', border: '1px solid #334155', color: '#fff', fontSize: '11px', direction: 'rtl', fontWeight: 'bold' }}
                formatter={(val: any, name: any) => [formatCurrency(val, currency), name === 'thisWeek' ? 'الأسبوع الحالي' : 'الأسبوع السابق']}
              />
              <Area type="monotone" dataKey="lastWeek" stroke="#94a3b8" strokeDasharray="3 3" strokeWidth={2} fillOpacity={1} fill="url(#colorLastWeek)" name="lastWeek" />
              <Area type="monotone" dataKey="thisWeek" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorThisWeek)" name="thisWeek" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-indigo-600" />
              <span className="text-slate-600 dark:text-slate-400 font-bold text-[11px]">الأسبوع الحالي</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-slate-400" />
              <span className="text-slate-600 dark:text-slate-400 font-bold text-[11px]">الأسبوع الماضي</span>
            </div>
          </div>
          <span className="text-[11px] text-slate-400 font-bold">
            أيام بلا صرف هذا الأسبوع: <strong className="text-indigo-600 dark:text-indigo-400">{noSpendDaysThisWeek}</strong>
          </span>
        </div>
      </motion.div>

      {/* 3. Actionable Weekly Advices */}
      <div className="space-y-3">
        <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 px-1 flex items-center gap-1.5">
          <Sparkles size={14} className="text-amber-500" />
          <span>توصيات أسبوعية لتحسين الأداء:</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {smartAdvices.map((advice) => (
            <motion.div
              key={advice.id}
              variants={itemVariants}
              className={cn(
                "p-4 rounded-2xl border text-right bg-white dark:bg-slate-900 flex flex-col justify-between",
                advice.type === 'positive' ? "border-emerald-200 dark:border-emerald-900/50" :
                advice.type === 'warning' ? "border-amber-200 dark:border-amber-900/50" :
                "border-slate-200/80 dark:border-slate-800"
              )}
            >
              <div className="flex items-start gap-2.5 mb-2">
                <div className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 shrink-0 mt-0.5">
                  {advice.icon}
                </div>
                <div>
                  <h5 className="text-xs font-black text-slate-900 dark:text-white leading-tight">{advice.title}</h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed mt-1">{advice.description}</p>
                </div>
              </div>

              {advice.action && (
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 text-[10px] text-slate-600 dark:text-slate-300 font-bold">
                  <ShieldCheck size={12} className="text-indigo-500 shrink-0" />
                  <span className="truncate">{advice.action}</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
