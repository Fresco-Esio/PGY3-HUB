# PGY3-HUB Development Server Startup Script

Write-Host "Starting PGY3-HUB Development Environment..." -ForegroundColor Green
Write-Host ""

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Check if dependencies are installed
Write-Host "Checking if dependencies are installed..." -ForegroundColor Yellow

# Check frontend node_modules
if (-not (Test-Path "$scriptDir\frontend\node_modules")) {
    Write-Host "Frontend dependencies not found. Please run install_dependencies.ps1 first." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check backend requirements
Set-Location "$scriptDir\backend"
$pythonCheck = python -c "import fastapi, uvicorn" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend dependencies not found. Please run install_dependencies.ps1 first." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Dependencies found!" -ForegroundColor Green
Write-Host ""

# Navigate to frontend and start development
Write-Host "Starting development servers..." -ForegroundColor Cyan
Write-Host "This will start both backend (Python FastAPI) and frontend (React)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Access the application at: http://localhost:3000" -ForegroundColor Green
Write-Host "API documentation at: http://localhost:8001/docs" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the servers" -ForegroundColor Yellow
Write-Host ""

Set-Location "$scriptDir\frontend"
npm run dev
