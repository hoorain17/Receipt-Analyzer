"use client";

import { useState } from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { AlertTriangle, TrendingUp, ShoppingBag, DollarSign, ChevronDown, ChevronUp } from "lucide-react";
import { SpendingAnalysis, ReceiptItem } from "@/lib/types";
import { getCategoryHex, getCategoryIcon } from "@/lib/categoryUtils";

interface Props {
  analysis: SpendingAnalysis;
  receiptItems: ReceiptItem[];
}

export default function SpendingBreakdown({ analysis, receiptItems }: Props) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Build a map of category → items with full price details
  const itemsByCategory: Record<string, ReceiptItem[]> = {};
  for (const item of receiptItems) {
    if (!itemsByCategory[item.category]) itemsByCategory[item.category] = [];
    itemsByCategory[item.category].push(item);
  }

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const pieData = analysis.category_breakdown.map((c) => ({
    name: c.category,
    value: c.total_spent,
    percentage: c.percentage,
  }));

  const barData = analysis.category_breakdown.map((c) => ({
    category: c.category,
    spent: c.total_spent,
    items: c.item_count,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-slate-800 text-white rounded-xl p-3 shadow-xl text-sm">
          <p className="font-semibold">{d.name ?? d.category}</p>
          <p className="text-brand-300">${(d.value ?? d.spent)?.toFixed(2)}</p>
          {d.percentage && <p className="text-slate-400">{d.percentage}% of total</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Key metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          icon={<DollarSign size={20} className="text-brand-500" />}
          label="Total Spent"
          value={`$${analysis.total_spending.toFixed(2)}`}
          color="brand"
        />
        <MetricCard
          icon={<ShoppingBag size={20} className="text-accent-500" />}
          label="Total Items"
          value={analysis.category_breakdown.reduce((s, c) => s + c.item_count, 0).toString()}
          color="accent"
        />
        <MetricCard
          icon={<TrendingUp size={20} className="text-green-500" />}
          label="Top Category"
          value={analysis.top_category ?? "—"}
          color="green"
        />
        <MetricCard
          icon={<AlertTriangle size={20} className="text-amber-500" />}
          label="Overspending"
          value={analysis.overspending_categories.length > 0 ? `${analysis.overspending_categories.length} area(s)` : "None"}
          color={analysis.overspending_categories.length > 0 ? "amber" : "green"}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-5">
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">
            Category Distribution
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={getCategoryHex(entry.name)} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => (
                  <span className="text-xs text-slate-600 dark:text-slate-300">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="glass rounded-2xl p-5">
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">
            Spending by Category
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData} margin={{ top: 0, right: 10, left: -10, bottom: 40 }}>
              <XAxis
                dataKey="category"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                angle={-35}
                textAnchor="end"
              />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="spent" radius={[6, 6, 0, 0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={getCategoryHex(entry.category)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category breakdown with expandable items */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="px-4 py-3 bg-slate-50/80 dark:bg-slate-700/40 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
            Category Breakdown — click a row to see items purchased
          </h3>
        </div>

        {analysis.category_breakdown.map((c, i) => {
          const isExpanded = expandedCategories.has(c.category);
          const catItems = itemsByCategory[c.category] ?? [];
          const isOverspending = analysis.overspending_categories.some((o) =>
            o.toLowerCase().startsWith(c.category)
          );

          return (
            <div key={c.category} className="border-t border-slate-100 dark:border-slate-700">
              {/* Category row — clickable */}
              <button
                onClick={() => toggleCategory(c.category)}
                className="w-full text-left px-4 py-3 flex items-center gap-3
                  hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group"
              >
                {/* Color dot + icon */}
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: getCategoryHex(c.category) }}
                />
                <span className="text-base">{getCategoryIcon(c.category)}</span>

                {/* Category name + items list preview */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">
                      {c.category}
                    </span>
                    {isOverspending && (
                      <span className="px-1.5 py-0.5 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded text-xs font-medium">
                        Over budget
                      </span>
                    )}
                  </div>
                  {/* Item name pills — collapsed preview */}
                  {!isExpanded && catItems.length > 0 && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                      {catItems.map((it) => it.name).join(" · ")}
                    </p>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-slate-400">{c.item_count} item{c.item_count !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800 dark:text-white text-sm">
                      ${c.total_spent.toFixed(2)}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium w-14 text-center
                    ${c.percentage > 30
                      ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                      : c.percentage > 20
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                      : "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400"
                    }`}
                  >
                    {c.percentage.toFixed(1)}%
                  </span>
                  <span className="text-slate-400 dark:text-slate-500">
                    {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </span>
                </div>
              </button>

              {/* Expanded items list */}
              {isExpanded && catItems.length > 0 && (
                <div
                  className="border-t border-slate-100 dark:border-slate-700/60
                    bg-slate-50/60 dark:bg-slate-800/40 px-4 pb-3 pt-2"
                >
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left pb-1.5 text-xs font-medium text-slate-400 dark:text-slate-500">
                          Item
                        </th>
                        <th className="text-right pb-1.5 text-xs font-medium text-slate-400 dark:text-slate-500">
                          Qty
                        </th>
                        <th className="text-right pb-1.5 text-xs font-medium text-slate-400 dark:text-slate-500">
                          Unit price
                        </th>
                        <th className="text-right pb-1.5 text-xs font-medium text-slate-400 dark:text-slate-500">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {catItems.map((item, j) => (
                        <tr
                          key={j}
                          className="border-t border-slate-100 dark:border-slate-700/40"
                        >
                          <td className="py-1.5 text-slate-700 dark:text-slate-200 font-medium">
                            {item.name}
                          </td>
                          <td className="py-1.5 text-right text-slate-500 dark:text-slate-400">
                            ×{item.quantity}
                          </td>
                          <td className="py-1.5 text-right text-slate-500 dark:text-slate-400">
                            ${item.unit_price.toFixed(2)}
                          </td>
                          <td className="py-1.5 text-right font-semibold"
                            style={{ color: getCategoryHex(c.category) }}
                          >
                            ${item.total_price.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-slate-200 dark:border-slate-600">
                        <td colSpan={3} className="pt-2 text-xs text-slate-400 font-medium">
                          {c.category} subtotal
                        </td>
                        <td className="pt-2 text-right font-bold text-slate-700 dark:text-slate-200">
                          ${c.total_spent.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {isExpanded && catItems.length === 0 && (
                <p className="px-6 py-2 text-xs text-slate-400 italic bg-slate-50/60 dark:bg-slate-800/40">
                  No item details available
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Alerts */}
      {(analysis.overspending_categories.length > 0 || analysis.anomalies.length > 0) && (
        <div className="space-y-2">
          {analysis.overspending_categories.map((msg, i) => (
            <div key={i} className="flex items-start gap-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400">
              <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
              <span>Overspending detected: {msg}</span>
            </div>
          ))}
          {analysis.anomalies.map((msg, i) => (
            <div key={i} className="flex items-start gap-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
              <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
              <span>{msg}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const topBarMap: Record<string, string> = {
    brand: "bg-gradient-to-r from-brand-400 to-brand-500",
    accent: "bg-gradient-to-r from-accent-400 to-accent-500",
    green: "bg-gradient-to-r from-emerald-400 to-green-500",
    amber: "bg-gradient-to-r from-amber-400 to-orange-400",
  };
  return (
    <div className="glass rounded-2xl overflow-hidden card-hover">
      <div className={`h-1 w-full ${topBarMap[color] ?? "bg-slate-300"}`} />
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</p>
        </div>
        <p className="text-xl font-bold text-slate-800 dark:text-white truncate">{value}</p>
      </div>
    </div>
  );
}
