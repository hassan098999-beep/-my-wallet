import React from 'react';
import { motion } from 'motion/react';
import { Target } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../utils';

interface PieItem {
  name: string;
  value: number;
  color: string;
}

interface SavingsPieChartProps {
  pieData: PieItem[];
  currency: string;
  itemVariants?: any;
}

export const SavingsPieChart: React.FC<SavingsPieChartProps> = ({
  pieData,
  currency,
  itemVariants,
}) => {
  if (!pieData || pieData.length === 0) return null;

  return (
    <motion.div 
      variants={itemVariants}
      className="p-5 rounded-3xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 shadow-sm mt-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-500">
          <Target size={18} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">تحليل حصة الأهداف</h2>
          <p className="text-[10px] text-slate-400 font-bold">نسبة كل هدف من إجمالي المبالغ الادخارية المتراكمة</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="w-full lg:w-1/2 h-44 md:h-52">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="55%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={4}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any) => [formatCurrency(value, currency), 'المدخرات']} 
                contentStyle={{ borderRadius: '1rem', background: '#1e293b', border: 'none', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="w-full lg:w-1/2 grid grid-cols-2 gap-3">
          {pieData.map((item, index) => {
            const totalCalculated = pieData.reduce((sum, i) => sum + i.value, 0);
            const percent = totalCalculated > 0 ? ((item.value / totalCalculated) * 100).toFixed(0) : 0;
            return (
              <div key={index} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs font-black text-slate-700 dark:text-slate-300 truncate leading-none mb-1">{item.name}</p>
                  <p className="text-[9px] font-bold text-slate-400">
                    {percent}% ({formatCurrency(item.value, currency)})
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default SavingsPieChart;
