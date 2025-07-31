# PGY3-HUB Quick Start PowerShell Script
# Run with: .\quick-start.ps1

Write-Host "🚀 PGY3-HUB Quick Start" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan

# Function to check if command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Check prerequisites
Write-Host "`n📋 Checking prerequisites..." -ForegroundColor Yellow

if (-not (Test-Command "node")) {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

if (-not (Test-Command "npm")) {
    Write-Host "❌ npm is not installed. Please install npm first." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

if (-not (Test-Command "python")) {
    Write-Host "❌ Python is not installed. Please install Python first." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ All prerequisites found!" -ForegroundColor Green

# Choose backend type
Write-Host "`n🔧 Choose your backend:" -ForegroundColor Yellow
Write-Host "1) Python FastAPI (Recommended)" -ForegroundColor White
Write-Host "2) Node.js Express" -ForegroundColor White
$backendChoice = Read-Host "Enter choice (1 or 2)"

# Install frontend dependencies if needed
Write-Host "`n📦 Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location "frontend"

if (-not (Test-Path "node_modules")) {
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    Write-Host "✅ Frontend dependencies already installed" -ForegroundColor Green
}

# Install backend dependencies based on choice
Set-Location "..\backend"

if ($backendChoice -eq "1") {
    Write-Host "`n🐍 Setting up Python FastAPI backend..." -ForegroundColor Yellow
    
    if (-not (Test-Path "venv")) {
        Write-Host "Creating Python virtual environment..." -ForegroundColor Cyan
        python -m venv venv
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Failed to create virtual environment" -ForegroundColor Red
            Read-Host "Press Enter to exit"
            exit 1
        }
    }
    
    # Activate virtual environment and install dependencies
    Write-Host "Installing Python dependencies..." -ForegroundColor Cyan
    & "venv\Scripts\Activate.ps1"
    pip install -r requirements.txt
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install Python dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    
    Write-Host "`n🎉 Setup complete! Starting servers..." -ForegroundColor Green
    Write-Host "Backend: http://localhost:8001" -ForegroundColor Cyan
    Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "`nPress Ctrl+C to stop both servers" -ForegroundColor Yellow
    Write-Host ""
    
    # Start both servers
    Set-Location "..\frontend"
    npm run dev-python
    
} elseif ($backendChoice -eq "2") {
    Write-Host "`n📦 Setting up Node.js Express backend..." -ForegroundColor Yellow
    
    if (-not (Test-Path "node_modules")) {
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
            Read-Host "Press Enter to exit"
            exit 1
        }
    } else {
        Write-Host "✅ Backend dependencies already installed" -ForegroundColor Green
    }
    
    Write-Host "`n🎉 Setup complete! Starting servers..." -ForegroundColor Green
    Write-Host "Backend: http://localhost:8000" -ForegroundColor Cyan
    Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "`nPress Ctrl+C to stop both servers" -ForegroundColor Yellow
    Write-Host ""
    
    # Start both servers
    Set-Location "..\frontend"
    npm run dev-node
    
} else {
    Write-Host "❌ Invalid choice. Please run the script again." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
