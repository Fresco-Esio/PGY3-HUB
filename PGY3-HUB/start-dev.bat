@echo off
title PGY3-HUB Development Mode
echo ========================================
echo PGY3-HUB v0.2.0 - Development Mode
echo ========================================
echo.

echo Starting development environment...
echo.

echo [1/3] Starting backend server...
cd backend
start "PGY3-Backend" cmd /k "python -m uvicorn server:app --reload --port 8001"
if %errorlevel% neq 0 (
    echo ERROR: Failed to start backend server
    pause
    exit /b 1
)

echo Waiting for backend to start...
timeout /t 3 /nobreak >nul

echo.
echo [2/3] Starting frontend development server...
cd ..\frontend
start "PGY3-Frontend" cmd /k "npm start"
if %errorlevel% neq 0 (
    echo ERROR: Failed to start frontend server
    pause
    exit /b 1
)

echo Waiting for frontend to start...
timeout /t 5 /nobreak >nul

echo.
echo [3/3] Starting Electron in development mode...
echo This will open the desktop app with hot reload enabled...
timeout /t 2 /nobreak >nul

npm run electron-dev
if %errorlevel% neq 0 (
    echo ERROR: Failed to start Electron
    pause
    exit /b 1
)

echo.
echo Development session ended.
pause