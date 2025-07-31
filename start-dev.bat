@echo off
echo 🚀 Starting PGY3-HUB Development Environment...
echo =============================================
echo.
echo Starting Python FastAPI backend on http://localhost:8001
echo Starting React frontend on http://localhost:3000
echo.
echo Press Ctrl+C to stop both servers
echo.

cd frontend
npm run dev-python
