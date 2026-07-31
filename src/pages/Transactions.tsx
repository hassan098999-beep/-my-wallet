import React, { useState, useMemo, useRef } from "react";
import toast from "react-hot-toast";
import { useAppContext } from "../store/AppContext";
import { hapticFeedback } from "../utils";
import { parseISO, isBefore, isSameDay, format } from "date-fns";
import { DownloadCloud, Banknote, CreditCard, ArrowDownUp, Trash } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PaymentMethod } from "../types";

import { useWindowSize } from "../hooks/useWindowSize";
import { useDebounce } from "../hooks/useDebounce";

import PageHeader from "../components/ui/PageHeader";
import { TransactionsSummary } from "../components/transactions/TransactionsSummary";
import { TransactionsFilters } from "../components/transactions/TransactionsFilters";
import { TransactionsChart } from "../components/transactions/TransactionsChart";
import { TransactionsList } from "../components/transactions/TransactionsList";
import { EditTransactionModal } from "../components/transactions/EditTransactionModal";
import { DeleteConfirmModal } from "../components/transactions/DeleteConfirmModal";
import { BackupModal } from "../components/transactions/BackupModal";

const Transactions = () => {
  const { width } = useWindowSize();
  const [displayLimit, setDisplayLimit] = useState(20);

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [transactionType, setTransactionType] = useState<
    "all" | "expense" | "income"
  >("all");
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
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
          categoryFilter.length === 0 ||
          (isExpense && categoryFilter.includes((t as any).categoryId));
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
    if (categoryFilter.length > 0) count++;
    if (typeFilter) count++;
    if (startDate) count++;
    if (endDate) count++;
    if (accountFilter) count++;
    if (paymentMethodFilter !== "all") count++;
    if (minAmount) count++;
    if (maxAmount) count++;
    return count;
  }, [
    categoryFilter,
    typeFilter,
    startDate,
    endDate,
    accountFilter,
    paymentMethodFilter,
    minAmount,
    maxAmount,
  ]);

  const activeFiltersList = useMemo(() => {
    const list: { id: string; label: string; clear: () => void }[] = [];
    if (categoryFilter.length > 0) {
      const selectedNames = categories
        .filter((c) => categoryFilter.includes(c.id))
        .map((c) => c.name);
      const labelText =
        selectedNames.length <= 2
          ? selectedNames.join("، ")
          : `${selectedNames.slice(0, 2).join("، ")} +${selectedNames.length - 2}`;
      list.push({
        id: "category",
        label: `الفئات: ${labelText || categoryFilter.length}`,
        clear: () => setCategoryFilter([]),
      });
    }
    if (typeFilter) {
      const typeLabel =
        typeFilter === "need"
          ? "احتياجات"
          : typeFilter === "want"
            ? "رغبات"
            : "ادخار";
      list.push({
        id: "type",
        label: `النوع: ${typeLabel}`,
        clear: () => setTypeFilter(""),
      });
    }
    if (startDate) {
      list.push({
        id: "startDate",
        label: `من: ${startDate}`,
        clear: () => setStartDate(""),
      });
    }
    if (endDate) {
      list.push({
        id: "endDate",
        label: `إلى: ${endDate}`,
        clear: () => setEndDate(""),
      });
    }
    if (accountFilter) {
      const accName =
        accounts.find((a) => a.id === accountFilter)?.name || "حساب";
      list.push({
        id: "account",
        label: `الحساب: ${accName}`,
        clear: () => setAccountFilter(""),
      });
    }
    if (paymentMethodFilter !== "all") {
      const payLabel =
        paymentMethodFilter === "cash"
          ? "كاش"
          : paymentMethodFilter === "card"
            ? "بطاقة"
            : "تحويل";
      list.push({
        id: "payment",
        label: `الدفع: ${payLabel}`,
        clear: () => setPaymentMethodFilter("all"),
      });
    }
    if (minAmount) {
      list.push({
        id: "minAmount",
        label: `أدنى: ${minAmount}`,
        clear: () => setMinAmount(""),
      });
    }
    if (maxAmount) {
      list.push({
        id: "maxAmount",
        label: `أقصى: ${maxAmount}`,
        clear: () => setMaxAmount(""),
      });
    }
    return list;
  }, [
    categoryFilter,
    typeFilter,
    startDate,
    endDate,
    accountFilter,
    paymentMethodFilter,
    minAmount,
    maxAmount,
    categories,
    accounts,
  ]);

  const handleDatePreset = (
    preset: "today" | "week" | "month" | "year" | "all",
  ) => {
    hapticFeedback("light");
    const today = new Date();
    switch (preset) {
      case "today": {
        const todayStr = today.toISOString().split("T")[0];
        setStartDate(todayStr);
        setEndDate(todayStr);
        break;
      }
      case "week": {
        const first = today.getDate() - today.getDay();
        const firstDay = new Date(today.setDate(first));
        const lastDay = new Date(today.setDate(first + 6));
        setStartDate(firstDay.toISOString().split("T")[0]);
        setEndDate(lastDay.toISOString().split("T")[0]);
        break;
      }
      case "month": {
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          0,
        );
        setStartDate(firstDay.toISOString().split("T")[0]);
        setEndDate(lastDay.toISOString().split("T")[0]);
        break;
      }
      case "year": {
        const currentYear = today.getFullYear();
        setStartDate(`${currentYear}-01-01`);
        setEndDate(`${currentYear}-12-31`);
        break;
      }
      case "all":
      default:
        setStartDate("");
        setEndDate("");
        break;
    }
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setCategoryFilter([]);
    setTypeFilter("");
    setStartDate("");
    setEndDate("");
    setMinAmount("");
    setMaxAmount("");
    setSortField("date");
    setSortOrder("desc");
    setAccountFilter("");
    setPaymentMethodFilter("all");
  };

  const prevDateRange = useMemo(() => {
    if (!startDate || !endDate) return null;
    const parsedStart = parseISO(startDate);
    const parsedEnd = parseISO(endDate);
    const duration = parsedEnd.getTime() - parsedStart.getTime();
    const shift = duration + 24 * 60 * 60 * 1000;
    return {
      start: new Date(parsedStart.getTime() - shift),
      end: new Date(parsedEnd.getTime() - shift),
    };
  }, [startDate, endDate]);

  const { prevTotalIncome, prevTotalExpenses } = useMemo(() => {
    if (!prevDateRange) return { prevTotalIncome: null, prevTotalExpenses: null };
    const all = [
      ...expenses.map((e) => ({ ...e, type: "expense" as const })),
      ...income.map((i) => ({ ...i, type: "income" as const })),
    ];
    const lowerSearchTerm = debouncedSearchTerm.toLowerCase();

    let pIncome = 0;
    let pExpenses = 0;

    all.forEach((t) => {
      const isExpense = t.type === "expense";
      
      if (isExpense && (t as any).isTransfer) return;
      if (!isExpense && (t as any).isTransfer) return;

      const matchesSearch = isExpense
        ? ((t as any).note || "").toLowerCase().includes(lowerSearchTerm) ||
          (categories.find((c) => c.id === (t as any).categoryId)?.name || "")
            .toLowerCase()
            .includes(lowerSearchTerm)
        : (t as any).source.toLowerCase().includes(lowerSearchTerm);

      const matchesType = transactionType === "all" || t.type === transactionType;
      const matchesCategory =
        categoryFilter.length === 0 ||
        (isExpense && categoryFilter.includes((t as any).categoryId));
      const matchesTypeFilter = !typeFilter || (isExpense && categories.find((c) => c.id === (t as any).categoryId)?.type === typeFilter);
      const matchesAccount = !accountFilter || t.accountId === accountFilter;
      const matchesPaymentMethod = paymentMethodFilter === "all" || (isExpense && (t as any).paymentMethod === paymentMethodFilter);
      const matchesMinAmount = !minAmount || t.amount >= parseFloat(minAmount);
      const matchesMaxAmount = !maxAmount || t.amount <= parseFloat(maxAmount);

      if (
        matchesSearch &&
        matchesType &&
        matchesCategory &&
        matchesTypeFilter &&
        matchesAccount &&
        matchesPaymentMethod &&
        matchesMinAmount &&
        matchesMaxAmount
      ) {
        const tDate = t.parsedDate || parseISO(t.date);
        if (
          (isBefore(prevDateRange.start, tDate) || isSameDay(prevDateRange.start, tDate)) &&
          (isBefore(tDate, prevDateRange.end) || isSameDay(tDate, prevDateRange.end))
        ) {
          if (isExpense) pExpenses += t.amount;
          else pIncome += t.amount;
        }
      }
    });

    return { prevTotalIncome: pIncome, prevTotalExpenses: pExpenses };
  }, [
    prevDateRange,
    expenses,
    income,
    debouncedSearchTerm,
    transactionType,
    categoryFilter,
    typeFilter,
    minAmount,
    maxAmount,
    accountFilter,
    paymentMethodFilter,
    categories,
  ]);

  const totalIncome = useMemo(
    () =>
      filteredTransactions
        .filter((t) => t.type === "income" && !(t as any).isTransfer)
        .reduce((sum, t) => sum + t.amount, 0),
    [filteredTransactions],
  );

  const totalExpenses = useMemo(
    () =>
      filteredTransactions
        .filter((t) => t.type === "expense" && !(t as any).isTransfer)
        .reduce((sum, t) => sum + t.amount, 0),
    [filteredTransactions],
  );

  const incomeDiff = useMemo(() => {
    if (prevTotalIncome === null) return null;
    return prevTotalIncome > 0 ? ((totalIncome - prevTotalIncome) / prevTotalIncome) * 100 : (totalIncome > 0 ? 100 : 0);
  }, [totalIncome, prevTotalIncome]);

  const expenseDiff = useMemo(() => {
    if (prevTotalExpenses === null) return null;
    return prevTotalExpenses > 0 ? ((totalExpenses - prevTotalExpenses) / prevTotalExpenses) * 100 : (totalExpenses > 0 ? 100 : 0);
  }, [totalExpenses, prevTotalExpenses]);

  const { dailyAverageExpense, daysCount } = useMemo(() => {
    const filteredExpensesList = filteredTransactions.filter(
      (t) => t.type === "expense" && !(t as any).isTransfer
    );
    const totalExp = filteredExpensesList.reduce((sum, t) => sum + t.amount, 0);

    if (filteredExpensesList.length === 0 || totalExp === 0) {
      return { dailyAverageExpense: 0, daysCount: 1 };
    }

    let days = 1;
    if (startDate && endDate) {
      const startMs = parseISO(startDate).getTime();
      const endMs = parseISO(endDate).getTime();
      if (!isNaN(startMs) && !isNaN(endMs) && endMs >= startMs) {
        days = Math.max(1, Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24)) + 1);
      }
    } else {
      const timestamps = filteredExpensesList
        .map((t) => {
          const d = t.parsedDate || parseISO(t.date);
          return d.getTime();
        })
        .filter((t) => !isNaN(t));

      if (timestamps.length > 0) {
        const minMs = Math.min(...timestamps);
        const maxMs = Math.max(...timestamps);
        const diffDays = Math.ceil((maxMs - minMs) / (1000 * 60 * 60 * 24)) + 1;
        days = Math.max(1, diffDays);
      }
    }

    return {
      dailyAverageExpense: totalExp / days,
      daysCount: days,
    };
  }, [filteredTransactions, startDate, endDate]);

  const topTransaction = useMemo(() => {
    if (filteredTransactions.length === 0) return null;

    const nonTransfers = filteredTransactions.filter((t) => !(t as any).isTransfer);
    const candidates = nonTransfers.length > 0 ? nonTransfers : filteredTransactions;

    let maxTx: any = null;
    for (const t of candidates) {
      if (!maxTx || t.amount > maxTx.amount) {
        maxTx = t;
      }
    }

    if (!maxTx) return null;

    const isExpense = maxTx.type === "expense";
    let categoryName = "";
    if (isExpense) {
      const cat = categories.find((c) => c.id === maxTx.categoryId);
      categoryName = cat ? cat.name : (maxTx.note || "مصروف");
    } else {
      categoryName = maxTx.source || "دخل";
    }

    return {
      amount: maxTx.amount,
      categoryName,
      type: maxTx.type as "expense" | "income",
      note: maxTx.note || "",
    };
  }, [filteredTransactions, categories]);

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

  const handleToggleSelectTransaction = (transaction: any) => {
    const key = `${transaction.type}-${transaction.id}`;
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleToggleSelectionMode = () => {
    hapticFeedback("medium");
    if (isSelectionMode) {
      setIsSelectionMode(false);
      setSelectedKeys(new Set());
    } else {
      setIsSelectionMode(true);
    }
  };

  const handleSelectAllVisible = () => {
    hapticFeedback("light");
    const visibleKeys = visibleTransactions.map((t) => `${t.type}-${t.id}`);
    const allSelected = visibleKeys.every((k) => selectedKeys.has(k));

    if (allSelected) {
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        visibleKeys.forEach((k) => next.delete(k));
        return next;
      });
    } else {
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        visibleKeys.forEach((k) => next.add(k));
        return next;
      });
    }
  };

  const selectedTransactionsToDelete = useMemo(() => {
    if (selectedKeys.size === 0) return [];
    const all = [
      ...expenses.map((e) => ({ ...e, type: "expense" as const })),
      ...income.map((i) => ({ ...i, type: "income" as const })),
    ];
    return all.filter((t) => selectedKeys.has(`${t.type}-${t.id}`));
  }, [selectedKeys, expenses, income]);

  const handleBulkDelete = async () => {
    if (selectedTransactionsToDelete.length === 0) return;
    try {
      for (const item of selectedTransactionsToDelete) {
        if (item.type === "expense") {
          await deleteExpense(item.id);
        } else {
          await deleteIncome(item.id);
        }
      }
      toast.success(`تم حذف ${selectedTransactionsToDelete.length} عملية بنجاح`);
      setSelectedKeys(new Set());
      setShowBulkDeleteConfirm(false);
      setIsSelectionMode(false);
      hapticFeedback("success");
    } catch (error) {
      toast.error("فشل حذف العمليات المحددة");
    }
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
                <span className="font-bold text-sm">
                  النسخ الاحتياطي والملفات
                </span>
              </button>
            </motion.div>
          }
        />

        {/* Summary Stats & Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
          <TransactionsSummary
            totalIncome={totalIncome}
            totalExpenses={totalExpenses}
            currency={currency}
            incomeDiff={incomeDiff}
            expenseDiff={expenseDiff}
            dailyAverageExpense={dailyAverageExpense}
            daysCount={daysCount}
            topTransaction={topTransaction}
          />

          <TransactionsFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            transactionType={transactionType}
            setTransactionType={setTransactionType}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            activeFiltersCount={activeFiltersCount}
            sortField={sortField}
            setSortField={setSortField}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            activeFiltersList={activeFiltersList}
            handleDatePreset={handleDatePreset}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            categories={categories}
            accountFilter={accountFilter}
            setAccountFilter={setAccountFilter}
            accounts={accounts}
            paymentMethodFilter={paymentMethodFilter}
            setPaymentMethodFilter={setPaymentMethodFilter}
            minAmount={minAmount}
            setMinAmount={setMinAmount}
            maxAmount={maxAmount}
            setMaxAmount={setMaxAmount}
            currency={currency}
            clearAllFilters={clearAllFilters}
          />
        </div>

        {/* Spending Summary Chart */}
        <TransactionsChart
          categoryData={categoryData}
          transactionType={transactionType}
          currency={currency}
          width={width}
        />

        {/* Transactions List */}
        <TransactionsList
          filteredTransactions={filteredTransactions}
          visibleTransactions={visibleTransactions}
          categories={categories}
          accounts={accounts}
          currency={currency}
          hasMore={hasMore}
          loadMore={loadMore}
          onEdit={handleEditClick}
          onDeleteConfirm={(id, type) => setShowDeleteConfirm({ id, type })}
          onDuplicate={handleDuplicate}
          getPaymentIcon={getPaymentIcon}
          getPaymentLabel={getPaymentLabel}
          onResetFilters={() => {
            hapticFeedback("heavy");
            clearAllFilters();
          }}
          isSelectionMode={isSelectionMode}
          onToggleSelectionMode={handleToggleSelectionMode}
          selectedKeys={selectedKeys}
          onToggleSelectTransaction={handleToggleSelectTransaction}
          onSelectAllVisible={handleSelectAllVisible}
        />

        {/* Edit Modal */}
        <EditTransactionModal
          editingTransaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          currency={currency}
          editAmount={editAmount}
          setEditAmount={setEditAmount}
          editCategoryId={editCategoryId}
          setEditCategoryId={setEditCategoryId}
          editAccountId={editAccountId}
          setEditAccountId={setEditAccountId}
          editSubcategoryId={editSubcategoryId}
          setEditSubcategoryId={setEditSubcategoryId}
          editSource={editSource}
          setEditSource={setEditSource}
          editDate={editDate}
          setEditDate={setEditDate}
          editPaymentMethod={editPaymentMethod}
          setEditPaymentMethod={setEditPaymentMethod}
          editNote={editNote}
          setEditNote={setEditNote}
          categories={categories}
          accounts={accounts}
          handleUpdate={handleUpdate}
          getPaymentIcon={getPaymentIcon}
          getPaymentLabel={getPaymentLabel}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal
          showDeleteConfirm={showDeleteConfirm}
          transactionToDelete={transactionToDelete}
          showBulkDeleteConfirm={showBulkDeleteConfirm}
          bulkTransactionsToDelete={selectedTransactionsToDelete}
          categories={categories}
          currency={currency}
          onClose={() => {
            setShowDeleteConfirm(null);
            setShowBulkDeleteConfirm(false);
          }}
          onDelete={handleDelete}
          onBulkDelete={handleBulkDelete}
        />

        {/* Backup & Import/Export Modal */}
        <BackupModal
          showBackupModal={showBackupModal}
          onClose={() => setShowBackupModal(false)}
          fileInputRef={fileInputRef}
          exportData={exportData}
          exportToCSV={exportToCSV}
          handleJsonImport={handleJsonImport}
        />
      </motion.div>

      {/* Fixed Floating Action Bar for Bulk Selection */}
      <AnimatePresence>
        {isSelectionMode && selectedKeys.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 dark:bg-slate-900/95 text-white shadow-2xl border border-slate-700/80 backdrop-blur-xl rounded-2xl px-5 py-3 flex items-center gap-3 md:gap-4 max-w-[90vw] sm:max-w-md"
          >
            <div className="text-xs md:text-sm font-bold text-slate-200 whitespace-nowrap">
              محدد: <span className="text-indigo-400 font-mono text-base">{selectedKeys.size}</span>
            </div>

            <div className="h-5 w-px bg-slate-700" />

            <button
              type="button"
              onClick={() => {
                hapticFeedback("light");
                setSelectedKeys(new Set());
              }}
              className="px-3 py-2 rounded-xl text-xs md:text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
            >
              إلغاء التحديد
            </button>

            <button
              type="button"
              onClick={() => {
                hapticFeedback("medium");
                setShowBulkDeleteConfirm(true);
              }}
              className="px-4 py-2 rounded-xl text-xs md:text-sm font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Trash size={15} />
              <span>حذف المحدد ({selectedKeys.size})</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Transactions;
