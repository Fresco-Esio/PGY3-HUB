# PGY3-HUB Release Build Script
param(
    [string]$Version = $null
)

Write-Host "=== PGY3-HUB Release Builder ===" -ForegroundColor Green

# Navigate to frontend
Set-Location "frontend"

# Update version if provided
if ($Version) {
    Write-Host "Updating version to $Version..." -ForegroundColor Yellow
    npm version $Version --no-git-tag-version
}

# Get current version
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$currentVersion = $packageJson.version
Write-Host "Building version: $currentVersion" -ForegroundColor Cyan

# Clean previous builds
Write-Host "Cleaning previous builds..." -ForegroundColor Yellow
npm run clean

# Build the application
Write-Host "Building React application..." -ForegroundColor Yellow
npm run build

Write-Host "Creating Windows executable..." -ForegroundColor Yellow
npx electron-builder --dir

# Create ZIP with version
$zipName = "PGY3-HUB-v$currentVersion-win64-portable.zip"
Write-Host "Creating portable ZIP: $zipName" -ForegroundColor Yellow
Compress-Archive -Path ".\dist\win-unpacked\*" -DestinationPath ".\dist\$zipName" -Force

Write-Host "=== Build Complete! ===" -ForegroundColor Green
Write-Host "Executable: .\dist\win-unpacked\PGY3-HUB.exe" -ForegroundColor White
Write-Host "Portable ZIP: .\dist\$zipName" -ForegroundColor White

# Go back to root
Set-Location ".."
