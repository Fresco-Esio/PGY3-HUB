@echo off
REM One-Click PGY3-HUB Development Launcher
REM Place this file anywhere and double-click to start development

echo 🎯 PGY3-HUB One-Click Launcher
echo ===========================
echo.

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0

REM Check if we're in the right directory
if not exist "%SCRIPT_DIR%frontend" (
    echo Looking for PGY3-HUB project...
    
    REM Try common locations
    if exist "C:\PGY3-HUB\frontend" (
        cd /d "C:\PGY3-HUB"
        goto found
    )
    if exist "%USERPROFILE%\PGY3-HUB\frontend" (
        cd /d "%USERPROFILE%\PGY3-HUB"
        goto found
    )
    if exist "%USERPROFILE%\Documents\PGY3-HUB\frontend" (
        cd /d "%USERPROFILE%\Documents\PGY3-HUB"
        goto found
    )
    if exist "%USERPROFILE%\Desktop\PGY3-HUB\frontend" (
        cd /d "%USERPROFILE%\Desktop\PGY3-HUB"
        goto found
    )
    
    REM Ask user for location
    echo ❌ PGY3-HUB project not found in common locations.
    echo.
    echo Please drag and drop the PGY3-HUB folder onto this window and press Enter:
    set /p project_path=""
    
    REM Remove quotes if present
    set project_path=%project_path:"=%
    
    if exist "%project_path%\frontend" (
        cd /d "%project_path%"
        goto found
    ) else (
        echo ❌ Invalid project directory!
        pause
        exit /b 1
    )
)

:found
echo ✅ Found PGY3-HUB project at: %CD%
echo.

REM Launch the hot reload development environment
echo 🚀 Starting hot reload development environment...
echo.
call dev-hotreload.bat

echo.
echo 👋 Development session ended.
pause
