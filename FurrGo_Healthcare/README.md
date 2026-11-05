# FurrGo Healthcare API 🐼

A lightweight **FastAPI** backend providing Nemotron-powered text chat and health data tracking for the FurrGo ecosystem.

> This is the **FurrGo_Healthcare** service — one of three independent backends in the FurrGo project.
> See the [root README](../README.md) for the full architecture.

---

## Role

| Feature | Status |
|---|---|
| Nemotron text-only chat | ✅ |
| Health data models (users, documents) | ✅ |
| SQLite database | ✅ |
| PDF/image analysis | ✅ (via Gemini) |
| RAG pipeline | ✅ |
| Medication scheduling | ❌ (use Healthcare_Backend) |
| Fitness tracking | ❌ (use Healthcare_Backend) |

---

## Getting Started

```bash
# 1. Create virtual environment
python -m venv .venv
source .venv/bin/activate    # Linux/macOS
.venv\Scripts\Activate.ps1  # Windows PowerShell

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env with your API keys

# 4. Start the server
uvicorn app.main:app --host 127.0.0.1 --port 8002 --reload
```

The server starts at **http://127.0.0.1:8002**.

API documentation: http://127.0.0.1:8002/docs

---

## API Endpoints

### `GET /health`
Service health check.

### `POST /api/chat`
Nemotron text-only chat with optional RAG context.

**Request:**
```json
{
  "message": "What are signs of dehydration?",
  "session_id": "optional-session-id"
}
```

---

## Running Tests

```bash
pytest -v
```

Expected: **55/55 tests passing** ✅

---

## Environment Variables

See [`.env.example`](.env.example) for the full list.

| Variable | Default | Required |
|---|---|---|
| `NVIDIA_API_KEY` | — | ✅ |
| `GEMINI_API_KEY` | — | Optional |
| `DATABASE_URL` | `sqlite:///./data/health_ai.db` | No |
| `PORT` | `8002` | No |

---

## Tech Stack

- Python 3.11 · FastAPI · Uvicorn
- Pydantic Settings · SQLAlchemy 2.x
- NVIDIA Nemotron · Google Gemini
- Sentence Transformers · ChromaDB
- pytest · httpx
