import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Check } from 'lucide-react';
import { formatCurrency, cn, hapticFeedback } from '../../utils';
import { DynamicIcon } from '../DynamicIcon';
import { Account } from '../../types';

interface AccountSelectionModalProps {
  activeView: 'account' | 'toAccount';
  bgColor: string;
  accounts: Account[];
  accountId: string;
  setAccountId: (id: string) => void;
  toAccountId: string;
  setToAccountId: (id: string) => void;
  currency: string;
  setActiveView: (view: 'main' | 'category' | 'account' | 'toAccount' | 'details') => void;
}

export const AccountSelectionModal: React.FC<AccountSelectionModalProps> = ({
  activeView,
  bgColor,
  accounts,
  accountId,
  setAccountId,
  toAccountId,
  setToAccountId,
  currency,
  setActiveView,
}) => {
  return (
    <motion.div 
      initial={{ x: '100%', opacity: 0.5 }} 
      animate={{ x: 0, opacity: 1 }} 
      exit={{ x: '100%', opacity: 0.5 }} 
      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
      className="absolute inset-0 bg-white dark:bg-slate-900 z-10 flex flex-col"
    >
      <div className={cn("flex items-center p-4 text-white shrink-0 pt-[env(safe-area-inset-top)]", bgColor)}>
        <button onClick={() => { hapticFeedback('light'); setActiveView('main'); }} className="p-2 hover:bg-white/10 rounded-full transition-colors mr-2">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-lg font-bold">{activeView === 'account' ? 'اختر الحساب' : 'إلى حساب'}</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        {accounts.map((acc) => (
          <button
            key={acc.id}
            onClick={() => { 
              hapticFeedback('light');
              if (activeView === 'account') setAccountId(acc.id);
              else setToAccountId(acc.id);
              setActiveView('main'); 
            }}
            className="w-full flex items-center p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 hover:border-indigo-500 transition-colors bg-slate-50 dark:bg-slate-800/50"
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white ml-4" style={{ backgroundColor: acc.color }}>
              <DynamicIcon name={acc.icon || 'Wallet'} size={24} />
            </div>
            <div className="flex flex-col items-start flex-1">
              <span className="font-bold text-slate-900 dark:text-white">{acc.name}</span>
              <span className="text-xs text-slate-500">{formatCurrency(acc.balance, currency)}</span>
            </div>
            {(activeView === 'account' ? accountId : toAccountId) === acc.id && (
              <Check className="text-indigo-500" size={24} />
            )}
          </button>
        ))}
      </div>
    </motion.div>
  );
};
