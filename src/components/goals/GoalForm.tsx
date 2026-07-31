import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Calendar, TrendingUp, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

import { Goal, Category } from '../../types';
import { hapticFeedback, cn } from '../../utils';

import Card from '../ui/Card';
import NumericKeypad from '../NumericKeypad';

interface GoalFormProps {
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => void;
  categories: Category[];
  currency: string;
  itemVariants: any;
}

const GoalForm: React.FC<GoalFormProps> = ({
  addGoal,
  categories,
  currency,
  itemVariants
}) => {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState(new Date().toISOString().split('T')[0]);
  const [linkedCategoryId, setLinkedCategoryId] = useState<string>('');
  const [isLinkedToOverallBudget, setIsLinkedToOverallBudget] = useState(false);
  const [isEmergencyFund, setIsEmergencyFund] = useState(false);
  const [activeInput, setActiveInput] = useState<'target' | 'current' | null>(null);

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && Number(targetAmount) > 0) {
      hapticFeedback('success');
      addGoal({
        name,
        targetAmount: Number(targetAmount),
        currentAmount: Number(currentAmount) || 0,
        deadline,
        linkedCategoryId: linkedCategoryId || undefined,
        isLinkedToOverallBudget: isLinkedToOverallBudget,
        isEmergencyFund: isEmergencyFund,
      });
      
      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-bold text-sm">تم تحديد الهدف بنجاح! 🎯</span>
          <span className="text-xs opacity-90">رحلة الألف ميل تبدأ بخطوة. نتمنى لك التوفيق!</span>
        </div>,
        { duration: 4000 }
      );
      
      setName('');
      setTargetAmount('');
      setCurrentAmount('');
      setLinkedCategoryId('');
      setIsLinkedToOverallBudget(false);
      setIsEmergencyFund(false);
      setActiveInput(null);
    }
  };

  const handleKeyPress = (val: string) => {
    if (!activeInput) return;
    const setVal = activeInput === 'target' ? setTargetAmount : setCurrentAmount;
    const currentVal = activeInput === 'target' ? targetAmount : currentAmount;

    if (val === '.') {
      if (!currentVal.includes('.')) {
        setVal(prev => prev === '' ? '0.' : prev + '.');
      }
    } else if (val.startsWith('+')) {
      const addVal = Number(val.replace('+', ''));
      setVal(prev => (Number(prev || 0) + addVal).toString());
    } else {
      setVal(prev => prev + val);
    }
  };

  const handleDelete = () => {
    if (!activeInput) return;
    const setVal = activeInput === 'target' ? setTargetAmount : setCurrentAmount;
    setVal(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (!activeInput) return;
    const setVal = activeInput === 'target' ? setTargetAmount : setCurrentAmount;
    setVal('');
  };

  return (
    <motion.div variants={itemVariants}>
      <Card className="p-6 md:p-8 border-2 border-dashed border-primary-500/20">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500">
            <Plus size={20} />
          </div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">إضافة هدف ادخار جديد</h2>
        </div>

        <form onSubmit={handleAddGoal} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">اسم الهدف</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: تجهيزات المولود"
                className="w-full p-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 text-base outline-none focus:ring-8 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-black"
                required
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">المبلغ المستهدف</label>
              <div className="relative group">
                <div className={cn(
                  "absolute -inset-1 bg-gradient-to-r from-primary-500 to-indigo-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200",
                  activeInput === 'target' ? "opacity-40" : "opacity-0"
                )}></div>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="none"
                    readOnly
                    value={targetAmount}
                    onFocus={() => setActiveInput('target')}
                    placeholder="0.00"
                    className={cn(
                      "w-full p-5 rounded-2xl border-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl text-xl outline-none transition-all font-mono font-black cursor-pointer shadow-lg",
                      activeInput === 'target' ? "border-primary-500 text-primary-600" : "border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white"
                    )}
                    required
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">{currency}</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">المبلغ المتوفر</label>
              <div className="relative group">
                <div className={cn(
                  "absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200",
                  activeInput === 'current' ? "opacity-40" : "opacity-0"
                )}></div>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="none"
                    readOnly
                    value={currentAmount}
                    onFocus={() => setActiveInput('current')}
                    placeholder="0.00"
                    className={cn(
                      "w-full p-5 rounded-2xl border-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl text-xl outline-none transition-all font-mono font-black cursor-pointer shadow-lg",
                      activeInput === 'current' ? "border-emerald-500 text-emerald-600" : "border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white"
                    )}
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xs">{currency}</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">الموعد النهائي</label>
              <div className="relative">
                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 size-5" />
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full pr-12 pl-4 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 text-base outline-none focus:ring-8 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-mono font-black"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div 
              onClick={() => {
                setIsLinkedToOverallBudget(!isLinkedToOverallBudget);
                if (!isLinkedToOverallBudget) setLinkedCategoryId('');
              }}
              className={cn(
                "flex items-center gap-4 p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer group",
                isLinkedToOverallBudget 
                  ? "border-emerald-500 bg-emerald-500/5 shadow-lg shadow-emerald-500/5" 
                  : "border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                isLinkedToOverallBudget ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 dark:border-slate-600"
              )}>
                {isLinkedToOverallBudget && <TrendingUp size={14} />}
              </div>
              <span className={cn(
                "text-sm font-black uppercase tracking-tight transition-colors",
                isLinkedToOverallBudget ? "text-emerald-600" : "text-slate-500"
              )}>
                ربط بالميزانية العامة (توفير الفائض الكلي)
              </span>
            </div>

            <div className="space-y-2">
              <select
                value={linkedCategoryId}
                onChange={(e) => {
                  setLinkedCategoryId(e.target.value);
                  if (e.target.value) setIsLinkedToOverallBudget(false);
                }}
                disabled={isLinkedToOverallBudget}
                className="w-full p-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 disabled:opacity-50 text-base outline-none focus:ring-8 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-black uppercase tracking-tight appearance-none cursor-pointer"
              >
                <option value="">ربط بفئة محددة (اختياري)</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div 
              onClick={() => setIsEmergencyFund(!isEmergencyFund)}
              className={cn(
                "flex items-center gap-4 p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer group",
                isEmergencyFund 
                  ? "border-emerald-500 bg-emerald-500/5 shadow-lg shadow-emerald-500/5" 
                  : "border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                isEmergencyFund ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 dark:border-slate-600"
              )}>
                {isEmergencyFund && <Shield size={14} />}
              </div>
              <span className={cn(
                "text-sm font-black uppercase tracking-tight transition-colors",
                isEmergencyFund ? "text-emerald-600" : "text-slate-500"
              )}>
                صندوق طوارئ عائلي (تأمين العيلة) 🛡️
              </span>
            </div>
          </div>

          <AnimatePresence>
            {activeInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-3xl border border-slate-100 dark:border-slate-800"
              >
                <div className="flex justify-between items-center mb-4 px-2">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    إدخال {activeInput === 'target' ? 'المبلغ المستهدف' : 'المبلغ المتوفر'}
                  </span>
                  <button 
                    type="button"
                    onClick={() => setActiveInput(null)}
                    className="text-xs font-semibold text-primary-600 dark:text-primary-400"
                  >
                    إغلاق
                  </button>
                </div>
                <NumericKeypad 
                  onPress={handleKeyPress}
                  onDelete={handleDelete}
                  onClear={handleClear}
                  type="income"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button 
            whileHover={{ scale: 1.01, y: -2 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            className="btn-primary w-full h-14 rounded-2xl font-semibold flex items-center justify-center gap-2 text-lg transition-all shadow-md shadow-primary-500/20"
          >
            <Plus className="size-5" /> إضافة هدف جديد
          </motion.button>
        </form>
      </Card>
    </motion.div>
  );
};

export default GoalForm;
