"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  Receipt, BarChart3, Lightbulb, Download, RefreshCw,
  Moon, Sun, Zap, Github, ScanLine, Sparkles,
} from "lucide-react";

import UploadZone from "@/components/UploadZone";
import ProcessingStatus from "@/components/ProcessingStatus";
import SpendingBreakdown from "@/components/SpendingBreakdown";
import AIInsights from "@/components/AIInsights";
import ReceiptDetails from "@/components/ReceiptDetails";
import ExportSection from "@/components/ExportSection";
import SampleReceipts from "@/components/SampleReceipts";

import { analyzeReceipt } from "@/lib/api";
import { AnalysisResult } from "@/lib/types";

const TABS = [
  { id: "spending", label: "Spending",    icon: <BarChart3  size={14} /> },
  { id: "insights", label: "AI Insights", icon: <Lightbulb  size={14} /> },
  { id: "details",  label: "Receipt",     icon: <Receipt    size={14} /> },
  { id: "export",   label: "Export",      icon: <Download   size={14} /> },
];

export default function Home() {
  const [darkMode,      setDarkMode]      = useState(false);
  const [imageBase64,   setImageBase64]   = useState<string | null>(null);
  const [imagePreview,  setImagePreview]  = useState<string | null>(null);
  const [aggressive,    setAggressive]    = useState(false);
  const [isLoading,     setIsLoading]     = useState(false);
  const [currentStep,   setCurrentStep]   = useState(0);
  const [result,        setResult]        = useState<AnalysisResult | null>(null);
  const [activeTab,     setActiveTab]     = useState("spending");

  const toggleDark = () => {
    setDarkMode((d) => {
      document.documentElement.classList.toggle("dark", !d);
      return !d;
    });
  };

  const handleImageReady = useCallback((base64: string, preview: string) => {
    setImageBase64(base64);
    setImagePreview(preview);
    setResult(null);
    setCurrentStep(0);
  }, []);

  const handleAnalyze = async () => {
    if (!imageBase64) {
      toast.error("Please upload a receipt image first.");
      return;
    }
    setIsLoading(true);
    setResult(null);
    setCurrentStep(1);

    const stepTimers = [1000, 3000, 5000, 7500].map((delay, i) =>
      setTimeout(() => setCurrentStep(i + 2), delay)
    );

    try {
      const data = await analyzeReceipt(imageBase64, aggressive);
      stepTimers.forEach(clearTimeout);
      setCurrentStep(6);
      setResult(data);
      setActiveTab("spending");
      toast.success("Analysis complete!");
    } catch (err: any) {
      stepTimers.forEach(clearTimeout);
      setCurrentStep(0);
      toast.error(err.message || "Analysis failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setImageBase64(null);
    setImagePreview(null);
    setResult(null);
    setCurrentStep(0);
  };

  return (
    <div className={`min-h-screen ${darkMode ? "dark" : ""}`}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/60 to-violet-50/40
        dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300">

        {/* ── Header ─────────────────────────────────────────── */}
        <header className="sticky top-0 z-50 glass border-b border-slate-200/80 dark:border-slate-700/60 px-4 sm:px-6 py-3.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500
                flex items-center justify-center shadow-md shadow-brand-500/25">
                <ScanLine size={18} className="text-white" />
              </div>
              <div>
                <h1 className="font-bold text-slate-800 dark:text-white text-base leading-tight tracking-tight">
                  Receipt<span className="gradient-text">AI</span>
                </h1>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:block tracking-wide uppercase">
                  GPT-4 Vision · Spending Analysis · LLM Insights
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer"
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white
                  hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="GitHub">
                <Github size={17} />
              </a>
              <button onClick={toggleDark}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white
                  hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Toggle dark mode">
                {darkMode ? <Sun size={17} /> : <Moon size={17} />}
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* ── Left panel ─────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-4">

              {/* Tagline card */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl px-5 py-4 flex items-center gap-4"
              >
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500
                  flex items-center justify-center shadow-lg shadow-brand-500/30 flex-shrink-0">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-white text-sm">
                    Instant receipt intelligence
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Upload a receipt → AI extracts, categorizes &amp; advises
                  </p>
                </div>
              </motion.div>

              {/* Upload zone */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
              >
                <UploadZone
                  onImageReady={handleImageReady}
                  isLoading={isLoading}
                  aggressive={aggressive}
                  onAggressiveChange={setAggressive}
                />
              </motion.div>

              {/* Sample receipts */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <SampleReceipts onSelect={handleImageReady} disabled={isLoading} />
              </motion.div>

              {/* Analyze + Reset buttons */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="flex gap-3"
              >
                <button
                  onClick={handleAnalyze}
                  disabled={!imageBase64 || isLoading}
                  className="flex-1 py-3.5 px-6 bg-gradient-to-r from-brand-500 to-accent-500 text-white
                    font-semibold rounded-2xl shadow-lg shadow-brand-500/25
                    hover:shadow-xl hover:shadow-brand-500/30 hover:scale-[1.02] active:scale-[0.98]
                    disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none
                    transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Analyzing…
                    </>
                  ) : (
                    <>
                      <Zap size={15} />
                      Analyze Receipt
                    </>
                  )}
                </button>
                {(result || imageBase64) && !isLoading && (
                  <button
                    onClick={handleReset}
                    className="py-3.5 px-4 glass rounded-2xl text-slate-500 dark:text-slate-400
                      hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60
                      transition-colors"
                    aria-label="Reset"
                  >
                    <RefreshCw size={17} />
                  </button>
                )}
              </motion.div>

              {/* Processing status */}
              <AnimatePresence>
                {isLoading && currentStep > 0 && (
                  <ProcessingStatus currentStep={currentStep} />
                )}
              </AnimatePresence>

              {/* Receipt thumbnail after analysis */}
              {result && imagePreview && !isLoading && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass rounded-2xl overflow-hidden"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Analyzed receipt"
                    className="w-full max-h-52 object-contain"
                  />
                  <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-700/60
                    flex items-center justify-between">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {result.receipt.store_name ?? "Receipt"}
                    </p>
                    <p className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                      ${result.receipt.total.toFixed(2)}
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* ── Right panel ────────────────────────────────── */}
            <div className="lg:col-span-3">
              <AnimatePresence mode="wait">

                {/* Empty state */}
                {!result && !isLoading && (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="glass rounded-2xl overflow-hidden"
                  >
                    {/* Dot-grid hero area */}
                    <div className="dot-grid flex flex-col items-center justify-center py-16 px-8 text-center">
                      <div className="w-20 h-20 rounded-3xl bg-white/80 dark:bg-slate-800/80 shadow-xl
                        flex items-center justify-center mb-5 ring-1 ring-slate-200 dark:ring-slate-700">
                        <Receipt size={36} className="text-brand-400 dark:text-brand-500" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">
                        No receipt analyzed yet
                      </h3>
                      <p className="text-slate-400 dark:text-slate-500 text-sm max-w-xs leading-relaxed">
                        Upload a receipt image on the left and click{" "}
                        <span className="font-medium text-brand-500">Analyze Receipt</span>
                        {" "}to see spending breakdown and AI insights.
                      </p>
                    </div>

                    {/* Feature pills row */}
                    <div className="border-t border-slate-100 dark:border-slate-700/60
                      px-6 py-4 flex flex-wrap justify-center gap-2">
                      {[
                        { icon: "🔍", label: "OCR Extraction" },
                        { icon: "🏷️", label: "AI Categories" },
                        { icon: "📊", label: "Spending Charts" },
                        { icon: "💡", label: "Budget Tips" },
                      ].map((f) => (
                        <span key={f.label}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5
                            bg-slate-100 dark:bg-slate-800 rounded-full text-xs text-slate-600 dark:text-slate-400">
                          <span>{f.icon}</span>
                          {f.label}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Results */}
                {result && !isLoading && (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {/* Success banner */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r
                      from-emerald-500 via-teal-500 to-cyan-500 p-4 text-white shadow-lg shadow-emerald-500/20">
                      {/* Decorative glow */}
                      <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full
                        bg-white/10 blur-2xl pointer-events-none" />
                      <div className="relative flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                            <Sparkles size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-sm">Analysis Complete</p>
                            <p className="text-white/75 text-xs mt-0.5">
                              {result.receipt.items.length} items · {result.spending_analysis.category_breakdown.length} categories
                              {result.receipt.store_name ? ` · ${result.receipt.store_name}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">${result.receipt.total.toFixed(2)}</p>
                          <p className="text-white/60 text-xs">{result.receipt.date ?? new Date(result.processed_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>

                    {/* Tabbed results */}
                    <div className="glass rounded-2xl overflow-hidden">
                      {/* Pill tab bar */}
                      <div className="px-4 pt-3 pb-0 border-b border-slate-200/70 dark:border-slate-700/60">
                        <div className="flex gap-1 overflow-x-auto pb-3">
                          {TABS.map((tab) => (
                            <button
                              key={tab.id}
                              onClick={() => setActiveTab(tab.id)}
                              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold
                                whitespace-nowrap transition-all duration-200
                                ${activeTab === tab.id
                                  ? "bg-gradient-to-r from-brand-500 to-accent-500 text-white shadow-sm shadow-brand-500/30"
                                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                                }`}
                            >
                              {tab.icon}
                              {tab.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="p-5">
                        <AnimatePresence mode="wait">
                          {activeTab === "spending" && (
                            <motion.div key="spending"
                              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                              <SpendingBreakdown
                                analysis={result.spending_analysis}
                                receiptItems={result.receipt.items}
                              />
                            </motion.div>
                          )}
                          {activeTab === "insights" && (
                            <motion.div key="insights"
                              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                              <AIInsights insight={result.llm_insight} />
                            </motion.div>
                          )}
                          {activeTab === "details" && (
                            <motion.div key="details"
                              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                              <ReceiptDetails receipt={result.receipt} />
                            </motion.div>
                          )}
                          {activeTab === "export" && (
                            <motion.div key="export"
                              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                              <ExportSection result={result} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </main>

        {/* ── Footer ─────────────────────────────────────────── */}
        <footer className="mt-16 pb-8 text-center">
          <p className="text-xs text-slate-400 dark:text-slate-600">
            Built with{" "}
            <span className="gradient-text font-medium">Next.js 14 + FastAPI + GPT-4 Vision</span>
          </p>
        </footer>

      </div>
    </div>
  );
}
