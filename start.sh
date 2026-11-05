#!/usr/bin/env bash
# =============================================================
# FurrGo — Start all backend services (Linux / macOS / WSL)
# Usage: bash start.sh
# Press Ctrl+C to stop all services.
# =============================================================

set -e
REPO="$(cd "$(dirname "$0")" && pwd)"

check_env() {
    local dir="$1" name="$2"
    if [ ! -f "$dir/.env" ]; then
        echo "WARNING: $name: .env not found. Copy $dir/.env.example to $dir/.env and fill in API keys."
        return 1
    fi
}

echo "FurrGo — Starting all backend services"
echo ""

MISSING=0
check_env "$REPO/Healthcare_Backend" "Healthcare_Backend" || MISSING=1
check_env "$REPO/Gemini_Backend"     "Gemini_Backend"     || MISSING=1
check_env "$REPO/FurrGo_Healthcare"  "FurrGo_Healthcare"  || MISSING=1

if [ "$MISSING" -eq 1 ]; then
    echo ""
    echo "ERROR: Please create .env files before starting. See .env.example for required variables."
    exit 1
fi

cleanup() {
    echo ""
    echo "Stopping all FurrGo services..."
    kill "$HC_PID" "$GB_PID" "$FH_PID" 2>/dev/null
    wait "$HC_PID" "$GB_PID" "$FH_PID" 2>/dev/null
    echo "Done."
}
trap cleanup INT TERM

# Healthcare_Backend (port 8000)
echo "[1/3] Starting Healthcare_Backend → http://localhost:8000"
cd "$REPO/Healthcare_Backend"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 &
HC_PID=$!

sleep 2

# Gemini_Backend (port 8001)
echo "[2/3] Starting Gemini_Backend → http://localhost:8001"
cd "$REPO/Gemini_Backend"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 &
GB_PID=$!

sleep 2

# FurrGo_Healthcare (port 8002)
echo "[3/3] Starting FurrGo_Healthcare → http://localhost:8002"
cd "$REPO/FurrGo_Healthcare"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8002 &
FH_PID=$!

echo ""
echo "All services started. Press Ctrl+C to stop."
echo ""
echo "API documentation:"
echo "  Healthcare_Backend : http://localhost:8000/docs"
echo "  Gemini_Backend     : http://localhost:8001/docs"
echo "  FurrGo_Healthcare  : http://localhost:8002/docs"
echo ""
echo "Health checks:"
echo "  http://localhost:8000/health"
echo "  http://localhost:8001/health"
echo "  http://localhost:8002/health"

wait
