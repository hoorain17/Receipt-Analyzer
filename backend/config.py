import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

ALLOWED_ORIGINS = [
    FRONTEND_URL,
    "http://localhost:3000",
    "https://*.vercel.app",
]

OCR_MODEL = "gpt-4o"
LLM_MODEL = "gpt-4o"
LLM_MINI_MODEL = "gpt-4o-mini"

MAX_IMAGE_WIDTH = 2000
IMAGE_QUALITY = 85
