const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // File dialogs
  showSaveDialog: () => ipcRenderer.invoke('show-save-dialog'),
  showOpenDialog: () => ipcRenderer.invoke('show-open-dialog'),
  
  // Menu event listeners
  onMenuNewMindmap: (callback) => {
    ipcRenderer.on('menu-new-mindmap', callback);
  },
  onMenuExportData: (callback) => {
    ipcRenderer.on('menu-export-data', callback);
  },
  
  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },
  
  // Platform info
  platform: process.platform,
  
  // Check if running in Electron
  isElectron: true
});

// Expose a limited API for the application
contextBridge.exposeInMainWorld('pgy3Hub', {
  isDesktop: true,
  platform: 'electron',
  version: process.versions.electron
});
