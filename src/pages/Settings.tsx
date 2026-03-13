import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils';
import { Layers, Wallet, Database } from 'lucide-react';
import CategoryManager from '../components/settings/CategoryManager';
import AccountManager from '../components/settings/AccountManager';
import DataManager from '../components/settings/DataManager';

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

const Settings = () => {
  const [activeTab, setActiveTab] = useState<'categories' | 'accounts' | 'data'>('categories');

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 md:space-y-6 max-w-5xl mx-auto pb-12 px-2"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
        <div className="space-y-0.5">
          <h1 className="text-lg md:text-xl font-black tracking-tight text-slate-900 dark:text-white">
            الإعدادات <span className="text-primary-500">والتخصيص</span>
          </h1>
          <p className="text-[9px] md:text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            إدارة الفئات، الحسابات، والبيانات في مكان واحد
          </p>
        </div>
      </div>

      <div className="flex p-1 md:p-1.5 bg-slate-100 dark:bg-slate-900/80 rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-800 w-fit gap-1 md:gap-1.5 shadow-inner">
        {[
          { id: 'categories', name: 'الفئات', icon: Layers },
          { id: 'accounts', name: 'الحسابات', icon: Wallet },
          { id: 'data', name: 'البيانات', icon: Database },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[9px] md:text-xs font-black transition-all uppercase tracking-widest",
              activeTab === tab.id 
                ? "bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 shadow-md" 
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50"
            )}
          >
            <tab.icon className={cn("size-3 md:size-4", activeTab === tab.id ? "text-primary-500" : "")} />
            {tab.name}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'categories' && <CategoryManager />}
          {activeTab === 'accounts' && <AccountManager />}
          {activeTab === 'data' && <DataManager />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default Settings;
