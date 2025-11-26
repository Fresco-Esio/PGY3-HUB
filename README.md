# PGY3-HUB - Mind Mapping Tool for Psychiatry Residents

**Version:** v0.7.3 - Realignment Stability Fix  
**Last Updated:** November 25, 2025

A visual thinking tool for organizing psychiatric knowledge through interactive mind maps. Connect theory (Topics) to practice (Cases) to research (Literature) in a calm, focused digital studio.

## ✨ Latest Updates (v0.7.3)

**Bug Fixes:**
- Fixed re-render and flicker issues during realignment
- Eliminated D3Graph re-initialization after node repositioning
- Removed React state updates from D3 simulation callbacks
- Improved toast notification accuracy
- Cleaned up duplicate code blocks

**See VERSION.md for complete changelog**

---

## 🚀 Quick Build for Windows Desktop App

Create a standalone Windows .exe that runs anywhere!

### Build Commands
```powershell
# PowerShell (recommended)
.\build-windows.ps1

# Or Command Prompt
build-windows.bat
```

### What You Get
- **PGY3-HUB-Setup-0.7.3.exe** - Full installer with shortcuts
- **PGY3-HUB-0.7.3-portable.exe** - Portable version for external drives

### Development Mode
```powershell
.\start-dev.ps1   # Hot reload development
```

## 📁 Project Structure
```
├── frontend/           # React + Electron app
├── backend/           # Python FastAPI backend  
├── build-windows.*    # Build scripts
├── start-dev.*        # Development scripts
└── *.md              # Documentation
```

## 📚 Documentation
- **QUICK_START.md** - Step-by-step build guide
- **VERSION.md** - Complete version history
- **ROADMAP.md** - Development roadmap
- **WINDOWS_DESKTOP_BUILD_GUIDE.md** - Technical details

---
**Ready to build?** Run `.\build-windows.ps1` and get your portable Windows .exe! 🎯