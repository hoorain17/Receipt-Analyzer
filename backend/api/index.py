import sys
import os
import time

# Ensure backend root is on the path when run as a Vercel serverless function
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import ALLOWED_ORIGINS
from models.data_models import (
    AnalyzeRequest,
    AnalyzeResponse,
    AnalysisResult,
)
from agents.ocr_agent import OCRAgent
from agents.parser_agent import ParserAgent
from agents.analysis_agent import AnalysisAgent
from agents.llm_agent import LLMAgent
from utils.image_processor import ImageProcessor
from utils.logger import get_logger

logger = get_logger(__name__)

app = FastAPI(
    title="AI Receipt Analyzer API",
    description="Extracts, analyzes, and provides financial insights from receipt images.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Agent singletons
_image_processor = ImageProcessor()
_ocr_agent = OCRAgent()
_parser_agent = ParserAgent()
_analysis_agent = AnalysisAgent()
_llm_agent = LLMAgent()


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled error: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": str(exc), "data": None, "processing_time": 0.0},
    )


# --------------------------------------------------------------------------
# Health check
# --------------------------------------------------------------------------

@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}


# --------------------------------------------------------------------------
# Main analysis pipeline
# --------------------------------------------------------------------------

@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze_receipt(request: AnalyzeRequest):
    start = time.time()
    logger.info("📥 Received analysis request (aggressive=%s)", request.aggressive_preprocessing)

    try:
        # 1. Preprocess image
        logger.info("Step 1/5 — Image preprocessing")
        processed_image = _image_processor.preprocess(
            request.image_base64,
            aggressive=request.aggressive_preprocessing,
        )

        # 2. OCR — try structured first, fall back to raw text
        logger.info("Step 2/5 — OCR extraction")
        try:
            ocr_data = _ocr_agent.extract_structured_data(processed_image)
            receipt = _parser_agent.parse(ocr_data)
        except Exception as e:
            logger.warning("Structured OCR failed (%s), falling back to raw text", e)
            ocr_result = _ocr_agent.extract_text(processed_image)
            cleaned_text = _ocr_agent.postprocess_text(ocr_result["extracted_text"])
            receipt = _parser_agent.parse(cleaned_text)

        receipt.processing_time = time.time() - start

        # 3. Spending analysis
        logger.info("Step 3/5 — Spending analysis")
        spending_analysis = _analysis_agent.analyze(receipt)

        # 4. LLM insights
        logger.info("Step 4/5 — LLM insights")
        llm_insight = _llm_agent.generate_insights(spending_analysis, receipt=receipt)

        # 5. Build result
        result = AnalysisResult(
            receipt=receipt,
            spending_analysis=spending_analysis,
            llm_insight=llm_insight,
        )

        elapsed = round(time.time() - start, 2)
        logger.info("✅ Pipeline complete in %.2fs", elapsed)

        return AnalyzeResponse(success=True, data=result, processing_time=elapsed)

    except Exception as e:
        elapsed = round(time.time() - start, 2)
        logger.error("❌ Pipeline error: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


# --------------------------------------------------------------------------
# Utility endpoints
# --------------------------------------------------------------------------

@app.post("/api/categorize-item")
async def categorize_item(payload: dict):
    """Categorize a single item name."""
    name = payload.get("name", "")
    if not name:
        raise HTTPException(status_code=400, detail="'name' field is required")
    category = _analysis_agent._categorize(name)
    return {"name": name, "category": category}


@app.get("/api/categories")
async def list_categories():
    """Categories are now AI-generated dynamically — no fixed list."""
    return {"message": "Categories are assigned dynamically by the AI for each receipt."}


# --------------------------------------------------------------------------
# Entry point for local development
# --------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.index:app", host="0.0.0.0", port=8000, reload=True)
