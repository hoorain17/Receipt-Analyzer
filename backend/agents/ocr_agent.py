import json
from openai import OpenAI

from config import OPENAI_API_KEY, OCR_MODEL
from utils.logger import get_logger

logger = get_logger(__name__)


class OCRAgent:
    def __init__(self, api_key: str = None):
        self.client = OpenAI(api_key=api_key or OPENAI_API_KEY)
        self.model = OCR_MODEL

    def extract_text(self, image_base64: str) -> dict:
        """Extract raw text from receipt image using GPT-4 Vision."""
        logger.info("🔍 Extracting text via GPT-4 Vision")
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_base64}",
                                    "detail": "high",
                                },
                            },
                            {
                                "type": "text",
                                "text": (
                                    "Extract ALL text from this receipt exactly as it appears, "
                                    "line by line. Preserve all numbers, prices, and item names."
                                ),
                            },
                        ],
                    }
                ],
                max_tokens=2000,
            )
            extracted_text = response.choices[0].message.content
            logger.info("✅ Raw text extraction complete (%d chars)", len(extracted_text))
            return {
                "extracted_text": extracted_text,
                "confidence": 0.95,
                "method": "gpt4-vision",
            }
        except Exception as e:
            logger.error("❌ OCR text extraction failed: %s", e)
            raise

    def extract_structured_data(self, image_base64: str) -> dict:
        """Extract structured receipt data directly as JSON using GPT-4 Vision."""
        logger.info("🔍 Extracting structured data via GPT-4 Vision")
        try:
            prompt = """Analyze this receipt image and return a JSON object with the following structure:
{
  "store_name": "store name or null",
  "date": "date string or null",
  "items": [
    {
      "name": "item name",
      "quantity": 1,
      "unit_price": 0.00,
      "total_price": 0.00
    }
  ],
  "subtotal": 0.00,
  "tax": 0.00,
  "total": 0.00,
  "raw_text": "full raw text of receipt"
}

Rules:
- Extract every line item with accurate prices
- If quantity is not shown, assume 1
- total_price = quantity * unit_price
- Include all items, even if price seems unusual
- Return ONLY the JSON, no extra text"""

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{image_base64}",
                                    "detail": "high",
                                },
                            },
                            {"type": "text", "text": prompt},
                        ],
                    }
                ],
                max_tokens=3000,
                response_format={"type": "json_object"},
            )
            raw = response.choices[0].message.content
            structured = json.loads(raw)
            logger.info("✅ Structured extraction complete: %d items", len(structured.get("items", [])))
            return structured
        except Exception as e:
            logger.error("❌ Structured OCR extraction failed: %s", e)
            raise

    def postprocess_text(self, text: str) -> str:
        """Clean OCR text output."""
        import re
        # Normalize whitespace
        text = re.sub(r"\s+", " ", text).strip()
        # Fix common OCR substitutions
        text = text.replace("|", "1").replace("O", "0") if text.count("|") > text.count("l") else text
        return text
