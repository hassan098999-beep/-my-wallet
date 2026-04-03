import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../store/AppContext';
import { UserCircle, Save, Trophy, Medal, Target, Flame, Layers, PlusCircle, ShieldCheck, PenTool, CircleCheckBig } from 'lucide-react';
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
      className="space-y-4 md:space-y-6"
    >
      <div className="glass-card p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <motion.div 
            whileHover={{ rotate: 15 }}
            className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500"
          >
            <UserCircle className="size-5" />
          </motion.div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">الملف الشخصي</h2>
            <p className="text-[10px] text-slate-500 font-medium">تخصيص معلوماتك الشخصية</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">
              الاسم
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="أدخل اسمك هنا..."
              className="w-full px-4 py-3 rounded-xl md:rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-bold text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">
              الميزانية اليومية المستهدفة ({currency})
            </label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="مثلاً: 14"
              className="w-full px-4 py-3 rounded-xl md:rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-bold text-sm"
            />
            <p className="text-[9px] text-slate-400 px-1">هذه الميزانية ستستخدم لتتبع صرفك اليومي وتنبيهك عند الاقتراب من الحد.</p>
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

      <div className="glass-card p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <motion.div 
            whileHover={{ rotate: 15 }}
            className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500"
          >
            <Trophy className="size-5" />
          </motion.div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">الإنجازات</h2>
            <p className="text-[10px] text-slate-500 font-medium">تتبع تقدمك المالي</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {achievements?.map((achievement, index) => {
            const Icon = iconMap[achievement.icon] || Medal;
            const isEarned = achievement.progress >= achievement.target;
            const progressPercent = Math.min(100, Math.round((achievement.progress / achievement.target) * 100));

            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`relative overflow-hidden p-4 rounded-2xl border ${
                  isEarned 
                    ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800/50' 
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-4 relative z-10">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                    isEarned 
                      ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30' 
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                  }`}>
                    <Icon className="size-6" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h3 className={`font-black text-sm ${isEarned ? 'text-amber-900 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>
                      {achievement.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                      {achievement.description}
                    </p>
                    
                    <div className="pt-2">
                      <div className="flex justify-between text-[10px] font-bold mb-1">
                        <span className={isEarned ? 'text-amber-700 dark:text-amber-500' : 'text-slate-500'}>
                          {isEarned ? 'مكتمل' : `${progressPercent}%`}
                        </span>
                        <span className="text-slate-400">
                          {achievement.progress} / {achievement.target}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercent}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-full rounded-full ${
                            isEarned ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-slate-400 dark:bg-slate-500'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {isEarned && (
                  <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none">
                    <Icon className="size-32 text-amber-500" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileManager;
