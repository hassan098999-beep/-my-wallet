import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, hapticFeedback } from '../utils';
import { Layers, Wallet, Database, Sparkles, UserCircle, ChevronLeft } from 'lucide-react';
import CategoryManager from './settings/CategoryManager';
import AccountManager from './settings/AccountManager';
import DataManager from './settings/DataManager';
import AIManager from './settings/AIManager';
import ProfileManager from './settings/ProfileManager';

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.6,
      staggerChildren: 0.1
    }
  }
};

const TABS = [
  { id: 'profile', name: 'الملف الشخصي', icon: UserCircle, description: 'إدارة بياناتك الشخصية' },
  { id: 'categories', name: 'الفئات', icon: Layers, description: 'تخصيص فئات المصاريف والدخل' },
  { id: 'accounts', name: 'الحسابات', icon: Wallet, description: 'إدارة حساباتك المالية' },
  { id: 'data', name: 'البيانات', icon: Database, description: 'النسخ الاحتياطي والتصدير' },
  { id: 'ai', name: 'الذكاء الاصطناعي', icon: Sparkles, description: 'إعدادات المساعد الذكي' },
] as const;

type TabId = typeof TABS[number]['id'];

const Settings = () => {
  const [activeTab, setActiveTab] = useState<TabId>('profile');

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto pb-12 px-2 md:px-4"
    >
      <div className="mb-6 md:mb-8 px-2 md:px-0">
        <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          الإعدادات <span className="text-primary-500">والتخصيص</span>
        </h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
          إدارة حسابك، الفئات، البيانات، والذكاء الاصطناعي
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
        {/* Sidebar / Topbar */}
        <div className="w-full md:w-64 lg:w-72 shrink-0">
          <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-visible pb-4 md:pb-0 px-2 md:px-0 no-scrollbar snap-x">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    hapticFeedback('light');
                    setActiveTab(tab.id);
                  }}
                  className={cn(
                    "snap-start shrink-0 flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-2xl transition-all text-right group relative overflow-hidden border-2",
                    isActive 
                      ? "bg-white dark:bg-slate-800 border-primary-500/30 shadow-lg shadow-primary-500/5" 
                      : "bg-slate-50 dark:bg-slate-800/40 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700"
                  )}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="activeTabIndicator"
                      className="absolute right-0 top-0 bottom-0 w-1 bg-primary-500 rounded-l-full hidden md:block"
                    />
                  )}
                  
                  <div className={cn(
                    "w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-colors shrink-0",
                    isActive 
                      ? "bg-primary-500 text-white shadow-md shadow-primary-500/20" 
                      : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 group-hover:text-primary-500 shadow-sm"
                  )}>
                    <tab.icon size={20} className="md:w-6 md:h-6" />
                  </div>
                  
                  <div className="flex flex-col items-start pr-1">
                    <span className={cn(
                      "text-xs md:text-sm font-black tracking-tight transition-colors whitespace-nowrap",
                      isActive ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"
                    )}>
                      {tab.name}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 hidden md:block">
                      {tab.description}
                    </span>
                  </div>

                  <ChevronLeft 
                    size={16} 
                    className={cn(
                      "mr-auto transition-transform hidden md:block",
                      isActive ? "text-primary-500 translate-x-1" : "text-slate-300 dark:text-slate-600 group-hover:text-slate-400"
                    )} 
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 w-full min-w-0 bg-white dark:bg-slate-900 rounded-[2rem] p-4 md:p-6 lg:p-8 shadow-xl border border-slate-100 dark:border-slate-800/60">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {activeTab === 'profile' && <ProfileManager />}
              {activeTab === 'categories' && <CategoryManager />}
              {activeTab === 'accounts' && <AccountManager />}
              {activeTab === 'data' && <DataManager />}
              {activeTab === 'ai' && <AIManager />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default Settings;
