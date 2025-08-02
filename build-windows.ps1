# PGY3-HUB Windows Build Script v0.2.0
Write-Host "Building PGY3-HUB v0.2.0 for Windows..." -ForegroundColor Green

try {
    Write-Host "`n[1/6] Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    if ($LASTEXITCODE -ne 0) { throw "Failed to install frontend dependencies" }

    Write-Host "`n[2/6] Building React app..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Failed to build React app" }

    Write-Host "`n[3/6] Installing backend dependencies..." -ForegroundColor Yellow
    Set-Location ..\backend
    pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) { throw "Failed to install backend dependencies" }

    Write-Host "`n[4/6] Installing PyInstaller..." -ForegroundColor Yellow
    pip install pyinstaller
    if ($LASTEXITCODE -ne 0) { throw "Failed to install PyInstaller" }

    Write-Host "`n[5/6] Building Python backend executable..." -ForegroundColor Yellow
    pyinstaller pgy3-hub-backend.spec --clean --noconfirm
    if ($LASTEXITCODE -ne 0) { 
        Write-Host "PyInstaller failed, continuing with Python script fallback..." -ForegroundColor Orange
    } else {
        Write-Host "[OK] Backend executable created successfully" -ForegroundColor Green
        # Copy executable to resources
        if (Test-Path "dist\pgy3-hub-backend.exe") {
            Copy-Item "dist\pgy3-hub-backend.exe" "pgy3-hub-backend.exe" -Force
            Write-Host "[OK] Backend executable ready for packaging" -ForegroundColor Green
        }
    }

    Write-Host "`n[6/6] Building Electron app..." -ForegroundColor Yellow
    Set-Location ..\frontend
    npm run electron-pack
    if ($LASTEXITCODE -ne 0) { throw "Failed to build Electron app" }

    Write-Host "`n[BUILD COMPLETE] Build complete!" -ForegroundColor Green
    Write-Host "Check the frontend/dist folder for your .exe installer" -ForegroundColor Cyan
    
    Write-Host "`nFiles created:" -ForegroundColor Yellow
    if (Test-Path "dist") {
        Get-ChildItem dist\*.exe | Select-Object Name, @{Name="Size MB";Expression={[math]::Round($_.Length/1MB,2)}}
    }
    
} catch {
    Write-Host "`n[X] Build failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n[READY] Ready for testing!" -ForegroundColor Cyan
Write-Host "Your standalone Windows .exe files are in frontend/dist/" -ForegroundColor Cyan
Write-Host "`nPress any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
