import React from 'react';
import { motion, Variants } from 'motion/react';
import { Zap, PiggyBank, Activity } from 'lucide-react';
import { cn, hapticFeedback, safeStorage } from '../../utils';

export type DashboardTab = 'daily' | 'vaults' | 'insights';

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
    { id: 'daily' as const, label: 'ميزانية اليوم ⚡', shortLabel: 'اليوم', icon: <Zap size={14} className="text-amber-500" /> },
    { id: 'vaults' as const, label: 'الخزائن والحصالة 💳', shortLabel: 'الخزائن', icon: <PiggyBank size={14} className="text-emerald-500" /> },
    { id: 'insights' as const, label: 'الذكاء والتحليل 📊', shortLabel: 'التحليل', icon: <Activity size={14} className="text-indigo-500" /> },
  ];

  return (
    <motion.div 
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className="flex p-1 bg-slate-200/60 dark:bg-slate-900/80 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 w-full max-w-4xl mx-auto transition-all text-right select-none font-tajawal"
      dir="rtl"
    >
      {tabs.map((tab) => {
        const isActive = activeDashboardTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => {
              hapticFeedback('light');
              setActiveDashboardTab(tab.id);
              safeStorage.setItem('dashboard_active_tab', tab.id);
            }}
            className={cn(
              "flex-1 relative flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-colors cursor-pointer z-10",
              isActive 
                ? "text-slate-900 dark:text-white" 
                : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="activeDashboardTabPill"
                className="absolute inset-0 bg-white dark:bg-slate-800 rounded-xl shadow-xs border border-slate-200/60 dark:border-slate-700/60 -z-10"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.shortLabel}</span>
          </button>
        );
      })}
    </motion.div>
  );
};
