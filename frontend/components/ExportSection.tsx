"use client";

import { Download, FileText, FileJson, Share2 } from "lucide-react";
import toast from "react-hot-toast";
import { exportToCSV, exportToJSON } from "@/lib/api";
import { AnalysisResult } from "@/lib/types";

interface Props {
  result: AnalysisResult;
}

export default function ExportSection({ result }: Props) {
  const handleCSV = () => {
    exportToCSV(result);
    toast.success("CSV downloaded!");
  };

  const handleJSON = () => {
    exportToJSON(result);
    toast.success("JSON downloaded!");
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      const summary = `Receipt Analysis\nTotal: $${result.receipt.total.toFixed(2)}\nItems: ${result.receipt.items.length}\nTop category: ${result.spending_analysis.top_category ?? "N/A"}\nSavings potential: ${result.llm_insight.savings_potential}`;
      navigator.clipboard.writeText(summary);
      toast.success("Summary copied to clipboard!");
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Download your full analysis report or share a summary.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ExportCard
          icon={<FileText size={24} className="text-green-600" />}
          title="CSV Export"
          description="Download items table with categories and prices"
          buttonLabel="Download CSV"
          buttonClass="bg-green-500 hover:bg-green-600 text-white"
          onClick={handleCSV}
        />
        <ExportCard
          icon={<FileJson size={24} className="text-brand-600" />}
          title="JSON Export"
          description="Full analysis result including LLM insights"
          buttonLabel="Download JSON"
          buttonClass="bg-brand-500 hover:bg-brand-600 text-white"
          onClick={handleJSON}
        />
        <ExportCard
          icon={<Share2 size={24} className="text-accent-600" />}
          title="Share Summary"
          description="Copy a text summary to your clipboard"
          buttonLabel="Copy to Clipboard"
          buttonClass="bg-accent-500 hover:bg-accent-600 text-white"
          onClick={handleShare}
        />
      </div>

      {/* Quick stats */}
      <div className="glass rounded-2xl p-5">
        <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
          <Download size={16} />
          Export Preview
        </h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <PreviewRow label="Store" value={result.receipt.store_name ?? "Unknown"} />
          <PreviewRow label="Date" value={result.receipt.date ?? "Not detected"} />
          <PreviewRow label="Items" value={`${result.receipt.items.length} items`} />
          <PreviewRow label="Total" value={`$${result.receipt.total.toFixed(2)}`} />
          <PreviewRow label="Categories" value={`${result.spending_analysis.category_breakdown.length} categories`} />
          <PreviewRow label="Savings Potential" value={result.llm_insight.savings_potential} />
        </div>
      </div>
    </div>
  );
}

function ExportCard({
  icon, title, description, buttonLabel, buttonClass, onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonLabel: string;
  buttonClass: string;
  onClick: () => void;
}) {
  return (
    <div className="glass rounded-2xl p-5 flex flex-col gap-4">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h4 className="font-semibold text-slate-700 dark:text-slate-200">{title}</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{description}</p>
      </div>
      <button
        onClick={onClick}
        className={`mt-auto px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm ${buttonClass}`}
      >
        {buttonLabel}
      </button>
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="font-medium text-slate-700 dark:text-slate-200 truncate">{value}</p>
    </div>
  );
}
