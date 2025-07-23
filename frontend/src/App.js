import React, { useState, useEffect, useCallback, useRef, useMemo, Suspense, lazy } from 'react';
import '@xyflow/react/dist/style.css';
import './App.css';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ReactFlow,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  Panel,
  Handle,
  Position,
  useReactFlow,
} from '@xyflow/react';

// Lazy load heavy D3 dependencies
const loadD3Force = () => import('d3-force');
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
  Search, // Added for global search functionality
  Heart,
  Bookmark,
  User,
  Clipboard,
  StickyNote,
  Paperclip,
  ChevronDown,
  ChevronUp,
  ArrowDown
} from 'lucide-react';

// Lazy load components for better initial load time
import { RichTextEditor, TemplateManager, LiteratureModal } from './components/LazyComponents';
import CaseModal from './components/CaseModal';
import TopicModal from './components/TopicModal';
import TaskModal from './components/TaskModal';
import FloatingEdge from './components/FloatingEdge'; // Import the custom FloatingEdge component
import EnhancedEdge from './components/EnhancedEdge'; // Import the enhanced edge component
import ConnectionLine from './components/ConnectionLine'; // Import the custom connection line for previews
import OptimizedLoadingScreen from './components/OptimizedLoadingScreen';

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

// Toast Notification System
const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const getToastStyles = () => {
    const baseStyles = "fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transition-all duration-500 transform";
    const typeStyles = {
      success: "bg-green-600 text-white border-l-4 border-green-400",
      error: "bg-red-600 text-white border-l-4 border-red-400",
      info: "bg-blue-600 text-white border-l-4 border-blue-400",
      saving: "bg-purple-600 text-white border-l-4 border-purple-400"
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
    <div className={getToastStyles()}>
      <div className="flex items-center">
        {getIcon()}
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-4 text-white hover:text-gray-200 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
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

// Enhanced CSV export utilities
const csvUtils = {
  generatePatientCasesCSV: (cases, onProgress) => {
    if (!cases || cases.length === 0) {
      return '';
    }

    if (onProgress) onProgress(10, 'Preparing headers...');

    // Enhanced CSV headers with more detailed information
    const headers = [
      'Case ID',
      'Encounter Date',
      'Primary Diagnosis',
      'Secondary Diagnoses',
      'Age',
      'Gender',
      'Chief Complaint',
      'History of Present Illness',
      'Medical History',
      'Medications',
      'Mental Status Exam',
      'Assessment & Plan',
      'Status',
      'Notes',
      'Created Date',
      'Updated Date',
      'Linked Topics Count',
      'Last Modified By'
    ];

    if (onProgress) onProgress(30, 'Processing case data...');

    // Convert cases to CSV rows with enhanced data
    const rows = cases.map((caseItem, index) => {
      if (onProgress) onProgress(30 + (index / cases.length) * 50, `Processing case ${index + 1}/${cases.length}...`);

      return [
        caseItem.case_id || '',
        caseItem.encounter_date ? new Date(caseItem.encounter_date).toLocaleDateString() : '',
        caseItem.primary_diagnosis || '',
        Array.isArray(caseItem.secondary_diagnoses) ? caseItem.secondary_diagnoses.join('; ') : '',
        caseItem.age || '',
        caseItem.gender || '',
        caseItem.chief_complaint || '',
        caseItem.history_present_illness || '',
        caseItem.medical_history || '',
        Array.isArray(caseItem.medications) ? caseItem.medications.join('; ') : '',
        caseItem.mental_status_exam || '',
        caseItem.assessment_plan || '',
        caseItem.status || '',
        caseItem.notes || '',
        caseItem.created_at ? new Date(caseItem.created_at).toLocaleDateString() : '',
        caseItem.updated_at ? new Date(caseItem.updated_at).toLocaleDateString() : '',
        Array.isArray(caseItem.linked_topics) ? caseItem.linked_topics.length : '0',
        'PGY-3 System'
      ];
    });

    if (onProgress) onProgress(85, 'Formatting CSV content...');

    // Escape CSV values and join
    const escapeCsvValue = (value) => {
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const csvContent = [
      headers.map(escapeCsvValue).join(','),
      ...rows.map(row => row.map(escapeCsvValue).join(','))
    ].join('\n');

    if (onProgress) onProgress(100, 'CSV generation complete!');

    return csvContent;
  },

  downloadCSV: (csvContent, filename = 'patient_cases.csv') => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  },

  // Generate summary statistics
  generateCasesSummary: (cases) => {
    if (!cases || cases.length === 0) return null;

    const diagnoses = {};
    const statuses = {};
    const ageGroups = { '18-30': 0, '31-50': 0, '51-70': 0, '70+': 0, 'Unknown': 0 };
    const genders = {};

    cases.forEach(caseItem => {
      // Diagnoses
      if (caseItem.primary_diagnosis) {
        diagnoses[caseItem.primary_diagnosis] = (diagnoses[caseItem.primary_diagnosis] || 0) + 1;
      }

      // Status
      if (caseItem.status) {
        statuses[caseItem.status] = (statuses[caseItem.status] || 0) + 1;
      }

      // Age groups
      if (caseItem.age) {
        if (caseItem.age <= 30) ageGroups['18-30']++;
        else if (caseItem.age <= 50) ageGroups['31-50']++;
        else if (caseItem.age <= 70) ageGroups['51-70']++;
        else ageGroups['70+']++;
      } else {
        ageGroups['Unknown']++;
      }

      // Gender
      if (caseItem.gender) {
        genders[caseItem.gender] = (genders[caseItem.gender] || 0) + 1;
      }
    });

    return {
      totalCases: cases.length,
      diagnoses,
      statuses,
      ageGroups,
      genders
    };
  }
};

// Enhanced Custom Node Components with better visual effects and data
const TopicNode = ({ data, selected }) => {
  const [isVisible, setIsVisible] = useState(data.skipAnimation || false);
  
  // Entry animation - only if not skipping animations
  useEffect(() => {
    if (!data.skipAnimation) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, [data.skipAnimation]);

  const completionPercentage = data.flashcard_count > 0
    ? ((data.completed_flashcards || 0) / data.flashcard_count) * 100
    : 0;

  return (
    <div
      className={`group px-4 py-3 rounded-xl shadow-lg border-2 transition-all duration-700 min-w-[220px] relative hover:shadow-2xl transform hover:scale-105 backdrop-blur-sm ${selected
          ? 'border-teal-400 shadow-xl scale-105 ring-4 ring-teal-200 animate-pulse'
          : 'border-transparent hover:border-teal-300 hover:ring-2 hover:ring-teal-100'
        } ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-75 translate-y-8'}`}
      style={{
        backgroundColor: data.color || '#3B82F6',
        color: 'white',
        boxShadow: selected
          ? `0 0 20px ${data.color || '#3B82F6'}40`
          : `0 4px 20px ${data.color || '#3B82F6'}20`,
        transition: 'all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.3s ease'
      }}
    >
      {/* Connection Hotspots - Stacked source and target handles for all four sides */}
      {/* Top handles */}
      <Handle
        id="top"
        type="source"
        position={Position.Top}
        className="w-3 h-3 !bg-blue-500 transition-all duration-300 hover:scale-150 cursor-pointer opacity-0 group-hover:opacity-100"
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2
        }}
        isConnectable={true}
      />
      <Handle
        id="top"
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-blue-500 transition-all duration-300 hover:scale-150 cursor-pointer opacity-0 group-hover:opacity-100"
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1
        }}
        isConnectable={true}
      />

      {/* Right handles */}
      <Handle
        id="right"
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-blue-500 transition-all duration-300 hover:scale-150 cursor-pointer opacity-0 group-hover:opacity-100"
        style={{
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 2
        }}
        isConnectable={true}
      />
      <Handle
        id="right"
        type="target"
        position={Position.Right}
        className="w-3 h-3 !bg-blue-500 transition-all duration-300 hover:scale-150 cursor-pointer opacity-0 group-hover:opacity-100"
        style={{
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1
        }}
        isConnectable={true}
      />

      {/* Bottom handles */}
      <Handle
        id="bottom"
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-blue-500 transition-all duration-300 hover:scale-150 cursor-pointer opacity-0 group-hover:opacity-100"
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2
        }}
        isConnectable={true}
      />
      <Handle
        id="bottom"
        type="target"
        position={Position.Bottom}
        className="w-3 h-3 !bg-blue-500 transition-all duration-300 hover:scale-150 cursor-pointer opacity-0 group-hover:opacity-100"
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1
        }}
        isConnectable={true}
      />

      {/* Left handles */}
      <Handle
        id="left"
        type="source"
        position={Position.Left}
        className="w-3 h-3 !bg-blue-500 transition-all duration-300 hover:scale-150 cursor-pointer opacity-0 group-hover:opacity-100"
        style={{
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 2
        }}
        isConnectable={true}
      />
      <Handle
        id="left"
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-blue-500 transition-all duration-300 hover:scale-150 cursor-pointer opacity-0 group-hover:opacity-100"
        style={{
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1
        }}
        isConnectable={true}
      />

      {/* Priority indicator */}
      {data.priority && (
        <div className="absolute -top-2 -right-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white ${data.priority === 'high' ? 'bg-red-500' :
              data.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
            }`}>
            {data.priority === 'high' ? '!' : data.priority === 'medium' ? '•' : '✓'}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center gap-1">
          <Brain size={16} className="drop-shadow-sm" />
          {data.tags && data.tags.length > 0 && (
            <Tag size={12} className="opacity-75" />
          )}
        </div>
        <div className="font-semibold text-sm truncate flex-1">{data.label}</div>
        {data.onDelete && (
          <button
            onClick={(e) => {
              // Only stop propagation if this is a single click, not part of a double-click
              if (e.detail === 1) {
                e.stopPropagation();
                // Use a small timeout to ensure this isn't part of a double-click
                setTimeout(() => {
                  data.onDelete();
                }, 200);
              }
            }}
            onDoubleClick={(e) => {
              // Prevent delete on double-click, allow modal to open
              e.preventDefault();
            }}
            className="ml-auto p-1 hover:bg-white hover:bg-opacity-20 rounded transition-all duration-200 hover:scale-110 opacity-70 hover:opacity-100"
          >
            <X size={12} />
          </button>
        )}
      </div>

      <div className="text-xs opacity-90 mb-2">{data.category}</div>

      {/* Enhanced progress display */}
      {data.flashcard_count > 0 && (
        <div className="text-xs mt-2 space-y-1">
          <div className="flex justify-between items-center">
            <span className="opacity-90">{data.completed_flashcards}/{data.flashcard_count} flashcards</span>
            <span className="font-semibold">{Math.round(completionPercentage)}%</span>
          </div>
          <div className="w-full bg-white bg-opacity-20 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Tags display */}
      {data.tags && data.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {data.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-white bg-opacity-20 rounded-full text-xs"
            >
              {tag}
            </span>
          ))}
          {data.tags.length > 3 && (
            <span className="px-2 py-1 bg-white bg-opacity-20 rounded-full text-xs">
              +{data.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Last updated indicator */}
      {data.updated_at && (
        <div className="absolute bottom-1 right-1 opacity-50">
          <Clock size={10} />
        </div>
      )}
    </div>
  );
};

const CaseNode = ({ data, selected }) => {
  const [isVisible, setIsVisible] = useState(data.skipAnimation || false);
  
  // Entry animation with slight delay for staggered effect - only if not skipping animations
  useEffect(() => {
    if (!data.skipAnimation) {
      const timer = setTimeout(() => setIsVisible(true), 150);
      return () => clearTimeout(timer);
    }
  }, [data.skipAnimation]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'follow_up': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getUrgencyLevel = (data) => {
    // Simple urgency calculation based on keywords
    const urgentKeywords = ['emergency', 'urgent', 'crisis', 'acute', 'severe'];
    const complaint = data.chief_complaint?.toLowerCase() || '';
    const diagnosis = data.diagnosis?.toLowerCase() || '';

    if (urgentKeywords.some(keyword => complaint.includes(keyword) || diagnosis.includes(keyword))) {
      return 'high';
    }
    return 'normal';
  };

  const urgency = getUrgencyLevel(data);

  return (
    <div
      className={`group px-4 py-3 rounded-xl shadow-lg border-2 transition-all duration-600 min-w-[220px] bg-white relative hover:shadow-2xl transform hover:scale-105 ${selected
          ? 'border-blue-400 shadow-xl scale-105 ring-4 ring-blue-200'
          : 'border-gray-200 hover:border-blue-300 hover:ring-2 hover:ring-blue-100'
        } ${urgency === 'high' ? 'ring-2 ring-red-300' : ''} ${isVisible ? 'opacity-100 scale-100 translate-y-0 rotate-0' : 'opacity-0 scale-90 translate-y-6 rotate-1'}`}
      style={{
        transition: 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.3s ease'
      }}
    >
      {/* Connection Hotspots - Stacked source and target handles for all four sides */}
      {/* Top handles */}
      <Handle
        id="top"
        type="source"
        position={Position.Top}
        className="w-3 h-3 !bg-blue-500 transition-all duration-300 hover:scale-150 cursor-pointer opacity-0 group-hover:opacity-100"
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2
        }}
        isConnectable={true}
      />
      <Handle
        id="top"
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-blue-500 transition-all duration-300 hover:scale-150 cursor-pointer opacity-0 group-hover:opacity-100"
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1
        }}
        isConnectable={true}
      />

      {/* Right handles */}
      <Handle
        id="right"
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-blue-500 transition-all duration-300 hover:scale-150 cursor-pointer opacity-0 group-hover:opacity-100"
        style={{
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 2
        }}
        isConnectable={true}
      />
      <Handle
        id="right"
        type="target"
        position={Position.Right}
        className="w-3 h-3 !bg-blue-500 transition-all duration-300 hover:scale-150 cursor-pointer opacity-0 group-hover:opacity-100"
        style={{
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1
        }}
        isConnectable={true}
      />

      {/* Bottom handles */}
      <Handle
        id="bottom"
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-blue-500 transition-all duration-300 hover:scale-150 cursor-pointer opacity-0 group-hover:opacity-100"
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2
        }}
        isConnectable={true}
      />
      <Handle
        id="bottom"
        type="target"
        position={Position.Bottom}
        className="w-3 h-3 !bg-blue-500 transition-all duration-300 hover:scale-150 cursor-pointer opacity-0 group-hover:opacity-100"
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1
        }}
        isConnectable={true}
      />

      {/* Left handles */}
      <Handle
        id="left"
        type="source"
        position={Position.Left}
        className="w-3 h-3 !bg-blue-500 transition-all duration-300 hover:scale-150 cursor-pointer opacity-0 group-hover:opacity-100"
        style={{
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 2
        }}
        isConnectable={true}
      />
      <Handle
        id="left"
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-blue-500 transition-all duration-300 hover:scale-150 cursor-pointer opacity-0 group-hover:opacity-100"
        style={{
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1
        }}
        isConnectable={true}
      />

      {/* Urgency indicator */}
      {urgency === 'high' && (
        <div className="absolute -top-2 -right-2">
          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
            <AlertCircle size={14} className="text-white" />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center gap-1">
          <Users size={16} className="text-blue-600" />
          {data.linked_topics && data.linked_topics.length > 0 && (
            <div className="text-xs bg-blue-100 text-blue-600 px-1 rounded">
              {data.linked_topics.length}
            </div>
          )}
        </div>
        <div className="font-semibold text-sm text-gray-800 truncate flex-1">{data.label}</div>
        {data.onDelete && (
          <button
            onClick={(e) => {
              // Only stop propagation if this is a single click, not part of a double-click
              if (e.detail === 1) {
                e.stopPropagation();
                // Use a small timeout to ensure this isn't part of a double-click
                setTimeout(() => {
                  data.onDelete();
                }, 200);
              }
            }}
            onDoubleClick={(e) => {
              // Prevent delete on double-click, allow modal to open
              e.preventDefault();
            }}
            className="ml-auto p-1 hover:bg-gray-200 rounded transition-all duration-200 hover:scale-110 opacity-70 hover:opacity-100"
          >
            <X size={12} />
          </button>
        )}
      </div>

      <div className="text-xs text-gray-600 mb-2 truncate">{data.diagnosis}</div>

      {/* Enhanced patient info */}
      <div className="space-y-1">
        {data.age && (
          <div className="text-xs text-blue-600 flex items-center gap-1">
            <Calendar size={10} />
            Age: {data.age}
          </div>
        )}

        {/* Status badge */}
        {data.status && (
          <span className={`inline-block px-2 py-1 rounded-full text-xs border ${getStatusColor(data.status)}`}>
            {data.status}
          </span>
        )}
      </div>

      {/* Progress indicators */}
      {data.tasks_count && data.tasks_count > 0 && (
        <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
          <CheckSquare size={10} />
          {data.completed_tasks || 0}/{data.tasks_count} tasks
        </div>
      )}

      {/* Last updated indicator */}
      {data.updated_at && (
        <div className="absolute bottom-1 right-1 opacity-30">
          <Clock size={10} />
        </div>
      )}
    </div>
  );
};

const TaskNode = ({ data, selected }) => {
  const [isVisible, setIsVisible] = useState(data.skipAnimation || false);
  
  // Entry animation with different timing for variety - only if not skipping animations
  useEffect(() => {
    if (!data.skipAnimation) {
      const timer = setTimeout(() => setIsVisible(true), 200);
      return () => clearTimeout(timer);
    }
  }, [data.skipAnimation]);

  const statusClasses = {
    pending: 'bg-yellow-500',
    in_progress: 'bg-blue-600',
    completed: 'bg-green-700 opacity-60'
  };

  return (
    <div
      className={`group px-4 py-3 rounded-xl shadow-lg border-2 transition-all duration-500 min-w-[200px] text-white relative hover:shadow-2xl transform hover:scale-105 ${selected
          ? 'border-yellow-400 shadow-xl scale-105 ring-4 ring-yellow-200'
          : 'border-transparent hover:border-yellow-300 hover:ring-2 hover:ring-yellow-100'
        } ${statusClasses[data.status] || 'bg-gray-500'} ${isVisible ? 'opacity-100 scale-100 translate-x-0' : 'opacity-0 scale-85 -translate-x-4'}`}
      style={{
        transition: 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55), transform 0.3s ease'
      }}
    >
      {/* Connection Hotspots - Stacked source and target handles for all four sides */}
      {/* Top handles */}
      <Handle
        id="top"
        type="source"
        position={Position.Top}
        className="w-3 h-3 !bg-blue-500 transition-all duration-300 hover:scale-150 cursor-pointer opacity-0 group-hover:opacity-100"
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2
        }}
        isConnectable={true}
      />
      <Handle
        id="top"
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-blue-500 transition-all duration-300 hover:scale-150 cursor-pointer opacity-0 group-hover:opacity-100"
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1
        }}
        isConnectable={true}
      />

      {/* Right handles */}
      <Handle
        id="right"
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-blue-500 transition-all duration-300 hover:scale-150 cursor-pointer opacity-0 group-hover:opacity-100"
        style={{
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 2
        }}
        isConnectable={true}
      />
      <Handle
        id="right"
        type="target"
        position={Position.Right}
        className="w-3 h-3 !bg-blue-500 transition-all duration-300 hover:scale-150 cursor-pointer opacity-0 group-hover:opacity-100"
        style={{
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1
        }}
        isConnectable={true}
      />

      {/* Bottom handles */}
      <Handle
        id="bottom"
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-blue-500 transition-all duration-300 hover:scale-150 cursor-pointer opacity-0 group-hover:opacity-100"
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2
        }}
        isConnectable={true}
      />
      <Handle
        id="bottom"
        type="target"
        position={Position.Bottom}
        className="w-3 h-3 !bg-blue-500 transition-all duration-300 hover:scale-150 cursor-pointer opacity-0 group-hover:opacity-100"
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1
        }}
        isConnectable={true}
      />

      {/* Left handles */}
      <Handle
        id="left"
        type="source"
        position={Position.Left}
        className="w-3 h-3 !bg-blue-500 transition-all duration-300 hover:scale-150 cursor-pointer opacity-0 group-hover:opacity-100"
        style={{
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 2
        }}
        isConnectable={true}
      />
      <Handle
        id="left"
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-blue-500 transition-all duration-300 hover:scale-150 cursor-pointer opacity-0 group-hover:opacity-100"
        style={{
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1
        }}
        isConnectable={true}
      />

      <div className="flex items-center gap-2 mb-1">
        <CheckSquare size={16} />
        <div className="font-semibold text-sm">{data.label}</div>
        {data.onDelete && (
          <button
            onClick={(e) => {
              // Only stop propagation if this is a single click, not part of a double-click
              if (e.detail === 1) {
                e.stopPropagation();
                // Use a small timeout to ensure this isn't part of a double-click
                setTimeout(() => {
                  data.onDelete();
                }, 200);
              }
            }}
            onDoubleClick={(e) => {
              // Prevent delete on double-click, allow modal to open
              e.preventDefault();
            }}
            className="ml-auto p-1 hover:bg-white hover:bg-opacity-20 rounded transition-all duration-200 hover:scale-110 opacity-70 hover:opacity-100"
          >
            <X size={12} />
          </button>
        )}
      </div>
      <div className="text-xs opacity-90">Priority: {data.priority}</div>
      {data.due_date && (
        <div className="text-xs mt-1 opacity-90">Due: {new Date(data.due_date).toLocaleDateString()}</div>
      )}
    </div>
  );
};

const LiteratureNode = ({ data, selected }) => {
  const [isVisible, setIsVisible] = useState(data.skipAnimation || false);
  
  // Entry animation with the longest delay for final polish - only if not skipping animations
  useEffect(() => {
    if (!data.skipAnimation) {
      const timer = setTimeout(() => setIsVisible(true), 250);
      return () => clearTimeout(timer);
    }
  }, [data.skipAnimation]);

  return (
    <div
      className={`group px-4 py-3 rounded-xl shadow-lg border-2 transition-all duration-650 min-w-[200px] bg-purple-50 relative hover:shadow-2xl transform hover:scale-105 ${selected
          ? 'border-purple-400 shadow-xl scale-105 ring-4 ring-purple-200'
          : 'border-purple-200 hover:border-purple-300 hover:ring-2 hover:ring-purple-100'
        } ${isVisible ? 'opacity-100 scale-100 translate-x-0 rotate-0' : 'opacity-0 scale-95 translate-x-4 -rotate-1'}`}
      style={{
        transition: 'all 0.65s cubic-bezier(0.175, 0.885, 0.32, 1.275), transform 0.3s ease'
      }}
    >
      {/* Connection Hotspots - Stacked source and target handles for all four sides */}
      {/* Top handles */}
      <Handle
        id="top"
        type="source"
        position={Position.Top}
        className="w-3 h-3 !bg-purple-500 transition-all duration-300 hover:scale-150 cursor-pointer opacity-0 group-hover:opacity-100"
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2
        }}
        isConnectable={true}
      />
      <Handle
        id="top"
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-purple-500 transition-all duration-300 hover:scale-150 cursor-pointer opacity-0 group-hover:opacity-100"
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1
        }}
        isConnectable={true}
      />

      {/* Right handles */}
      <Handle
        id="right"
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-purple-500 transition-all duration-300 hover:scale-150 cursor-pointer opacity-0 group-hover:opacity-100"
        style={{
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 2
        }}
        isConnectable={true}
      />
      <Handle
        id="right"
        type="target"
        position={Position.Right}
        className="w-3 h-3 !bg-purple-500 transition-all duration-300 hover:scale-150 cursor-pointer opacity-0 group-hover:opacity-100"
        style={{
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1
        }}
        isConnectable={true}
      />

      {/* Bottom handles */}
      <Handle
        id="bottom"
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-purple-500 transition-all duration-300 hover:scale-150 cursor-pointer opacity-0 group-hover:opacity-100"
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2
        }}
        isConnectable={true}
      />
      <Handle
        id="bottom"
        type="target"
        position={Position.Bottom}
        className="w-3 h-3 !bg-purple-500 transition-all duration-300 hover:scale-150 cursor-pointer opacity-0 group-hover:opacity-100"
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1
        }}
        isConnectable={true}
      />

      {/* Left handles */}
      <Handle
        id="left"
        type="source"
        position={Position.Left}
        className="w-3 h-3 !bg-purple-500 transition-all duration-300 hover:scale-150 cursor-pointer opacity-0 group-hover:opacity-100"
        style={{
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 2
        }}
        isConnectable={true}
      />
      <Handle
        id="left"
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-purple-500 transition-all duration-300 hover:scale-150 cursor-pointer opacity-0 group-hover:opacity-100"
        style={{
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1
        }}
        isConnectable={true}
      />

      <div 
        className="flex items-center gap-2 mb-1 cursor-pointer"
        onClick={(e) => {
          // Only stop propagation if this is a single click, not part of a double-click
          if (e.detail === 1) {
            e.stopPropagation();
            setTimeout(() => {
              if (data.onLiteratureClick) {
                data.onLiteratureClick(data);
              }
            }, 200);
          }
        }}
        onDoubleClick={(e) => {
          // Allow double-click to bubble up for modal opening
          e.preventDefault();
        }}
      >
        <BookOpen size={16} className="text-purple-600" />
        <div className="font-semibold text-sm text-gray-800">{data.label}</div>
        {data.onDelete && (
          <button
            onClick={(e) => {
              // Only stop propagation if this is a single click, not part of a double-click
              if (e.detail === 1) {
                e.stopPropagation();
                // Use a small timeout to ensure this isn't part of a double-click
                setTimeout(() => {
                  data.onDelete();
                }, 200);
              }
            }}
            onDoubleClick={(e) => {
              // Prevent delete on double-click, allow modal to open
              e.preventDefault();
            }}
            className="ml-auto p-1 hover:bg-purple-200 rounded transition-all duration-200 hover:scale-110 opacity-70 hover:opacity-100"
          >
            <X size={12} />
          </button>
        )}
      </div>
      <div className="text-xs text-gray-600">{data.authors}</div>
      <div className="text-xs text-purple-600 mt-1">{data.year}</div>
    </div>
  );
};

const nodeTypes = {
  topic: TopicNode,
  case: CaseNode,
  task: TaskNode,
  literature: LiteratureNode,
};



// Enhanced Dedicated Editing Form Component
const EnhancedEditingForm = ({ type, data, onClose, onSave, onDelete }) => {
  // Initialize formData with proper field structure based on node type
  const getInitialFormData = (type, data) => {
    const baseData = data || {};
    
    switch (type) {
      case 'case':
        return {
          case_id: '',
          age: '',
          primary_diagnosis: '',
          gender: '',
          chiefComplaint: '',
          initialPresentation: '',
          currentPresentation: '',
          medicationHistory: '',
          therapyProgress: '',
          defensePatterns: '',
          clinicalReflection: '',
          ...baseData // Existing data takes precedence
        };
      case 'topic':
        return {
          title: '',
          category: '',
          color: '#3B82F6',
          description: '',
          notes: '',
          tags: [],
          ...baseData
        };
      case 'task':
        return {
          title: '',
          description: '',
          status: 'pending',
          priority: 'medium',
          due_date: '',
          ...baseData
        };
      case 'literature':
        return {
          title: '',
          authors: '',
          year: '',
          doi: '',
          abstract: '',
          notes: '',
          tags: [],
          ...baseData
        };
      default:
        return baseData;
    }
  };

  const [formData, setFormData] = useState(() => getInitialFormData(type, data));
  const [activeTab, setActiveTab] = useState('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Update formData when data prop changes
  useEffect(() => {
    setFormData(getInitialFormData(type, data));
  }, [type, data]);

  const tabs = {
    basic: 'Basic Info',
    details: 'Details',
    notes: 'Notes & Tags',
    history: 'History'
  };

  const validateForm = () => {
    const newErrors = {};

    switch (type) {
      case 'topic':
        if (!formData.title?.trim()) newErrors.title = 'Title is required';
        if (!formData.category?.trim()) newErrors.category = 'Category is required';
        break;
      case 'case':
        if (!formData.case_id?.trim()) newErrors.case_id = 'Case ID is required';
        if (!formData.primary_diagnosis?.trim()) newErrors.primary_diagnosis = 'Primary diagnosis is required';
        break;
      case 'task':
        if (!formData.title?.trim()) newErrors.title = 'Title is required';
        break;
      case 'literature':
        if (!formData.title?.trim()) newErrors.title = 'Title is required';
        if (!formData.authors?.trim()) newErrors.authors = 'Authors are required';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const renderBasicTab = () => {
    switch (type) {
      case 'topic':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => updateFormData('title', e.target.value)}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="Enter topic title"
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select
                value={formData.category || ''}
                onChange={(e) => updateFormData('category', e.target.value)}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.category ? 'border-red-500' : 'border-gray-300'
                  }`}
              >
                <option value="">Select category</option>
                <option value="Mood Disorders">Mood Disorders</option>
                <option value="Anxiety Disorders">Anxiety Disorders</option>
                <option value="Psychotic Disorders">Psychotic Disorders</option>
                <option value="Personality Disorders">Personality Disorders</option>
                <option value="Substance Use Disorders">Substance Use Disorders</option>
                <option value="Other">Other</option>
              </select>
              {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color Theme</label>
              <div className="flex gap-2">
                {['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'].map(color => (
                  <button
                    key={color}
                    onClick={() => updateFormData('color', color)}
                    className={`w-8 h-8 rounded-full border-2 ${formData.color === color ? 'border-gray-800' : 'border-gray-300'
                      }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
        );

      case 'case':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Case ID *</label>
                <input
                  type="text"
                  value={formData.case_id || ''}
                  onChange={(e) => updateFormData('case_id', e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.case_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="CASE-001"
                />
                {errors.case_id && <p className="text-red-500 text-xs mt-1">{errors.case_id}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                <input
                  type="number"
                  value={formData.age || ''}
                  onChange={(e) => updateFormData('age', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max="120"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Diagnosis *</label>
              <input
                type="text"
                value={formData.primary_diagnosis || ''}
                onChange={(e) => updateFormData('primary_diagnosis', e.target.value)}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.primary_diagnosis ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="Enter primary diagnosis"
              />
              {errors.primary_diagnosis && <p className="text-red-500 text-xs mt-1">{errors.primary_diagnosis}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                value={formData.gender || ''}
                onChange={(e) => updateFormData('gender', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chief Complaint</label>
              <textarea
                value={formData.chiefComplaint || ''}
                onChange={(e) => updateFormData('chiefComplaint', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Describe the primary concern"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Initial Presentation</label>
              <textarea
                value={formData.initialPresentation || ''}
                onChange={(e) => updateFormData('initialPresentation', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Symptoms and context at first visit"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Presentation</label>
              <textarea
                value={formData.currentPresentation || ''}
                onChange={(e) => updateFormData('currentPresentation', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Describe how the case looks now"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medication History</label>
              <textarea
                value={formData.medicationHistory || ''}
                onChange={(e) => updateFormData('medicationHistory', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="e.g. SSRI trials, mood stabilizers, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Therapy Progress</label>
              <textarea
                value={formData.therapyProgress || ''}
                onChange={(e) => updateFormData('therapyProgress', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="How the patient has responded to therapy"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Defense Patterns</label>
              <textarea
                value={formData.defensePatterns || ''}
                onChange={(e) => updateFormData('defensePatterns', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="e.g. projection, denial, rationalization"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Clinical Reflection</label>
              <textarea
                value={formData.clinicalReflection || ''}
                onChange={(e) => updateFormData('clinicalReflection', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Your thoughts or questions about the case"
              />
            </div>
          </div>
        );

      default:
        return <div>Basic form for {type}</div>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold capitalize flex items-center gap-2">
              <Sparkles size={20} />
              Enhanced {type} Editor
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex">
            {Object.entries(tabs).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-6 py-3 text-sm font-medium transition-colors ${activeTab === key
                    ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'basic' && renderBasicTab()}
          {activeTab === 'details' && <div>Details content for {type}</div>}
          {activeTab === 'notes' && <div>Notes and tags content</div>}
          {activeTab === 'history' && <div>History content</div>}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
          <div className="flex gap-2">
            {onDelete && (
              <LoadingButton
                onClick={onDelete}
                icon={Trash2}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
              >
                Delete
              </LoadingButton>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <LoadingButton
              onClick={handleSubmit}
              loading={isSubmitting}
              icon={isSubmitting ? Loader2 : Save}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </LoadingButton>
          </div>
        </div>
      </div>
    </div>
  );
};
const NodeSelector = ({ isOpen, onClose, onSelect, templates }) => {
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

  const handleFinalSelect = (templateId = null) => {
    onSelect(selectedNodeType, templateId);
    onClose();
  };

  const filteredTemplates = selectedNodeType ? (templates || []).filter(t => t.nodeType === selectedNodeType) : [];

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
              {selectedNodeType ? `Select a ${selectedNodeType} template` : 'Add New Node'}
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

          {/* View 2: Template Selection */}
          <div className={`absolute top-0 left-0 w-full transition-transform duration-300 ease-in-out ${selectedNodeType ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
            {selectedNodeType && (
              <div className="space-y-3">
                {/* Create Blank Option */}
                <button
                  onClick={() => handleFinalSelect(null)}
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

                {/* Filtered Templates */}
                {filteredTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleFinalSelect(template.id)}
                    className="w-full flex items-center gap-4 p-4 rounded-lg border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
                  >
                    <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                      <FileText size={20} />
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">{template.name}</div>
                      <div className="text-sm text-gray-500 truncate">{template.data?.description || template.data?.abstract || template.data?.assessment_plan || 'No description'}</div>

                    </div>
                  </button>
                ))}

                {filteredTemplates.length === 0 && (
                  <div className="text-center text-sm text-gray-500 py-4">
                    No templates found for this node type.
                  </div>
                )}
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
  const { fitView, setCenter, zoomTo, getViewport } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

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
  const [focusedCategory, setFocusedCategory] = useState(null);
  const [showNodeSelector, setShowNodeSelector] = useState(false);
  // Specialized modal state for each node type with stable data references
  const [caseModal, setCaseModal] = useState({ isOpen: false, data: null });
  const [topicModal, setTopicModal] = useState({ isOpen: false, data: null });
  const [taskModal, setTaskModal] = useState({ isOpen: false, data: null });
  const caseModalStableData = useRef(null);
  const topicModalStableData = useRef(null);
  const taskModalStableData = useRef(null);
  const [isReactFlowReady, setIsReactFlowReady] = useState(false);
  const [hasAppliedInitialLayout, setHasAppliedInitialLayout] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [edgeModal, setEdgeModal] = useState({ isOpen: false, edge: null });
  const [templates, setTemplates] = useState([]);
  const [exportProgress, setExportProgress] = useState({ show: false, progress: 0, message: '' });

  const [toasts, setToasts] = useState([]);
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);
  const [literatureModal, setLiteratureModal] = useState({ isOpen: false, data: null });
  const [isAnimating, setIsAnimating] = useState(false); // Track animation state
  const [modalAnimationStates, setModalAnimationStates] = useState({
    case: false,
    topic: false,
    task: false,
    literature: false
  });
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
  // Remove the node from the visual state
  setNodes((nds) => nds.filter((node) => node.id !== fullNodeId));
  // Remove edges referencing this node
  setEdges((eds) => eds.filter((edge) => edge.source !== fullNodeId && edge.target !== fullNodeId));
}, [setMindMapData, autoSaveMindMapData, addToast, setNodes, setEdges]);

// Handle literature node click to open modal
const handleLiteratureClick = useCallback((literatureData) => {
  setIsAnimating(true); // Set animation state
  setLiteratureModal({ isOpen: true, data: literatureData });
  // Clear animation state after modal animation completes
  setTimeout(() => setIsAnimating(false), 700); // 600ms modal animation + 100ms buffer
}, []);

// Auto-sync node titles with modal form data
const syncNodeTitles = useCallback(() => {
  setNodes(currentNodes => {
    return currentNodes.map(node => {
      const nodeType = node.id.split('-')[0];
      const nodeId = node.id.split('-')[1];
      
      let newLabel = node.data.label;
      
      // Find the corresponding data item and sync title
      if (nodeType === 'case') {
        const caseData = mindMapData.cases?.find(c => c.id === nodeId);
        if (caseData) {
          newLabel = caseData.primaryDiagnosis || caseData.primary_diagnosis || caseData.title || 'Untitled Case';
        }
      } else if (nodeType === 'topic') {
        const topicData = mindMapData.topics?.find(t => t.id === nodeId);
        if (topicData) {
          newLabel = topicData.title || 'Untitled Topic';
        }
      } else if (nodeType === 'task') {
        const taskData = mindMapData.tasks?.find(t => t.id === nodeId);
        if (taskData) {
          newLabel = taskData.title || 'Untitled Task';
        }
      } else if (nodeType === 'literature') {
        const literatureData = mindMapData.literature?.find(l => l.id === nodeId);
        if (literatureData) {
          newLabel = literatureData.title || 'Untitled Literature';
        }
      }
      
      // Only update if the label actually changed
      if (newLabel !== node.data.label) {
        return {
          ...node,
          data: {
            ...node.data,
            label: newLabel
          }
        };
      }
      
      return node;
    });
  });
}, [mindMapData, setNodes]);

// Trigger auto-sync when mindMapData changes
useEffect(() => {
  const hasData = mindMapData && (mindMapData.cases?.length > 0 || mindMapData.topics?.length > 0 || 
                                 mindMapData.tasks?.length > 0 || mindMapData.literature?.length > 0);
  
  if (hasData) {
    syncNodeTitles();
    
    // If we don't have nodes but we have data, convert data to React Flow
    if (nodes.length === 0) {
      console.log('Converting data to React Flow nodes due to data change');
      // Use a timeout to avoid dependency issues and ensure state is stable
      setTimeout(() => {
        convertDataToReactFlow(mindMapData, false); // CHANGED: Don't apply force layout automatically
      }, 100);
    }
  }
}, [mindMapData, syncNodeTitles, nodes.length]); // Removed convertDataToReactFlow from dependencies

  const convertDataToReactFlow = useCallback(async (data, applyLayoutImmediately = false) => {
    // Use optimized quick layout for initial load
    const allItems = [
      ...data.topics.map(item => ({ ...item, type: 'topic' })),
      ...data.cases.map(item => ({ ...item, type: 'case' })),
      ...data.tasks.map(item => ({ ...item, type: 'task' })),
      ...data.literature.map(item => ({ ...item, type: 'literature' }))
    ];

    // If we have data and need immediate layout, apply force layout to positions
    let layoutNodes;
    
    // Check if nodes already have positions - if they do, don't override with force layout
    const hasExistingPositions = allItems.some(item => 
      item.position && typeof item.position.x === 'number' && typeof item.position.y === 'number'
    );
    
    if (allItems.length > 0 && applyLayoutImmediately && !hasExistingPositions) {
      try {
        // Lazy load D3 force simulation for initial positioning
        const { 
          forceSimulation, 
          forceManyBody, 
          forceLink, 
          forceCenter, 
          forceCollide 
        } = await loadD3Force();

        // Create nodes for simulation
        const simulationNodes = allItems.map((item, index) => ({
          id: `${item.type}-${item.id}`,
          x: item.position?.x || (Math.random() - 0.5) * 200,
          y: item.position?.y || (Math.random() - 0.5) * 200,
          type: item.type
        }));

        // Create D3-compatible edge objects
        const d3Edges = (data.connections || []).map(edge => ({
          source: edge.source,
          target: edge.target,
          id: edge.id
        })).filter(edge => {
          const nodeIds = new Set(simulationNodes.map(n => n.id));
          return nodeIds.has(edge.source) && nodeIds.has(edge.target);
        });

        // Run simulation synchronously for initial layout
        const simulation = forceSimulation(simulationNodes)
          .force('link', forceLink(d3Edges).id(d => d.id).distance(200).strength(0.5))
          .force('charge', forceManyBody().strength(-800).distanceMax(400))
          .force('center', forceCenter(window.innerWidth / 3, window.innerHeight / 2))
          .force('collision', forceCollide().radius(80))
          .stop();

        // Run enough ticks to get a good layout
        for (let i = 0; i < 300; i++) {
          simulation.tick();
        }

        // Create a map of positioned nodes
        const positionMap = new Map();
        simulationNodes.forEach(node => {
          positionMap.set(node.id, { x: node.x, y: node.y });
        });

        layoutNodes = allItems.map(item => {
          const nodeId = `${item.type}-${item.id}`;
          const position = positionMap.get(nodeId) || { x: 0, y: 0 };
          return { ...item, position };
        });
      } catch (error) {
        console.warn('Failed to apply initial layout, using fallback positioning:', error);
        layoutNodes = allItems;
      }
    } else {
      layoutNodes = allItems;
    }

    // Quick layout without expensive calculations - ensure all nodes get proper positions
    const quickNodes = (layoutNodes || allItems).map((item, index) => {
      const nodeId = `${item.type}-${item.id}`;
      
      // Convert case fields efficiently
      const nodeData = item.type === 'case' ? {
        ...item,
        chiefComplaint: item.chiefComplaint || item.chief_complaint || '',
        initialPresentation: item.initialPresentation || item.initial_presentation || '',
        currentPresentation: item.currentPresentation || item.current_presentation || '',
        medicationHistory: item.medicationHistory || item.medication_history || '',
        therapyProgress: item.therapyProgress || item.therapy_progress || '',
        defensePatterns: item.defensePatterns || item.defense_patterns || '',
        clinicalReflection: item.clinicalReflection || item.clinical_reflection || ''
      } : item;

      // Ensure proper positioning: use existing position, or create grid-based position
      let position;
      if (item.position && typeof item.position.x === 'number' && typeof item.position.y === 'number') {
        position = item.position;
      } else {
        // Create grid-based layout for nodes without positions
        const gridSize = Math.ceil(Math.sqrt(allItems.length));
        const nodeSpacing = 250;
        const offsetX = 300; // Offset from left sidebar
        const offsetY = 150; // Offset from top
        
        position = {
          x: (index % gridSize) * nodeSpacing + offsetX,
          y: Math.floor(index / gridSize) * nodeSpacing + offsetY
        };
      }

      return {
        id: nodeId,
        type: item.type,
        position: position,
        data: { 
          ...nodeData, 
          onDelete: () => handleDeleteNode(nodeId),
          onLiteratureClick: item.type === 'literature' ? handleLiteratureClick : undefined,
          skipAnimation: isInitialLoad // Use the isInitialLoad state
        },
      };
    });

    // Create optimized edges
    const optimizedEdges = createOptimizedEdges(
      data.connections || [], 
      quickNodes.map(n => n.id)
    );

    // Set nodes and edges immediately for fast UI response
    setNodes(quickNodes);
    setEdges(optimizedEdges);
  }, [setNodes, setEdges, handleDeleteNode, handleLiteratureClick, isInitialLoad]);

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

  const onConnect = useCallback((params) => {
    const edgeId = `conn-${Date.now()}`;
    const newEdge = { 
      ...params, 
      id: edgeId,
      type: 'floating', // Use our high-performance floating edge type
      style: { 
        strokeWidth: 2, 
        stroke: '#64748b',
        opacity: 0.85,
        transition: 'none' // Critical: disable transitions for immediate updates
      },
      // Add a unique timestamp to force React to re-render this edge when source or target nodes move
      data: { __forceUpdate: Date.now() },
      interactionWidth: 20 // Wider area for interaction
    };
    setEdges((eds) => addEdge(newEdge, eds));
    setMindMapData(prev => {
      const newConnections = [...prev.connections, { 
        id: newEdge.id, 
        source: params.source, 
        target: params.target, 
        label: '' 
      }];
      const newData = { ...prev, connections: newConnections };
      autoSaveMindMapData(newData);
      return newData;
    });
  }, [setEdges, setMindMapData, autoSaveMindMapData]);

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    // Visual feedback - highlight selected node
    setNodes(currentNodes => currentNodes.map(n => ({
      ...n,
      selected: n.id === node.id
    })));
  }, [setNodes]);

  const onNodeDoubleClick = useCallback((event, node) => {
    const [type, id] = node.id.split('-');
    
    // Prevent multiple rapid clicks by checking if modal is already open
    if (type === 'case' && caseModal.isOpen) return;
    if (type === 'topic' && topicModal.isOpen) return;
    if (type === 'task' && taskModal.isOpen) return;
    if (type === 'literature' && literatureModal.isOpen) return;
    
    // Route to appropriate specialized modal based on node type
    if (type === 'literature') {
      const dataItem = mindMapData.literature.find(item => String(item.id) === id);
      if (dataItem) {
        setLiteratureModal({ isOpen: true, data: dataItem });
      }
      return;
    }
    
    if (type === 'case') {
      const dataItem = mindMapData.cases.find(item => String(item.id) === id);
      if (dataItem) {
        setModalAnimationStates(prev => ({ ...prev, case: true }));
        setCaseModal({ isOpen: true, data: dataItem });
        // Clear animation state after modal animation completes
        setTimeout(() => {
          setModalAnimationStates(prev => ({ ...prev, case: false }));
        }, 800);
      }
      return;
    }
    
    if (type === 'topic') {
      const dataItem = mindMapData.topics.find(item => String(item.id) === id);
      if (dataItem) {
        setModalAnimationStates(prev => ({ ...prev, topic: true }));
        setTopicModal({ isOpen: true, data: dataItem });
        // Clear animation state after modal animation completes
        setTimeout(() => {
          setModalAnimationStates(prev => ({ ...prev, topic: false }));
        }, 800);
      }
      return;
    }
    
    if (type === 'task') {
      const dataItem = mindMapData.tasks.find(item => String(item.id) === id);
      if (dataItem) {
        setModalAnimationStates(prev => ({ ...prev, task: true }));
        setTaskModal({ isOpen: true, data: dataItem });
        // Clear animation state after modal animation completes
        setTimeout(() => {
          setModalAnimationStates(prev => ({ ...prev, task: false }));
        }, 800);
      }
      return;
    }
  }, [mindMapData, caseModal.isOpen, topicModal.isOpen, taskModal.isOpen, literatureModal.isOpen]);

  const onEdgeDoubleClick = useCallback((event, edge) => {
    // Double-click to delete edge immediately
    setEdges(eds => eds.filter(e => e.id !== edge.id));
    setMindMapData(prev => {
      const newConnections = prev.connections.filter(conn => conn.id !== edge.id);
      const newData = { ...prev, connections: newConnections };
      autoSaveMindMapData(newData);
      addToast('Connection deleted', 'success');
      return newData;
    });
  }, [setEdges, setMindMapData, autoSaveMindMapData, addToast]);

  const onEdgeContextMenu = useCallback((event, edge) => {
    // Right-click to edit edge label
    event.preventDefault();
    setEdgeModal({ isOpen: true, edge: edge });
  }, []);

  const handleSaveEdgeLabel = useCallback((edgeId, label) => {
    setEdges(eds =>
      eds.map(edge =>
        edge.id === edgeId ? { ...edge, label: label } : edge
      )
    );
    setMindMapData(prev => {
      const newConnections = prev.connections.map(conn =>
        conn.id === edgeId ? { ...conn, label: label } : conn
      );
      const newData = { ...prev, connections: newConnections };
      autoSaveMindMapData(newData);
      return newData;
    });
  }, [setEdges, setMindMapData, autoSaveMindMapData]);

  // Edge hover handlers for highlighting
  const onEdgeMouseEnter = useCallback((event, edge) => {
    setEdges(eds =>
      eds.map(e =>
        e.id === edge.id ? { ...e, className: 'highlighted' } : e
      )
    );
  }, [setEdges]);

  const onEdgeMouseLeave = useCallback((event, edge) => {
    setEdges(eds =>
      eds.map(e =>
        e.id === edge.id ? { ...e, className: '' } : e
      )
    );
  }, [setEdges]);

  // Lazy-loaded force-directed layout for better performance
  const forceLayout = useCallback(async () => {
    if (nodes.length === 0) return;

    try {
      // Lazy load D3 force simulation
      const { 
        forceSimulation, 
        forceManyBody, 
        forceLink, 
        forceCenter, 
        forceCollide 
      } = await loadD3Force();

      // Preserve the current edges before layout
      const currentEdges = [...edges];
      
      // Create a set of valid node IDs for fast lookup
      const nodeIdSet = new Set(nodes.map(node => node.id));
      
      // Filter edges to only include those with both source and target nodes present
      const validEdges = currentEdges.filter(edge => 
        nodeIdSet.has(edge.source) && nodeIdSet.has(edge.target)
      );

      // Create D3-compatible edge objects for the force simulation
      const d3Edges = validEdges.map(edge => ({
        source: edge.source,
        target: edge.target,
        id: edge.id
      }));

      // Create a copy of nodes for simulation (D3 mutates the objects)
      const simulationNodes = nodes.map(node => ({ 
        id: node.id,
        x: node.position.x, 
        y: node.position.y,
        fx: null, // Remove any fixed positions
        fy: null
      }));

      // Create simulation with optimized forces for mind map layout
      const simulation = forceSimulation(simulationNodes)
        .force('link', forceLink(d3Edges).id(d => d.id).distance(200).strength(0.5))
        .force('charge', forceManyBody().strength(-800).distanceMax(400))
        .force('center', forceCenter(window.innerWidth / 3, window.innerHeight / 2))
        .force('collision', forceCollide().radius(80))
        .stop();

      // Run simulation in chunks to prevent blocking
      const ticksPerFrame = 50;
      const totalTicks = 400;
      let currentTick = 0;

      const runSimulationChunk = () => {
        const remainingTicks = Math.min(ticksPerFrame, totalTicks - currentTick);
        for (let i = 0; i < remainingTicks; i++) {
          simulation.tick();
        }
        currentTick += remainingTicks;

        if (currentTick < totalTicks) {
          requestAnimationFrame(runSimulationChunk);
        } else {
          // Simulation complete, update nodes
          const updatedNodes = simulationNodes.map(simNode => {
            const originalNode = nodes.find(n => n.id === simNode.id);
            return {
              ...originalNode,
              position: { x: simNode.x, y: simNode.y },
            };
          });
          
          // Update both nodes and edges in a single batch
          setNodes(updatedNodes);
          setEdges(validEdges);

          // Update mindMapData with new positions
          setMindMapData(currentData => {
            const updatedData = { ...currentData };
            
            updatedNodes.forEach(node => {
              const [type, id] = node.id.split('-');
              const key = type === 'literature' ? 'literature' : `${type}s`;
              const item = updatedData[key]?.find(i => String(i.id) === id);
              if (item) {
                item.position = node.position;
              }
            });
            
            return updatedData;
          });

          // Smooth camera transition to fit the new layout
          setTimeout(() => {
            fitView({ duration: 800, padding: 0.2 });
          }, 200);
        }
      };

      // Start simulation in next frame
      requestAnimationFrame(runSimulationChunk);
    } catch (error) {
      console.error('Force layout failed:', error);
      addToast('Layout calculation failed', 'error');
    }
  }, [nodes, edges, setNodes, setEdges, setMindMapData, fitView, addToast]);

  // applyForceLayout wrapper function (defined after forceLayout)
  const applyForceLayout = useCallback(() => {
    try {
      forceLayout();
      addToast('Nodes realigned successfully', 'success');
    } catch (error) {
      console.error('Force layout error:', error);
      addToast('Failed to realign nodes', 'error');
    }
  }, [forceLayout, addToast]);

  const handleClearMap = useCallback(() => {
    if (!window.confirm('Are you sure you want to clear the entire mind map?')) return;

    const empty = { topics: [], cases: [], tasks: [], literature: [], connections: [] };
    setMindMapData(empty);
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    // Clear all modal states
    setCaseModal({ isOpen: false, data: null });
    setTopicModal({ isOpen: false, data: null });
    setTaskModal({ isOpen: false, data: null });
    setLiteratureModal({ isOpen: false, data: null });
    setFocusedCategory(null);
    autoSaveMindMapData(empty);
    addToast('Mind map cleared successfully', 'success');
  }, [setNodes, setEdges, autoSaveMindMapData, addToast]);

  const handleNodesChange = useCallback((changes) => {
    // Apply the node changes to React Flow state immediately - this is critical!
    onNodesChange(changes);
    
    // Skip heavy operations during animations to prevent interference
    if (isAnimating) {
      console.log('Skipping position updates during animation');
      return;
    }


    
    // Process position changes for data persistence - SIMPLIFIED
    const positionChanges = changes.filter(change => 
      change.type === 'position' && change.position
    );
    
    if (positionChanges.length > 0) {
      console.log('Processing position changes:', positionChanges);
      
      // Update mindMapData immediately without complex debouncing
      setMindMapData(currentData => {
        const updatedData = { ...currentData };
        
        positionChanges.forEach(change => {
          if (change.position) {
            const [type, id] = change.id.split('-');
            const key = type === 'literature' ? 'literature' : `${type}s`;
            const item = updatedData[key]?.find(i => String(i.id) === id);
            
            if (item) {
              item.position = { ...change.position };
              console.log(`Updated ${type} ${id} position to:`, change.position);
            }
          }
        });
        
        // Save to localStorage immediately
        localStorageUtils.save(updatedData, null, null, false);
        
        return updatedData;
      });
      
      // Simple auto-save without complex timeouts
      setTimeout(() => {
        autoSaveMindMapData(mindMapData);
      }, 500);
    }
  }, [onNodesChange, setMindMapData, isAnimating, autoSaveMindMapData, mindMapData]);

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
        
        await convertDataToReactFlow(local, true); // Apply layout immediately
        
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
              await convertDataToReactFlow(response.data);
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
        setLoadingMessage('Applying layout...');
        
        await convertDataToReactFlow(response.data, true); // Apply layout immediately
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
  }, [addToast, autoSaveMindMapData, convertDataToReactFlow]);

  useEffect(() => {
    // Load initial mind map data
    loadMindMapData();
    
    // Load templates from a source (e.g., API or localStorage)
    // For now, using mock data
    setTemplates([
      { id: 'template1', name: 'Schizophrenia Workup', nodeType: 'case', data: { primary_diagnosis: 'Schizophrenia', chief_complaint: 'Auditory hallucinations' } },
      { id: 'template2', name: 'MDD Follow-up', nodeType: 'case', data: { primary_diagnosis: 'Major Depressive Disorder', status: 'follow_up' } },
      { id: 'template3', name: 'CBT for Anxiety', nodeType: 'topic', data: { title: 'CBT for Anxiety', category: 'Anxiety Disorders' } }
    ]);
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
          default:
            break;
        }
      }
      
      if (event.key === 'Escape') {
        setSelectedNode(null);
        // Close all modals
        setCaseModal({ isOpen: false, data: null });
        setTopicModal({ isOpen: false, data: null });
        setTaskModal({ isOpen: false, data: null });
        setLiteratureModal({ isOpen: false, data: null });
        setShowNodeSelector(false);
        setIsTemplateManagerOpen(false);
        
        // Clear search if no modals are open
        if (!caseModal.isOpen && !topicModal.isOpen && !taskModal.isOpen && 
            !literatureModal.isOpen && !showNodeSelector && !isTemplateManagerOpen) {
          // Search functionality removed
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, applyForceLayout, caseModal, topicModal, taskModal, literatureModal, showNodeSelector, isTemplateManagerOpen]);

  useEffect(() => {
    // DISABLED automatic force layout to prevent overriding individual node positions
    // Force layout should only be applied manually via "Realign Nodes" button
    if (isReactFlowReady && !hasAppliedInitialLayout && nodes.length > 0) {
      // Just mark as applied without applying force layout 
      setHasAppliedInitialLayout(true);
    } else if (isInitialLoad && nodes.length > 0) {
      // For initial load, just mark as applied since layout was already done in convertDataToReactFlow
      setHasAppliedInitialLayout(true);
    }
  }, [isReactFlowReady, hasAppliedInitialLayout, nodes, isInitialLoad]); // Removed forceLayout from dependencies

  // Simplified search and category filtering - no style interference
  useEffect(() => {
    if (nodes.length === 0) return;
    
    // Skip during animations to prevent interference
    const anyModalAnimating = Object.values(modalAnimationStates).some(state => state);
    if (isAnimating || anyModalAnimating) return;
    
  }, [focusedCategory, nodes, nodeMatchesSearch, isAnimating, modalAnimationStates]);
  
  // CSS-based search filtering - no direct style manipulation
  useEffect(() => {
    if (!isReactFlowReady) return;
    
    // Apply CSS classes instead of direct style manipulation
    const styleSheet = document.getElementById('search-filter-styles') || document.createElement('style');
    styleSheet.id = 'search-filter-styles';
    
    if (!document.getElementById('search-filter-styles')) {
      document.head.appendChild(styleSheet);
    }
    
    // Generate CSS for search filtering
    let css = `
      /* Default node styling */
      .react-flow__node {
        transition: opacity 0.3s ease, transform 0.3s ease, filter 0.3s ease !important;
      }
      
      /* Search dimmed nodes */
      .react-flow__node.search-dimmed {
        opacity: 0.15 !important;
        filter: grayscale(0.7) !important;
        transform: scale(0.9) !important;
      }
      
      /* Selected node highlighting */
      .react-flow__node.search-selected {
        box-shadow: 0 0 0 2px #10b981, 0 0 20px rgba(16, 185, 129, 0.6) !important;
        z-index: 1000 !important;
      }
      
      /* Ensure dragging still works */
      .react-flow__node.search-dimmed {
        pointer-events: auto !important;
      }
    `;
    
    styleSheet.textContent = css;
    
  }, [isReactFlowReady]);

  // Optionally: handle layout setup on first render if needed

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
        </div>

        {/* --- Category Filters --- */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Filter by Category</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setFocusedCategory(null)}
              className={`px-3 py-2 rounded-lg text-xs transition-all ${
                focusedCategory === null
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFocusedCategory('topic')}
              className={`px-3 py-2 rounded-lg text-xs transition-all flex items-center gap-1 ${
                focusedCategory === 'topic'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Brain size={12} />
              Topics
            </button>
            <button
              onClick={() => setFocusedCategory('case')}
              className={`px-3 py-2 rounded-lg text-xs transition-all flex items-center gap-1 ${
                focusedCategory === 'case'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Users size={12} />
              Cases
            </button>
            <button
              onClick={() => setFocusedCategory('task')}
              className={`px-3 py-2 rounded-lg text-xs transition-all flex items-center gap-1 ${
                focusedCategory === 'task'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <CheckSquare size={12} />
              Tasks
            </button>
            <button
              onClick={() => setFocusedCategory('literature')}
              className={`px-3 py-2 rounded-lg text-xs transition-all flex items-center gap-1 ${
                focusedCategory === 'literature'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <BookOpen size={12} />
              Literature
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
          <LoadingButton onClick={applyForceLayout} icon={Shuffle} className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm">
            Realign Nodes
          </LoadingButton>
          <LoadingButton onClick={() => setIsTemplateManagerOpen(true)} icon={Bookmark} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm">
            Manage Templates
          </LoadingButton>
          <LoadingButton 
            onClick={() => populateSampleLiteratureData(setMindMapData, autoSaveMindMapData, addToast)} 
            icon={BookOpen} 
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-sm"
          >
            Add Sample Literature
          </LoadingButton>
          <LoadingButton onClick={() => setIsEditing(!isEditing)} icon={isEditing ? Save : Edit3} className={`w-full px-4 py-2 rounded-md text-sm ${isEditing ? 'bg-teal-600' : 'bg-slate-600'}`}>
            {isEditing ? 'Exit Edit Mode' : 'Edit Mind Map'}
          </LoadingButton>
          <LoadingButton onClick={() => setShowNodeSelector(true)} icon={Plus} className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm">
            Add New Node
          </LoadingButton>
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
        <ReactFlowErrorBoundary>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onNodeDoubleClick={onNodeDoubleClick}
            onNodeDragStop={handleNodeDragStop}
            onEdgeDoubleClick={onEdgeDoubleClick}
            onEdgeContextMenu={onEdgeContextMenu}
            onEdgeMouseEnter={onEdgeMouseEnter}
            onEdgeMouseLeave={onEdgeMouseLeave}
            nodeTypes={nodeTypes}
            edgeTypes={{ floating: FloatingEdge, enhanced: EnhancedEdge }}
            nodesDraggable={true}
            nodesConnectable={isEditing}
            elementsSelectable={true}
            onInit={(reactFlowInstance) => {
              setIsReactFlowReady(true);
              // Store reference for error recovery
              window.reactFlowInstance = reactFlowInstance;
            }}
            onError={(id, message) => {
              console.warn('React Flow Error:', id, message);
              // Ignore dimension-related errors during animations
              if (isAnimating && message.includes('dimensions')) {
                return;
              }
            }}
            fitView
            snapToGrid={false}
            snapGrid={[15, 15]}
            elevateEdgesOnSelect={false}
            connectionLineComponent={ConnectionLine}
          connectionLineStyle={{
            stroke: '#3b82f6', // Use a bright blue color for better visibility during connection
            strokeWidth: 3.5, // Slightly thicker than regular edges
            opacity: 0.9,
            strokeLinecap: 'round',
            strokeDasharray: '5,3', // Shorter dash pattern for more modern look
            filter: 'drop-shadow(0 0 6px rgba(59, 130, 246, 0.6))', // Softer glow
            animation: 'flowingDash 1s linear infinite' // Add flowing animation
          }}
          defaultEdgeOptions={{
            type: 'enhanced', // Use our enhanced edge with proper prop handling
            style: { 
              strokeWidth: 2.5, 
              stroke: '#64748b',
              opacity: 0.9,
              strokeLinecap: 'round',
              transition: 'none'
            }
            // Remove pathOptions - this is not a standard React Flow prop
          }}
          className="bg-gradient-to-br from-blue-50 to-indigo-100"
        >
          <Background color="#aaa" gap={16} />
          <Controls />
          <MiniMap />
        </ReactFlow>
        </ReactFlowErrorBoundary>
      </div>
      
      {/* --- Modals --- */}
      {isTemplateManagerOpen && (
        <TemplateManager
          isOpen={isTemplateManagerOpen}
          onClose={() => setIsTemplateManagerOpen(false)}
          templates={templates}
          setTemplates={setTemplates}
        />
      )}
      
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
          allNodes={nodes}
          connections={mindMapData.connections || []}
          setMindMapData={setMindMapData}
          autoSaveMindMapData={autoSaveMindMapData}
          addToast={addToast}
        />
      )}
      {showNodeSelector && (
        <NodeSelector
          isOpen={showNodeSelector}
          onClose={() => setShowNodeSelector(false)}
          onSelect={(nodeType, templateId) => {
            setShowNodeSelector(false);
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

            setNodes(n => n.concat(newNode));
          }}
          templates={templates}
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
            setMindMapData={setMindMapData}
            autoSaveMindMapData={autoSaveMindMapData}
            addToast={addToast}
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

      <EdgeLabelModal 
        isOpen={edgeModal.isOpen} 
        edge={edgeModal.edge} 
        onClose={() => setEdgeModal({ isOpen: false, edge: null })} 
        onSave={handleSaveEdgeLabel} 
      />

      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
          <Loader2 size={48} className="animate-spin text-blue-600" />
        </div>
      )}
      
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
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

const Dashboard = () => (
  <ReactFlowProvider>
    <DashboardComponent />
  </ReactFlowProvider>
);

function App() {
  return <Dashboard />;
}

export default App;