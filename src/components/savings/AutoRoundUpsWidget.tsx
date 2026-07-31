import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Coins } from 'lucide-react';
import Badge from '../ui/Badge';
import { useAppContext } from '../../store/AppContext';
import { formatCurrency, hapticFeedback } from '../../utils';

interface AutoRoundUpsWidgetProps {
  itemVariants?: any;
}

export const AutoRoundUpsWidget: React.FC<AutoRoundUpsWidgetProps> = ({ itemVariants }) => {
  const { goals, expenses, currency, autoRoundUpSetting } = useAppContext();

  return (
    <motion.div 
      variants={itemVariants}
      className="mt-6 border border-teal-100 dark:border-teal-950/40 rounded-3xl bg-gradient-to-br from-teal-50/20 via-white to-emerald-50/10 dark:from-slate-900/40 dark:via-slate-900/20 dark:to-slate-900/30 p-5 md:p-6 shadow-sm overflow-hidden relative"
    >
      <div className="absolute top-0 left-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl -ml-6 -mt-6 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-8 -mb-8 pointer-events-none" />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-teal-500/10 shrink-0">
            <Coins size={22} className="shrink-0" />
          </div>
          <div className="text-right">
            <h3 className="text-xs md:text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              حصالة التوفير وفكة المعاملات الكلية 🪙
              <Badge variant={autoRoundUpSetting?.enabled ? 'success' : 'info'} className="text-[8px] font-black">
                {autoRoundUpSetting?.enabled ? 'مفعّلة ونشطة' : 'غير نشطة'}
              </Badge>
            </h3>
            <p className="text-[9px] text-slate-400 font-bold">تقريب النفقات تلقائياً لأقرب {autoRoundUpSetting?.multiplier || 1} د.ت وتحويل الفارق لحصالة الأهداف</p>
          </div>
        </div>

        <Link
          to="/settings"
          onClick={() => hapticFeedback('light')}
          className="px-4 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 font-black text-[10px] md:text-xs hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-all border border-teal-100/30 shrink-0"
        >
          <span>إدارة الخدمة والتحكم الذكي ⚙️</span>
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10" dir="rtl">
        <div className="p-3 bg-white/75 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-2xl">
          <p className="text-[9px] text-slate-400 font-bold">الحصالة المستهدفة</p>
          <p className="text-xs font-black text-slate-700 dark:text-slate-300 mt-1 truncate">
            {goals.find(g => g.id === autoRoundUpSetting?.targetGoalId)?.name || 'لم تحدد حصالة بعد'}
          </p>
        </div>
        
        <div className="p-3 bg-white/75 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 rounded-2xl">
          <p className="text-[9px] text-slate-400 font-bold">قوة التقريب المعتمدة</p>
          <p className="text-xs font-black text-slate-700 dark:text-slate-300 mt-1">
            أقرب {autoRoundUpSetting?.multiplier || 1} {currency}
          </p>
        </div>

        <div className="p-3 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 rounded-2xl">
          <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">إجمالي التوفير التلقائي (التاريخي)</p>
          <p className="text-xs font-sans font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(
              expenses
                .filter(e => e.isTransfer && (e.note || '').includes('حصالة التوفير التلقائي'))
                .reduce((sum, e) => sum + e.amount, 0),
              currency
            )}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default AutoRoundUpsWidget;
