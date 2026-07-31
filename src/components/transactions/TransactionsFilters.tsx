import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Filter,
  ArrowUp,
  ArrowDown,
  X,
  Calendar,
  ChartPie,
  Wallet,
} from "lucide-react";
import { cn, hapticFeedback } from "../../utils";
import { PaymentMethod } from "../../types";

interface TransactionsFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  transactionType: "all" | "expense" | "income";
  setTransactionType: (type: "all" | "expense" | "income") => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  activeFiltersCount: number;
  sortField: "date" | "amount";
  setSortField: (field: "date" | "amount") => void;
  sortOrder: "asc" | "desc";
  setSortOrder: React.Dispatch<React.SetStateAction<"asc" | "desc">>;
  activeFiltersList: { id: string; label: string; clear: () => void }[];
  handleDatePreset: (preset: "today" | "week" | "month" | "year" | "all") => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  categoryFilter: string[];
  setCategoryFilter: React.Dispatch<React.SetStateAction<string[]>>;
  typeFilter: string;
  setTypeFilter: (type: string) => void;
  categories: any[];
  accountFilter: string;
  setAccountFilter: (account: string) => void;
  accounts: any[];
  paymentMethodFilter: PaymentMethod | "all";
  setPaymentMethodFilter: (method: PaymentMethod | "all") => void;
  minAmount: string;
  setMinAmount: (amount: string) => void;
  maxAmount: string;
  setMaxAmount: (amount: string) => void;
  currency: string;
  clearAllFilters: () => void;
}

