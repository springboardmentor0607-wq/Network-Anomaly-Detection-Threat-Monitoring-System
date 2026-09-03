@echo off
REM ═══════════════════════════════════════════════════════════════
REM   NetShield — Stop All Services
REM ═══════════════════════════════════════════════════════════════
echo.
echo Stopping NetShield services...
echo.

taskkill /FI "WINDOWTITLE eq NetShield Backend*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq NetShield Frontend*" /F >nul 2>&1

REM Also kill any uvicorn or next dev processes
taskkill /IM uvicorn.exe /F >nul 2>&1

echo Done. All NetShield services stopped.
pause
