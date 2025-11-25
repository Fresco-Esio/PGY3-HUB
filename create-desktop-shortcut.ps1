# Create Desktop Shortcut for PGY3-HUB Development Server
# Run this script once to create a desktop icon

$WScriptShell = New-Object -ComObject WScript.Shell
$Desktop = [System.Environment]::GetFolderPath('Desktop')
$ShortcutPath = Join-Path $Desktop "PGY3-HUB Dev.lnk"

$Shortcut = $WScriptShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "D:\PGY3-HUB\start-full-dev-hotkey.bat"
$Shortcut.WorkingDirectory = "D:\PGY3-HUB"
$Shortcut.Description = "Start PGY3-HUB Development Server (Frontend + Backend)"
# Use Windows default "application" icon - colorful puzzle piece
$Shortcut.IconLocation = "%SystemRoot%\System32\imageres.dll,13"
$Shortcut.Save()

Write-Host "Desktop shortcut created successfully!" -ForegroundColor Green
Write-Host "Location: $ShortcutPath" -ForegroundColor Cyan
Write-Host "Double-click the PGY3-HUB Dev icon on your desktop to launch!" -ForegroundColor Yellow
