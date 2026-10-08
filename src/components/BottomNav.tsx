import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ChartPie, PiggyBank, Baby, Plus } from 'lucide-react';
import { cn, hapticFeedback } from '../utils';
import { motion } from 'motion/react';

const mainNavItems = [
  { path: '/', name: 'الرئيسية', icon: Home },
  { path: '/budget', name: 'الميزانية', icon: ChartPie },
  { path: '/savings', name: 'الادخار', icon: PiggyBank },
  { path: '/family', name: 'العائلة', icon: Baby },
];

interface BottomNavProps {
  onAddClick: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ onAddClick }) => {
  const handleAddClick = () => {
    hapticFeedback('medium');
    onAddClick();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none flex justify-center font-tajawal">
      <div className="w-full max-w-[26rem] pointer-events-auto">
        <nav className="relative flex items-center justify-between px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 bg-white/95 dark:bg-[#0c121e]/95 backdrop-blur-2xl border-t border-x border-slate-200/80 dark:border-slate-800/80 rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.35)]">
          {/* Left Items */}
          <div className="flex items-center gap-1 flex-1 justify-around">
            {mainNavItems.slice(0, 2).map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
          </div>

          {/* Central Add Button Area */}
          <div className="relative -top-5 px-2 flex items-center">
            <motion.button
              aria-label="إضافة عملية جديدة"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddClick}
              className="w-13 h-13 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center border-4 border-white dark:border-[#0c121e] transition-all cursor-pointer"
            >
              <Plus size={24} strokeWidth={2.75} />
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

const springConfig = { type: "spring" as const, stiffness: 300, damping: 25, mass: 0.8 };

const NavItem = ({ item }: { item: typeof mainNavItems[0] }) => {
  const handleNavClick = () => {
    hapticFeedback('light');
  };

  return (
    <NavLink
      to={item.path}
      aria-label={item.name}
      onClick={handleNavClick}
      className={({ isActive }) =>
        cn(
          "relative flex flex-col items-center justify-center p-1.5 w-14 h-12 transition-all duration-300",
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
              className="absolute inset-0 bg-emerald-50/90 dark:bg-emerald-500/15 rounded-2xl -z-10 border border-emerald-100/50 dark:border-emerald-500/20"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                boxShadow: "0 4px 20px -2px rgba(16, 185, 129, 0.4)"
              }}
              transition={springConfig}
            />
          )}
          <motion.div
            initial={false}
            animate={isActive ? { scale: 1.15, y: -4 } : { scale: 1, y: 0 }}
            whileTap={{ scale: 0.9 }}
            transition={springConfig}
            className="flex flex-col items-center justify-center gap-1"
          >
            <div className={cn(
              "transition-all duration-300 relative flex items-center justify-center",
              isActive ? "text-emerald-600 dark:text-emerald-400 drop-shadow-[0_2px_8px_rgba(16,185,129,0.5)]" : "text-slate-400 dark:text-slate-500"
            )}>
              <item.icon size={isActive ? 24 : 22} strokeWidth={isActive ? 2.5 : 2} className="transition-all duration-300" />
            </div>
            <span className={cn(
              "text-[10px] font-semibold transition-all duration-300",
              isActive ? "opacity-100 text-emerald-700 dark:text-emerald-300 mt-0.5" : "opacity-70"
            )}>
              {item.name}
            </span>
          </motion.div>
        </>
      )}
    </NavLink>
  );
};

export default BottomNav;
