import React from 'react';
import { motion } from 'motion/react';
import { Wallet, Sparkles, TrendingUp, PieChart } from 'lucide-react';
import { cn } from '../utils';

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center z-[9999] overflow-hidden">
      {/* Background atmospheric effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]">
          <div className="absolute inset-0 bg-slate-50 dark:bg-slate-950 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,transparent_20%,#000_100%)]"></div>
        </div>

        {/* Floating background particles */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: Math.random() * 0.5 + 0.1,
              scale: Math.random() * 0.5 + 0.5,
            }}
            animate={{
              y: [null, Math.random() * window.innerHeight * 0.2 - window.innerHeight * 0.1],
              x: [null, Math.random() * window.innerWidth * 0.2 - window.innerWidth * 0.1],
              opacity: [null, Math.random() * 0.5 + 0.1, Math.random() * 0.2],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'linear',
            }}
            className={cn(
              "absolute rounded-full filter blur-[1px]",
              i % 3 === 0 ? "bg-emerald-500/20 w-3 h-3" : 
              i % 3 === 1 ? "bg-blue-500/20 w-4 h-4" : 
              "bg-purple-500/20 w-2 h-2"
            )}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`
            }}
          />
        ))}

        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.3, 0.15],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 -left-1/4 w-[40rem] h-[40rem] bg-emerald-500/20 rounded-full blur-[100px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.15, 0.3, 0.15],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-1/4 -right-1/4 w-[40rem] h-[40rem] bg-blue-500/20 rounded-full blur-[100px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.4, 1],
            opacity: [0.1, 0.25, 0.1],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-purple-500/10 rounded-full blur-[120px]" 
        />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Animated Icons Container */}
        <div className="relative w-32 h-32 flex items-center justify-center mb-8">
          <motion.div
            initial={{ scale: 0, rotate: -180, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 0.2 }}
            transition={{ type: "spring", damping: 20, stiffness: 100, duration: 1.5 }}
            className="absolute inset-0 bg-gradient-to-tr from-emerald-500 via-blue-500 to-purple-500 rounded-3xl shadow-2xl shadow-emerald-500/30 animate-pulse"
          />
          
          <motion.div
            initial={{ y: 30, opacity: 0, scale: 0.8 }}
            animate={{ 
              y: [0, -8, 0], 
              opacity: 1, 
              scale: 1,
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 6, repeat: Infinity, ease: "easeInOut" },
              opacity: { delay: 0.3, duration: 0.5 },
              scale: { delay: 0.3, type: "spring", damping: 15, stiffness: 150 }
            }}
            className="relative bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 z-20 overflow-hidden group"
          >
            <motion.div
              animate={{ 
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 opacity-10 bg-[length:200%_200%] bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500"
            />
            <Wallet className="size-12 text-emerald-500 relative z-10 drop-shadow-md" />
          </motion.div>

          {/* Orbiting elements */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, rotate: 360 }}
            transition={{ 
              opacity: { delay: 0.6, duration: 1 },
              rotate: { duration: 12, repeat: Infinity, ease: "linear" } 
            }}
            className="absolute inset-0 z-10"
          >
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 p-2 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700"
            >
              <Sparkles className="size-5 text-purple-500 drop-shadow-sm" />
            </motion.div>
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 p-2 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700"
            >
              <TrendingUp className="size-5 text-emerald-500 drop-shadow-sm" />
            </motion.div>
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              className="absolute top-1/2 -right-3 -translate-y-1/2 bg-white dark:bg-slate-800 p-2 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700"
            >
              <PieChart className="size-5 text-blue-500 drop-shadow-sm" />
            </motion.div>
          </motion.div>
        </div>
        
        {/* Text content */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
          className="text-center space-y-3"
        >
          <motion.h1 
            className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500"
            animate={{ 
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
            style={{ backgroundSize: '200% auto' }}
          >
            مصاريفي
          </motion.h1>
          
          <div className="flex flex-col items-center gap-3">
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest"
            >
              إدارة مالية ذكية
            </motion.p>
            
            {/* Loading dots */}
            <div className="flex gap-2 mt-2">
              {[
                { color: 'bg-emerald-500', delay: 0 },
                { color: 'bg-blue-500', delay: 0.2 },
                { color: 'bg-purple-500', delay: 0.4 }
              ].map((dot, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ 
                    opacity: [0.3, 1, 0.3],
                    y: [0, -5, 0],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ 
                    opacity: { duration: 1.2, repeat: Infinity, delay: 1 + dot.delay, ease: "easeInOut" },
                    y: { duration: 1.2, repeat: Infinity, delay: 1 + dot.delay, ease: "easeInOut" },
                    scale: { duration: 1.2, repeat: Infinity, delay: 1 + dot.delay, ease: "easeInOut" }
                  }}
                  className={`w-2.5 h-2.5 rounded-full ${dot.color}`}
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
