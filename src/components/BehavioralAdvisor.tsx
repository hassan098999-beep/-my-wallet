import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Sparkles, Lightbulb } from 'lucide-react';
import { hapticFeedback } from '../utils';

interface BehavioralAdvisorProps {
  insights: any[];
  activeInsightIdx: number;
  setActiveInsightIdx: React.Dispatch<React.SetStateAction<number>>;
  itemVariants?: any;
}

const BehavioralAdvisor: React.FC<BehavioralAdvisorProps> = ({
  insights,
  activeInsightIdx,
  setActiveInsightIdx,
  itemVariants
}) => {
  if (insights.length === 0) return null;

  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      className="bg-gradient-to-r from-violet-600/10 via-indigo-600/5 to-transparent border border-indigo-500/15 p-6 rounded-[2rem] shadow-sm relative overflow-hidden text-right"
      dir="rtl"
    >
      {/* Animated sparkles element */}
      <div className="absolute top-1/2 left-6 -translate-y-1/2 pointer-events-none text-indigo-500/20">
        <Sparkles size={100} className="animate-pulse" />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-3.5 w-full">
          <div className="w-12 h-12 bg-indigo-600/20 text-indigo-400 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
            <Lightbulb size={24} className="animate-bounce" />
          </div>
          <div className="text-right flex-1">
            <div className="flex items-center gap-2 justify-end">
              <span className="text-[9px] font-black uppercase tracking-wider bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full">سلوكي مخصص</span>
              <h4 className="text-base font-black text-slate-900 dark:text-white">المستشار المالي الذكي (AI Insight)</h4>
            </div>
            {/* Active Insight displaying */}
            <p className="text-sm font-black text-indigo-600 dark:text-indigo-400 mt-2">
              {insights[activeInsightIdx]?.title}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold mt-1">
              {insights[activeInsightIdx]?.description} {insights[activeInsightIdx]?.impact && <span className="font-black text-slate-500 dark:text-indigo-300"> ({insights[activeInsightIdx]?.impact})</span>}
            </p>
          </div>
        </div>

        {/* Quick Action Interactive Slides */}
        <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
          {insights.length > 1 && (
            <button
              onClick={() => {
                hapticFeedback('light');
                setActiveInsightIdx((prev) => (prev + 1) % insights.length);
              }}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-300 text-xs font-black transition-all cursor-pointer border border-transparent hover:border-slate-300/40"
            >
              التالي ({activeInsightIdx + 1}/{insights.length})
            </button>
          )}
          <Link
            to="/assistant"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-indigo-500/20 text-center cursor-pointer"
          >
            استشارة كاملة
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default BehavioralAdvisor;
