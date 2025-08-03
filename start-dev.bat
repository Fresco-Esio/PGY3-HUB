@echo off
echo 🚀 Starting PGY3-HUB Development Environment...
echo =============================================
echo.
echo 🔥 HOT RELOAD ENABLED - Files will auto-refresh!
echo.
echo 🔗 Frontend: http://localhost:3000 (Hot Reload ⚡)
echo 🔗 Backend:  http://localhost:8001 (Auto-restart 🔄)
echo 🔗 API Docs: http://localhost:8001/docs
echo.
echo ⚡ Hot Reload Features:
echo   • Frontend: Auto-refresh on React/CSS/JS changes
echo   • Backend:  Auto-restart on Python file changes
echo   • API:      Live documentation updates
echo.
echo 🛠️  Quick Test URLs:
echo   • Mind Map: http://localhost:3000
echo   • API Test: http://localhost:8001/mindmap-data
echo   • Health:   http://localhost:8001/health
echo.
echo Press Ctrl+C to stop both servers
echo.

REM Set environment variables for enhanced development
set REACT_APP_DEV_MODE=true
set REACT_APP_HOT_RELOAD=true
set REACT_APP_BACKEND_URL=http://localhost:8001

cd frontend
echo 🐍 Starting Python FastAPI backend with auto-reload...
echo 🎯 Starting React frontend with hot reload...
npm run dev-python
