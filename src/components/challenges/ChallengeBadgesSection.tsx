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
  CheckCircle2,
  Sandwich,
  TrendingUp,
  Footprints,
  FileCheck,
  Zap,
  Soup,
  Sparkles,
  Crown
} from 'lucide-react';
import { WeeklyChallengeBadge, ChallengeUserLevel } from '../../types';
import { USER_LEVELS } from '../../hooks/useWeeklyChallenges';
import { cn } from '../../utils';

interface ChallengeBadgesSectionProps {
  badges: WeeklyChallengeBadge[];
  currentLevel?: ChallengeUserLevel;
}

export const ChallengeBadgesSection: React.FC<ChallengeBadgesSectionProps> = ({ badges, currentLevel }) => {
  const renderBadgeIcon = (iconName: string, unlocked: boolean) => {
    const props = { size: 24, className: unlocked ? 'text-current' : 'text-slate-400' };
    switch (iconName) {
      case 'Coffee': return <Coffee {...props} />;
      case 'ShieldCheck': return <ShieldCheck {...props} />;
      case 'Sandwich': return <Sandwich {...props} />;
      case 'UtensilsCrossed': return <UtensilsCrossed {...props} />;
      case 'TrendingUp': return <TrendingUp {...props} />;
      case 'Footprints': return <Footprints {...props} />;
      case 'ShoppingBag': return <ShoppingBag {...props} />;
      case 'FileCheck': return <FileCheck {...props} />;
      case 'Flame': return <Flame {...props} />;
      case 'Zap': return <Zap {...props} />;
      case 'PiggyBank': return <PiggyBank {...props} />;
      case 'Soup': return <Soup {...props} />;
      case 'Trophy': return <Trophy {...props} />;
      default: return <Award {...props} />;
    }
  };

  const unlockedCount = badges.filter(b => b.unlocked).length;

  return (
    <div className="space-y-6">
      {/* 1. Badges Showcase */}
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
                أكمل التحديات الأسبوعية لفتح شارات التميز المالي وجمع النقاط
              </p>
            </div>
          </div>

          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-xl border border-emerald-500/20">
            {unlockedCount} من {badges.length} أوسمة مكتسبة 🎖️
          </span>
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
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

                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium line-clamp-2 leading-relaxed">
                  {badge.description}
                </p>

                {badge.unlocked && (
                  <div className="mt-2 flex items-center gap-1 text-[9px] font-black text-emerald-600 dark:text-emerald-400">
                    <Sparkles size={10} />
                    <span>تم الفتح 🎉</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 2. User Level Ladder Showcase */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
            <Crown size={18} />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              سلم الرتب والمستويات المالية 👑
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              ارتقِ من رتبة إلى أخرى بجمع نقاط الخبرة (XP) عبر إنجاز التحديات
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {USER_LEVELS.map((lvl) => {
            const isReached = currentLevel ? currentLevel.level >= lvl.level : lvl.level === 1;
            const isCurrent = currentLevel?.level === lvl.level;

            return (
              <div
                key={lvl.level}
                className={cn(
                  "p-3.5 rounded-2xl border transition-all relative overflow-hidden",
                  isCurrent
                    ? "border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-xs ring-2 ring-emerald-500/30"
                    : isReached
                      ? "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                      : "border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 opacity-60"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase text-slate-400">
                    المستوى {lvl.level}
                  </span>
                  {isCurrent ? (
                    <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse">
                      رتبتك الحالية ✨
                    </span>
                  ) : isReached ? (
                    <CheckCircle2 size={13} className="text-emerald-500" />
                  ) : (
                    <Lock size={12} className="text-slate-400" />
                  )}
                </div>

                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{lvl.title.split(' ').pop() || '🌱'}</span>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">
                    {lvl.title}
                  </h4>
                </div>

                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mb-2 leading-relaxed">
                  {lvl.perk}
                </p>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400 flex items-center justify-between">
                  <span>النقاط المطلوبة:</span>
                  <span className="text-slate-700 dark:text-slate-300 font-black">
                    {lvl.minPoints}+ XP
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
