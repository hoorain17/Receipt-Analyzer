"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Store, Calendar, Receipt as ReceiptIcon, Tag } from "lucide-react";
import { Receipt } from "@/lib/types";
import { getCategoryColor, getCategoryIcon } from "@/lib/categoryUtils";

interface Props {
  receipt: Receipt;
}

export default function ReceiptDetails({ receipt }: Props) {
  const [showRaw, setShowRaw] = useState(false);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Store info */}
      <div className="glass rounded-2xl p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <InfoItem
            icon={<Store size={15} />}
            label="Store"
            value={receipt.store_name ?? "Unknown"}
          />
          <InfoItem
            icon={<Calendar size={15} />}
            label="Date"
            value={receipt.date ?? "Not detected"}
          />
          <InfoItem
            icon={<ReceiptIcon size={15} />}
            label="Items"
            value={`${receipt.items.length} items`}
          />
        </div>

        {/* Totals */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Subtotal</span>
            <span className="text-slate-700 dark:text-slate-200">${receipt.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Tax</span>
            <span className="text-slate-700 dark:text-slate-200">${receipt.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold border-t border-slate-200 dark:border-slate-700 pt-2">
            <span className="text-slate-700 dark:text-slate-200">Total</span>
            <span className="text-brand-600 dark:text-brand-400 text-lg">${receipt.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Items table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-4 py-3 bg-slate-50/80 dark:bg-slate-700/40 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
            <Tag size={15} />
            Receipt Items
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                <th className="text-left px-4 py-2.5 text-slate-500 dark:text-slate-400 font-medium">Item</th>
                <th className="text-right px-4 py-2.5 text-slate-500 dark:text-slate-400 font-medium">Qty</th>
                <th className="text-right px-4 py-2.5 text-slate-500 dark:text-slate-400 font-medium">Unit</th>
                <th className="text-right px-4 py-2.5 text-slate-500 dark:text-slate-400 font-medium">Total</th>
                <th className="text-right px-4 py-2.5 text-slate-500 dark:text-slate-400 font-medium">Category</th>
              </tr>
            </thead>
            <tbody>
              {receipt.items.map((item, i) => (
                <tr
                  key={i}
                  className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors"
                >
                  <td className="px-4 py-2.5 text-slate-700 dark:text-slate-200 font-medium max-w-[160px] truncate">
                    {item.name}
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-500 dark:text-slate-400">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-500 dark:text-slate-400">
                    ${item.unit_price.toFixed(2)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold text-slate-700 dark:text-slate-200">
                    ${item.total_price.toFixed(2)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {(() => {
                      const { bg, text } = getCategoryColor(item.category);
                      return (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
                          <span>{getCategoryIcon(item.category)}</span>
                          <span>{item.category}</span>
                        </span>
                      );
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Raw OCR text */}
      {receipt.raw_ocr_text && (
        <div className="glass rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowRaw((v) => !v)}
            className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium
              text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
          >
            <span>Raw OCR Text</span>
            {showRaw ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {showRaw && (
            <pre className="px-4 pb-4 text-xs font-mono text-slate-500 dark:text-slate-400
              whitespace-pre-wrap break-all max-h-48 overflow-y-auto">
              {receipt.raw_ocr_text}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">{icon}<span>{label}</span></div>
      <p className="font-semibold text-slate-700 dark:text-slate-200 truncate">{value}</p>
    </div>
  );
}
