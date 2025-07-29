# PGY3-HUB Electron Build - Working Solution

## Quick Fix for Windows Symbolic Link Issues

### Method 1: Enable Developer Mode (Recommended)
1. Open Windows Settings
2. Go to Privacy & Security → For developers  
3. Turn ON "Developer Mode"
4. Restart your terminal
5. Run: `npm run build-win-installer`

### Method 2: Run as Administrator
1. Right-click PowerShell → "Run as Administrator"
2. Navigate to your project: `cd "c:\Users\Obioe\OneDrive - Montefiore Medicine (1)\Projects\PGY3-HUB-main\PGY3-HUB-main\frontend"`
3. Run: `npm run build-win-installer`

### Method 3: Simplified Build (If above fails)

If you continue having issues, use this simpler approach:

```powershell
# Build React app
cd frontend
npm run build

# Test in development mode
npm run electron

# Create basic package (no installer)
npx electron-packager . PGY3-HUB --platform=win32 --arch=x64 --out=dist --overwrite
```

## Your Build Configuration ✅

I've already optimized your setup:

### package.json (frontend) - Complete Build Config
```json
{
  "main": "public/electron.js",
  "homepage": "./",
  "scripts": {
    "electron": "electron .",
    "electron-dev": "concurrently \"npm start\" \"wait-on http://localhost:3000 && electron .\"",
    "build-win": "npm run build && electron-builder --win",
    "build-win-installer": "npm run build && electron-builder --win nsis",
    "build-win-portable": "npm run build && electron-builder --win portable",
    "build-win-both": "npm run build && electron-builder --win nsis portable"
  },
  "build": {
    "appId": "com.pgy3hub.app",
    "productName": "PGY3-HUB",
    "directories": { "output": "dist" },
    "files": [
      "build/**/*",
      "node_modules/**/*", 
      "public/electron.js",
      "public/preload.js",
      "../backend/**/*"
    ],
    "win": {
      "target": ["nsis", "portable"],
      "requestedExecutionLevel": "asInvoker",
      "sign": null,
      "verifyUpdateCodeSignature": false
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true,
      "shortcutName": "PGY3-HUB"
    }
  }
}
```

## Testing Your Current Setup

### 1. Test React Build (✅ Already Working)
```powershell
cd frontend
npm run build
```

### 2. Test Electron in Development
```powershell
cd frontend
npm run electron-dev
```
This should:
- Start React dev server on http://localhost:3000
- Launch Electron window
- Show your app running

### 3. Test Production Build
```powershell
cd frontend
npm run build
npm run electron
```
This should show your built app in Electron.

## Expected Build Output

After successful build, you'll find in `frontend/dist/`:
- **PGY3-HUB-Setup-0.1.0.exe** - Full installer
- **PGY3-HUB-0.1.0-portable.exe** - Portable version
- **win-unpacked/** - Unpacked app folder

## Adding a Custom Icon

1. Get a 256x256 PNG image
2. Convert to ICO format using:
   - Online: convertio.co/png-ico/
   - Or: imagemagick, GIMP, etc.
3. Replace `frontend/public/icon.ico`
4. Update package.json:
   ```json
   "build": {
     "win": {
       "icon": "public/icon.ico"
     },
     "nsis": {
       "installerIcon": "public/icon.ico",
       "uninstallerIcon": "public/icon.ico"
     }
   }
   ```

## Troubleshooting

### Build Stuck on "downloading winCodeSign"
- Enable Developer Mode in Windows
- Or run PowerShell as Administrator
- Or clear cache: `Remove-Item -Recurse -Force "$env:LOCALAPPDATA\electron-builder\Cache"`

### Backend Won't Start in Production
- Ensure Python is in PATH
- Install backend deps: `pip install fastapi uvicorn`
- The app will fallback to Node.js backend automatically

### App Won't Launch
- Check if React build exists: `frontend/build/index.html`
- Check Electron console (Ctrl+Shift+I) for errors
- Verify all dependencies installed: `npm install`

## Final Build Commands

Choose one based on what you need:

```powershell
# For installer only
npm run build-win-installer

# For portable only  
npm run build-win-portable

# For both installer and portable
npm run build-win-both
```

## Success Checklist ✅

- [ ] React app builds without errors
- [ ] Electron starts in development mode
- [ ] Windows Developer Mode enabled OR running as admin
- [ ] Build completes and creates .exe files
- [ ] Desktop shortcut and Start Menu entry work
- [ ] App launches and functions offline

You're very close! The main issue is just the Windows permissions for symbolic links, which Developer Mode will solve.
