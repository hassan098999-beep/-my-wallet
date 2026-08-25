import React from 'react';
import { motion } from 'motion/react';
import { Heart, ShieldCheck, Users, TrendingUp, Sparkles, Award } from 'lucide-react';
import { formatCurrency, cn } from '../../utils';

interface FamilyHeroCardProps {
  totalLivingExpenses: number;
  perCapitaCost: number;
  needsPercentage: number;
  householdSavings: number;
  healthScore: number;
  currency: string;
  memberCount?: number;
}

export const FamilyHeroCard: React.FC<FamilyHeroCardProps> = ({
  totalLivingExpenses,
  perCapitaCost,
  needsPercentage,
  householdSavings,
  healthScore,
  currency,
  memberCount = 3,
}) => {
  const getScoreStatus = (score: number) => {
    if (score >= 80) return { label: 'ممتاز ومحمي 🌟', color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' };
    if (score >= 60) return { label: 'مستقر وآمن 🛡️', color: 'text-teal-500', bg: 'bg-teal-500/10 border-teal-500/20' };
    if (score >= 40) return { label: 'تحت المتابعة ⚠️', color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' };
    return { label: 'يحتاج ترشيداً 🚨', color: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/20' };
  };

  const status = getScoreStatus(healthScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 text-white p-5 md:p-7 shadow-xl border border-slate-800/80 relative overflow-hidden text-right"
      dir="rtl"
    >
      {/* Ambient background glows */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner: Family Identity & Health Score */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-900/30 shrink-0">
            <Heart size={28} className="animate-pulse text-rose-200 fill-rose-200/20" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg md:text-xl font-black text-white flex items-center gap-1.5">
                <span>عائلة حسن الرياحي وسهير</span>
                <span className="text-base">🏡</span>
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5 flex items-center gap-2">
              <span>برفقة الابن الرضيع <strong className="text-emerald-400">يحيى</strong> (شهر و 18 يوماً) 🍼</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-600" />
              <span className="text-slate-400 font-mono font-bold">{memberCount} أفراد</span>
            </p>
          </div>
        </div>

        {/* Health Score Meter */}
        <div className="flex items-center gap-3 bg-slate-800/60 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-700/60 shrink-0">
          <div className="relative flex items-center justify-center">
            <div className="w-11 h-11 rounded-full border-3 border-slate-700 flex items-center justify-center">
              <span className="text-sm font-black font-mono text-emerald-400">{healthScore}%</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 block">مؤشر الاستقرار المعيشي:</span>
            <span className={cn("text-xs font-black px-2 py-0.5 rounded-md border inline-block mt-0.5", status.bg, status.color)}>
              {status.label}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mt-5 relative z-10">
        {/* Metric 1 */}
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-3.5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 block">المصروف المعيشي الشهري</span>
          <p className="text-base sm:text-lg font-black font-mono text-white">
            {formatCurrency(totalLivingExpenses, currency)}
          </p>
          <span className="text-[9px] text-slate-400 block font-medium">إجمالي نفقات الأسرة والمنزل</span>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-3.5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 block">متوسط تكلفة الفرد التقديرية</span>
          <p className="text-base sm:text-lg font-black font-mono text-teal-400">
            {formatCurrency(perCapitaCost, currency)}
          </p>
          <span className="text-[9px] text-slate-400 block font-medium">معدل الفرد (3 أفراد)</span>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-3.5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 block">نسبة الالتزامات الأساسية</span>
          <p className="text-base sm:text-lg font-black font-mono text-amber-400">
            {Math.round(needsPercentage)}%
          </p>
          <span className="text-[9px] text-slate-400 block font-medium">قفة السوق، الفواتير، الكراء</span>
        </div>

        {/* Metric 4 */}
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-3.5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 block">فائض الأسرة والوعاء الادخاري</span>
          <p className="text-base sm:text-lg font-black font-mono text-emerald-400">
            {formatCurrency(householdSavings, currency)}
          </p>
          <span className="text-[9px] text-slate-400 block font-medium">طوارئ ومستقبل الأبناء</span>
        </div>
      </div>
    </motion.div>
  );
};

export default FamilyHeroCard;
