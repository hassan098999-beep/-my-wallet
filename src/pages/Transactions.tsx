import React, { useState, useMemo, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import { useAppContext } from "../store/AppContext";
import { cn, formatCurrency, hapticFeedback, formatTunisianAmount } from "../utils";
import {
  Skeleton,
  TransactionSkeleton,
  CardSkeleton,
} from "../components/Skeleton";
import { format, parseISO, isBefore, isSameDay } from "date-fns";
import { ar } from "date-fns/locale";
import {
  Search,
  Filter,
  Trash,
  DownloadCloud,
  UploadCloud,
  Database,
  ArrowDownUp,
  ArrowUp,
  ArrowDown,
  Calendar,
  FileText,
  ChartPie,
  CreditCard,
  Banknote,
  Building2,
  Pencil,
  X,
  CircleAlert,
  Wallet,
  Copy,
  RefreshCw,
  RefreshCcw,
} from "lucide-react";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";
import { DynamicIcon } from "../components/DynamicIcon";
import { motion, AnimatePresence } from "motion/react";
import { CategorySelect } from "../components/CategorySelect";
import { PaymentMethod } from "../types";

import { useWindowSize } from "../hooks/useWindowSize";
import { useDebounce } from "../hooks/useDebounce";
import { TransactionItem } from "../components/TransactionItem";

// Import unified design system components
import PageHeader from "../components/ui/PageHeader";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import Badge from "../components/ui/Badge";

const Transactions = () => {
  const { width } = useWindowSize();
  const [displayLimit, setDisplayLimit] = useState(20);

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [transactionType, setTransactionType] = useState<
    "all" | "expense" | "income"
  >("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [sortField, setSortField] = useState<"date" | "amount">("date");
  const [accountFilter, setAccountFilter] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<
    PaymentMethod | "all"
  >("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    expenses,
    income,
    categories,
    accounts,
    currency,
    updateExpense,
    deleteExpense,
    updateIncome,
    deleteIncome,
    addExpense,
    addIncome,
    exportData,
    importData,
  } = useAppContext()!;

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{
    id: string;
    type: "expense" | "income";
  } | null>(null);
  const transactionToDelete = useMemo(() => {
    if (!showDeleteConfirm) return null;
    return showDeleteConfirm.type === "expense"
      ? expenses.find((e) => e.id === showDeleteConfirm.id)
      : income.find((i) => i.id === showDeleteConfirm.id);
  }, [showDeleteConfirm, expenses, income]);

  const [editingTransaction, setEditingTransaction] = useState<any | null>(
    null,
  );

  const [editAmount, setEditAmount] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editAccountId, setEditAccountId] = useState("");
  const [editSubcategoryId, setEditSubcategoryId] = useState("");
  const [editSource, setEditSource] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editPaymentMethod, setEditPaymentMethod] =
    useState<PaymentMethod>("cash");
  const [editNote, setEditNote] = useState("");

  const filteredTransactions = useMemo(() => {
    const all = [
      ...expenses.map((e) => ({ ...e, type: "expense" as const })),
      ...income.map((i) => ({ ...i, type: "income" as const })),
    ];

    const parsedStartDate = startDate ? parseISO(startDate) : null;
    const parsedEndDate = endDate ? parseISO(endDate) : null;
    const lowerSearchTerm = debouncedSearchTerm.toLowerCase();

    return all
      .filter((t) => {
        const isExpense = t.type === "expense";
        const matchesSearch = isExpense
          ? ((t as any).note || "").toLowerCase().includes(lowerSearchTerm) ||
            (categories.find((c) => c.id === (t as any).categoryId)?.name || "")
              .toLowerCase()
              .includes(lowerSearchTerm)
          : (t as any).source.toLowerCase().includes(lowerSearchTerm);

        const matchesType =
          transactionType === "all" || t.type === transactionType;
        const matchesCategory =
          !categoryFilter ||
          (isExpense && (t as any).categoryId === categoryFilter);
        const matchesTypeFilter =
          !typeFilter ||
          (isExpense &&
            categories.find((c) => c.id === (t as any).categoryId)?.type ===
              typeFilter);
        const matchesAccount = !accountFilter || t.accountId === accountFilter;
        const matchesPaymentMethod =
          paymentMethodFilter === "all" ||
          (isExpense && (t as any).paymentMethod === paymentMethodFilter);

        const tDate = t.parsedDate || parseISO(t.date);
        const matchesStartDate =
          !parsedStartDate ||
          isBefore(parsedStartDate, tDate) ||
          isSameDay(parsedStartDate, tDate);
        const matchesEndDate =
          !parsedEndDate ||
          isBefore(tDate, parsedEndDate) ||
          isSameDay(tDate, parsedEndDate);

        const matchesMinAmount =
          !minAmount || t.amount >= parseFloat(minAmount);
        const matchesMaxAmount =
          !maxAmount || t.amount <= parseFloat(maxAmount);

        return (
          matchesSearch &&
          matchesType &&
          matchesCategory &&
          matchesTypeFilter &&
          matchesAccount &&
          matchesPaymentMethod &&
          matchesStartDate &&
          matchesEndDate &&
          matchesMinAmount &&
          matchesMaxAmount
        );
      })
      .sort((a, b) => {
        if (sortField === "amount") {
          return sortOrder === "desc"
            ? b.amount - a.amount
            : a.amount - b.amount;
        } else {
          const dateA = (a.parsedDate || parseISO(a.date)).getTime();
          const dateB = (b.parsedDate || parseISO(b.date)).getTime();
          return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
        }
      });
  }, [
    expenses,
    income,
    debouncedSearchTerm,
    transactionType,
    categoryFilter,
    typeFilter,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    sortOrder,
    sortField,
    accountFilter,
    paymentMethodFilter,
    categories,
  ]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (categoryFilter) count++;
    if (typeFilter) count++;
    if (startDate) count++;
    if (endDate) count++;
    if (accountFilter) count++;
    if (paymentMethodFilter !== 'all') count++;
    if (minAmount) count++;
    if (maxAmount) count++;
    return count;
  }, [categoryFilter, typeFilter, startDate, endDate, accountFilter, paymentMethodFilter, minAmount, maxAmount]);

  const activeFiltersList = useMemo(() => {
    const list: { id: string; label: string; clear: () => void }[] = [];
    if (categoryFilter) {
      const catName = categories.find(c => c.id === categoryFilter)?.name || "فئة";
      list.push({ id: 'category', label: `الفئة: ${catName}`, clear: () => setCategoryFilter("") });
    }
    if (typeFilter) {
      const typeLabel = typeFilter === 'need' ? 'احتياجات' : typeFilter === 'want' ? 'رغبات' : 'ادخار';
      list.push({ id: 'type', label: `النوع: ${typeLabel}`, clear: () => setTypeFilter("") });
    }
    if (startDate) {
      list.push({ id: 'startDate', label: `من: ${startDate}`, clear: () => setStartDate("") });
    }
    if (endDate) {
      list.push({ id: 'endDate', label: `إلى: ${endDate}`, clear: () => setEndDate("") });
    }
    if (accountFilter) {
      const accName = accounts.find(a => a.id === accountFilter)?.name || "حساب";
      list.push({ id: 'account', label: `الحساب: ${accName}`, clear: () => setAccountFilter("") });
    }
    if (paymentMethodFilter !== "all") {
      const payLabel = paymentMethodFilter === 'cash' ? 'كاش' : paymentMethodFilter === 'card' ? 'بطاقة' : 'تحويل';
      list.push({ id: 'payment', label: `الدفع: ${payLabel}`, clear: () => setPaymentMethodFilter("all") });
    }
    if (minAmount) {
      list.push({ id: 'minAmount', label: `أدنى: ${minAmount}`, clear: () => setMinAmount("") });
    }
    if (maxAmount) {
      list.push({ id: 'maxAmount', label: `أقصى: ${maxAmount}`, clear: () => setMaxAmount("") });
    }
    return list;
  }, [categoryFilter, typeFilter, startDate, endDate, accountFilter, paymentMethodFilter, minAmount, maxAmount, categories, accounts]);

  const handleDatePreset = (preset: 'today' | 'week' | 'month' | 'year' | 'all') => {
    hapticFeedback("light");
    const today = new Date();
    switch (preset) {
      case 'today': {
        const todayStr = today.toISOString().split('T')[0];
        setStartDate(todayStr);
        setEndDate(todayStr);
        break;
      }
      case 'week': {
        const first = today.getDate() - today.getDay();
        const firstDay = new Date(today.setDate(first));
        const lastDay = new Date(today.setDate(first + 6));
        setStartDate(firstDay.toISOString().split('T')[0]);
        setEndDate(lastDay.toISOString().split('T')[0]);
        break;
      }
      case 'month': {
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        setStartDate(firstDay.toISOString().split('T')[0]);
        setEndDate(lastDay.toISOString().split('T')[0]);
        break;
      }
      case 'year': {
        const currentYear = today.getFullYear();
        setStartDate(`${currentYear}-01-01`);
        setEndDate(`${currentYear}-12-31`);
        break;
      }
      case 'all':
      default:
        setStartDate("");
        setEndDate("");
        break;
    }
  };

  const totalIncome = useMemo(
    () =>
      filteredTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0),
    [filteredTransactions],
  );

  const totalExpenses = useMemo(
    () =>
      filteredTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0),
    [filteredTransactions],
  );

  const categoryData = useMemo(() => {
    const data: { name: string; value: number; color: string }[] = [];
    const relevantTransactions = filteredTransactions.filter(
      (t) => t.type === (transactionType === "income" ? "income" : "expense"),
    );

    if (transactionType === "income") {
      const sources: { [key: string]: number } = {};
      relevantTransactions.forEach((t) => {
        const source = (t as any).source || "أخرى";
        sources[source] = (sources[source] || 0) + t.amount;
      });
      Object.entries(sources).forEach(([name, value]) => {
        data.push({ name, value, color: "#10b981" });
      });
    } else {
      const cats: {
        [key: string]: { value: number; color: string; name: string };
      } = {};
      relevantTransactions.forEach((t) => {
        const cat = categories.find((c) => c.id === (t as any).categoryId);
        if (cat) {
          if (!cats[cat.id]) {
            cats[cat.id] = { value: 0, color: cat.color, name: cat.name };
          }
          cats[cat.id].value += t.amount;
        }
      });
      Object.values(cats).forEach((c) => data.push(c));
    }

    return data.sort((a, b) => b.value - a.value);
  }, [filteredTransactions, transactionType, categories]);

  const visibleTransactions = useMemo(
    () => filteredTransactions.slice(0, displayLimit),
    [filteredTransactions, displayLimit],
  );

  const hasMore = filteredTransactions.length > displayLimit;

  const loadMore = () => {
    setDisplayLimit((prev) => prev + 20);
  };

  const getPaymentLabel = (method: PaymentMethod) => {
    switch (method) {
      case "cash":
        return "كاش";
      case "card":
        return "بطاقة";
      case "transfer":
        return "تحويل";
      default:
        return method;
    }
  };

  const getPaymentIcon = (method: PaymentMethod) => {
    switch (method) {
      case "cash":
        return <Banknote size={14} />;
      case "card":
        return <CreditCard size={14} />;
      case "transfer":
        return <ArrowDownUp size={14} />;
      default:
        return <CreditCard size={14} />;
    }
  };

  const exportToCSV = () => {
    if (filteredTransactions.length === 0) {
      toast.error("لا توجد بيانات لتصديرها");
      return;
    }

    const headers = [
      "التاريخ",
      "النوع",
      "الفئة",
      "المصدر/الملاحظة",
      "المبلغ",
      "الحساب",
      "طريقة الدفع",
    ];
    const rows = filteredTransactions.map((t) => {
      const isExpense = t.type === "expense";
      const category = isExpense
        ? categories.find((c) => c.id === (t as any).categoryId)?.name
        : "دخل";
      const detail = isExpense
        ? (t as any).note || category
        : (t as any).source;
      const account =
        accounts.find((a) => a.id === t.accountId)?.name || "بدون حساب";
      const payment = isExpense
        ? getPaymentLabel((t as any).paymentMethod)
        : "-";

      return [
        format(parseISO(t.date), "yyyy-MM-dd"),
        isExpense ? "مصروف" : "دخل",
        category,
        detail,
        t.amount,
        account,
        payment,
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `transactions_${format(new Date(), "yyyy-MM-dd")}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("تم تصدير البيانات بنجاح");
  };

  const handleDelete = async (id: string, type: "expense" | "income") => {
    try {
      if (type === "expense") {
        await deleteExpense(id);
      } else {
        await deleteIncome(id);
      }
      toast.success("تم حذف العملية بنجاح");
      setShowDeleteConfirm(null);
      hapticFeedback("success");
    } catch (error) {
      toast.error("فشل حذف العملية");
    }
  };

  const handleEditClick = (transaction: any) => {
    setEditingTransaction(transaction);
    setEditAmount(transaction.amount.toString());
    setEditDate(transaction.date);
    setEditAccountId(transaction.accountId || "");

    if (transaction.type === "expense") {
      setEditCategoryId(transaction.categoryId);
      setEditSubcategoryId(transaction.subcategoryId || "");
      setEditPaymentMethod(transaction.paymentMethod);
      setEditNote(transaction.note || "");
    } else {
      setEditSource(transaction.source);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;

    try {
      const updates = {
        amount: parseFloat(editAmount),
        date: editDate,
        accountId: editAccountId || undefined,
      };

      if (editingTransaction.type === "expense") {
        await updateExpense(editingTransaction.id, {
          ...updates,
          categoryId: editCategoryId,
          subcategoryId: editSubcategoryId || undefined,
          paymentMethod: editPaymentMethod,
          note: editNote,
        });
      } else {
        await updateIncome(editingTransaction.id, {
          ...updates,
          source: editSource,
        });
      }

      toast.success("تم تحديث العملية بنجاح");
      setEditingTransaction(null);
      hapticFeedback("success");
    } catch (error) {
      toast.error("فشل تحديث العملية");
    }
  };

  const handleDuplicate = async (transaction: any) => {
    try {
      const { id, createdAt, ...rest } = transaction;
      if (transaction.type === "expense") {
        await addExpense({
          ...rest,
          date: new Date().toISOString().split("T")[0],
        });
      } else {
        await addIncome({
          ...rest,
          date: new Date().toISOString().split("T")[0],
        });
      }
      toast.success("تم تكرار العملية بنجاح");
      hapticFeedback("success");
    } catch (error) {
      toast.error("فشل تكرار العملية");
    }
  };

  const handleJsonImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      hapticFeedback("medium");
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result as string;
        try {
          await importData(content);
          setShowBackupModal(false);
        } catch (err) {
          toast.error("فشل استيراد النسخة الاحتياطية");
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6 p-4 pb-32 relative">
      <input
        type="file"
        ref={fileInputRef}
        accept=".json"
        onChange={handleJsonImport}
        className="hidden"
      />
      <motion.div className="space-y-3 md:space-y-6">
        <PageHeader
          title="سجل العمليات"
          subtitle="تتبع وإدارة جميع مصاريفك ودخلك بدقة وسلاسة في مكان واحد موحد"
          action={
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-3 w-full md:w-auto"
            >
              <button
                onClick={() => setShowBackupModal(true)}
                className="btn-secondary flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl md:rounded-3xl cursor-pointer"
              >
                <DownloadCloud
                  size={18}
                  className="group-hover:translate-y-0.5 transition-transform"
                />
                <span className="font-bold text-sm">النسخ الاحتياطي والملفات</span>
              </button>
            </motion.div>
          }
        />

        {/* Summary Stats & Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
          {/* Total Summary Cards */}
          <div className="lg:col-span-1 flex flex-col gap-4 md:gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card bg-emerald-600 rounded-[--radius-lg] p-4 md:p-6 text-white shadow-md shadow-emerald-500/20 relative overflow-hidden group flex-1 flex flex-col justify-between border-transparent"
            >
              <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                    <ArrowUp className="size-5 text-white" />
                  </div>
                  <span className="text-xs font-semibold opacity-70">
                    إجمالي الدخل
                  </span>
                </div>
                <div>
                  <div className="text-3xl md:text-4xl font-black leading-none">
                    {formatCurrency(totalIncome, currency)}
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between opacity-60">
                <span className="text-xs font-semibold">
                  معدل النمو
                </span>
                <span className="text-xs font-black">+12.5%</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card bg-rose-600 rounded-[--radius-lg] p-4 md:p-6 text-white shadow-md shadow-rose-500/20 relative overflow-hidden group flex-1 flex flex-col justify-between border-transparent"
            >
              <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                    <ArrowDown className="size-5 text-white" />
                  </div>
                  <span className="text-xs font-semibold opacity-70">
                    إجمالي المصاريف
                  </span>
                </div>
                <div>
                  <div className="text-3xl md:text-4xl font-black leading-none">
                    {formatCurrency(totalExpenses, currency)}
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between opacity-60">
                <span className="text-xs font-semibold">
                  معدل الإنفاق
                </span>
                <span className="text-xs font-black">مرتفع</span>
              </div>
            </motion.div>
          </div>

          {/* Filters Section */}
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
                    {(['all', 'expense', 'income'] as const).map((type) => (
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
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                        )}
                      >
                        {type === 'all' ? 'الكل' : type === 'expense' ? 'المصاريف' : 'الدخل'}
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
                      onClick={() => { hapticFeedback("light"); setSortField("date"); }}
                      className={cn(
                        "px-3 py-2 rounded-xl text-xs font-black transition-all",
                        sortField === "date"
                          ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                      )}
                    >
                      التاريخ
                    </button>
                    <button
                      onClick={() => { hapticFeedback("light"); setSortField("amount"); }}
                      className={cn(
                        "px-3 py-2 rounded-xl text-xs font-black transition-all",
                        sortField === "amount"
                          ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
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
                        onClick={() => { hapticFeedback("light"); filter.clear(); }}
                        className="p-0.5 hover:bg-emerald-500/20 text-emerald-500 hover:text-emerald-700 rounded-full transition-colors"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      hapticFeedback("heavy");
                      setSearchTerm("");
                      setTransactionType("all");
                      setCategoryFilter("");
                      setTypeFilter("");
                      setStartDate("");
                      setEndDate("");
                      setMinAmount("");
                      setMaxAmount("");
                      setSortField("date");
                      setAccountFilter("");
                      setPaymentMethodFilter("all");
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
                              onClick={() => handleDatePreset('today')}
                              className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border border-slate-150 dark:border-slate-700 transition-all active:scale-95"
                            >
                              اليوم
                            </button>
                            <button
                              onClick={() => handleDatePreset('week')}
                              className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border border-slate-150 dark:border-slate-700 transition-all active:scale-95"
                            >
                              أسبوع
                            </button>
                            <button
                              onClick={() => handleDatePreset('month')}
                              className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border border-slate-150 dark:border-slate-700 transition-all active:scale-95"
                            >
                              شهر
                            </button>
                            <button
                              onClick={() => handleDatePreset('year')}
                              className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border border-slate-150 dark:border-slate-700 transition-all active:scale-95"
                            >
                              سنة
                            </button>
                            <button
                              onClick={() => handleDatePreset('all')}
                              className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border border-slate-150 dark:border-slate-700 transition-all active:scale-95"
                            >
                              الكل
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <div className="space-y-1">
                              <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 pl-1">من تاريخ</label>
                              <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-150 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 pl-1">إلى تاريخ</label>
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
                            <div className="space-y-1">
                              <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 pl-1">الفئة</label>
                              <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white appearance-none"
                              >
                                <option value="">كل الفئات</option>
                                {categories.map((cat) => (
                                  <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 pl-1">التقسيم المالي (50/30/20)</label>
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
                              <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 pl-1">الحساب</label>
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
                              <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 pl-1">طريقة الدفع</label>
                              <select
                                value={paymentMethodFilter}
                                onChange={(e) => setPaymentMethodFilter(e.target.value as any)}
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
                              <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 pl-1">الحد الأدنى ({currency})</label>
                              <input
                                type="number"
                                placeholder="من"
                                value={minAmount}
                                onChange={(e) => setMinAmount(e.target.value)}
                                className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-150 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 pl-1">الحد الأقصى ({currency})</label>
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
                            setSearchTerm("");
                            setTransactionType("all");
                            setCategoryFilter("");
                            setTypeFilter("");
                            setStartDate("");
                            setEndDate("");
                            setMinAmount("");
                            setMaxAmount("");
                            setSortField("date");
                            setAccountFilter("");
                            setPaymentMethodFilter("all");
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
        </div>

        {/* Spending Summary Chart */}
        {categoryData.length > 0 && (
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
        )}

        {/* Transactions List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="card p-0 overflow-hidden"
        >
          <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl z-20">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <FileText className="size-5 md:size-6" />
              </div>
              <h2 className="text-[--text-h2] font-semibold text-slate-900 dark:text-white">
                قائمة العمليات
              </h2>
            </div>
          </div>

          {filteredTransactions.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
              <AnimatePresence>
                {visibleTransactions.map((transaction, index) => (
                  <TransactionItem
                    key={transaction.id}
                    transaction={transaction}
                    categories={categories}
                    accounts={accounts}
                    currency={currency}
                    index={index}
                    onEdit={handleEditClick}
                    onDelete={(id, type) => setShowDeleteConfirm({ id, type })}
                    onDuplicate={handleDuplicate}
                    getPaymentIcon={getPaymentIcon}
                    getPaymentLabel={getPaymentLabel}
                  />
                ))}
              </AnimatePresence>

              {hasMore && (
                <div className="p-8 text-center">
                  <button
                    onClick={loadMore}
                    className="btn-secondary px-10 py-4 rounded-2xl text-sm font-semibold"
                  >
                    تحميل المزيد
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="py-20">
              <EmptyState
                icon={Search}
                title="لا توجد نتائج مطابقة"
                description="لم نجد أي عمليات تطابق معايير البحث أو فلاتر التصفية الحالية. جرّب تعديل الفلاتر أو إعادة تعيينها بالكامل لتظهر العمليات مجدداً."
                actionLabel="إعادة تعيين كافة الفلاتر"
                onAction={() => {
                  hapticFeedback("heavy");
                  setSearchTerm("");
                  setCategoryFilter("");
                  setStartDate("");
                  setEndDate("");
                  setMinAmount("");
                  setMaxAmount("");
                  setSortField("date");
                  setAccountFilter("");
                  setPaymentMethodFilter("all");
                }}
              />
            </div>
          )}
        </motion.div>

        {/* Edit Modal */}
        <AnimatePresence>
          {editingTransaction && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setEditingTransaction(null)}
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
                    onClick={() => setEditingTransaction(null)}
                    className="p-1.5 md:p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    <X className="size-5 md:size-6" />
                  </button>
                </div>

                <form
                  onSubmit={handleUpdate}
                  className="space-y-3 md:space-y-4"
                >
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-1">
                      المبلغ ({currency})
                    </label>
                     <input
                      type="text"
                      inputMode="decimal"
                      value={editAmount}
                      onChange={(e) => setEditAmount(formatTunisianAmount(e.target.value))}
                      onFocus={(e) => {
                        if (!editAmount || editAmount === '0' || editAmount === '0.000' || parseFloat(editAmount) === 0) {
                          setEditAmount('');
                        } else {
                          e.target.select();
                        }
                      }}
                      onClick={(e) => {
                        if (!editAmount || editAmount === '0' || editAmount === '0.000' || parseFloat(editAmount) === 0) {
                          setEditAmount('');
                        } else {
                          (e.target as HTMLInputElement).select();
                        }
                      }}
                      className="w-full px-3 py-2 md:px-4 md:py-2.5 rounded-xl md:rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-mono font-black text-sm md:text-base"
                      required
                    />
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
                              <option value="">
                                اختر تصنيفاً فرعياً (اختياري)
                              </option>
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
                      onClick={() => setEditingTransaction(null)}
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

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteConfirm && transactionToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowDeleteConfirm(null)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-md border border-white/20 dark:border-slate-800 p-5 md:p-6 overflow-hidden text-center"
              >
                <div className="w-16 h-16 md:w-20 md:h-20 bg-rose-500/10 rounded-2xl md:rounded-3xl flex items-center justify-center text-rose-500 mx-auto mb-5 md:mb-6">
                  <CircleAlert size={40} />
                </div>

                <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">
                  تأكيد الحذف
                </h2>
                <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium mb-6 md:mb-8">
                  {(transactionToDelete as any).isTransfer
                    ? "هل أنت متأكد من رغبتك في حذف هذا التحويل؟ سيتم حذف كل من عملية الخصم والإيداع المرتبطة به. لا يمكن التراجع عن هذا الإجراء."
                    : "هل أنت متأكد من رغبتك في حذف هذه العملية؟ لا يمكن التراجع عن هذا الإجراء."}
                </p>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 md:p-4 rounded-xl md:rounded-2xl mb-6 md:mb-8 flex items-center justify-between border border-slate-100 dark:border-slate-700">
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      العملية
                    </p>
                    <p className="text-sm md:text-base font-bold text-slate-900 dark:text-white">
                      {(transactionToDelete as any).isTransfer
                        ? showDeleteConfirm.type === "expense"
                          ? (transactionToDelete as any).note
                          : (transactionToDelete as any).source
                        : showDeleteConfirm.type === "expense"
                          ? (transactionToDelete as any).note ||
                            categories.find(
                              (c) =>
                                c.id ===
                                (transactionToDelete as any).categoryId,
                            )?.name
                          : (transactionToDelete as any).source}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 text-left mb-1">
                      المبلغ
                    </p>
                    <p
                      className={cn(
                        "text-sm md:text-base font-black",
                        (transactionToDelete as any).isTransfer
                          ? "text-indigo-500"
                          : showDeleteConfirm.type === "expense"
                            ? "text-rose-500"
                            : "text-emerald-500",
                      )}
                    >
                      {formatCurrency(transactionToDelete.amount, currency)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2.5 md:gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl font-semibold text-xs md:text-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={() =>
                      handleDelete(showDeleteConfirm.id, showDeleteConfirm.type)
                    }
                    className="flex-1 px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl font-semibold text-xs md:text-sm bg-rose-500 text-white hover:bg-rose-600 shadow-md shadow-rose-500/20 transition-all"
                  >
                    حذف نهائي
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Backup & Import/Export Modal */}
        <AnimatePresence>
          {showBackupModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowBackupModal(false)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 p-5 md:p-6 text-right z-10"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                      <Database className="size-5" />
                    </div>
                    <div>
                      <h2 className="text-base md:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                        إدارة البيانات والنسخ الاحتياطي
                      </h2>
                      <p className="text-[10px] md:text-xs font-bold text-slate-400 mt-0.5">
                        قم بحفظ واستعادة مصاريفك وملفك المالي محلياً بأمان تام
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowBackupModal(false)}
                    className="p-1.5 md:p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                {/* Info Box */}
                <div className="p-3.5 mb-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
                  يتم حفظ جميع عملياتك المالية محلياً على جهازك. ننصحك دائماً بأخذ نسخة احتياطية من ملفاتك بشكل دوري لتجنب فقدان البيانات عند مسح ذاكرة التخزين المؤقت للمتصفح.
                </div>

                {/* Action Cards */}
                <div className="space-y-3 mb-6">
                  {/* Export JSON Card */}
                  <button
                    onClick={() => {
                      hapticFeedback("medium");
                      exportData("json");
                    }}
                    className="w-full flex items-start gap-4 p-4 bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-100 dark:border-slate-800 rounded-2xl text-right transition-all group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform shrink-0">
                      <DownloadCloud className="size-5" />
                    </div>
                    <div className="space-y-0.5 flex-1">
                      <div className="text-xs font-black text-slate-900 dark:text-white flex items-center justify-between">
                        <span>تصدير نسخة احتياطية كاملة (JSON)</span>
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500">موصى به</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                        قم بتحميل ملف JSON يحتوي على كافة المصاريف، الميزانيات، الفئات والحسابات لاسترجاعها لاحقاً.
                      </p>
                    </div>
                  </button>

                  {/* Import JSON Card */}
                  <button
                    onClick={() => {
                      hapticFeedback("medium");
                      fileInputRef.current?.click();
                    }}
                    className="w-full flex items-start gap-4 p-4 bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-100 dark:border-slate-800 rounded-2xl text-right transition-all group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
                      <UploadCloud className="size-5" />
                    </div>
                    <div className="space-y-0.5 flex-1">
                      <div className="text-xs font-black text-slate-900 dark:text-white">
                        استيراد نسخة احتياطية (JSON)
                      </div>
                      <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                        قم برفع ملف JSON المحفوظ مسبقاً لاستبدال واستعادة كافة تفاصيل الدفتر المالي محلياً وسحابياً.
                      </p>
                    </div>
                  </button>

                  {/* Export CSV Card */}
                  <button
                    onClick={() => {
                      hapticFeedback("medium");
                      exportToCSV();
                      setShowBackupModal(false);
                    }}
                    className="w-full flex items-start gap-4 p-4 bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-100 dark:border-slate-800 rounded-2xl text-right transition-all group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform shrink-0">
                      <FileText className="size-5" />
                    </div>
                    <div className="space-y-0.5 flex-1">
                      <div className="text-xs font-black text-slate-900 dark:text-white">
                        تصدير كملف Excel (CSV)
                      </div>
                      <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                        تصدير المعاملات المصفاة حالياً كجدول بيانات CSV ملائم للفتح ببرامج Excel أو Google Sheets.
                      </p>
                    </div>
                  </button>
                </div>

                {/* Footer */}
                <div className="flex gap-2.5">
                  <button
                    onClick={() => setShowBackupModal(false)}
                    className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer text-center"
                  >
                    إغلاق النافذة
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Transactions;
