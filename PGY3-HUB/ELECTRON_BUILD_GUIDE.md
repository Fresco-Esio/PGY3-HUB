# PGY3-HUB Electron Desktop App Build Guide

## Prerequisites

### Required Software
- **Node.js** (16.0.0 or higher)
- **Python** (3.9.0 or higher)  
- **Visual Studio Build Tools** (for native modules)

### Install Visual Studio Build Tools (Required for Electron)
1. Download Visual Studio Installer
2. Install "C++ build tools" workload
3. Or install via chocolatey: `choco install visualstudio2022buildtools`

## Installation Steps

### 1. Install Dependencies
```powershell
cd frontend

# Install all dependencies including Electron
npm install

# If you get native module errors, try:
npm install --force
```

### 2. Create Application Icon
1. Create or download a `.ico` file with multiple sizes (16x16, 32x32, 48x48, 256x256)
2. Save as `frontend/public/icon.ico`
3. Use online converters like https://convertico.com/ to convert PNG to ICO

### 3. Build React App
```powershell
cd frontend
npm run build
```

This creates the optimized React build in the `build/` folder.

## Development & Testing

### Test Electron in Development Mode
```powershell
cd frontend

# Start React dev server and Electron together
npm run electron-dev
```

This will:
- Start React development server on http://localhost:3000
- Launch Electron window loading from dev server
- Enable hot reload for development

### Test Production Build
```powershell
cd frontend

# Build React app first
npm run build

# Test Electron with production build
npm run electron
```

## Packaging for Windows

### Option 1: Full Installer (Recommended)
```powershell
cd frontend
npm run build-win
```

Creates:
- `dist/PGY3-HUB Setup 0.1.0.exe` - NSIS installer
- Includes uninstaller
- Creates desktop shortcut
- Creates start menu entry

### Option 2: Portable Executable
```powershell
cd frontend
npm run build-win-portable
```

Creates:
- `dist/PGY3-HUB-0.1.0-portable.exe` - Standalone executable
- No installation required
- Can run from USB drive

### Option 3: Both Installer and Portable
```powershell
cd frontend
npm run dist
```

Creates both installer and portable versions.

## Build Output

After successful build, check the `frontend/dist/` folder:

```
dist/
├── PGY3-HUB Setup 0.1.0.exe          # Installer
├── PGY3-HUB-0.1.0-portable.exe       # Portable
├── win-unpacked/                      # Unpacked files
│   ├── PGY3-HUB.exe                  # Main executable
│   ├── resources/                     # App resources
│   └── ...
└── builder-debug.yml                 # Build info
```

## Configuration Details

### Electron Builder Settings (in package.json)
```json
"build": {
  "appId": "com.pgy3hub.app",
  "productName": "PGY3-HUB",
  "win": {
    "target": ["nsis", "portable"],
    "icon": "public/icon.ico"
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true
  }
}
```

### Files Included in Package
- `build/**/*` - React production build
- `public/electron.js` - Main Electron process
- `public/preload.js` - Security preload script
- `public/icon.ico` - Application icon

## Backend Integration

### Embedded Backend (Current Setup)
The Electron app tries to start the Python backend automatically:
- Looks for Python in system PATH
- Starts uvicorn server on port 8001
- Falls back gracefully if Python not available

### For Fully Offline App
To bundle Python backend with the executable:
1. Use `pyinstaller` to create backend executable
2. Include in Electron build files
3. Modify `electron.js` to start bundled executable

## Troubleshooting

### Build Errors

#### "node-gyp rebuild failed"
```powershell
# Install Windows build tools
npm install --global windows-build-tools

# Or install Visual Studio Build Tools manually
# Then clear cache and reinstall
npm cache clean --force
rm -r node_modules
npm install
```

#### "electron-builder failed"
```powershell
# Clear electron cache
npx electron-builder install-app-deps

# Rebuild native modules
npm run electron-rebuild
```

#### "Python backend not starting"
Ensure Python and uvicorn are available:
```powershell
python --version
pip install uvicorn fastapi
```

### Runtime Issues

#### "App won't start"
- Check if `build/` folder exists and contains index.html
- Verify icon.ico file exists in public/ folder
- Check console for file path errors

#### "Backend API not working"
- Ensure backend dependencies are installed on target machine
- Check if port 8001 is available
- Consider bundling backend as executable

#### "CORS errors"
- Verify backend CORS settings allow localhost:// and file:// origins
- Check if backend is actually running

### Performance Issues

#### "Slow startup"
- Optimize React build size
- Consider lazy loading components
- Use Electron's `show: false` and `ready-to-show` event

#### "Large file size"
Current build includes:
- Electron runtime (~150MB)
- React app build (~10MB)
- Node modules (~50MB)

To reduce size:
- Use `electron-builder` compression
- Exclude unnecessary files
- Consider external dependencies

## Distribution

### Installing on Target Machines

#### Using Installer (Recommended)
1. Double-click `PGY3-HUB Setup 0.1.0.exe`
2. Follow installation wizard
3. Launch from desktop shortcut or start menu

#### Using Portable Version
1. Copy `PGY3-HUB-0.1.0-portable.exe` to desired location
2. Double-click to run
3. No installation required

### System Requirements
- **OS**: Windows 10/11 (64-bit)
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 500MB for installation
- **Python**: 3.9+ (for backend functionality)

### Auto-Updates (Future Enhancement)
Consider implementing auto-updates with:
- `electron-updater`
- GitHub Releases
- Code signing for trusted updates

## Security Considerations

### Code Signing (Production)
For distribution, consider code signing:
```powershell
# Install certificate
# Add to package.json build config:
"win": {
  "certificateFile": "path/to/certificate.p12",
  "certificatePassword": "password"
}
```

### Content Security Policy
The app uses:
- `nodeIntegration: false`
- `contextIsolation: true`
- Preload script for secure API access

## Advanced Configuration

### Custom Installation Path
Modify NSIS settings in package.json:
```json
"nsis": {
  "allowToChangeInstallationDirectory": true,
  "installationDirectoryName": "PGY3-HUB"
}
```

### Multiple File Associations
Add file associations for .pgy3 files:
```json
"fileAssociations": [
  {
    "ext": "pgy3",
    "name": "PGY3 Mind Map",
    "icon": "public/icon.ico"
  }
]
```

### Different Windows Targets
```json
"win": {
  "target": [
    { "target": "nsis", "arch": ["x64", "ia32"] },
    { "target": "zip", "arch": ["x64"] },
    { "target": "portable", "arch": ["x64"] }
  ]
}
```
