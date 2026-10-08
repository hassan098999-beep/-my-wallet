import React from 'react';
import { motion } from 'motion/react';
import { useAppContext } from '../store/AppContext';
import { 
  Trophy, 
  CheckCircle2, 
  LayoutGrid, 
  Zap, 
  CalendarClock, 
  Target, 
  User as UserIcon, 
  Award,
  Layers,
  Lock,
  Medal,
  Star
} from 'lucide-react';
import { cn } from '../utils';

const iconMap: Record<string, React.ElementType> = {
  CheckCircle2,
  Trophy,
  LayoutGrid,
  Zap,
  CalendarClock,
  Target,
  Layers,
  Award
};

export default function Profile() {
  const { userName, achievements, expenses = [], goals = [] } = useAppContext();

  // Basic stats
  const earnedCount = achievements?.filter(a => a.progress >= a.target).length || 0;
  const totalCount = achievements?.length || 0;
  const progressPercentage = totalCount === 0 ? 0 : Math.round((earnedCount / totalCount) * 100);

  return (
    <div className="space-y-6 md:space-y-8 max-w-5xl mx-auto pb-24 font-tajawal" dir="rtl">
      {/* Header Profile Section */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 shadow-xs border border-slate-200/80 dark:border-slate-800/80 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-28 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 dark:from-emerald-500/5 dark:via-teal-500/5 dark:to-indigo-500/5" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-right">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 border-4 border-white dark:border-slate-900 shadow-md flex items-center justify-center shrink-0 text-white">
            <UserIcon className="w-10 h-10 md:w-12 md:h-12" />
          </div>
          
          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {userName || 'المستخدم الحالي'}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium flex items-center justify-center md:justify-start gap-1.5 mt-1 text-xs">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                نسبة إنجاز الشارات: {progressPercentage}%
              </p>
            </div>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex flex-col items-center justify-center min-w-[110px]">
                <span className="text-xl md:text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums">{expenses.length}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">إجمالي العمليات</span>
              </div>
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex flex-col items-center justify-center min-w-[110px]">
                <span className="text-xl md:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">{earnedCount}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">إنجاز مكتمل</span>
              </div>
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex flex-col items-center justify-center min-w-[110px]">
                <span className="text-xl md:text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono tabular-nums">{goals.length}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">أهداف مدخرة</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Achievements Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Medal className="w-5 h-5 text-amber-500" />
            الشارات والإنجازات
          </h2>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full font-mono">
            {earnedCount} / {totalCount}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 md:gap-4">
          {achievements?.map((achievement, index) => {
            const isEarned = achievement.progress >= achievement.target;
            const IconComponent = iconMap[achievement.icon] || Trophy;
            const progressPercent = Math.min(100, Math.round((achievement.progress / achievement.target) * 100));

            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className={cn(
                  "relative overflow-hidden p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between",
                  isEarned 
                    ? "bg-white dark:bg-slate-900/90 border-emerald-300 dark:border-emerald-800/60 shadow-xs" 
                    : "bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-800/70 opacity-75"
                )}
              >
                {isEarned && (
                  <div className="absolute top-3 left-3">
                    <div className="bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 p-1 rounded-lg">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                )}
                
                <div className="flex items-start gap-3.5">
                  <div className={cn(
                    "p-3 rounded-xl shrink-0 transition-colors",
                    isEarned
                      ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                  )}>
                    {isEarned ? <IconComponent className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                  </div>
                  
                  <div className="flex-1 space-y-1 min-w-0 pr-1">
                    <h3 className={cn(
                      "font-black text-sm truncate",
                      isEarned ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"
                    )}>
                      {achievement.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                      {achievement.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className={cn(
                      "font-mono tabular-nums",
                      isEarned ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500"
                    )}>
                      {achievement.progress} / {achievement.target}
                    </span>
                    <span className="text-slate-400 font-mono">{progressPercent}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        isEarned 
                          ? "bg-gradient-to-l from-emerald-500 to-teal-500" 
                          : "bg-slate-400 dark:bg-slate-600"
                      )}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
