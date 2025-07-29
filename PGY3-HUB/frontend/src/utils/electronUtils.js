// Electron integration utilities for React app
// Use this to detect if running in Electron and access Electron APIs

/**
 * Check if the app is running in Electron
 */
export const isElectron = () => {
  return typeof window !== 'undefined' && window.electronAPI && window.pgy3Hub;
};

/**
 * Check if running in desktop mode
 */
export const isDesktop = () => {
  return isElectron() && window.pgy3Hub?.isDesktop;
};

/**
 * Get app version from Electron
 */
export const getAppVersion = async () => {
  if (isElectron()) {
    try {
      return await window.electronAPI.getAppVersion();
    } catch (error) {
      console.error('Failed to get app version:', error);
      return 'Unknown';
    }
  }
  return 'Web Version';
};

/**
 * Show save dialog (Electron only)
 */
export const showSaveDialog = async () => {
  if (isElectron()) {
    try {
      return await window.electronAPI.showSaveDialog();
    } catch (error) {
      console.error('Failed to show save dialog:', error);
      return null;
    }
  }
  return null;
};

/**
 * Show open dialog (Electron only)
 */
export const showOpenDialog = async () => {
  if (isElectron()) {
    try {
      return await window.electronAPI.showOpenDialog();
    } catch (error) {
      console.error('Failed to show open dialog:', error);
      return null;
    }
  }
  return null;
};

/**
 * Set up menu event listeners (Electron only)
 */
export const setupElectronMenuListeners = (callbacks) => {
  if (!isElectron()) return;

  const { onNewMindmap, onExportData } = callbacks;

  if (onNewMindmap) {
    window.electronAPI.onMenuNewMindmap(onNewMindmap);
  }

  if (onExportData) {
    window.electronAPI.onMenuExportData(onExportData);
  }

  // Return cleanup function
  return () => {
    if (window.electronAPI.removeAllListeners) {
      window.electronAPI.removeAllListeners('menu-new-mindmap');
      window.electronAPI.removeAllListeners('menu-export-data');
    }
  };
};

/**
 * Enhanced error reporting for desktop app
 */
export const reportError = (error, context = '') => {
  console.error(`[${isElectron() ? 'Desktop' : 'Web'}] ${context}:`, error);
  
  // In desktop mode, you could send errors to a logging service
  // or show native notifications
  if (isElectron()) {
    // Could implement crash reporting here
  }
};

/**
 * Check if backend is embedded (desktop mode)
 */
export const hasEmbeddedBackend = () => {
  return isElectron();
};

/**
 * Get appropriate backend URL based on environment
 */
export const getBackendUrl = () => {
  // In Electron, always use localhost
  if (isElectron()) {
    return 'http://localhost:8001';
  }
  
  // In web mode, use environment variable or default
  return process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
};

/**
 * Platform-specific storage preferences
 */
export const getStoragePreferences = () => {
  if (isElectron()) {
    return {
      preferLocalStorage: true,
      enableAutoSave: true,
      saveInterval: 800, // ms
      enableBackupSaves: true
    };
  }
  
  return {
    preferLocalStorage: false,
    enableAutoSave: true,
    saveInterval: 1500, // ms, slower for web
    enableBackupSaves: false
  };
};

/**
 * Show desktop notification (if supported)
 */
export const showNotification = (title, body, options = {}) => {
  if (isElectron()) {
    // Could use Electron's native notifications
    // For now, fall back to web notifications
  }
  
  if ('Notification' in window && Notification.permission === 'granted') {
    return new Notification(title, { body, ...options });
  }
  
  return null;
};

/**
 * Request notification permission
 */
export const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    return await Notification.requestPermission();
  }
  return 'denied';
};

/**
 * Export utility for desktop file operations
 */
export const exportToFile = async (data, filename, type = 'application/json') => {
  if (isElectron()) {
    // Use Electron's save dialog
    const result = await showSaveDialog();
    if (result && !result.canceled) {
      // In a real implementation, you'd send this to the main process
      // to write the file using Node.js fs module
      console.log('Would save to:', result.filePath);
      return result.filePath;
    }
    return null;
  }
  
  // Web fallback - download file
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return filename;
};

// Type definitions for TypeScript users
if (typeof window !== 'undefined') {
  window.electronAPI = window.electronAPI || {};
  window.pgy3Hub = window.pgy3Hub || {};
}
