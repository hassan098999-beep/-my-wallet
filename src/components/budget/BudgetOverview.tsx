import React from 'react';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';
import { 
  Wallet, Sparkles, TrendingDown, Info, HelpCircle, 
  ShieldCheck, Activity, TrendingUp, Calendar, Zap 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, Cell 
} from 'recharts';
import Card from '../ui/Card';
import BudgetAutoTune from './BudgetAutoTune';
import { Category, BudgetPeriod } from '../../types';
import { cn, formatCurrency, hapticFeedback } from '../../utils';

interface BudgetOverviewProps {
  globalBudget: string;
  setGlobalBudget: (val: string) => void;
  overallPeriod: BudgetPeriod;
  setOverallPeriod: (val: BudgetPeriod) => void;
  currency: string;
  totalSpent: number;
  monthSpent: number;
  weekSpent: number;
  remainingBudget: number;
  overallPercentage: number;
  dailyLimit: number;
  remainingDays: number;
  remainingDaysInWeek: number;
  daysInMonth: number;
  rollingBudgetEnabled: boolean;
  setRollingBudgetEnabled: (enabled: boolean) => void;
  globalBudgetNum: number;
  chartData: Array<{ name: string; spent: number; budgeted: number; color?: string }>;
  categories: Category[];
  showRuleInfo: boolean;
  setShowRuleInfo: React.Dispatch<React.SetStateAction<boolean>>;
  suggestFromHistory: () => void;
  autoAllocate: () => void;
  isGenerating: boolean;
  itemVariants?: any;
}

