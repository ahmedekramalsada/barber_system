@echo off
chcp 65001 >nul
title Barber System
color 0B

cd /d "%~dp0"

echo ========================================================
echo           Barber Salon Management System
echo ========================================================
echo.

:: 1. Check Python
python --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [!] Python not found. Installing...
    winget install Python.Python.3.11 --accept-source-agreements --accept-package-agreements --silent
    pause
    exit
)

:: 2. Check Node.js
node --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [!] Node.js not found. Installing...
    winget install OpenJS.NodeJS --accept-source-agreements --accept-package-agreements --silent
    pause
    exit
)

:: 3. Backend Setup
echo [1/3] Checking Backend (FastAPI)...
python -m pip install fastapi uvicorn >nul 2>&1

:: 4. Frontend Setup
echo [2/3] Checking Frontend (React)...
if exist "frontend" (
    cd frontend
    if not exist "node_modules\" (
        echo Installing frontend dependencies...
        call npm install >nul 2>&1
    )
    cd ..
)

:: 5. Port Cleanup
echo [3/4] Clearing Ports 8000 and 5173...
FOR /F "tokens=5" %%a IN ('netstat -aon ^| findstr :8000') DO taskkill /F /PID %%a >nul 2>&1
FOR /F "tokens=5" %%a IN ('netstat -aon ^| findstr :5173') DO taskkill /F /PID %%a >nul 2>&1

:: 6. Launch
echo [4/4] Starting System...
set PYTHONPATH=%CD%
start "Barber Backend" cmd /k "python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000"
start "Barber Frontend" cmd /k "cd frontend && npm run dev -- --open"

echo.
echo ==========================================
echo System is starting!
echo ==========================================
pause
