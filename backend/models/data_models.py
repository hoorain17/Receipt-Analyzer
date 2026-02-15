from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, model_validator


class ReceiptItem(BaseModel):
    name: str
    quantity: float = 1.0
    unit_price: float
    total_price: float
    category: str = "Uncategorized"          # AI decides the label freely
    confidence: float = Field(default=0.9, ge=0.0, le=1.0)

    @model_validator(mode="after")
    def validate_total(self) -> "ReceiptItem":
        expected = round(self.quantity * self.unit_price, 2)
        if abs(self.total_price - expected) > 0.05:
            self.total_price = expected
        return self


class Receipt(BaseModel):
    items: List[ReceiptItem] = []
    subtotal: float = 0.0
    tax: float = 0.0
    total: float = 0.0
    store_name: Optional[str] = None
    date: Optional[str] = None
    raw_ocr_text: Optional[str] = None
    processing_time: Optional[float] = None

    @model_validator(mode="after")
    def validate_total(self) -> "Receipt":
        if self.items:
            computed = round(sum(i.total_price for i in self.items), 2)
            if self.subtotal == 0.0:
                self.subtotal = computed
            if self.total == 0.0:
                self.total = round(self.subtotal + self.tax, 2)
        return self


class CategoryAnalysis(BaseModel):
    category: str                            # free-form AI-generated label
    total_spent: float
    percentage: float
    item_count: int
    items: List[str] = []


class SpendingAnalysis(BaseModel):
    total_spending: float
    category_breakdown: List[CategoryAnalysis]
    top_category: Optional[str] = None
    overspending_categories: List[str] = []
    anomalies: List[str] = []


class LLMInsight(BaseModel):
    summary: str
    recommendations: List[str]
    budget_tips: List[str]
    savings_potential: str


class AnalysisResult(BaseModel):
    receipt: Receipt
    spending_analysis: SpendingAnalysis
    llm_insight: LLMInsight
    processed_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


# --- API request/response models ---

class AnalyzeRequest(BaseModel):
    image_base64: str
    aggressive_preprocessing: bool = False


class AnalyzeResponse(BaseModel):
    success: bool
    data: Optional[AnalysisResult] = None
    error: Optional[str] = None
    processing_time: float = 0.0
