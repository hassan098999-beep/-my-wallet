import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, Lightbulb, Wand2, Loader2, Sparkles } from 'lucide-react';

interface BudgetAutoTuneProps {
  showRuleInfo: boolean;
  setShowRuleInfo: React.Dispatch<React.SetStateAction<boolean>>;
  suggestFromHistory: () => void;
  autoAllocate: () => void;
  isGenerating: boolean;
  globalBudget: string;
}

export const BudgetAutoTune: React.FC<BudgetAutoTuneProps> = ({
  showRuleInfo,
  setShowRuleInfo,
  suggestFromHistory,
  autoAllocate,
  isGenerating,
  globalBudget,
}) => {
  return (
    <div className="flex flex-col gap-4 w-full md:w-auto">
      {/* Quick Allocator and Information clicker */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setShowRuleInfo(!showRuleInfo)}
          className="flex items-center gap-1 text-[11px] font-bold text-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/10 px-3 py-1.5 rounded-lg border border-indigo-150/15 cursor-pointer"
        >
          <HelpCircle size={13} />
          <span>شرح قاعدة 50/30/20</span>
        </button>
        
        <button 
          type="button"
          onClick={suggestFromHistory}
          disabled={isGenerating}
          className="flex items-center gap-1 text-[11px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 px-4 py-1.5 rounded-lg border border-blue-500/10 disabled:opacity-50 active:scale-95 transition-all cursor-pointer"
        >
          {isGenerating ? <Loader2 size={13} className="animate-spin" /> : <Lightbulb size={13} />}
          اقتراح من التاريخ
        </button>

        <button 
          type="button"
          onClick={autoAllocate}
          disabled={isGenerating || !globalBudget}
          className="flex items-center gap-1 text-[11px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-4 py-1.5 rounded-lg border border-emerald-500/10 disabled:opacity-50 active:scale-95 transition-all cursor-pointer"
        >
          {isGenerating ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
          توزيع تلقائي للمخصصات
        </button>
      </div>

      {/* 50/30/20 explanation panel */}
      <AnimatePresence>
        {showRuleInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-850 rounded-2xl p-4 space-y-2 text-xs leading-relaxed w-full"
          >
            <p className="font-black text-slate-800 dark:text-white text-xs flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-500" />
              ما هي قاعدة الميزانية المثالية 50/30/20؟
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
              قاعدة مالية بسيطة وفعالة تقسم دخلك أو ميزانيتك الكلية إلى ثلاثة روافد لتضمن العيش السليم وتجنّب الديون والاستهلاك السلبي لـ قفة العائلة:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="p-3 bg-red-50/50 dark:bg-red-950/10 rounded-xl border border-red-100/30">
                <p className="font-black text-red-600 dark:text-red-400 flex items-center gap-1">%50 للاحتياجات الأساسية</p>
                <p className="text-[10px] text-slate-400 mt-1 font-medium">كل المصاريف الحتمية التي لا مفر منها للمعيشة اليومية لتسيير حياتك بسلاسة.</p>
              </div>
              <div className="p-3 bg-amber-50/50 dark:bg-amber-950/10 rounded-xl border border-amber-100/30">
                <p className="font-black text-amber-600 dark:text-amber-400 flex items-center gap-1">%30 للرغبات والكماليات</p>
                <p className="text-[10px] text-slate-400 mt-1 font-medium font-tajawal">النشاطات الترفيهية، الشوبينغ، القهوة والموائد الخارجية والأشياء التي تحبها.</p>
              </div>
              <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-xl border border-emerald-100/30">
                <p className="font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">%20 للإدخار والاستثمار المستقبل</p>
                <p className="text-[10px] text-slate-400 mt-1 font-medium leading-relaxed">بناء الوسادة الطارئة، الاستثمار العقلي أو تزويد حصالة الأهداف والتحصين المالي.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BudgetAutoTune;
