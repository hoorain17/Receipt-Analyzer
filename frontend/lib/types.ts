// Category is now a free-form string decided by the AI
export type ExpenseCategory = string;

export interface ReceiptItem {
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  category: string;   // AI-generated label, e.g. "Dairy & Eggs", "Laundry & Cleaning"
  confidence: number;
}

export interface Receipt {
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  total: number;
  store_name: string | null;
  date: string | null;
  raw_ocr_text: string | null;
  processing_time: number | null;
}

export interface CategoryAnalysis {
  category: ExpenseCategory;
  total_spent: number;
  percentage: number;
  item_count: number;
  items: string[];
}

export interface SpendingAnalysis {
  total_spending: number;
  category_breakdown: CategoryAnalysis[];
  top_category: ExpenseCategory | null;
  overspending_categories: string[];
  anomalies: string[];
}

export interface LLMInsight {
  summary: string;
  recommendations: string[];
  budget_tips: string[];
  savings_potential: string;
}

export interface AnalysisResult {
  receipt: Receipt;
  spending_analysis: SpendingAnalysis;
  llm_insight: LLMInsight;
  processed_at: string;
}

export interface AnalyzeResponse {
  success: boolean;
  data: AnalysisResult | null;
  error: string | null;
  processing_time: number;
}

export interface AnalyzeRequest {
  image_base64: string;
  aggressive_preprocessing: boolean;
}
