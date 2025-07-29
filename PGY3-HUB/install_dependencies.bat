@echo off
echo Installing PGY3-HUB Dependencies...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python from https://www.python.org/downloads/
    pause
    exit /b 1
)

echo Node.js and Python are installed!
echo.

REM Navigate to frontend and install dependencies
echo Installing frontend dependencies...
cd /d "%~dp0frontend"
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)

echo.
echo Installing backend Python dependencies...
cd /d "%~dp0backend"
call python -m pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install backend Python dependencies
    pause
    exit /b 1
)

echo.
echo Installing backend Node.js dependencies (optional)...
call npm install
if %errorlevel% neq 0 (
    echo WARNING: Failed to install backend Node.js dependencies (this is optional)
)

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo To start the application:
echo 1. Open PowerShell
echo 2. Navigate to the frontend folder:
echo    cd "%~dp0frontend"
echo 3. Run: npm run dev
echo.
echo This will start both the backend and frontend servers.
echo Access the application at: http://localhost:3000
echo.
pause
