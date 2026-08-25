import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Baby, Calculator, Sparkles, Check, Heart, Plus, ShieldCheck, 
  ChevronDown, ChevronUp, AlertCircle, ShoppingBag, Stethoscope, 
  Package, Info, ArrowUpRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppContext } from '../../store/AppContext';
import { formatCurrency, hapticFeedback, cn, getBudgetMonth } from '../../utils';

interface BabyBudgetAssistantProps {
  selectedMonth: string;
  onBudgetApplied?: (catId: string, amount: number) => void;
}

export const BabyBudgetAssistant: React.FC<BabyBudgetAssistantProps> = ({
  selectedMonth,
  onBudgetApplied,
}) => {
  const { 
    categories, 
    expenses, 
    accounts, 
    budgets, 
    firstDayOfMonth, 
    currency, 
    addExpense, 
    setBudget 
  } = useAppContext();

  const [isOpen, setIsOpen] = useState(false);

  // Find Baby Category in state
  const babyCategory = useMemo(() => {
    return categories.find(c => 
      c.id === '2' || 
      c.name === 'لوازم ومصروف الرضيع' || 
      c.name.toLowerCase().includes('baby') || 
      c.name.includes('رضيع') || 
      c.name.includes('طفل') ||
      c.name.includes('أطفال')
    ) || categories[0];
  }, [categories]);

  // Account fallback
  const defaultAccount = useMemo(() => {
    return accounts?.[0] || { id: 'cash', name: 'نقداً / كاش' };
  }, [accounts]);

  const currentBudget = useMemo(() => {
    return budgets?.find(b => b.month === selectedMonth) || null;
  }, [budgets, selectedMonth]);

  // Expenses for the selected month under baby category
  const babyExpenses = useMemo(() => {
    return expenses.filter(e => 
      !e.isTransfer && 
      e.categoryId === babyCategory?.id && 
      e.date && 
      e.date.startsWith(selectedMonth)
    );
  }, [expenses, babyCategory, selectedMonth]);

  const totalSpent = useMemo(() => {
    return babyExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [babyExpenses]);

  const categoryBudget = useMemo(() => {
    if (!currentBudget || !currentBudget.categoryBudgets || !babyCategory) return 0;
    return Number(currentBudget.categoryBudgets[babyCategory.id]) || 0;
  }, [currentBudget, babyCategory]);

  // Classify baby expenses
  const classified = useMemo(() => {
    let diapers = 0;
    let milk = 0;
    let healthcare = 0;
    let clothing = 0;

    babyExpenses.forEach(e => {
      const note = (e.note || '').toLowerCase();
      const isDiapers = note.includes('حفاظ') || note.includes('حفاض') || note.includes('كوش') || 
                        note.includes('diaper') || note.includes('pampers') || note.includes('peaudouce') || 
                        note.includes('libero') || note.includes('بامبرز');
      const isMilk = note.includes('حليب') || note.includes('نيدو') || note.includes('بريمالاك') || 
                     note.includes('ابتاميل') || note.includes('غذاء') || note.includes('سيريال') || 
                     note.includes('milk') || note.includes('formula') || note.includes('aptamil') || 
                     note.includes('بيوميل') || note.includes('رينولاك');
      const isHealth = note.includes('طبيب') || note.includes('دواء') || note.includes('تلقيح') || 
                       note.includes('مرطب') || note.includes('زيت') || note.includes('شامبو') || 
                       note.includes('فيزيتا') || note.includes('دكتور') || note.includes('صيدلية') || 
                       note.includes('لقاح') || note.includes('physio') || note.includes('فيزيول');

      if (isDiapers) diapers += e.amount;
      else if (isMilk) milk += e.amount;
      else if (isHealth) healthcare += e.amount;
      else clothing += e.amount;
    });

    return { diapers, milk, healthcare, clothing };
  }, [babyExpenses]);

  // Calculator state
  const [diaperPacks, setDiaperPacks] = useState(3);
  const [diaperPrice, setDiaperPrice] = useState(36);
  const [milkTins, setMilkTins] = useState(4);
  const [milkPrice, setMilkPrice] = useState(26);
  const [healthcareBuffer, setHealthcareBuffer] = useState(40);
  const [clothingBuffer, setClothingBuffer] = useState(30);

  const calculatedTotal = useMemo(() => {
    return (diaperPacks * diaperPrice) + (milkTins * milkPrice) + healthcareBuffer + clothingBuffer;
  }, [diaperPacks, diaperPrice, milkTins, milkPrice, healthcareBuffer, clothingBuffer]);

  // Apply calculated total to budget
  const handleApplyToBudget = () => {
    hapticFeedback('success');
    if (!currentBudget || !babyCategory) return;

    const currentCatBudgets = currentBudget.categoryBudgets || {};
    const updated = {
      ...currentCatBudgets,
      [babyCategory.id]: calculatedTotal
    };

    setBudget({
      ...currentBudget,
      categoryBudgets: updated
    });

    if (onBudgetApplied) {
      onBudgetApplied(babyCategory.id, calculatedTotal);
    }

    toast.success(
      <div className="flex flex-col gap-1 text-right font-tajawal">
        <span className="font-black text-sm">تم تحديث ميزانية الرضيع بنجاح! 🍼✨</span>
        <span className="text-xs opacity-90">السقف المالي الجديد: {formatCurrency(calculatedTotal, currency)}</span>
      </div>,
      { duration: 4000 }
    );
  };

  // Quick Log Item
  const handleQuickLog = (item: { name: string; amount: number; note: string }) => {
    hapticFeedback('medium');
    let savedPaymentMethod: any = 'cash';
    try {
      const raw = localStorage.getItem('masarifi_last_used');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.paymentMethod) savedPaymentMethod = parsed.paymentMethod;
      }
    } catch (e) {
      console.error(e);
    }

    addExpense({
      amount: item.amount,
      categoryId: babyCategory.id,
      accountId: defaultAccount.id,
      date: new Date().toISOString().substring(0, 10),
      note: item.note,
      paymentMethod: savedPaymentMethod
    });

    toast.success(
      <div className="flex flex-col gap-1 text-right font-tajawal">
        <span className="font-bold text-sm">تم تسجيل مصروف الرضيع 👶</span>
        <span className="text-xs opacity-90">{item.name} بمبلغ {formatCurrency(item.amount, currency)}</span>
      </div>,
      { duration: 3000 }
    );
  };

  const quickLogItems = [
    { name: 'باكيت حفاضات جامبو', amount: 36, note: 'شراء حفاضات للرضيع 🧷' },
    { name: 'علبة حليب رضع', amount: 26, note: 'علبة حليب للرضيع 🍼' },
    { name: 'زيارة طبيب الأطفال', amount: 60, note: 'معاينة طبيب الأطفال 🩺' },
    { name: 'سيروم فيزيولوجي ونظافة', amount: 12, note: 'مستلزمات صحية ونظافة 🧴' },
    { name: 'لهاية وألعاب معقمة', amount: 15, note: 'ألعاب ولهاية 🧸' }
  ];

  const percentage = categoryBudget > 0 ? (totalSpent / categoryBudget) * 100 : 0;
  const isOver = categoryBudget > 0 && totalSpent > categoryBudget;

  return (
    <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 dark:border-emerald-500/10 rounded-3xl p-4 md:p-6 shadow-sm overflow-hidden relative text-right">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
            <Baby size={24} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                حاسبة ومساعد ميزانية الرضيع والطفل 🍼
              </h3>
              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-full">
                ذكي وتلقائي
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              تقدير دقيق لتكاليف الحفاضات، الحليب، الرعاية الطبية مع إمكانية التثبيت الفوري في الميزانية
            </p>
          </div>
        </div>

        {/* Quick KPI & Toggle Button */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-xl text-right">
            <span className="text-[9px] font-bold text-slate-400 block">المصروف / السقف</span>
            <span className="text-xs font-black font-mono text-slate-800 dark:text-slate-200">
              {formatCurrency(totalSpent, currency)} / {formatCurrency(categoryBudget, currency)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              hapticFeedback('light');
              setIsOpen(!isOpen);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <Calculator size={14} />
            <span>{isOpen ? 'إخفاء الحاسبة' : 'فتح الحاسبة والمستلزمات'}</span>
            {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Progress Track */}
      <div className="mt-3 space-y-1">
        <div className="flex justify-between items-center text-[10px] font-bold">
          <span className={isOver ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'}>
            {categoryBudget > 0 ? (
              isOver 
                ? `⚠️ تم تجاوز السقف المحدد بمقدار ${formatCurrency(totalSpent - categoryBudget, currency)}`
                : `المتبقي للرضيع: ${formatCurrency(categoryBudget - totalSpent, currency)} (${Math.round(100 - percentage)}%)`
            ) : 'لم يتم تحديد سقف ميزانية للرضيع بعد'}
          </span>
          <span className="font-mono text-slate-700 dark:text-slate-300">
            {categoryBudget > 0 ? `${Math.round(percentage)}%` : '0%'}
          </span>
        </div>
        <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, percentage)}%` }}
            className={cn(
              "h-full rounded-full transition-all",
              isOver ? "bg-rose-500" : percentage > 85 ? "bg-amber-500" : "bg-emerald-500"
            )}
          />
        </div>
      </div>

      {/* Expandable Calculator & Quick Logs */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6 pt-6 border-t border-emerald-500/20 space-y-6"
          >
            {/* 1. Interactive Needs Formula */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Sparkles size={14} className="text-emerald-500" />
                  <span>حاسبة الاحتياجات الشهرية للرضيع (تقدير واقعي)</span>
                </h4>
                <span className="text-[10px] text-slate-400 font-bold">معدل الاستهلاك التونسي القياسي</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Diapers */}
                <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs font-black text-slate-800 dark:text-white">
                    <span>🧷 الحفاضات (الكوش)</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(diaperPacks * diaperPrice, currency)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div>
                      <span className="text-slate-400 block mb-0.5">عدد الباكيات:</span>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={diaperPacks}
                        onChange={(e) => setDiaperPacks(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 font-mono font-bold text-center outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">سعر الباكية:</span>
                      <input
                        type="number"
                        value={diaperPrice}
                        onChange={(e) => setDiaperPrice(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 font-mono font-bold text-center outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Milk */}
                <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs font-black text-slate-800 dark:text-white">
                    <span>🍼 الحليب والغذاء</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(milkTins * milkPrice, currency)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div>
                      <span className="text-slate-400 block mb-0.5">عدد العلب:</span>
                      <input
                        type="number"
                        min="0"
                        max="12"
                        value={milkTins}
                        onChange={(e) => setMilkTins(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 font-mono font-bold text-center outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-0.5">سعر العلبة:</span>
                      <input
                        type="number"
                        value={milkPrice}
                        onChange={(e) => setMilkPrice(Math.max(0, Number(e.target.value)))}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 font-mono font-bold text-center outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Healthcare Buffer */}
                <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs font-black text-slate-800 dark:text-white">
                    <span>🩺 الطبيب والتلقيح</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(healthcareBuffer, currency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">هامش الزيارات والأدوية:</span>
                    <input
                      type="number"
                      value={healthcareBuffer}
                      onChange={(e) => setHealthcareBuffer(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 font-mono font-bold text-center outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>
                </div>

                {/* Clothing & Hygiene */}
                <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs font-black text-slate-800 dark:text-white">
                    <span>🧴 النظافة والملابس</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(clothingBuffer, currency)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">مستلزمات متفرقة:</span>
                    <input
                      type="number"
                      value={clothingBuffer}
                      onChange={(e) => setClothingBuffer(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 font-mono font-bold text-center outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Calculator Output & Apply Action */}
              <div className="mt-3 p-3.5 bg-emerald-600 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3 text-right">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold opacity-90 block">المجموع التقديري لميزانية الرضيع الشهرية:</span>
                    <h3 className="text-xl font-black font-mono">
                      {formatCurrency(calculatedTotal, currency)}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleApplyToBudget}
                  className="w-full sm:w-auto bg-white text-emerald-700 hover:bg-slate-100 px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Check size={14} />
                  <span>اعتماد كميزانية رسمية لفئة الرضيع</span>
                </button>
              </div>
            </div>

            {/* 2. Quick Log Shortcuts */}
            <div>
              <h4 className="text-xs font-black text-slate-800 dark:text-white mb-2.5 flex items-center gap-1.5">
                <ShoppingBag size={14} className="text-indigo-500" />
                <span>تسجيل سريع لمشتريات الرضيع المتكررة (ضغطة واحدة):</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {quickLogItems.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickLog(item)}
                    className="p-2.5 bg-white dark:bg-slate-900 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 border border-slate-200/80 dark:border-slate-800 rounded-xl text-right transition-all group cursor-pointer active:scale-95 flex flex-col justify-between"
                  >
                    <span className="text-[11px] font-black text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 line-clamp-1">
                      {item.name}
                    </span>
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-mono font-bold text-slate-500">
                        {formatCurrency(item.amount, currency)}
                      </span>
                      <Plus size={12} className="text-emerald-600" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Classified Spending Distribution */}
            {totalSpent > 0 && (
              <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-[11px] space-y-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  توزيع ما تم صرفه هذا الشهر ({formatCurrency(totalSpent, currency)}):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 text-[9px] block">حفاضات:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatCurrency(classified.diapers, currency)}</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 text-[9px] block">حليب وغذاء:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatCurrency(classified.milk, currency)}</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 text-[9px] block">طبيب وصحة:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatCurrency(classified.healthcare, currency)}</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 text-[9px] block">ملابس ونظافة:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatCurrency(classified.clothing, currency)}</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BabyBudgetAssistant;
