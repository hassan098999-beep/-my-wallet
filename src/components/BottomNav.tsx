import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ChartPie, History, Settings, Plus } from 'lucide-react';
import { cn } from '../utils';
import { motion } from 'motion/react';

const mainNavItems = [
  { path: '/', name: 'الرئيسية', icon: Home },
  { path: '/analytics', name: 'الإحصائيات', icon: ChartPie },
  { path: '/transactions', name: 'السجل', icon: History },
  { path: '/settings', name: 'الإعدادات', icon: Settings },
];

interface BottomNavProps {
  onAddClick: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ onAddClick }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <div className="w-full pointer-events-auto">
        <nav className="relative flex items-center justify-between px-6 pb-6 pt-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-3xl border-t border-slate-200/50 dark:border-slate-800/50 rounded-t-[2rem] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)]">
          {/* Left Items */}
          <div className="flex items-center gap-1 flex-1 justify-around">
            {mainNavItems.slice(0, 2).map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
          </div>

          {/* Central Add Button */}
          <div className="relative -top-8 px-2">
            <motion.button
              whileHover={{ scale: 1.05, rotate: 90 }}
              whileTap={{ scale: 0.95 }}
              onClick={onAddClick}
              className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white shadow-xl shadow-emerald-500/40 flex items-center justify-center border-4 border-white dark:border-slate-900 transition-all duration-300"
            >
              <Plus size={28} strokeWidth={3} />
            </motion.button>
          </div>

          {/* Right Items */}
          <div className="flex items-center gap-1 flex-1 justify-around">
            {mainNavItems.slice(2).map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
};

const springConfig = { type: "spring", stiffness: 300, damping: 25, mass: 0.8 };

const NavItem = ({ item }: { item: typeof mainNavItems[0] }) => (
  <NavLink
    to={item.path}
    className={({ isActive }) =>
      cn(
        "relative flex flex-col items-center justify-center p-2 w-16 h-14 transition-all duration-300",
        isActive
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-slate-400 hover:text-slate-800 dark:text-slate-500 dark:hover:text-slate-300"
      )
    }
  >
    {({ isActive }) => (
      <>
        {isActive && (
          <motion.div
            layoutId="activeNavBg"
            className="absolute inset-0 bg-gradient-to-b from-emerald-50/90 to-emerald-100/50 dark:from-emerald-500/15 dark:to-emerald-500/5 rounded-2xl -z-10 shadow-[0_4px_15px_-3px_rgba(16,185,129,0.15)] dark:shadow-[0_4px_15px_-3px_rgba(16,185,129,0.25)] border border-emerald-100/50 dark:border-emerald-500/20"
            transition={springConfig}
          />
        )}
        <motion.div
          initial={false}
          animate={isActive ? { scale: 1.15, y: -3 } : { scale: 1, y: 0 }}
          whileTap={{ scale: 0.9 }}
          transition={springConfig}
          className="flex flex-col items-center justify-center gap-1"
        >
          <div className={cn(
            "transition-all duration-300 relative flex items-center justify-center",
            isActive ? "text-emerald-600 dark:text-emerald-400 drop-shadow-[0_2px_8px_rgba(16,185,129,0.4)]" : "text-slate-400 dark:text-slate-500"
          )}>
            <item.icon size={isActive ? 24 : 22} strokeWidth={isActive ? 2.5 : 2} className="transition-all duration-300" />
            {isActive && (
              <motion.div 
                layoutId="activeIndicator"
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-emerald-500 dark:bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]"
                transition={springConfig}
              />
            )}
          </div>
          <span className={cn(
            "text-[9px] font-bold uppercase tracking-tight transition-all duration-300",
            isActive ? "opacity-100 text-emerald-700 dark:text-emerald-300 mt-0.5" : "opacity-70"
          )}>
            {item.name}
          </span>
        </motion.div>
      </>
    )}
  </NavLink>
);

export default BottomNav;
