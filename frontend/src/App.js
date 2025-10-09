import React, { useState, useEffect, useCallback, useRef, useMemo, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import '@xyflow/react/dist/style.css';
import './App.css';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

// Import new components
import HomeScreen from './components/HomeScreen';
import MapOptionsModal, { mapStorageUtils } from './components/MapManager';
import D3Graph from './components/D3Graph';

// Lazy load heavy D3 dependencies (kept for Dagre layout)
const loadDagre = () => import('dagre');

import {
  Plus,
  Brain,
  Users,
  CheckSquare,
  Edit3,
  Save,
  ArrowLeft,
  FileText,
  Calendar,
  Target,
  BookOpen,
  Trash2,
  X,
  Shuffle,
  Download,
  Cloud,
  CheckCircle,
  Tag,
  Clock,
  AlertCircle,
  Info,
  Star,
  Zap,
  Settings,
  Eye,
  Upload,
  Bell,
  CheckCircle2,
  Loader2,
  Sparkles,
  Search,
  Heart,
  Bookmark,
  User,
  Clipboard,
  StickyNote,
  Paperclip,
  ChevronDown,
  ChevronUp,
  ArrowDown,
  FileSpreadsheet,
  Link2
} from 'lucide-react';

// Lazy load components for better initial load time
import { RichTextEditor, LiteratureModal } from './components/LazyComponents';
import CaseModal from './components/CaseModal';
import ConnectionManager from './components/ConnectionManager';
import TopicModal from './components/TopicModal';
import TaskModal from './components/TaskModal';
import OptimizedLoadingScreen from './components/OptimizedLoadingScreen';
import ImportSpreadsheetModal from './components/ImportSpreadsheetModal';

// Import node components
import { nodeTypes } from './components/nodes';

// Import performance utilities
import { 
  useMemoizedNodeData, 
  convertDataInChunks, 
  getQuickLayout, 
  createOptimizedEdges 
} from './utils/performanceUtils';
import { populateSampleLiteratureData, clearSampleData } from './utils/sampleDataUtils';

// Use the environment variable for the backend URL, but provide a fallback
// to the local server for development. This is a more robust pattern.
// The .replace() call removes any trailing slashes to prevent "404 Not Found"
// errors caused by double slashes in the request path (e.g., "//api/").
const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000').replace(/\/$/, '');
const API = `${BACKEND_URL}/api`;

// Fix ResizeObserver error that prevents React Flow from working
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Suppress ResizeObserver errors that don't affect functionality
const originalError = console.error;
console.error = (...args) => {
  if (args[0] && args[0].includes && args[0].includes('ResizeObserver loop')) {
    return;
  }
  originalError(...args);
};

// Toast Notification System with Animations
const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const getToastStyles = () => {
    const baseStyles = "px-6 py-3 rounded-lg shadow-2xl backdrop-blur-sm";
    const typeStyles = {
      success: "bg-green-600/90 text-white border-l-4 border-green-400",
      error: "bg-red-600/90 text-white border-l-4 border-red-400",
      info: "bg-blue-600/90 text-white border-l-4 border-blue-400",
      saving: "bg-purple-600/90 text-white border-l-4 border-purple-400"
    };
    return `${baseStyles} ${typeStyles[type]}`;
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle2 size={16} className="mr-2" />;
      case 'error': return <AlertCircle size={16} className="mr-2" />;
      case 'info': return <Info size={16} className="mr-2" />;
      case 'saving': return <Loader2 size={16} className="mr-2 animate-spin" />;
      default: return <CheckCircle2 size={16} className="mr-2" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, x: 50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, x: 50, scale: 0.8 }}
      transition={{ 
        type: "spring", 
        stiffness: 500, 
        damping: 30,
        mass: 0.8
      }}
      className={getToastStyles()}
    >
      <div className="flex items-center">
        {getIcon()}
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-4 text-white hover:text-gray-200 transition-colors hover:scale-110 active:scale-95"
        >
          <X size={14} />
        </button>
      </div>
    </motion.div>
  );
};

