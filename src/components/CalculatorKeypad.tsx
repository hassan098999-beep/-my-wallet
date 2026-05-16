import React from 'react';
import { Delete } from 'lucide-react';
import { cn, hapticFeedback } from '../utils';
import { motion } from 'motion/react';

interface CalculatorKeypadProps {
  onPress: (key: string) => void;
  onDelete: () => void;
  onCalculate: () => void;
}

const CalculatorKeypad: React.FC<CalculatorKeypadProps> = ({ onPress, onDelete, onCalculate }) => {
  const rows = [
    ['7', '8', '9', '/'],
    ['4', '5', '6', '*'],
    ['1', '2', '3', '-'],
  ];

  const handlePress = (key: string) => {
    hapticFeedback('light');
    onPress(key);
  };

  const handleDelete = () => {
    hapticFeedback('light');
    onDelete();
  };

  const handleCalculate = () => {
    hapticFeedback('medium');
    onCalculate();
  };

  return (
    <div className="w-full h-full bg-slate-50 dark:bg-slate-900/50 p-4 grid grid-cols-4 grid-rows-5 gap-2">
      {/* Top 3 rows */}
      {rows.map((row, rowIndex) => (
        <React.Fragment key={rowIndex}>
          {row.map((key) => (
            <motion.button
              key={key}
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={() => handlePress(key)}
              className={cn(
                "flex items-center justify-center text-2xl font-semibold rounded-2xl shadow-sm transition-all",
                ['/', '*', '-', '+'].includes(key) ? "bg-white dark:bg-slate-800 text-indigo-500" : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              )}
            >
              {key === '*' ? '×' : key === '/' ? '÷' : key}
            </motion.button>
          ))}
        </React.Fragment>
      ))}
      
      {/* 4th row: ., 0, delete, + */}
      <motion.button type="button" whileTap={{ scale: 0.9 }} onClick={() => handlePress('.')} className="flex items-center justify-center text-2xl font-semibold rounded-2xl shadow-sm transition-all bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">.</motion.button>
      <motion.button type="button" whileTap={{ scale: 0.9 }} onClick={() => handlePress('0')} className="flex items-center justify-center text-2xl font-semibold rounded-2xl shadow-sm transition-all bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">0</motion.button>
      <motion.button type="button" whileTap={{ scale: 0.9 }} onClick={handleDelete} className="flex items-center justify-center text-rose-500 rounded-2xl shadow-sm transition-all bg-white dark:bg-slate-800"><Delete size={28} strokeWidth={2} /></motion.button>
      <motion.button type="button" whileTap={{ scale: 0.9 }} onClick={() => handlePress('+')} className="flex items-center justify-center text-2xl font-semibold rounded-2xl shadow-sm transition-all bg-white dark:bg-slate-800 text-indigo-500">+</motion.button>

      {/* 5th row: = spans all 4 columns */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        onClick={handleCalculate}
        className="col-span-4 flex items-center justify-center text-3xl font-semibold bg-indigo-500 text-white rounded-2xl shadow-md transition-all shadow-indigo-500/20"
      >
        =
      </motion.button>
    </div>
  );
};

export default CalculatorKeypad;
