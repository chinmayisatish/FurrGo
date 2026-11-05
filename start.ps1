#!/usr/bin/env pwsh
# =============================================================
# FurrGo — Start all backend services (PowerShell)
# Usage: .\start.ps1
# Stop with: .\stop.ps1  or Ctrl+C in each window
# =============================================================

$repo = $PSScriptRoot

function Check-Env {
    param($dir, $name)
    if (-not (Test-Path "$dir\.env")) {
        Write-Warning "$name: .env not found. Copy $dir\.env.example to $dir\.env and fill in API keys."
        return $false
    }
    return $true
}

Write-Host "FurrGo — Starting all backend services" -ForegroundColor Cyan
Write-Host ""

# Warn about missing .env files
$ok = $true
if (-not (Check-Env "$repo\Healthcare_Backend" "Healthcare_Backend")) { $ok = $false }
if (-not (Check-Env "$repo\Gemini_Backend"     "Gemini_Backend"))     { $ok = $false }
if (-not (Check-Env "$repo\FurrGo_Healthcare"  "FurrGo_Healthcare"))  { $ok = $false }

if (-not $ok) {
    Write-Host ""
    Write-Host "Please create .env files before starting. See .env.example for required variables." -ForegroundColor Red
    exit 1
}

# Start Healthcare_Backend (port 8000)
Write-Host "[1/3] Starting Healthcare_Backend on http://localhost:8000" -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command",
    "cd '$repo\Healthcare_Backend'; python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload" `
    -WindowStyle Normal

Start-Sleep -Seconds 2

# Start Gemini_Backend (port 8001)
Write-Host "[2/3] Starting Gemini_Backend on http://localhost:8001" -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command",
    "cd '$repo\Gemini_Backend'; python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload" `
    -WindowStyle Normal

Start-Sleep -Seconds 2

# Start FurrGo_Healthcare (port 8002)
Write-Host "[3/3] Starting FurrGo_Healthcare on http://localhost:8002" -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command",
    "cd '$repo\FurrGo_Healthcare'; python -m uvicorn app.main:app --host 127.0.0.1 --port 8002 --reload" `
    -WindowStyle Normal

Write-Host ""
Write-Host "All services started. API documentation:" -ForegroundColor Cyan
Write-Host "  Healthcare_Backend : http://localhost:8000/docs"
Write-Host "  Gemini_Backend     : http://localhost:8001/docs"
Write-Host "  FurrGo_Healthcare  : http://localhost:8002/docs"
Write-Host ""
Write-Host "Health checks:" -ForegroundColor Cyan
Write-Host "  http://localhost:8000/health"
Write-Host "  http://localhost:8001/health"
Write-Host "  http://localhost:8002/health"

