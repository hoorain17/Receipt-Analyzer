import axios, { AxiosInstance } from "axios";
import { AnalyzeRequest, AnalyzeResponse, AnalysisResult } from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 300_000, // receipt analysis: 3 OpenAI calls can take up to 5 min
  headers: { "Content-Type": "application/json" },
});

// Request interceptor: log outgoing requests in dev
client.interceptors.request.use((config) => {
  if (process.env.NODE_ENV === "development") {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
  }
  return config;
});

// Response interceptor: normalize errors
client.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.detail ||
      err.response?.data?.error ||
      err.message ||
      "Unknown error";
    throw new Error(message);
  }
);

export async function analyzeReceipt(
  imageBase64: string,
  aggressivePreprocessing = false
): Promise<AnalysisResult> {
  const payload: AnalyzeRequest = {
    image_base64: imageBase64,
    aggressive_preprocessing: aggressivePreprocessing,
  };
  const { data } = await client.post<AnalyzeResponse>("/api/analyze", payload);
  if (!data.success || !data.data) {
    throw new Error(data.error || "Analysis failed");
  }
  return data.data;
}

export async function categorizeItem(name: string): Promise<string> {
  const { data } = await client.post("/api/categorize-item", { name });
  return data.category;
}

export async function fetchCategories(): Promise<Record<string, string[]>> {
  const { data } = await client.get("/api/categories");
  return data;
}

export async function healthCheck(): Promise<boolean> {
  try {
    await client.get("/api/health");
    return true;
  } catch {
    return false;
  }
}

// --------------------------------------------------------------------------
// Export helpers
// --------------------------------------------------------------------------

export function exportToCSV(result: AnalysisResult): void {
  const headers = ["Name", "Quantity", "Unit Price", "Total Price", "Category", "Confidence"];
  const rows = result.receipt.items.map((item) => [
    item.name,
    item.quantity,
    item.unit_price.toFixed(2),
    item.total_price.toFixed(2),
    item.category,
    item.confidence.toFixed(2),
  ]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  downloadFile(csv, "receipt-analysis.csv", "text/csv");
}

export function exportToJSON(result: AnalysisResult): void {
  const json = JSON.stringify(result, null, 2);
  downloadFile(json, "receipt-analysis.json", "application/json");
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
