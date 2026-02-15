import json
from openai import OpenAI

from config import OPENAI_API_KEY, LLM_MINI_MODEL
from models.data_models import (
    Receipt,
    ReceiptItem,
    CategoryAnalysis,
    SpendingAnalysis,
)
from utils.logger import get_logger

logger = get_logger(__name__)

# Spending thresholds (% of total) — applied to whatever categories AI creates
OVERSPEND_THRESHOLD_PCT = 30.0   # flag any category that eats >30% of the bill


class AnalysisAgent:
    def __init__(self, api_key: str = None):
        self.client = OpenAI(api_key=api_key or OPENAI_API_KEY)
        self.model = LLM_MINI_MODEL

    def analyze(self, receipt: Receipt) -> SpendingAnalysis:
        logger.info("📊 Starting AI-driven analysis for %d items", len(receipt.items))

        # Let the AI decide categories entirely
        self._ai_categorize(receipt.items)

        total_spending = round(sum(i.total_price for i in receipt.items), 2)
        if total_spending == 0:
            total_spending = receipt.total

        category_breakdown = self._build_breakdown(receipt.items, total_spending)
        top_category = category_breakdown[0].category if category_breakdown else None
        overspending = self._detect_overspending(category_breakdown)
        anomalies = self._find_anomalies(receipt.items, total_spending)

        analysis = SpendingAnalysis(
            total_spending=total_spending,
            category_breakdown=category_breakdown,
            top_category=top_category,
            overspending_categories=overspending,
            anomalies=anomalies,
        )
        logger.info(
            "✅ Analysis done | total=%.2f | categories=%d | anomalies=%d",
            total_spending, len(category_breakdown), len(anomalies),
        )
        return analysis

    # ------------------------------------------------------------------
    # AI-driven free-form categorization
    # ------------------------------------------------------------------

    def _ai_categorize(self, items: list[ReceiptItem]) -> None:
        """Ask the AI to invent its own category names for these specific items."""
        if not items:
            return

        item_list = "\n".join(f"- {item.name}" for item in items)

        prompt = f"""You are analyzing a grocery receipt. Look at the items below and group them into logical spending categories.

Rules:
1. You decide the category names yourself — do NOT use a predefined list.
2. Category names should be short, clear, and descriptive (e.g. "Dairy & Eggs", "Cleaning Supplies", "Fresh Produce", "Snacks & Candy", "Beverages", "Meat & Seafood").
3. Group similar items together under one category.
4. Every item must have a category — no item should be left as "other" or "unknown".
5. Be specific: "Frozen Foods" is better than "Food". "Household Cleaning" is better than "Household".

Items on the receipt:
{item_list}

Return ONLY a JSON object mapping each item name to your chosen category:
{{"Whole Milk 1 Gal": "Dairy & Eggs", "Tide Pods 31ct": "Laundry & Cleaning", "Banana Bunch": "Fresh Produce"}}"""

        try:
            logger.info("🤖 AI is deciding categories for %d items...", len(items))
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=600,
                response_format={"type": "json_object"},
            )
            mapping: dict = json.loads(response.choices[0].message.content)

            # Normalize keys to handle minor whitespace differences
            normalized = {k.strip().lower(): v for k, v in mapping.items()}

            assigned = 0
            for item in items:
                category = (
                    mapping.get(item.name)
                    or normalized.get(item.name.strip().lower())
                )
                if category and isinstance(category, str) and category.strip():
                    item.category = category.strip()
                    assigned += 1
                else:
                    # Fallback: ask AI to categorize just this one item
                    item.category = self._single_item_category(item.name)

            logger.info("✅ AI assigned categories to %d/%d items", assigned, len(items))

        except Exception as e:
            logger.warning("⚠️ AI categorization failed (%s) — using single-item fallback", e)
            for item in items:
                item.category = self._single_item_category(item.name)

    def _single_item_category(self, item_name: str) -> str:
        """Fallback: ask AI to categorize a single item when batch call fails."""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{
                    "role": "user",
                    "content": (
                        f"What grocery category does '{item_name}' belong to? "
                        "Reply with just the category name (2-4 words max)."
                    ),
                }],
                max_tokens=20,
            )
            cat = response.choices[0].message.content.strip().strip('"').strip("'")
            return cat if cat else "General Items"
        except Exception:
            return "General Items"

    # ------------------------------------------------------------------
    # Breakdown & analysis
    # ------------------------------------------------------------------

    def _build_breakdown(self, items: list[ReceiptItem], total: float) -> list[CategoryAnalysis]:
        buckets: dict[str, list[ReceiptItem]] = {}
        for item in items:
            buckets.setdefault(item.category, []).append(item)

        breakdown = []
        for cat, cat_items in buckets.items():
            cat_total = round(sum(i.total_price for i in cat_items), 2)
            pct = round((cat_total / total * 100) if total > 0 else 0, 1)
            breakdown.append(CategoryAnalysis(
                category=cat,
                total_spent=cat_total,
                percentage=pct,
                item_count=len(cat_items),
                items=[i.name for i in cat_items],
            ))

        breakdown.sort(key=lambda x: x.total_spent, reverse=True)
        return breakdown

    def _detect_overspending(self, breakdown: list[CategoryAnalysis]) -> list[str]:
        return [
            f"{c.category} ({c.percentage:.1f}% of total)"
            for c in breakdown
            if c.percentage > OVERSPEND_THRESHOLD_PCT
        ]

    def _find_anomalies(self, items: list[ReceiptItem], total: float) -> list[str]:
        if not items:
            return []
        avg = total / len(items)
        anomalies = [
            f"{item.name} is unusually expensive (${item.total_price:.2f})"
            for item in items
            if item.total_price > avg * 2
        ]
        if len(set(i.category for i in items)) == 1 and len(items) > 3:
            anomalies.append(f"All items fall under one category: {items[0].category}")
        return anomalies

    # kept for /api/categorize-item endpoint
    def _categorize(self, item_name: str) -> str:
        return self._single_item_category(item_name)
