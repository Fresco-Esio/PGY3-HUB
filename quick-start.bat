@echo off
REM Quick start script for PGY3-HUB development (Windows)

echo 🚀 PGY3-HUB Quick Start
echo ======================

REM Check prerequisites
echo 📋 Checking prerequisites...

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Python is not installed. Please install Python first.
    pause
    exit /b 1
)

echo ✅ All prerequisites found!

REM Choose backend type
echo.
echo 🔧 Choose your backend:
echo 1) Python FastAPI (Recommended)
echo 2) Node.js Express
set /p backend_choice="Enter choice (1 or 2): "

REM Install frontend dependencies if needed
echo.
echo 📦 Installing frontend dependencies...
cd frontend
if not exist "node_modules" (
    npm install
) else (
    echo ✅ Frontend dependencies already installed
)

REM Install backend dependencies based on choice
cd ..\backend
echo.

if "%backend_choice%"=="1" (
    echo 🐍 Setting up Python FastAPI backend...
    if not exist "venv" (
        echo Creating Python virtual environment...
        python -m venv venv
    )
    
    REM Activate virtual environment
    call venv\Scripts\activate.bat
    
    echo Installing Python dependencies...
    pip install -r requirements.txt
    
    echo.
    echo 🎉 Setup complete! Starting servers...
    echo Backend: http://localhost:8001
    echo Frontend: http://localhost:3000
    echo.
    echo Press Ctrl+C to stop both servers
    echo.
    
    REM Start both servers
    cd ..\frontend
    npm run dev-python
    
) else if "%backend_choice%"=="2" (
    echo 📦 Setting up Node.js Express backend...
    if not exist "node_modules" (
        npm install
    ) else (
        echo ✅ Backend dependencies already installed
    )
    
    echo.
    echo 🎉 Setup complete! Starting servers...
    echo Backend: http://localhost:8000
    echo Frontend: http://localhost:3000
    echo.
    echo Press Ctrl+C to stop both servers
    echo.
    
    REM Start both servers
    cd ..\frontend
    npm run dev-node
    
) else (
    echo ❌ Invalid choice. Please run the script again.
    pause
    exit /b 1
)

pause
