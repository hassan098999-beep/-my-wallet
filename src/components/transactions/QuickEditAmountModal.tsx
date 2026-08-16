import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Coins, X, Check, ArrowRight, Pencil, Sparkles, Plus, Minus, RotateCcw } from "lucide-react";
import { formatCurrency, formatTunisianAmount, cn, hapticFeedback } from "../../utils";
import { DynamicIcon } from "../DynamicIcon";
import { Category, Account } from "../../types";
import { format, parseISO } from "date-fns";
import { ar } from "date-fns/locale";

interface QuickEditAmountModalProps {
  transaction: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveAmount: (transaction: any, newAmount: number) => Promise<void>;
  onOpenFullEdit?: (transaction: any) => void;
  categories: Category[];
  accounts: Account[];
  currency: string;
}

export const QuickEditAmountModal: React.FC<QuickEditAmountModalProps> = ({
  transaction,
  isOpen,
  onClose,
  onSaveAmount,
  onOpenFullEdit,
  categories,
  accounts,
  currency,
}) => {
  const [amountStr, setAmountStr] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (transaction && isOpen) {
      setAmountStr(transaction.amount?.toString() || "");
    }
  }, [transaction, isOpen]);

  if (!transaction || !isOpen) return null;

  const isExpense = transaction.type === "expense";
  const isTransfer = transaction.isTransfer;
  const category = isExpense && !isTransfer ? categories.find((c) => c.id === transaction.categoryId) : null;
  const account = accounts.find((a) => a.id === transaction.accountId);
  const originalAmount = Number(transaction.amount) || 0;
  const currentAmountNum = parseFloat(amountStr) || 0;
  const diff = currentAmountNum - originalAmount;

  const handleApplyDelta = (delta: number) => {
    hapticFeedback("light");
    const nextVal = Math.max(0, Number((currentAmountNum + delta).toFixed(3)));
    setAmountStr(nextVal.toString());
  };

  const handleResetToOriginal = () => {
    hapticFeedback("medium");
    setAmountStr(originalAmount.toString());
  };

  const handleRoundToInteger = () => {
    hapticFeedback("light");
    setAmountStr(Math.round(currentAmountNum).toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(currentAmountNum) || currentAmountNum < 0) {
      return;
    }
    try {
      setIsSubmitting(true);
      await onSaveAmount(transaction, currentAmountNum);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4" dir="rtl">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 overflow-hidden z-10"
        >
          {/* Top Decorative Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800/80 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50 shadow-xs">
                <Coins className="size-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                  تعديل مبلغ العملية
                </h3>
                <p className="text-[11px] font-semibold text-slate-400">
                  تحديث المبلغ المسجل بدقة مع إعادة احتساب الأرصدة
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Current Transaction Context Preview Card */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/50 mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                style={{
                  backgroundColor: isTransfer
                    ? "#6366f1"
                    : !isExpense
                    ? "#10b981"
                    : category?.color || "#f43f5e",
                }}
              >
                {category?.icon ? (
                  <DynamicIcon name={category.icon} className="size-4" />
                ) : (
                  <span className="text-xs font-bold">{isExpense ? "مصروف" : "دخل"}</span>
                )}
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                  {isTransfer
                    ? isExpense
                      ? transaction.note || "تحويل مالي صادر"
                      : transaction.source || "تحويل مالي وارد"
                    : !isExpense
                    ? transaction.source
                    : transaction.note || category?.name || "مصروف"}
                </h4>
                <div className="text-[10px] sm:text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
                  <span>{account?.name || "الحساب الافتراضي"}</span>
                  <span>•</span>
                  <span>
                    {transaction.date
                      ? format(parseISO(transaction.date), "dd MMMM yyyy", { locale: ar })
                      : "اليوم"}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-left shrink-0">
              <div className="text-[10px] text-slate-400 font-bold">المبلغ الحالي</div>
              <div className="text-xs sm:text-sm font-black font-mono text-slate-700 dark:text-slate-300 dir-ltr">
                {formatCurrency(originalAmount, currency)}
              </div>
            </div>
          </div>

          {/* Form Area */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Main Amount Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300 px-1">
                <span>المبلغ الجديد المطلوب</span>
                {diff !== 0 && (
                  <span
                    className={cn(
                      "font-mono text-[11px] font-bold px-2 py-0.5 rounded-md",
                      diff > 0
                        ? isExpense
                          ? "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
                          : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                        : isExpense
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                        : "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
                    )}
                  >
                    الفرق: {diff > 0 ? "+" : ""}
                    {formatCurrency(diff, currency)}
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  autoFocus
                  value={amountStr}
                  onChange={(e) => setAmountStr(formatTunisianAmount(e.target.value))}
                  onFocus={(e) => {
                    const target = e.target;
                    setTimeout(() => {
                      try {
                        target.setSelectionRange(0, target.value.length);
                      } catch {
                        target.select();
                      }
                    }, 50);
                  }}
                  placeholder="0.000"
                  className="w-full px-4 py-3 sm:py-3.5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-mono font-black text-xl sm:text-2xl text-center"
                  required
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                  {currency}
                </span>
                {amountStr && (
                  <button
                    type="button"
                    onClick={() => {
                      hapticFeedback("light");
                      setAmountStr("");
                    }}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Adjustment Shortcuts */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 px-1">
                <span>تعديل سريع للمبلغ (+ / -)</span>
                {amountStr !== originalAmount.toString() && (
                  <button
                    type="button"
                    onClick={handleResetToOriginal}
                    className="flex items-center gap-1 text-indigo-500 hover:text-indigo-600 text-[10px] font-bold cursor-pointer"
                  >
                    <RotateCcw className="size-3" />
                    <span>استعادة الأصلي</span>
                  </button>
                )}
              </div>

              {/* Positive Additions */}
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 5, 10, 20, 50].map((val) => (
                  <button
                    key={`plus-${val}`}
                    type="button"
                    onClick={() => handleApplyDelta(val)}
                    className="py-1.5 px-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 font-mono text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-0.5"
                  >
                    <Plus className="size-3" />
                    <span>{val}</span>
                  </button>
                ))}
              </div>

              {/* Negative Subtractions */}
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 5, 10, 20, 50].map((val) => (
                  <button
                    key={`minus-${val}`}
                    type="button"
                    onClick={() => handleApplyDelta(-val)}
                    disabled={currentAmountNum - val < 0}
                    className="py-1.5 px-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 font-mono text-xs font-bold transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-0.5"
                  >
                    <Minus className="size-3" />
                    <span>{val}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={isSubmitting || isNaN(currentAmountNum) || currentAmountNum < 0}
                className="w-full py-3 sm:py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white rounded-2xl font-black text-sm shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Check className="size-4 stroke-[2.5]" />
                <span>{isSubmitting ? "جاري الحفظ..." : "حفظ المبلغ المعدل"}</span>
              </button>

              <div className="flex items-center gap-2">
                {onOpenFullEdit && !isTransfer && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenFullEdit(transaction);
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Pencil className="size-3.5" />
                    <span>تعديل كافة التفاصيل (التاريخ، الفئة...)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-bold transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
