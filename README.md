# FurrGo 🐼

**FurrGo** is an AI-powered personal health companion that strengthens your bond with a virtual panda mascot as you improve your own health. The more you care for yourself — medications, fitness, sleep — the happier your panda becomes.

---

## Project Architecture

```
FurrGo/
├── Frontend/                    # TanStack Start + React prototype (Lovable-managed)
├── Healthcare_Backend/          # Primary backend — port 8000
├── Gemini_Backend/              # Multimodal backend — port 8001
├── FurrGo_Healthcare/           # Lightweight backend — port 8002
├── docker-compose.yml           # Run all three backends together
├── start.ps1                    # Windows startup script
├── start.sh                     # Linux/macOS startup script
└── .env.example                 # Consolidated environment variable reference
```

### Backend Responsibilities

| Service | Port | Description |
|---|---|---|
| `Healthcare_Backend` | 8000 | **Primary.** Full RAG pipeline, medication scheduling, fitness tracking, Google Health OAuth, Nemotron text chat, Gemini image/PDF ingestion, ChromaDB vector store, SQLite database, APScheduler |
| `Gemini_Backend` | 8001 | **Multimodal.** Gemini image/PDF ingestion with RAG, Nemotron text chat, ChromaDB |
| `FurrGo_Healthcare` | 8002 | **Lightweight.** Nemotron text-only chat, basic health data, SQLite |

> **Architecture rule:** Nemotron handles all text generation. Gemini is used exclusively for image/PDF understanding during document ingestion — never for normal text chat.

### Frontend

