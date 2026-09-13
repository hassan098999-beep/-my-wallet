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
    <div className="space-y-6 md:space-y-8 max-w-5xl mx-auto pb-24" dir="rtl">
      {/* Header Profile Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-500/5 dark:via-purple-500/5 dark:to-pink-500/5" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-right">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 border-4 border-white dark:border-slate-900 shadow-xl flex items-center justify-center shrink-0">
            <UserIcon className="w-12 h-12 md:w-16 md:h-16 text-indigo-600 dark:text-indigo-400" />
          </div>
          
          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white">
                {userName || 'المستخدم الحالي'}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium flex items-center justify-center md:justify-start gap-1.5 mt-1">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                مستوى الإنجاز: {progressPercentage}%
              </p>
            </div>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 flex flex-col items-center justify-center min-w-[100px]">
                <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{expenses.length}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">إجمالي العمليات</span>
              </div>
              <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 flex flex-col items-center justify-center min-w-[100px]">
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{earnedCount}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">إنجاز مكتمل</span>
              </div>
              <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 flex flex-col items-center justify-center min-w-[100px]">
                <span className="text-2xl font-black text-purple-600 dark:text-purple-400">{goals.length}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">أهداف مدخرة</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Achievements Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Medal className="w-6 h-6 text-amber-500" />
            الإنجازات المتاحة
          </h2>
          <span className="text-sm font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
            {earnedCount} من {totalCount}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {achievements?.map((achievement, index) => {
            const isEarned = achievement.progress >= achievement.target;
            const IconComponent = iconMap[achievement.icon] || Trophy;
            const progressPercent = Math.min(100, Math.round((achievement.progress / achievement.target) * 100));

            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "relative overflow-hidden p-5 md:p-6 rounded-3xl border-2 transition-all duration-300",
                  isEarned 
                    ? "bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-slate-900 border-indigo-200 dark:border-indigo-800/50 shadow-sm shadow-indigo-500/10" 
                    : "bg-slate-50/50 dark:bg-slate-800/20 border-slate-100 dark:border-slate-800 grayscale-[0.6] opacity-80"
                )}
              >
                {isEarned && (
                  <div className="absolute top-0 right-0 p-3">
                    <div className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 p-1 rounded-full">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                )}
                
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "p-3.5 rounded-2xl shrink-0 transition-colors",
                    isEarned
                      ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                  )}>
                    {isEarned ? <IconComponent className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
                  </div>
                  
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <h3 className={cn(
                      "font-black text-base truncate",
                      isEarned ? "text-slate-800 dark:text-white" : "text-slate-500 dark:text-slate-400"
                    )}>
                      {achievement.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                      {achievement.description}
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className={isEarned ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500"}>
                      {achievement.progress} / {achievement.target}
                    </span>
                    <span className="text-slate-400">{progressPercent}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      className={cn(
                        "h-full rounded-full transition-all duration-1000",
                        isEarned 
                          ? "bg-gradient-to-l from-indigo-500 to-purple-500" 
                          : "bg-slate-400 dark:bg-slate-600"
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
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
