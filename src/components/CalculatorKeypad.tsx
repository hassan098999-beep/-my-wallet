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
    <div className="w-full bg-white dark:bg-slate-900 grid grid-cols-4 grid-rows-5 h-full">
      {/* Top 3 rows */}
      {rows.map((row, rowIndex) => (
        <React.Fragment key={rowIndex}>
          {row.map((key) => (
            <motion.button
              key={key}
              type="button"
              whileTap={{ scale: 0.9, backgroundColor: 'rgba(0,0,0,0.05)' }}
              onClick={() => handlePress(key)}
              className={cn(
                "flex items-center justify-center text-3xl font-light active:bg-slate-100 dark:active:bg-slate-800 transition-colors",
                ['/', '*', '-', '+'].includes(key) ? "bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300" : "text-slate-800 dark:text-slate-200"
              )}
            >
              {key === '*' ? '×' : key === '/' ? '÷' : key}
            </motion.button>
          ))}
        </React.Fragment>
      ))}
      
      {/* 4th row: ., 0, delete, + */}
      <motion.button type="button" whileTap={{ scale: 0.9 }} onClick={() => handlePress('.')} className="flex items-center justify-center text-3xl font-light text-slate-800 dark:text-slate-200 active:bg-slate-100 dark:active:bg-slate-800 transition-colors">.</motion.button>
      <motion.button type="button" whileTap={{ scale: 0.9 }} onClick={() => handlePress('0')} className="flex items-center justify-center text-3xl font-light text-slate-800 dark:text-slate-200 active:bg-slate-100 dark:active:bg-slate-800 transition-colors">0</motion.button>
      <motion.button type="button" whileTap={{ scale: 0.9 }} onClick={handleDelete} className="flex items-center justify-center text-slate-500 active:bg-slate-100 dark:active:bg-slate-800 transition-colors"><Delete size={28} strokeWidth={1.5} /></motion.button>
      <motion.button type="button" whileTap={{ scale: 0.9 }} onClick={() => handlePress('+')} className="flex items-center justify-center text-3xl font-light bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 active:bg-slate-100 dark:active:bg-slate-800 transition-colors">+</motion.button>

      {/* 5th row: = spans all 4 columns */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        onClick={handleCalculate}
        className="col-span-4 flex items-center justify-center text-4xl font-light bg-emerald-500 text-white active:bg-emerald-600 transition-colors"
      >
        =
      </motion.button>
    </div>
  );
};

export default CalculatorKeypad;