export const BudgetOverview: React.FC<BudgetOverviewProps> = ({
  globalBudget,
  setGlobalBudget,
  overallPeriod,
  setOverallPeriod,
  currency,
  totalSpent,
  monthSpent,
  weekSpent,
  remainingBudget,
  overallPercentage,
  dailyLimit,
  remainingDays,
  remainingDaysInWeek,
  daysInMonth,
  rollingBudgetEnabled,
  setRollingBudgetEnabled,
  globalBudgetNum,
  chartData,
  categories,
  showRuleInfo,
  setShowRuleInfo,
  suggestFromHistory,
  autoAllocate,
  isGenerating,
  itemVariants,
}) => {
  const isWeekly = overallPeriod === 'weekly';

  return (
    <div className="space-y-8">
      {/* Main Intelligent Budget Dashboard and Progress */}
      <motion.div variants={itemVariants}>
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/85 rounded-3xl relative overflow-hidden p-6 md:p-8 shadow-md dark:shadow-black/10 transition-all duration-300">
          
          {/* Subtle decorative background light */}
          <div className="absolute right-0 top-0 -mr-20 -mt-20 w-80 h-80 bg-emerald-500/5 dark:bg-emerald-400/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute left-0 bottom-0 -ml-20 -mb-20 w-80 h-80 bg-primary-500/5 dark:bg-primary-400/5 rounded-full blur-3xl pointer-events-none" />

          {/* Interactive header of Dashboard */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 mb-6 border-b border-slate-100 dark:border-slate-800/60 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-500 shrink-0">
                <Wallet size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-800 dark:text-white">
                    {isWeekly ? 'الميزانية الأسبوعية الإجمالية وحالة الصرف' : 'الميزانية الشهرية الإجمالية وحالة الصرف'}
                  </h2>
                  <span className={cn(
                    "text-[10px] font-black px-2 py-0.5 rounded-full",
                    isWeekly ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300" : "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300"
                  )}>
                    {isWeekly ? '⚡ أسبوعية' : '🗓️ شهرية'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-bold">
                  {isWeekly 
                    ? 'عيّن سقف مصروفاتك للأسبوع الحالي مع تتبع يومي دقيق'
                    : 'عيّن سقف مصروفاتك للشهر الحالي لتنظيم الميزانية الذكية'
                  }
                </p>
              </div>
            </div>

            {/* Right controls: Period switcher and Quick Allocator */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Period Switcher */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                <button
                  type="button"
                  onClick={() => {
                    hapticFeedback('medium');
                    setOverallPeriod('weekly');
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer",
                    isWeekly
                      ? "bg-amber-500 text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  )}
                >
                  <Zap size={12} />
                  <span>ميزانية أسبوعية</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    hapticFeedback('medium');
                    setOverallPeriod('monthly');
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer",
                    !isWeekly
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  )}
                >
                  <Calendar size={12} />
                  <span>ميزانية شهرية</span>
                </button>
              </div>

              {/* Quick Allocator and Information clicker */}
              <BudgetAutoTune
                showRuleInfo={showRuleInfo}
                setShowRuleInfo={setShowRuleInfo}
                suggestFromHistory={suggestFromHistory}
                autoAllocate={autoAllocate}
                isGenerating={isGenerating}
                globalBudget={globalBudget}
              />
            </div>
          </div>

          {/* Budget Input & Progress Gauge Block */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Portion of Block: Raw Input and Balance Indicators */}
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
                    {isWeekly ? 'مبلغ الميزانية الأسبوعية المستهدف' : 'مبلغ الميزانية الشهرية المستهدف'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">
                    {isWeekly ? 'يتجدد كل أسبوع' : 'لكامل دورة الشهر'}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={globalBudget}
                    onChange={(e) => setGlobalBudget(e.target.value)}
                    onFocus={(e) => {
                      if (!globalBudget || globalBudget === '0' || globalBudget === '0.00' || parseFloat(globalBudget) === 0) {
                        setGlobalBudget('');
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
                      if (!globalBudget || globalBudget === '0' || globalBudget === '0.00' || parseFloat(globalBudget) === 0) {
                        setGlobalBudget('');
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
                      "w-full bg-slate-50 dark:bg-slate-950/50 border-2 border-dashed rounded-2xl px-5 py-4 text-3xl font-black text-center font-mono text-slate-800 dark:text-white transition-all outline-none",
                      isWeekly 
                        ? "border-amber-300 dark:border-amber-800/60 focus:border-amber-500" 
                        : "border-slate-200 dark:border-slate-800 focus:border-emerald-500"
                    )}
                    placeholder="0.00"
                  />
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-lg font-black">
                    {currency} {isWeekly ? '/ أس' : ''}
                  </span>
                </div>
              </div>

              {/* Dynamic summary counts */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-rose-50/20 dark:bg-rose-950/5 rounded-2xl p-4 border border-rose-100/30 dark:border-rose-900/20 transition-all hover:shadow-xs">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 mb-1">
                    {isWeekly ? 'صرف الأسبوع الحالي' : 'ما تم صرفه في الشهر'}
                  </p>
                  <p className="text-sm font-black text-rose-500 dark:text-rose-400 font-mono">{formatCurrency(totalSpent, currency)}</p>
                </div>
                <div className="bg-emerald-50/20 dark:bg-emerald-950/5 rounded-2xl p-4 border border-emerald-100/30 dark:border-emerald-900/20 transition-all hover:shadow-xs">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 mb-1">
                    {isWeekly ? 'المتبقي لهذا الأسبوع' : 'المبلغ المتبقي للشهر'}
                  </p>
                  <p className={cn(
                    "text-sm font-black font-mono",
                    remainingBudget > 0 ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"
                  )}>{formatCurrency(remainingBudget, currency)}</p>
                </div>
              </div>
            </div>

            {/* Right Portion of Block: Visual Progress, Daily Limit calculation, Rolling switch */}
            <div className="lg:col-span-7 space-y-6 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/40">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {isWeekly ? 'نسبة استهلاك ميزانية الأسبوع' : 'نسبة استهلاك الميزانية الكلية'}
                  </span>
                  <span className={cn(
                    "text-xs font-black px-2.5 py-1 rounded-lg",
                    overallPercentage > 100 ? "bg-rose-50/50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400" :
                    overallPercentage > 85 ? "bg-amber-50/50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400" :
                    "bg-emerald-50/50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                  )}>
                    {overallPercentage.toFixed(1)}% المستهلك
                  </span>
                </div>
                
                {/* Custom glowing progress bar */}
                <div className="h-4 bg-slate-150 dark:bg-slate-900 rounded-full p-0.5 border border-slate-200/40 dark:border-slate-800 shadow-inner relative overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(overallPercentage, 100)}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className={cn(
                      "h-full rounded-full transition-colors duration-500",
                      overallPercentage > 100 ? "bg-rose-500" : overallPercentage > 85 ? "bg-amber-500" : isWeekly ? "bg-amber-500" : "bg-gradient-to-r from-emerald-500 to-teal-400"
                    )}
                  />
                </div>
              </div>

              {/* Auxiliary calculation summary */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="bg-white dark:bg-slate-900/60 rounded-2xl p-4 shadow-sm border border-slate-150 dark:border-slate-800/80 transition-all hover:-translate-y-0.5">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 mb-1">
                    {isWeekly ? 'الميزانية اليومية للأسبوع ⚡' : 'الميزانية اليومية المقترحة ⚡'}
                  </p>
                  <p className="text-sm md:text-base font-black text-slate-800 dark:text-white font-mono">{formatCurrency(dailyLimit, currency)}</p>
                  <p className="text-[8px] text-slate-400 font-medium mt-0.5">
                    {rollingBudgetEnabled 
                      ? (isWeekly ? `تتكيف مع الـ ${remainingDaysInWeek} أيام المتبقية في الأسبوع` : "تتكيف يومياً بناءً على ما أنفقته")
                      : (isWeekly ? "موزعة بالتساوي على أيام الأسبوع" : "موزعة بالتساوي على الأيام")}
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900/60 rounded-2xl p-4 shadow-sm border border-slate-150 dark:border-slate-800/80 transition-all hover:-translate-y-0.5">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 mb-1">
                    {isWeekly ? 'أيام الأسبوع المتبقية ⏳' : 'دورتك المالية المتبقية ⏳'}
                  </p>
                  <p className="text-sm md:text-base font-black text-slate-800 dark:text-white font-mono">
                    {isWeekly ? remainingDaysInWeek : remainingDays} <span className="text-xs text-slate-400">أيّام</span>
                  </p>
                  <p className="text-[8px] text-slate-400 font-medium mt-0.5 font-tajawal">
                    {isWeekly ? `من أصل 7 أيام في الأسبوع الحالي` : `من أصل ${daysInMonth} يوم في دورتك`}
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </motion.div>

      {/* Embedded rolling budget toggle manager */}
      <motion.div variants={itemVariants}>
        <Card className="p-5 border-l-4 border-l-primary-500 text-right bg-gradient-to-br from-indigo-50/20 via-white to-white dark:from-indigo-950/5 dark:via-slate-900 dark:to-slate-900">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <span className="flex items-center gap-1.5 text-xs font-black text-indigo-600 dark:text-indigo-400">
                <Sparkles size={14} className="text-amber-500 animate-pulse" />
                الميزانية المتدحرجة (Rolling Budget)
              </span>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed max-w-2xl font-medium">
                ميزة ذكية تعيد حساب مسموح صرفك اليومي تلقائياً كل 24 ساعة. إذا صرفت أقل من حدك اليومي، يرتفع حدك غداً مفسحاً لك المجال للترفيه الآمن، والعكس بالعكس لتبقى منضبطاً!
              </p>
            </div>
            
            {/* Elegant Toggle switch */}
            <div className="flex items-center gap-3 self-end md:self-center">
              <span className="text-xs font-black text-slate-500 dark:text-slate-300">
                {rollingBudgetEnabled ? 'مفعلة تلقائياً ✅' : 'الميزانية الثابتة ⚠️'}
              </span>
              <button
                onClick={() => {
                  hapticFeedback('medium');
                  setRollingBudgetEnabled(!rollingBudgetEnabled);
                  toast.success(
                    rollingBudgetEnabled 
                      ? 'تم التحول للمود الثابت للميزانية اليومية.' 
                      : 'تم تفعيل حساب الميزانية المتدحرجة! استمتع بنصائح يومية ذكية هادفة.'
                  );
                }}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none",
                  rollingBudgetEnabled ? "bg-primary-600" : "bg-slate-300 dark:bg-slate-700"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out",
                    rollingBudgetEnabled ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Advisory and Alert Box based on current status */}
      <motion.div variants={itemVariants}>
        <div className={cn(
          "p-4 rounded-2xl border flex items-start gap-3.5 transition-all",
          overallPercentage > 100 ? "bg-rose-50/40 border-rose-100 text-rose-800 dark:bg-rose-950/10 dark:border-rose-900/30" :
          overallPercentage > 80 ? "bg-amber-50/40 border-amber-100 text-amber-800 dark:bg-amber-950/10 dark:border-amber-900/30" :
          globalBudgetNum === 0 ? "bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800/10 dark:border-slate-800" :
          "bg-emerald-50/40 border-emerald-100 text-emerald-800 dark:bg-emerald-950/10 dark:border-emerald-900/30"
        )}>
          <div className="shrink-0 mt-0.5">
            {overallPercentage > 100 ? <TrendingDown size={18} className="text-rose-500 animate-[bounce_2s_infinite]" /> :
             overallPercentage > 80 ? <Info size={18} className="text-amber-500 animate-pulse" /> :
             globalBudgetNum === 0 ? <HelpCircle size={18} className="text-slate-500" /> :
             <ShieldCheck size={18} className="text-emerald-500" />}
          </div>
          <div className="space-y-1.5 flex-1 text-right">
            <h4 className="text-xs font-black">
              {overallPercentage > 100 ? 'لقد تخطيت الميزانية المحددة بالكامل! 🚨' :
               overallPercentage > 80 ? 'لقد شارفت ميزانيتك على النفاد! ⚠️' :
               globalBudgetNum === 0 ? 'ابدأ بإعداد ميزانيتك المالية للتحكم بمصاريفك.' :
               'وضعك المالي متميز ومنضبط! 🛡️'}
            </h4>
            <p className="text-[11px] leading-relaxed opacity-95">
              {overallPercentage > 100 ? 'ننصحك بشدة بوقف الصرف غير الطارئ فوراً وتفعيل الميزانية المتدحرجة لتخفيض الصدمة والحد من التأثير السلبي لقفة العائلة.' :
               overallPercentage > 80 ? `المبلغ المتبقي لدورتك هو (${formatCurrency(remainingBudget, currency)}) الموزع على ${remainingDays} أيام. أي بمعدل ${formatCurrency(dailyLimit, currency)} لليوم الواحد.` :
               globalBudgetNum === 0 ? 'ضع مبلغاً تقديرياً تود ألا تتخطاه هذا الشهر، ثم انقر على "توزيع ذكي" لنوزعه تلقائياً على كل فئة حسب أهميتها.' :
               'أنت تصرف بمعدل صحي ومقنن تحت وطأة التحكم المالي. التزامك بقاعدة 50/30/20 سيحمي أهداف إدخارك.'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Graphical Comparison Dashboard */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Activity size={18} className="text-emerald-500 animate-pulse" />
            <span>التحليل والمقارنة الرسومية للفئات المحددة</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 font-bold">تقرير بصري مقارن يوضح نفقاتك الفعلية بموازاة السقف المحدد لكل فئة من دورتك الحالية</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Comparative horizontal Bar Chart */}
          <div className="lg:col-span-8 card p-5 shadow-xs relative overflow-hidden">
            <div className="flex justify-between items-center mb-4 text-right">
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white">الميزانية المرصودة مقابل المصروف المنجز</h4>
                <p className="text-[9px] text-slate-400 font-bold mt-0.5">مقارنة ثنائية بصرية لكافة فئات الدفتر العائلي</p>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950/20 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="w-2 h-2 bg-indigo-500/80 rounded-full" />
                <span className="text-[9px] text-slate-500 font-black pl-2">الميزانية</span>
                <span className="w-2 h-2 bg-rose-500/90 rounded-full" />
                <span className="text-[9px] text-slate-500 font-black">المصروف</span>
              </div>
            </div>

            {chartData.length > 0 ? (
              <div className="w-full" style={{ height: `${Math.max(240, chartData.length * 40)}px` }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" opacity={0.3} />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 750, fill: '#94a3b8' }} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      orientation="right"
                      tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }}
                      width={110}
                    />
                    <RechartsTooltip
                      cursor={{ fill: '#f8fafc', opacity: 0.1 }}
                      contentStyle={{ borderRadius: '14px', background: '#0f172a', border: '1px solid #1e293b', direction: 'rtl' }}
                      itemStyle={{ color: '#fff', fontSize: '10px', fontFamily: 'Tajawal, sans-serif' }}
                      labelStyle={{ color: '#94a3b8', fontSize: '9px', fontWeight: 'bold', fontFamily: 'Tajawal, sans-serif', textAlign: 'right' }}
                      formatter={(value: any, name: any) => [
                        `${value} ${currency}`,
                        name === 'budgeted' ? 'الميزانية المخصصة' : 'المصروف الفعلي'
                      ]}
                    />
                    <Bar dataKey="budgeted" name="budgeted" fill="#6366f1" radius={[0, 3, 3, 0]} barSize={8}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-budgeted-${index}`} fill={entry.color ? `${entry.color}35` : '#6366f135'} stroke={entry.color || '#6366f1'} strokeWidth={1.5} />
                      ))}
                    </Bar>
                    <Bar dataKey="spent" name="spent" fill="#ef4444" radius={[0, 3, 3, 0]} barSize={8}>
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-spent-${index}`} 
                          fill={entry.spent > entry.budgeted && entry.budgeted > 0 ? '#f43f5e' : `${entry.color || '#10b981'}bb`} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-950/40 flex items-center justify-center text-slate-400">
                  <TrendingUp size={22} />
                </div>
                <p className="text-xs font-black text-slate-500">لا توجد مخصصات أو مصاريف لتمثيلها حالياً.</p>
                <p className="text-[10px] text-slate-400">حدد ميزانية لبعض الفئات في الأسفل أو أضف نفقات جديدة للشهر الحالي لتفعيل الرسم البياني التفاعلي.</p>
              </div>
            )}
          </div>

          {/* Allocation Gauge cards */}
          <div className="lg:col-span-4 card p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <h4 className="text-xs font-black text-slate-900 dark:text-white">توزيع النفقات حسب قاعدة 50/30/20</h4>
              <p className="text-[9px] text-slate-400 font-bold mt-0.5">حالة توازن النفقات حسب طبيعة كل فئة</p>
            </div>

            <div className="flex-1 flex flex-col justify-center space-y-5 py-2">
              {/* Needs Indicator */}
              <div className="space-y-1.5 text-right">
                <div className="flex justify-between items-center text-[10px] font-black">
                  <span className="text-rose-500 font-mono">
                    {formatCurrency(chartData.filter(i => {
                      const found = categories.find(c => c.name === i.name);
                      return found?.type === 'need' || !found?.type;
                    }).reduce((s, x) => s + x.spent, 0), currency)}
                    {' / '}
                    {formatCurrency(chartData.filter(i => {
                      const found = categories.find(c => c.name === i.name);
                      return found?.type === 'need' || !found?.type;
                    }).reduce((s, x) => s + x.budgeted, 0), currency)}
                  </span>
                  <span className="text-slate-650 dark:text-slate-350">الاحتياجات الحتمية (%50 المقترح)</span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-rose-500 transition-all duration-500" 
                    style={{ 
                      width: `${Math.min(100, (() => {
                        const budgets = chartData.filter(i => {
                          const found = categories.find(c => c.name === i.name);
                          return found?.type === 'need' || !found?.type;
                        }).reduce((s, x) => s + x.budgeted, 0);
                        const spents = chartData.filter(i => {
                          const found = categories.find(c => c.name === i.name);
                          return found?.type === 'need' || !found?.type;
                        }).reduce((s, x) => s + x.spent, 0);
                        return budgets > 0 ? (spents / budgets) * 100 : 0;
                      })())}%` 
                    }} 
                  />
                </div>
              </div>

              {/* Wants Indicator */}
              <div className="space-y-1.5 text-right">
                <div className="flex justify-between items-center text-[10px] font-black">
                  <span className="text-amber-500 font-mono">
                    {formatCurrency(chartData.filter(i => categories.find(c => c.name === i.name)?.type === 'want').reduce((s, x) => s + x.spent, 0), currency)}
                    {' / '}
                    {formatCurrency(chartData.filter(i => categories.find(c => c.name === i.name)?.type === 'want').reduce((s, x) => s + x.budgeted, 0), currency)}
                  </span>
                  <span className="text-slate-650 dark:text-slate-350">الكماليات والترفيه (%30 المقترح)</span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 transition-all duration-500" 
                    style={{ 
                      width: `${Math.min(100, (() => {
                        const budgets = chartData.filter(i => categories.find(c => c.name === i.name)?.type === 'want').reduce((s, x) => s + x.budgeted, 0);
                        const spents = chartData.filter(i => categories.find(c => c.name === i.name)?.type === 'want').reduce((s, x) => s + x.spent, 0);
                        return budgets > 0 ? (spents / budgets) * 100 : 0;
                      })())}%` 
                    }} 
                  />
                </div>
              </div>

              {/* Savings Indicator */}
              <div className="space-y-1.5 text-right">
                <div className="flex justify-between items-center text-[10px] font-black">
                  <span className="text-emerald-500 font-mono">
                    {formatCurrency(chartData.filter(i => categories.find(c => c.name === i.name)?.type === 'saving').reduce((s, x) => s + x.spent, 0), currency)}
                    {' / '}
                    {formatCurrency(chartData.filter(i => categories.find(c => c.name === i.name)?.type === 'saving').reduce((s, x) => s + x.budgeted, 0), currency)}
                  </span>
                  <span className="text-slate-650 dark:text-slate-350">الادخار والتأمين (%20 المقترح)</span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-500" 
                    style={{ 
                      width: `${Math.min(100, (() => {
                        const budgets = chartData.filter(i => categories.find(c => c.name === i.name)?.type === 'saving').reduce((s, x) => s + x.budgeted, 0);
                        const spents = chartData.filter(i => categories.find(c => c.name === i.name)?.type === 'saving').reduce((s, x) => s + x.spent, 0);
                        return budgets > 0 ? (spents / budgets) * 100 : 0;
                      })())}%` 
                    }} 
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[9px] text-slate-400 font-bold leading-relaxed">
              إذا تجاوز المصروف الفعلي حاجز الميزانية، سيظهر شريط فئة المعاملات باللون الأحمر المنبّه لحمايتك من الاستهلاك الزائد للقفة الأسبوعية.
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BudgetOverview;
