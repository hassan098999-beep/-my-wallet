import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  HandCoins, 
  Plus, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Scale, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Users, 
  Filter,
  Search
} from 'lucide-react';

import { useAppContext } from '../store/AppContext';
import { Debt, DebtDirection, DebtPayment } from '../types';
import { formatCurrency, hapticFeedback } from '../utils';

import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import EmptyState from '../components/ui/EmptyState';
import { DebtCard } from '../components/debts/DebtCard';
import { DebtFormModal } from '../components/debts/DebtFormModal';
import { DebtPaymentModal } from '../components/debts/DebtPaymentModal';

const DebtsPage: React.FC = () => {
  const { 
    debts = [], 
    addDebt, 
    updateDebt, 
    addDebtPayment, 
    deleteDebt, 
    currency, 
    accounts = [] 
  } = useAppContext();

  const [activeTab, setActiveTab] = useState<DebtDirection>('owed_to_me');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [payingDebt, setPayingDebt] = useState<Debt | null>(null);
  const [isSettledSectionOpen, setIsSettledSectionOpen] = useState(false);

  // Summary statistics calculations
  const stats = useMemo(() => {
    const totalOwedToMe = debts
      .filter(d => d.direction === 'owed_to_me' && !d.isSettled)
      .reduce((sum, d) => sum + (Number(d.remainingAmount) || 0), 0);

    const totalIOwe = debts
      .filter(d => d.direction === 'i_owe' && !d.isSettled)
      .reduce((sum, d) => sum + (Number(d.remainingAmount) || 0), 0);

    const netBalance = totalOwedToMe - totalIOwe;

    const settledCount = debts.filter(d => d.isSettled).length;

    return { totalOwedToMe, totalIOwe, netBalance, settledCount };
  }, [debts]);

  // Filtered lists for the active tab
  const currentTabDebts = useMemo(() => {
    return debts.filter(d => {
      const matchesTab = d.direction === activeTab;
      const matchesSearch = searchQuery.trim() === '' 
        || d.personName.toLowerCase().includes(searchQuery.toLowerCase())
        || (d.note && d.note.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesTab && matchesSearch;
    });
  }, [debts, activeTab, searchQuery]);

  const activeDebts = useMemo(() => {
    return currentTabDebts.filter(d => !d.isSettled);
  }, [currentTabDebts]);

  const settledDebts = useMemo(() => {
    return currentTabDebts.filter(d => d.isSettled);
  }, [currentTabDebts]);

  // Form submission handler
  const handleDebtFormSubmit = (data: {
    personName: string;
    direction: DebtDirection;
    totalAmount: number;
    dueDate?: string;
    note?: string;
    accountId?: string;
  }) => {
    if (editingDebt) {
      updateDebt(editingDebt.id, data);
      setEditingDebt(null);
    } else {
      addDebt(data);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 w-full max-w-full p-4 pb-32 relative"
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-emerald-500/5 blur-[100px]" />
        <div className="absolute bottom-[20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px]" />
      </div>

      {/* Header */}
      <PageHeader
        title="الديون والقروض الشخصية"
        subtitle="تتبع المستحقات والالتزامات المالية بدقة وسهولة، ونظم مواعيد السداد"
      />

      {/* Top Summary Balance Deck */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Owed To Me */}
        <Card className="border-emerald-200/60 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
              لي عند الناس (مستحقات)
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowDownLeft size={18} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight mt-2">
            {formatCurrency(stats.totalOwedToMe, currency)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            مبالغ تنتظر استردادها
          </p>
        </Card>

        {/* Total I Owe */}
        <Card className="border-rose-200/60 dark:border-rose-900/40 bg-gradient-to-br from-rose-50/50 to-white dark:from-rose-950/20 dark:to-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
              علي للناس (التزامات)
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ArrowUpRight size={18} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 font-mono tracking-tight mt-2">
            {formatCurrency(stats.totalIOwe, currency)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            ديون مستحقة عليك سدادها
          </p>
        </Card>

        {/* Net Balance */}
        <Card className="border-slate-200/60 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-white dark:from-slate-850 dark:to-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              الصافي (الفارق)
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-500/10 text-slate-600 dark:text-slate-400 flex items-center justify-center">
              <Scale size={18} />
            </div>
          </div>
          <p className={`text-2xl sm:text-3xl font-black font-mono tracking-tight mt-2 ${
            stats.netBalance >= 0
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-rose-600 dark:text-rose-400'
          }`}>
            {stats.netBalance >= 0 ? '+' : ''}{formatCurrency(stats.netBalance, currency)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {stats.netBalance >= 0 ? 'موقف مالي إيجابي لصالحك' : 'التزاماتك تفوق مستحقاتك'}
          </p>
        </Card>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        {/* Direction Switcher Tabs */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-full sm:w-auto border border-slate-200/60 dark:border-slate-750">
          <button
            onClick={() => {
              hapticFeedback('light');
              setActiveTab('owed_to_me');
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs transition-all ${
              activeTab === 'owed_to_me'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ArrowDownLeft size={16} />
            <span>لي عند الناس ({debts.filter(d => d.direction === 'owed_to_me' && !d.isSettled).length})</span>
          </button>

          <button
            onClick={() => {
              hapticFeedback('light');
              setActiveTab('i_owe');
            }}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs transition-all ${
              activeTab === 'i_owe'
                ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ArrowUpRight size={16} />
            <span>علي للناس ({debts.filter(d => d.direction === 'i_owe' && !d.isSettled).length})</span>
          </button>
        </div>

        {/* Search Bar and Add Button */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث بالاسم أو الملاحظة..."
              className="w-full pl-3 pr-9 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Search size={14} />
            </div>
          </div>

          <button
            onClick={() => {
              hapticFeedback('medium');
              setEditingDebt(null);
              setIsAddModalOpen(true);
            }}
            className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/30 flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">إضافة دين جديد</span>
            <span className="sm:hidden">إضافة</span>
          </button>
        </div>
      </div>

      {/* Active Debts List */}
      <div className="space-y-4">
        {activeDebts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeDebts.map((debt) => (
              <DebtCard
                key={debt.id}
                debt={debt}
                currency={currency}
                onRecordPayment={(d) => setPayingDebt(d)}
                onEdit={(d) => {
                  setEditingDebt(d);
                  setIsAddModalOpen(true);
                }}
                onDelete={(id) => deleteDebt(id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={activeTab === 'owed_to_me' ? ArrowDownLeft : ArrowUpRight}
            title={activeTab === 'owed_to_me' ? 'لا توجد مستحقات لك مسجلة' : 'لا توجد ديون عليك مسجلة'}
            description={
              searchQuery
                ? 'لم يتم العثور على أي نتائج مطابقة لبحثك'
                : activeTab === 'owed_to_me'
                ? 'سجل أي مبلغ استلفه منك شخص لتتبعه حتى استرداده'
                : 'سجل أي التزام أو قرض عليك لتنظيم سداده بانتظام'
            }
            actionLabel={activeTab === 'owed_to_me' ? 'تسجيل مبلغ مستحق لي' : 'تسجيل دين مطلوب مني'}
            onAction={() => {
              hapticFeedback('medium');
              setEditingDebt(null);
              setIsAddModalOpen(true);
            }}
          />
        )}
      </div>

      {/* Collapsible Settled Debts Section */}
      {settledDebts.length > 0 && (
        <div className="pt-6">
          <button
            onClick={() => {
              hapticFeedback('light');
              setIsSettledSectionOpen(!isSettledSectionOpen);
            }}
            className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-850/60 border border-slate-200/60 dark:border-slate-800 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-500" />
              <span className="text-sm font-black text-slate-800 dark:text-slate-200">
                الديون المسدَّدة بالكامل ({settledDebts.length})
              </span>
            </div>
            <div className="text-slate-400">
              {isSettledSectionOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </button>

          <AnimatePresence>
            {isSettledSectionOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 overflow-hidden"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {settledDebts.map((debt) => (
                    <DebtCard
                      key={debt.id}
                      debt={debt}
                      currency={currency}
                      onRecordPayment={(d) => setPayingDebt(d)}
                      onEdit={(d) => {
                        setEditingDebt(d);
                        setIsAddModalOpen(true);
                      }}
                      onDelete={(id) => deleteDebt(id)}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Add / Edit Debt Modal */}
      <DebtFormModal
        isOpen={isAddModalOpen}
        editingDebt={editingDebt}
        defaultDirection={activeTab}
        accounts={accounts}
        currency={currency}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingDebt(null);
        }}
        onSubmit={handleDebtFormSubmit}
      />

      {/* Record Payment Modal */}
      <DebtPaymentModal
        isOpen={!!payingDebt}
        debt={payingDebt}
        currency={currency}
        onClose={() => setPayingDebt(null)}
        onSubmit={(debtId, payment) => {
          addDebtPayment(debtId, payment);
          setPayingDebt(null);
        }}
      />
    </motion.div>
  );
};

export default DebtsPage;
