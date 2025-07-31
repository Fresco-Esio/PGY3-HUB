# PGY3-HUB Development Mode - PowerShell
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PGY3-HUB v0.2.0 - Development Mode" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nStarting development environment..." -ForegroundColor Green

try {
    Write-Host "`n[1/2] Starting backend server..." -ForegroundColor Yellow
    Set-Location backend
    Start-Process -FilePath "python" -ArgumentList "-m", "uvicorn", "server:app", "--reload", "--port", "8001" -WindowStyle Normal
    
    Write-Host "Waiting for backend to start..." -ForegroundColor Gray
    Start-Sleep -Seconds 3
    
    Write-Host "`n[2/2] Starting Electron development mode..." -ForegroundColor Yellow
    Set-Location ..\frontend
    
    Write-Host "This will start React dev server and open Electron with hot reload..." -ForegroundColor Cyan
    Write-Host "Press Ctrl+C in each window to stop the servers when done." -ForegroundColor Orange
    
    # Start Electron development mode
    npm run electron-dev
    
} catch {
    Write-Host "`n❌ Development mode failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Development session ended." -ForegroundColor Green
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")