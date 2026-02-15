import base64
import io
from PIL import Image, ImageEnhance, ImageFilter

from config import MAX_IMAGE_WIDTH, IMAGE_QUALITY
from utils.logger import get_logger

logger = get_logger(__name__)


class ImageProcessor:
    def preprocess(self, image_base64: str, aggressive: bool = False) -> str:
        """Preprocess a base64-encoded image for optimal OCR results."""
        try:
            logger.info("📸 Starting image preprocessing (aggressive=%s)", aggressive)
            image = self._base64_to_pil(image_base64)
            image = self._resize(image)
            image = self._enhance(image, aggressive)
            result = self._pil_to_base64(image)
            logger.info("✅ Image preprocessing complete")
            return result
        except Exception as e:
            logger.error("❌ Image preprocessing failed: %s", e)
            return image_base64  # return original on failure

    def _resize(self, image: Image.Image) -> Image.Image:
        width, height = image.size
        if width > MAX_IMAGE_WIDTH:
            ratio = MAX_IMAGE_WIDTH / width
            new_size = (MAX_IMAGE_WIDTH, int(height * ratio))
            image = image.resize(new_size, Image.LANCZOS)
            logger.info("🔄 Resized to %s", new_size)
        return image

    def _enhance(self, image: Image.Image, aggressive: bool) -> Image.Image:
        # Convert to RGB if needed
        if image.mode not in ("RGB", "L"):
            image = image.convert("RGB")

        # Contrast enhancement
        contrast_factor = 1.8 if aggressive else 1.3
        image = ImageEnhance.Contrast(image).enhance(contrast_factor)

        # Sharpness enhancement
        sharpness_factor = 2.0 if aggressive else 1.5
        image = ImageEnhance.Sharpness(image).enhance(sharpness_factor)

        if aggressive:
            image = image.filter(ImageFilter.SHARPEN)
            image = ImageEnhance.Brightness(image).enhance(1.1)

        return image

    def optimize_for_api(self, image: Image.Image) -> Image.Image:
        """Compress and convert image for API submission."""
        if image.mode != "RGB":
            image = image.convert("RGB")
        return image

    def _base64_to_pil(self, base64_str: str) -> Image.Image:
        # Strip data URI prefix if present
        if "," in base64_str:
            base64_str = base64_str.split(",", 1)[1]
        data = base64.b64decode(base64_str)
        return Image.open(io.BytesIO(data))

    def _pil_to_base64(self, image: Image.Image) -> str:
        if image.mode != "RGB":
            image = image.convert("RGB")
        buffer = io.BytesIO()
        image.save(buffer, format="JPEG", quality=IMAGE_QUALITY)
        return base64.b64encode(buffer.getvalue()).decode("utf-8")
