# ============================================================
# FurrGo — Healthcare_Backend
# Primary backend: RAG, medication, fitness, Nemotron, Gemini
# Port: 8000
# ============================================================
FROM python:3.11-slim

# System dependencies for PyMuPDF / pillow / sentence-transformers
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libglib2.0-0 \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create data/upload directories (persist via volume)
RUN mkdir -p data uploads chroma_db

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

