"""Generate synthetic receipt images for testing the pipeline."""

import base64
import io
import json
import random
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

SAMPLE_RECEIPTS = [
    {
        "store": "Walmart Supercenter",
        "date": "02/10/2026",
        "items": [
            ("2% Milk 1 Gallon", 1, 3.49),
            ("Cheddar Cheese 16oz", 1, 5.99),
            ("Chicken Breast 2lb", 1, 8.47),
            ("Lay's Classic Chips", 2, 3.98),
            ("Wonder White Bread", 1, 3.29),
            ("Orange Juice 64oz", 1, 4.99),
            ("Tide Detergent 92oz", 1, 12.97),
            ("Roma Tomatoes", 3, 2.97),
            ("Banana Bunch", 1, 1.29),
        ],
        "tax_rate": 0.08,
    },
    {
        "store": "Whole Foods Market",
        "date": "02/11/2026",
        "items": [
            ("Organic Whole Milk", 1, 6.99),
            ("Grass-Fed Ground Beef", 1, 11.99),
            ("Sourdough Loaf", 1, 7.49),
            ("Organic Blueberries", 2, 9.98),
            ("Greek Yogurt Plain", 1, 4.99),
            ("Almond Butter 16oz", 1, 9.99),
            ("Sparkling Water 12pk", 1, 8.99),
            ("Organic Spinach 5oz", 1, 3.99),
        ],
        "tax_rate": 0.085,
    },
    {
        "store": "Target",
        "date": "02/12/2026",
        "items": [
            ("Frozen Pizza 2pk", 1, 7.99),
            ("Ice Cream Vanilla", 1, 4.49),
            ("Candy Mix Bag", 1, 5.99),
            ("Pepsi 12 Pack", 1, 7.49),
            ("Shampoo Head & Shoulders", 1, 6.99),
            ("Tide Pods 31ct", 1, 13.99),
            ("Colgate Toothpaste", 2, 5.98),
            ("Paper Towels 6-Roll", 1, 9.99),
        ],
        "tax_rate": 0.075,
    },
]


def _create_receipt_image(store: str, date: str, items: list, tax_rate: float) -> Image.Image:
    """Render a realistic-looking receipt as a PIL Image."""
    width = 400
    line_h = 22
    padding = 20
    header_lines = 5
    footer_lines = 4
    total_lines = header_lines + len(items) + footer_lines + 2
    height = padding * 2 + total_lines * line_h + 20

    img = Image.new("RGB", (width, height), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)

    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 14)
        font_bold = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf", 14)
        font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 12)
    except Exception:
        font = font_bold = font_small = ImageFont.load_default()

    def write(y, text, bold=False, center=False, small=False):
        f = font_small if small else (font_bold if bold else font)
        x = padding
        if center:
            bbox = draw.textbbox((0, 0), text, font=f)
            tw = bbox[2] - bbox[0]
            x = (width - tw) // 2
        draw.text((x, y), text, fill=(0, 0, 0), font=f)
        return y + line_h

    y = padding
    y = write(y, store, bold=True, center=True)
    y = write(y, f"Date: {date}", center=True, small=True)
    y = write(y, "-" * 45, small=True)
    y = write(y, f"{'ITEM':<24} {'QTY':>3} {'PRICE':>8}", small=True)
    y = write(y, "-" * 45, small=True)

    subtotal = 0.0
    for name, qty, price in items:
        total = round(qty * price, 2)
        subtotal += total
        line = f"{name[:22]:<22} {qty:>3}   ${total:>6.2f}"
        y = write(y, line, small=True)

    tax = round(subtotal * tax_rate, 2)
    grand_total = round(subtotal + tax, 2)

    y = write(y, "-" * 45, small=True)
    y = write(y, f"Subtotal:              ${subtotal:>8.2f}", small=True)
    y = write(y, f"Tax ({tax_rate*100:.1f}%):             ${tax:>8.2f}", small=True)
    y = write(y, f"TOTAL:                 ${grand_total:>8.2f}", bold=True)
    y = write(y, "", small=True)
    y = write(y, "Thank you for shopping!", center=True, small=True)

    return img


def generate_sample_receipts(output_path: str = None) -> list[dict]:
    """Generate sample receipts and return as list of dicts with base64 images."""
    results = []
    for receipt_data in SAMPLE_RECEIPTS:
        img = _create_receipt_image(
            receipt_data["store"],
            receipt_data["date"],
            receipt_data["items"],
            receipt_data["tax_rate"],
        )
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

        subtotal = round(sum(qty * price for _, qty, price in receipt_data["items"]), 2)
        tax = round(subtotal * receipt_data["tax_rate"], 2)

        results.append({
            "store": receipt_data["store"],
            "date": receipt_data["date"],
            "total": round(subtotal + tax, 2),
            "item_count": len(receipt_data["items"]),
            "image_base64": b64,
            "description": f"{len(receipt_data['items'])} items, ${round(subtotal + tax, 2):.2f} total",
        })

    if output_path:
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w") as f:
            json.dump(results, f, indent=2)
        print(f"✅ Saved {len(results)} sample receipts to {output_path}")

    return results


if __name__ == "__main__":
    generate_sample_receipts("../frontend/public/sample-receipts.json")
