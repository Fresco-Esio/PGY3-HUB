@echo off
echo Building PGY3-HUB for Windows...

echo.
echo [1/4] Installing dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo Failed to install frontend dependencies
    pause
    exit /b 1
)

echo.
echo [2/4] Building React app...
call npm run build
if %errorlevel% neq 0 (
    echo Failed to build React app
    pause
    exit /b 1
)

echo.
echo [3/4] Installing backend dependencies...
cd ..\backend
call npm install
if %errorlevel% neq 0 (
    echo Failed to install backend dependencies
    pause
    exit /b 1
)

echo.
echo [4/4] Building Electron app...
cd ..\frontend
call npm run electron-pack
if %errorlevel% neq 0 (
    echo Failed to build Electron app
    pause
    exit /b 1
)

echo.
echo ✓ Build complete! Check the frontend/dist folder for your .exe installer
echo.
echo Files created:
dir dist\*.exe /b 2>nul
pause
