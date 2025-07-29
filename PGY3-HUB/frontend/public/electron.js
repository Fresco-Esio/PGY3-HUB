const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

// Check if running in development mode
const isDev = process.env.NODE_ENV === 'development' || 
              process.env.DEBUG_PROD === 'true' || 
              process.defaultApp || 
              /[\\/]electron-prebuilt[\\/]/.test(process.execPath) || 
              /[\\/]electron[\\/]/.test(process.execPath);

// Keep a global reference of the window object
let mainWindow;
let backendProcess = null;

// Enable live reload for Electron in development
if (isDev) {
  try {
    require('electron-reload')(__dirname, {
      electron: path.join(__dirname, '..', 'node_modules', '.bin', 'electron'),
      hardResetMethod: 'exit'
    });
  } catch (error) {
    console.log('electron-reload not available, continuing without live reload');
  }
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false, // Don't show until ready
    titleBarStyle: 'default',
    autoHideMenuBar: false
  });

  // Load the app
  if (isDev) {
    // Development: load from localhost
    mainWindow.loadURL('http://localhost:3000');
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    // Production: load from build folder
    const buildPath = path.join(__dirname, '../build/index.html');
    console.log('Loading build from:', buildPath);
    mainWindow.loadFile(buildPath).catch(err => {
      console.error('Failed to load build file:', err);
      // Fallback: try different path structures
      const altPath = path.join(process.resourcesPath, 'app', 'build', 'index.html');
      console.log('Trying alternative path:', altPath);
      mainWindow.loadFile(altPath);
    });
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Create application menu
  createMenu();
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Mind Map',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new-mindmap');
          }
        },
        {
          label: 'Export Data',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            mainWindow.webContents.send('menu-export-data');
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectall' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About PGY3-HUB',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About PGY3-HUB',
              message: 'PGY3-HUB',
              detail: 'Mind Mapping Tool for Psychiatry Residents\nVersion 1.0.0\n\nDeveloped for medical education and clinical training.'
            });
          }
        },
        {
          label: 'Learn More',
          click: () => {
            shell.openExternal('https://github.com/your-repo/pgy3-hub');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function startBackend() {
  if (!isDev) {
    // In production, try to start the Python backend
    const isPackaged = app.isPackaged;
    const backendPath = isPackaged 
      ? path.join(process.resourcesPath, 'app', 'backend')
      : path.join(__dirname, '../../backend');
    
    const pythonScript = path.join(backendPath, 'server.py');
    
    console.log('Backend path:', backendPath);
    console.log('Python script:', pythonScript);
    
    try {
      // Try to start Python backend
      const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
      backendProcess = spawn(pythonCmd, ['-m', 'uvicorn', 'server:app', '--port', '8001'], {
        cwd: backendPath,
        stdio: 'pipe',
        shell: true
      });

      backendProcess.on('error', (err) => {
        console.log('Failed to start Python backend:', err);
        // Could fallback to Node.js backend here
        tryNodeBackend(backendPath);
      });

      backendProcess.stdout.on('data', (data) => {
        console.log(`Backend: ${data}`);
      });

      backendProcess.stderr.on('data', (data) => {
        console.log(`Backend Error: ${data}`);
      });
    } catch (error) {
      console.log('Could not start backend:', error);
      tryNodeBackend(backendPath);
    }
  }
}

function tryNodeBackend(backendPath) {
  try {
    const nodeScript = path.join(backendPath, 'server.js');
    backendProcess = spawn('node', [nodeScript], {
      cwd: backendPath,
      stdio: 'pipe'
    });
    
    console.log('Started Node.js backend fallback');
  } catch (error) {
    console.log('Node.js backend fallback also failed:', error);
  }
}

function stopBackend() {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
}

// App event handlers
app.whenReady().then(() => {
  startBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  stopBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopBackend();
});

// IPC handlers for communication with renderer process
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('show-save-dialog', async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  return result;
});

ipcMain.handle('show-open-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile']
  });
  return result;
});

// Security: Prevent navigation to external URLs
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (navigationEvent, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== 'http://localhost:3000' && parsedUrl.origin !== 'file://') {
      navigationEvent.preventDefault();
    }
  });
});
