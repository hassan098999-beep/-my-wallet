import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, List, PieChart, Wallet, Trophy } from 'lucide-react';
import { cn } from '../utils';

const mainNavItems = [
  { path: '/', name: 'الرئيسية', icon: LayoutDashboard },
  { path: '/transactions', name: 'العمليات', icon: List },
  { path: '/add', name: 'إضافة', icon: PlusCircle, isFab: true },
  { path: '/analytics', name: 'الإحصائيات', icon: PieChart },
  { path: '/income', name: 'الدخل', icon: Wallet },
];

interface BottomNavProps {
  onAddClick: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ onAddClick }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-t border-slate-200/50 dark:border-slate-800/50 pb-safe">
      <nav className="flex items-center justify-around px-2 py-2 max-w-md mx-auto">
        {mainNavItems.map((item) => {
          if (item.isFab) {
            return (
              <button
                key={item.path}
                onClick={onAddClick}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-500/30 active:scale-90 transition-all hover:rotate-6"
              >
                <item.icon size={22} />
              </button>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center p-1.5 gap-1 transition-all duration-300",
                  isActive
                    ? "text-indigo-600 dark:text-indigo-400 scale-110"
                    : "text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-slate-200"
                )
              }
            >
              <item.icon size={18} className={cn("transition-transform", "duration-300")} />
              <span className="text-[9px] font-black uppercase tracking-tighter">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNav;
