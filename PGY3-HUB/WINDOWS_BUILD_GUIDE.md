# Windows Electron Build - Complete Guide

## ✅ Ready to Build!

Your project is already set up with Electron! Here's how to create your Windows .exe:

## Quick Build (Recommended)

Run one of these commands from the project root:

### PowerShell (Recommended)
```powershell
.\build-windows.ps1
```

### Command Prompt
```cmd
build-windows.bat
```

## Manual Build Steps

If you prefer to build manually:

### 1. Install Dependencies
```powershell
cd frontend
npm install
cd ..\backend  
npm install
```

### 2. Build React App
```powershell
cd frontend
npm run build
```

### 3. Create Windows Executable
```powershell
# For both installer and portable
npm run build-win-both

# Or individually:
npm run build-win-installer    # Creates installer with shortcuts
npm run build-win-portable     # Creates portable .exe
```

## What You'll Get

After building, check `frontend/dist/` for:

- **PGY3-HUB-Setup-1.0.0.exe** - Full Windows installer
  - Creates desktop shortcut
  - Adds to Start Menu
  - Proper uninstaller
  
- **PGY3-HUB-1.0.0-portable.exe** - Portable version
  - No installation required
  - Can run from any folder/USB drive

## Testing Your Build

### Development Mode
```powershell
cd frontend
npm run electron-dev
```

### Production Mode  
```powershell
cd frontend
npm run build
npm run electron
```

## Icon Setup

Replace `frontend/public/icon.ico` with your custom icon:
- Use 256x256 PNG and convert to ICO format
- Online converters: convertio.co, favicon.io

## Troubleshooting

### "Icon not found" Error
- Ensure `frontend/public/icon.ico` exists
- Use a proper ICO file format

### Backend Won't Start
- Check if Python is installed and in PATH
- Install backend deps: `pip install fastapi uvicorn`
- App will fallback to Node.js backend if Python fails

### Build Fails
```powershell
cd frontend
npm run clean
npm install
npm run build-win-both
```

### Missing Dependencies
```powershell
npm install -g windows-build-tools
```

## Your Current Setup ✅

I've already configured:
- ✅ Electron main process (`frontend/public/electron.js`)
- ✅ Security preload script (`frontend/public/preload.js`)  
- ✅ Build configuration in `package.json`
- ✅ Windows-specific installer settings
- ✅ Backend integration (Python + Node.js fallback)
- ✅ Desktop shortcuts and Start Menu entries
- ✅ Proper file associations

## Key Features Included

- **Offline Support** - Works without internet
- **Native Menus** - File, Edit, View, Help menus
- **Security** - Context isolation and preload scripts
- **Auto-start Backend** - Launches Python/Node.js backend automatically
- **File Dialogs** - Native save/open dialogs
- **Desktop Integration** - Icons, shortcuts, Start Menu

## Build Output Structure

```
frontend/dist/
├── PGY3-HUB-Setup-1.0.0.exe     # Installer
├── PGY3-HUB-1.0.0-portable.exe  # Portable
└── win-unpacked/                 # Debug folder
    ├── PGY3-HUB.exe             # Main app
    ├── resources/app/
    │   ├── build/               # Your React app
    │   └── backend/             # Backend files
    └── ...
```

## Next Steps

1. **Build now**: Run `.\build-windows.ps1`
2. **Test installer**: Run the created .exe file
3. **Customize icon**: Replace `frontend/public/icon.ico`
4. **Brand installer**: Edit app name in `frontend/package.json`

You're all set! 🚀
