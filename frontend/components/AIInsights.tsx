"use client";

import { motion } from "framer-motion";
import { Lightbulb, TrendingDown, PiggyBank, CheckCircle2, Sparkles } from "lucide-react";
import { LLMInsight } from "@/lib/types";

interface Props {
  insight: LLMInsight;
}

export default function AIInsights({ insight }: Props) {
  return (
    <div className="space-y-4 animate-fade-in">

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br
          from-emerald-50 to-teal-50/60 dark:from-emerald-950/40 dark:to-teal-950/30
          border border-emerald-200/60 dark:border-emerald-700/30 p-5"
      >
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full
          bg-emerald-400/10 blur-2xl pointer-events-none" />
        <div className="relative flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0 shadow-sm">
            <CheckCircle2 size={16} className="text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-emerald-800 dark:text-emerald-300 text-sm mb-1.5">
              Analysis Summary
            </h3>
            <p className="text-emerald-700 dark:text-emerald-200 text-sm leading-relaxed">
              {insight.summary}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="glass rounded-2xl p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600
            flex items-center justify-center shadow-sm">
            <Lightbulb size={15} className="text-white" />
          </div>
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Recommendations</h3>
        </div>
        <ol className="space-y-3">
          {insight.recommendations.map((rec, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              className="flex items-start gap-3"
            >
              <span className="flex-shrink-0 w-6 h-6 rounded-full
                bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400
                text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{rec}</p>
            </motion.li>
          ))}
        </ol>
      </motion.div>

      {/* Budget tips */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16 }}
        className="glass rounded-2xl p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-500 to-accent-600
            flex items-center justify-center shadow-sm">
            <TrendingDown size={15} className="text-white" />
          </div>
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Budget Tips</h3>
        </div>
        <ul className="space-y-3">
          {insight.budget_tips.map((tip, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.18 + i * 0.06 }}
              className="flex items-start gap-3"
            >
              <span className="flex-shrink-0 w-5 h-5 rounded-full
                bg-accent-100 dark:bg-accent-500/20 flex items-center justify-center mt-0.5">
                <Sparkles size={10} className="text-accent-500" />
              </span>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{tip}</p>
            </motion.li>
          ))}
        </ul>
      </motion.div>

      {/* Savings potential */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.24 }}
        className="relative overflow-hidden rounded-2xl
          bg-gradient-to-r from-brand-500 via-violet-500 to-accent-500
          p-5 text-white shadow-lg shadow-brand-500/25"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-brand-500 via-violet-500 to-accent-500 opacity-90" />
        <div className="absolute -bottom-8 -right-8 w-40 h-40 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <PiggyBank size={18} className="text-white/80" />
              <h3 className="font-semibold text-sm text-white/90">Savings Potential</h3>
            </div>
            <p className="text-white/75 text-xs leading-relaxed max-w-[240px]">
              {insight.savings_potential}
            </p>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-3xl font-black text-white drop-shadow">
              💰
            </p>
          </div>
        </div>
      </motion.div>

    </div>
  );
}
