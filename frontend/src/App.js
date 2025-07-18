import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import '@xyflow/react/dist/style.css';
import './App.css';
import axios from 'axios';
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
import {
  forceSimulation, forceManyBody, forceLink, forceCenter, forceCollide
} from 'd3-force';

import dagre from 'dagre';
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
  Bookmark
} from 'lucide-react';
import TemplateManager from './components/TemplateManager';
import RichTextEditor from './components/RichTextEditor';
import FloatingEdge from './components/FloatingEdge'; // Import the custom FloatingEdge component

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
    return (data, onSaveStart, onSaveComplete) => {
      clearTimeout(timeoutId);

      if (onSaveStart) onSaveStart();

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
      }, 800); // 800ms debounce delay
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
  const completionPercentage = data.flashcard_count > 0
    ? ((data.completed_flashcards || 0) / data.flashcard_count) * 100
    : 0;

  return (
    <div
      className={`group px-4 py-3 rounded-xl shadow-lg border-2 transition-all duration-500 min-w-[220px] relative hover:shadow-2xl transform hover:scale-105 backdrop-blur-sm ${selected
          ? 'border-teal-400 shadow-xl scale-105 ring-4 ring-teal-200 animate-pulse'
          : 'border-transparent hover:border-teal-300 hover:ring-2 hover:ring-teal-100'
        }`}
      style={{
        backgroundColor: data.color || '#3B82F6',
        color: 'white',
        boxShadow: selected
          ? `0 0 20px ${data.color || '#3B82F6'}40`
          : `0 4px 20px ${data.color || '#3B82F6'}20`
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
              e.stopPropagation();
              data.onDelete();
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
      className={`group px-4 py-3 rounded-xl shadow-lg border-2 transition-all duration-500 min-w-[220px] bg-white relative hover:shadow-2xl transform hover:scale-105 ${selected
          ? 'border-blue-400 shadow-xl scale-105 ring-4 ring-blue-200'
          : 'border-gray-200 hover:border-blue-300 hover:ring-2 hover:ring-blue-100'
        } ${urgency === 'high' ? 'ring-2 ring-red-300' : ''}`}
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
              e.stopPropagation();
              data.onDelete();
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
        } ${statusClasses[data.status] || 'bg-gray-500'}`}
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
              e.stopPropagation();
              data.onDelete();
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
  return (
    <div
      className={`group px-4 py-3 rounded-xl shadow-lg border-2 transition-all duration-500 min-w-[200px] bg-purple-50 relative hover:shadow-2xl transform hover:scale-105 ${selected
          ? 'border-purple-400 shadow-xl scale-105 ring-4 ring-purple-200'
          : 'border-purple-200 hover:border-purple-300 hover:ring-2 hover:ring-purple-100'
        }`}
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

      <div className="flex items-center gap-2 mb-1">
        <BookOpen size={16} className="text-purple-600" />
        <div className="font-semibold text-sm text-gray-800">{data.label}</div>
        {data.onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              data.onDelete();
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

// Optimized Subpage Window Component with performance enhancements
const SubpageWindow = React.memo(({ type, data, onClose, setMindMapData, loadMindMapData, onAutoSave, addToast }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(data);
  const [originalData, setOriginalData] = useState(data);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  // PERFORMANCE FIX: Use useEffect with dependency array to prevent unnecessary updates
  useEffect(() => {
    if (data && data !== originalData) {
      setEditData(data);
      setOriginalData(data);
    }
  }, [data]); // Only depend on data, not originalData to prevent infinite loops

  // PERFORMANCE FIX: Memoize expensive calculations
  const flashcardProgress = useMemo(() => {
    if (!editData || !editData.flashcard_count) return 0;
    return ((editData.completed_flashcards || 0) / editData.flashcard_count) * 100;
  }, [editData?.completed_flashcards, editData?.flashcard_count]);

  // PERFORMANCE FIX: Optimize field update handler with useCallback
  const updateField = useCallback((field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleAttachPdfClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      addToast('Please select a PDF file.', 'error');
      return;
    }

    setIsUploading(true);
    addToast('Uploading PDF...', 'saving');

    const formData = new FormData();
    formData.append('pdf', file);
    // No longer sending literatureId, as the backend is now decoupled.

    try {
      const response = await axios.post(`${API}/upload-pdf`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const { filePath } = response.data;
      updateField('pdf_path', filePath);
      addToast('PDF attached successfully!', 'success');
    } catch (error) {
      console.error('Error uploading PDF:', error);
      addToast('Failed to attach PDF. Check server logs.', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // PERFORMANCE FIX: Memoize save handler to prevent recreation on every render
  const handleSave = useCallback(async () => {
    if (isLoading || !data?.id) return; // Add null check here

    setIsLoading(true);
    try {
      console.log(`Saving ${type} with ID:`, data.id, editData);

      setIsEditing(false);
      setOriginalData(editData);

      // Update mindMapData directly (no API call needed)
      setMindMapData(prevData => {
        const newData = { ...prevData };
        if (type === 'literature') {
          newData.literature = newData.literature.map(item =>
            item.id === data.id ? { ...item, ...editData, updated_at: new Date() } : item
          );
        } else {
          const key = type + 's';
          newData[key] = newData[key].map(item =>
            item.id === data.id ? { ...item, ...editData, updated_at: new Date() } : item
          );
        }

        console.log(`Updated mindMapData after saving ${type}:`, newData);

        // Trigger auto-save asynchronously to prevent blocking
        if (onAutoSave) {
          setTimeout(() => onAutoSave(newData), 0);
        }

        return newData;
      });

      // No need to call loadMindMapData() as it resets positions

    } catch (error) {
      console.error('Error saving data:', error);
      addToast(`Failed to save ${type}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [type, data?.id, editData, setMindMapData, onAutoSave, isLoading, addToast]);

  // PERFORMANCE FIX: Memoize cancel handler
  const handleCancel = useCallback(() => {
    setEditData(originalData);
    setIsEditing(false);
  }, [originalData]);

  // PERFORMANCE FIX: Memoize delete handler
  const handleDelete = useCallback(async () => {
    if (isLoading || !data?.id) return; // Removed confirmation dialog as requested

    setIsLoading(true);
    try {
      console.log(`Deleting ${type} with ID:`, data.id);

      // Update mindMapData directly (no API call needed)
      setMindMapData(prevData => {
        const newData = { ...prevData };
        if (type === 'literature') {
          newData.literature = newData.literature.filter(item => item.id !== data.id);
        } else {
          const key = type + 's';
          newData[key] = newData[key].filter(item => item.id !== data.id);
        }

        // Also remove any connections involving this node
        if (newData.connections) {
          newData.connections = newData.connections.filter(conn =>
            !conn.source.includes(data.id) && !conn.target.includes(data.id)
          );
        }

        console.log(`Updated mindMapData after deleting ${type}:`, newData);

        // Trigger auto-save asynchronously
        if (onAutoSave) {
          setTimeout(() => onAutoSave(newData), 0);
        }

        return newData;
      });

      // PERFORMANCE FIX: Close subpage immediately for better UX
      onClose();

      // No need to call loadMindMapData() as it resets positions
      // The data is already updated in mindMapData state above

    } catch (error) {
      console.error('Error deleting data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [type, data?.id, setMindMapData, onAutoSave, onClose, isLoading]);

  // PERFORMANCE FIX: Early return with loading state for better UX
  if (!data) {
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-40 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div
          className="bg-white rounded-xl shadow-2xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-center py-8">
            <Loader2 size={24} className="animate-spin text-blue-600" />
            <span className="ml-2 text-gray-500">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  // Handle empty data object (error state)
  if (data && Object.keys(data).length === 0) {
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-40 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div
          className="bg-white rounded-xl shadow-2xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Error Loading Data</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
              <p className="text-gray-600">Failed to load data. Please try again.</p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PERFORMANCE FIX: Optimized field renderer without useCallback to avoid hook violations
  const renderEditableField = (label, field, type = 'text', options = {}) => {
    if (!editData) return null;

    const fieldValue = editData[field] || '';

    if (isEditing) {
      if (type === 'textarea') {
        return (
          <div key={field}>
            <h3 className="font-semibold text-gray-800 mb-2">{label}</h3>
            <RichTextEditor
              content={fieldValue}
              onChange={(htmlContent) => updateField(field, htmlContent)}
              placeholder={`Enter ${label.toLowerCase()}...`}
              rows={options.rows || 3}
            />
          </div>
        );
      } else if (type === 'select') {
        return (
          <div key={field}>
            <h3 className="font-semibold text-gray-800 mb-2">{label}</h3>
            <select
              value={fieldValue}
              onChange={(e) => updateField(field, e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              {options.choices?.map(choice => (
                <option key={choice} value={choice}>{choice}</option>
              ))}
            </select>
          </div>
        );
      } else {
        // Special handling for date fields to format correctly
        let inputValue = fieldValue;
        if (type === 'date' && fieldValue) {
          // Convert to YYYY-MM-DD format if it's a date
          try {
            const date = new Date(fieldValue);
            if (!isNaN(date.getTime())) {
              inputValue = date.toISOString().split('T')[0];
            }
          } catch (error) {
            console.warn('Error formatting date:', fieldValue);
          }
        }

        return (
          <div key={field}>
            <h3 className="font-semibold text-gray-800 mb-2">{label}</h3>
            <input
              type={type}
              value={inputValue}
              onChange={(e) => updateField(field, e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
        );
      }
    } else {
      // For textarea fields, handle both HTML and plain text content
      if (type === 'textarea') {
        const fieldContent = fieldValue || '';
        const isHtml = fieldContent.includes('<') && fieldContent.includes('>');

        return (
          <div key={field}>
            <h3 className="font-semibold text-gray-800 mb-2">{label}</h3>
            {isHtml ? (
              <div
                className="text-gray-600 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{
                  __html: fieldContent || `<p>No ${label.toLowerCase()} available.</p>`
                }}
              />
            ) : (
              <p className="text-gray-600 whitespace-pre-wrap">
                {fieldContent || `No ${label.toLowerCase()} available.`}
              </p>
            )}
          </div>
        );
      }

      return (
        <div key={field}>
          <h3 className="font-semibold text-gray-800 mb-2">{label}</h3>
          <p className="text-gray-600">{fieldValue || `No ${label.toLowerCase()} available.`}</p>
        </div>
      );
    }
  };

  // PERFORMANCE FIX: Regular content renderer without useMemo to avoid hook violations
  const renderContent = () => {
    if (!editData) return <div>Loading...</div>;

    switch (type) {
      case 'topic':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div
                className="w-4 h-4 rounded-full transition-colors"
                style={{ backgroundColor: editData.color || '#3B82F6' }}
              />
              {renderEditableField('Title', 'title')}
            </div>

            {renderEditableField('Description', 'description', 'textarea', { rows: 4 })}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderEditableField('Category', 'category')}

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Target size={16} />
                  Flashcard Progress
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Completed</span>
                    <span>{editData.completed_flashcards || 0}/{editData.flashcard_count || 0}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${flashcardProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'literature':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <BookOpen className="text-purple-600" size={24} />
              {renderEditableField('Title', 'title')}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderEditableField('Authors', 'authors')}
              {renderEditableField('Publication', 'publication')}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderEditableField('Year', 'year', 'number')}
              {renderEditableField('DOI', 'doi')}
            </div>

            {renderEditableField('Abstract', 'abstract', 'textarea', { rows: 4 })}
            {renderEditableField('Notes', 'notes', 'textarea', { rows: 3 })}

            {isEditing && (
              <div className="pt-4">
                <h3 className="font-semibold text-gray-800 mb-2">Attachments</h3>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf"
                  style={{ display: 'none' }}
                />
                <LoadingButton
                  onClick={handleAttachPdfClick}
                  loading={isUploading}
                  icon={Upload}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  {isUploading ? 'Uploading...' : 'Attach PDF'}
                </LoadingButton>
                {editData.pdf_path && (
                  <div className="mt-2 text-sm text-gray-600">
                    Current file: <span className="font-medium text-purple-700">{editData.pdf_path.split('/').pop()}</span>
                  </div>
                )}
              </div>
            )}

            {!isEditing && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Attached File</h3>
                {editData.pdf_path ? (
                  <a href={`${BACKEND_URL}${editData.pdf_path}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-2">
                    <FileText size={16} />
                    {editData.pdf_path.split('/').pop()}
                  </a>
                ) : (
                  <p className="text-gray-500 italic">No PDF attached.</p>
                )}
              </div>
            )}
          </div>
        );

      case 'case':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Users className="text-blue-600" size={24} />
              {renderEditableField('Case ID', 'case_id')}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderEditableField('Primary Diagnosis', 'primary_diagnosis')}
              {renderEditableField('Age', 'age', 'number')}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderEditableField('Gender', 'gender', 'select', {
                choices: ['Male', 'Female', 'Non-binary', 'Other']
              })}
              {renderEditableField('Status', 'status', 'select', {
                choices: ['active', 'archived', 'follow_up']
              })}
            </div>

            {renderEditableField('Chief Complaint', 'chief_complaint', 'textarea', { rows: 3 })}
            {renderEditableField('History of Present Illness', 'history_present_illness', 'textarea', { rows: 4 })}
            {renderEditableField('Mental Status Exam', 'mental_status_exam', 'textarea', { rows: 4 })}
            {renderEditableField('Assessment & Plan', 'assessment_plan', 'textarea', { rows: 4 })}
          </div>
        );

      case 'task':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <CheckSquare className="text-amber-600" size={24} />
              {renderEditableField('Title', 'title')}
            </div>

            {renderEditableField('Description', 'description', 'textarea', { rows: 3 })}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {renderEditableField('Status', 'status', 'select', {
                choices: ['pending', 'in_progress', 'completed']
              })}

              {renderEditableField('Priority', 'priority', 'select', {
                choices: ['low', 'medium', 'high']
              })}

              {renderEditableField('Due Date', 'due_date', 'date')}
            </div>
          </div>
        );

      default:
        return <div>Unknown node type</div>;
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-40 backdrop-blur-sm"
      onClick={(e) => {
        // Only close if clicking the backdrop, not the modal content
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden animate-in fade-in duration-300"
        onClick={(e) => e.stopPropagation()} // Prevent modal from closing when clicking inside
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 capitalize">{type} Details</h2>
          <div className="flex items-center gap-2">
            {!isEditing && !isLoading && (
              <>
                <LoadingButton
                  onClick={() => setIsEditing(true)}
                  icon={Edit3}
                  className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50"
                  title="Edit"
                />
                <LoadingButton
                  onClick={handleDelete}
                  loading={isLoading}
                  icon={Trash2}
                  className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50"
                  title="Delete"
                />
              </>
            )}
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100 transition-colors border border-gray-300 hover:border-gray-400"
              disabled={isLoading}
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-160px)]">
          {renderContent()}
        </div>

        {isEditing && (
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
            <LoadingButton
              onClick={handleCancel}
              disabled={isLoading}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-100"
            >
              Cancel
            </LoadingButton>
            <LoadingButton
              onClick={handleSave}
              loading={isLoading}
              icon={Save}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </LoadingButton>
          </div>
        )}
      </div>
    </div>
  );
});

// Enhanced Dedicated Editing Form Component
const EnhancedEditingForm = ({ type, data, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState(data);
  const [activeTab, setActiveTab] = useState('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

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

        {/* Content */}
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
  const [focusedCategory, setFocusedCategory] = useState(null);
  const [showNodeSelector, setShowNodeSelector] = useState(false);
  const [openSubpage, setOpenSubpage] = useState(null);
  const [subpageData, setSubpageData] = useState(null);
  const [isReactFlowReady, setIsReactFlowReady] = useState(false);
  const [hasAppliedInitialLayout, setHasAppliedInitialLayout] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [edgeModal, setEdgeModal] = useState({ isOpen: false, edge: null });
  const [templates, setTemplates] = useState([]);
  const [exportProgress, setExportProgress] = useState({ show: false, progress: 0, message: '' });

  const [toasts, setToasts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);

  const addToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now();
    const newToast = { id, message, type, duration };
    setToasts(prev => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const autoSaveMindMapData = useCallback((data) => {
    const onSaveStart = () => setIsSaving(true);
    const onSaveComplete = (success, error) => {
      setIsSaving(false);
      if (success) {
        setLastSaved(new Date());
        addToast('Data auto-saved', 'saving', 2000);
      } else {
        addToast('Auto-save failed', 'error', 4000);
        console.error('Auto-save error:', error);
      }
    };

    localStorageUtils.save(data, onSaveStart, onSaveComplete);
    saveToBackend(data);
  }, [addToast]);

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

  const convertDataToReactFlow = useCallback((data) => {
    const newNodes = [];
    const newEdges = [];

  // Process topics
  data.topics.forEach(topic => {
    const nodeId = `topic-${topic.id}`;
    newNodes.push({
      id: nodeId,
      type: 'topic',
      position: topic.position || { x: 0, y: 0 },
      data: { ...topic, onDelete: () => handleDeleteNode(nodeId) },
    });
  });

  // Process cases
  data.cases.forEach(caseItem => {
    const nodeId = `case-${caseItem.id}`;
    newNodes.push({
      id: nodeId,
      type: 'case',
      position: caseItem.position || { x: 0, y: 0 },
      data: { ...caseItem, onDelete: () => handleDeleteNode(nodeId) },
    });
  });

  // Process tasks
  data.tasks.forEach(task => {
    const nodeId = `task-${task.id}`;
    newNodes.push({
      id: nodeId,
      type: 'task',
      position: task.position || { x: 0, y: 0 },
      data: { ...task, onDelete: () => handleDeleteNode(nodeId) },
    });
  });

  // Process literature
  data.literature.forEach(lit => {
    const nodeId = `literature-${lit.id}`;
    newNodes.push({
      id: nodeId,
      type: 'literature',
      position: lit.position || { x: 0, y: 0 },
      data: { ...lit, onDelete: () => handleDeleteNode(nodeId) },
    });
  });

  // Only add edges if both source and target nodes exist
  const nodeIdSet = new Set(newNodes.map(n => n.id));
  data.connections.forEach(conn => {
    if (nodeIdSet.has(conn.source) && nodeIdSet.has(conn.target)) {
      newEdges.push({ 
        id: conn.id, 
        source: conn.source, 
        target: conn.target, 
        label: conn.label,
        type: 'floating', // Use our optimized floating edge type
        style: { 
          strokeWidth: 2, 
          stroke: '#64748b',
          opacity: 0.85,
          transition: 'none' // Disable CSS transitions
        },
        animated: false,
        updatable: true,
        // Add a timestamp to force re-render of the edge when source or target nodes move
        data: { __forceUpdate: Date.now() },
        interactionWidth: 20 // Wider area for interaction
      });
    }
  });

  setNodes(newNodes);
  setEdges(newEdges);
}, [setNodes, setEdges, handleDeleteNode]);

  const saveToBackend = useCallback(async (data) => {
    try {
      // Deep clone the data to avoid modifying the original
      const cleanData = {
        topics: JSON.parse(JSON.stringify(data.topics || [])),
        cases: JSON.parse(JSON.stringify(data.cases || [])),
        tasks: JSON.parse(JSON.stringify(data.tasks || [])),
        literature: JSON.parse(JSON.stringify(data.literature || [])),
        connections: JSON.parse(JSON.stringify(data.connections || []))
      };
      
      // Current timestamp for created_at/updated_at fields
      const now = new Date().toISOString();
      
      // Clean and validate topics
      cleanData.topics = cleanData.topics.map(topic => {
        // Ensure all required fields exist
        return {
          id: String(topic.id || Date.now()),
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
      cleanData.cases = cleanData.cases.map(caseItem => {
        // Ensure all required fields exist
        return {
          id: String(caseItem.id || Date.now()),
          case_id: caseItem.case_id || `CASE-${Date.now()}`,
          encounter_date: caseItem.encounter_date || now,
          primary_diagnosis: caseItem.primary_diagnosis || "Unspecified",
          secondary_diagnoses: Array.isArray(caseItem.secondary_diagnoses) ? caseItem.secondary_diagnoses : [],
          age: caseItem.age !== undefined ? Number(caseItem.age) : null,
          gender: caseItem.gender || null,
          chief_complaint: caseItem.chief_complaint || "Unspecified",
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
      cleanData.tasks = cleanData.tasks.map(task => {
        // Ensure all required fields exist
        return {
          id: String(task.id || Date.now()),
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
      cleanData.literature = cleanData.literature.map(lit => {
        // Ensure all required fields exist
        return {
          id: String(lit.id || Date.now()),
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
      cleanData.connections = cleanData.connections.map(conn => {
        // For connections, we only need these basic properties
        return {
          id: String(conn.id || Date.now()),
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
      animated: false,
      updatable: true,
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
    const key = type === 'literature' ? 'literature' : `${type}s`;
    const dataItem = mindMapData[key].find(item => String(item.id) === id);
    if (dataItem) {
      setSubpageData(dataItem);
      setOpenSubpage(type);
    }
  }, [mindMapData]);

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

  // Force-directed layout (defined early to avoid initialization issues)
  const forceLayout = useCallback(() => {
    if (nodes.length === 0) return;

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

    // Run simulation for optimal positioning
    simulation.tick(400);

    // Update nodes with new positions
    const updatedNodes = simulationNodes.map(simNode => {
      const originalNode = nodes.find(n => n.id === simNode.id);
      return {
        ...originalNode,
        position: { x: simNode.x, y: simNode.y },
      };
    });
    
    // Update both nodes and edges in a single batch
    setNodes(updatedNodes);
    setEdges(validEdges); // Restore the original edges with their styling

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
  }, [nodes, edges, setNodes, setEdges, setMindMapData, fitView]);

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
    setOpenSubpage(null);
    setSubpageData(null);
    setFocusedCategory(null);
    autoSaveMindMapData(empty);
    addToast('Mind map cleared successfully', 'success');
  }, [setNodes, setEdges, autoSaveMindMapData, addToast]);

  const handleNodesChange = useCallback((changes) => {
    // Apply the node changes to React Flow state immediately
    onNodesChange(changes);
    
    // Now process position changes for edge updates
    const positionChanges = changes.filter(change => 
      change.type === 'position' && change.position
    );
    
    if (positionChanges.length > 0) {
      // Create a map of changed node IDs for quick lookup
      const changedNodeIds = new Set(positionChanges.map(change => change.id));
      
      // Update edges that connect to any of the moved nodes
      setEdges(currentEdges => {
        // Only update edges that are connected to nodes that moved
        return currentEdges.map(edge => {
          if (changedNodeIds.has(edge.source) || changedNodeIds.has(edge.target)) {
            // Add a timestamp to force re-render of the edge
            return {
              ...edge,
              data: {
                ...(edge.data || {}),
                __forceUpdate: Date.now() // Use timestamp for unique updates
              }
            };
          }
          return edge;
        });
      });
      
      // Update mindMapData for position persistence
      setMindMapData(currentData => {
        const updatedData = { ...currentData };
        
        positionChanges.forEach(change => {
          if (change.position) {
            const [type, id] = change.id.split('-');
            const key = type === 'literature' ? 'literature' : `${type}s`;
            const item = updatedData[key]?.find(i => String(i.id) === id);
            
            if (item) {
              item.position = { ...change.position };
            }
          }
        });
        
        return updatedData;
      });
    }
  }, [onNodesChange, setEdges, setMindMapData]);

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
    try {
      const local = localStorageUtils.load();
      if (local) {
        if (!local.connections) local.connections = [];
        setMindMapData(local);
        convertDataToReactFlow(local);
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API}/mindmap-data`);
      if (!response.data.connections) response.data.connections = [];
      setMindMapData(response.data);
      convertDataToReactFlow(response.data);
      autoSaveMindMapData(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error loading mind map:', err);
      addToast('Failed to load mind map', 'error');
      setLoading(false);
    }
  }, [addToast, autoSaveMindMapData, convertDataToReactFlow]);

  useEffect(() => {
    // EMERGENCY PATCH: Force clear all mind map data on every load
    const empty = { topics: [], cases: [], tasks: [], literature: [], connections: [] };
    localStorageUtils.save(empty);
    setMindMapData(empty);
    setNodes([]);
    setEdges([]);
    // Optionally, also clear backend data if needed:
    // saveToBackend(empty);

    // Continue with normal load (will be empty)
    loadMindMapData();
    // Load templates from a source (e.g., API or localStorage)
    // For now, using mock data
    setTemplates([
      { id: 'template1', name: 'Schizophrenia Workup', nodeType: 'case', data: { primary_diagnosis: 'Schizophrenia', chief_complaint: 'Auditory hallucinations' } },
      { id: 'template2', name: 'MDD Follow-up', nodeType: 'case', data: { primary_diagnosis: 'Major Depressive Disorder', status: 'follow_up' } },
      { id: 'template3', name: 'CBT for Anxiety', nodeType: 'topic', data: { title: 'CBT for Anxiety', category: 'Anxiety Disorders' } }
    ]);
  }, []); // Run only once on mount

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
          default:
            break;
        }
      }
      
      if (event.key === 'Escape') {
        setSelectedNode(null);
        setOpenSubpage(null);
        setShowNodeSelector(false);
        setIsTemplateManagerOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, applyForceLayout]);

  useEffect(() => {
    if (isReactFlowReady && !hasAppliedInitialLayout && nodes.length > 0) {
      // Add a delay to ensure React Flow is fully ready
      setTimeout(() => {
        try {
          forceLayout();
          setHasAppliedInitialLayout(true);
        } catch (error) {
          console.warn('Force layout failed, skipping initial layout:', error);
          setHasAppliedInitialLayout(true);
        }
      }, 500);
    }
  }, [isReactFlowReady, hasAppliedInitialLayout, nodes, forceLayout]);

  // Category filtering effect
  useEffect(() => {
    if (focusedCategory) {
      setNodes(currentNodes => {
        const filteredNodes = currentNodes.map(node => ({
          ...node,
          hidden: !node.id.startsWith(focusedCategory)
        }));
        
        // Also filter edges based on visible nodes
        const visibleNodeIds = new Set(filteredNodes.filter(n => !n.hidden).map(n => n.id));
        setEdges(currentEdges => currentEdges.map(edge => ({
          ...edge,
          hidden: !visibleNodeIds.has(edge.source) || !visibleNodeIds.has(edge.target)
        })));
        
        return filteredNodes;
      });
    } else {
      setNodes(currentNodes => currentNodes.map(node => ({
        ...node,
        hidden: false
      })));
      setEdges(currentEdges => currentEdges.map(edge => ({
        ...edge,
        hidden: false
      })));
    }
  }, [focusedCategory, setNodes, setEdges]);

  // Optionally: handle layout setup on first render if needed

return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* --- Left Sidebar --- */}
      <div className="w-80 bg-gradient-to-b from-slate-800 to-slate-900 text-white p-6 shadow-2xl flex flex-col">
        <div className="mb-8">
          <div className="text-3xl font-bold tracking-wide text-white">PGY-3 HQ</div>
          <div className="text-sm text-slate-300 mt-2">Psychiatry Resident Dashboard</div>
        </div>

        {/* --- Search --- */}
        <div className="mb-6">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-700 bg-opacity-50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
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
                    setSubpageData(dataItem);
                    setOpenSubpage(type);
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
          edgeTypes={{ floating: FloatingEdge }}
          onInit={() => setIsReactFlowReady(true)}
          fitView
          nodesConnectable={isEditing}
          nodesDraggable={true}
          snapToGrid={false}
          snapGrid={[15, 15]}
          elevateEdgesOnSelect={false}
          connectionLineType="straight"
          connectionLineStyle={{
            stroke: '#3b82f6',
            strokeWidth: 3,
            opacity: 1,
            strokeLinecap: 'round',
            strokeDasharray: '8,4',
            filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))'
          }}
          defaultEdgeOptions={{
            type: 'floating',
            style: { 
              strokeWidth: 2.5, 
              stroke: '#64748b',
              opacity: 0.9,
              strokeLinecap: 'round',
              transition: 'none'
            },
            animated: false,
            updatable: true,
            focusable: true
          }}
          className="bg-gradient-to-br from-blue-50 to-indigo-100"
        >
          <Background color="#aaa" gap={16} />
          <Controls />
          <MiniMap />
        </ReactFlow>
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
      {showNodeSelector && (
        <NodeSelector
          isOpen={showNodeSelector}
          onClose={() => setShowNodeSelector(false)}
          onSelect={(nodeType, templateId) => {
            setShowNodeSelector(false);
            const dataId = Date.now();
            const id = `${nodeType}-${dataId}`;
            const newNode = {
              id,
              type: nodeType,
              position: { x: window.innerWidth / 3, y: window.innerHeight / 2 },
              data: { id: dataId, label: `New ${nodeType}`, onDelete: () => handleDeleteNode(id) }
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

      {openSubpage && (
        <SubpageWindow
          type={openSubpage}
          data={subpageData}
          onClose={() => setOpenSubpage(null)}
          setMindMapData={setMindMapData}
          loadMindMapData={loadMindMapData}
          onAutoSave={autoSaveMindMapData}
          addToast={addToast}
        />
      )}

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








const Dashboard = () => (
  <ReactFlowProvider>
    <DashboardComponent />
  </ReactFlowProvider>
);

function App() {
  return <Dashboard />;
}

export default App;