The `Frontend/` directory contains a **TanStack Start + React + TypeScript** prototype, managed by [Lovable](https://lovable.dev). It is a fully simulated UI with mock health data — no live backend calls are currently wired.

**Tech stack:** React 19 · TanStack Router · TanStack Query · Tailwind CSS v4 · shadcn/ui · Framer Motion · Recharts · Vite 8

**To connect the frontend to the primary backend**, set `VITE_API_BASE_URL=http://localhost:8000` in `Frontend/.env.local` and wire the AI chat screen to `POST /api/chat`.

---

## API Endpoints

### Healthcare_Backend (port 8000)

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Service health check |
| `POST` | `/api/chat` | AI chat (text, image, PDF → Nemotron/Gemini) |
| `POST` | `/api/documents` | Ingest PDF/image into RAG index |
| `GET/POST` | `/api/medication` | Medication CRUD and scheduling |
| `GET/POST` | `/api/fitness` | Fitness data |
| `GET/POST` | `/api/fitness/google/*` | Google Health OAuth integration |

### Gemini_Backend (port 8001)

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Service health check |
| `POST` | `/api/chat` | Multimodal chat (Nemotron text + Gemini image) |
| `POST` | `/api/documents` | Ingest PDF/image into RAG index |

### FurrGo_Healthcare (port 8002)

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Service health check |
| `POST` | `/api/chat` | Nemotron text-only chat |

---

## Getting Started

### Prerequisites

- Python 3.11+
- pip
- (Optional) Docker + Docker Compose

---

### Option A — Docker Compose (recommended)

```bash
# 1. Copy and fill in environment files for each backend
cp Healthcare_Backend/.env.example Healthcare_Backend/.env
cp Gemini_Backend/.env.example      Gemini_Backend/.env
cp FurrGo_Healthcare/.env.example   FurrGo_Healthcare/.env
# Edit each .env file and add your API keys

# 2. Build and start all backends
docker compose up --build

# Or in detached mode
docker compose up -d --build

# 3. Stop everything
docker compose down
```

**Services will be available at:**
- Healthcare_Backend: http://localhost:8000/docs
- Gemini_Backend: http://localhost:8001/docs
- FurrGo_Healthcare: http://localhost:8002/docs

---

### Option B — Local Development (Windows)

```powershell
# 1. Set up each backend's virtual environment
cd Healthcare_Backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
cp .env.example .env   # then edit .env

cd ..\Gemini_Backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
cp .env.example .env   # then edit .env

cd ..\FurrGo_Healthcare
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
cp .env.example .env   # then edit .env

# 2. Start all backends (opens 3 terminal windows)
cd ..
.\start.ps1
```

---

### Option C — Local Development (Linux / macOS / WSL)

```bash
# 1. Set up each backend
for dir in Healthcare_Backend Gemini_Backend FurrGo_Healthcare; do
    cd $dir
    python -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
    cp .env.example .env   # then edit .env
    deactivate
    cd ..
done

# 2. Start all backends
bash start.sh
```

---

## Running Tests

Each backend has a complete pytest test suite.

```bash
# Healthcare_Backend — 229 tests
cd Healthcare_Backend
python -m pytest -v

# Gemini_Backend — 71 tests
cd Gemini_Backend
python -m pytest -v

# FurrGo_Healthcare — 55 tests
cd FurrGo_Healthcare
python -m pytest -v
```

**Verified results:** 229 + 71 + 55 = **355/355 tests passing** ✅

---

## Environment Variables

See [`.env.example`](.env.example) for the complete list. Each backend has its own `.env.example`.

| Variable | Required | Used By | Description |
|---|---|---|---|
| `NVIDIA_API_KEY` | ✅ | All | NVIDIA Nemotron API key ([get one here](https://build.nvidia.com)) |
| `GEMINI_API_KEY` | ✅ | Healthcare, Gemini | Google Gemini API key for image/PDF ingestion |
| `GOOGLE_CLIENT_ID` | Optional | Healthcare | Google OAuth client ID (fitness tracking) |
| `GOOGLE_CLIENT_SECRET` | Optional | Healthcare | Google OAuth client secret |
| `DATABASE_URL` | No | Healthcare, FurrGo | SQLite path (default: `sqlite:///./data/health_ai.db`) |
| `UPLOAD_DIR` | No | Healthcare, Gemini | Directory for uploaded files |
| `MAX_UPLOAD_SIZE_MB` | No | All | Max upload size (default: 10) |
| `TOKEN_ENCRYPTION_KEY` | Optional | Healthcare | 32-byte key for notification encryption |

> Never commit real API keys. Only `.env.example` files are tracked in Git.

---

## Frontend (Lovable Prototype)

The `Frontend/` directory is a scaffold for a [Lovable](https://lovable.dev)-managed TanStack Start prototype. The actual React source (`src/`) is managed on Lovable's platform.

**Current state:** Fully simulated UI with mock data. No live backend API calls.

**To add live backend integration:**
1. Open the project on Lovable
2. Set `VITE_API_BASE_URL=http://localhost:8000` in environment config
3. Wire the **FurrGo AI** chat screen to `POST /api/chat` on `Healthcare_Backend`
4. Wire the **Medical Translator** upload to `POST /api/documents`

---

## Security

- All `.env` files are git-ignored. Never commit real credentials.
- NVIDIA API keys have been revoked and removed from Git history.
- CORS is currently open (`allow_origins=["*"]`) — tighten this in production.
- All uploaded files are processed in memory; nothing is committed to version control.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TanStack Start, TypeScript, Tailwind CSS v4, shadcn/ui, Framer Motion |
| **Primary backend** | Python 3.11, FastAPI, Uvicorn, SQLAlchemy, APScheduler |
| **Text generation** | NVIDIA Nemotron (`nvidia/nemotron-3.5-lightning-30b-a3b`) |
| **Image / PDF** | Google Gemini (`gemini-1.5-flash`) |
| **Embeddings** | Sentence Transformers (`all-MiniLM-L6-v2`) |
| **Vector store** | ChromaDB |
| **Database** | SQLite (via SQLAlchemy 2.x) |
| **Testing** | pytest, httpx, pytest-asyncio |
| **Containerization** | Docker, Docker Compose |

---

## License

MIT
