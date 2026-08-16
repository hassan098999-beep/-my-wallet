import React from 'react';
import { motion } from 'motion/react';
import { 
  Award, 
  Coffee, 
  ShieldCheck, 
  UtensilsCrossed, 
  ShoppingBag, 
  Flame, 
  PiggyBank, 
  Trophy, 
  Lock, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { WeeklyChallengeBadge } from '../../types';
import { cn } from '../../utils';

interface ChallengeBadgesSectionProps {
  badges: WeeklyChallengeBadge[];
}

export const ChallengeBadgesSection: React.FC<ChallengeBadgesSectionProps> = ({ badges }) => {
  const renderBadgeIcon = (iconName: string, unlocked: boolean) => {
    const props = { size: 24, className: unlocked ? 'text-current' : 'text-slate-400' };
    switch (iconName) {
      case 'Coffee': return <Coffee {...props} />;
      case 'ShieldCheck': return <ShieldCheck {...props} />;
      case 'UtensilsCrossed': return <UtensilsCrossed {...props} />;
      case 'ShoppingBag': return <ShoppingBag {...props} />;
      case 'Flame': return <Flame {...props} />;
      case 'PiggyBank': return <PiggyBank {...props} />;
      case 'Trophy': return <Trophy {...props} />;
      default: return <Award {...props} />;
    }
  };

  const unlockedCount = badges.filter(b => b.unlocked).length;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Award size={18} />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              خزانة الأوسمة والشارات الأسبوعية
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              أكمل التحديات الأسبوعية لفتح شارات التميز المالي
            </p>
          </div>
        </div>

        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-xl border border-emerald-500/20">
          {unlockedCount} من {badges.length} أوسمة مكتسبة 🎖️
        </span>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {badges.map((badge) => {
          return (
            <motion.div
              key={badge.id}
              whileHover={{ y: -3 }}
              className={cn(
                "p-3 rounded-2xl border flex flex-col items-center text-center relative overflow-hidden transition-all",
                badge.unlocked
                  ? `${badge.bgColor} ${badge.borderColor} shadow-xs ring-1 ring-amber-400/20`
                  : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 opacity-60 grayscale hover:grayscale-0 hover:opacity-90"
              )}
            >
              {/* Top Lock or Check Badge */}
              <div className="absolute top-2 right-2">
                {badge.unlocked ? (
                  <CheckCircle2 size={13} className="text-emerald-500" />
                ) : (
                  <Lock size={11} className="text-slate-400" />
                )}
              </div>

              {/* Badge Icon Circle */}
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center mb-2.5 transition-transform",
                badge.unlocked
                  ? "bg-white dark:bg-slate-800 shadow-md scale-105"
                  : "bg-slate-200 dark:bg-slate-700"
              )}>
                <div className={badge.unlocked ? badge.color : 'text-slate-400'}>
                  {renderBadgeIcon(badge.icon, badge.unlocked)}
                </div>
              </div>

              <h3 className={cn(
                "font-black text-xs mb-1 line-clamp-1",
                badge.unlocked ? "text-slate-900 dark:text-white" : "text-slate-500"
              )}>
                {badge.title}
              </h3>

              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight line-clamp-2 font-medium">
                {badge.description}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
