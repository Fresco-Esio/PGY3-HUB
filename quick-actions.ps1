# PGY3-HUB Quick Actions PowerShell Script
# Provides common development actions and shortcuts
# Run with: .\quick-actions.ps1

param(
    [Parameter(Position=0)]
    [ValidateSet("start", "test", "build", "clean", "status", "logs", "reset", "help")]
    [string]$Action = "help",
    
    [switch]$Python,
    [switch]$Node,
    [switch]$Verbose
)

# Color configuration
$colors = @{
    Title = "Cyan"
    Success = "Green" 
    Warning = "Yellow"
    Error = "Red"
    Info = "White"
    Accent = "Magenta"
}

function Write-ColoredOutput {
    param($Text, $Color = "White")
    Write-Host $Text -ForegroundColor $colors[$Color]
}

function Show-Header {
    param($Title)
    Write-ColoredOutput "`n🎯 PGY3-HUB Quick Actions" "Title"
    Write-ColoredOutput "=========================" "Title"
    Write-ColoredOutput $Title "Info"
    Write-Host ""
}

function Test-Prerequisites {
    $missing = @()
    
    if (-not (Get-Command "node" -ErrorAction SilentlyContinue)) { $missing += "Node.js" }
    if (-not (Get-Command "npm" -ErrorAction SilentlyContinue)) { $missing += "npm" }
    if (-not (Get-Command "python" -ErrorAction SilentlyContinue)) { $missing += "Python" }
    
    if ($missing.Count -gt 0) {
        Write-ColoredOutput "❌ Missing: $($missing -join ', ')" "Error"
        return $false
    }
    return $true
}

function Get-ServiceStatus {
    $services = @{
        "Frontend" = @{ Port = 3000; URL = "http://localhost:3000" }
        "Backend" = @{ Port = 8001; URL = "http://localhost:8001/health" }
    }
    
    Write-ColoredOutput "🔍 Service Status:" "Info"
    
    foreach ($service in $services.Keys) {
        $port = $services[$service].Port
        $url = $services[$service].URL
        
        $portActive = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($portActive) {
            try {
                $response = Invoke-WebRequest -Uri $url -TimeoutSec 3 -UseBasicParsing
                Write-ColoredOutput "  ✅ $service (Port $port) - Running" "Success"
            }
            catch {
                Write-ColoredOutput "  ⚠️  $service (Port $port) - Port busy but not responding" "Warning"
            }
        }
        else {
            Write-ColoredOutput "  ❌ $service (Port $port) - Not running" "Error"
        }
    }
}

function Start-Development {
    Show-Header "Starting Development Environment"
    
    if (-not (Test-Prerequisites)) {
        return
    }
    
    if ($Python -or (-not $Node)) {
        Write-ColoredOutput "🐍 Starting with Python backend..." "Info"
        & "$PSScriptRoot\dev-hotreload.ps1" -Backend "python" -TestMode:$Verbose
    }
    elseif ($Node) {
        Write-ColoredOutput "🟢 Starting with Node.js backend..." "Info"
        & "$PSScriptRoot\dev-hotreload.ps1" -Backend "node" -TestMode:$Verbose
    }
}

function Start-Testing {
    Show-Header "Running Tests"
    
    Write-ColoredOutput "🧪 Available Test Options:" "Info"
    Write-ColoredOutput "  1. Unit Tests (Frontend)" "Info"
    Write-ColoredOutput "  2. API Tests (Backend)" "Info"
    Write-ColoredOutput "  3. Integration Tests" "Info"
    Write-ColoredOutput "  4. End-to-End Tests" "Info"
    Write-ColoredOutput "  5. Performance Tests" "Info"
    
    $choice = Read-Host "`nSelect test type (1-5)"
    
    switch ($choice) {
        "1" {
            Write-ColoredOutput "Running frontend tests..." "Info"
            Set-Location frontend
            npm test
            Set-Location ..
        }
        "2" {
            Write-ColoredOutput "Running API tests..." "Info"
            if ($Python) {
                python -m pytest backend/tests/ -v
            } else {
                Set-Location backend
                npm test
                Set-Location ..
            }
        }
        "3" {
            Write-ColoredOutput "Running integration tests..." "Info"
            python comprehensive_backend_test.py
        }
        "4" {
            Write-ColoredOutput "E2E tests not implemented yet" "Warning"
        }
        "5" {
            Write-ColoredOutput "Performance tests not implemented yet" "Warning"
        }
        default {
            Write-ColoredOutput "Invalid choice" "Error"
        }
    }
}

function Start-Build {
    Show-Header "Building Application"
    
    Write-ColoredOutput "📦 Building frontend..." "Info"
    Set-Location frontend
    npm run build
    $frontendSuccess = $LASTEXITCODE -eq 0
    Set-Location ..
    
    if ($frontendSuccess) {
        Write-ColoredOutput "✅ Frontend build successful!" "Success"
        Write-ColoredOutput "📁 Build files in: frontend/build/" "Info"
    } else {
        Write-ColoredOutput "❌ Frontend build failed!" "Error"
    }
}

