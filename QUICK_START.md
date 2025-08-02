# PGY3-HUB Quick Start Guide v0.2.0

## 🚀 Quick Build (Windows)

### Option 1: PowerShell (Recommended)
```powershell
.\build-windows.ps1
```

### Option 2: Command Prompt  
```cmd
build-windows.bat
```

## 📦 What You'll Get

After successful build, check `frontend/dist/` for:

- **PGY3-HUB-Setup-0.2.0.exe** - Full Windows installer
  - Creates desktop shortcut
  - Adds to Start Menu  
  - Proper uninstaller
  
- **PGY3-HUB-0.2.0-portable.exe** - Portable version
  - No installation required
  - Can run from any folder/USB drive
  - Includes embedded Python backend

## 🛠️ Development Mode

### Start Development Environment
```cmd
start-dev.bat
```
or
```powershell
.\start-dev.ps1
```

This will:
- Start Python backend on http://localhost:8001
- Start React dev server on http://localhost:3000  
- Launch Electron with hot reload enabled

## 🧪 Testing Your Build

### Test Build Integrity
```cmd
test-build.bat
```

### Manual Testing
1. Run the installer: `frontend/dist/PGY3-HUB-Setup-0.2.0.exe`
2. Launch from desktop shortcut
3. Verify app works offline
4. Test mind mapping features

## 🔧 Prerequisites

### Required Software
- **Node.js** 16+ (for React and Electron)
- **Python** 3.9+ (for FastAPI backend)
- **npm** or **yarn** (package management)

### Windows Build Tools (for native modules)
```cmd
npm install -g windows-build-tools
```

## 📁 Project Structure

```
PGY3-HUB/
├── frontend/                 # React + Electron app
│   ├── build/               # React production build
│   ├── dist/                # Electron build outputs
│   ├── public/electron.js   # Electron main process
│   ├── public/preload.js    # Security preload script
│   └── package.json         # Frontend dependencies & build config
├── backend/                 # Python FastAPI backend
│   ├── server.py           # Main API server
│   ├── pgy3-hub-backend.spec # PyInstaller configuration
│   ├── pgy3-hub-backend.exe # Compiled backend (after build)
│   └── requirements.txt     # Python dependencies
├── build-windows.ps1       # Main build script (PowerShell)
├── build-windows.bat       # Main build script (Batch)
├── start-dev.ps1          # Development mode (PowerShell)
├── start-dev.bat          # Development mode (Batch)
└── test-build.bat         # Build testing script
```

## 🎯 Key Features

### Desktop Integration
- ✅ Native Windows installer with shortcuts
- ✅ Start Menu integration
- ✅ File associations (.pgy3 files)
- ✅ Native menus (File, Edit, View, Help)
- ✅ Native file dialogs (Save/Open)

### Backend Integration  
- ✅ Auto-start Python backend on app launch
- ✅ Embedded Python executable (no installation required)
- ✅ Graceful fallback to Python script if executable fails
- ✅ Clean shutdown when app closes

### Security & Performance
- ✅ Context isolation and preload scripts
- ✅ No remote module access
- ✅ Optimized React build
- ✅ Hot reload in development mode

## 🚨 Troubleshooting

### Build Issues

#### "Python not found"
- Install Python 3.9+ and ensure it's in PATH
- Or download from: https://python.org/downloads/

#### "Node.js not found"  
- Install Node.js 16+ from: https://nodejs.org/
- Restart terminal after installation

#### "PyInstaller failed"
- The build will continue with Python script fallback
- Backend will work but require Python on target machine

#### "Electron build failed"
- Try: `npm install -g electron-builder`
- Enable Windows Developer Mode for symbolic links
- Or run PowerShell as Administrator

### Runtime Issues

#### "App won't start"
- Check if antivirus is blocking the executable
- Try running as administrator
- Check Windows Event Viewer for error details

#### "Backend not starting"  
- Ensure ports 8001 is available
- Check if Windows Firewall is blocking
- Look for backend logs in app console (Ctrl+Shift+I)

## 📊 Build Output Sizes

Typical build sizes:
- **Installer**: ~200-300 MB (includes Electron runtime + Python)
- **Portable**: ~180-250 MB (no installer overhead)
- **Unpacked**: ~400-500 MB (includes all dependencies)

## 🔄 Version History

- **v0.2.0**: Enhanced build system with PyInstaller backend packaging
- **v0.1.0**: Initial Electron setup with Node.js fallback

## 🆘 Support

If you encounter issues:
1. Check this guide first
2. Run `test-build.bat` to verify your setup
3. Check the console logs (Ctrl+Shift+I in the app)
4. Review the troubleshooting section above

---

**Ready to build?** Run `.\build-windows.ps1` and you'll have a standalone Windows .exe in minutes! 🚀
