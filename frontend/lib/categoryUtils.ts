// Utilities for rendering AI-generated category names dynamically

const COLOR_PALETTES = [
  { bg: "bg-blue-100 dark:bg-blue-500/20",   text: "text-blue-700 dark:text-blue-300",   hex: "#3b82f6" },
  { bg: "bg-emerald-100 dark:bg-emerald-500/20", text: "text-emerald-700 dark:text-emerald-300", hex: "#10b981" },
  { bg: "bg-violet-100 dark:bg-violet-500/20", text: "text-violet-700 dark:text-violet-300", hex: "#8b5cf6" },
  { bg: "bg-orange-100 dark:bg-orange-500/20", text: "text-orange-700 dark:text-orange-300", hex: "#f97316" },
  { bg: "bg-rose-100 dark:bg-rose-500/20",   text: "text-rose-700 dark:text-rose-300",   hex: "#f43f5e" },
  { bg: "bg-cyan-100 dark:bg-cyan-500/20",   text: "text-cyan-700 dark:text-cyan-300",   hex: "#06b6d4" },
  { bg: "bg-amber-100 dark:bg-amber-500/20", text: "text-amber-700 dark:text-amber-300", hex: "#f59e0b" },
  { bg: "bg-pink-100 dark:bg-pink-500/20",   text: "text-pink-700 dark:text-pink-300",   hex: "#ec4899" },
  { bg: "bg-teal-100 dark:bg-teal-500/20",   text: "text-teal-700 dark:text-teal-300",   hex: "#14b8a6" },
  { bg: "bg-indigo-100 dark:bg-indigo-500/20", text: "text-indigo-700 dark:text-indigo-300", hex: "#6366f1" },
  { bg: "bg-lime-100 dark:bg-lime-500/20",   text: "text-lime-700 dark:text-lime-300",   hex: "#84cc16" },
  { bg: "bg-fuchsia-100 dark:bg-fuchsia-500/20", text: "text-fuchsia-700 dark:text-fuchsia-300", hex: "#d946ef" },
];

// Deterministic index from string so same category always gets same color
function hashIndex(str: string, mod: number): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash % mod;
}

export function getCategoryColor(category: string) {
  return COLOR_PALETTES[hashIndex(category, COLOR_PALETTES.length)];
}

export function getCategoryHex(category: string): string {
  return COLOR_PALETTES[hashIndex(category, COLOR_PALETTES.length)].hex;
}

// Map common words in category name → emoji
const KEYWORD_ICONS: [string, string][] = [
  ["dairy", "🥛"], ["milk", "🥛"], ["egg", "🥚"], ["cheese", "🧀"],
  ["meat", "🥩"], ["seafood", "🐟"], ["fish", "🐟"], ["poultry", "🍗"], ["chicken", "🍗"],
  ["bread", "🍞"], ["bak", "🍞"], ["pastry", "🥐"],
  ["snack", "🍿"], ["candy", "🍬"], ["chocolate", "🍫"], ["sweet", "🍬"],
  ["drink", "🥤"], ["beverage", "🥤"], ["juice", "🧃"], ["soda", "🥤"], ["water", "💧"], ["coffee", "☕"],
  ["produce", "🥦"], ["fruit", "🍎"], ["vegetable", "🥕"], ["fresh", "🥬"], ["herb", "🌿"],
  ["clean", "🧹"], ["laundry", "🧺"], ["detergent", "🫧"], ["household", "🏠"],
  ["care", "🧴"], ["health", "💊"], ["toiletry", "🪥"], ["hygiene", "🪥"],
  ["frozen", "🧊"], ["ice", "🧊"],
  ["organic", "🌱"], ["baby", "👶"], ["pet", "🐾"],
  ["deli", "🥪"], ["prepared", "🍱"],
];

export function getCategoryIcon(category: string): string {
  const lower = category.toLowerCase();
  for (const [keyword, icon] of KEYWORD_ICONS) {
    if (lower.includes(keyword)) return icon;
  }
  return "🛒";
}
