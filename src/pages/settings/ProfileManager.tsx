import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../store/AppContext';
import { 
  UserCircle, 
  Save, 
  Trophy, 
  Medal, 
  Target, 
  Flame, 
  Layers, 
  PlusCircle, 
  ShieldCheck, 
  PenTool, 
  CircleCheckBig,
  CheckCircle2,
  LayoutGrid,
  Zap,
  CalendarClock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';
import { hapticFeedback, cn } from '../../utils';

const iconMap: Record<string, any> = {
  PlusCircle,
  Target,
  ShieldCheck,
  PenTool,
  Layers,
  CircleCheckBig,
  Flame,
  CheckCircle2,
  LayoutGrid,
  Zap,
  CalendarClock,
  Trophy,
};

const ProfileManager = () => {
  const { userName, setUserName, dailyBudget, setDailyBudget, achievements, currency, rollingBudgetEnabled, setRollingBudgetEnabled } = useAppContext();
  const [name, setName] = useState(userName || '');
  const [budget, setBudget] = useState(dailyBudget?.toString() || '14');

  useEffect(() => {
    setName(userName || '');
  }, [userName]);

  useEffect(() => {
    setBudget(dailyBudget?.toString() || '14');
  }, [dailyBudget]);

  const handleSave = () => {
    if (!name.trim()) {
      hapticFeedback('warning');
      toast.error('الرجاء إدخال اسم صحيح');
      return;
    }

    const budgetNum = parseFloat(budget);
    if (isNaN(budgetNum) || budgetNum <= 0) {
      hapticFeedback('warning');
      toast.error('الرجاء إدخال ميزانية يومية صحيحة');
      return;
    }

    hapticFeedback('success');
    setUserName(name.trim());
    setDailyBudget(budgetNum);
    toast.success('تم حفظ الإعدادات بنجاح');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3 md:space-y-4"
    >
      <div className="glass-card p-3 md:p-5 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <motion.div 
            whileHover={{ rotate: 15 }}
            className="w-9 h-9 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500"
          >
            <UserCircle className="size-4" />
          </motion.div>
          <div>
            <h2 className="text-base md:text-lg font-black text-slate-900 dark:text-white tracking-tight">الملف الشخصي</h2>
            <p className="text-[9px] text-slate-500 font-medium">تخصيص معلوماتك الشخصية</p>
          </div>
        </div>

        <div className="space-y-3 md:space-y-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">
              الاسم
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="أدخل اسمك هنا..."
              className="w-full px-3 py-2.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-bold text-xs md:text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">
              الميزانية اليومية المستهدفة ({currency})
            </label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="مثلاً: 14"
              className="w-full px-3 py-2.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-bold text-xs md:text-sm"
            />
            <p className="text-[8px] text-slate-400 px-1">هذه الميزانية ستستخدم لتتبع صرفك اليومي وتنبيهك عند الاقتراب من الحد.</p>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
              <div className="space-y-0.5">
                <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">الميزانية المتدحرجة</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[200px]">
                  ترحيل الميزانية غير المستخدمة من الأيام السابقة إلى اليوم التالي تلقائياً.
                </p>
              </div>
              <button
                onClick={() => {
                  hapticFeedback('light');
                  setRollingBudgetEnabled(!rollingBudgetEnabled);
                }}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
                  rollingBudgetEnabled ? "bg-primary-600" : "bg-slate-300 dark:bg-slate-700"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    rollingBudgetEnabled ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl md:rounded-2xl font-black text-sm uppercase tracking-widest bg-primary-600 text-white hover:bg-primary-700 shadow-md shadow-primary-500/20 transition-all"
          >
            <Save className="size-4" />
            حفظ التغييرات
          </motion.button>
        </div>
      </div>

      <div className="glass-card p-3 md:p-5 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <motion.div 
            whileHover={{ rotate: 15 }}
            className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500"
          >
            <Trophy className="size-4" />
          </motion.div>
          <div>
            <h2 className="text-base md:text-lg font-black text-slate-900 dark:text-white tracking-tight">الإنجازات</h2>
            <p className="text-[9px] text-slate-500 font-medium">تتبع تقدمك المالي</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {achievements.map((achievement) => {
            const Icon = iconMap[achievement.icon] || Medal;
            const isUnlocked = !!achievement.earnedAt || achievement.progress >= achievement.target;
            const percentage = Math.min(100, (achievement.progress / (achievement.target || 1)) * 100);
            
            return (
               <motion.div
                 key={achievement.id}
                 whileHover={{ scale: 1.02, y: -4 }}
                 className={cn(
                   "p-5 rounded-3xl border transition-all duration-300 relative overflow-hidden group",
                   isUnlocked 
                     ? "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 border-amber-200 dark:border-amber-700/50 shadow-sm" 
                     : "bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 opacity-90"
                 )}
               >
                 {/* Shimmer effect for unlocked achievements */}
                 {isUnlocked && (
                   <motion.div 
                     initial={{ x: '-150%' }}
                     animate={{ x: '250%' }}
                     transition={{ repeat: Infinity, duration: 2.5, ease: 'linear', repeatDelay: 3 }}
                     className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent -skew-x-12 z-0 pointer-events-none" 
                   />
                 )}

                 <div className="flex flex-col gap-4 relative z-10">
                   <div className="flex items-start gap-4">
                     <div className={cn(
                       "w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center transition-all shadow-inner",
                       isUnlocked 
                         ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-amber-500/30 group-hover:rotate-12 group-hover:scale-110" 
                         : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                     )}>
                       <Icon className={cn("size-7 transition-all", !isUnlocked && "grayscale opacity-50", isUnlocked && "drop-shadow-md")} />
                     </div>
                     <div className="flex-1 min-w-0 pt-0.5">
                       <div className="flex items-center justify-between gap-2 mb-1">
                         <h3 className={cn(
                           "text-sm md:text-base font-black tracking-tight truncate",
                           isUnlocked ? "text-slate-900 dark:text-white" : "text-slate-500"
                         )}>
                           {achievement.title}
                         </h3>
                         {isUnlocked && (
                           <span className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-black text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2 py-1 rounded-full uppercase tracking-widest shrink-0">
                             <Trophy className="size-3" />
                             مكتمل
                           </span>
                         )}
                       </div>
                       <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
                         {achievement.description}
                       </p>
                     </div>
                   </div>
                   
                   {/* Progress Section */}
                   <div className="space-y-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                     <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                       <span className={isUnlocked ? "text-amber-700 dark:text-amber-500" : "text-slate-400"}>
                         {isUnlocked ? 'مكتمل بنسبة 100%' : 'التقدم'}
                       </span>
                       <span className={cn("px-2.5 py-1 rounded-lg text-[10px] font-black", isUnlocked ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" : "bg-slate-200 dark:bg-slate-800 text-slate-500")}>
                         {isUnlocked ? `${achievement.target}/${achievement.target}` : `${achievement.progress}/${achievement.target}`}
                       </span>
                     </div>
                     <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                       <motion.div 
                         initial={{ width: 0 }}
                         whileInView={{ width: `${isUnlocked ? 100 : percentage}%` }}
                         viewport={{ once: true }}
                         transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                         className={cn(
                           "h-full rounded-full relative overflow-hidden",
                           isUnlocked ? "bg-gradient-to-r from-amber-400 to-orange-500" : "bg-slate-400"
                         )}
                       >
                         {isUnlocked && (
                           <motion.div 
                             animate={{ x: ['-100%', '200%'] }}
                             transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                             className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12"
                           />
                         )}
                       </motion.div>
                     </div>
                   </div>
                 </div>
               </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileManager;
