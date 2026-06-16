import React, { useState, useEffect } from 'react';
import { useAppContext } from '../store/AppContext';
import { Lock, Delete, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

const LockScreen = () => {
  const { verifyAppPin } = useAppContext();
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  const handleNumberClick = (num: string) => {
    if (pin.length < 4) {
      setError(false);
      setPin((prev) => prev + num);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  const handleClear = () => {
    setPin('');
    setError(false);
  };

  useEffect(() => {
    if (pin.length === 4) {
      const verify = async () => {
        const isSuccess = await verifyAppPin(pin);
        if (isSuccess) {
          toast.success('تم فتح التطبيق بنجاح');
        } else {
          setError(true);
          setPin('');
          toast.error('رمز PIN غير صحيح، حاول مجدداً');
        }
      };
      // Short delay for the 4th dot to light up before processing
      const timer = setTimeout(verify, 150);
      return () => clearTimeout(timer);
    }
  }, [pin, verifyAppPin]);

  // Support direct keyboard entry
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handleNumberClick(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape' || e.key === 'Delete') {
        handleClear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin]);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <div className="w-full max-w-sm px-6 text-center flex flex-col items-center">
        {/* Lock Logo */}
        <motion.div 
          className="w-16 h-16 bg-primary-50 dark:bg-primary-950/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-6 shadow-sm border border-emerald-100 dark:border-emerald-900"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Lock size={28} className="animate-pulse" />
        </motion.div>

        {/* Header */}
        <h1 className="text-2xl font-black mb-2 text-slate-900 dark:text-white tracking-tight">مصاريفي - حماية البيانات</h1>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-8 max-w-[280px]">
          الرجاء إدخال الرمز السري المتكون من 4 أرقام لفتح قفل التطبيق ومتابعة حساباتك.
        </p>

        {/* Pin Dots */}
        <motion.div 
          className="flex justify-center gap-6 mb-12"
          animate={error ? { x: [-10, 10, -10, 10, -5, 5, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          {[0, 1, 2, 3].map((idx) => (
            <div 
              key={idx}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                idx < pin.length 
                  ? 'bg-emerald-500 border-emerald-500 scale-125 shadow-lg shadow-emerald-500/20' 
                  : error 
                    ? 'border-red-500 bg-red-100 dark:bg-red-950/20'
                    : 'border-slate-300 dark:border-slate-700 bg-transparent'
              }`}
            />
          ))}
        </motion.div>

        {/* Numpad Dial */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-[280px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              id={`dial_${num}`}
              key={num}
              onClick={() => handleNumberClick(num)}
              className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-black bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition-all text-slate-900 dark:text-slate-100 shadow-sm cursor-pointer mx-auto"
            >
              {num}
            </button>
          ))}
          <button
            id="dial_clear"
            onClick={handleClear}
            className="w-16 h-16 rounded-full flex items-center justify-center text-xs font-bold text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors mx-auto cursor-pointer"
          >
            مسح الكل
          </button>
          <button
            id="dial_0"
            onClick={() => handleNumberClick('0')}
            className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-black bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition-all text-slate-900 dark:text-slate-100 shadow-sm cursor-pointer mx-auto"
          >
            0
          </button>
          <button
            id="dial_backspace"
            onClick={handleBackspace}
            className="w-16 h-16 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all mx-auto cursor-pointer"
          >
            <Delete size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LockScreen;
