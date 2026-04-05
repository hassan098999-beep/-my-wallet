import React from 'react';
import { Delete } from 'lucide-react';
import { cn } from '../utils';

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

  return (
    <div className="w-full bg-white dark:bg-slate-900 grid grid-cols-4 grid-rows-5 h-full">
      {/* Top 3 rows */}
      {rows.map((row, rowIndex) => (
        <React.Fragment key={rowIndex}>
          {row.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => onPress(key)}
              className={cn(
                "flex items-center justify-center text-3xl font-light active:bg-slate-100 dark:active:bg-slate-800 transition-colors",
                ['/', '*', '-', '+'].includes(key) ? "bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300" : "text-slate-800 dark:text-slate-200"
              )}
            >
              {key === '*' ? '×' : key === '/' ? '÷' : key}
            </button>
          ))}
        </React.Fragment>
      ))}
      
      {/* 4th row: ., 0, delete, + */}
      <button type="button" onClick={() => onPress('.')} className="flex items-center justify-center text-3xl font-light text-slate-800 dark:text-slate-200 active:bg-slate-100 dark:active:bg-slate-800 transition-colors">.</button>
      <button type="button" onClick={() => onPress('0')} className="flex items-center justify-center text-3xl font-light text-slate-800 dark:text-slate-200 active:bg-slate-100 dark:active:bg-slate-800 transition-colors">0</button>
      <button type="button" onClick={onDelete} className="flex items-center justify-center text-slate-500 active:bg-slate-100 dark:active:bg-slate-800 transition-colors"><Delete size={28} strokeWidth={1.5} /></button>
      <button type="button" onClick={() => onPress('+')} className="flex items-center justify-center text-3xl font-light bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 active:bg-slate-100 dark:active:bg-slate-800 transition-colors">+</button>

      {/* 5th row: = spans all 4 columns */}
      <button
        type="button"
        onClick={onCalculate}
        className="col-span-4 flex items-center justify-center text-4xl font-light bg-emerald-500 text-white active:bg-emerald-600 transition-colors"
      >
        =
      </button>
    </div>
  );
};

export default CalculatorKeypad;
