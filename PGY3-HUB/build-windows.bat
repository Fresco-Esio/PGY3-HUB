@echo off
echo Building PGY3-HUB v0.2.0 for Windows...
echo.

echo [1/6] Installing frontend dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)

echo.
echo [2/6] Building React app...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Failed to build React app
    pause
    exit /b 1
)

echo.
echo [3/6] Installing backend dependencies...
cd ..\backend
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)

echo.
echo [4/6] Installing PyInstaller...
pip install pyinstaller
if %errorlevel% neq 0 (
    echo ERROR: Failed to install PyInstaller
    pause
    exit /b 1
)

echo.
echo [5/6] Building Python backend executable...
pyinstaller pgy3-hub-backend.spec --clean --noconfirm
if %errorlevel% neq 0 (
    echo WARNING: PyInstaller failed, continuing with Python script fallback...
) else (
    echo SUCCESS: Backend executable created
    if exist "dist\pgy3-hub-backend.exe" (
        copy "dist\pgy3-hub-backend.exe" "pgy3-hub-backend.exe" /Y
        echo SUCCESS: Backend executable ready for packaging
    )
)

echo.
echo [6/6] Building Electron app...
cd ..\frontend
call npm run electron-pack
if %errorlevel% neq 0 (
    echo ERROR: Failed to build Electron app
    pause
    exit /b 1
)

echo.
echo ================================
echo BUILD COMPLETE!
echo ================================
echo Check the frontend\dist folder for your .exe files
echo.

if exist "dist" (
    echo Created files:
    dir dist\*.exe /B
)

echo.
echo Ready for testing! Your standalone Windows .exe files are ready.
pause
