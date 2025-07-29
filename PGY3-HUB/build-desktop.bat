@echo off
echo Building PGY3-HUB Desktop Application...
echo.

REM Change to frontend directory
cd /d "%~dp0frontend"

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies first...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Build React application
echo Building React application...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Failed to build React app
    pause
    exit /b 1
)

REM Package Electron app
echo Packaging Electron application for Windows...
call npm run build-win
if %errorlevel% neq 0 (
    echo ERROR: Failed to package Electron app
    pause
    exit /b 1
)

echo.
echo ========================================
echo Build Complete!
echo ========================================
echo.
echo Output files are in: frontend\dist\
echo.
echo Available files:
echo - PGY3-HUB Setup 0.1.0.exe (Installer)
echo - PGY3-HUB-0.1.0-portable.exe (Portable)
echo.
echo To install: Run the Setup.exe file
echo To use portable: Run the portable.exe file
echo.
pause
