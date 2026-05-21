import React from 'react';
import { motion } from 'motion/react';
import { Target, Activity, ArrowDownRight, ArrowUpRight, TrendingUp, Lightbulb, Sparkles, ShieldCheck, TriangleAlert } from 'lucide-react';
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
  itemVariants: any;
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
}) => {
  const savingsRate = totalMonthlyIncome > 0 ? Math.max(0, Math.round((netBalance / totalMonthlyIncome) * 100)) : 0;

  return (
    <div className="space-y-6 md:space-y-8">
      {/* 1. Primary Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Net Balance (Safe & Elegant design) */}
        <motion.div 
          variants={itemVariants} 
          className={cn(
            "rounded-3xl p-6 text-white shadow-sm relative overflow-hidden group border",
            netBalance >= 0 ? "bg-slate-950 dark:bg-black border-slate-900" : "bg-gradient-to-br from-rose-600 to-red-700 border-rose-500"
          )}
        >
          {netBalance >= 0 && (
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-transparent to-transparent opacity-40 pointer-events-none" />
          )}
          <div className="relative z-10 flex flex-col justify-between h-full min-h-[120px]">
            <div className="flex items-center gap-2 opacity-60">
              <Target size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">الصافي (التوفير المحتمل)</span>
            </div>
            <div className="text-3xl font-black mt-2">
              {formatCurrency(Math.abs(netBalance), currency)}
            </div>
            <div className="mt-4 inline-flex self-start items-center gap-1.5 text-[9px] font-black bg-white/10 backdrop-blur-md px-3 py-1 rounded-full uppercase tracking-widest">
              <Activity size={12} />
              <span>{netBalance >= 0 ? 'فوائض مالية جيدة' : 'عجز مالي يتطلب الضبط'}</span>
            </div>
          </div>
        </motion.div>

        {/* Total Income */}
        <motion.div 
          variants={itemVariants} 
          className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-850 shadow-sm relative overflow-hidden group"
        >
          <div className="relative z-10 flex flex-col justify-between h-full min-h-[120px]">
            <div className="flex items-center gap-2 text-slate-400">
              <ArrowDownRight size={16} className="text-emerald-500 shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-widest">إجمالي الدخل</span>
            </div>
            <div className="text-3xl font-black mt-2 text-slate-900 dark:text-white">
              {formatCurrency(totalMonthlyIncome, currency)}
            </div>
            <div className="mt-4 flex items-center gap-2 text-[9px] font-black bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-100/30 w-fit">
              <TrendingUp size={12} />
              <span>{filteredIncomeLength} مصادر</span>
              {prevMonthIncome > 0 && (
                <span className="mr-1 opacity-80">
                  ({incomeDiff >= 0 ? '+' : ''}{incomeDiff.toFixed(0)}%)
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Total Expense */}
        <motion.div 
          variants={itemVariants} 
          className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-850 shadow-sm relative overflow-hidden group"
        >
          <div className="relative z-10 flex flex-col justify-between h-full min-h-[120px]">
            <div className="flex items-center gap-2 text-slate-400">
              <ArrowUpRight size={16} className="text-rose-500 shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-widest">إجمالي المصاريف</span>
            </div>
            <div className="text-3xl font-black mt-2 text-slate-900 dark:text-white">
              {formatCurrency(totalMonthlyExpense, currency)}
            </div>
            <div className="mt-4 flex items-center gap-2 text-[9px] font-black bg-rose-50/50 dark:bg-rose-955/20 text-rose-600 dark:text-rose-400 px-3 py-1 rounded-full uppercase tracking-widest border border-rose-100/30 w-fit">
              <Activity size={12} />
              <span>{filteredExpensesLength} عمليات</span>
              {prevMonthExpenses > 0 && (
                <span className="mr-1 opacity-80">
                  ({expenseDiff >= 0 ? '+' : ''}{expenseDiff.toFixed(0)}%)
                </span>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* 2. Secondary Mini KPI Items */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'متوسط الأيام', value: formatCurrency(averageDailyExpense, currency), color: 'text-indigo-500' },
          { label: 'الأعلى صرفاً', value: highestExpenseDay.date !== '-' ? highestExpenseDay.fullDate : '-', color: 'text-rose-500' },
          { label: 'الفئة الأكثر', value: categoryData.length > 0 ? categoryData[0].name : '-', color: 'text-amber-500' },
          { label: 'نسبة التوفير', value: `${savingsRate}%`, color: 'text-emerald-500' }
        ].map((insight, idx) => (
          <motion.div 
            key={idx}
            variants={itemVariants} 
            className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-850 flex flex-col items-center justify-center text-center shadow-xs"
          >
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{insight.label}</span>
            <span className={cn("text-sm md:text-base font-black tracking-tight", insight.color)}>{insight.value}</span>
          </motion.div>
        ))}
      </div>

      {/* 3. Combined Smart Tips & AI Advisor Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Behavioral Engine Insights */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 px-1">
            <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-500">
              <Lightbulb size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">نصائح سلوكية ذكية</h3>
              <p className="text-[9px] text-slate-400 font-bold">بناءً على أنماط الصرف في حسابك</p>
            </div>
          </div>

          <div className="space-y-3">
            {insights.slice(0, 2).map((insight) => (
              <motion.div
                key={insight.id}
                variants={itemVariants}
                className={cn(
                  "p-5 rounded-2xl border text-right transition-all",
                  insight.type === 'warning' ? "bg-rose-50/50 dark:bg-rose-950/10 border-rose-100/50 dark:border-rose-900/40" :
                  insight.type === 'positive' ? "bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100/50 dark:border-emerald-900/40 font-bold" :
                  "bg-indigo-50/55 dark:bg-indigo-950/10 border-indigo-100/50 dark:border-indigo-900/40"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "p-2 rounded-xl shrink-0 mt-0.5",
                    insight.type === 'warning' ? "bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400" :
                    insight.type === 'positive' ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400" :
                    "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400"
                  )}>
                    {insight.type === 'warning' ? <TriangleAlert size={16} /> :
                     insight.type === 'positive' ? <TrendingUp size={16} /> :
                     <Activity size={16} />}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">{insight.title}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-bold">{insight.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
            {insights.length === 0 && (
              <div className="text-center py-8 bg-slate-50/50 dark:bg-slate-900/50 p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs font-bold">
                سيقوم النظام بتحليل بياناتك السلوكية تلقائياً بمجرد زيادة العمليات.
              </div>
            )}
          </div>
        </div>

        {/* AI Advisor Tips with Gemini */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-500">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">نصائح المستشار الذكي (AI)</h3>
                <p className="text-[9px] text-slate-400 font-bold">رؤى مالية معززة بالذكاء الاصطناعي</p>
              </div>
            </div>
            <Link to="/assistant" onClick={() => hapticFeedback('light')} className="text-[10px] font-black text-indigo-500 hover:text-indigo-600 dark:text-indigo-400">
              شات المساعد ←
            </Link>
          </div>

          {aiInsights?.advice && aiInsights.advice.length > 0 ? (
            <div className="space-y-3">
              {aiInsights.advice.slice(0, 2).map((item: any, idx: number) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  className={cn(
                    "p-5 rounded-2xl border transition-all",
                    item.priority === 'high' ? 'bg-rose-50/50 dark:bg-rose-950/10 border-rose-100/50 dark:border-rose-900/40' : 
                    item.priority === 'medium' ? 'bg-amber-50/50 dark:bg-amber-950/10 border-amber-100/50 dark:border-amber-900/40' : 
                    'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100/50 dark:border-emerald-900/40'
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">{item.title}</h4>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[8px] font-black border shrink-0 scale-90 origin-left",
                      item.priority === 'high' ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/30' : 
                      item.priority === 'medium' ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/30' : 
                      'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                    )}>
                      {item.priority === 'high' ? 'مهم جداً' : item.priority === 'medium' ? 'متوسط' : 'توجيه'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-bold mb-3">
                    {item.advice}
                  </p>
                  <div className="flex items-center gap-1.5 p-2 bg-white/40 dark:bg-black/20 rounded-xl border border-black/5 dark:border-white/5">
                    <ShieldCheck size={12} className="text-indigo-500 shrink-0" />
                    <span className="text-[9px] font-black text-slate-700 dark:text-slate-300 truncate">{item.actionItem}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-850 text-center flex flex-col items-center justify-center h-[170px]">
              <Sparkles size={24} className="text-indigo-500 mb-2 animate-pulse" />
              <p className="text-xs font-black text-slate-900 dark:text-white mb-1">توليد نصائح الذكاء الاصطناعي</p>
              <p className="text-[9px] font-bold text-slate-400 mb-4 max-w-[240px] leading-relaxed">
                استشر المستشار المالي الآن لتحليل أدائك المالي الشهري وطلب توصيات مخصصة.
              </p>
              <Link to="/assistant" onClick={() => hapticFeedback('medium')} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[9px] font-black tracking-widest uppercase transition-all shadow-sm">
                تحليل بالذكاء الاصطناعي
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
