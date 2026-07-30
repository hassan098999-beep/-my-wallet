import React from 'react';
import { motion, Variants } from 'motion/react';
import { Zap, PiggyBank, Target, Activity, Clock } from 'lucide-react';
import { cn, hapticFeedback, safeStorage } from '../../utils';

type DashboardTab = 'daily' | 'vaults' | 'challenges' | 'insights' | 'history';

interface DashboardTabSwitcherProps {
  activeDashboardTab: DashboardTab;
  setActiveDashboardTab: (tab: DashboardTab) => void;
  itemVariants: Variants;
}

export const DashboardTabSwitcher: React.FC<DashboardTabSwitcherProps> = ({
  activeDashboardTab,
  setActiveDashboardTab,
  itemVariants,
}) => {
  const tabs = [
    { id: 'daily' as const, label: 'اليوم والسريع ⚡', icon: <Zap size={14} className="text-amber-500" /> },
    { id: 'vaults' as const, label: 'الخزائن والحصالة 💳', icon: <PiggyBank size={14} className="text-emerald-500" /> },
    { id: 'challenges' as const, label: 'التحديات 🏆', icon: <Target size={14} className="text-rose-500" /> },
    { id: 'insights' as const, label: 'الذكاء والتحليل 📊', icon: <Activity size={14} className="text-indigo-500" /> },
    { id: 'history' as const, label: 'سجل المعاملات 📜', icon: <Clock size={14} className="text-slate-500" /> },
  ];

  return (
    <motion.div 
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className="flex p-1 bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl border border-slate-200/40 dark:border-slate-800/40 w-full max-w-4xl mx-auto transition-all text-right select-none"
      dir="rtl"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => {
            hapticFeedback('light');
            setActiveDashboardTab(tab.id);
            safeStorage.setItem('dashboard_active_tab', tab.id);
          }}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-[11px] md:text-xs font-black transition-all cursor-pointer",
            activeDashboardTab === tab.id 
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs border border-slate-200/5" 
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          )}
        >
          {tab.icon}
          <span className="hidden md:inline">{tab.label}</span>
          <span className="md:hidden">{tab.label.split(' ')[0]}</span>
        </button>
      ))}
    </motion.div>
  );
};
