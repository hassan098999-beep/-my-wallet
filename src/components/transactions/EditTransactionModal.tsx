import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Pencil, X, Plus, Minus, RotateCcw } from "lucide-react";
import { cn, formatTunisianAmount, hapticFeedback } from "../../utils";
import { CategorySelect } from "../CategorySelect";
import { PaymentMethod } from "../../types";

interface EditTransactionModalProps {
  editingTransaction: any | null;
  onClose: () => void;
  currency: string;
  editAmount: string;
  setEditAmount: (val: string) => void;
  editCategoryId: string;
  setEditCategoryId: (val: string) => void;
  editAccountId: string;
  setEditAccountId: (val: string) => void;
  editSubcategoryId: string;
  setEditSubcategoryId: (val: string) => void;
  editSource: string;
  setEditSource: (val: string) => void;
  editDate: string;
  setEditDate: (val: string) => void;
  editPaymentMethod: PaymentMethod;
  setEditPaymentMethod: (val: PaymentMethod) => void;
  editNote: string;
  setEditNote: (val: string) => void;
  categories: any[];
  accounts: any[];
  handleUpdate: (e: React.FormEvent) => void;
  getPaymentIcon: (method: PaymentMethod) => React.ReactNode;
  getPaymentLabel: (method: PaymentMethod) => string;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  editingTransaction,
  onClose,
  currency,
  editAmount,
  setEditAmount,
  editCategoryId,
  setEditCategoryId,
  editAccountId,
  setEditAccountId,
  editSubcategoryId,
  setEditSubcategoryId,
  editSource,
  setEditSource,
  editDate,
  setEditDate,
  editPaymentMethod,
  setEditPaymentMethod,
  editNote,
  setEditNote,
  categories,
  accounts,
  handleUpdate,
  getPaymentIcon,
  getPaymentLabel,
}) => {
  return (
    <AnimatePresence>
      {editingTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-md border border-white/20 dark:border-slate-800 p-4 md:p-5 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500">
                  <Pencil className="size-4 md:size-5" />
                </div>
                <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                  {editingTransaction.type === "expense"
                    ? "تعديل المصروف"
                    : "تعديل الدخل"}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 md:p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="size-5 md:size-6" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-3 md:space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 px-1">
                  <span>المبلغ ({currency})</span>
                  {editingTransaction?.amount && (
                    <button
                      type="button"
                      onClick={() => {
                        hapticFeedback("light");
                        setEditAmount(editingTransaction.amount.toString());
                      }}
                      className="text-[10px] text-indigo-500 hover:text-indigo-600 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="size-2.5" />
                      <span>استعادة الأصلي ({editingTransaction.amount})</span>
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  value={editAmount}
                  onChange={(e) =>
                    setEditAmount(formatTunisianAmount(e.target.value))
                  }
                  onFocus={(e) => {
                    if (
                      !editAmount ||
                      editAmount === "0" ||
                      editAmount === "0.000" ||
                      parseFloat(editAmount) === 0
                    ) {
                      setEditAmount("");
                    } else {
                      const target = e.target;
                      setTimeout(() => {
                        try {
                          target.setSelectionRange(0, target.value.length);
                        } catch (err) {
                          target.select();
                        }
                      }, 50);
                    }
                  }}
                  onClick={(e) => {
                    if (
                      !editAmount ||
                      editAmount === "0" ||
                      editAmount === "0.000" ||
                      parseFloat(editAmount) === 0
                    ) {
                      setEditAmount("");
                    } else {
                      const target = e.target as HTMLInputElement;
                      setTimeout(() => {
                        try {
                          target.setSelectionRange(0, target.value.length);
                        } catch (err) {
                          target.select();
                        }
                      }, 50);
                    }
                  }}
                  className="w-full px-3 py-2 md:px-4 md:py-2.5 rounded-xl md:rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-mono font-black text-sm md:text-base"
                  required
                />
                {/* Quick adjustment buttons */}
                <div className="flex items-center gap-1.5 pt-0.5 overflow-x-auto no-scrollbar py-0.5">
                  {[1, 5, 10, 50].map((val) => (
                    <button
                      key={`plus-${val}`}
                      type="button"
                      onClick={() => {
                        hapticFeedback("light");
                        const current = parseFloat(editAmount) || 0;
                        setEditAmount(Math.max(0, Number((current + val).toFixed(3))).toString());
                      }}
                      className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 text-slate-600 dark:text-slate-300 font-mono text-[10px] md:text-xs font-bold border border-slate-200/60 dark:border-slate-700/60 transition-all shrink-0 active:scale-95 flex items-center gap-0.5"
                    >
                      <Plus className="size-2.5" />
                      <span>{val}</span>
                    </button>
                  ))}
                  {[1, 5, 10, 50].map((val) => (
                    <button
                      key={`minus-${val}`}
                      type="button"
                      onClick={() => {
                        hapticFeedback("light");
                        const current = parseFloat(editAmount) || 0;
                        setEditAmount(Math.max(0, Number((current - val).toFixed(3))).toString());
                      }}
                      disabled={(parseFloat(editAmount) || 0) - val < 0}
                      className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 text-slate-600 dark:text-slate-300 font-mono text-[10px] md:text-xs font-bold border border-slate-200/60 dark:border-slate-700/60 transition-all shrink-0 active:scale-95 disabled:opacity-40 flex items-center gap-0.5"
                    >
                      <Minus className="size-2.5" />
                      <span>{val}</span>
                    </button>
                  ))}
                </div>
              </div>

              {editingTransaction.type === "expense" ? (
                <>
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-1">
                        الفئة
                      </label>
                      <CategorySelect
                        categories={categories}
                        selectedId={editCategoryId}
                        onChange={(id) => {
                          setEditCategoryId(id);
                          setEditSubcategoryId("");
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-1">
                        الحساب
                      </label>
                      <select
                        value={editAccountId}
                        onChange={(e) => setEditAccountId(e.target.value)}
                        className="w-full px-3 py-2 md:px-4 md:py-2.5 rounded-xl md:rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none font-black text-xs md:text-sm appearance-none"
                        required
                      >
                        <option value="">اختر الحساب</option>
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {categories.find((c) => c.id === editCategoryId)
                    ?.subcategories &&
                    categories.find((c) => c.id === editCategoryId)!
                      .subcategories!.length > 0 && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-1">
                          التصنيف الفرعي
                        </label>
                        <select
                          value={editSubcategoryId}
                          onChange={(e) =>
                            setEditSubcategoryId(e.target.value)
                          }
                          className="w-full px-3 py-2 md:px-4 md:py-2.5 rounded-xl md:rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none font-black text-xs md:text-sm appearance-none"
                        >
                          <option value="">اختر تصنيفاً فرعياً (اختياري)</option>
                          {categories
                            .find((c) => c.id === editCategoryId)
                            ?.subcategories?.map((sub, idx) => (
                              <option key={idx} value={sub}>
                                {sub}
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-1">
                      المصدر
                    </label>
                    <input
                      type="text"
                      value={editSource}
                      onChange={(e) => setEditSource(e.target.value)}
                      className="w-full px-3 py-2 md:px-4 md:py-2.5 rounded-xl md:rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none font-bold text-xs md:text-sm"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-1">
                      الحساب (اختياري)
                    </label>
                    <select
                      value={editAccountId}
                      onChange={(e) => setEditAccountId(e.target.value)}
                      className="w-full px-3 py-2 md:px-4 md:py-2.5 rounded-xl md:rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none font-black text-xs md:text-sm appearance-none"
                    >
                      <option value="">بدون حساب</option>
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 md:gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-1">
                    التاريخ
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-3 py-2 md:px-4 md:py-2.5 rounded-xl md:rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none font-mono font-black text-xs md:text-sm"
                    required
                  />
                </div>
              </div>

              {editingTransaction.type === "expense" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-1">
                      طريقة الدفع
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        ["cash", "card", "transfer"] as PaymentMethod[]
                      ).map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setEditPaymentMethod(method)}
                          className={cn(
                            "flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border-2 transition-all",
                            editPaymentMethod === method
                              ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                              : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-400",
                          )}
                        >
                          {getPaymentIcon(method)}
                          <span className="text-[10px] font-black uppercase">
                            {getPaymentLabel(method)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-1">
                      ملاحظة
                    </label>
                    <input
                      type="text"
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      className="w-full px-3 py-2.5 md:px-4 md:py-3 rounded-xl md:rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none font-bold text-xs md:text-sm"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2.5 pt-1.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-3 py-2.5 md:px-4 md:py-3 rounded-xl md:rounded-2xl font-semibold text-xs md:text-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-[2] px-3 py-2.5 md:px-4 md:py-3 rounded-xl md:rounded-2xl font-semibold text-xs md:text-sm shadow-md shadow-primary-500/20 transition-all"
                >
                  حفظ التغييرات
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
