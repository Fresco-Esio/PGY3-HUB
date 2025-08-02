@echo off
title PGY3-HUB Build Testing
echo ========================================
echo PGY3-HUB v0.2.0 - Build Testing
echo ========================================
echo.

echo This script will test your build before distribution
echo.

echo [1/4] Testing React build...
cd frontend
if not exist "build" (
    echo ERROR: React build folder not found. Run build-windows.bat first.
    pause
    exit /b 1
)

if not exist "build\index.html" (
    echo ERROR: React build incomplete. Missing index.html.
    pause
    exit /b 1
)

echo SUCCESS: React build found and valid
echo.

echo [2/4] Testing backend dependencies...
cd ..\backend
python -c "import fastapi, uvicorn, pydantic" 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Backend dependencies not installed properly
    echo Run: pip install -r requirements.txt
    pause
    exit /b 1
)

echo SUCCESS: Backend dependencies installed
echo.

echo [3/4] Testing backend executable (if available)...
if exist "pgy3-hub-backend.exe" (
    echo SUCCESS: Backend executable found
    echo Size: 
    dir pgy3-hub-backend.exe | find ".exe"
) else (
    echo INFO: Backend executable not found, will use Python script
)
echo.

echo [4/4] Testing Electron build outputs...
cd ..\frontend
if exist "dist" (
    echo SUCCESS: Electron dist folder found
    echo.
    echo Build outputs:
    dir dist\*.exe 2>nul
    if %errorlevel% neq 0 (
        echo WARNING: No .exe files found in dist folder
    )
) else (
    echo ERROR: Electron dist folder not found
    echo Run build-windows.bat to create the build
    pause
    exit /b 1
)

echo.
echo ========================================
echo BUILD TEST COMPLETE
echo ========================================
echo.

echo Your build appears to be ready for testing!
echo.

echo Next steps:
echo 1. Test the .exe installer from frontend\dist\
echo 2. Ensure it runs on a clean Windows machine
echo 3. Verify both frontend and backend work offline
echo.

pause