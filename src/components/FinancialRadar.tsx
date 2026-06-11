import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, Award, Compass, Flame, Zap } from 'lucide-react';
import { AnimatedNumber } from './AnimatedNumber';
import { formatCurrency, cn, hapticFeedback } from '../utils';

interface FinancialRadarProps {
  budgetStatus: 'red' | 'orange' | 'green';
  todaySpending: number;
  rollingBudget: number;
  rollingBudgetEnabled: boolean;
  currency: string;
  dailyBudget: number;
  remainingDailyBudget: number;
  showChallengeHelp: boolean;
  setShowChallengeHelp: (v: boolean) => void;
  currentChallenge: { title: string; desc: string };
  itemVariants?: any;
}

const FinancialRadar: React.FC<FinancialRadarProps> = ({
  budgetStatus,
  todaySpending,
  rollingBudget,
  rollingBudgetEnabled,
  currency,
  dailyBudget,
  remainingDailyBudget,
  showChallengeHelp,
  setShowChallengeHelp,
  currentChallenge,
  itemVariants
}) => {
  return (
    <motion.div
      variants={itemVariants}
      className="bg-slate-900 border border-slate-800 p-6 sm:p-7 rounded-[2.5rem] relative overflow-hidden shadow-2xl flex flex-col justify-between min-h-[470px] text-right"
      dir="rtl"
    >
      {/* Ambient Background Gradient based on limits */}
      <div className={cn(
        "absolute inset-0 opacity-15 blur-[100px] pointer-events-none transition-all duration-1000",
        budgetStatus === 'red' ? "bg-rose-500" : budgetStatus === 'orange' ? "bg-amber-500" : "bg-emerald-500"
      )} />

      {/* Title Block with Interactive Tooltip */}
      <div className="relative z-10 flex justify-between items-start w-full">
        <motion.button
          onClick={() => { hapticFeedback('light'); setShowChallengeHelp(!showChallengeHelp); }}
          whileHover={{ scale: 1.1 }}
          className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 cursor-pointer"
        >
          <HelpCircle size={15} />
        </motion.button>
        <div className="text-right">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block pl-1">مؤشرات الاستهلاك لليوم</span>
          <h3 className="text-lg font-black text-white mt-1">الرادار المالي النشط</h3>
        </div>
      </div>

      {/* Circular glowing indicator */}
      <div className="relative z-10 py-2 flex flex-col items-center justify-center">
        <div className="relative w-44 h-44 flex items-center justify-center">
          {/* SVG glowing circle border */}
          <svg className="w-full h-full transform -rotate-90">
            <circle 
              cx="88" 
              cy="88" 
              r="76" 
              className="stroke-slate-800/60 fill-none" 
              strokeWidth="8"
            />
            <motion.circle 
              cx="88" 
              cy="88" 
              r="76" 
              className={cn(
                "fill-none transition-all duration-1000",
                budgetStatus === 'red' ? "stroke-rose-500" : budgetStatus === 'orange' ? "stroke-amber-500" : "stroke-emerald-500"
              )}
              style={{
                filter: budgetStatus === 'red' 
                  ? 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.35))' 
                  : budgetStatus === 'orange'
                  ? 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.35))'
                  : 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.35))'
              }}
              strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 76}`}
              initial={{ strokeDashoffset: `${2 * Math.PI * 76}` }}
              animate={{ strokeDashoffset: `${2 * Math.PI * 76 * (1 - Math.min(1, todaySpending / (rollingBudget || 1)))}` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              strokeLinecap="round"
            />
          </svg>

          {/* Inner content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            {budgetStatus === 'green' ? (
              <Award className="size-4.5 text-emerald-400 mb-0.5 animate-bounce" />
            ) : budgetStatus === 'orange' ? (
              <Compass className="size-4.5 text-amber-400 mb-0.5" />
            ) : (
              <Flame className="size-4.5 text-rose-450 mb-0.5 animate-pulse" />
            )}
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1 leading-none">مجموع المنصرف</span>
            <div className="text-2xl font-black text-white leading-tight my-0.5 tracking-tight font-sans">
              <AnimatedNumber value={todaySpending} currency={currency} />
            </div>
            <div className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">
              الحد المرن: {formatCurrency(dailyBudget, currency)}
            </div>
          </div>
        </div>
      </div>

      {/* Gamified Challenge Box */}
      <div className="relative z-10 space-y-4 pt-4 border-t border-slate-800">
        <div className="flex justify-between items-center">
          {rollingBudgetEnabled && (
            <span className="text-[8px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-black uppercase tracking-widest pl-3">
              ميزانية تراكمية نشطة
            </span>
          )}
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-300 tracking-wider">
            <Zap size={12} className="text-amber-500" />
            <span>تحدي الحد اليومي المرن</span>
          </div>
        </div>

        <div className={cn(
          "p-3.5 rounded-2xl border transition-all duration-500 text-right",
          budgetStatus === 'red' 
            ? "bg-rose-500/10 border-rose-500/25 text-rose-200" 
            : budgetStatus === 'orange'
            ? "bg-amber-500/10 border-amber-500/25 text-amber-200"
            : "bg-emerald-500/10 border-emerald-500/25 text-emerald-200"
        )}>
          <h5 className="text-xs font-black">{currentChallenge.title}</h5>
          <p className="text-[10px] text-slate-400 leading-normal mt-1">{currentChallenge.desc}</p>
        </div>

        {/* Remaining progress slider stats */}
        <div className="flex justify-between items-center text-xs px-1">
          <span className={cn(
            "font-black text-sm font-mono tracking-tight",
            budgetStatus === 'red' ? "text-rose-400" : "text-emerald-400"
          )}>
            {formatCurrency(remainingDailyBudget, currency)}
          </span>
          <span className="text-slate-400 font-bold">المتبقي الصافي لليوم:</span>
        </div>
      </div>

      {/* Interactive help tooltip */}
      <AnimatePresence>
        {showChallengeHelp && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute inset-x-4 top-16 z-30 p-4 bg-slate-950/95 dark:bg-slate-900/95 backdrop-blur-3xl border border-slate-800 rounded-2xl shadow-2xl text-xs text-slate-300 leading-relaxed space-y-2 text-right pointer-events-auto"
          >
            <p className="font-black text-white">📈 كيف يعمل الرادار المالي النشط؟</p>
            <p>اللون الأخضر يعني أنك في منطقة الأمان اليومية التامة. البرتقالي جرس تحذير خفيف، والأحمر يوضح أنك تخطيت الحد المسموح.</p>
            <button 
              onClick={() => setShowChallengeHelp(false)} 
              className="w-full text-center py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-white transition-colors border border-white/5 cursor-pointer"
            >
              مفهوم!
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FinancialRadar;
