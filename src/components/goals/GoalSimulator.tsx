import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Hourglass, Coins, Trophy, ChevronDown, ChevronUp, Calculator } from 'lucide-react';

import { Goal } from '../../types';
import { formatCurrency, hapticFeedback, cn } from '../../utils';

import Card from '../ui/Card';
import Badge from '../ui/Badge';

interface GoalSimulatorProps {
  standardGoals: Goal[];
  currency: string;
  itemVariants: any;
}

const GoalSimulator: React.FC<GoalSimulatorProps> = ({
  standardGoals,
  currency,
  itemVariants
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Simulator State
  const [simGoalId, setSimGoalId] = useState<string>('custom');
  const [simGoalAmount, setSimGoalAmount] = useState<number>(3000);
  const [simSavedAmount, setSimSavedAmount] = useState<number>(500);
  const [simMonthlySavings, setSimMonthlySavings] = useState<number>(250);

  // Simulator Handler to link a goal
  const handleSimGoalChange = (value: string) => {
    setSimGoalId(value);
    if (value !== 'custom') {
      const selected = standardGoals.find(g => g.id === value);
      if (selected) {
        setSimGoalAmount(selected.targetAmount);
        setSimSavedAmount(selected.currentAmount);
      }
    }
  };

  // Calculations for Simulator
  const simRemaining = Math.max(0, simGoalAmount - simSavedAmount);
  
  const simMonthsRequired = useMemo(() => {
    if (simMonthlySavings <= 0) return Infinity;
    return Math.ceil(simRemaining / simMonthlySavings);
  }, [simRemaining, simMonthlySavings]);

  const simResultDateStr = useMemo(() => {
    if (simMonthsRequired === Infinity || simMonthsRequired <= 0) return 'خطة غير نشطة';
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + simMonthsRequired);
    return targetDate.toLocaleDateString('ar-TN', { month: 'long', year: 'numeric' });
  }, [simMonthsRequired]);

  // Accelerators
  const savings15Extra = simMonthlySavings * 1.15;
  const savings30Extra = simMonthlySavings * 1.30;

  const simMonths15 = useMemo(() => {
    if (savings15Extra <= 0) return Infinity;
    return Math.ceil(simRemaining / savings15Extra);
  }, [simRemaining, savings15Extra]);

  const simMonths30 = useMemo(() => {
    if (savings30Extra <= 0) return Infinity;
    return Math.ceil(simRemaining / savings30Extra);
  }, [simRemaining, savings30Extra]);

  const date15Str = useMemo(() => {
    if (simMonths15 === Infinity || simMonths15 <= 0) return 'غير مستمر';
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + simMonths15);
    return targetDate.toLocaleDateString('ar-TN', { month: 'long', year: 'numeric' });
  }, [simMonths15]);

  const date30Str = useMemo(() => {
    if (simMonths30 === Infinity || simMonths30 <= 0) return 'غير مستمر';
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + simMonths30);
    return targetDate.toLocaleDateString('ar-TN', { month: 'long', year: 'numeric' });
  }, [simMonths30]);

  return (
    <motion.div variants={itemVariants}>
      <Card className="p-5 md:p-6 bg-gradient-to-br from-indigo-50/20 via-white to-white dark:from-slate-900/40 dark:via-slate-900 dark:to-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl relative overflow-hidden">
        {/* Subtle design gradient lights */}
        <div className="absolute left-0 top-0 -ml-20 -mt-20 w-80 h-80 bg-primary-500/5 dark:bg-primary-400/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute right-0 bottom-0 -mr-20 -mb-20 w-80 h-80 bg-emerald-500/5 dark:bg-emerald-400/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Widget Header */}
        <div 
          onClick={() => {
            hapticFeedback('light');
            setIsExpanded(!isExpanded);
          }}
          className={cn(
            "flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 cursor-pointer select-none transition-all",
            isExpanded ? "pb-6 mb-6 border-b border-slate-100 dark:border-slate-800/60" : ""
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-500 shrink-0">
              <Calculator size={22} className="text-indigo-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm md:text-base font-black text-slate-900 dark:text-white">
                  مُحاكي الادخار والوقت الذكي
                </h3>
                <Badge variant="success" className="text-[10px] py-0.5">محاكي تفاعلي ⚡</Badge>
              </div>
              <p className="text-[11px] text-slate-400 font-bold">احسب المدة الدقيقة والوتيرة اللازمة لبلوغ هدفك المالي</p>
            </div>
          </div>

          {/* Controls on header */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            {isExpanded && (
              <div 
                onClick={(e) => e.stopPropagation()} 
                className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950/20 border border-slate-200/50 dark:border-slate-800 rounded-xl px-3 py-1.5 shadow-5xs"
              >
                <span className="text-[10px] font-black text-slate-400 shrink-0">ربط بهدف:</span>
                <select
                  value={simGoalId}
                  onChange={(e) => {
                    hapticFeedback('light');
                    handleSimGoalChange(e.target.value);
                  }}
                  className="bg-transparent text-xs font-black text-slate-800 dark:text-white outline-none cursor-pointer"
                >
                  <option value="custom">✍️ هَدَف مخصص (حرّ)</option>
                  {standardGoals.map(g => (
                    <option key={g.id} value={g.id}>🎯 {g.name}</option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all",
                isExpanded 
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  : "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60"
              )}
            >
              <span>{isExpanded ? 'إخفاء المحاكي' : 'فتح المحاكي'}</span>
              {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          </div>
        </div>

        {/* Interactive Calculator Interface */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10 pt-2">
          
          {/* Left Portion: Controls (Sliders & Direct text entry) */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Target budget input & slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                <span className="font-black text-slate-400">مبلغ الهدف المالي</span>
                <span className="font-mono text-slate-800 dark:text-white font-black">{formatCurrency(simGoalAmount, currency)}</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="100"
                  max="50000"
                  step="100"
                  value={simGoalAmount}
                  onChange={(e) => {
                    hapticFeedback('light');
                    setSimGoalAmount(Number(e.target.value));
                    if (simGoalId !== 'custom') setSimGoalId('custom');
                  }}
                  className="flex-1 accent-indigo-500 h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
                <input
                  type="number"
                  value={simGoalAmount || ''}
                  onChange={(e) => {
                    setSimGoalAmount(Number(e.target.value));
                    if (simGoalId !== 'custom') setSimGoalId('custom');
                  }}
                  onFocus={(e) => {
                    if (!simGoalAmount || simGoalAmount === 0) {
                      setSimGoalAmount(0);
                    } else {
                      const target = e.target;
                      setTimeout(() => {
                        try {
                          target.setSelectionRange(0, target.value.length);
                        } catch (err) {
                          target.select();
                        }
                      }, 50);
                    }
                  }}
                  onClick={(e) => {
                    if (!simGoalAmount || simGoalAmount === 0) {
                      setSimGoalAmount(0);
                    } else {
                      const target = e.target as HTMLInputElement;
                      setTimeout(() => {
                        try {
                          target.setSelectionRange(0, target.value.length);
                        } catch (err) {
                          target.select();
                        }
                      }, 50);
                    }
                  }}
                  className="w-20 text-center bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg py-1 px-2 text-xs font-black font-mono text-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Already saved money input & slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                <span className="font-black text-slate-400">المبلغ المتوفر حالياً (الأرضية)</span>
                <span className="font-mono text-slate-800 dark:text-white font-black">{formatCurrency(simSavedAmount, currency)}</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max={Math.max(simGoalAmount, 5000)}
                  step="50"
                  value={simSavedAmount}
                  onChange={(e) => {
                    hapticFeedback('light');
                    setSimSavedAmount(Number(e.target.value));
                    if (simGoalId !== 'custom') setSimGoalId('custom');
                  }}
                  className="flex-1 accent-emerald-500 h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
                <input
                  type="number"
                  value={simSavedAmount || ''}
                  onChange={(e) => {
                    setSimSavedAmount(Number(e.target.value));
                    if (simGoalId !== 'custom') setSimGoalId('custom');
                  }}
                  onFocus={(e) => {
                    if (!simSavedAmount || simSavedAmount === 0) {
                      setSimSavedAmount(0);
                    } else {
                      const target = e.target;
                      setTimeout(() => {
                        try {
                          target.setSelectionRange(0, target.value.length);
                        } catch (err) {
                          target.select();
                        }
                      }, 50);
                    }
                  }}
                  onClick={(e) => {
                    if (!simSavedAmount || simSavedAmount === 0) {
                      setSimSavedAmount(0);
                    } else {
                      const target = e.target as HTMLInputElement;
                      setTimeout(() => {
                        try {
                          target.setSelectionRange(0, target.value.length);
                        } catch (err) {
                          target.select();
                        }
                      }, 50);
                    }
                  }}
                  className="w-20 text-center bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg py-1 px-2 text-xs font-black font-mono text-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Monthly Savings committed */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                <span className="font-black text-slate-400">معدل الادخار الشهري الملتزم به</span>
                <span className="font-mono text-slate-800 dark:text-white font-black">{formatCurrency(simMonthlySavings, currency)} / شهر</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="10"
                  max="5000"
                  step="10"
                  value={simMonthlySavings}
                  onChange={(e) => {
                    hapticFeedback('light');
                    setSimMonthlySavings(Number(e.target.value));
                  }}
                  className="flex-1 accent-cyan-500 h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
                <input
                  type="number"
                  value={simMonthlySavings || ''}
                  onChange={(e) => {
                    setSimMonthlySavings(Number(e.target.value));
                  }}
                  onFocus={(e) => {
                    if (!simMonthlySavings || simMonthlySavings === 0) {
                      setSimMonthlySavings(0);
                    } else {
                      const target = e.target;
                      setTimeout(() => {
                        try {
                          target.setSelectionRange(0, target.value.length);
                        } catch (err) {
                          target.select();
                        }
                      }, 50);
                    }
                  }}
                  onClick={(e) => {
                    if (!simMonthlySavings || simMonthlySavings === 0) {
                      setSimMonthlySavings(0);
                    } else {
                      const target = e.target as HTMLInputElement;
                      setTimeout(() => {
                        try {
                          target.setSelectionRange(0, target.value.length);
                        } catch (err) {
                          target.select();
                        }
                      }, 50);
                    }
                  }}
                  className="w-20 text-center bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg py-1 px-2 text-xs font-black font-mono text-slate-800 dark:text-white"
                />
              </div>
            </div>

          </div>

          {/* Right Portion: Mathematical Output, Milestones, Acceleration */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
            
            {/* Output Result panel */}
            {simMonthlySavings <= 0 ? (
              <div className="bg-slate-50 dark:bg-slate-950/30 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-2 h-full">
                <Coins className="text-slate-400 size-8 animate-pulse mb-1" />
                <p className="text-xs font-black text-slate-600 dark:text-slate-300">الادخار الشهري يساوي صفر!</p>
                <p className="text-[10px] text-slate-400 leading-relaxed font-medium">الرجاء زيادة معدل الادخار الشهري من لوحة التحكم على اليمين لتصميم جدول الوصول وبلوغ قمتك المالية بنجاح.</p>
              </div>
            ) : simRemaining <= 0 ? (
              <div className="bg-emerald-500/10 rounded-2xl p-6 border border-emerald-500/20 flex flex-col items-center justify-center text-center space-y-2 h-full">
                <Trophy className="text-amber-500 size-9 animate-[bounce_2s_infinite] mb-1" />
                <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">لقد حققت الهدف المالي بالفعل! 🎉</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">مبلغ المدخرات المتوفر يغطي أو يتعدى قيمة هدفك المطلوب. أحسنت صنعاً، أنت جاهز لاستثماره أو الاستمتاع بثماره.</p>
              </div>
            ) : (
              <div className="space-y-4 flex-1">
                
                {/* Highlight core math */}
                <div className="p-5 bg-indigo-50/30 dark:bg-slate-950/40 border border-indigo-100/10 rounded-2xl relative overflow-hidden flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 text-right">
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">تقديرات الوقت الذاتية ⏳</span>
                      <h4 className="text-2xl font-black text-slate-800 dark:text-white">
                        {simMonthsRequired >= 12 ? (
                          <>
                            {Math.floor(simMonthsRequired / 12)} <span className="text-xs font-bold text-slate-400">عام</span> {simMonthsRequired % 12 > 0 && (
                              <>
                                و {simMonthsRequired % 12} <span className="text-xs font-bold text-slate-400">أشهر</span>
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            {simMonthsRequired} <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">أشهر</span>
                          </>
                        )}
                      </h4>
                    </div>

                    {/* Speed badge */}
                    <span className={cn(
                      "text-[9px] font-black px-2.5 py-1 rounded-lg shrink-0",
                      simMonthsRequired <= 6 ? "bg-emerald-500/10 text-emerald-600" :
                      simMonthsRequired <= 18 ? "bg-cyan-500/10 text-cyan-600" :
                      "bg-amber-500/10 text-amber-600"
                    )}>
                      {simMonthsRequired <= 6 ? 'سرعة قصوى ⚡' :
                       simMonthsRequired <= 18 ? 'إيقاع توازني ⚖️' :
                       'مدى استراتيجي طويل 🏔️'}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/40 flex justify-between items-center text-[10px]">
                    <span className="text-slate-400 font-bold">تاريخ الإنجاز التقريبي:</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-black">{simResultDateStr}</span>
                  </div>
                </div>

                {/* Acceleration Scenarios */}
                <div className="space-y-2">
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block pb-1">عجّل وتيرة إنجاز الهدف 🚀</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Extra 15% */}
                    <div className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl space-y-1 text-right">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-bold text-emerald-500">+15% سرعة</span>
                        <span className="text-[9px] text-slate-400 font-mono">({formatCurrency(savings15Extra, currency)}/ش)</span>
                      </div>
                      <p className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                        خلال <span className="text-indigo-500 font-mono font-bold">{simMonths15}</span> شهر فقط
                      </p>
                      <p className="text-[8px] text-slate-400 font-medium font-tajawal">
                        توفير ({simMonthsRequired - simMonths15}) أشهر • بحلول {date15Str}
                      </p>
                    </div>

                    {/* Extra 30% */}
                    <div className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl space-y-1 text-right">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-bold text-cyan-500">+30% سرعة</span>
                        <span className="text-[9px] text-slate-400 font-mono">({formatCurrency(savings30Extra, currency)}/ش)</span>
                      </div>
                      <p className="text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                        خلال <span className="text-indigo-500 font-mono font-bold">{simMonths30}</span> شهر فقط
                      </p>
                      <p className="text-[8px] text-slate-400 font-medium font-tajawal">
                        توفير ({simMonthsRequired - simMonths30}) أشهر • بحلول {date30Str}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Milestone Trackers */}
                <div className="p-3 bg-slate-50 dark:bg-slate-950/20 rounded-xl border border-slate-100 dark:border-slate-850/50 space-y-2">
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">لوحة محطات التقدم المعيارية</span>
                  
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="space-y-1">
                      <span className="text-[8px] font-bold text-slate-400 block">%25 إنجاز</span>
                      <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-400 w-full" />
                      </div>
                      <span className="text-[8px] font-black font-mono text-slate-600 dark:text-slate-400">
                        {Math.ceil(simMonthsRequired * 0.25)} ش
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[8px] font-bold text-slate-400 block">%50 نصف الرحلة</span>
                      <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 w-full" />
                      </div>
                      <span className="text-[8px] font-black font-mono text-slate-600 dark:text-slate-400">
                        {Math.ceil(simMonthsRequired * 0.5)} ش
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[8px] font-bold text-slate-400 block">%75 الأمان المالي</span>
                      <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 w-full" />
                      </div>
                      <span className="text-[8px] font-black font-mono text-slate-600 dark:text-slate-400">
                        {Math.ceil(simMonthsRequired * 0.75)} ش
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[8px] font-bold text-slate-400 block">%100 بلوغ القمة</span>
                      <div className="h-1.5 bg-primary-500 rounded-full" />
                      <span className="text-[8px] font-black font-mono text-primary-500">
                        {simMonthsRequired} ش
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>
            </motion.div>
          )}
        </AnimatePresence>

      </Card>
    </motion.div>
  );
};

export default GoalSimulator;
