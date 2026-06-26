import React, { useState } from 'react';
import { useAppContext } from '../../store/AppContext';
import { 
  PiggyBank, Info, Save, ToggleLeft, ToggleRight, 
  HelpCircle, Sparkles, Coins, Check, ArrowLeftRight, 
  TrendingUp, RefreshCw 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, hapticFeedback } from '../../utils';

const RoundUpManager = () => {
  const { 
    autoRoundUpSetting, 
    updateAutoRoundUpSetting, 
    goals, 
    expenses, 
    currency 
  } = useAppContext();

  // State for the interactive simulator
  const [simulatorAmount, setSimulatorAmount] = useState('12.350');
  
  // Settings state initialized from context
  const enabled = autoRoundUpSetting?.enabled || false;
  const targetGoalId = autoRoundUpSetting?.targetGoalId || '';
  const multiplier = autoRoundUpSetting?.multiplier || 1;

  // Filter goals that are savings goals
  const savingGoals = goals || [];

  // Calculate total saved via round-up
  const roundUpTransactions = expenses.filter(
    (e) => e.isTransfer && (e.note || '').includes('حصالة التوفير التلقائي')
  );

  const totalSavedViaRoundUp = roundUpTransactions.reduce(
    (sum, e) => sum + e.amount, 
    0
  );

  // Find the physical piggy bank goal or target goal
  const physicalGoal = (goals || []).find(g => 
    g.isPhysicalPiggyBank === true || 
    g.name.includes('حصالة الواقع') || 
    g.name.includes('الحصالة الفعلية')
  );

  const targetGoal = (goals || []).find(g => g.id === targetGoalId) || physicalGoal;

  const handleToggle = () => {
    hapticFeedback('medium');
    if (!enabled && savingGoals.length === 0) {
      toast.error('الرجاء إنشاء هدف ادخار أو حصالة أولاً في صفحة الأهداف لتتمكن من تحديدها كوجهة للفكة.');
      return;
    }

    const defaultGoalId = targetGoalId || (savingGoals[0]?.id || '');
    updateAutoRoundUpSetting({
      enabled: !enabled,
      targetGoalId: defaultGoalId,
      multiplier: multiplier
    });
    
    if (!enabled) {
      toast.success('تم تفعيل حصالة التوفير وفكة المعاملات بنجاح! 🪙');
    } else {
      toast.success('تم إيقاف التوفير التلقائي.');
    }
  };

  const handleGoalChange = (goalId: string) => {
    hapticFeedback('light');
    updateAutoRoundUpSetting({
      enabled,
      targetGoalId: goalId,
      multiplier
    });
    toast.success('تم تحديث الحصالة المستهدفة.');
  };

  const handleMultiplierChange = (mult: number) => {
    hapticFeedback('light');
    updateAutoRoundUpSetting({
      enabled,
      targetGoalId,
      multiplier: mult
    });
    toast.success(`تم ضبط التقريب لأقرب ${mult} دينار.`);
  };

  // Simulator calculations
  const simVal = parseFloat(simulatorAmount) || 0;
  const simRemainder = simVal % multiplier;
  const simSaved = simRemainder > 0 ? Number((multiplier - simRemainder).toFixed(3)) : 0;
  const simTotal = simVal + simSaved;

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Header section */}
      <div className="flex items-start gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="w-10 h-10 rounded-xl bg-primary-500/10 dark:bg-primary-500/5 border border-primary-500/20 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
          <PiggyBank size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-black text-slate-800 dark:text-white">حصالة التوفير التلقائي وفكة المعاملات (Auto Round-ups)</h2>
          <p className="text-[10px] text-slate-400 font-bold leading-relaxed mt-1">
            قم بزيادة مدخراتك التلقائية دون أن تشعر! عند تسجيل أي مصروف، يتم تقريب المبلغ وتوفير الفكة تلقائياً في حصالة هدفك المحدد.
          </p>
        </div>
      </div>

      {/* Main Switcher Card */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-800 flex items-center justify-between gap-4">
        <div className="text-right flex-1">
          <p className="text-xs font-black text-slate-800 dark:text-white">حالة الخدمة التلقائية</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            {enabled 
              ? "الخدمة مفعلة الآن. فكة مصاريفك تذهب تلقائياً إلى الحصالة." 
              : "الخدمة متوقفة حالياً. قم بتفعيلها لبدء التوفير من الفكة."}
          </p>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          className="text-primary-600 dark:text-primary-400 focus:outline-none transition-colors cursor-pointer shrink-0"
        >
          {enabled ? (
            <ToggleRight className="w-14 h-8 text-primary-500 dark:text-primary-400" />
          ) : (
            <ToggleLeft className="w-14 h-8 text-slate-400 dark:text-slate-600" />
          )}
        </button>
      </div>

      {/* Settings Options (Only shown when enabled) */}
      <div className={`space-y-6 transition-opacity duration-300 ${enabled ? 'opacity-100' : 'opacity-60 pointer-events-none'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Target Goal Selector */}
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center gap-1.5 justify-start text-[10px] font-black text-slate-500">
              <Coins size={14} className="text-primary-500" />
              <span>الحصالة / الهدف المستهدف للتوفير</span>
            </div>
            
            {savingGoals.length === 0 ? (
              <div className="text-center py-2">
                <p className="text-[10px] text-rose-500 font-bold">لا يوجد أهداف ادخار مفعلة</p>
                <p className="text-[9px] text-slate-400 mt-1">الرجاء الانتقال إلى صفحة الأهداف لإنشاء حصالة.</p>
              </div>
            ) : (
              <select
                value={targetGoalId}
                onChange={(e) => handleGoalChange(e.target.value)}
                disabled={!enabled}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-primary-500 font-bold"
              >
                <option value="" disabled>-- حدد حصالة --</option>
                {savingGoals.map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.name} (المحرز: {formatCurrency(goal.currentAmount, currency)})
                  </option>
                ))}
              </select>
            )}
            <p className="text-[9px] text-slate-400 leading-normal">
              كلما تفرز فكة من المصاريف، تُضاف مباشرة لمبلغ هذا الهدف دون الإخلال بالمستند الأصلي.
            </p>
          </div>

          {/* Multiplier Selector */}
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center gap-1.5 justify-start text-[10px] font-black text-slate-500">
              <ArrowLeftRight size={14} className="text-primary-500" />
              <span>التقريب لأقرب مبلغ (مضاعف التوفير)</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {[1, 5, 10].map((num) => {
                const isSelected = multiplier === num;
                return (
                  <button
                    type="button"
                    key={num}
                    onClick={() => handleMultiplierChange(num)}
                    disabled={!enabled}
                    className={`px-3 py-2 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary-500 text-white border-primary-500'
                        : 'bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 border-slate-150 dark:border-slate-850 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    أقرب {num} {currency}
                  </button>
                );
              })}
            </div>
            <p className="text-[9px] text-slate-400 leading-normal">
              مثلاً، لأقرب 1 دينار: 2.300 د.ت تصبح 3.000 د.ت (الفكة الموفرة: 0.700 د.ت).
            </p>
          </div>

        </div>

        {/* Dynamic Interactive Simulator */}
        <div className="p-4 bg-gradient-to-tr from-primary-500/5 to-transparent border border-primary-500/10 rounded-2xl space-y-3">
          <div className="flex items-center gap-1.5 justify-between">
            <div className="flex items-center gap-1.5 justify-start text-[10px] font-black text-primary-600 dark:text-primary-400">
              <Sparkles size={14} />
              <span>محاكي الفكة التفاعلي</span>
            </div>
            <span className="text-[9px] font-bold text-slate-400">جرب مبالغ مختلفة</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
            {/* Input field */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500">المصروف الفعلي المدخل</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.050"
                  value={simulatorAmount}
                  onChange={(e) => setSimulatorAmount(e.target.value)}
                  placeholder="12.350"
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-12 pr-3 py-2 text-xs font-bold focus:ring-1 focus:ring-primary-500 text-right font-sans"
                  dir="ltr"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">د.ت</span>
              </div>
            </div>

            {/* Calculations Visualiser */}
            <div className="md:col-span-2 grid grid-cols-3 gap-2 bg-white dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850/60 text-center">
              <div className="space-y-0.5 border-l border-slate-100 dark:border-slate-800">
                <p className="text-[9px] text-slate-400 font-bold">يقرب إلى</p>
                <p className="text-xs font-sans font-black text-slate-800 dark:text-white">
                  {formatCurrency(simTotal, currency)}
                </p>
              </div>
              <div className="space-y-0.5 border-l border-slate-100 dark:border-slate-800">
                <p className="text-[9px] text-emerald-500 font-black">الفكة الموفرة</p>
                <p className="text-xs font-sans font-black text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(simSaved, currency)}
                </p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[9px] text-slate-400 font-bold">يسحب من الحساب</p>
                <p className="text-xs font-sans font-black text-slate-800 dark:text-white">
                  {formatCurrency(simTotal, currency)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="text-[9px] text-slate-500 dark:text-slate-400 bg-slate-100/40 dark:bg-slate-900/50 p-2 rounded-lg leading-relaxed">
            💡 <span className="font-bold">كيف تؤثر على ميزانيتك؟</span> ستظهر في تقرير مصاريفك قيمة السلعة الفعلية <span className="font-black">({formatCurrency(simVal, currency)})</span> مع معاملة توفير فرعية بقيمة <span className="font-black">({formatCurrency(simSaved, currency)})</span> تذهب تلقائياً للحصالة ليكون حسابك البنكي متطابقاً تماماً مع الواقع وتوفر الفكة تدريجياً.
          </div>
        </div>
      </div>

      {/* Total Round-up Savings Statistics */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-4">
        <h3 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5 justify-start">
          <TrendingUp size={14} className="text-emerald-500" />
          <span>إحصائيات وحصاد فكة التوفير</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Accumulated card */}
          <div className="p-4 bg-amber-50/40 dark:bg-amber-950/10 border border-amber-500/15 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <PiggyBank size={24} className="text-amber-500" />
            </div>
            <div className="flex-1 text-right">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">رصيد الحصالة الحالي (في غرفتك) 🏡</p>
              <p className="text-lg font-black text-amber-600 dark:text-amber-400 font-sans mt-0.5">
                {formatCurrency(targetGoal ? targetGoal.currentAmount : 0, currency)}
              </p>
              <p className="text-[9px] text-slate-400 font-bold mt-1">
                إجمالي التوفير التلقائي: <span className="font-sans text-emerald-600 dark:text-emerald-400 font-bold">{formatCurrency(totalSavedViaRoundUp, currency)}</span> (من {roundUpTransactions.length} عملية تقريب)
              </p>
            </div>
          </div>

          {/* Value of faka advice */}
          <div className="p-4 bg-blue-50/40 dark:bg-blue-950/10 border border-blue-500/10 rounded-2xl flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
              <Info size={16} />
            </div>
            <div className="flex-1 text-right">
              <p className="text-[10px] text-slate-850 dark:text-slate-200 font-bold">قوة الفكة والادخار التراكمي</p>
              <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                تظهر الأبحاث المالية للأسرة التونسية أن تقريب فكة العملات يومياً يفرز بين <span className="font-bold text-primary-500">15 إلى 45 دينار شهرياً</span> دون أي إحساس بالضغط المالي! هذا كافٍ تماماً لتأمين مصاريف أسبوع كامل من حفاضات الأطفال أو الحليب أو صندوق الطوارئ.
              </p>
            </div>
          </div>

        </div>

        {/* List of recent round-ups */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
            <span>آخر 5 معاملات تقريب تلقائي</span>
            <span className="font-mono">{roundUpTransactions.length} عمليات كلية</span>
          </div>

          {roundUpTransactions.length === 0 ? (
            <div className="p-6 bg-slate-50/50 dark:bg-slate-900/10 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center">
              <p className="text-[10px] text-slate-400 font-bold">لم يتم تسجيل أي عمليات تقريب بعد.</p>
              <p className="text-[9px] text-slate-450 dark:text-slate-500 mt-1">ستظهر هنا فكة النفقات بمجرد تفعيل الخدمة وإضافة مصروفاتك.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {roundUpTransactions.slice(0, 5).map((tx) => (
                <div 
                  key={tx.id} 
                  className="px-3 py-2 bg-white dark:bg-slate-900/60 border border-slate-150 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-slate-700 dark:text-slate-350 font-bold truncate max-w-[220px]">
                      {tx.note || 'تقريب معاملة تلقائي'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-[9px] text-slate-400">
                      {tx.date}
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-black">
                      +{formatCurrency(tx.amount, currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoundUpManager;
