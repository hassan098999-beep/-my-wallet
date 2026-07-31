import React from 'react';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';
import { Coins, Activity, Users, Trash, Check } from 'lucide-react';
import { Gamaeya } from '../../types';
import { cn, formatCurrency, hapticFeedback } from '../../utils';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import EmptyState from '../ui/EmptyState';

interface GamaeyaTrackerProps {
  gamaeyas: Gamaeya[];
  currency: string;
  deleteGamaeya: (id: string) => void;
  payGamaeyaMonth: (gamaeyaId: string, monthIndex: number) => void;
  receiveGamaeyaPayout: (gamaeyaId: string) => void;
  setIsAddingGamaeya: (val: boolean) => void;
  itemVariants?: any;
}

const GamaeyaTracker: React.FC<GamaeyaTrackerProps> = ({
  gamaeyas,
  currency,
  deleteGamaeya,
  payGamaeyaMonth,
  receiveGamaeyaPayout,
  setIsAddingGamaeya,
  itemVariants,
}) => {
  return (
    <>
      {/* Gamaeya Stats Dashboard */}
      <motion.div 
        variants={itemVariants} 
        className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 px-2"
      >
        <div className="bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-850/80 shadow-sm md:shadow-md rounded-3xl p-6 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-primary-500/5 rounded-full blur-2xl group-hover:bg-primary-500/10 transition-colors" />
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-950/40 text-primary-600 flex items-center justify-center">
              <Coins size={22} className="text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">إجمالي اشتراكاتك النشطة</p>
              <h3 className="text-xl font-black text-slate-900 dark:text-white leading-none mt-1">
                {(gamaeyas || []).filter(g => g.status === 'active').length} جمعيات
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-850/80 shadow-sm md:shadow-md rounded-3xl p-6 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-colors" />
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center">
              <Activity size={22} />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">تدفع كل شهر للجمعيات</p>
              <h3 className="text-xl font-black text-rose-600 dark:text-rose-400 leading-none mt-1 font-mono">
                {formatCurrency((gamaeyas || []).filter(g => g.status === 'active').reduce((sum, g) => sum + g.monthlyAmount, 0), currency)}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/40 dark:border-slate-850/80 shadow-sm md:shadow-md rounded-3xl p-6 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors" />
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/40 text-amber-500 flex items-center justify-center">
              <Users size={22} />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">العوائد المستهدفة للقبض</p>
              <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 leading-none mt-1 font-mono">
                {formatCurrency((gamaeyas || []).filter(g => g.status === 'active').reduce((sum, g) => sum + (g.monthlyAmount * g.memberCount), 0), currency)}
              </h3>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Gamaeya list */}
      <div className="space-y-4 px-2">
        <h2 className="text-sm font-semibold text-slate-950 dark:text-white flex items-center gap-2">
          <Coins size={16} /> قائمة الجمعيات النشطة
        </h2>

        {(gamaeyas || []).length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {(gamaeyas || []).map(g => {
              const paidMonthsCount = (g.payments || []).filter(p => p.paid).length;
              const totalMonths = g.memberCount;
              const payoutTotalSum = g.monthlyAmount * g.memberCount;
              const isPayoutCollected = (g.payments || []).some(p => p.monthIndex === g.payoutMonth && p.payoutReceived);

              return (
                <Card key={g.id} className="p-6 md:p-8 overflow-hidden relative group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-[80px]" />
                  
                  <div className="flex flex-col gap-6 relative z-10">
                    {/* Card Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary-100 dark:bg-primary-950/50 text-primary-500 rounded-2xl flex items-center justify-center shadow-inner">
                          <Coins size={22} className="text-primary-600 dark:text-primary-400 animate-pulse" />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-slate-900 dark:text-white">{g.name}</h3>
                          <p className="text-xs text-slate-400">تاريخ البدء: {g.startDate}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {g.status === 'completed' ? (
                          <Badge variant="success">مكتملة</Badge>
                        ) : (
                          <Badge variant="warning">نشطة</Badge>
                        )}
                        <button
                          onClick={() => {
                            if (confirm('هل أنت متأكد من حذف هذه الجمعية؟ لن يتم حذف المصاريف والمدخولات المسجلة سابقاً.')) {
                              deleteGamaeya(g.id);
                              toast.success('تم حذف الجمعية');
                            }
                          }}
                          className="text-slate-300 hover:text-rose-500 p-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all cursor-pointer"
                        >
                          <Trash size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Card Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
                      <div>
                        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">مساهمتك الشهرية</span>
                        <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">{g.monthlyAmount} {currency}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">مبلغ القبض الإجمالي</span>
                        <p className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{payoutTotalSum} {currency}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">دورك في قبض الجمعية</span>
                        <p className="text-base font-black text-amber-500 dark:text-amber-400 mt-0.5">الشهر {g.payoutMonth} من {totalMonths}</p>
                      </div>
                    </div>

                    {/* Payment Progress bar */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-2">
                        <span className="text-slate-500 dark:text-slate-400">تقدم المساهمات والمدفوعات</span>
                        <span className="text-primary-600 dark:text-primary-400">{paidMonthsCount} من إجمالي {totalMonths} أشهر دفعت {`(${Math.round(paidMonthsCount / totalMonths * 100)}%)`}</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-primary-600 h-full transition-all" style={{ width: `${paidMonthsCount / totalMonths * 100}%` }} />
                      </div>
                    </div>

                    {/* Visual beads (أقساط الجمعية) */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300">أقساط المساهمات والأشهر:</label>
                      <div className="flex flex-wrap gap-2.5">
                        {(g.payments || []).map(p => {
                          const isPayoutGoal = p.monthIndex === g.payoutMonth;
                          return (
                            <div
                              key={p.monthIndex}
                              className={cn(
                                "flex flex-col items-center gap-1.5 p-2 rounded-xl text-center min-w-[70px] border relative transition-all",
                                p.paid 
                                  ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-600" 
                                  : isPayoutGoal && !isPayoutCollected
                                    ? "bg-amber-500/5 border-amber-500/30 text-amber-600"
                                    : "bg-slate-50 dark:bg-slate-900 border-slate-200/50 dark:border-slate-800/50 text-slate-500"
                              )}
                            >
                              <span className="text-[9px] font-semibold dark:text-slate-400">الشهر {p.monthIndex}</span>
                              {p.paid ? (
                                <div className="w-7 h-7 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs shadow-md">
                                  <Check size={14} />
                                </div>
                              ) : isPayoutGoal ? (
                                <div className="w-7 h-7 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs animate-pulse shadow-md cursor-pointer select-none">
                                  🎁
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    hapticFeedback('medium');
                                    payGamaeyaMonth(g.id, p.monthIndex);
                                  }}
                                  className="w-7 h-7 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-200 border-2 border-slate-300 dark:border-slate-700 rounded-full flex items-center justify-center text-xs cursor-pointer select-none font-black"
                                >
                                  {p.monthIndex}
                                </button>
                              )}

                              <span className="text-[9px] font-bold">
                                {isPayoutGoal ? 'شهر القبض' : p.paid ? 'تم الدفع' : 'دفع القسط'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Collect/Payout Actions */}
                    {!isPayoutCollected && (
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="text-right">
                          <span className="text-xs font-semibold text-slate-400">العائد المتاح عند دورك</span>
                          <p className="text-xs text-slate-500 dark:text-slate-400">بمساهمتك المنتظمة وزملائك، ستستلم القيمة الكاملة {payoutTotalSum} {currency}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            hapticFeedback('success');
                            receiveGamaeyaPayout(g.id);
                          }}
                          className="w-full md:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer select-none flex items-center justify-center gap-2"
                        >
                          🎁 استلام وقبض الجمعية الكلية ({payoutTotalSum} {currency})
                        </button>
                      </div>
                    )}
                    {isPayoutCollected && (
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800/50 bg-emerald-500/5 p-4 rounded-xl border border-dashed border-emerald-500/20 flex items-center gap-2 justify-center text-emerald-600 font-bold text-xs">
                        🎉 مبروك! لقد قمت بقبض هذه الجمعية بنجاح وتم تحصين ميزانيتك.
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={Coins}
            title="لا توجد جمعيات نشطة حالياً"
            description="أضف مجموعات التوفير والادخار (الجمعية) ووزّع الأدوار بنظام ذكي لتتبع مساهماتك واستلام القبض تلقائياً!"
            actionLabel="تفعيل وإنشاء أول جمعية"
            onAction={() => {
              hapticFeedback('medium');
              setIsAddingGamaeya(true);
            }}
          />
        )}
      </div>
    </>
  );
};

export default GamaeyaTracker;
