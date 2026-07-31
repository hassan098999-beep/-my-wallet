import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coins, X, Activity, Plus } from 'lucide-react';
import { Account } from '../../types';
import { formatTunisianAmount } from '../../utils';
import Card from '../ui/Card';

interface GamaeyaFormProps {
  isAddingGamaeya: boolean;
  setIsAddingGamaeya: (val: boolean) => void;
  gamaeyaName: string;
  setGamaeyaName: (val: string) => void;
  gamaeyaAmount: string;
  setGamaeyaAmount: (val: string) => void;
  gamaeyaMembers: number;
  setGamaeyaMembers: (val: number) => void;
  gamaeyaPayoutMonth: number;
  setGamaeyaPayoutMonth: (val: number) => void;
  gamaeyaStartDate: string;
  setGamaeyaStartDate: (val: string) => void;
  gamaeyaAccountId: string;
  setGamaeyaAccountId: (val: string) => void;
  handleAddGamaeya: (e: React.FormEvent) => void;
  accounts: Account[];
  currency: string;
}

const GamaeyaForm: React.FC<GamaeyaFormProps> = ({
  isAddingGamaeya,
  setIsAddingGamaeya,
  gamaeyaName,
  setGamaeyaName,
  gamaeyaAmount,
  setGamaeyaAmount,
  gamaeyaMembers,
  setGamaeyaMembers,
  gamaeyaPayoutMonth,
  setGamaeyaPayoutMonth,
  gamaeyaStartDate,
  setGamaeyaStartDate,
  gamaeyaAccountId,
  setGamaeyaAccountId,
  handleAddGamaeya,
  accounts,
  currency,
}) => {
  return (
    <AnimatePresence>
      {isAddingGamaeya && (
        <motion.div
          initial={{ opacity: 0, height: 0, y: -20 }}
          animate={{ opacity: 1, height: 'auto', y: 0 }}
          exit={{ opacity: 0, height: 0, y: -20 }}
          className="overflow-hidden px-2"
        >
          <Card className="p-6 md:p-8 mb-8 border border-white/40 dark:border-slate-800/40 shadow-sm bg-white/50 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/50">
              <div className="flex items-center gap-2">
                <Coins className="text-primary-500 size-5 animate-spin" style={{ animationDuration: '3s' }} />
                <h3 className="text-lg font-black text-slate-900 dark:text-white">تخصيص جمعية جديدة</h3>
              </div>
              <button 
                onClick={() => setIsAddingGamaeya(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddGamaeya} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">اسم الجمعية</label>
                  <input
                    type="text"
                    value={gamaeyaName}
                    onChange={(e) => setGamaeyaName(e.target.value)}
                    className="w-full p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 text-base outline-none focus:ring-8 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-black"
                    placeholder="مثال: جمعية الأصدقاء، جمعية العائلة..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">مساهمتك الشهرية ({currency})</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={gamaeyaAmount}
                    onChange={(e) => setGamaeyaAmount(formatTunisianAmount(e.target.value))}
                    onFocus={(e) => {
                      if (!gamaeyaAmount || gamaeyaAmount === '0' || gamaeyaAmount === '0.000' || parseFloat(gamaeyaAmount) === 0) {
                        setGamaeyaAmount('');
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
                      if (!gamaeyaAmount || gamaeyaAmount === '0' || gamaeyaAmount === '0.000' || parseFloat(gamaeyaAmount) === 0) {
                        setGamaeyaAmount('');
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
                    className="w-full p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 text-base outline-none focus:ring-8 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-mono font-black"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">عدد المشتركين (مدة الجمعية بالأشهر)</label>
                  <select
                    value={gamaeyaMembers}
                    onChange={(e) => setGamaeyaMembers(Number(e.target.value))}
                    className="w-full p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 text-base outline-none focus:ring-8 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-black cursor-pointer appearance-none"
                  >
                    {[2,3,4,5,6,7,8,9,10,12,15,18,20,24].map(n => (
                      <option key={n} value={n}>{n} أشهر ({n} أعضاء)</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">ترتيب قبضك (الشهر الذي تستلم فيه المبلغ)</label>
                  <select
                    value={gamaeyaPayoutMonth}
                    onChange={(e) => setGamaeyaPayoutMonth(Number(e.target.value))}
                    className="w-full p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 text-base outline-none focus:ring-8 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-black cursor-pointer appearance-none"
                  >
                    {Array.from({ length: gamaeyaMembers }, (_, i) => i + 1).map(m => (
                      <option key={m} value={m}>الشهر {m} {m === 1 ? '(الأول)' : m === gamaeyaMembers ? '(الأخير)' : ''}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">تاريخ البداية (شهر/سنة)</label>
                  <input
                    type="month"
                    value={gamaeyaStartDate}
                    onChange={(e) => setGamaeyaStartDate(e.target.value)}
                    className="w-full p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 text-base outline-none focus:ring-8 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-mono font-black"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">الحساب المرتبط</label>
                  <select
                    value={gamaeyaAccountId}
                    onChange={(e) => setGamaeyaAccountId(e.target.value)}
                    className="w-full p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 text-base outline-none focus:ring-8 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-black appearance-none cursor-pointer"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-primary-50/50 dark:bg-primary-950/20 p-4 rounded-2xl border border-primary-100/50 dark:border-primary-900/50 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="p-3 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 rounded-xl">
                  <Activity size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">ملخص الحسابات الذكي للجمعية:</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    سوف تقوم بدفع <span className="font-bold text-primary-600 dark:text-primary-400">{gamaeyaAmount} {currency}</span> شهرياً لمدة <span className="font-bold text-slate-800 dark:text-slate-200">{gamaeyaMembers} أشهر</span>. 
                    وستستلم العائد الإجمالي بقيمة <span className="font-bold text-emerald-600 dark:text-emerald-400">{Number(gamaeyaAmount) * gamaeyaMembers} {currency}</span> دفعة واحدة في <span className="font-bold text-primary-600">الشهر {gamaeyaPayoutMonth}</span>.
                  </p>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.01, y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="btn-primary w-full h-14 rounded-2xl font-semibold flex items-center justify-center gap-2 text-base transition-all shadow-md shadow-primary-500/20 cursor-pointer"
              >
                <Plus size={20} />
                إنشاء وتفعيل الجمعية التكافلية
              </motion.button>
            </form>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GamaeyaForm;
