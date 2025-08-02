# Moved Files Summary

This folder contains files that were moved from the main project structure for review and potential deletion.

## Files Moved by Category:

### Frontend Documentation (`frontend-docs/`)
- `README.md` - Redundant frontend README (main README.md covers the project)
- `# Code Citations.md` - Code citations documentation from components folder

### Temporary Files (`temp-files/`)
- `App.js.bak` - Backup file from frontend/src/
- `temp_edge_label_modal.js` - Temporary component file from frontend/src/

### Placeholder Files (`placeholder-files/`)
- `icon-placeholder.md` - Icon placeholder from frontend/public/
- `icon-placeholder-build.md` - Icon placeholder from frontend/build/ (renamed to avoid conflict)

### GitHub Chat Configurations (`github-chat-configs/`)
- `chatmodes/` - Complete folder containing PGY-3 HUB CONTEXT.chatmode.md

### Build Scripts (`build-scripts/`)
- `build-windows-fixed.ps1` - Fixed version of build script (original now working)
- `test-syntax.ps1` - PowerShell syntax testing script
- `test-build.bat` - Test build batch file

### Backend Duplicates (`backend-duplicates/`)
- `mindmap-data.json` - Smaller duplicate of mindmap_data.json (108 bytes vs 9642 bytes)

## Files Kept in Main Structure:

### Essential Documentation
- `README.md` - Main project documentation
- `QUICK_START.md` - Quick start guide
- `WINDOWS_DESKTOP_BUILD_GUIDE.md` - Build guide for Windows

### Active Build Scripts
- `build-windows.ps1` - Main Windows build script (now working)
- `build-windows.bat` - Windows batch build script
- `start-dev.ps1` - Development start script
- `start-dev.bat` - Development start batch script

### GitHub Configuration
- `.github/copilot-instructions.md` - Copilot instructions (kept as it's active configuration)

## Review Instructions:
1. Review each category to confirm files are no longer needed
2. Delete entire trash folder when confident all files are unnecessary
3. Consider keeping WINDOWS_DESKTOP_BUILD_GUIDE.md if it contains unique build information
