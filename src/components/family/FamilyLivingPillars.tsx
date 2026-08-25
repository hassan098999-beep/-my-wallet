import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ShoppingCart, Home, Baby, Stethoscope, Coffee, 
  ChevronDown, ChevronUp, AlertCircle, CheckCircle2, 
  Sparkles, Layers
} from 'lucide-react';
import { formatCurrency, cn, hapticFeedback } from '../../utils';
import { Category, Expense } from '../../types';

export interface LivingPillar {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  color: string;
  bgGradient: string;
  textColor: string;
  spent: number;
  budgeted: number;
  categories: { id: string; name: string; spent: number; budgeted: number; color?: string }[];
}

interface FamilyLivingPillarsProps {
  pillars: LivingPillar[];
  currency: string;
  totalLivingSpent: number;
}

export const FamilyLivingPillars: React.FC<FamilyLivingPillarsProps> = ({
  pillars,
  currency,
  totalLivingSpent,
}) => {
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);

  const togglePillar = (id: string) => {
    hapticFeedback('light');
    setExpandedPillar(expandedPillar === id ? null : id);
  };

  return (
    <div className="space-y-4 text-right" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Layers size={18} className="text-emerald-500" />
            <span>أركان قفة المعيشة الأسرية الـ 5</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            توزيع ميزانية البيت ونفقات الأسرة على الركائز الحيوية الخمس لضمان الاستقرار المالي
          </p>
        </div>
        <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl self-start sm:self-auto font-mono">
          إجمالي المنصرف: {formatCurrency(totalLivingSpent, currency)}
        </span>
      </div>

      {/* Grid of 5 pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pillars.map((pillar) => {
          const Icon = pillar.icon;
          const percentage = pillar.budgeted > 0 ? (pillar.spent / pillar.budgeted) * 100 : 0;
          const isOver = pillar.budgeted > 0 && pillar.spent > pillar.budgeted;
          const isExpanded = expandedPillar === pillar.id;
          const shareOfTotal = totalLivingSpent > 0 ? (pillar.spent / totalLivingSpent) * 100 : 0;

          return (
            <motion.div
              key={pillar.id}
              layout
              className={cn(
                "rounded-2xl border p-4 bg-white dark:bg-slate-900 transition-all shadow-2xs hover:shadow-md flex flex-col justify-between",
                isOver ? "border-rose-200 dark:border-rose-900/60 bg-rose-50/10 dark:bg-rose-950/10" : "border-slate-200/80 dark:border-slate-800"
              )}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm", pillar.color)}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">{pillar.title}</h4>
                      <span className="text-[10px] text-slate-400 font-medium block">{pillar.subtitle}</span>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                    {Math.round(shareOfTotal)}% من القفة
                  </span>
                </div>

                {/* Spent & Budgeted */}
                <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block">المصروف الفعلي:</span>
                    <span className="text-sm font-black font-mono text-slate-800 dark:text-slate-100">
                      {formatCurrency(pillar.spent, currency)}
                    </span>
                  </div>

                  <div className="text-left">
                    <span className="text-[10px] text-slate-400 font-bold block">السقف المخصص:</span>
                    <span className="text-xs font-black font-mono text-slate-500 dark:text-slate-400">
                      {pillar.budgeted > 0 ? formatCurrency(pillar.budgeted, currency) : 'غير مقيد'}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className={isOver ? 'text-rose-500' : 'text-slate-400'}>
                      {pillar.budgeted > 0 
                        ? (isOver ? `تجاوز السقف بـ ${formatCurrency(pillar.spent - pillar.budgeted, currency)}` : `المتبقي: ${formatCurrency(pillar.budgeted - pillar.spent, currency)}`)
                        : 'بدون سقف مسبق'}
                    </span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {pillar.budgeted > 0 ? `${Math.round(percentage)}%` : '—'}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, percentage)}%` }}
                      className={cn(
                        "h-full rounded-full transition-all",
                        isOver ? "bg-rose-500" : percentage > 85 ? "bg-amber-500" : pillar.color
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Sub-categories expander */}
              {pillar.categories.length > 0 && (
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                  <button
                    type="button"
                    onClick={() => togglePillar(pillar.id)}
                    className="w-full flex items-center justify-between text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 py-1 transition-colors cursor-pointer"
                  >
                    <span>تفاصيل الفئات ({pillar.categories.length})</span>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-1.5 pt-2"
                    >
                      {pillar.categories.map((c) => (
                        <div 
                          key={c.id}
                          className="flex items-center justify-between text-[10px] p-1.5 rounded-lg bg-slate-50/80 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800/40"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color || '#10b981' }} />
                            <span className="font-bold text-slate-700 dark:text-slate-300">{c.name}</span>
                          </div>
                          <span className="font-mono font-black text-slate-800 dark:text-slate-200">
                            {formatCurrency(c.spent, currency)}
                          </span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default FamilyLivingPillars;
