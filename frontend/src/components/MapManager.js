import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  Trash2, 
  ArrowLeft,
  Save,
  Download,
  RefreshCw
} from 'lucide-react';

// Map Management Utilities
export const mapStorageUtils = {
  // Check if there's existing map data
  hasExistingData: () => {
    try {
      const stored = localStorage.getItem('pgy3_mindmap_data');
      if (!stored) return false;
      
      const data = JSON.parse(stored);
      if (!data.data) return false;
      
      // Check if any collections have data
      const collections = ['topics', 'cases', 'tasks', 'literature'];
      return collections.some(collection => 
        Array.isArray(data.data[collection]) && data.data[collection].length > 0
      );
    } catch (error) {
      console.error('Error checking existing data:', error);
      return false;
    }
  },

  // Get map statistics
  getMapStats: () => {
    try {
      const stored = localStorage.getItem('pgy3_mindmap_data');
      if (!stored) return null;
      
      const data = JSON.parse(stored);
      if (!data.data) return null;
      
      return {
        topics: data.data.topics?.length || 0,
        cases: data.data.cases?.length || 0, 
        tasks: data.data.tasks?.length || 0,
        literature: data.data.literature?.length || 0,
        connections: data.data.connections?.length || 0,
        lastModified: data.timestamp ? new Date(data.timestamp) : null
      };
    } catch (error) {
      console.error('Error getting map stats:', error);
      return null;
    }
  },

  // Clear all map data
  clearMapData: () => {
    try {
      localStorage.removeItem('pgy3_mindmap_data');
      return true;
    } catch (error) {
      console.error('Error clearing map data:', error);
      return false;
    }
  },

  // Export current map data
  exportMapData: () => {
    try {
      const stored = localStorage.getItem('pgy3_mindmap_data');
      if (!stored) return null;
      
      const data = JSON.parse(stored);
      const exportData = {
        ...data,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `pgy3-mindmap-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error('Error exporting map data:', error);
      return false;
    }
  }
};

// Clear Data Confirmation Modal
const ClearDataModal = ({ isOpen, onClose, onConfirm, mapStats }) => {
  const [confirmText, setConfirmText] = useState('');
  const [isClearing, setIsClearing] = useState(false);
  
  const handleConfirm = async () => {
    if (confirmText.toLowerCase() !== 'delete') return;
    
    setIsClearing(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing
    onConfirm();
    setIsClearing(false);
    setConfirmText('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 border border-red-600/30"
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-red-600/20 rounded-lg">
            <AlertTriangle size={24} className="text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Clear Mind Map Data</h2>
        </div>
        
        <div className="space-y-4 mb-6">
          <p className="text-gray-300">
            This action will permanently delete your entire mind map, including:
          </p>
          
          {mapStats && (
            <div className="bg-gray-900 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Topics:</span>
                <span className="text-white font-medium">{mapStats.topics}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Cases:</span>
                <span className="text-white font-medium">{mapStats.cases}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Tasks:</span>
                <span className="text-white font-medium">{mapStats.tasks}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Literature:</span>
                <span className="text-white font-medium">{mapStats.literature}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Connections:</span>
                <span className="text-white font-medium">{mapStats.connections}</span>
              </div>
            </div>
          )}
          
          <p className="text-red-300 text-sm font-medium">
            This action cannot be undone!
          </p>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Type "DELETE" to confirm:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-white"
              placeholder="DELETE"
              autoFocus
            />
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            disabled={isClearing}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirmText.toLowerCase() !== 'delete' || isClearing}
            className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            {isClearing ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Clearing...</span>
              </>
            ) : (
              <>
                <Trash2 size={16} />
                <span>Delete Forever</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// Map Options Modal (for existing maps)
const MapOptionsModal = ({ isOpen, onClose, onClearData, onExportData, mapStats }) => {
  const [showClearModal, setShowClearModal] = useState(false);
  
  if (!isOpen && !showClearModal) return null;

  return (
    <>
      {isOpen && !showClearModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 border border-gray-600"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Mind Map Options</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
            </div>
            
            {mapStats && (
              <div className="bg-gray-900 rounded-lg p-4 mb-6">
                <h3 className="text-white font-medium mb-3">Current Map Statistics</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400">Topics</div>
                    <div className="text-white font-medium">{mapStats.topics}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Cases</div>
                    <div className="text-white font-medium">{mapStats.cases}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Tasks</div>
                    <div className="text-white font-medium">{mapStats.tasks}</div>
                  </div>
                  <div>
                    <div className="text-gray-400">Literature</div>
                    <div className="text-white font-medium">{mapStats.literature}</div>
                  </div>
                </div>
                {mapStats.lastModified && (
                  <div className="mt-3 text-xs text-gray-400">
                    Last modified: {mapStats.lastModified.toLocaleString()}
                  </div>
                )}
              </div>
            )}
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  onExportData();
                  onClose();
                }}
                className="w-full p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center space-x-3"
              >
                <Download size={20} />
                <span>Export Mind Map</span>
              </button>
              
              <button
                onClick={() => setShowClearModal(true)}
                className="w-full p-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-3"
              >
                <Trash2 size={20} />
                <span>Clear All Data</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
      
      <ClearDataModal
        isOpen={showClearModal}
        onClose={() => {
          setShowClearModal(false);
          onClose();
        }}
        onConfirm={() => {
          onClearData();
          setShowClearModal(false);
          onClose();
        }}
        mapStats={mapStats}
      />
    </>
  );
};

export default MapOptionsModal;