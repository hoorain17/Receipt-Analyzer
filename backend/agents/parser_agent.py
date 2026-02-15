import re
from typing import Optional

from models.data_models import Receipt, ReceiptItem
from utils.logger import get_logger

logger = get_logger(__name__)

PRICE_RE = re.compile(r"\$?\s*(\d{1,4}\.\d{2})")
QTY_PRICE_RE = re.compile(r"(\d+)\s*[@xX]\s*\$?(\d+\.\d{2})")
TOTAL_RE = re.compile(r"(?:total|grand\s*total)[:\s]*\$?\s*(\d+\.\d{2})", re.IGNORECASE)
TAX_RE = re.compile(r"(?:tax|gst|vat)[:\s]*\$?\s*(\d+\.\d{2})", re.IGNORECASE)
SUBTOTAL_RE = re.compile(r"(?:subtotal|sub\s*total)[:\s]*\$?\s*(\d+\.\d{2})", re.IGNORECASE)
DATE_RE = re.compile(
    r"(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2}|"
    r"(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{1,2},?\s+\d{4})",
    re.IGNORECASE,
)
STORE_SKIP = re.compile(
    r"(?:receipt|invoice|total|subtotal|tax|item|qty|price|amount|date|time|thank|www\.|\.com)",
    re.IGNORECASE,
)


class ParserAgent:
    def parse(self, data: dict | str) -> Receipt:
        """Parse OCR output (structured dict or raw text) into a Receipt object."""
        if isinstance(data, dict):
            return self._parse_structured(data)
        return self._parse_text(data)

    # ------------------------------------------------------------------
    # Structured JSON path (from GPT-4 Vision direct extraction)
    # ------------------------------------------------------------------

    def _parse_structured(self, data: dict) -> Receipt:
        logger.info("📋 Parsing structured OCR data")
        try:
            items = []
            for raw_item in data.get("items", []):
                name = raw_item.get("name", "Unknown Item").strip()
                qty = float(raw_item.get("quantity", 1) or 1)
                unit_price = float(raw_item.get("unit_price", 0) or 0)
                total_price = float(raw_item.get("total_price", 0) or 0)

                if total_price == 0 and unit_price > 0:
                    total_price = round(qty * unit_price, 2)
                if unit_price == 0 and total_price > 0:
                    unit_price = round(total_price / qty, 2)

                if unit_price > 0:
                    items.append(
                        ReceiptItem(
                            name=name,
                            quantity=qty,
                            unit_price=unit_price,
                            total_price=total_price,
                            confidence=0.95,
                        )
                    )

            receipt = Receipt(
                items=items,
                subtotal=float(data.get("subtotal", 0) or 0),
                tax=float(data.get("tax", 0) or 0),
                total=float(data.get("total", 0) or 0),
                store_name=data.get("store_name") or None,
                date=data.get("date") or None,
                raw_ocr_text=data.get("raw_text", ""),
            )
            logger.info("✅ Parsed %d items from structured data", len(items))
            return receipt
        except Exception as e:
            logger.error("❌ Structured parsing failed: %s", e)
            return Receipt(raw_ocr_text=str(data))

    # ------------------------------------------------------------------
    # Raw text regex fallback path
    # ------------------------------------------------------------------

    def _parse_text(self, text: str) -> Receipt:
        logger.info("📋 Parsing raw OCR text (%d chars)", len(text))
        lines = [l.strip() for l in text.splitlines() if l.strip()]

        store_name = self._extract_store_name(lines)
        date = self._extract_date(text)
        subtotal = self._extract_value(SUBTOTAL_RE, text)
        tax = self._extract_value(TAX_RE, text)
        total = self._extract_value(TOTAL_RE, text)
        items = self._extract_items(lines)

        receipt = Receipt(
            items=items,
            subtotal=subtotal,
            tax=tax,
            total=total,
            store_name=store_name,
            date=date,
            raw_ocr_text=text,
        )
        logger.info("✅ Parsed %d items from raw text", len(items))
        return receipt

    def _extract_store_name(self, lines: list[str]) -> Optional[str]:
        for line in lines[:5]:
            if len(line) > 3 and not STORE_SKIP.search(line) and not PRICE_RE.search(line):
                return line.title()
        return None

    def _extract_date(self, text: str) -> Optional[str]:
        m = DATE_RE.search(text)
        return m.group(0) if m else None

    def _extract_value(self, pattern: re.Pattern, text: str) -> float:
        m = pattern.search(text)
        return float(m.group(1)) if m else 0.0

    def _extract_items(self, lines: list[str]) -> list[ReceiptItem]:
        items = []
        skip_keywords = re.compile(
            r"(?:total|subtotal|tax|change|cash|visa|mastercard|card|thank|receipt|store|"
            r"phone|address|www|\.com|approved|balance|loyalty|points|member|server|"
            r"table|order|check|ticket|transaction|authorization|ref\s*#)",
            re.IGNORECASE,
        )

        for line in lines:
            if skip_keywords.search(line):
                continue

            # Pattern: "2 @ $3.99" or "2 x $3.99"
            qty_match = QTY_PRICE_RE.search(line)
            if qty_match:
                qty = float(qty_match.group(1))
                unit_price = float(qty_match.group(2))
                name = line[: qty_match.start()].strip()
                if not name:
                    name = "Item"
                items.append(
                    ReceiptItem(
                        name=self._clean_item_name(name),
                        quantity=qty,
                        unit_price=unit_price,
                        total_price=round(qty * unit_price, 2),
                    )
                )
                continue

            # Pattern: item name followed by price
            prices = PRICE_RE.findall(line)
            if prices:
                price = float(prices[-1])
                name = PRICE_RE.sub("", line).strip().rstrip("$").strip()
                if name and 0.01 < price < 10000:
                    items.append(
                        ReceiptItem(
                            name=self._clean_item_name(name),
                            quantity=1.0,
                            unit_price=price,
                            total_price=price,
                        )
                    )

        return items

    def _clean_item_name(self, name: str) -> str:
        name = re.sub(r"[^\w\s\-&'()]", "", name).strip()
        name = re.sub(r"\s+", " ", name)
        return name.title() if name else "Unknown Item"
