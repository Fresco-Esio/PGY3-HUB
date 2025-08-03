# PGY3-HUB Development with Hot Reload
# Enhanced development script with hot reload capabilities and testing shortcuts
# Run with: .\dev-hotreload.ps1

param(
    [string]$Backend = "python",  # python or node
    [switch]$TestMode,            # Enable test mode with additional logging
    [switch]$NoOpen,              # Don't auto-open browser
    [string]$Port = "3000"        # Frontend port
)

Write-Host "🔥 PGY3-HUB Hot Reload Development Environment" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Function to check if command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Function to check if port is available
function Test-Port($port) {
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $port)
        $connection.Close()
        return $false  # Port is in use
    }
    catch {
        return $true   # Port is available
    }
}

# Function to kill processes on specific ports
function Stop-ProcessOnPort($port) {
    $processes = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | ForEach-Object { Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue }
    if ($processes) {
        Write-Host "🔄 Stopping existing processes on port $port..." -ForegroundColor Yellow
        $processes | Stop-Process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
}

# Check prerequisites
Write-Host "`n📋 Checking prerequisites..." -ForegroundColor Yellow

$missingTools = @()

if (-not (Test-Command "node")) { $missingTools += "Node.js" }
if (-not (Test-Command "npm")) { $missingTools += "npm" }

if ($Backend -eq "python") {
    if (-not (Test-Command "python")) { $missingTools += "Python" }
    if (-not (Test-Command "pip")) { $missingTools += "pip" }
}

if ($missingTools.Count -gt 0) {
    Write-Host "❌ Missing required tools: $($missingTools -join ', ')" -ForegroundColor Red
    Write-Host "Please install the missing tools and try again." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ All prerequisites met!" -ForegroundColor Green

# Clean up any existing processes
Write-Host "`n🧹 Cleaning up existing processes..." -ForegroundColor Yellow
Stop-ProcessOnPort 3000  # Frontend
Stop-ProcessOnPort 8000  # Backend Python default
Stop-ProcessOnPort 8001  # Backend Python alternate

# Determine backend configuration
$backendPort = if ($Backend -eq "python") { "8001" } else { "8000" }
$backendCommand = if ($Backend -eq "python") { 
    "cd backend; python -m uvicorn server:app --reload --port $backendPort --host 0.0.0.0"
} else { 
    "cd backend; node server.js"
}

Write-Host "`n🔧 Configuration:" -ForegroundColor Cyan
Write-Host "  Backend: $Backend (port $backendPort)" -ForegroundColor White
Write-Host "  Frontend: React with Hot Reload (port $Port)" -ForegroundColor White
Write-Host "  Test Mode: $($TestMode.IsPresent)" -ForegroundColor White

# Check if directories exist
if (-not (Test-Path "frontend")) {
    Write-Host "❌ Frontend directory not found!" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "backend")) {
    Write-Host "❌ Backend directory not found!" -ForegroundColor Red
    exit 1
}

# Install dependencies if needed
Write-Host "`n📦 Checking dependencies..." -ForegroundColor Yellow

# Check frontend dependencies
if (-not (Test-Path "frontend/node_modules")) {
    Write-Host "🔄 Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install frontend dependencies!" -ForegroundColor Red
        exit 1
    }
    Set-Location ..
}

# Check backend dependencies
if ($Backend -eq "python") {
    Set-Location backend
    $pipList = pip list
    $requiredPackages = @("fastapi", "uvicorn", "pydantic")
    $missingPackages = @()
    
    foreach ($package in $requiredPackages) {
        if (-not ($pipList -match $package)) {
            $missingPackages += $package
        }
    }
    
    if ($missingPackages.Count -gt 0) {
        Write-Host "🔄 Installing backend dependencies: $($missingPackages -join ', ')..." -ForegroundColor Yellow
        pip install -r requirements.txt
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Failed to install backend dependencies!" -ForegroundColor Red
            Set-Location ..
            exit 1
        }
    }
    Set-Location ..
} else {
    if (-not (Test-Path "backend/node_modules")) {
        Write-Host "🔄 Installing backend dependencies..." -ForegroundColor Yellow
        Set-Location backend
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Failed to install backend dependencies!" -ForegroundColor Red
            Set-Location ..
            exit 1
        }
        Set-Location ..
    }
}

Write-Host "✅ Dependencies ready!" -ForegroundColor Green

# Create enhanced environment variables for development
$env:REACT_APP_BACKEND_URL = "http://localhost:$backendPort"
$env:REACT_APP_DEV_MODE = "true"
$env:REACT_APP_HOT_RELOAD = "true"

if ($TestMode) {
    $env:REACT_APP_TEST_MODE = "true"
    $env:REACT_APP_LOG_LEVEL = "debug"
}

# Display helpful information
Write-Host "`n🚀 Starting development servers..." -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "🔗 Frontend: http://localhost:$Port" -ForegroundColor Cyan
Write-Host "🔗 Backend:  http://localhost:$backendPort" -ForegroundColor Cyan
Write-Host "🔗 API Docs: http://localhost:$backendPort/docs" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "`n⚡ Hot Reload Features:" -ForegroundColor Yellow
Write-Host "  • Frontend: Auto-refresh on file changes" -ForegroundColor White
Write-Host "  • Backend:  Auto-restart on file changes" -ForegroundColor White
Write-Host "  • API:      Live documentation updates" -ForegroundColor White
Write-Host "`n🛠️  Development Shortcuts:" -ForegroundColor Yellow
Write-Host "  • Ctrl+C:   Stop all servers" -ForegroundColor White
Write-Host "  • Ctrl+R:   Refresh browser (in frontend)" -ForegroundColor White
Write-Host "  • F12:      Open developer tools" -ForegroundColor White
Write-Host "`n📝 Testing URLs:" -ForegroundColor Yellow
Write-Host "  • Mind Map: http://localhost:$Port" -ForegroundColor White
Write-Host "  • API Test: http://localhost:$backendPort/mindmap-data" -ForegroundColor White
Write-Host "  • Health:   http://localhost:$backendPort/health" -ForegroundColor White

if ($TestMode) {
    Write-Host "`n🧪 Test Mode Enabled:" -ForegroundColor Magenta
    Write-Host "  • Debug logging active" -ForegroundColor White
    Write-Host "  • Extended error messages" -ForegroundColor White
    Write-Host "  • Performance monitoring" -ForegroundColor White
}

Write-Host "`nPress Ctrl+C to stop all servers`n" -ForegroundColor Red

# Start the development environment
try {
    Set-Location frontend
    
    # Start both frontend and backend with concurrently
    if ($Backend -eq "python") {
        Write-Host "🐍 Starting with Python FastAPI backend..." -ForegroundColor Green
        npm run dev-python
    } else {
        Write-Host "🟢 Starting with Node.js Express backend..." -ForegroundColor Green
        npm run dev-node
    }
}
catch {
    Write-Host "`n❌ Error starting development environment: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Cleaning up..." -ForegroundColor Yellow
    
    # Cleanup on error
    Stop-ProcessOnPort 3000
    Stop-ProcessOnPort $backendPort
    
    Set-Location ..
    exit 1
}
finally {
    # Always return to root directory
    Set-Location ..
}

Write-Host "`n👋 Development environment stopped." -ForegroundColor Yellow
Write-Host "Thanks for developing PGY3-HUB! 🎯" -ForegroundColor Cyan
