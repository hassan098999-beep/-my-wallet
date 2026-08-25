import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  ShoppingBag, Sparkles, Utensils, Apple, 
  Beef, PackageCheck, Lightbulb, Calculator, 
  Check, ArrowRight
} from 'lucide-react';
import { formatCurrency, hapticFeedback, cn } from '../../utils';

interface WeeklyMarketBasketPlannerProps {
  currency: string;
}

export const WeeklyMarketBasketPlanner: React.FC<WeeklyMarketBasketPlannerProps> = ({ currency }) => {
  // Weekly items budget simulation
  const [veggiesFruits, setVeggiesFruits] = useState<number>(45);
  const [meatPoultryFish, setMeatPoultryFish] = useState<number>(65);
  const [groceriesDairy, setGroceriesDairy] = useState<number>(40);
  const [cleaningHousehold, setCleaningHousehold] = useState<number>(20);

  const weeklyTotal = useMemo(() => {
    return veggiesFruits + meatPoultryFish + groceriesDairy + cleaningHousehold;
  }, [veggiesFruits, meatPoultryFish, groceriesDairy, cleaningHousehold]);

  const monthlyEstimate = useMemo(() => {
    return Math.round(weeklyTotal * 4.333);
  }, [weeklyTotal]);

  const tips = [
    '🥬 شراء الخضار والغلال من الأسواق الأسبوعية (المرشي البلدي) يوفر ما بين 20% و30% مقارنة بالمحلات الصغرى.',
    '🍗 شراء الدجاج الكامل وتقطيعه منزلياً أكثر اقتصاداً بكثير من شراء قطع الإسكالوب المفردة.',
    '📦 تخصيص يوم محدد في الأسبوع للقفة يحد من عمليات الشراء العشوائية اليومية.'
  ];

  return (
    <div className="space-y-4 text-right" dir="rtl">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ShoppingBag size={18} className="text-teal-500" />
            <span>مخطط وحاسبة قفة السوق الأسبوعية (مرشي الأسبوع)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            محاكاة دقيقة لتكاليف التموين الأسبوعي مع ترجمتها الفورية إلى الميزانية الشهرية
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 md:p-6 shadow-2xs space-y-6">
        {/* Sliders Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Item 1 */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/60 space-y-2">
            <div className="flex justify-between items-center text-xs font-black">
              <span className="text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Apple size={14} className="text-emerald-500" />
                <span>خضار وغلال طازجة</span>
              </span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">
                {formatCurrency(veggiesFruits, currency)}
              </span>
            </div>
            <input
              type="range"
              min="20"
              max="150"
              step="5"
              value={veggiesFruits}
              onChange={(e) => setVeggiesFruits(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <span className="text-[9px] text-slate-400 block font-medium">طماطم، فلفل، بطاطا، غلال الموسم</span>
          </div>

          {/* Item 2 */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/60 space-y-2">
            <div className="flex justify-between items-center text-xs font-black">
              <span className="text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Beef size={14} className="text-rose-500" />
                <span>لحوم، دواجن وأسماك</span>
              </span>
              <span className="font-mono text-rose-600 dark:text-rose-400">
                {formatCurrency(meatPoultryFish, currency)}
              </span>
            </div>
            <input
              type="range"
              min="30"
              max="200"
              step="5"
              value={meatPoultryFish}
              onChange={(e) => setMeatPoultryFish(Number(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer"
            />
            <span className="text-[9px] text-slate-400 block font-medium">دجاج، اسكالوب، لحم علوش، حوت</span>
          </div>

          {/* Item 3 */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/60 space-y-2">
            <div className="flex justify-between items-center text-xs font-black">
              <span className="text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Utensils size={14} className="text-amber-500" />
                <span>بقالة ومواد غذائية</span>
              </span>
              <span className="font-mono text-amber-600 dark:text-amber-400">
                {formatCurrency(groceriesDairy, currency)}
              </span>
            </div>
            <input
              type="range"
              min="15"
              max="120"
              step="5"
              value={groceriesDairy}
              onChange={(e) => setGroceriesDairy(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <span className="text-[9px] text-slate-400 block font-medium">حليب، بيض، زيت، فارينة، مقرونة</span>
          </div>

          {/* Item 4 */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/60 space-y-2">
            <div className="flex justify-between items-center text-xs font-black">
              <span className="text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <PackageCheck size={14} className="text-indigo-500" />
                <span>منظفات ومستلزمات منزل</span>
              </span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400">
                {formatCurrency(cleaningHousehold, currency)}
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="80"
              step="5"
              value={cleaningHousehold}
              onChange={(e) => setCleaningHousehold(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <span className="text-[9px] text-slate-400 block font-medium">صابون، جافيل، مستلزمات نظافة</span>
          </div>
        </div>

        {/* Calculation Result Banner */}
        <div className="p-4 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Calculator size={24} />
            </div>
            <div>
              <span className="text-[10px] font-bold opacity-90 block">تكلفة قفة الأسبوع المقدرة:</span>
              <h4 className="text-xl font-black font-mono">
                {formatCurrency(weeklyTotal, currency)} / أسبوعياً
              </h4>
            </div>
          </div>

          <div className="text-center md:text-left bg-black/15 px-4 py-2 rounded-xl backdrop-blur-xs">
            <span className="text-[10px] font-bold opacity-80 block">المعادل التقديري الشهري للقفة:</span>
            <span className="text-lg font-black font-mono text-emerald-200">
              ~ {formatCurrency(monthlyEstimate, currency)} / شهرياً
            </span>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="space-y-1.5 pt-2">
          <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Lightbulb size={13} className="text-amber-500" />
            <span>إرشادات عملية لتوفير قفة السوق التونسية:</span>
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            {tips.map((t, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800">
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyMarketBasketPlanner;
