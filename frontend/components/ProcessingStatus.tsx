"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";

const STEPS = [
  { id: 1, icon: "📸", label: "Preprocessing image",  description: "Enhancing contrast & clarity" },
  { id: 2, icon: "🔍", label: "OCR extraction",       description: "GPT-4 Vision reading your receipt" },
  { id: 3, icon: "📋", label: "Parsing data",         description: "Structuring items & prices" },
  { id: 4, icon: "📊", label: "Analyzing spending",   description: "Categorizing & computing trends" },
  { id: 5, icon: "🤖", label: "Generating insights",  description: "AI crafting personalized advice" },
];

interface Props {
  currentStep: number; // 1–5 active, 0 = idle, 6 = done
}

export default function ProcessingStatus({ currentStep }: Props) {
  const pct = Math.min(((currentStep - 1) / STEPS.length) * 100, 100);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        className="glass rounded-2xl p-5 space-y-4"
      >
        {/* Title */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm flex items-center gap-2">
            <Loader2 className="animate-spin text-brand-500" size={16} />
            Analyzing Receipt…
          </h3>
          <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums">
            {Math.min(currentStep, STEPS.length)}/{STEPS.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500"
            initial={{ width: "0%" }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          />
        </div>

        {/* Steps */}
        <div className="space-y-1.5">
          {STEPS.map((step) => {
            const done   = currentStep > step.id;
            const active = currentStep === step.id;
            const future = !done && !active;
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: step.id * 0.06 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300
                  ${active  ? "bg-brand-50 dark:bg-brand-500/10 ring-1 ring-brand-200 dark:ring-brand-500/30" : ""}
                  ${future  ? "opacity-35" : ""}
                `}
              >
                {/* Circle indicator */}
                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm
                  transition-all duration-300
                  ${done   ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/40"
                  : active ? "bg-brand-500 text-white shadow-sm shadow-brand-500/40"
                  :          "bg-slate-200 dark:bg-slate-700 text-slate-400"}`}
                >
                  {done   ? <Check size={13} strokeWidth={3} />
                  : active ? <Loader2 size={13} className="animate-spin" />
                  : <span className="text-xs font-semibold">{step.id}</span>}
                </div>

                {/* Emoji */}
                <span className="text-base leading-none">{step.icon}</span>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate
                    ${active ? "text-brand-600 dark:text-brand-400" : "text-slate-600 dark:text-slate-300"}`}>
                    {step.label}
                  </p>
                  {active && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                      {step.description}
                    </p>
                  )}
                </div>

                {/* Done checkmark on right */}
                {done && (
                  <span className="text-xs text-emerald-500 font-medium flex-shrink-0">✓</span>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
