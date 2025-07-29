# PGY3-HUB Desktop Build Script

Write-Host "Building PGY3-HUB Desktop Application..." -ForegroundColor Green
Write-Host ""

# Get script directory and change to frontend
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location "$scriptDir\frontend"

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies first..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to install dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Check if icon file exists
if (-not (Test-Path "public\icon.ico")) {
    Write-Host "WARNING: icon.ico not found in public/ folder" -ForegroundColor Yellow
    Write-Host "The app will use a default icon. Create icon.ico for custom branding." -ForegroundColor Yellow
    Write-Host ""
}

# Build React application
Write-Host "Building React application..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to build React app" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Package Electron app for Windows
Write-Host "Packaging Electron application for Windows..." -ForegroundColor Cyan
npm run build-win
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to package Electron app" -ForegroundColor Red
    Write-Host "Try installing Visual Studio Build Tools if you get native module errors" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "========================================"
Write-Host "Build Complete!" -ForegroundColor Green
Write-Host "========================================"
Write-Host ""

# Check output files
$distPath = "dist"
if (Test-Path $distPath) {
    Write-Host "Output files in: $((Get-Location).Path)\$distPath" -ForegroundColor Cyan
    Write-Host ""
    
    $setupFile = Get-ChildItem -Path $distPath -Name "*Setup*.exe" | Select-Object -First 1
    $portableFile = Get-ChildItem -Path $distPath -Name "*portable*.exe" | Select-Object -First 1
    
    if ($setupFile) {
        Write-Host "✓ Installer: $setupFile" -ForegroundColor Green
    }
    if ($portableFile) {
        Write-Host "✓ Portable: $portableFile" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "To install: Double-click the Setup.exe file" -ForegroundColor Yellow
    Write-Host "To use portable: Double-click the portable.exe file" -ForegroundColor Yellow
    
    # Ask if user wants to open dist folder
    Write-Host ""
    $openFolder = Read-Host "Open dist folder? (y/n)"
    if ($openFolder -eq "y" -or $openFolder -eq "Y") {
        Start-Process -FilePath "explorer.exe" -ArgumentList (Resolve-Path $distPath)
    }
} else {
    Write-Host "No dist folder found. Build may have failed." -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter to exit"
