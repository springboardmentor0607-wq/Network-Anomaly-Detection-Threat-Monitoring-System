@echo off
REM ═══════════════════════════════════════════════════════════════
REM   NetShield — One-Click Local Deployment Script (Windows)
REM   Starts: Backend (FastAPI) + Frontend (Next.js)
REM   Requirements: MongoDB already running (Service: MongoDB)
REM ═══════════════════════════════════════════════════════════════

title NetShield Deployment

echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║          NetShield AI Platform — Starting Up            ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.

REM ─── Step 1: Check MongoDB ─────────────────────────────────────
echo [1/4] Checking MongoDB...
sc query MongoDB | find "RUNNING" >nul 2>&1
if %errorlevel% equ 0 (
    echo       MongoDB is RUNNING on port 27017
) else (
    echo       MongoDB not detected as a service. Attempting to start...
    net start MongoDB >nul 2>&1
    if %errorlevel% neq 0 (
        echo       WARNING: Could not start MongoDB service.
        echo       Please start MongoDB manually and re-run this script.
    ) else (
        echo       MongoDB started successfully.
    )
)

REM ─── Step 2: Start Backend ─────────────────────────────────────
echo.
echo [2/4] Starting FastAPI Backend on http://localhost:8000 ...
start "NetShield Backend" cmd /k "cd /d e:\NetShield\backend && e:\NetShield\backend\venv\Scripts\uvicorn.exe app.main:app --host 0.0.0.0 --port 8000 --reload"
echo       Backend starting in new window...
timeout /t 4 /nobreak >nul

REM ─── Step 3: Start Frontend ────────────────────────────────────
echo.
echo [3/4] Starting Next.js Frontend on http://localhost:3001 ...
start "NetShield Frontend" cmd /k "cd /d e:\NetShield\frontend && npm run dev"
echo       Frontend starting in new window...
timeout /t 3 /nobreak >nul

REM ─── Step 4: Open Browser ──────────────────────────────────────
echo.
echo [4/4] Opening browser in 8 seconds (waiting for services to boot)...
timeout /t 8 /nobreak >nul

start "" "http://localhost:3001"
start "" "http://localhost:8000/docs"

echo.
echo  ╔══════════════════════════════════════════════════════════╗
echo  ║   NetShield is LIVE!                                    ║
echo  ║                                                          ║
echo  ║   Dashboard  →  http://localhost:3001                   ║
echo  ║   API Docs   →  http://localhost:8000/docs              ║
echo  ║   MongoDB    →  mongodb://localhost:27017               ║
echo  ║                                                          ║
echo  ║   To STOP: Close the Backend and Frontend windows       ║
echo  ╚══════════════════════════════════════════════════════════╝
echo.
pause
