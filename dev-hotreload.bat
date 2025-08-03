@echo off
REM PGY3-HUB Hot Reload Development - Quick Start
REM Enhanced batch file with hot reload capabilities

setlocal EnableDelayedExpansion

echo 🔥 PGY3-HUB Hot Reload Development
echo ================================
echo.

REM Set default backend
set BACKEND=python
set TEST_MODE=false
set PORT=3000

REM Parse command line arguments
:parse
if "%~1"=="--node" (
    set BACKEND=node
    shift
    goto parse
)
if "%~1"=="--test" (
    set TEST_MODE=true
    shift
    goto parse
)
if "%~1"=="--port" (
    set PORT=%~2
    shift
    shift
    goto parse
)
if "%~1"=="/?" goto help
if "%~1"=="--help" goto help
if not "%~1"=="" (
    echo Unknown option: %~1
    goto help
)

echo 🔧 Configuration:
echo   Backend: %BACKEND%
echo   Test Mode: %TEST_MODE%
echo   Frontend Port: %PORT%
echo.

REM Check prerequisites
echo 📋 Checking prerequisites...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed!
    pause
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ npm is not installed!
    pause
    exit /b 1
)

if "%BACKEND%"=="python" (
    where python >nul 2>nul
    if %errorlevel% neq 0 (
        echo ❌ Python is not installed!
        pause
        exit /b 1
    )
)

echo ✅ Prerequisites met!
echo.

REM Check directories
if not exist "frontend" (
    echo ❌ Frontend directory not found!
    pause
    exit /b 1
)

if not exist "backend" (
    echo ❌ Backend directory not found!
    pause
    exit /b 1
)

REM Set environment variables
set REACT_APP_BACKEND_URL=http://localhost:8001
set REACT_APP_DEV_MODE=true
set REACT_APP_HOT_RELOAD=true

if "%TEST_MODE%"=="true" (
    set REACT_APP_TEST_MODE=true
    set REACT_APP_LOG_LEVEL=debug
)

REM Display information
echo 🚀 Starting Hot Reload Development Environment...
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo 🔗 Frontend: http://localhost:%PORT%
echo 🔗 Backend:  http://localhost:8001
echo 🔗 API Docs: http://localhost:8001/docs
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo ⚡ Hot Reload Features:
echo   • Frontend: Auto-refresh on file changes
echo   • Backend:  Auto-restart on file changes
echo   • API:      Live documentation updates
echo.
echo 🛠️  Development Shortcuts:
echo   • Ctrl+C:   Stop all servers
echo   • Ctrl+R:   Refresh browser (in frontend)
echo   • F12:      Open developer tools
echo.
echo 📝 Testing URLs:
echo   • Mind Map: http://localhost:%PORT%
echo   • API Test: http://localhost:8001/mindmap-data
echo   • Health:   http://localhost:8001/health
echo.

if "%TEST_MODE%"=="true" (
    echo 🧪 Test Mode Enabled:
    echo   • Debug logging active
    echo   • Extended error messages
    echo   • Performance monitoring
    echo.
)

echo Press Ctrl+C to stop all servers
echo.

REM Start development environment
cd frontend

if "%BACKEND%"=="python" (
    echo 🐍 Starting with Python FastAPI backend...
    npm run dev-python
) else (
    echo 🟢 Starting with Node.js Express backend...
    npm run dev-node
)

cd ..
echo.
echo 👋 Development environment stopped.
echo Thanks for developing PGY3-HUB! 🎯
pause
goto :eof

:help
echo.
echo Usage: dev-hotreload.bat [options]
echo.
echo Options:
echo   --node      Use Node.js backend instead of Python
echo   --test      Enable test mode with debug logging
echo   --port N    Set frontend port (default: 3000)
echo   --help      Show this help message
echo.
echo Examples:
echo   dev-hotreload.bat                    Start with Python backend
echo   dev-hotreload.bat --node             Start with Node.js backend
echo   dev-hotreload.bat --test             Start with test mode enabled
echo   dev-hotreload.bat --node --test      Start with Node.js backend and test mode
echo.
pause
goto :eof
