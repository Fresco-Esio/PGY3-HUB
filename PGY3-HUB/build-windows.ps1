# PGY3-HUB Windows Build Script
Write-Host "Building PGY3-HUB for Windows..." -ForegroundColor Green

try {
    Write-Host "`n[1/4] Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    if ($LASTEXITCODE -ne 0) { throw "Failed to install frontend dependencies" }

    Write-Host "`n[2/4] Building React app..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Failed to build React app" }

    Write-Host "`n[3/4] Installing backend dependencies..." -ForegroundColor Yellow
    Set-Location ..\backend
    npm install
    if ($LASTEXITCODE -ne 0) { throw "Failed to install backend dependencies" }

    Write-Host "`n[4/4] Building Electron app..." -ForegroundColor Yellow
    Set-Location ..\frontend
    npm run electron-pack
    if ($LASTEXITCODE -ne 0) { throw "Failed to build Electron app" }

    Write-Host "`n✓ Build complete!" -ForegroundColor Green
    Write-Host "Check the frontend/dist folder for your .exe installer" -ForegroundColor Cyan
    
    Write-Host "`nFiles created:" -ForegroundColor Yellow
    Get-ChildItem dist\*.exe | Select-Object Name
    
} catch {
    Write-Host "`n❌ Build failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`nPress any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
