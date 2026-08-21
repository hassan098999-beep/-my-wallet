import React from 'react';
import { Lightbulb, Wand2, Loader2 } from 'lucide-react';

interface BudgetAutoTuneProps {
  suggestFromHistory: () => void;
  autoAllocate: () => void;
  isGenerating: boolean;
  globalBudget: string;
}

export const BudgetAutoTune: React.FC<BudgetAutoTuneProps> = ({
  suggestFromHistory,
  autoAllocate,
  isGenerating,
  globalBudget,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
      <button 
        type="button"
        onClick={suggestFromHistory}
        disabled={isGenerating}
        className="flex items-center gap-1.5 text-[11px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 px-3.5 py-1.5 rounded-xl border border-blue-500/10 disabled:opacity-50 active:scale-95 transition-all cursor-pointer shadow-2xs"
      >
        {isGenerating ? <Loader2 size={13} className="animate-spin" /> : <Lightbulb size={13} />}
        <span>اقتراح من تاريخ الإنفاق</span>
      </button>

      <button 
        type="button"
        onClick={autoAllocate}
        disabled={isGenerating || !globalBudget}
        className="flex items-center gap-1.5 text-[11px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-3.5 py-1.5 rounded-xl border border-emerald-500/10 disabled:opacity-50 active:scale-95 transition-all cursor-pointer shadow-2xs"
      >
        {isGenerating ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
        <span>توزيع ذكي متوازن</span>
      </button>
    </div>
  );
};

export default BudgetAutoTune;
