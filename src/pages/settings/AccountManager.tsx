import React, { useState } from 'react';
import { useAppContext } from '../../store/AppContext';
import { Wallet, Plus, Trash, Pencil, ArrowRightLeft } from 'lucide-react';
import { DynamicIcon } from '../../components/DynamicIcon';
import { IconSelect } from '../../components/IconSelect';
import { formatCurrency, hapticFeedback } from '../../utils';
import { motion, AnimatePresence } from 'motion/react';

const AccountManager = () => {
  const { accounts, addAccount, updateAccount, deleteAccount, transferAccount, currency } = useAppContext();
  const [newAccName, setNewAccName] = useState('');
  const [newAccBalance, setNewAccBalance] = useState('');
  const [newAccColor, setNewAccColor] = useState('#10b981');
  const [newAccIcon, setNewAccIcon] = useState('Wallet');
  const [editingAccId, setEditingAccId] = useState<string | null>(null);
  const [editingAccBalance, setEditingAccBalance] = useState('');
  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');

  const availableIcons = ['Wallet', 'CreditCard', 'Smartphone', 'Banknote', 'Building2', 'Briefcase'];

  const handleAddAccount = () => {
    if (newAccName.trim() && newAccBalance.trim()) {
      hapticFeedback('success');
      addAccount({ name: newAccName, balance: Number(newAccBalance), color: newAccColor, icon: newAccIcon });
      setNewAccName('');
      setNewAccBalance('');
    }
  };

  const handleTransfer = () => {
    if (transferFrom && transferTo && transferFrom !== transferTo && transferAmount && !isNaN(Number(transferAmount))) {
      hapticFeedback('medium');
      transferAccount(transferFrom, transferTo, Number(transferAmount));
      setTransferFrom('');
      setTransferTo('');
      setTransferAmount('');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 md:space-y-6"
    >
      <motion.div variants={itemVariants} className="glass-card p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500 shadow-inner">
            <Wallet className="size-4 md:size-5" />
          </div>
          <h2 className="text-sm md:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">إضافة حساب جديد</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 items-end">
          <div className="space-y-1 md:space-y-2">
            <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest px-1">اسم الحساب</label>
            <input type="text" value={newAccName} onChange={(e) => setNewAccName(e.target.value)} className="w-full px-3 py-2 md:px-4 md:py-3 rounded-xl md:rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-bold text-xs md:text-sm shadow-sm outline-none focus:border-primary-500 transition-all" placeholder="مثال: كاش" />
          </div>
          <div className="space-y-1 md:space-y-2">
            <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest px-1">الرصيد</label>
            <input type="number" step="0.001" value={newAccBalance} onChange={(e) => setNewAccBalance(e.target.value)} className="w-full px-3 py-2 md:px-4 md:py-3 rounded-xl md:rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-bold text-xs md:text-sm shadow-sm outline-none focus:border-primary-500 transition-all" placeholder="0.000" />
          </div>
          <div className="space-y-1 md:space-y-2">
            <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest px-1">الأيقونة</label>
            <IconSelect value={newAccIcon} onChange={setNewAccIcon} availableIcons={availableIcons} className="w-full !h-[38px] md:!h-[48px] rounded-xl md:rounded-2xl" />
          </div>
          <div className="space-y-1 md:space-y-2">
            <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest px-1">اللون</label>
            <input type="color" value={newAccColor} onChange={(e) => setNewAccColor(e.target.value)} className="w-full h-[38px] md:h-[48px] rounded-xl md:rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 cursor-pointer p-1 md:p-1.5 bg-white/50 dark:bg-slate-800/50 shadow-sm" />
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAddAccount} 
            className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 md:py-3 rounded-xl md:rounded-2xl font-black transition-all shadow-md shadow-primary-500/20 flex items-center justify-center gap-2 h-[38px] md:h-[48px] uppercase tracking-widest text-xs md:text-sm"
          >
            إضافة
          </motion.button>
        </div>
      </motion.div>

      <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <AnimatePresence mode="popLayout">
          {accounts.map((acc) => (
            <motion.div 
              key={acc.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center justify-between p-3 md:p-4 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 shadow-sm hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-2 md:gap-3">
                <motion.div 
                  whileHover={{ rotate: 15 }}
                  className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg" 
                  style={{ backgroundColor: acc.color }}
                >
                  <DynamicIcon name={acc.icon || 'Wallet'} className="size-4 md:size-5" />
                </motion.div>
                <div className="flex flex-col">
                  <p className="font-black text-sm md:text-base text-slate-900 dark:text-white">{acc.name}</p>
                  {editingAccId === acc.id ? (
                    <input type="number" step="0.001" value={editingAccBalance} onChange={(e) => setEditingAccBalance(e.target.value)} onBlur={() => {updateAccount(acc.id, { balance: Number(editingAccBalance) }); setEditingAccId(null)}} autoFocus className="w-24 md:w-28 px-2 py-1 md:px-3 md:py-1.5 mt-1 rounded-lg md:rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs md:text-sm font-bold font-mono outline-none" />
                  ) : (
                    <p className="font-mono text-[10px] md:text-xs font-bold text-slate-500">{formatCurrency(acc.balance, currency)}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-0.5 md:gap-1">
                <button onClick={() => {setEditingAccId(acc.id); setEditingAccBalance(acc.balance.toString())}} className="p-1 md:p-1.5 text-slate-400 hover:text-primary-500"><Pencil className="size-3.5 md:size-4" /></button>
                <button onClick={() => { hapticFeedback('warning'); deleteAccount(acc.id); }} className="p-1 md:p-1.5 text-rose-400 hover:text-rose-600"><Trash className="size-3.5 md:size-4" /></button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-inner">
            <ArrowRightLeft className="size-4 md:size-5" />
          </div>
          <h2 className="text-sm md:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">تحويل بين الحسابات</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 items-end">
          <select value={transferFrom} onChange={(e) => setTransferFrom(e.target.value)} className="w-full px-3 py-2 md:px-4 md:py-3 rounded-xl md:rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs md:text-sm font-bold shadow-sm outline-none focus:border-indigo-500 transition-all">
            <option value="">من حساب</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select value={transferTo} onChange={(e) => setTransferTo(e.target.value)} className="w-full px-3 py-2 md:px-4 md:py-3 rounded-xl md:rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs md:text-sm font-bold shadow-sm outline-none focus:border-indigo-500 transition-all">
            <option value="">إلى حساب</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <input type="number" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} placeholder="المبلغ" className="w-full px-3 py-2 md:px-4 md:py-3 rounded-xl md:rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs md:text-sm font-bold shadow-sm outline-none focus:border-indigo-500 transition-all" />
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleTransfer} 
            className="bg-primary-600 hover:bg-primary-700 text-white py-2 md:py-3 rounded-xl md:rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest shadow-lg shadow-primary-500/20 h-[38px] md:h-[48px]"
          >
            تحويل
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AccountManager;