export const TransactionsFilters: React.FC<TransactionsFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  transactionType,
  setTransactionType,
  showFilters,
  setShowFilters,
  activeFiltersCount,
  sortField,
  setSortField,
  sortOrder,
  setSortOrder,
  activeFiltersList,
  handleDatePreset,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  categoryFilter,
  setCategoryFilter,
  typeFilter,
  setTypeFilter,
  categories,
  accountFilter,
  setAccountFilter,
  accounts,
  paymentMethodFilter,
  setPaymentMethodFilter,
  minAmount,
  setMinAmount,
  maxAmount,
  setMaxAmount,
  currency,
  clearAllFilters,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="lg:col-span-3 card p-5 md:p-6 flex flex-col"
    >
      <div className="flex flex-col gap-4 md:gap-5 flex-1">
        {/* Search and Core Controls Row */}
        <div className="flex flex-col xl:flex-row gap-4 items-stretch xl:items-center justify-between">
          {/* Search field */}
          <div className="relative group flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors size-5" />
            <input
              type="text"
              placeholder="بحث في الملاحظات أو المصدر..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field w-full pr-12 pl-4 py-3 rounded-2xl text-sm font-bold bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500 transition-all outline-none text-slate-900 dark:text-white"
            />
          </div>

          {/* Segment Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Type Selector Tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-2xl border border-slate-200/20">
              {(["all", "expense", "income"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    hapticFeedback("light");
                    setTransactionType(type);
                  }}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-black transition-all relative whitespace-nowrap",
                    transactionType === type
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300",
                  )}
                >
                  {type === "all"
                    ? "الكل"
                    : type === "expense"
                      ? "المصاريف"
                      : "الدخل"}
                </button>
              ))}
            </div>

            {/* Filter Toggle Button */}
            <button
              onClick={() => {
                hapticFeedback("medium");
                setShowFilters(!showFilters);
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 transition-all shadow-sm active:scale-95 text-xs font-black relative overflow-visible",
                showFilters
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800",
              )}
            >
              <Filter className="size-4" />
              <span>فلاتر متقدمة</span>
              {activeFiltersCount > 0 && (
                <span className="absolute -top-2.5 -left-2.5 bg-emerald-500 text-white size-5 rounded-full flex items-center justify-center text-[9px] font-black border-2 border-white dark:border-slate-900">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Sort Fields & Order Section */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-2xl border border-slate-200/20">
              <button
                onClick={() => {
                  hapticFeedback("light");
                  setSortField("date");
                }}
                className={cn(
                  "px-3 py-2 rounded-xl text-xs font-black transition-all",
                  sortField === "date"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300",
                )}
              >
                التاريخ
              </button>
              <button
                onClick={() => {
                  hapticFeedback("light");
                  setSortField("amount");
                }}
                className={cn(
                  "px-3 py-2 rounded-xl text-xs font-black transition-all",
                  sortField === "amount"
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300",
                )}
              >
                المبلغ
              </button>

              <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

              <button
                onClick={() => {
                  hapticFeedback("light");
                  setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
                }}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
                title={sortOrder === "desc" ? "ترتيب تنازلي" : "ترتيب تصاعدي"}
              >
                {sortOrder === "desc" ? (
                  <ArrowDown className="size-4 text-emerald-500" />
                ) : (
                  <ArrowUp className="size-4 text-rose-500" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Dismissible Filter Badges (Tag row) */}
        {activeFiltersList.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 pl-1">
              الفلاتر النشطة:
            </span>
            {activeFiltersList.map((filter) => (
              <div
                key={filter.id}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/20"
              >
                <span>{filter.label}</span>
                <button
                  onClick={() => {
                    hapticFeedback("light");
                    filter.clear();
                  }}
                  className="p-0.5 hover:bg-emerald-500/20 text-emerald-500 hover:text-emerald-700 rounded-full transition-colors"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                hapticFeedback("heavy");
                clearAllFilters();
              }}
              className="text-[10px] font-black text-rose-500 hover:text-rose-700 underline transition-colors pr-2"
            >
              مسح الكل
            </button>
          </div>
        )}

        {/* Advanced Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="pt-5 border-t border-slate-100 dark:border-slate-800/80 space-y-6">
                {/* Presets and Basic controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {/* Column 1: Time range & Presets */}
                  <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-3xl border border-slate-100 dark:border-slate-800/50 space-y-4">
                    <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
                      <Calendar className="size-4 text-emerald-500" />
                      <span className="text-xs font-bold">الفترة الزمنية</span>
                    </div>

                    {/* Quick Preset Chips */}
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => handleDatePreset("today")}
                        className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border border-slate-150 dark:border-slate-700 transition-all active:scale-95"
                      >
                        اليوم
                      </button>
                      <button
                        onClick={() => handleDatePreset("week")}
                        className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border border-slate-150 dark:border-slate-700 transition-all active:scale-95"
                      >
                        أسبوع
                      </button>
                      <button
                        onClick={() => handleDatePreset("month")}
                        className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border border-slate-150 dark:border-slate-700 transition-all active:scale-95"
                      >
                        شهر
                      </button>
                      <button
                        onClick={() => handleDatePreset("year")}
                        className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border border-slate-150 dark:border-slate-700 transition-all active:scale-95"
                      >
                        سنة
                      </button>
                      <button
                        onClick={() => handleDatePreset("all")}
                        className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border border-slate-150 dark:border-slate-700 transition-all active:scale-95"
                      >
                        الكل
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 pl-1">
                          من تاريخ
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-150 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 pl-1">
                          إلى تاريخ
                        </label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-150 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Category & Type */}
                  <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-3xl border border-slate-100 dark:border-slate-800/50 space-y-4">
                    <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
                      <ChartPie className="size-4 text-indigo-500" />
                      <span className="text-xs font-bold">التصنيفات والنوع</span>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 pl-1">
                            الفئات {categoryFilter.length > 0 && `(${categoryFilter.length} مختارة)`}
                          </label>
                          {categoryFilter.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                hapticFeedback("light");
                                setCategoryFilter([]);
                              }}
                              className="text-[10px] text-rose-500 hover:text-rose-600 font-bold hover:underline"
                            >
                              إلغاء التحديد
                            </button>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto p-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-150 dark:border-slate-700/80 custom-scrollbar">
                          <button
                            type="button"
                            onClick={() => {
                              hapticFeedback("light");
                              setCategoryFilter([]);
                            }}
                            className={cn(
                              "px-2.5 py-1 rounded-xl text-xs font-bold transition-all border",
                              categoryFilter.length === 0
                                ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                                : "bg-slate-50 dark:bg-slate-700/40 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600/60 hover:bg-slate-100 dark:hover:bg-slate-700"
                            )}
                          >
                            كل الفئات
                          </button>
                          {categories.map((cat) => {
                            const isSelected = categoryFilter.includes(cat.id);
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => {
                                  hapticFeedback("light");
                                  setCategoryFilter((prev) =>
                                    prev.includes(cat.id)
                                      ? prev.filter((id) => id !== cat.id)
                                      : [...prev, cat.id]
                                  );
                                }}
                                className={cn(
                                  "flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all border",
                                  isSelected
                                    ? "bg-indigo-500 text-white border-indigo-500 shadow-sm"
                                    : "bg-slate-50 dark:bg-slate-700/40 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600/60 hover:bg-slate-100 dark:hover:bg-slate-700"
                                )}
                              >
                                {cat.color && (
                                  <span
                                    className="size-2 rounded-full shrink-0 border border-white/40"
                                    style={{ backgroundColor: cat.color }}
                                  />
                                )}
                                <span>{cat.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 pl-1">
                          التقسيم المالي (50/30/20)
                        </label>
                        <select
                          value={typeFilter}
                          onChange={(e) => setTypeFilter(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white appearance-none"
                        >
                          <option value="">كل الأنواع</option>
                          <option value="need">احتياجات (50%)</option>
                          <option value="want">رغبات (30%)</option>
                          <option value="saving">ادخار (20%)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Account & Payment & Amount range */}
                  <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-3xl border border-slate-100 dark:border-slate-800/50 space-y-4">
                    <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
                      <Wallet className="size-4 text-amber-500" />
                      <span className="text-xs font-bold">الحسابات والعملية</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 pl-1">
                          الحساب
                        </label>
                        <select
                          value={accountFilter}
                          onChange={(e) => setAccountFilter(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white appearance-none"
                        >
                          <option value="">كل الحسابات</option>
                          {accounts.map((acc) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 pl-1">
                          طريقة الدفع
                        </label>
                        <select
                          value={paymentMethodFilter}
                          onChange={(e) =>
                            setPaymentMethodFilter(e.target.value as any)
                          }
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white appearance-none"
                        >
                          <option value="all">الكل</option>
                          <option value="cash">كاش</option>
                          <option value="card">بطاقة</option>
                          <option value="transfer">تحويل</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 pl-1">
                          الحد الأدنى ({currency})
                        </label>
                        <input
                          type="number"
                          placeholder="من"
                          value={minAmount}
                          onChange={(e) => setMinAmount(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-150 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 pl-1">
                          الحد الأقصى ({currency})
                        </label>
                        <input
                          type="number"
                          placeholder="إلى"
                          value={maxAmount}
                          onChange={(e) => setMaxAmount(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-150 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Clear Actions */}
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      hapticFeedback("heavy");
                      clearAllFilters();
                    }}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl border border-solid border-rose-200 dark:border-rose-950 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 hover:text-rose-600 dark:text-rose-400 transition-all font-black text-xs"
                  >
                    <X className="size-3.5" />
                    <span>إعادة تعيين كافة الفلاتر</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
