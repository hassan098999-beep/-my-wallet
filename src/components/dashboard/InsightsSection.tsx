import React from 'react';
import { motion, Variants } from 'motion/react';
import { Percent, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { WeeklyAnalysis } from '../WeeklyAnalysis';
import HeroSlidingDeck from '../HeroSlidingDeck';
import FinancialRadar from '../FinancialRadar';
import { SmartSavingChallengeCard } from '../SmartSavingChallengeCard';
import BehavioralAdvisor from '../BehavioralAdvisor';
import { Expense, Category, Account, Goal } from '../../types';

interface InsightsSectionProps {
  expenses: Expense[];
  categories: Category[];
  currency: string;
  heroTab: 'wallet' | 'anatomy' | 'savings';
  setHeroTab: (tab: 'wallet' | 'anatomy' | 'savings') => void;
  totalNetWorth: number;
  totalMonthlyIncome: number;
  totalMonthlyExpense: number;
  accounts: Account[];
  selectedAccountId: string | null;
  setSelectedAccountId: (id: string | null) => void;
  activeAccount: Account | undefined;
  typeSpent: { need: number; want: number; saving: number };
  goals: Goal[];
  setIsAddModalOpen: (open: boolean) => void;
  setEditingExpense: (exp: Expense | null) => void;
  budgetStatus: 'red' | 'orange' | 'green';
  todaySpending: number;
  rollingBudget: number;
  rollingBudgetEnabled: boolean;
  dailyBudget: number;
  remainingDailyBudget: number;
  showChallengeHelp: boolean;
  setShowChallengeHelp: (show: boolean) => void;
  currentChallenge: { title: string; desc: string };
  insights: any;
  activeInsightIdx: number;
  setActiveInsightIdx: React.Dispatch<React.SetStateAction<number>>;
  itemVariants: Variants;
}

export const InsightsSection: React.FC<InsightsSectionProps> = ({
  expenses,
  categories,
  currency,
  heroTab,
  setHeroTab,
  totalNetWorth,
  totalMonthlyIncome,
  totalMonthlyExpense,
  accounts,
  selectedAccountId,
  setSelectedAccountId,
  activeAccount,
  typeSpent,
  goals,
  setIsAddModalOpen,
  setEditingExpense,
  budgetStatus,
  todaySpending,
  rollingBudget,
  rollingBudgetEnabled,
  dailyBudget,
  remainingDailyBudget,
  showChallengeHelp,
  setShowChallengeHelp,
  currentChallenge,
  insights,
  activeInsightIdx,
  setActiveInsightIdx,
  itemVariants,
}) => {
  return (
    <div className="space-y-6">
      {/* Dynamic Weekly Spending Comparison and Smart Tips */}
      <WeeklyAnalysis 
        expenses={expenses}
        categories={categories}
        currency={currency}
      />

      {/* Promo banner for Savings Indicators */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="bg-emerald-500/10 dark:bg-emerald-500/5 hover:bg-emerald-500/15 dark:hover:bg-emerald-500/10 border-2 border-emerald-500/20 rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
      >
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Percent size={18} />
          </div>
          <div className="text-right">
            <h4 className="text-sm font-black text-slate-800 dark:text-white leading-snug">مؤشرات وفرص التوفير العائلية 🇹🇳</h4>
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold leading-relaxed mt-0.5">
              اكتشف نسبة ادخارك الحقيقية وجرّب محاكاة ترشيد قفة السوق ومستلزمات البيبي للحصول على نصائح تونسية عملية.
            </p>
          </div>
        </div>
        <Link
          to="/savings-indicators"
          className="self-start sm:self-auto bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-4 py-2.5 rounded-2xl text-xs font-black shadow-md shadow-emerald-500/15 flex items-center justify-center gap-1.5 shrink-0 transition-transform active:scale-95 duration-200 cursor-pointer"
        >
          <span>تصفح المؤشرات والذكاء المالي</span>
          <ArrowRight size={12} className="rotate-180" />
        </Link>
      </motion.div>

      {/* 2. Bento Grid Layout - Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Bento Card 1: Sliding Portfolio Deck (left 2 columns) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <HeroSlidingDeck
            heroTab={heroTab}
            setHeroTab={setHeroTab}
            totalNetWorth={totalNetWorth}
            currency={currency}
            totalMonthlyIncome={totalMonthlyIncome}
            totalMonthlyExpense={totalMonthlyExpense}
            accounts={accounts}
            selectedAccountId={selectedAccountId}
            setSelectedAccountId={setSelectedAccountId}
            activeAccount={activeAccount}
            typeSpent={typeSpent}
            goals={goals}
            setIsAddModalOpen={setIsAddModalOpen}
            setEditingExpense={setEditingExpense}
          />
        </div>

        {/* Bento Card 2: Interactive Smart Radar & Challenge speed dial (right 1 column) */}
        <div className="flex flex-col gap-6">
          <FinancialRadar
            budgetStatus={budgetStatus}
            todaySpending={todaySpending}
            rollingBudget={rollingBudget}
            rollingBudgetEnabled={rollingBudgetEnabled}
            currency={currency}
            dailyBudget={dailyBudget}
            remainingDailyBudget={remainingDailyBudget}
            showChallengeHelp={showChallengeHelp}
            setShowChallengeHelp={setShowChallengeHelp}
            currentChallenge={currentChallenge}
            itemVariants={itemVariants}
          />
          <SmartSavingChallengeCard />
        </div>

      </div>

      {/* 3. Interactive AI Behavioral Advisor Banner Row */}
      <BehavioralAdvisor
        insights={insights}
        activeInsightIdx={activeInsightIdx}
        setActiveInsightIdx={setActiveInsightIdx}
        itemVariants={itemVariants}
      />
    </div>
  );
};
