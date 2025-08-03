@echo off
REM Quick Test Runner for PGY3-HUB
REM Runs common test scenarios with hot reload

echo 🧪 PGY3-HUB Quick Test Runner
echo ============================
echo.

REM Menu for test options
echo Choose a test scenario:
echo.
echo 1. Full Development Environment (Python + React)
echo 2. Backend Only Test (Python FastAPI)
echo 3. Frontend Only Test (React)
echo 4. API Endpoint Tests
echo 5. Hot Reload Test Mode
echo 6. Node.js Backend Test
echo 7. Quick Health Check
echo 8. Custom Test
echo.

set /p choice="Enter your choice (1-8): "

if "%choice%"=="1" goto full_dev
if "%choice%"=="2" goto backend_only
if "%choice%"=="3" goto frontend_only
if "%choice%"=="4" goto api_tests
if "%choice%"=="5" goto hot_reload_test
if "%choice%"=="6" goto node_backend
if "%choice%"=="7" goto health_check
if "%choice%"=="8" goto custom_test
goto invalid

:full_dev
echo.
echo 🚀 Starting Full Development Environment...
echo This will start both Python backend and React frontend with hot reload
pause
call dev-hotreload.bat
goto end

:backend_only
echo.
echo 🐍 Starting Backend Only...
cd backend
echo Starting Python FastAPI server on http://localhost:8001
python -m uvicorn server:app --reload --port 8001
cd ..
goto end

:frontend_only
echo.
echo ⚛️ Starting Frontend Only...
echo Make sure backend is running on port 8001!
cd frontend
npm start
cd ..
goto end

:api_tests
echo.
echo 🔗 Testing API Endpoints...
echo.
echo Testing backend connectivity...
curl -f http://localhost:8001/health 2>nul
if %errorlevel% equ 0 (
    echo ✅ Backend is running!
    echo.
    echo Testing API endpoints:
    echo 📊 GET /mindmap-data
    curl -s http://localhost:8001/mindmap-data
    echo.
    echo 📋 GET /docs
    echo API docs available at: http://localhost:8001/docs
) else (
    echo ❌ Backend not running! Start it first with option 2.
)
pause
goto menu

:hot_reload_test
echo.
echo ⚡ Starting Hot Reload Test Mode...
echo This enables debug logging and test features
call dev-hotreload.bat --test
goto end

:node_backend
echo.
echo 🟢 Starting with Node.js Backend...
call dev-hotreload.bat --node
goto end

:health_check
echo.
echo 🏥 Quick Health Check...
echo.
echo Checking if services are running:
echo.

echo Frontend (port 3000):
netstat -an | find "3000" >nul
if %errorlevel% equ 0 (
    echo ✅ Frontend is running on http://localhost:3000
) else (
    echo ❌ Frontend not running
)

echo.
echo Backend (port 8001):
netstat -an | find "8001" >nul
if %errorlevel% equ 0 (
    echo ✅ Backend is running on http://localhost:8001
) else (
    echo ❌ Backend not running
)

echo.
echo Testing HTTP connections:
curl -f -m 5 http://localhost:3000 2>nul >nul
if %errorlevel% equ 0 (
    echo ✅ Frontend HTTP OK
) else (
    echo ❌ Frontend HTTP failed
)

curl -f -m 5 http://localhost:8001/health 2>nul >nul
if %errorlevel% equ 0 (
    echo ✅ Backend HTTP OK
) else (
    echo ❌ Backend HTTP failed
)

echo.
pause
goto menu

:custom_test
echo.
echo 🛠️ Custom Test Options:
echo.
echo 1. Test with specific port
echo 2. Test with different backend
echo 3. Test with custom environment
echo.
set /p custom="Choose custom option (1-3): "

if "%custom%"=="1" (
    set /p port="Enter frontend port (default 3000): "
    if "%port%"=="" set port=3000
    call dev-hotreload.bat --port %port%
) else if "%custom%"=="2" (
    echo Choose backend: python or node
    set /p backend="Backend type: "
    call dev-hotreload.bat --backend %backend%
) else if "%custom%"=="3" (
    set /p env="Enter environment variables (e.g., REACT_APP_DEBUG=true): "
    set %env%
    call dev-hotreload.bat
)
goto end

:invalid
echo.
echo ❌ Invalid choice! Please select 1-8.
echo.
goto menu

:menu
echo.
echo Return to menu? (y/n)
set /p return="Choice: "
if /i "%return%"=="y" goto start
if /i "%return%"=="yes" goto start

:end
echo.
echo 👋 Thanks for testing PGY3-HUB!
pause

:start
cls
goto begin

:begin
goto :eof
