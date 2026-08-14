import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PiggyBank, 
  Coins, 
  Wallet, 
  Hammer, 
  Plus, 
  Check, 
  Trash2, 
  Sparkles, 
  ArrowDownRight,
  ShieldCheck,
  History,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { useAppContext } from '../../store/AppContext';
import { formatCurrency, hapticFeedback, cn } from '../../utils';
import { Goal } from '../../types';
import toast from 'react-hot-toast';

interface CashPiggySectionProps {
  itemVariants?: any;
}

export const CashPiggySection: React.FC<CashPiggySectionProps> = () => {
  const { 
    goals, 
    expenses, 
    updateGoal, 
    currency, 
    categories, 
    addExpense, 
    addGoal, 
    accounts,
    autoRoundUpSetting,
    updateAutoRoundUpSetting
  } = useAppContext();

  // Find or auto-determine the physical piggy bank goal
  const physicalGoal = useMemo(() => {
    return (goals || []).find(g => 
      g.isPhysicalPiggyBank === true || 
      (g.name && (g.name.includes('حصالة الواقع') || g.name.includes('الحصالة') || g.name.includes('فكة')))
    );
  }, [goals]);

  // Ensure piggy bank exists
  const ensurePiggyBank = async () => {
    if (!physicalGoal) {
      await addGoal({
        name: 'حصالة الواقع والفكة النقدية 🪙',
        targetAmount: 500,
        currentAmount: 0,
        deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        isPhysicalPiggyBank: true,
      });
      toast.success('تم تفعيل حصالة الواقع النقدية بنجاح! 🪙');
    }
  };

  const [depositAmount, setDepositAmount] = useState<string>('');
  const [depositSource, setDepositSource] = useState<'cash_wallet' | 'external'>('cash_wallet');
  const [depositNote, setDepositNote] = useState<string>('');
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);

  // Auto round up settings state
  const isAutoRoundUpActive = autoRoundUpSetting?.enabled ?? false;

  const toggleAutoRoundUp = async () => {
    hapticFeedback('medium');
    const newEnabled = !isAutoRoundUpActive;
    await updateAutoRoundUpSetting({
      enabled: newEnabled,
      multiplier: autoRoundUpSetting?.multiplier || 1,
      targetGoalId: autoRoundUpSetting?.targetGoalId || (physicalGoal?.id || (goals[0]?.id || ''))
    });
    toast.success(newEnabled ? 'تم تفعيل تقريب الفكة التلقائي بنجاح! 🪙' : 'تم تعطيل التقريب التلقائي');
  };

  // Piggy bank history
  const piggyHistory = useMemo(() => {
    if (!physicalGoal) return [];
    return (expenses || [])
      .filter(e => e.goalId === physicalGoal.id)
      .slice(0, 6);
  }, [expenses, physicalGoal]);

  const totalPhysicalSaved = physicalGoal?.currentAmount || 0;

  // Handle deposit into physical piggy
  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('الرجاء إدخال مبلغ صحيح');
      return;
    }

    hapticFeedback('success');

    let currentPhysical = physicalGoal;
    if (!currentPhysical) {
      await ensurePiggyBank();
      currentPhysical = (goals || []).find(g => g.isPhysicalPiggyBank);
    }

    const goalId = currentPhysical ? currentPhysical.id : physicalGoal?.id;

    if (goalId) {
      await addExpense({
        amount: amt,
        categoryId: categories.find(c => c.type === 'saving')?.id || categories[0]?.id || 'saving',
        accountId: depositSource === 'cash_wallet' ? 'cash' : undefined,
        goalId: goalId,
        date: new Date().toISOString().split('T')[0],
        note: depositNote.trim() || 'إيداع فكة نقدية في حصالة الواقع 🪙',
        paymentMethod: 'cash'
      });

      if (currentPhysical) {
        await updateGoal(currentPhysical.id, {
          currentAmount: (currentPhysical.currentAmount || 0) + amt
        });
      }

      toast.success(`تم إيداع ${formatCurrency(amt, currency)} في حصالة الواقع بنجاح! 🎉`);
      setDepositAmount('');
      setDepositNote('');
      setIsDepositOpen(false);
    }
  };

  // Handle breaking / resetting the piggy bank
  const handleEmptyPiggy = async () => {
    if (!physicalGoal) return;
    hapticFeedback('warning');

    await updateGoal(physicalGoal.id, { currentAmount: 0 });
    toast.success('تم تفريغ الحصالة وتصفير الرصيد! يمكنك الآن استخدام نقودك في الواقع 🔨💰');
    setShowEmptyConfirm(false);
  };

  // Quick Preset Add
  const handleQuickAdd = async (amount: number) => {
    hapticFeedback('success');
    if (!physicalGoal) {
      await ensurePiggyBank();
      return;
    }

    await addExpense({
      amount,
      categoryId: categories.find(c => c.type === 'saving')?.id || categories[0]?.id || 'saving',
      accountId: 'cash',
      goalId: physicalGoal.id,
      date: new Date().toISOString().split('T')[0],
      note: `إيداع فكة سريعة (+${amount} ${currency}) 🪙`,
      paymentMethod: 'cash'
    });

    await updateGoal(physicalGoal.id, {
      currentAmount: (physicalGoal.currentAmount || 0) + amount
    });

    toast.success(`تمت إضافة ${formatCurrency(amount, currency)} إلى حصالة الواقع! 🪙`);
  };

  return (
    <div className="space-y-6 text-right w-full" dir="rtl">
      
      {/* 1. Main Physical Cash Piggy Bank Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 border border-amber-200/80 dark:border-amber-900/50 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
              <PiggyBank size={24} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>حصالة الواقع والفكة المادية</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40">
                  نقود ملموسة 💵
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                سجل النقود والفكة الفعلية التي تضعها يدوياً في حصالتك المنزلية
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                hapticFeedback('light');
                setIsDepositOpen(!isDepositOpen);
              }}
              className="flex-1 sm:flex-none px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Plus size={15} />
              <span>إيداع فكة نقدية</span>
            </button>

            {totalPhysicalSaved > 0 && (
              <button
                onClick={() => {
                  hapticFeedback('warning');
                  setShowEmptyConfirm(true);
                }}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-400 hover:text-rose-600 rounded-xl text-xs font-bold transition-all border border-slate-200/50 dark:border-slate-700/50 flex items-center gap-1 cursor-pointer"
                title="تفريغ الحصالة"
              >
                <Hammer size={14} />
                <span>كسر الحصالة</span>
              </button>
            )}
          </div>
        </div>

        {/* Balance Display & Quick Presets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-amber-50/50 dark:bg-amber-950/20 p-5 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 block mb-1">الرصيد الفعلي الموجود في الحصالة</span>
              <span className="text-3xl md:text-4xl font-black font-mono text-amber-600 dark:text-amber-400">
                {formatCurrency(totalPhysicalSaved, currency)}
              </span>
            </div>

            <div className="mt-4 pt-3 border-t border-amber-200/40 dark:border-amber-900/40 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold">
              <span>الهدف المستهدف: {formatCurrency(physicalGoal?.targetAmount || 500, currency)}</span>
              <span>
                {Math.min(100, Math.round((totalPhysicalSaved / (physicalGoal?.targetAmount || 500)) * 100))}% من الهدف
              </span>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 flex flex-col justify-between">
            <div>
              <span className="text-xs font-black text-slate-700 dark:text-slate-300 block mb-2">إيداع فكة سريعة بضغطة واحدة:</span>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 5, 10].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleQuickAdd(amt)}
                    className="py-2 bg-white dark:bg-slate-900 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-800 dark:text-slate-200 hover:text-amber-600 rounded-xl text-xs font-black font-mono border border-slate-200/60 dark:border-slate-700/60 transition-all shadow-2xs cursor-pointer"
                  >
                    +{amt} {currency}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[10px] text-slate-400 font-medium mt-3 leading-relaxed">
              💡 كل ما يتبقى معك من فكة نقدية في نهاية اليوم، ضعه في الحصالة وسجله هنا لتراقب نمو مدخراتك الملموسة.
            </p>
          </div>
        </div>

        {/* Inline Deposit Drawer */}
        <AnimatePresence>
          {isDepositOpen && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleDeposit}
              className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 overflow-hidden"
            >
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">تسجيل إيداع فكة مخصص:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  required
                  placeholder={`المبلغ (${currency})...`}
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold font-mono outline-none text-left"
                />

                <input
                  type="text"
                  placeholder="ملاحظة (اختياري: فكة الخضار، باقي المقهى...)"
                  value={depositNote}
                  onChange={(e) => setDepositNote(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none"
                />

                <div className="flex gap-1.5">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black transition-all cursor-pointer"
                  >
                    تأكيد الإيداع
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDepositOpen(false)}
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Empty Piggy Confirmation */}
        <AnimatePresence>
          {showEmptyConfirm && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="mt-4 p-4 bg-rose-50 dark:bg-rose-950/30 rounded-2xl border border-rose-200 dark:border-rose-900/40 text-right space-y-3"
            >
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-black">
                <Hammer size={16} />
                <span>هل تريد تفريغ الحصالة وتصفير رصيدها؟</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                سيتم تصفير الرصيد في التطبيق لتتمكن من فتح الحصالة واستخدام ما جمعته ({formatCurrency(totalPhysicalSaved, currency)}).
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleEmptyPiggy}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer"
                >
                  نعم، فرّغ الحصالة الآن 🔨
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmptyConfirm(false)}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  تراجع
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recent Piggy History */}
        {piggyHistory.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
              <History size={13} className="text-slate-400" />
              <span>آخر إيداعات الحصالة:</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {piggyHistory.map((h) => (
                <div key={h.id} className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/40 flex items-center justify-between">
                  <div className="truncate">
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block truncate">{h.note || 'إيداع فكة'}</span>
                    <span className="text-[9px] text-slate-400">{h.date}</span>
                  </div>
                  <span className="text-xs font-black font-mono text-amber-600 dark:text-amber-400 shrink-0">
                    +{formatCurrency(h.amount, currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Auto Round-ups Widget (تقريب المعاملات التلقائي) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 rounded-2xl">
              <Coins size={20} />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-black text-slate-900 dark:text-white">
                حصالة التوفير التلقائي (تقريب الفكة)
              </h3>
              <p className="text-[11px] font-semibold text-slate-400">
                تقريب مبالغ مشترياتك لأقرب دينار وتحويل الفارق تلقائياً للأهداف
              </p>
            </div>
          </div>

          <button
            onClick={toggleAutoRoundUp}
            className={cn(
              "text-[11px] font-black px-3 py-1.5 rounded-xl border transition-all cursor-pointer",
              isAutoRoundUpActive
                ? "bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border-teal-200/50 dark:border-teal-900/40 hover:bg-teal-100"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
            )}
          >
            {isAutoRoundUpActive ? 'مفعّلة ونشطة ✅ (اضغط للإيقاف)' : 'تفعيل الميزة ⚡'}
          </button>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 block mb-1">الهدف المستلم للفكة</span>
            <span className="font-black text-slate-800 dark:text-slate-200 truncate block">
              {goals.find(g => g.id === autoRoundUpSetting?.targetGoalId)?.name || physicalGoal?.name || 'حصالة الواقع'}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 block mb-1">معامل التقريب المعتمد</span>
            <span className="font-black text-slate-800 dark:text-slate-200">
              أقرب {autoRoundUpSetting?.multiplier || 1} {currency}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 block mb-1">إجمالي ما تم توفيره تلقائياً</span>
            <span className="font-black font-mono text-teal-600 dark:text-teal-400">
              {formatCurrency(
                expenses
                  .filter(e => e.isTransfer && (e.note || '').includes('حصالة التوفير التلقائي'))
                  .reduce((sum, e) => sum + e.amount, 0),
                currency
              )}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default CashPiggySection;

