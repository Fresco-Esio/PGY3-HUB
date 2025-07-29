@echo off
echo Testing PGY3-HUB Electron Setup...
echo.

REM Change to frontend directory
cd /d "%~dp0frontend"

REM Check if Electron dependencies are installed
echo Checking Electron dependencies...
call npm list electron > nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Electron not installed. Run: npm install
    pause
    exit /b 1
)

call npm list electron-builder > nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: electron-builder not installed. Run: npm install
    pause
    exit /b 1
)

echo ✓ Electron dependencies found

REM Check if main files exist
echo.
echo Checking required files...

if not exist "public\electron.js" (
    echo ERROR: electron.js not found in public folder
    pause
    exit /b 1
)
echo ✓ electron.js found

if not exist "public\preload.js" (
    echo ERROR: preload.js not found in public folder
    pause
    exit /b 1
)
echo ✓ preload.js found

REM Check if build folder exists
if not exist "build" (
    echo WARNING: build folder not found. Run 'npm run build' first to test production mode.
) else (
    echo ✓ build folder found
)

REM Check package.json configuration
findstr /C:"electron.js" package.json > nul
if %errorlevel% neq 0 (
    echo ERROR: package.json not configured for Electron
    pause
    exit /b 1
)
echo ✓ package.json configured

echo.
echo ========================================
echo Setup Check Complete!
echo ========================================
echo.
echo To test in development mode:
echo   npm run electron-dev
echo.
echo To build for production:
echo   npm run build
echo   npm run electron
echo.
echo To create Windows installer:
echo   npm run build-win
echo.
pause
