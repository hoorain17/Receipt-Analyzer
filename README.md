# AI-Powered Receipt Analyzer

> Upload a receipt image → OCR extraction → Expense categorization → Spending analysis → Personalized LLM budgeting advice

---

## Stack

| Layer | Technology |
|-------|-----------|
| OCR | GPT-4 Vision (OpenAI) |
| LLM Insights | GPT-4o (OpenAI) |
| Backend | FastAPI + Python 3.11 |
| Frontend | Next.js 14 + Tailwind CSS + Recharts |
| Deployment | Vercel (both frontend & backend) |

---

## Architecture

```
Receipt Image
      │
      ▼
ImageProcessor (PIL preprocessing)
      │
      ▼
OCRAgent (GPT-4 Vision → structured JSON)
      │
      ▼
ParserAgent (JSON / regex → Receipt object)
      │
      ▼
AnalysisAgent (keyword categorization + anomaly detection)
      │
      ▼
LLMAgent (GPT-4o → personalized financial insights)
      │
      ▼
FastAPI Response → Next.js UI
```

---

## Quick Start

### 1. Backend

```bash
cd backend
cp .env.example .env
# Add your OpenAI API key to .env

pip install -r requirements.txt

# Run locally
python -m uvicorn api.index:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
cp .env.local.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:8000

npm install
npm run dev
# Open http://localhost:3000
```

### 3. Generate sample receipts (optional)

```bash
cd backend
python utils/sample_generator.py
```

### 4. Run tests

```bash
cd backend
pip install pytest
pytest tests/ -v
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/analyze` | Full receipt analysis pipeline |
| `POST` | `/api/categorize-item` | Categorize a single item name |
| `GET` | `/api/categories` | List all categories with keywords |

### POST /api/analyze

**Request:**
```json
{
  "image_base64": "<base64-encoded image>",
  "aggressive_preprocessing": false
}
```

**Response:**
```json
{
  "success": true,
  "processing_time": 8.4,
  "data": {
    "receipt": { "items": [...], "total": 51.24, ... },
    "spending_analysis": { "category_breakdown": [...], "anomalies": [...] },
    "llm_insight": { "summary": "...", "recommendations": [...] }
  }
}
```

---

## Expense Categories

`snacks` · `dairy` · `meat` · `bakery` · `beverages` · `fruits_vegetables` · `household` · `personal_care` · `frozen` · `other`

---

## Environment Variables

**Backend (`backend/.env`)**
```
OPENAI_API_KEY=sk-...
FRONTEND_URL=http://localhost:3000
```

**Frontend (`frontend/.env.local`)**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Vercel Deployment

1. Push repo to GitHub
2. Import backend as a Vercel Python project (set root to `backend/`)
3. Import frontend as a Vercel Next.js project (set root to `frontend/`)
4. Set environment variables in Vercel dashboard
5. Update `NEXT_PUBLIC_API_URL` to the deployed backend URL

---

## Project Structure

```
├── backend/
│   ├── api/index.py          # FastAPI app (Vercel entry)
│   ├── agents/
│   │   ├── ocr_agent.py      # GPT-4 Vision OCR
│   │   ├── parser_agent.py   # Text → Receipt model
│   │   ├── analysis_agent.py # Categorization + spending
│   │   └── llm_agent.py      # Financial insights
│   ├── models/data_models.py # Pydantic schemas
│   ├── utils/
│   │   ├── image_processor.py
│   │   ├── logger.py
│   │   └── sample_generator.py
│   └── tests/test_pipeline.py
│
└── frontend/
    ├── app/
    │   ├── layout.tsx
    │   └── page.tsx           # Main application
    ├── components/
    │   ├── UploadZone.tsx
    │   ├── ProcessingStatus.tsx
    │   ├── SpendingBreakdown.tsx  # Pie + Bar charts
    │   ├── AIInsights.tsx
    │   ├── ReceiptDetails.tsx
    │   ├── ExportSection.tsx
    │   └── SampleReceipts.tsx
    └── lib/
        ├── api.ts             # Axios client + export helpers
        └── types.ts           # TypeScript interfaces
```
"# Receipt-Analyzer" 
