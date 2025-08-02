# PGY3-HUB Windows Desktop App - Complete Build Guide v0.2.0

## 🎯 Overview

This guide will help you package the PGY3-HUB mind mapping application as a standalone Windows .exe desktop app using Electron for the frontend and PyInstaller for the backend.

## 📋 What This Build System Provides

### ✅ **Single .exe Distribution**
- **Installer version**: `PGY3-HUB-Setup-0.2.0.exe` with desktop shortcuts and Start Menu entries
- **Portable version**: `PGY3-HUB-0.2.0-portable.exe` that runs from any folder without installation

### ✅ **Embedded Dependencies**
- **React frontend**: Optimized production build
- **Python backend**: Compiled to executable with PyInstaller (or fallback to script)
- **Node.js runtime**: Embedded Electron runtime
- **Python runtime**: Bundled for offline operation

### ✅ **Desktop Integration**
- Native Windows menus (File, Edit, View, Help)
- Desktop shortcuts and Start Menu entries
- File associations for .pgy3 files
- Native file dialogs (Save/Open)
- Auto-start backend on launch
- Clean shutdown of all processes

## 🛠️ Build Process Overview

### Phase 1: Environment Setup
1. Install Node.js 16+ and Python 3.9+
2. Install project dependencies (npm/pip)
3. Install build tools (PyInstaller, Electron Builder)

### Phase 2: Component Building
1. **React Frontend**: Build optimized production bundle
2. **Python Backend**: Compile to standalone executable with PyInstaller
3. **Electron Packaging**: Bundle everything into Windows installer/portable

### Phase 3: Testing & Distribution
1. Test build integrity and functionality
2. Verify offline operation
3. Test installation and uninstallation
4. Distribute to target systems

## 🚀 Quick Build Commands

### **Automated Build (Recommended)**
```powershell
# PowerShell (recommended)
.\build-windows.ps1

# Or Command Prompt
build-windows.bat
```

### **Development & Testing**
```powershell
# Start development environment
.\start-dev.ps1

# Test build integrity  
.\test-build.bat
```

## 📦 Build Architecture

### **Frontend (Electron + React)**
```
frontend/
├── build/                    # React production build
├── dist/                     # Final Electron build outputs  
├── public/
│   ├── electron.js          # Main Electron process
│   ├── preload.js           # Security preload script
│   └── icon.ico             # Application icon
├── src/                     # React source code
└── package.json             # Build configuration
```

### **Backend (Python + PyInstaller)**
```
backend/
├── server.py               # FastAPI main application
├── pgy3-hub-backend.spec   # PyInstaller build specification
├── pgy3-hub-backend.exe    # Compiled executable (after build)
├── requirements.txt        # Python dependencies
└── mindmap_data.json       # Local data storage
```

## 🔧 Build Configuration Details

### **Electron Builder Settings**
```json
{
  "build": {
    "appId": "com.pgy3hub.app",
    "productName": "PGY3-HUB",
    "win": {
      "target": ["nsis", "portable"],
      "requestedExecutionLevel": "asInvoker"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    }
  }
}
```

### **PyInstaller Configuration**
```python
# pgy3-hub-backend.spec
a = Analysis(
    ['server.py'],
    datas=[('mindmap_data.json', '.'), ('uploads', 'uploads')],
    hiddenimports=['uvicorn', 'fastapi', 'starlette', 'pydantic'],
    # ... additional configuration
)
```

## 🎛️ Backend Integration Strategy

### **Multi-tier Fallback System**
1. **Primary**: Packaged Python executable (`pgy3-hub-backend.exe`)
2. **Secondary**: Python script with uvicorn (`python -m uvicorn server:app`)
3. **Tertiary**: Node.js fallback server (if available)

### **Process Management**
- **Startup**: Electron automatically starts backend on app launch
- **Monitoring**: Health checks and error logging
- **Shutdown**: Clean termination of backend when app closes

## 📊 Build Output Analysis

### **File Structure After Build**
```
frontend/dist/
├── PGY3-HUB-Setup-0.2.0.exe      # ~200-300 MB installer
├── PGY3-HUB-0.2.0-portable.exe   # ~180-250 MB portable
└── win-unpacked/                   # ~400-500 MB unpacked
    ├── PGY3-HUB.exe               # Main application
    ├── resources/
    │   └── app/
    │       ├── build/             # React build
    │       └── backend/           # Python backend
    └── ...                        # Electron runtime
```

### **Size Breakdown**
- **Electron Runtime**: ~150 MB (Chromium + Node.js)
- **React App**: ~10-20 MB (optimized build)
- **Python Backend**: ~50-100 MB (depending on PyInstaller success)
- **Dependencies**: ~50-100 MB (node_modules, Python packages)

## 🔒 Security Considerations

### **Electron Security**
- ✅ Context isolation enabled
- ✅ Node integration disabled in renderer
- ✅ Preload script for secure IPC
- ✅ No remote module access
- ⚠️ Code signing recommended for distribution

