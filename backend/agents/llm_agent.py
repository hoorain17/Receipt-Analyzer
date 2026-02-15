import json

from openai import OpenAI

from config import OPENAI_API_KEY, LLM_MINI_MODEL
from models.data_models import Receipt, SpendingAnalysis, LLMInsight
from utils.logger import get_logger

logger = get_logger(__name__)


class LLMAgent:
    def __init__(self, api_key: str = None):
        self.client = OpenAI(api_key=api_key or OPENAI_API_KEY)
        self.model = LLM_MINI_MODEL

    def generate_insights(
        self, spending_analysis: SpendingAnalysis, receipt: Receipt = None, user_context: str = None
    ) -> LLMInsight:
        """Generate personalized financial advice from spending data."""
        logger.info("🤖 Generating LLM financial insights")
        try:
            prompt = self._build_prompt(spending_analysis, receipt, user_context)
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a friendly personal finance advisor. "
                            "Provide encouraging, practical, and actionable budgeting advice. "
                            "Be supportive and positive while being honest about spending patterns."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                max_tokens=600,
                response_format={"type": "json_object"},
            )
            raw = response.choices[0].message.content
            data = json.loads(raw)
            insight = LLMInsight(
                summary=data.get("summary", "Analysis complete."),
                recommendations=data.get("recommendations", []),
                budget_tips=data.get("budget_tips", []),
                savings_potential=data.get("savings_potential", "Review your spending to find savings."),
            )
            logger.info("✅ LLM insights generated successfully")
            return insight
        except Exception as e:
            logger.warning("⚠️ LLM API failed (%s), using rule-based fallback", e)
            return self._fallback_insights(spending_analysis)

    def _build_prompt(self, analysis: SpendingAnalysis, receipt: Receipt = None, user_context: str = None) -> str:
        # Full item list with category and price
        if receipt and receipt.items:
            items_lines = "\n".join(
                f"  - {item.name} [{item.category}]: ${item.total_price:.2f}"
                for item in receipt.items
            )
            store_line = f"Store: {receipt.store_name or 'Unknown'} | Date: {receipt.date or 'Unknown'}"
        else:
            items_lines = "  (item details not available)"
            store_line = ""

        breakdown_lines = "\n".join(
            f"  - {c.category}: ${c.total_spent:.2f} ({c.percentage:.1f}%) — {', '.join(c.items)}"
            for c in analysis.category_breakdown
        )
        overspend_text = (
            "\n".join(f"  - {o}" for o in analysis.overspending_categories)
            if analysis.overspending_categories
            else "  None"
        )
        anomaly_text = (
            "\n".join(f"  - {a}" for a in analysis.anomalies)
            if analysis.anomalies
            else "  None"
        )
        context_block = f"\nUser context: {user_context}" if user_context else ""

        return f"""You are a personal finance advisor analyzing a real grocery receipt.{context_block}

{store_line}
Total spent: ${analysis.total_spending:.2f}

Every item purchased:
{items_lines}

Spending by category:
{breakdown_lines}

Overspending alerts:
{overspend_text}

Unusual items:
{anomaly_text}

Give advice that is SPECIFIC to this exact receipt — mention actual item names and categories from above. Do not give generic advice.

Return a JSON object with exactly these keys:
{{
  "summary": "2-3 sentences referencing specific items/categories from this receipt and how balanced the spending is",
  "recommendations": ["3 specific recommendations — each must name a real item or category from this receipt"],
  "budget_tips": ["2 actionable tips for the next shopping trip based on what was bought here"],
  "savings_potential": "estimated monthly savings if advice is followed, e.g. '$25-45/month'"
}}"""

    def _fallback_insights(self, analysis: SpendingAnalysis) -> LLMInsight:
        """Rule-based insights when OpenAI API is unavailable."""
        top = analysis.top_category if analysis.top_category else "general items"
        total = analysis.total_spending

        recommendations = [
            f"Your highest spending is in {top}. Consider buying in bulk to reduce cost.",
            "Compare prices across stores before your next shopping trip.",
            "Plan meals in advance to avoid impulse purchases.",
        ]

        if analysis.overspending_categories:
            cat = analysis.overspending_categories[0].split("(")[0].strip()
            recommendations[0] = f"Reduce spending on {cat} — it exceeds typical budget benchmarks."

        budget_tips = [
            "Make a shopping list and stick to it to avoid unplanned spending.",
            "Look for store-brand alternatives to save 15–30% on common items.",
        ]

        savings = f"${round(total * 0.10, 0):.0f}–${round(total * 0.20, 0):.0f}/month"

        return LLMInsight(
            summary=(
                f"You spent ${total:.2f} on this receipt. "
                f"Your top spending category is {top}. "
                "Small adjustments can lead to meaningful savings over time."
            ),
            recommendations=recommendations,
            budget_tips=budget_tips,
            savings_potential=savings,
        )
