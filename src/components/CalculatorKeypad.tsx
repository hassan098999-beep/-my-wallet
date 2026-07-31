import React, { useState } from 'react';
import { Delete, Calculator } from 'lucide-react';
import { cn, hapticFeedback } from '../utils';
import { motion, AnimatePresence } from 'motion/react';

interface CalculatorKeypadProps {
  onPress: (key: string) => void;
  onDelete: () => void;
  onCalculate: () => void;
}

const CalculatorKeypad: React.FC<CalculatorKeypadProps> = ({ onPress, onDelete, onCalculate }) => {
  const [showOperators, setShowOperators] = useState(false);

  const basicRows = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
  ];
  
  const operators = ['/', '*', '-', '+'];

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
    <div className="w-full h-full bg-transparent px-3 pt-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex flex-col gap-1.5">
      {/* Container for grid */}
      <div className={cn("grid gap-1.5 flex-1", showOperators ? "grid-cols-4" : "grid-cols-3", "grid-rows-4")}>
        {/* Main numbers and operators */}
        {basicRows.map((row, rowIndex) => (
          <React.Fragment key={`row-${rowIndex}`}>
            {row.map((key) => (
              <motion.button
                key={key}
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={() => handlePress(key)}
                className="flex items-center justify-center text-2xl font-semibold rounded-xl shadow-sm transition-all bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                {key}
              </motion.button>
            ))}
            {showOperators && (
              <motion.button
                key={operators[rowIndex]}
                type="button"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handlePress(operators[rowIndex])}
                className="flex items-center justify-center text-2xl font-semibold rounded-xl shadow-sm transition-all bg-white dark:bg-slate-800 text-indigo-500"
              >
                {operators[rowIndex] === '*' ? '×' : operators[rowIndex] === '/' ? '÷' : operators[rowIndex]}
              </motion.button>
            )}
          </React.Fragment>
        ))}

        {/* 4th row */}
        <motion.button type="button" whileTap={{ scale: 0.9 }} onClick={() => handlePress('.')} className="flex items-center justify-center text-2xl font-semibold rounded-xl shadow-sm transition-all bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">.</motion.button>
        <motion.button type="button" whileTap={{ scale: 0.9 }} onClick={() => handlePress('0')} className="flex items-center justify-center text-2xl font-semibold rounded-xl shadow-sm transition-all bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">0</motion.button>
        <motion.button type="button" whileTap={{ scale: 0.9 }} onClick={handleDelete} className="flex items-center justify-center text-rose-500 rounded-xl shadow-sm transition-all bg-white dark:bg-slate-800"><Delete size={28} strokeWidth={2} /></motion.button>
        {showOperators && (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handlePress('+')}
            className="flex items-center justify-center text-2xl font-semibold rounded-xl shadow-sm transition-all bg-white dark:bg-slate-800 text-indigo-500"
          >
            +
          </motion.button>
        )}
      </div>

      {/* 5th row: toggle operators & equals/save button */}
      <div className="flex gap-1.5 h-12 shrink-0">
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowOperators(!showOperators)}
          className={cn(
            "flex items-center justify-center rounded-xl shadow-sm transition-all px-6",
            showOperators ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" : "bg-white dark:bg-slate-800 text-slate-500"
          )}
        >
          <Calculator size={24} />
        </motion.button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={handleCalculate}
          className="flex-1 flex items-center justify-center text-3xl font-semibold bg-indigo-500 text-white rounded-xl shadow-md transition-all shadow-indigo-500/20"
        >
          =
        </motion.button>
      </div>
    </div>
  );
};

export default CalculatorKeypad;
