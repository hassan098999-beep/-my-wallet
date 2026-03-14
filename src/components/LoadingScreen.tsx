import React from 'react';
import { motion } from 'motion/react';
import { Activity } from 'lucide-react';

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center z-[9999]">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
        className="relative"
      >
        <div className="w-20 h-20 rounded-3xl bg-primary-500/10 flex items-center justify-center">
          <Activity className="size-10 text-primary-500" />
        </div>
        <div className="absolute -inset-4 border-2 border-primary-500/20 rounded-[2.5rem] animate-ping" />
      </motion.div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-8 text-center"
      >
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">جاري التحميل...</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-bold mt-1 uppercase tracking-widest">مصاريفي - إدارة مالية ذكية</p>
      </motion.div>
    </div>
  );
};

export default LoadingScreen;