// Enhanced Loading Button Component
const LoadingButton = ({ onClick, loading, disabled, children, className, icon: Icon, ...props }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${className} transform transition-all duration-200 hover:scale-105 active:scale-95 ${disabled || loading ? 'cursor-not-allowed opacity-50' : 'hover:shadow-lg'
        }`}
      {...props}
    >
      <div className="flex items-center gap-2">
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : Icon ? (
          <Icon size={16} />
        ) : null}
        {children}
      </div>
    </button>
  );
};

// localStorage utilities with enhanced feedback
const STORAGE_KEY = 'pgy3_mindmap_data';
const STORAGE_VERSION = '1.1';

const localStorageUtils = {
  // Save data to localStorage with debouncing and callback for UI feedback
  save: (() => {
    let timeoutId;
    return (data, onSaveStart, onSaveComplete, isAnimating = false) => {
      clearTimeout(timeoutId);

      if (onSaveStart) onSaveStart();

      // Increase debounce delay during animations
      const debounceDelay = isAnimating ? 1200 : 800;

      timeoutId = setTimeout(() => {
        try {
          const storageData = {
            version: STORAGE_VERSION,
            timestamp: new Date().toISOString(),
            data: data
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData));
          console.log('Mind map data auto-saved to localStorage');
          if (onSaveComplete) onSaveComplete(true);
        } catch (error) {
          console.error('Error saving to localStorage:', error);
          if (onSaveComplete) onSaveComplete(false, error);

          if (error.name === 'QuotaExceededError') {
            console.warn('localStorage quota exceeded, clearing old data...');
            try {
              localStorage.removeItem(STORAGE_KEY);
            } catch (clearError) {
              console.error('Error clearing localStorage:', clearError);
            }
          }
        }
      }, debounceDelay); // Variable debounce delay
    };
  })(),

  // Load data from localStorage
  load: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        console.log('No localStorage data found');
        return null;
      }

      const storageData = JSON.parse(stored);

      // Version check
      if (storageData.version !== STORAGE_VERSION) {
        console.log('localStorage version mismatch, clearing old data');
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }

      console.log('Mind map data loaded from localStorage', storageData.timestamp);
      return storageData.data;
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      // Clear corrupted data
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (clearError) {
        console.error('Error clearing corrupted localStorage:', clearError);
      }
      return null;
    }
  },

  // Clear stored data
  clear: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('localStorage data cleared');
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },

  // Get storage info
  getStorageInfo: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const data = JSON.parse(stored);
      return {
        version: data.version,
        timestamp: data.timestamp,
        size: new Blob([stored]).size
      };
    } catch (error) {
      return null;
    }
  }
};

// Enhanced Custom Node Components - extracted to separate files for better maintainability

// EnhancedEditingForm has been removed - all editing now happens in specialized modals

// NodeSelector Component - for creating new nodes
const NodeSelector = ({ isOpen, onClose, onSelect }) => {
  const [selectedNodeType, setSelectedNodeType] = useState(null);

  // When the modal is closed, reset the internal state
  useEffect(() => {
    if (!isOpen) {
      // Add a small delay to allow the closing animation to finish before state reset
      const timer = setTimeout(() => setSelectedNodeType(null), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const nodeTypes = [
    { type: 'topic', label: 'Psychiatric Topic', icon: Brain, color: 'bg-blue-600', description: 'Add a new psychiatric topic or disorder' },
    { type: 'literature', label: 'Literature', icon: BookOpen, color: 'bg-purple-600', description: 'Add research papers, articles, or references' },
    { type: 'case', label: 'Patient Case', icon: Users, color: 'bg-indigo-600', description: 'Add a new patient case study' },
    { type: 'task', label: 'Task', icon: CheckSquare, color: 'bg-amber-600', description: 'Add a task or to-do item' }
  ];

  const handleNodeTypeSelect = (nodeType) => {
    setSelectedNodeType(nodeType);
  };

  const handleFinalSelect = () => {
    onSelect(selectedNodeType);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in-25 duration-300">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all duration-300 ease-out">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {selectedNodeType && (
              <button
                onClick={() => setSelectedNodeType(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <h3 className="text-xl font-semibold text-gray-800">
              {selectedNodeType ? `Create ${selectedNodeType}` : 'Add New Node'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X size={20} />
          </button>
        </div>

        <div className="relative overflow-hidden" style={{ minHeight: '200px' }}>
          {/* View 1: Node Type Selection */}
          <div className={`transition-transform duration-300 ease-in-out ${selectedNodeType ? '-translate-x-full opacity-0' : 'translate-x-0 opacity-100'}`}>
            <div className="space-y-3">
              {nodeTypes.map(({ type, label, icon: Icon, color, description }) => (
                <button
                  key={type}
                  onClick={() => handleNodeTypeSelect(type)}
                  className="w-full flex items-center gap-4 p-4 rounded-lg border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
                >
                  <div className={`${color} p-2 rounded-lg text-white`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">{label}</div>
                    <div className="text-sm text-gray-500">{description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* View 2: Node Creation */}
          <div className={`absolute top-0 left-0 w-full transition-transform duration-300 ease-in-out ${selectedNodeType ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
            {selectedNodeType && (
              <div className="space-y-3">
                {/* Create Blank Option */}
                <button
                  onClick={() => handleFinalSelect()}
                  className="w-full flex items-center gap-4 p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="bg-gray-200 p-2 rounded-lg text-gray-600">
                    <Plus size={20} />
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">Create Blank {selectedNodeType}</div>
                    <div className="text-sm text-gray-500">Start with an empty node.</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Edge Label Modal Component
const EdgeLabelModal = ({ edge, isOpen, onClose, onSave }) => {
  const [label, setLabel] = useState(edge?.label || '');

  // Update label when edge changes
  useEffect(() => {
    setLabel(edge?.label || '');
  }, [edge]);

  const handleSave = () => {
    onSave(edge.id, label);
    onClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen || !edge) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-800">Edit Connection Label</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Connection Label
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter a label for this connection..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            autoFocus
          />
          <p className="text-xs text-gray-500 mt-1">
            Press Enter to save, Escape to cancel
          </p>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Save size={16} />
            Save Label
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced Main Dashboard Component with improved visual effects
const DashboardComponent = () => {
  const navigate = useNavigate(); // Add navigation hook
  
  // D3 will handle node/edge management internally
  const d3SimulationRef = useRef(null);

  // State for forcing node updates
  const [nodeUpdateTrigger, setNodeUpdateTrigger] = useState(0);

  const [mindMapData, setMindMapData] = useState({
    topics: [],
    cases: [],
    tasks: [],
    literature: [],
    connections: []
  });

  const [isEditing, setIsEditing] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [focusedCategory, setFocusedCategory] = useState(null); // Kept for backward compatibility
  const [showNodeSelector, setShowNodeSelector] = useState(false);
  // Specialized modal state for each node type with stable data references
  const [caseModal, setCaseModal] = useState({ isOpen: false, data: null });
  const [topicModal, setTopicModal] = useState({ isOpen: false, data: null });
  const [taskModal, setTaskModal] = useState({ isOpen: false, data: null });
  const caseModalStableData = useRef(null);
  const topicModalStableData = useRef(null);
  const taskModalStableData = useRef(null);
  const [hasAppliedInitialLayout, setHasAppliedInitialLayout] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [edgeModal, setEdgeModal] = useState({ isOpen: false, edge: null });
  const [toasts, setToasts] = useState([]);
  const [literatureModal, setLiteratureModal] = useState({ isOpen: false, data: null });
  const [importModal, setImportModal] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false); // Track animation state
  const [physicsEnabled, setPhysicsEnabled] = useState(true); // Control physics simulation
  const [modalAnimationStates, setModalAnimationStates] = useState({
    case: false,
    topic: false,
    task: false,
    literature: false
  });
  const [connectionManagerOpen, setConnectionManagerOpen] = useState(false);
  const [connectionMode, setConnectionMode] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const addToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now();
    const newToast = { id, message, type, duration };
    setToasts(prev => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const autoSaveMindMapData = useCallback((data) => {
    // Enhanced animation and modal state checking
    const anyModalOpen = caseModal.isOpen || topicModal.isOpen || taskModal.isOpen || literatureModal.isOpen;
    const anyModalAnimating = Object.values(modalAnimationStates).some(state => state);
    const anyModalTransitioning = (caseModal.isOpen && caseModal.data?.isTabTransitioning) || 
                                  (topicModal.isOpen && topicModal.data?.isTabTransitioning) ||
                                  (taskModal.isOpen && taskModal.data?.isTabTransitioning);
    
    if (isAnimating || anyModalOpen || anyModalTransitioning || anyModalAnimating) {
      console.log('Deferring auto-save during animation, modal interaction, or tab transition');
      // Use a longer delay and exponential backoff for persistent animation states
      const delay = anyModalTransitioning || anyModalAnimating ? 2000 : 1000;
      setTimeout(() => autoSaveMindMapData(data), delay);
      return;
    }

    const onSaveStart = () => setIsSaving(true);
    const onSaveComplete = (success, error) => {
      setIsSaving(false);
      if (success) {
        setLastSaved(new Date());
        // Reduce toast frequency during auto-save to prevent UI distractions
        // addToast('Data auto-saved', 'saving', 1000);
      } else {
        addToast('Auto-save failed', 'error', 4000);
        console.error('Auto-save error:', error);
      }
    };

    localStorageUtils.save(data, onSaveStart, onSaveComplete, isAnimating);
    // Use requestIdleCallback for backend saves to avoid blocking animations
    if (window.requestIdleCallback) {
      window.requestIdleCallback(() => {
        // Double-check animation state before backend save
        const stillAnimating = isAnimating || Object.values(modalAnimationStates).some(state => state);
        if (!stillAnimating) {
          saveToBackend(data);
        }
      }, { timeout: 5000 });
    } else {
      setTimeout(() => {
        const stillAnimating = isAnimating || Object.values(modalAnimationStates).some(state => state);
        if (!stillAnimating) {
          saveToBackend(data);
        }
      }, 100); // Longer delay fallback
    }
  }, [addToast, isAnimating, modalAnimationStates, caseModal.isOpen, topicModal.isOpen, taskModal.isOpen, literatureModal.isOpen]);

  // Separate function for position-only updates (more frequent, less critical)
  const autoSavePositionData = useCallback((data) => {
    // Enhanced checks for animation states
    const anyModalOpen = caseModal.isOpen || topicModal.isOpen || taskModal.isOpen || literatureModal.isOpen;
    const anyModalAnimating = Object.values(modalAnimationStates).some(state => state);
    if (isAnimating || anyModalOpen || anyModalAnimating) return;
    
    // Save to localStorage immediately
    localStorageUtils.save(data, null, null, isAnimating);
    
    // Also save to backend with a small delay to batch updates
    clearTimeout(window.positionBackendSaveTimeout);
    window.positionBackendSaveTimeout = setTimeout(() => {
      // Call saveToBackend indirectly to avoid initialization issues
      autoSaveMindMapData(data);
    }, 800); // 800ms delay to batch multiple position changes
  }, [isAnimating, modalAnimationStates, caseModal.isOpen, topicModal.isOpen, taskModal.isOpen, literatureModal.isOpen, autoSaveMindMapData]);

  // Stable data effects to prevent modal re-renders during auto-save
  useEffect(() => {
    if (caseModal.isOpen && caseModal.data) {
      // Store stable reference when modal opens
      caseModalStableData.current = { ...caseModal.data };
    } else if (!caseModal.isOpen) {
      // Clear reference when modal closes
      caseModalStableData.current = null;
    }
  }, [caseModal.isOpen, caseModal.data?.id]);

  useEffect(() => {
    if (topicModal.isOpen && topicModal.data) {
      topicModalStableData.current = { ...topicModal.data };
    } else if (!topicModal.isOpen) {
      topicModalStableData.current = null;
    }
  }, [topicModal.isOpen, topicModal.data?.id]);

  useEffect(() => {
    if (taskModal.isOpen && taskModal.data) {
      taskModalStableData.current = { ...taskModal.data };
    } else if (!taskModal.isOpen) {
      taskModalStableData.current = null;
    }
  }, [taskModal.isOpen, taskModal.data?.id]);

const handleDeleteNode = useCallback((fullNodeId) => {
  // fullNodeId is always in the format `${nodeType}-${id}`
  console.log(`Deleting node with full ID:`, fullNodeId);

  // Extract nodeType and id from fullNodeId
  const [nodeType, ...idParts] = fullNodeId.split('-');
  const nodeId = idParts.join('-');
  const collectionKey = nodeType === 'literature' ? 'literature' : `${nodeType}s`;

  setMindMapData(prevData => {
    // Remove the node from its collection
    const updatedCollection = (prevData[collectionKey] || []).filter(item => String(item.id) !== nodeId);
    // Remove any connections that are attached to the deleted node
    const updatedConnections = (prevData.connections || []).filter(
      conn => conn.source !== fullNodeId && conn.target !== fullNodeId
    );
    const newData = {
      ...prevData,
      [collectionKey]: updatedCollection,
      connections: updatedConnections,
    };
    autoSaveMindMapData(newData);
    addToast(`${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)} deleted.`, 'success');
    return newData;
  });
  
  // D3 will automatically update when mindMapData changes
}, [setMindMapData, autoSaveMindMapData, addToast]);

// Handle literature node click to open modal
const handleLiteratureClick = useCallback((literatureData) => {
  setIsAnimating(true); // Set animation state
  setLiteratureModal({ isOpen: true, data: literatureData });
  // Clear animation state after modal animation completes
  setTimeout(() => setIsAnimating(false), 700); // 600ms modal animation + 100ms buffer
}, []);

// Cytoscape handles node updates automatically

// Trigger auto-sync when mindMapData changes with enhanced detection
useEffect(() => {
  const hasData = mindMapData && (mindMapData.cases?.length > 0 || mindMapData.topics?.length > 0 || 
                                 mindMapData.tasks?.length > 0 || mindMapData.literature?.length > 0);
  
  // Cytoscape handles data conversion internally
}, [mindMapData]);

// Cytoscape handles node updates automatically

  // Cytoscape handles node/edge rendering internally - no conversion needed

  const saveToBackend = useCallback(async (data) => {
    // Deep clone the data to avoid modifying the original
    const cleanData = {
      topics: JSON.parse(JSON.stringify(data.topics || [])),
      cases: JSON.parse(JSON.stringify(data.cases || [])),
      tasks: JSON.parse(JSON.stringify(data.tasks || [])),
      literature: JSON.parse(JSON.stringify(data.literature || [])),
      connections: JSON.parse(JSON.stringify(data.connections || []))
    };
    
    try {
      
      // Current timestamp for created_at/updated_at fields
      const now = new Date().toISOString();
      
      // Clean and validate topics
      cleanData.topics = cleanData.topics.map((topic, index) => {
        // Ensure all required fields exist
        return {
          id: String(topic.id || `${Date.now()}-${index}-topic`),
          title: topic.title || "Untitled Topic",
          description: topic.description || "",
          category: topic.category || "Uncategorized",
          color: topic.color || "#3B82F6",
          position: {
            x: Number(topic.position?.x) || 0,
            y: Number(topic.position?.y) || 0
          },
          flashcard_count: Number(topic.flashcard_count) || 0,
          completed_flashcards: Number(topic.completed_flashcards) || 0,
          resources: Array.isArray(topic.resources) ? topic.resources : [],
          created_at: topic.created_at || now,
          updated_at: now
        };
      });
      
      // Clean and validate cases
      cleanData.cases = cleanData.cases.map((caseItem, index) => {
        // Ensure all required fields exist, handle both camelCase and snake_case
        return {
          id: String(caseItem.id || `${Date.now()}-${index}-case`),
          case_id: caseItem.case_id || `CASE-${Date.now()}-${index}`,
          encounter_date: caseItem.encounter_date || now,
          primary_diagnosis: caseItem.primary_diagnosis || "Unspecified",
          secondary_diagnoses: Array.isArray(caseItem.secondary_diagnoses) ? caseItem.secondary_diagnoses : [],
          age: caseItem.age !== undefined ? Number(caseItem.age) : null,
          gender: caseItem.gender || null,
          // Handle both camelCase (frontend) and snake_case (backend) field names
          chief_complaint: caseItem.chiefComplaint || caseItem.chief_complaint || "",
          initial_presentation: caseItem.initialPresentation || caseItem.initial_presentation || "",
          current_presentation: caseItem.currentPresentation || caseItem.current_presentation || "",
          medication_history: caseItem.medicationHistory || caseItem.medication_history || "",
          therapy_progress: caseItem.therapyProgress || caseItem.therapy_progress || "",
          defense_patterns: caseItem.defensePatterns || caseItem.defense_patterns || "",
          clinical_reflection: caseItem.clinicalReflection || caseItem.clinical_reflection || "",
          history_present_illness: caseItem.history_present_illness || null,
          medical_history: caseItem.medical_history || null,
          medications: Array.isArray(caseItem.medications) ? caseItem.medications : [],
          mental_status_exam: caseItem.mental_status_exam || null,
          assessment_plan: caseItem.assessment_plan || null,
          notes: caseItem.notes || null,
          status: caseItem.status || "active",
          linked_topics: Array.isArray(caseItem.linked_topics) ? caseItem.linked_topics : [],
          position: {
            x: Number(caseItem.position?.x) || 0,
            y: Number(caseItem.position?.y) || 0
          },
          created_at: caseItem.created_at || now,
          updated_at: now
        };
      });
      
      // Clean and validate tasks
      cleanData.tasks = cleanData.tasks.map((task, index) => {
        // Ensure all required fields exist
        return {
          id: String(task.id || `${Date.now()}-${index}-task`),
          title: task.title || "Untitled Task",
          description: task.description || null,
          status: task.status || "pending",
          priority: task.priority || "medium",
          due_date: task.due_date || null,
          linked_case_id: task.linked_case_id || null,
          linked_topic_id: task.linked_topic_id || null,
          position: {
            x: Number(task.position?.x) || 0,
            y: Number(task.position?.y) || 0
          },
          created_at: task.created_at || now,
          updated_at: now
        };
      });
      
      // Clean and validate literature
      cleanData.literature = cleanData.literature.map((lit, index) => {
        // Ensure all required fields exist
        return {
          id: String(lit.id || `${Date.now()}-${index}-lit`),
          title: lit.title || "Untitled Literature",
          authors: lit.authors || null,
          publication: lit.publication || null,
          year: lit.year !== undefined ? Number(lit.year) : null,
          doi: lit.doi || null,
          abstract: lit.abstract || null,
          notes: lit.notes || null,
          pdf_path: lit.pdf_path || null,
          linked_topics: Array.isArray(lit.linked_topics) ? lit.linked_topics : [],
          position: {
            x: Number(lit.position?.x) || 0,
            y: Number(lit.position?.y) || 0
          },
          created_at: lit.created_at || now,
          updated_at: now
        };
      });
      
      // Clean and validate connections
      cleanData.connections = cleanData.connections.map((conn, index) => {
        // For connections, we only need these basic properties
        return {
          id: String(conn.id || `${Date.now()}-${index}-conn`),
          source: conn.source || "",
          target: conn.target || "",
          label: conn.label || ""
        };
      });
      
      // Filter out any items with empty or invalid source/target
      cleanData.connections = cleanData.connections.filter(conn => 
        conn.source && conn.target && 
        typeof conn.source === 'string' && 
        typeof conn.target === 'string' && 
        conn.source.length > 0 && 
        conn.target.length > 0
      );
      
      console.log('Sending cleaned data to backend:', cleanData);
      
      const response = await axios.put(`${API}/mindmap-data`, cleanData, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('Backend save successful:', response.data);
    } catch (err) {
      console.error('Failed to save to backend:', err.response?.data || err.message);
      
      // Log detailed validation errors
      if (err.response?.status === 422 && err.response?.data?.detail) {
        console.error('Validation errors:');
        console.error(JSON.stringify(err.response.data.detail, null, 2));
        
        // Log the request data that caused the error
        console.error('Request data that caused validation error:');
        console.error(JSON.stringify(cleanData, null, 2));
      }
      
      // Don't throw the error to prevent breaking the app
    }
  }, []);

  // Cytoscape handles edge creation via right-click (see CytoscapeGraph component)

  const onNodeClick = useCallback((d3Node) => {
    // D3 node object
    setSelectedNode({ id: d3Node.id, data: d3Node.originalData });
  }, []);

  const onNodeDoubleClick = useCallback((d3Node) => {
    console.log('🔷 App.js onNodeDoubleClick called:', d3Node);
    
    // Handle D3 node - get ID and type
    const nodeId = d3Node.id;
    const parts = nodeId.split('-');
    const type = parts[0];
    const id = parts.slice(1).join('-'); // Join all parts after the first one
    
    console.log('🔷 Parsed:', { nodeId, type, id });
    
    // Prevent multiple rapid clicks by checking if modal is already open
    if (type === 'case' && caseModal.isOpen) {
      console.log('🔷 Case modal already open, returning');
      return;
    }
    if (type === 'topic' && topicModal.isOpen) {
      console.log('🔷 Topic modal already open, returning');
      return;
    }
    if (type === 'task' && taskModal.isOpen) {
      console.log('🔷 Task modal already open, returning');
      return;
    }
    if (type === 'literature' && literatureModal.isOpen) {
      console.log('🔷 Literature modal already open, returning');
      return;
    }
    
    // Route to appropriate specialized modal based on node type
    if (type === 'literature') {
      console.log('🔷 Looking for literature with id:', id, 'in', mindMapData.literature);
      const dataItem = mindMapData.literature?.find(item => String(item.id) === id);
      if (dataItem) {
        console.log('🔷 Opening literature modal with data:', dataItem);
        handleLiteratureClick(dataItem);
      } else {
        console.error('🔷 Literature item not found!');
      }
      return;
    }
    
    if (type === 'case') {
      console.log('🔷 Looking for case with id:', id, 'in', mindMapData.cases);
      const dataItem = mindMapData.cases.find(item => String(item.id) === id);
      if (dataItem) {
        console.log('🔷 Opening case modal with data:', dataItem);
        setModalAnimationStates(prev => ({ ...prev, case: true }));
        setCaseModal({ isOpen: true, data: dataItem });
        setTimeout(() => {
          setModalAnimationStates(prev => ({ ...prev, case: false }));
        }, 800);
      } else {
        console.error('🔷 Case item not found!');
      }
      return;
    }
    
    if (type === 'topic') {
      console.log('🔷 Looking for topic with id:', id, 'in', mindMapData.topics);
      const dataItem = mindMapData.topics.find(item => String(item.id) === id);
      if (dataItem) {
        console.log('🔷 Opening topic modal with data:', dataItem);
        setModalAnimationStates(prev => ({ ...prev, topic: true }));
        setTopicModal({ isOpen: true, data: dataItem });
        setTimeout(() => {
          setModalAnimationStates(prev => ({ ...prev, topic: false }));
        }, 800);
      } else {
        console.error('🔷 Topic item not found!');
      }
      return;
    }
    
    if (type === 'task') {
      console.log('🔷 Looking for task with id:', id, 'in', mindMapData.tasks);
      const dataItem = mindMapData.tasks.find(item => String(item.id) === id);
      if (dataItem) {
        console.log('🔷 Opening task modal with data:', dataItem);
        setModalAnimationStates(prev => ({ ...prev, task: true }));
        setTaskModal({ isOpen: true, data: dataItem });
        setTimeout(() => {
          setModalAnimationStates(prev => ({ ...prev, task: false }));
        }, 800);
      } else {
        console.error('🔷 Task item not found!');
      }
      return;
    }
    
    console.error('🔷 Unknown node type:', type);
  }, [mindMapData, caseModal.isOpen, topicModal.isOpen, taskModal.isOpen, literatureModal.isOpen, handleLiteratureClick]);

  // Cytoscape handles edge interactions internally
  
  // Handle edge label saving (simplified for D3)
  const handleSaveEdgeLabel = useCallback((edgeId, label) => {
    // Update the connections in mindMapData
    setMindMapData(prevData => {
      const updatedConnections = (prevData.connections || []).map(conn => 
        conn.id === edgeId ? { ...conn, label } : conn
      );
      const newData = { ...prevData, connections: updatedConnections };
      autoSaveMindMapData(newData);
      return newData;
    });
    
    addToast('Edge label updated successfully', 'success');
  }, [setMindMapData, autoSaveMindMapData, addToast]);

  // Restart D3 force simulation for realignment
  const forceLayout = useCallback(() => {
    if (window.d3Simulation && window.d3Nodes) {
      // Unfix all nodes so they can be repositioned
      window.d3Nodes.forEach(node => {
        node.fx = null;
        node.fy = null;
      });
      
      // Restart simulation with high alpha for dramatic realignment
      window.d3Simulation.alpha(1).alphaTarget(0).restart();
      addToast('Nodes realigning with force-directed layout...', 'success');
      
      // If physics is disabled, fix nodes after simulation settles
      if (!physicsEnabled) {
        setTimeout(() => {
          if (window.d3Simulation && window.d3Nodes) {
            // Let it run until alpha is low, then stop
            const checkInterval = setInterval(() => {
              if (window.d3Simulation.alpha() < 0.05) {
                clearInterval(checkInterval);
                window.d3Simulation.stop();
                window.d3Nodes.forEach(node => {
                  node.fx = node.x;
                  node.fy = node.y;
                });
                addToast('Realignment complete', 'success');
              }
            }, 100);
          }
        }, 100);
      }
    } else {
      addToast('Simulation not ready', 'warning');
    }
  }, [addToast, physicsEnabled]);

  // applyForceLayout wrapper function (defined after forceLayout)
  const applyForceLayout = useCallback(() => {
    forceLayout();
  }, [forceLayout]);

  const handleClearMap = useCallback(() => {
    if (!window.confirm('Are you sure you want to clear the entire mind map?')) return;

    const empty = { topics: [], cases: [], tasks: [], literature: [], connections: [] };
    setMindMapData(empty);
    
    // D3 will automatically clear when mindMapData updates
    
    setSelectedNode(null);
    // Clear all modal states
    setCaseModal({ isOpen: false, data: null });
    setTopicModal({ isOpen: false, data: null });
    setTaskModal({ isOpen: false, data: null });
    setLiteratureModal({ isOpen: false, data: null });
    setFocusedCategory(null);
    autoSaveMindMapData(empty);
    addToast('Mind map cleared successfully', 'success');
  }, [autoSaveMindMapData, addToast]);

  const addNewNode = useCallback((nodeType) => {
    const dataId = Date.now();
    const id = `${nodeType}-${dataId}`;
    
    // Create node data object with appropriate fields based on type
    let nodeData = { id: dataId, label: `New ${nodeType}` };
    
    // For case nodes, add structured fields
    if (nodeType === 'case') {
      nodeData = {
        ...nodeData,
        chiefComplaint: '',
        initialPresentation: '',
        currentPresentation: '',
        medicationHistory: '',
        therapyProgress: '',
        defensePatterns: '',
        clinicalReflection: ''
      };
    }
    
    // Calculate grid-based position for new nodes to avoid clustering
    // Use current data count instead of nodes.length for more accurate positioning
    const currentDataCount = (mindMapData.topics?.length || 0) + 
                           (mindMapData.cases?.length || 0) + 
                           (mindMapData.tasks?.length || 0) + 
                           (mindMapData.literature?.length || 0);
    
    const gridSize = Math.ceil(Math.sqrt(currentDataCount + 1));
    const nodeSpacing = 280;
    const offsetX = 400; // Offset from left sidebar
    const offsetY = 150; // Offset from top
    
    const gridPosition = {
      x: (currentDataCount % gridSize) * nodeSpacing + offsetX,
      y: Math.floor(currentDataCount / gridSize) * nodeSpacing + offsetY
    };
    
    const newNode = {
      id,
      type: nodeType,
      position: gridPosition,
      data: { ...nodeData, onDelete: () => handleDeleteNode(id) }
    };

    setMindMapData(d => {
      const key = nodeType === 'literature' ? 'literature' : `${nodeType}s`;
      const dataToAdd = { ...newNode.data, position: newNode.position };
      delete dataToAdd.onDelete;
      const updatedData = {
        ...d,
        [key]: [...(d[key] || []), dataToAdd]
      };
      autoSaveMindMapData(updatedData);
      return updatedData;
    });

    // Cytoscape will automatically render the new node when mindMapData updates
    addToast(`${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)} added successfully`, 'success');
  }, [mindMapData, handleDeleteNode, setMindMapData, autoSaveMindMapData, addToast]);

  // Handle spreadsheet import
  const handleSpreadsheetImport = useCallback((patientCases, importStats) => {
    if (!patientCases || patientCases.length === 0) {
      addToast('No patient records to import', 'error');
      return;
    }

    // Calculate grid-based positions for imported nodes
    const currentDataCount = (mindMapData.topics?.length || 0) + 
                           (mindMapData.cases?.length || 0) + 
                           (mindMapData.tasks?.length || 0) + 
                           (mindMapData.literature?.length || 0);
    
    const gridSize = Math.ceil(Math.sqrt(currentDataCount + patientCases.length));
    const nodeSpacing = 280;
    const offsetX = 400;
    const offsetY = 150;

    // Create nodes with unique IDs and positions
    const newCases = patientCases.map((caseData, index) => {
      const dataId = Date.now() + index;
      const gridIndex = currentDataCount + index;
      
      const position = {
        x: (gridIndex % gridSize) * nodeSpacing + offsetX,
        y: Math.floor(gridIndex / gridSize) * nodeSpacing + offsetY
      };

      return {
        ...caseData,
        id: dataId,
        position,
      };
    });

    // Update mind map data
    setMindMapData(d => {
      const updatedData = {
        ...d,
        cases: [...(d.cases || []), ...newCases]
      };
      autoSaveMindMapData(updatedData);
      return updatedData;
    });

    // Cytoscape will automatically render the new nodes when mindMapData updates

    // Show appropriate toast based on import stats
    if (importStats.invalidRows > 0) {
      addToast(
        `Imported ${importStats.validRows} complete and ${importStats.invalidRows} incomplete records. Incomplete nodes are highlighted.`,
        'info'
      );
    } else {
      addToast(`Successfully imported ${importStats.validRows} patient records`, 'success');
    }
  }, [mindMapData, handleDeleteNode, setMindMapData, autoSaveMindMapData, addToast]);

  // Note: handleNodesChange is no longer needed with Cytoscape.js
  // Position changes are handled directly in CytoscapeGraph component via onDataChange callback

  const handleNodeDragStop = useCallback((event, node) => {
    // Debounce the auto-save to prevent excessive backend calls
    // Position updates are already handled in handleNodesChange during dragging
    clearTimeout(window.dragSaveTimeout);
    window.dragSaveTimeout = setTimeout(() => {
      setMindMapData(currentData => {
        autoSaveMindMapData(currentData);
        return currentData;
      });
    }, 500);
  }, [autoSaveMindMapData]);

  const loadMindMapData = useCallback(async () => {
    setLoading(true);
    setLoadingProgress(10);
    setLoadingMessage('Checking local data...');
    
    try {
      // First, try loading from localStorage for instant startup
      const local = localStorageUtils.load();
      if (local) {
        setLoadingProgress(30);
        setLoadingMessage('Loading from cache...');
        
        if (!local.connections) local.connections = [];
        setMindMapData(local);
        
        setLoadingProgress(60);
        setLoadingMessage('Applying layout...');
        
        // Cytoscape.js handles data conversion automatically
        
        setLoadingProgress(90);
        setLoadingMessage('Finalizing...');
        
        setLoading(false);
        setIsInitialLoad(false);
        setLoadingProgress(100);
        
        // Background sync with backend without blocking UI
        setTimeout(async () => {
          try {
            const response = await axios.get(`${API}/mindmap-data`);
            if (JSON.stringify(response.data) !== JSON.stringify(local)) {
              // Only update if data has changed
              if (!response.data.connections) response.data.connections = [];
              setMindMapData(response.data);
              // Cytoscape.js handles data conversion automatically
              autoSaveMindMapData(response.data);
              addToast('Data synchronized with server', 'info');
            }
          } catch (err) {
            console.warn('Background sync failed:', err);
          }
        }, 500);
        
        return;
      }

      // If no local data, load from backend
      setLoadingProgress(20);
      setLoadingMessage('Loading from server...');
      
      try {
        const response = await axios.get(`${API}/mindmap-data`);
        if (!response.data.connections) response.data.connections = [];
        
        setLoadingProgress(50);
        setLoadingMessage('Processing data...');
        
        setMindMapData(response.data);
        
        setLoadingProgress(80);
        setLoadingMessage('Rendering graph...');
        
        // Cytoscape will handle rendering
        autoSaveMindMapData(response.data);
        
        setLoadingProgress(100);
        setLoading(false);
        setIsInitialLoad(false);
      } catch (backendError) {
        console.warn('Backend loading failed, populating with sample data:', backendError);
        
        // If backend fails, populate with sample data for better UX
        setLoadingProgress(60);
        setLoadingMessage('Loading sample data...');
        
        // Populate sample data
        const emptyData = { topics: [], cases: [], tasks: [], literature: [], connections: [] };
        
        setMindMapData(emptyData);
        
        // Populate sample data
        setTimeout(() => {
          populateSampleLiteratureData(setMindMapData, autoSaveMindMapData, addToast);
        }, 100);
        
        setLoadingProgress(100);
        setLoading(false);
        setIsInitialLoad(false);
      }
    } catch (err) {
      console.error('Error loading mind map:', err);
      addToast('Failed to load mind map', 'error');
      setLoading(false);
      setIsInitialLoad(false);
    }
  }, [addToast, autoSaveMindMapData]);

  useEffect(() => {
    // Load initial mind map data
    loadMindMapData();
  }, []); // Run only once on mount

  // Helper function to check if a node matches the search query
  const nodeMatchesSearch = useCallback((node, query) => {
    // Guard against null/undefined node
    if (!node || !node.id || !node.data) return false;
    
    // Return early if no query
    if (!query) return true;
    
    // Normalize and trim query
    const searchTerm = query.toLowerCase().trim();
    if (!searchTerm) return true;
    
    try {
      // Safely extract node type and ID
      const parts = node.id.split('-');
      const nodeType = parts.length > 0 ? parts[0] : '';
      const nodeId = parts.length > 1 ? parts[1] : '';
      
      // Start with no match
      let hasMatch = false;
      
      // 1. Basic title/label matching - most common searches
      if (!hasMatch && node.data.label) {
        const label = node.data.label.toLowerCase();
        hasMatch = label.includes(searchTerm);
      }
      
      // 2. Node type matching
      if (!hasMatch && nodeType) {
        hasMatch = nodeType.includes(searchTerm);
      }
      
      // 3. Case ID pattern matching for case nodes
      if (!hasMatch && nodeType === 'case' && nodeId) {
        hasMatch = (`case-${nodeId}`).toLowerCase().includes(searchTerm);
      }
      
      // 4. Type-specific content matching
      if (!hasMatch) {
        if (nodeType === 'case') {
          const diagnosis = (node.data.primary_diagnosis || node.data.primaryDiagnosis || '').toLowerCase();
          hasMatch = diagnosis.includes(searchTerm);
        } else if (nodeType === 'topic') {
          const title = (node.data.title || '').toLowerCase();
          hasMatch = title.includes(searchTerm);
        } else if (nodeType === 'literature') {
          const title = (node.data.title || '').toLowerCase();
          const authors = (node.data.authors || '').toLowerCase();
          hasMatch = title.includes(searchTerm) || authors.includes(searchTerm);
        }
      }
      
      // 5. Psychiatric category matching for all node types
      if (!hasMatch && node.data.category) {
        const category = node.data.category.toLowerCase();
        hasMatch = category.includes(searchTerm);
      }
      
      return hasMatch;
    } catch (error) {
      console.error('Error in nodeMatchesSearch for node:', node.id, error);
      return false;
    }
  }, []);

  // Connection management handlers
  const handleCreateConnection = useCallback((sourceId, targetId, type = 'related') => {
    // Check if connection already exists
    const exists = mindMapData.connections.some(conn => 
      (conn.source === sourceId && conn.target === targetId) ||
      (conn.source === targetId && conn.target === sourceId)
    );
    
    if (exists) {
      addToast('Connection already exists', 'warning');
      return;
    }
    
    const newConnection = {
      id: `conn-${Date.now()}`,
      source: sourceId,
      target: targetId,
      type: type
    };
    
    setMindMapData(prevData => {
      const updatedData = {
        ...prevData,
        connections: [...prevData.connections, newConnection]
      };
      autoSaveMindMapData(updatedData);
      return updatedData;
    });
    
    addToast('Connection created successfully', 'success');
  }, [mindMapData, autoSaveMindMapData, addToast]);

  const handleDeleteConnection = useCallback((connectionId) => {
    setMindMapData(prevData => {
      const updatedData = {
        ...prevData,
        connections: prevData.connections.filter(conn => 
          (conn.id || `${conn.source}-${conn.target}`) !== connectionId
        )
      };
      autoSaveMindMapData(updatedData);
      return updatedData;
    });
    
    addToast('Connection deleted', 'info');
  }, [autoSaveMindMapData, addToast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Only trigger shortcuts when not typing in input fields
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;
      
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'n':
            event.preventDefault();
            setShowNodeSelector(true);
            break;
          case 'e':
            event.preventDefault();
            setIsEditing(!isEditing);
            break;
          case 'r':
            event.preventDefault();
            applyForceLayout();
            break;
          case 'f':
            event.preventDefault();
            // Focus the search box
            document.querySelector('input[type="text"][placeholder*="Search"]')?.focus();
            break;
          case 'l':
            event.preventDefault();
            setConnectionManagerOpen(true);
            break;
          case 'c':
            event.preventDefault();
            setConnectionMode(!connectionMode);
            break;
          default:
            break;
        }
      }
      
      if (event.key === 'Escape') {
        // Exit connection mode first if active
        if (connectionMode) {
          setConnectionMode(false);
          return;
        }
        
        setSelectedNode(null);
        // Close all modals
        setCaseModal({ isOpen: false, data: null });
        setTopicModal({ isOpen: false, data: null });
        setTaskModal({ isOpen: false, data: null });
        setLiteratureModal({ isOpen: false, data: null });
        setShowNodeSelector(false);
        
        // Clear search if no modals are open
        if (!caseModal.isOpen && !topicModal.isOpen && !taskModal.isOpen && 
            !literatureModal.isOpen && !showNodeSelector) {
          // Search functionality removed
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [applyForceLayout, caseModal, topicModal, taskModal, literatureModal, connectionMode]);

  useEffect(() => {
    // Layout handled by Cytoscape internally
  }, []);

  // Search/filter functionality to be reimplemented with Cytoscape
  // TODO: Add Cytoscape-based search and filtering
  
  // Note: Search/filter styling now handled by Cytoscape.js directly

  // Optionally: handle layout setup on first render if needed

  // Create nodes array for modals from mindMapData (MUST be before conditional return)
  const allNodesForModals = useMemo(() => {
    const nodes = [];
    
    // Add topic nodes
    if (mindMapData.topics) {
      mindMapData.topics.forEach(topic => {
        nodes.push({
          id: `topic-${topic.id}`,
          type: 'topic',
          data: topic
        });
      });
    }
    
    // Add case nodes
    if (mindMapData.cases) {
      mindMapData.cases.forEach(caseItem => {
        nodes.push({
          id: `case-${caseItem.id}`,
          type: 'case',
          data: caseItem
        });
      });
    }
    
    // Add task nodes
    if (mindMapData.tasks) {
      mindMapData.tasks.forEach(task => {
        nodes.push({
          id: `task-${task.id}`,
          type: 'task',
          data: task
        });
      });
    }
    
    // Add literature nodes
    if (mindMapData.literature) {
      mindMapData.literature.forEach(lit => {
        nodes.push({
          id: `literature-${lit.id}`,
          type: 'literature',
          data: lit
        });
      });
    }
    
    return nodes;
  }, [mindMapData]);

  // Show optimized loading screen during initial load
  if (loading) {
    return <OptimizedLoadingScreen message={loadingMessage} progress={loadingProgress} />;
  }

  // Sophisticated Animation Variants (matching Literature modal quality)
  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.3,
      y: 50,
      rotate: -5,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      rotate: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300,
        duration: 0.6,
      }
    },
    exit: {
      opacity: 0,
      scale: 0.7,
      y: 30,
      rotate: -3,
      transition: {
        type: "easeInOut",
        duration: 0.4,
      }
    }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.4 }
    }
  };

  const contentVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "easeOut",
        duration: 0.3,
        delay: 0.1,
      }
    },
    exit: {
      opacity: 0,
      y: -10,
      scale: 1.02,
      transition: {
        type: "easeIn",
        duration: 0.2,
      }
    }
  };

  const buttonVariants = {
    inactive: {
      scale: 1,
    },
    active: {
      scale: 1.05,
      transition: {
        type: "spring",
        damping: 20,
        stiffness: 300,
      }
    },
    hover: {
      scale: 1.03,
      transition: {
        type: "easeOut",
        duration: 0.2,
      }
    }
  };

  // All modal components are now imported from separate files

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* --- Left Sidebar --- */}
      <div className="w-80 bg-gradient-to-b from-slate-800 to-slate-900 text-white p-6 shadow-2xl flex flex-col">
        <div className="mb-8">
          <div className="text-3xl font-bold tracking-wide text-white">PGY-3 HQ</div>
          <div className="text-sm text-slate-300 mt-2">Psychiatry Resident Dashboard</div>
          <div className="mt-2 text-xs text-slate-400 font-mono">v0.6.0 - Visual Clarity</div>
          <div className="mt-3 px-3 py-2 bg-amber-500/20 border border-amber-400/30 rounded-lg">
            <div className="text-xs font-semibold text-amber-300">⚠️ DEVELOPMENT MODE</div>
            <div className="text-xs text-amber-200 mt-1">Training data only</div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 bg-slate-700 text-white placeholder-slate-400 rounded-lg border border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition-all text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
          {searchQuery && (
            <div className="mt-2 text-xs text-slate-400 px-2">
              Showing results for: <span className="text-blue-400 font-medium">"{searchQuery}"</span>
            </div>
          )}
        </div>

        {/* Home Button */}
        <motion.button
          onClick={() => navigate('/')}
          className="w-full p-3 mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg transition-all duration-300 flex items-center space-x-3 group"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="font-medium">Return to Home</span>
        </motion.button>

        {/* --- Category Filters --- */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Filter by Category</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-2 rounded-lg text-xs transition-all flex items-center justify-between ${
                activeFilter === 'all'
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/50'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <span>All</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                activeFilter === 'all' 
                  ? 'bg-teal-700 text-teal-100' 
                  : 'bg-slate-600 text-slate-400'
              }`}>
                {mindMapData.topics.length + mindMapData.cases.length + mindMapData.tasks.length + mindMapData.literature.length}
              </span>
            </button>
            <button
              onClick={() => setActiveFilter('topic')}
              className={`px-3 py-2 rounded-lg text-xs transition-all flex items-center justify-between ${
                activeFilter === 'topic'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/50'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <div className="flex items-center gap-1">
                <Brain size={12} />
                <span>Topics</span>
              </div>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                activeFilter === 'topic' 
                  ? 'bg-blue-700 text-blue-100' 
                  : 'bg-slate-600 text-slate-400'
              }`}>
                {mindMapData.topics.length}
              </span>
            </button>
            <button
              onClick={() => setActiveFilter('case')}
              className={`px-3 py-2 rounded-lg text-xs transition-all flex items-center justify-between ${
                activeFilter === 'case'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/50'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <div className="flex items-center gap-1">
                <Users size={12} />
                <span>Cases</span>
              </div>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                activeFilter === 'case' 
                  ? 'bg-indigo-700 text-indigo-100' 
                  : 'bg-slate-600 text-slate-400'
              }`}>
                {mindMapData.cases.length}
              </span>
            </button>
            <button
              onClick={() => setActiveFilter('task')}
              className={`px-3 py-2 rounded-lg text-xs transition-all flex items-center justify-between ${
                activeFilter === 'task'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/50'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <div className="flex items-center gap-1">
                <CheckSquare size={12} />
                <span>Tasks</span>
              </div>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                activeFilter === 'task' 
                  ? 'bg-amber-700 text-amber-100' 
                  : 'bg-slate-600 text-slate-400'
              }`}>
                {mindMapData.tasks.length}
              </span>
            </button>
            <button
              onClick={() => setActiveFilter('literature')}
              className={`px-3 py-2 rounded-lg text-xs transition-all flex items-center justify-between ${
                activeFilter === 'literature'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/50'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <div className="flex items-center gap-1">
                <BookOpen size={12} />
                <span>Literature</span>
              </div>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                activeFilter === 'literature' 
                  ? 'bg-purple-700 text-purple-100' 
                  : 'bg-slate-600 text-slate-400'
              }`}>
                {mindMapData.literature.length}
              </span>
            </button>
          </div>
        </div>

        {/* --- Auto-save Status --- */}
        <div className="mb-4 p-3 bg-slate-700 bg-opacity-50 rounded-lg">
          <div className="flex items-center gap-2 text-xs">
            {isSaving ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                <span className="text-amber-300">Saving...</span>
              </>
            ) : lastSaved ? (
              <>
                <CheckCircle size={12} className="text-green-400" />
                <span className="text-slate-300">
                  Last saved: {lastSaved.toLocaleTimeString()}
                </span>
              </>
            ) : (
              <>
                <Cloud size={12} className="text-slate-400" />
                <span className="text-slate-400">Auto-save enabled</span>
              </>
            )}
          </div>
        </div>

        {/* --- Controls --- */}
        <div className="space-y-3 mb-6">
          <LoadingButton 
            onClick={() => setPhysicsEnabled(!physicsEnabled)} 
            icon={Zap} 
            className={`w-full px-4 py-2 rounded-md text-sm ${
              physicsEnabled 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
          >
            {physicsEnabled ? 'Physics: ON' : 'Physics: OFF'}
          </LoadingButton>
          <LoadingButton 
            onClick={() => setConnectionMode(!connectionMode)} 
            icon={Link2} 
            className={`w-full px-4 py-2 rounded-md text-sm ${
              connectionMode 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                : 'bg-slate-600 hover:bg-slate-700 text-white'
            }`}
          >
            {connectionMode ? 'Connect: ON' : 'Connect: OFF'}
          </LoadingButton>
          <LoadingButton onClick={applyForceLayout} icon={Shuffle} className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm">
            Realign Nodes (Dagre)
          </LoadingButton>
          <LoadingButton 
            onClick={() => populateSampleLiteratureData(setMindMapData, autoSaveMindMapData, addToast)} 
            icon={BookOpen} 
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-sm"
          >
            Add Sample Literature
          </LoadingButton>
          <LoadingButton 
            onClick={() => setConnectionManagerOpen(true)} 
            icon={Link2} 
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-md text-sm"
          >
            Manage Connections
          </LoadingButton>
          
          {/* Individual Node Creation Buttons */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Add Nodes</div>
            <LoadingButton 
              onClick={() => addNewNode('topic')} 
              icon={Brain} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm flex items-center gap-2"
            >
              <Brain size={16} />
              Add Topic
            </LoadingButton>
            <LoadingButton 
              onClick={() => addNewNode('case')} 
              icon={Users} 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm flex items-center gap-2"
            >
              <Users size={16} />
              Add Case
            </LoadingButton>
            <LoadingButton 
              onClick={() => addNewNode('task')} 
              icon={CheckSquare} 
              className="w-full bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md text-sm flex items-center gap-2"
            >
              <CheckSquare size={16} />
              Add Task
            </LoadingButton>
            <LoadingButton 
              onClick={() => addNewNode('literature')} 
              icon={BookOpen} 
              className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm flex items-center gap-2"
            >
              <BookOpen size={16} />
              Add Literature
            </LoadingButton>
            <LoadingButton 
              onClick={() => setImportModal(true)} 
              icon={FileSpreadsheet} 
              className="w-full bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md text-sm flex items-center gap-2"
            >
              <FileSpreadsheet size={16} />
              Import Patients
            </LoadingButton>
          </div>
          
          <LoadingButton onClick={handleClearMap} icon={Trash2} className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm">
            Clear All Data
          </LoadingButton>
        </div>

        {/* --- Selected Node Panel --- */}
        {selectedNode && (
          <div className="mt-auto p-4 bg-slate-700 bg-opacity-50 rounded-lg">
            <h3 className="text-sm font-semibold text-slate-300 mb-2">Selected Node</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {selectedNode.type === 'topic' && <Brain size={14} className="text-blue-400" />}
                {selectedNode.type === 'case' && <Users size={14} className="text-indigo-400" />}
                {selectedNode.type === 'task' && <CheckSquare size={14} className="text-amber-400" />}
                {selectedNode.type === 'literature' && <BookOpen size={14} className="text-purple-400" />}
                <span className="text-sm text-white font-medium truncate">
                  {selectedNode.data.label}
                </span>
              </div>
              {selectedNode.data.category && (
                <div className="text-xs text-slate-400">
                  Category: {selectedNode.data.category}
                </div>
              )}
              {selectedNode.data.status && (
                <div className="text-xs text-slate-400">
                  Status: {selectedNode.data.status}
                </div>
              )}
              <button
                onClick={() => {
                  const [type, id] = selectedNode.id.split('-');
                  const key = type === 'literature' ? 'literature' : `${type}s`;
                  const dataItem = mindMapData[key].find(item => String(item.id) === id);
                  if (dataItem) {
                    // Route to appropriate specialized modal
                    if (type === 'case') {
                      setCaseModal({ isOpen: true, data: dataItem });
                    } else if (type === 'topic') {
                      setTopicModal({ isOpen: true, data: dataItem });
                    } else if (type === 'task') {
                      setTaskModal({ isOpen: true, data: dataItem });
                    } else if (type === 'literature') {
                      handleLiteratureClick(dataItem);
                    }
                  }
                }}
                className="w-full mt-2 px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white text-xs rounded-lg transition-colors flex items-center gap-2"
              >
                <Eye size={12} />
                View Details
              </button>
            </div>
          </div>
        )}

        {/* --- Keyboard Shortcuts Help --- */}
        {!selectedNode && (
          <div className="mt-auto p-3 bg-slate-700 bg-opacity-30 rounded-lg">
            <h4 className="text-xs font-semibold text-slate-300 mb-2">Keyboard Shortcuts</h4>
            <div className="space-y-1 text-xs text-slate-400">
              <div>Ctrl+N - Add Node</div>
              <div>Ctrl+E - Toggle Edit Mode</div>
              <div>Ctrl+R - Realign Nodes</div>
              <div>Esc - Clear Selection</div>
            </div>
          </div>
        )}
      </div>

      {/* --- Main Mind Map Workspace --- */}
      <div className="flex-1 relative">
        <D3Graph
          mindMapData={mindMapData}
          activeFilter={activeFilter}
          searchQuery={searchQuery}
          onNodeClick={onNodeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          onDataChange={(change) => {
            if (change.type === 'position') {
              // Single node position update (during drag)
              requestAnimationFrame(() => {
                setMindMapData(currentData => {
                  const updatedData = { ...currentData };
                  const key = change.nodeType === 'literature' ? 'literature' : `${change.nodeType}s`;
                  const item = updatedData[key]?.find(i => String(i.id) === change.nodeId);
                  if (item) {
                    item.position = change.position;
                  }
                  localStorageUtils.save(updatedData);
                  return updatedData;
                });
              });
            } else if (change.type === 'positions') {
              // Batch position update
              setMindMapData(currentData => {
                const updatedData = { ...currentData };
                Object.entries(change.positions).forEach(([nodeId, position]) => {
                  const [type, ...idParts] = nodeId.split('-');
                  const id = idParts.join('-');
                  const key = type === 'literature' ? 'literature' : `${type}s`;
                  const item = updatedData[key]?.find(i => String(i.id) === id);
                  if (item) {
                    item.position = position;
                  }
                });
                autoSaveMindMapData(updatedData);
                return updatedData;
              });
            } else if (change.type === 'connections') {
              // Update connections in mindMapData
              setMindMapData(currentData => {
                const updatedData = { ...currentData, connections: change.connections };
                autoSaveMindMapData(updatedData);
                return updatedData;
              });
            } else if (change.type === 'deleteConnection') {
              // Delete connection
              handleDeleteConnection(change.connectionId);
            }
          }}
          physicsEnabled={physicsEnabled}
          connectionMode={connectionMode}
          onConnectionCreate={handleCreateConnection}
        />
        
        {/* Connection Mode Indicator */}
        {connectionMode && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 z-10"
          >
            <Link2 className="w-5 h-5 animate-pulse" />
            <div>
              <div className="font-semibold">Connection Mode Active</div>
              <div className="text-xs text-emerald-100">Click two nodes to connect them • Click connections to delete • Press Esc to exit</div>
            </div>
          </motion.div>
        )}
      </div>
      
      {/* --- Modals --- */}
      {/* Literature Modal */}
      {literatureModal.isOpen && (
        <LiteratureModal
          isOpen={literatureModal.isOpen}
          onClose={() => {
            setIsAnimating(true); // Set animation state for closing
            setLiteratureModal({ isOpen: false, data: null });
            // Clear animation state after modal close animation completes
            setTimeout(() => setIsAnimating(false), 500); // 400ms close animation + 100ms buffer
          }}
          onAnimationStart={() => setIsAnimating(true)}
          onAnimationEnd={() => setIsAnimating(false)}
          literatureData={literatureModal.data}
          allNodes={allNodesForModals}
          connections={mindMapData.connections || []}
          setMindMapData={setMindMapData}
          autoSaveMindMapData={autoSaveMindMapData}
          addToast={addToast}
        />
      )}
      {/* Specialized Modals with optimized rendering */}
      <AnimatePresence mode="wait">
        {caseModal.isOpen && (
          <CaseModal 
            key={`case-modal-${caseModal.data?.id || 'default'}`}
            isOpen={caseModal.isOpen} 
            data={caseModalStableData.current || caseModal.data} 
            onClose={() => {
              setModalAnimationStates(prev => ({ ...prev, case: true }));
              setCaseModal({ isOpen: false, data: null });
            }}
            onAnimationStart={() => {
              setIsAnimating(true);
              setModalAnimationStates(prev => ({ ...prev, case: true }));
            }}
            onAnimationEnd={() => {
              setIsAnimating(false);
              setModalAnimationStates(prev => ({ ...prev, case: false }));
            }}
            allNodes={allNodesForModals}
            connections={mindMapData.connections || []}
            setMindMapData={setMindMapData}
            autoSaveMindMapData={autoSaveMindMapData}
            addToast={addToast}
          />
        )}
      </AnimatePresence>
      
      <AnimatePresence mode="wait">
        {topicModal.isOpen && (
          <TopicModal 
            key={`topic-modal-${topicModal.data?.id || 'default'}`}
            isOpen={topicModal.isOpen} 
            data={topicModalStableData.current || topicModal.data} 
            onClose={() => {
              setModalAnimationStates(prev => ({ ...prev, topic: true }));
              setTopicModal({ isOpen: false, data: null });
            }}
            onAnimationStart={() => {
              setIsAnimating(true);
              setModalAnimationStates(prev => ({ ...prev, topic: true }));
            }}
            onAnimationEnd={() => {
              setIsAnimating(false);
              setModalAnimationStates(prev => ({ ...prev, topic: false }));
            }}
            allNodes={allNodesForModals}
            connections={mindMapData.connections || []}
            setMindMapData={setMindMapData}
            autoSaveMindMapData={autoSaveMindMapData}
            addToast={addToast}
            forceNodeUpdate={() => setNodeUpdateTrigger(prev => prev + 1)}
          />
        )}
      </AnimatePresence>
      
      <AnimatePresence mode="wait">
        {taskModal.isOpen && (
          <TaskModal 
            key={`task-modal-${taskModal.data?.id || 'default'}`}
            isOpen={taskModal.isOpen} 
            data={taskModalStableData.current || taskModal.data} 
            onClose={() => {
              setModalAnimationStates(prev => ({ ...prev, task: true }));
              setTaskModal({ isOpen: false, data: null });
            }}
            onAnimationStart={() => {
              setIsAnimating(true);
              setModalAnimationStates(prev => ({ ...prev, task: true }));
            }}
            onAnimationEnd={() => {
              setIsAnimating(false);
              setModalAnimationStates(prev => ({ ...prev, task: false }));
            }}
            setMindMapData={setMindMapData}
            autoSaveMindMapData={autoSaveMindMapData}
            addToast={addToast}
          />
        )}
      </AnimatePresence>

      <ImportSpreadsheetModal
        isOpen={importModal}
        onClose={() => setImportModal(false)}
        onImport={handleSpreadsheetImport}
        addToast={addToast}
      />

      <EdgeLabelModal 
        isOpen={edgeModal.isOpen} 
        edge={edgeModal.edge} 
        onClose={() => setEdgeModal({ isOpen: false, edge: null })} 
        onSave={handleSaveEdgeLabel} 
      />

      <ConnectionManager
        isOpen={connectionManagerOpen}
        onClose={() => setConnectionManagerOpen(false)}
        nodes={[
          ...mindMapData.topics.map(t => ({ id: `topic-${t.id}`, label: t.label, type: 'topic' })),
          ...mindMapData.cases.map(c => ({ id: `case-${c.id}`, label: c.primary_diagnosis || c.case_id || 'Untitled Case', type: 'case' })),
          ...mindMapData.tasks.map(t => ({ id: `task-${t.id}`, label: t.title, type: 'task' })),
          ...mindMapData.literature.map(l => ({ id: `literature-${l.id}`, label: l.title, type: 'literature' }))
        ]}
        connections={mindMapData.connections}
        onCreateConnection={handleCreateConnection}
        onDeleteConnection={handleDeleteConnection}
      />

      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
          <Loader2 size={48} className="animate-spin text-blue-600" />
        </div>
      )}
      
      {/* Toast Notification Container with AnimatePresence */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        <AnimatePresence mode="sync">
          {toasts.map(toast => (
            <Toast
              key={toast.id}
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Error Boundary for React Flow
class ReactFlowErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Check if it's a React Flow dimension error
    if (error.message && error.message.includes('dimensions')) {
      console.warn('React Flow dimension error caught, recovering...');
      return { hasError: false }; // Don't show error, just recover
    }
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    if (error.message && error.message.includes('dimensions')) {
      // For dimension errors, try to recover
      setTimeout(() => {
        if (window.reactFlowInstance) {
          window.reactFlowInstance.fitView();
        }
      }, 100);
      return;
    }
    console.error('React Flow Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Mind Map Temporarily Unavailable</h3>
            <p className="text-gray-600 mb-4">There was an issue with the mind map. Please refresh the page.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const Dashboard = () => <DashboardComponent />;

// Main App Component with Routing
function App() {
  return (
    <Router>
      <AppRouter />
    </Router>
  );
}

// App Router Component 
const AppRouter = () => {
  const navigate = useNavigate();
  const [showMapOptions, setShowMapOptions] = useState(false);
  
  // Check if there's existing data
  const hasExistingData = mapStorageUtils.hasExistingData();
  const mapStats = mapStorageUtils.getMapStats();
  
  // Handle creating new map
  const handleCreateNew = useCallback(() => {
    if (hasExistingData) {
      // Show options modal if there's existing data
      setShowMapOptions(true);
    } else {
      // Navigate directly to dashboard if no existing data
      navigate('/dashboard');
    }
  }, [hasExistingData, navigate]);
  
  // Handle opening existing map
  const handleOpenExisting = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);
  
  // Handle clearing data and starting fresh
  const handleClearData = useCallback(() => {
    mapStorageUtils.clearMapData();
    navigate('/dashboard');
  }, [navigate]);
  
  // Handle exporting data
  const handleExportData = useCallback(() => {
    mapStorageUtils.exportMapData();
  }, []);

  return (
    <>
      <Routes>
        <Route 
          path="/" 
          element={
            <HomeScreen 
              onCreateNew={handleCreateNew}
              onOpenExisting={handleOpenExisting}
              hasExistingData={hasExistingData}
            />
          } 
        />
        <Route 
          path="/dashboard" 
          element={<Dashboard />} 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {/* Map Options Modal */}
      <MapOptionsModal
        isOpen={showMapOptions}
        onClose={() => setShowMapOptions(false)}
        onClearData={handleClearData}
        onExportData={handleExportData}
        mapStats={mapStats}
      />
    </>
  );
};

export default App;