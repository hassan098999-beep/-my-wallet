import React from 'react';
import { motion } from 'motion/react';
import { Wallet, Sparkles, TrendingUp } from 'lucide-react';

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center z-[9999] overflow-hidden">
      {/* Background atmospheric effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 -left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.5, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-[100px]" 
        />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Animated Icons Container */}
        <div className="relative w-32 h-32 flex items-center justify-center mb-8">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 15, stiffness: 100 }}
            className="absolute inset-0 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-3xl shadow-xl shadow-emerald-500/30 opacity-20 animate-pulse"
          />
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="relative bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 z-20"
          >
            <Wallet className="size-12 text-emerald-500" />
          </motion.div>

          {/* Orbiting elements */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 z-10"
          >
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 p-1.5 rounded-full shadow-md border border-slate-100 dark:border-slate-700">
              <Sparkles className="size-4 text-amber-500" />
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 p-1.5 rounded-full shadow-md border border-slate-100 dark:border-slate-700">
              <TrendingUp className="size-4 text-blue-500" />
            </div>
          </motion.div>
        </div>
        
        {/* Text content */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center space-y-3"
        >
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            مصاريفي
          </h1>
          
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">
              إدارة مالية ذكية
            </p>
            
            {/* Loading dots */}
            <div className="flex gap-1.5 mt-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 1, 0.3]
                  }}
                  transition={{ 
                    duration: 1, 
                    repeat: Infinity, 
                    delay: i * 0.2 
                  }}
                  className="w-2 h-2 rounded-full bg-emerald-500"
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoadingScreen;
