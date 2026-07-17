import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
  HelpCircle
} from 'lucide-react';
import { formatCurrency, cn, hapticFeedback } from '../../utils';
import { Expense, Category } from '../../types';
import { subDays, format, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';

interface WeeklySectionProps {
  expenses: Expense[];
  categories: Category[];
  currency: string;
  itemVariants: any;
}

export const WeeklySection: React.FC<WeeklySectionProps> = ({
  expenses,
  categories,
  currency,
  itemVariants,
}) => {
  const [showDetailedList, setShowDetailedList] = useState(false);

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
      
      // Make the labels friendly for the last two days
      if (index === 6) {
        dayLabel = 'اليوم';
      } else if (index === 5) {
        dayLabel = 'أمس';
      }

      const dateStr = format(day, 'yyyy-MM-dd');
      const prevWeekDay = subDays(day, 7);
      const prevDateStr = format(prevWeekDay, 'yyyy-MM-dd');

      // Calculate spent today (this week)
      const thisWeekSpent = expenses
        .filter(e => {
          if (e.isTransfer) return false;
          const eDate = e.date.split('T')[0];
          return eDate === dateStr;
        })
        .reduce((sum, e) => sum + e.amount, 0);

      // Calculate spent on same weekday last week
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
    const list = [];

    // 1. Overall Trend Advice
    if (totalThisWeek < totalLastWeek && totalLastWeek > 0) {
      list.push({
        id: 'trend-success',
        title: 'إنجاز مالي رائع! التوفير في تحسّن 🥳',
        description: `لقد نجحت في خفض مصروفاتك الإجمالية لهذا الأسبوع بمقدار ${formatCurrency(totalLastWeek - totalThisWeek, currency)} مقارنة بالأسبوع الفائت (وفرت ${Math.abs(percentChange).toFixed(0)}%).`,
        action: 'ننصح بنقل هذا المبلغ المدخر فوراً إلى حصالتك الفعلية أو وضعه في هدف توفيري نشط لتجنيب إغراء صرفه لاحقاً.',
        type: 'positive',
        icon: <Award className="text-emerald-500" size={20} />
      });
    } else if (totalThisWeek > totalLastWeek && totalLastWeek > 0) {
      list.push({
        id: 'trend-warning',
        title: 'انتباه! الصرف تفوق على الأسبوع الماضي ⚠️',
        description: `ارتفعت مصروفاتك هذا الأسبوع بمعدل ${percentChange.toFixed(0)}%، أي بزيادة قدرها ${formatCurrency(totalThisWeek - totalLastWeek, currency)} مقارنة بالـ 7 أيام السابقة.`,
        action: 'حاول الحد التام من المشتريات غير الضرورية (ألعاب، رفاهية، مطاعم) في الأيام الـ 3 القادمة لاستعادة انضباط الميزانية.',
        type: 'warning',
        icon: <AlertCircle className="text-amber-500" size={20} />
      });
    } else {
      list.push({
        id: 'trend-neutral',
        title: 'حافظ على ثبات خطتك المالية ⚖️',
        description: 'تقارب مستويات الإنفاق أسبوعاً بعد أسبوع يعكس ثبات سلوكك الاستهلاكي، وهو أمر ممتاز لتقدير النفقات بدقة وتفادي أزمات نهاية الشهر.',
        action: 'تأكد من تسجيل جميع العمليات فور حدوثها، حتى النفقات النثرية الصغيرة، لضمان أعلى مستوى من دقة البيانات.',
        type: 'neutral',
        icon: <Lightbulb className="text-indigo-500" size={20} />
      });
    }

    // 2. High Category Advice
    if (categoryAnalysis.highestCategory) {
      const catName = categoryAnalysis.highestCategory.name;
      const isFood = ['أكل', 'مطاعم', 'بقالة', 'سوق', 'طعام'].some(keyword => catName.includes(keyword));
      const isTransport = ['مواصلات', 'سيارة', 'تكسي', 'وقود', 'بنزين'].some(keyword => catName.includes(keyword));

      if (isFood) {
        list.push({
          id: 'cat-food',
          title: `ترشيد الإنفاق على الطعام والتموين 🛒`,
          description: `شكلت فئة "${catName}" الحصة الكبرى من مصاريفك هذا الأسبوع بإجمالي ${formatCurrency(categoryAnalysis.highestCatAmount, currency)}.`,
          action: 'التسوق بقائمة مشتريات مسبقة والتسوق من الأسواق الأسبوعية الشعبية يقلل من الصرف العشوائي في هذه الفئة بنسبة تصل إلى 25%.',
          type: 'neutral',
          icon: <Sparkles className="text-sky-500" size={20} />
        });
      } else if (isTransport) {
        list.push({
          id: 'cat-transport',
          title: `تحسين نفقات التنقل والمواصلات 🚗`,
          description: `لقد بلغت نفقات التنقل والمواصلات هذا الأسبوع ${formatCurrency(categoryAnalysis.highestCatAmount, currency)}.`,
          action: 'حاول تجميع مشاويرك اليومية المتعددة في مسار واحد، أو مشاركة الركوب مع الزملاء لتوفير وقود السيارة وتكاليف النقل.',
          type: 'neutral',
          icon: <Sparkles className="text-amber-500" size={20} />
        });
      } else {
        list.push({
          id: 'cat-generic',
          title: `مراقبة ميزانية: ${catName} 🔍`,
          description: `فئة "${catName}" هي الأعلى إنفاقاً هذا الأسبوع بمجموع بلغت قيمته ${formatCurrency(categoryAnalysis.highestCatAmount, currency)}.`,
          action: `نقترح تحديد سقف أسبوعي مخصص لفئة "${catName}" للأسبوع القادم لمنع تسرب السيولة النقدية بشكل غير مدروس.`,
          type: 'neutral',
          icon: <Lightbulb className="text-teal-500" size={20} />
        });
      }
    }

    // 3. No-Spend Days Advice
    if (noSpendDaysThisWeek > 0) {
      list.push({
        id: 'no-spend-success',
        title: `ممتاز! نجاح أيام التوقف عن الصرف 🛡️`,
        description: `حققت ${noSpendDaysThisWeek} أيام خالية تماماً من المصاريف هذا الأسبوع، مقارنة بـ ${noSpendDaysLastWeek} يوم خالي من الصرف الأسبوع الفائت.`,
        action: 'كل يوم بلا صرف هو بمثابة انتصار صغير يعيد توجيه الأموال نحو الأهداف بعيدة المدى ويعزز عضلات الانضباط المالي لديك.',
        type: 'positive',
        icon: <CheckCircle2 className="text-emerald-500" size={20} />
      });
    } else {
      list.push({
        id: 'no-spend-challenge',
        title: 'تحدي الأسبوع المقبل: يوم بلا صرف! 🎯',
        description: 'لم تسجل أي يوم خالٍ من المصاريف خلال السبعة أيام الأخيرة، مما يعني استمرار ضغط الاستهلاك اليومي.',
        action: 'تحدّ نفسك لاختيار يوم واحد في الأسبوع القادم (مثلاً وسط الأسبوع) ليكون "يوم صفر مصاريف"، حيث لا تدفع شيئاً سوى المخطط له مسبقاً.',
        type: 'warning',
        icon: <HelpCircle className="text-violet-500" size={20} />
      });
    }

    return list;
  }, [totalThisWeek, totalLastWeek, percentChange, categoryAnalysis, noSpendDaysThisWeek, noSpendDaysLastWeek, currency]);

  // Find the day with the highest difference or highest overall spending this week
  const peakDayThisWeek = useMemo(() => {
    if (weeklyData.length === 0) return null;
    return weeklyData.reduce((max, d) => d.thisWeek > max.thisWeek ? d : max, weeklyData[0]);
  }, [weeklyData]);

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* 1. Comparison Cards Grid */}
      <motion.div 
        variants={itemVariants} 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {/* Card 1: This Week */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-3xl shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
            <Calendar size={22} />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">مصاريف الأسبوع الحالي (آخر 7 أيام)</p>
            <p className="text-lg font-black text-slate-800 dark:text-white font-sans mt-0.5">
              {formatCurrency(totalThisWeek, currency)}
            </p>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium mt-1">
              مجموع {categoryAnalysis.thisWeekExpensesCount} عمليات صرف مسجلة
            </p>
          </div>
        </div>

        {/* Card 2: Last Week */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-3xl shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-slate-500/10 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0">
            <Calendar className="opacity-70" size={22} />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">مصاريف الأسبوع الماضي (المطابق)</p>
            <p className="text-lg font-black text-slate-600 dark:text-slate-400 font-sans mt-0.5">
              {formatCurrency(totalLastWeek, currency)}
            </p>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium mt-1">
              مجموع {categoryAnalysis.lastWeekExpensesCount} عمليات صرف سابقة
            </p>
          </div>
        </div>

        {/* Card 3: Difference Badge */}
        <div className={cn(
          "p-5 border rounded-3xl shadow-xs flex items-center gap-4 transition-all col-span-1 sm:col-span-2 lg:col-span-1",
          percentChange < 0 
            ? "bg-emerald-50/30 dark:bg-emerald-950/5 border-emerald-500/15" 
            : percentChange > 0 
              ? "bg-amber-50/30 dark:bg-amber-950/5 border-amber-500/15"
              : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-850"
        )}>
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
            percentChange < 0 
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
              : percentChange > 0 
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                : "bg-slate-500/10 text-slate-500"
          )}>
            {percentChange <= 0 ? <TrendingDown size={22} /> : <TrendingUp size={22} />}
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">مقارنة التغير الأسبوعي</p>
            <p className={cn(
              "text-lg font-black font-sans mt-0.5 flex items-center gap-1",
              percentChange < 0 
                ? "text-emerald-600 dark:text-emerald-400" 
                : percentChange > 0 
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-slate-600 dark:text-slate-400"
            )}>
              {percentChange < 0 ? '-' : percentChange > 0 ? '+' : ''}
              {Math.abs(percentChange).toFixed(0)}%
              <span className="text-[10px] font-tajawal font-bold mr-1">
                {percentChange < 0 ? 'توفير' : percentChange > 0 ? 'صرف زائد' : 'مستقر'}
              </span>
            </p>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium mt-1">
              {percentChange < 0 
                ? `وفرت ${formatCurrency(totalLastWeek - totalThisWeek, currency)} مقارنة بالماضي!`
                : percentChange > 0 
                  ? `صرفت ${formatCurrency(totalThisWeek - totalLastWeek, currency)} أكثر!`
                  : 'تطابق كامل في مستويات الصرف'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* 2. Interactive Area Chart Comparing Trends */}
      <motion.div 
        variants={itemVariants} 
        className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-3xl border border-slate-100 dark:border-slate-850 shadow-sm relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-500">
              <TrendingUp size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">رسم المقارنة الأسبوعية المزدوجة</h3>
              <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500">مقارنة خطية تفاعلية ليوم بيوم بين الأسبوعين الحالي والمنصرم</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[10px] font-black select-none">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-md bg-indigo-500" />
              <span className="text-slate-700 dark:text-slate-300">الأسبوع الحالي</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-md bg-slate-300 dark:bg-slate-700" />
              <span className="text-slate-400 dark:text-slate-500">الأسبوع الماضي</span>
            </div>
          </div>
        </div>

        <div className="h-64 md:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorThisWeek" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.01}/>
                </linearGradient>
                <linearGradient id="colorLastWeek" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.01}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.3} />
              <XAxis 
                dataKey="dayLabel" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }}
              />
              <Tooltip 
                cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }}
                contentStyle={{ 
                  borderRadius: '16px', 
                  background: '#0f172a', 
                  border: 'none', 
                  color: '#fff', 
                  fontSize: '11px', 
                  direction: 'rtl',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                }}
                formatter={(value: any, name: string) => {
                  const label = name === 'thisWeek' ? 'الأسبوع الحالي' : 'الأسبوع الماضي';
                  return [formatCurrency(Number(value), currency), label];
                }}
              />
              <Area 
                type="monotone" 
                dataKey="lastWeek" 
                stroke="#94a3b8" 
                strokeWidth={2} 
                strokeDasharray="4 4"
                fillOpacity={1} 
                fill="url(#colorLastWeek)" 
              />
              <Area 
                type="monotone" 
                dataKey="thisWeek" 
                stroke="#6366f1" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorThisWeek)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Highlight Peak Day and Savings facts */}
        {peakDayThisWeek && peakDayThisWeek.thisWeek > 0 && (
          <div className="mt-4 p-3.5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-900 text-slate-500 dark:text-slate-400 text-[10px] font-bold flex flex-wrap items-center justify-between gap-2.5">
            <span>
              💡 ذروة صرفك هذا الأسبوع كانت يوم <span className="text-indigo-600 dark:text-indigo-400 font-black">{peakDayThisWeek.dayLabel}</span> بإنفاق قدره <span className="font-sans text-slate-800 dark:text-white font-black">{formatCurrency(peakDayThisWeek.thisWeek, currency)}</span>.
            </span>
            <span>
              توفير الأيام الخالية: <span className="text-emerald-500 font-black">{noSpendDaysThisWeek} أيام</span> بدون صرف!
            </span>
          </div>
        )}
      </motion.div>

      {/* 3. Day-by-day detailed breakdown toggle list */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-850 shadow-xs overflow-hidden">
        <button
          onClick={() => {
            hapticFeedback('medium');
            setShowDetailedList(prev => !prev);
          }}
          className="w-full p-5 flex justify-between items-center hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors select-none text-right cursor-pointer"
        >
          <div className="flex items-center gap-2">
            {showDetailedList ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
            <span className="text-xs font-black text-slate-400">انقر لعرض التفاصيل</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-black text-slate-900 dark:text-white">جدول الصرف اليومي المقارن</span>
            <div className="p-1.5 bg-indigo-50 dark:bg-slate-800 rounded-lg text-indigo-500">
              <Calendar size={14} />
            </div>
          </div>
        </button>

        <AnimatePresence>
          {showDetailedList && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-slate-100 dark:border-slate-850 overflow-hidden"
            >
              <div className="p-5 space-y-2 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-4 text-[9px] font-bold text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-850 px-2">
                  <div className="text-right">اليوم</div>
                  <div className="text-center font-tajawal">الأسبوع الماضي</div>
                  <div className="text-center font-tajawal">الأسبوع الحالي</div>
                  <div className="text-left font-tajawal">حالة التغير</div>
                </div>

                {weeklyData.slice().reverse().map((day, idx) => {
                  const isSaved = day.difference < 0;
                  const isEqual = day.difference === 0;
                  return (
                    <div 
                      key={idx}
                      className="grid grid-cols-4 items-center text-xs p-2.5 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl transition-colors font-sans font-bold"
                    >
                      <div className="text-right text-slate-700 dark:text-slate-300 font-tajawal">
                        <span className="block">{day.dayLabel}</span>
                        <span className="text-[8px] text-slate-400 block mt-0.5">{day.fullDateThis}</span>
                      </div>
                      <div className="text-center text-slate-400 font-medium">
                        {formatCurrency(day.lastWeek, currency)}
                      </div>
                      <div className="text-center text-slate-900 dark:text-white font-black">
                        {formatCurrency(day.thisWeek, currency)}
                      </div>
                      <div className={cn(
                        "text-left flex items-center gap-1",
                        isEqual 
                          ? "text-slate-400" 
                          : isSaved 
                            ? "text-emerald-500" 
                            : "text-amber-500"
                      )}>
                        {isEqual ? (
                          <span className="text-[9px] font-tajawal font-bold">مستقر</span>
                        ) : (
                          <>
                            <span className="text-[10px] font-bold font-sans">
                              {isSaved ? '-' : '+'}{formatCurrency(Math.abs(day.difference), currency)}
                            </span>
                            <span className="text-[8px] font-tajawal font-bold">
                              {isSaved ? '📉 وفر' : '📈 زاد'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* 4. Smart Saving Tips & Advice (نصائح توفير ذكية) */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-500">
            <Sparkles size={16} />
          </div>
          <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase leading-none">نصائح وحيل توفير ذكية مخصصة لك</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {smartAdvices.map((advice, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -3 }}
              className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-3xl shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                    {advice.icon}
                  </div>
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-[8px] font-black tracking-wider uppercase",
                    advice.type === 'positive' 
                      ? "bg-emerald-500/10 text-emerald-500" 
                      : advice.type === 'warning'
                        ? "bg-amber-500/10 text-amber-500"
                        : "bg-indigo-500/10 text-indigo-500"
                  )}>
                    {advice.type === 'positive' ? 'إيجابي 🎉' : advice.type === 'warning' ? 'تنبيه ⚠️' : 'توصية 💡'}
                  </span>
                </div>

                <h4 className="text-xs font-black text-slate-900 dark:text-white mb-2 leading-tight">
                  {advice.title}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold mb-4">
                  {advice.description}
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-100/50 dark:border-slate-900/50 rounded-2xl text-[10px] font-bold text-slate-600 dark:text-slate-300">
                <span className="text-indigo-600 dark:text-indigo-400 block mb-1">💡 الإجراء المقترح:</span>
                <p className="leading-relaxed font-semibold">{advice.actionItem || advice.action}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

    </div>
  );
};