### **Backend Security**
- ✅ Local-only API (127.0.0.1)
- ✅ CORS configured for localhost
- ✅ No external network dependencies
- ✅ JSON file-based storage (no external database)

## 🧪 Testing Strategy

### **Automated Testing**
```cmd
test-build.bat
```
Verifies:
- React build completeness
- Python dependencies
- Backend executable existence
- Electron build outputs

### **Manual Testing Checklist**
- [ ] Installer runs without admin privileges
- [ ] Desktop shortcut created and functional
- [ ] App starts and shows UI
- [ ] Backend API responds (check DevTools console)
- [ ] Mind mapping features work (create nodes, connections)
- [ ] Data persists between app restarts
- [ ] App works completely offline
- [ ] Uninstaller removes all components

### **Target System Testing**
- [ ] Clean Windows 10/11 machine
- [ ] No Python or Node.js pre-installed
- [ ] No administrator privileges required
- [ ] Antivirus software enabled
- [ ] Various network conditions (offline/online)

## 🚨 Troubleshooting Guide

### **Build Issues**

#### PyInstaller Fails
```
Symptoms: "pyinstaller not found" or compilation errors
Solutions:
1. pip install pyinstaller
2. Check Python PATH configuration
3. Use Python script fallback (automatic)
```

#### Electron Build Fails  
```
Symptoms: "electron-builder failed" or symbolic link errors
Solutions:
1. Enable Windows Developer Mode
2. Run PowerShell as Administrator  
3. npm install -g electron-builder
4. Clear cache: rm -rf node_modules, npm install
```

#### Missing Dependencies
```
Symptoms: "Module not found" errors
Solutions:
1. npm install (frontend)
2. pip install -r requirements.txt (backend)
3. Check Node.js and Python versions
```

### **Runtime Issues**

#### App Won't Start
```
Symptoms: .exe launches but no window appears
Diagnostics:
1. Check Windows Event Viewer
2. Try running from command line
3. Disable antivirus temporarily
4. Run as administrator
```

#### Backend Not Responding
```
Symptoms: UI loads but API calls fail
Diagnostics:
1. Open DevTools (Ctrl+Shift+I)
2. Check Console for backend errors
3. Verify port 8001 is available
4. Check Windows Firewall settings
```

#### Performance Issues
```
Symptoms: Slow startup or high memory usage
Solutions:
1. Check antivirus real-time scanning
2. Close other Electron/Chrome processes
3. Monitor Task Manager for resource usage
4. Consider SSD vs HDD performance
```

## 🔄 Development Workflow

### **Development Mode**
```powershell
.\start-dev.ps1
```
- Hot reload for React frontend
- Auto-restart for Python backend changes
- DevTools enabled for debugging

### **Build & Test Cycle**
```powershell
.\build-windows.ps1    # Build everything
.\test-build.bat       # Verify build integrity
# Test .exe manually
```

### **Release Preparation**
1. Update version numbers in package.json
2. Test on clean Windows machine
3. Consider code signing for distribution
4. Create release notes and documentation

## 📈 Future Enhancements

### **Potential Improvements**
- [ ] Auto-updater with electron-updater
- [ ] Code signing for trusted distribution
- [ ] macOS and Linux builds
- [ ] Splash screen during startup
- [ ] Custom installer branding
- [ ] File association improvements
- [ ] Performance monitoring
- [ ] Crash reporting

### **Optimization Opportunities**
- [ ] Reduce bundle size with tree-shaking
- [ ] Lazy load non-critical components
- [ ] Optimize Python backend startup time
- [ ] Cache frequently used dependencies
- [ ] Progressive Web App (PWA) features

## 📞 Support & Resources

### **Documentation**
- `QUICK_START.md` - Quick build instructions
- `ELECTRON_BUILD_GUIDE.md` - Detailed Electron setup
- `WINDOWS_BUILD_GUIDE.md` - Windows-specific guidance
- `TROUBLESHOOTING.md` - Common issues and solutions

### **Build Scripts**
- `build-windows.ps1` / `build-windows.bat` - Main build automation
- `start-dev.ps1` / `start-dev.bat` - Development environment
- `test-build.bat` - Build verification

### **Key Configuration Files**
- `frontend/package.json` - Electron Builder configuration
- `backend/pgy3-hub-backend.spec` - PyInstaller specification
- `frontend/public/electron.js` - Main Electron process
- `frontend/public/preload.js` - Security preload script

---

## 🎉 Success Criteria

**Your build is successful when:**
✅ You can double-click the .exe and the app opens without errors  
✅ The mind mapping features work completely offline  
✅ Data persists between app restarts  
✅ The app can be installed/uninstalled cleanly  
✅ No external dependencies required on target systems  

**Ready to build?** Run `.\build-windows.ps1` and create your standalone Windows desktop app! 🚀