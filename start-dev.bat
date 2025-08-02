@echo off
title PGY3-HUB Development Mode
echo ========================================
echo PGY3-HUB v0.2.0 - Development Mode
echo ========================================
echo.

echo Starting development environment...
echo.

echo [1/3] Starting backend server...
cd /d "%~dp0backend"
if not exist "server.py" (
    echo ERROR: Backend server files not found in %CD%
    pause
    exit /b 1
)

start "PGY3-Backend" cmd /k "python -m uvicorn server:app --reload --port 8001"
echo Backend server started in separate window...

echo Waiting for backend to initialize...
timeout /t 3 /nobreak >nul

echo.
echo [2/3] Starting frontend development server...
cd /d "%~dp0frontend"
if not exist "package.json" (
    echo ERROR: Frontend package.json not found in %CD%
    pause
    exit /b 1
)

start "PGY3-Frontend" cmd /k "npm start"
echo Frontend server started in separate window...

echo Waiting for frontend to initialize...
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