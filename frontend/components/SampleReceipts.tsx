"use client";

import { useState, useEffect } from "react";
import { FlaskConical, ChevronDown, ChevronUp } from "lucide-react";

interface SampleReceipt {
  store: string;
  date: string;
  total: number;
  item_count: number;
  image_base64: string;
  description: string;
}

interface Props {
  onSelect: (base64: string, preview: string) => void;
  disabled: boolean;
}

export default function SampleReceipts({ onSelect, disabled }: Props) {
  const [samples, setSamples] = useState<SampleReceipt[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/sample-receipts.json")
      .then((r) => r.json())
      .then(setSamples)
      .catch(() => {});
  }, []);

  if (samples.length === 0) return null;

  const handleSelect = (sample: SampleReceipt) => {
    const preview = `data:image/png;base64,${sample.image_base64}`;
    onSelect(sample.image_base64, preview);
    setOpen(false);
  };

  return (
    <div className="glass rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium
          text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/30
          disabled:opacity-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FlaskConical size={15} className="text-accent-500" />
          <span>Try a sample receipt</span>
        </div>
        {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>

      {open && (
        <div className="border-t border-slate-100 dark:border-slate-700 p-2 space-y-1">
          {samples.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSelect(s)}
              className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-500/10
                transition-colors group"
            >
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400">
                {s.store}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{s.description} · {s.date}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
