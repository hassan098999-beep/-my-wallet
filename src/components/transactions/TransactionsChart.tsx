import React from "react";
import { motion } from "motion/react";
import { ChartPie } from "lucide-react";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import { formatCurrency } from "../../utils";

interface TransactionsChartProps {
  categoryData: { name: string; value: number; color: string }[];
  transactionType: "all" | "expense" | "income";
  currency: string;
  width: number;
}

export const TransactionsChart: React.FC<TransactionsChartProps> = ({
  categoryData,
  transactionType,
  currency,
  width,
}) => {
  if (categoryData.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="card p-6 md:p-8"
    >
      <div className="flex items-center justify-between mb-8 md:mb-12">
        <h2 className="text-[--text-h2] font-semibold text-slate-900 dark:text-white">
          {transactionType === "income"
            ? "توزيع مصادر الدخل"
            : "توزيع المصاريف"}
        </h2>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <ChartPie className="size-4" />
          <span>نظرة تحليلية</span>
        </div>
      </div>
      <div className="h-56 md:h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              innerRadius={width < 640 ? 60 : 90}
              outerRadius={width < 640 ? 85 : 120}
              paddingAngle={8}
              dataKey="value"
              stroke="none"
              animationBegin={0}
              animationDuration={1500}
            >
              {categoryData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                />
              ))}
            </Pie>
            <RechartsTooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-5 rounded-3xl shadow-md border border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-semibold text-slate-500 mb-2">
                        {payload[0].name}
                      </p>
                      <p className="text-xl md:text-2xl font-black text-slate-900 dark:text-white">
                        {formatCurrency(
                          payload[0].value as number,
                          currency,
                        )}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};