function Clear-Development {
    Show-Header "Cleaning Development Environment"
    
    Write-ColoredOutput "🧹 Cleaning up..." "Info"
    
    # Stop processes
    $processes = Get-NetTCPConnection -LocalPort 3000, 8000, 8001 -ErrorAction SilentlyContinue | 
                 ForEach-Object { Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue }
    
    if ($processes) {
        Write-ColoredOutput "🛑 Stopping running services..." "Warning"
        $processes | Stop-Process -Force -ErrorAction SilentlyContinue
    }
    
    # Clean build artifacts
    if (Test-Path "frontend/build") {
        Write-ColoredOutput "🗑️  Removing build directory..." "Info"
        Remove-Item "frontend/build" -Recurse -Force
    }
    
    # Clean node_modules if requested
    $cleanModules = Read-Host "Remove node_modules? (y/N)"
    if ($cleanModules -eq "y" -or $cleanModules -eq "Y") {
        if (Test-Path "frontend/node_modules") {
            Write-ColoredOutput "🗑️  Removing frontend node_modules..." "Info"
            Remove-Item "frontend/node_modules" -Recurse -Force
        }
        if (Test-Path "backend/node_modules") {
            Write-ColoredOutput "🗑️  Removing backend node_modules..." "Info"
            Remove-Item "backend/node_modules" -Recurse -Force
        }
    }
    
    Write-ColoredOutput "✅ Cleanup complete!" "Success"
}

function Show-Logs {
    Show-Header "Development Logs"
    
    Write-ColoredOutput "📋 Available Logs:" "Info"
    Write-ColoredOutput "  1. Current terminal output" "Info"
    Write-ColoredOutput "  2. Browser console (manual)" "Info"
    Write-ColoredOutput "  3. Backend logs" "Info"
    Write-ColoredOutput "  4. npm debug logs" "Info"
    
    $choice = Read-Host "`nSelect log type (1-4)"
    
    switch ($choice) {
        "1" {
            Write-ColoredOutput "Current session output shown above" "Info"
        }
        "2" {
            Write-ColoredOutput "Open browser and press F12 to view console" "Info"
            Start-Process "http://localhost:3000"
        }
        "3" {
            if (Test-Path "backend/logs") {
                Get-Content "backend/logs/*.log" -Tail 50
            } else {
                Write-ColoredOutput "No backend log files found" "Warning"
            }
        }
        "4" {
            if (Test-Path "frontend/npm-debug.log") {
                Get-Content "frontend/npm-debug.log" -Tail 20
            } else {
                Write-ColoredOutput "No npm debug logs found" "Info"
            }
        }
    }
}

function Reset-Development {
    Show-Header "Resetting Development Environment"
    
    Write-ColoredOutput "⚠️  This will:" "Warning"
    Write-ColoredOutput "  • Stop all services" "Warning"
    Write-ColoredOutput "  • Clean build artifacts" "Warning"
    Write-ColoredOutput "  • Reinstall dependencies" "Warning"
    Write-ColoredOutput "  • Reset configuration" "Warning"
    
    $confirm = Read-Host "`nContinue? (y/N)"
    if ($confirm -ne "y" -and $confirm -ne "Y") {
        Write-ColoredOutput "Reset cancelled" "Info"
        return
    }
    
    Clear-Development
    
    Write-ColoredOutput "📦 Reinstalling dependencies..." "Info"
    Set-Location frontend
    npm install
    Set-Location ..
    
    if ($Python) {
        Set-Location backend
        pip install -r requirements.txt
        Set-Location ..
    } else {
        Set-Location backend
        npm install
        Set-Location ..
    }
    
    Write-ColoredOutput "✅ Reset complete!" "Success"
}

function Show-Help {
    Show-Header "Available Actions"
    
    Write-ColoredOutput "Usage: .\quick-actions.ps1 [action] [options]" "Info"
    Write-Host ""
    Write-ColoredOutput "Actions:" "Info"
    Write-ColoredOutput "  start   - Start development environment" "Info"
    Write-ColoredOutput "  test    - Run tests" "Info"
    Write-ColoredOutput "  build   - Build application" "Info"
    Write-ColoredOutput "  clean   - Clean up development environment" "Info"
    Write-ColoredOutput "  status  - Show service status" "Info"
    Write-ColoredOutput "  logs    - View logs" "Info"
    Write-ColoredOutput "  reset   - Reset everything" "Info"
    Write-ColoredOutput "  help    - Show this help" "Info"
    Write-Host ""
    Write-ColoredOutput "Options:" "Info"
    Write-ColoredOutput "  -Python   - Use Python backend" "Info"
    Write-ColoredOutput "  -Node     - Use Node.js backend" "Info"
    Write-ColoredOutput "  -Verbose  - Enable verbose output" "Info"
    Write-Host ""
    Write-ColoredOutput "Examples:" "Accent"
    Write-ColoredOutput "  .\quick-actions.ps1 start -Python" "Info"
    Write-ColoredOutput "  .\quick-actions.ps1 test -Verbose" "Info"
    Write-ColoredOutput "  .\quick-actions.ps1 status" "Info"
}

# Main execution
switch ($Action.ToLower()) {
    "start" { Start-Development }
    "test" { Start-Testing }
    "build" { Start-Build }
    "clean" { Clear-Development }
    "status" { 
        Show-Header "Service Status"
        Get-ServiceStatus 
    }
    "logs" { Show-Logs }
    "reset" { Reset-Development }
    "help" { Show-Help }
    default { Show-Help }
}
