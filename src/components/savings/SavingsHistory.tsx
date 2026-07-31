import React from 'react';
import { formatCurrency } from '../../utils';
import { Expense } from '../../types';

interface SavingsHistoryProps {
  history: Expense[];
  currency: string;
}

export const SavingsHistory: React.FC<SavingsHistoryProps> = ({ history, currency }) => {
  if (!history || history.length === 0) return null;

  return (
    <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800/40 text-right">
      <span className="text-[10px] font-black text-slate-400 block mb-1">سجل الحركات الأخيرة للحصالة 📜</span>
      <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
        {history.map((hist) => (
          <div key={hist.id} className="flex justify-between items-center bg-slate-100/30 dark:bg-slate-950/20 p-2 rounded-lg text-[10px]">
            <div className="text-right">
              <span className="font-black text-slate-700 dark:text-slate-300 block">{hist.note}</span>
              <span className="text-[8px] text-slate-400">{hist.date}</span>
            </div>
            <span className="font-mono font-black text-amber-600 dark:text-amber-400">
              + {formatCurrency(hist.amount, currency)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SavingsHistory;
