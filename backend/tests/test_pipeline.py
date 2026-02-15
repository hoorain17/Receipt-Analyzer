"""Tests for the receipt analysis pipeline."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from models.data_models import (
    ReceiptItem, Receipt,
    SpendingAnalysis, LLMInsight,
)
from agents.parser_agent import ParserAgent
from agents.analysis_agent import AnalysisAgent
from agents.llm_agent import LLMAgent
from utils.image_processor import ImageProcessor


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

SAMPLE_OCR_TEXT = """
Walmart Supercenter
Date: 02/10/2026

Milk 1 Gallon         $3.49
Cheddar Cheese        $5.99
Chicken Breast        $8.47
Lays Chips 2 @ $1.99  $3.98
Wonder Bread          $3.29
Orange Juice          $4.99
Tide Detergent        $12.97
Tomatoes              $2.97
Bananas               $1.29

Subtotal             $47.44
Tax                   $3.80
Total                $51.24

Thank you!
"""

SAMPLE_STRUCTURED = {
    "store_name": "Walmart Supercenter",
    "date": "02/10/2026",
    "items": [
        {"name": "2% Milk 1 Gallon", "quantity": 1, "unit_price": 3.49, "total_price": 3.49},
        {"name": "Cheddar Cheese", "quantity": 1, "unit_price": 5.99, "total_price": 5.99},
        {"name": "Chicken Breast", "quantity": 1, "unit_price": 8.47, "total_price": 8.47},
        {"name": "Lay's Classic Chips", "quantity": 2, "unit_price": 1.99, "total_price": 3.98},
        {"name": "Wonder White Bread", "quantity": 1, "unit_price": 3.29, "total_price": 3.29},
        {"name": "Orange Juice 64oz", "quantity": 1, "unit_price": 4.99, "total_price": 4.99},
        {"name": "Tide Detergent", "quantity": 1, "unit_price": 12.97, "total_price": 12.97},
        {"name": "Roma Tomatoes", "quantity": 3, "unit_price": 0.99, "total_price": 2.97},
        {"name": "Banana Bunch", "quantity": 1, "unit_price": 1.29, "total_price": 1.29},
    ],
    "subtotal": 47.44,
    "tax": 3.80,
    "total": 51.24,
    "raw_text": SAMPLE_OCR_TEXT,
}


# ---------------------------------------------------------------------------
# Parser tests
# ---------------------------------------------------------------------------

class TestParserAgent:
    def setup_method(self):
        self.parser = ParserAgent()

    def test_parse_structured_data(self):
        receipt = self.parser.parse(SAMPLE_STRUCTURED)
        assert len(receipt.items) == 9
        assert receipt.store_name == "Walmart Supercenter"
        assert receipt.date == "02/10/2026"
        assert receipt.total == 51.24

    def test_parse_raw_text(self):
        receipt = self.parser.parse(SAMPLE_OCR_TEXT)
        assert len(receipt.items) > 5
        assert receipt.total > 0

    def test_receipt_item_quantity_price(self):
        receipt = self.parser.parse(SAMPLE_STRUCTURED)
        chips = next(i for i in receipt.items if "Chip" in i.name)
        assert chips.quantity == 2
        assert chips.unit_price == 1.99
        assert chips.total_price == pytest.approx(3.98, abs=0.01)

    def test_empty_text_returns_empty_receipt(self):
        receipt = self.parser.parse("")
        assert isinstance(receipt, Receipt)
        assert receipt.items == []

    def test_store_name_extracted(self):
        receipt = self.parser.parse(SAMPLE_STRUCTURED)
        assert receipt.store_name is not None

    def test_tax_extracted(self):
        receipt = self.parser.parse(SAMPLE_STRUCTURED)
        assert receipt.tax == pytest.approx(3.80, abs=0.01)


# ---------------------------------------------------------------------------
# Analysis agent tests
# ---------------------------------------------------------------------------

class TestAnalysisAgent:
    def setup_method(self):
        self.parser = ParserAgent()
        self.agent = AnalysisAgent()

    def _get_receipt(self) -> Receipt:
        return self.parser.parse(SAMPLE_STRUCTURED)

    def test_categorizes_dairy(self):
        receipt = self._get_receipt()
        analysis = self.agent.analyze(receipt)
        # AI freely names categories — just check that Milk/Cheese landed in some category
        all_items = [item for c in analysis.category_breakdown for item in c.items]
        assert any("Milk" in item or "Cheese" in item for item in all_items)

    def test_categorizes_meat(self):
        receipt = self._get_receipt()
        analysis = self.agent.analyze(receipt)
        # AI freely names categories — check Chicken landed somewhere
        all_items = [item for c in analysis.category_breakdown for item in c.items]
        assert any("Chicken" in item for item in all_items)

    def test_total_spending_matches(self):
        receipt = self._get_receipt()
        analysis = self.agent.analyze(receipt)
        assert analysis.total_spending == pytest.approx(
            sum(i.total_price for i in receipt.items), abs=0.01
        )

    def test_percentages_sum_to_100(self):
        receipt = self._get_receipt()
        analysis = self.agent.analyze(receipt)
        total_pct = sum(c.percentage for c in analysis.category_breakdown)
        assert total_pct == pytest.approx(100.0, abs=1.0)

    def test_top_category_is_set(self):
        receipt = self._get_receipt()
        analysis = self.agent.analyze(receipt)
        assert analysis.top_category is not None

    def test_anomaly_detection(self):
        items = [
            ReceiptItem(name="Cheap Item", quantity=1, unit_price=1.0, total_price=1.0),
            ReceiptItem(name="Cheap Item 2", quantity=1, unit_price=1.5, total_price=1.5),
            ReceiptItem(name="Very Expensive Item", quantity=1, unit_price=50.0, total_price=50.0),
        ]
        receipt = Receipt(items=items, total=52.5)
        analysis = self.agent.analyze(receipt)
        assert len(analysis.anomalies) > 0

    def test_single_item_categorization(self):
        # AI assigns a non-empty string category to each item
        for item_name in ["Whole Milk", "Salmon Fillet", "Sourdough Bread", "Potato Chips"]:
            cat = self.agent._categorize(item_name)
            assert isinstance(cat, str) and len(cat) > 0


# ---------------------------------------------------------------------------
# Image processor tests
# ---------------------------------------------------------------------------

class TestImageProcessor:
    def setup_method(self):
        self.processor = ImageProcessor()

    def _sample_base64(self) -> str:
        from PIL import Image
        import io, base64
        img = Image.new("RGB", (200, 400), color=(240, 240, 240))
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        return base64.b64encode(buf.getvalue()).decode()

    def test_preprocess_returns_string(self):
        b64 = self._sample_base64()
        result = self.processor.preprocess(b64)
        assert isinstance(result, str)
        assert len(result) > 0

    def test_aggressive_preprocess_returns_string(self):
        b64 = self._sample_base64()
        result = self.processor.preprocess(b64, aggressive=True)
        assert isinstance(result, str)

    def test_invalid_base64_returns_original(self):
        result = self.processor.preprocess("not_valid_base64")
        assert result == "not_valid_base64"


# ---------------------------------------------------------------------------
# LLM agent fallback tests (no API key needed)
# ---------------------------------------------------------------------------

class TestLLMAgentFallback:
    def setup_method(self):
        self.agent = LLMAgent(api_key="invalid_key_triggers_fallback")
        self.parser = ParserAgent()
        self.analysis_agent = AnalysisAgent()

    def test_fallback_returns_llm_insight(self):
        receipt = ParserAgent().parse(SAMPLE_STRUCTURED)
        analysis = AnalysisAgent().analyze(receipt)
        # Force fallback
        insight = self.agent._fallback_insights(analysis)
        assert isinstance(insight, LLMInsight)
        assert insight.summary
        assert len(insight.recommendations) > 0
        assert len(insight.budget_tips) > 0
        assert insight.savings_potential


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
