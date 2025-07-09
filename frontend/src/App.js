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
import RichTextEditor from './components/RichTextEditor';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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
    switch(type) {
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
      className={`${className} transform transition-all duration-200 hover:scale-105 active:scale-95 ${
        disabled || loading ? 'cursor-not-allowed opacity-50' : 'hover:shadow-lg'
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
      className={`group px-4 py-3 rounded-xl shadow-lg border-2 transition-all duration-500 min-w-[220px] relative hover:shadow-2xl transform hover:scale-105 backdrop-blur-sm ${
        selected 
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
      {/* Connection Handles - One per position with click handlers */}
      <Handle 
        id="top"
        type="source" 
        position={Position.Top} 
        className="w-3 h-3 !bg-white border-2 border-current transition-all duration-300 hover:scale-150 opacity-80 hover:opacity-100 cursor-pointer" 
        style={{ left: '50%', transform: 'translateX(-50%)' }}
        onClick={(e) => {
          e.stopPropagation();
          data.onHandleClick?.(data.originalData.id, 'top');
        }}
      />
      
      <Handle 
        id="bottom"
        type="source" 
        position={Position.Bottom} 
        className="w-3 h-3 !bg-white border-2 border-current transition-all duration-300 hover:scale-150 opacity-80 hover:opacity-100 cursor-pointer" 
        style={{ left: '50%', transform: 'translateX(-50%)' }}
        onClick={(e) => {
          e.stopPropagation();
          data.onHandleClick?.(data.originalData.id, 'bottom');
        }}
      />
      
      <Handle 
        id="left"
        type="source" 
        position={Position.Left} 
        className="w-3 h-3 !bg-white border-2 border-current transition-all duration-300 hover:scale-150 opacity-80 hover:opacity-100 cursor-pointer" 
        style={{ top: '50%', transform: 'translateY(-50%)' }}
        onClick={(e) => {
          e.stopPropagation();
          data.onHandleClick?.(data.originalData.id, 'left');
        }}
      />
      
      <Handle 
        id="right"
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 !bg-white border-2 border-current transition-all duration-300 hover:scale-150 opacity-80 hover:opacity-100 cursor-pointer" 
        style={{ top: '50%', transform: 'translateY(-50%)' }}
        onClick={(e) => {
          e.stopPropagation();
          data.onHandleClick?.(data.originalData.id, 'right');
        }}
      />
      
      {/* Priority indicator */}
      {data.priority && (
        <div className="absolute -top-2 -right-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white ${
            data.priority === 'high' ? 'bg-red-500' :
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
    switch(status) {
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
      className={`group px-4 py-3 rounded-xl shadow-lg border-2 transition-all duration-500 min-w-[220px] bg-white relative hover:shadow-2xl transform hover:scale-105 ${
        selected 
          ? 'border-blue-400 shadow-xl scale-105 ring-4 ring-blue-200' 
          : 'border-gray-200 hover:border-blue-300 hover:ring-2 hover:ring-blue-100'
      } ${urgency === 'high' ? 'ring-2 ring-red-300' : ''}`}
    >
      {/* Connection Handles - One per position with click handlers */}
      <Handle 
        id="top"
        type="source" 
        position={Position.Top} 
        className="w-3 h-3 !bg-blue-500 transition-all duration-300 hover:scale-150 opacity-80 hover:opacity-100 cursor-pointer" 
        style={{ left: '50%', transform: 'translateX(-50%)' }}
        onClick={(e) => {
          e.stopPropagation();
          data.onHandleClick?.(data.originalData.id, 'top');
        }}
      />
      
      <Handle 
        id="bottom"
        type="source" 
        position={Position.Bottom} 
        className="w-3 h-3 !bg-blue-500 transition-all duration-300 hover:scale-150 opacity-80 hover:opacity-100 cursor-pointer" 
        style={{ left: '50%', transform: 'translateX(-50%)' }}
        onClick={(e) => {
          e.stopPropagation();
          data.onHandleClick?.(data.originalData.id, 'bottom');
        }}
      />
      
      <Handle 
        id="left"
        type="source" 
        position={Position.Left} 
        className="w-3 h-3 !bg-blue-500 transition-all duration-300 hover:scale-150 opacity-80 hover:opacity-100 cursor-pointer" 
        style={{ top: '50%', transform: 'translateY(-50%)' }}
        onClick={(e) => {
          e.stopPropagation();
          data.onHandleClick?.(data.originalData.id, 'left');
        }}
      />
      
      <Handle 
        id="right"
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 !bg-blue-500 transition-all duration-300 hover:scale-150 opacity-80 hover:opacity-100 cursor-pointer" 
        style={{ top: '50%', transform: 'translateY(-50%)' }}
        onClick={(e) => {
          e.stopPropagation();
          data.onHandleClick?.(data.originalData.id, 'right');
        }}
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
  const statusColors = {
    pending: 'bg-yellow-500',
    in_progress: 'bg-blue-500',
    completed: 'bg-green-500'
  };

  return (
    <div 
      className={`group px-4 py-3 rounded-xl shadow-lg border-2 transition-all duration-500 min-w-[200px] text-white relative hover:shadow-2xl transform hover:scale-105 ${
        selected 
          ? 'border-yellow-400 shadow-xl scale-105 ring-4 ring-yellow-200' 
          : 'border-transparent hover:border-yellow-300 hover:ring-2 hover:ring-yellow-100'
      } ${statusColors[data.status] || 'bg-gray-500'}`}
    >
      {/* Connection Handles - One per position with click handlers */}
      <Handle 
        id="top"
        type="source" 
        position={Position.Top} 
        className="w-3 h-3 !bg-white transition-all duration-300 hover:scale-150 opacity-80 hover:opacity-100 cursor-pointer" 
        style={{ left: '50%', transform: 'translateX(-50%)' }}
        onClick={(e) => {
          e.stopPropagation();
          data.onHandleClick?.(data.originalData.id, 'top');
        }}
      />
      
      <Handle 
        id="bottom"
        type="source" 
        position={Position.Bottom} 
        className="w-3 h-3 !bg-white transition-all duration-300 hover:scale-150 opacity-80 hover:opacity-100 cursor-pointer" 
        style={{ left: '50%', transform: 'translateX(-50%)' }}
        onClick={(e) => {
          e.stopPropagation();
          data.onHandleClick?.(data.originalData.id, 'bottom');
        }}
      />
      
      <Handle 
        id="left"
        type="source" 
        position={Position.Left} 
        className="w-3 h-3 !bg-white transition-all duration-300 hover:scale-150 opacity-80 hover:opacity-100 cursor-pointer" 
        style={{ top: '50%', transform: 'translateY(-50%)' }}
        onClick={(e) => {
          e.stopPropagation();
          data.onHandleClick?.(data.originalData.id, 'left');
        }}
      />
      
      <Handle 
        id="right"
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 !bg-white transition-all duration-300 hover:scale-150 opacity-80 hover:opacity-100 cursor-pointer" 
        style={{ top: '50%', transform: 'translateY(-50%)' }}
        onClick={(e) => {
          e.stopPropagation();
          data.onHandleClick?.(data.originalData.id, 'right');
        }}
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
      className={`group px-4 py-3 rounded-xl shadow-lg border-2 transition-all duration-500 min-w-[200px] bg-purple-50 relative hover:shadow-2xl transform hover:scale-105 ${
        selected 
          ? 'border-purple-400 shadow-xl scale-105 ring-4 ring-purple-200' 
          : 'border-purple-200 hover:border-purple-300 hover:ring-2 hover:ring-purple-100'
      }`}
    >
      {/* Connection Handles - One per position with click handlers */}
      <Handle 
        id="top"
        type="source" 
        position={Position.Top} 
        className="w-3 h-3 !bg-purple-500 transition-all duration-300 hover:scale-150 opacity-80 hover:opacity-100 cursor-pointer" 
        style={{ left: '50%', transform: 'translateX(-50%)' }}
        onClick={(e) => {
          e.stopPropagation();
          data.onHandleClick?.(data.originalData.id, 'top');
        }}
      />
      
      <Handle 
        id="bottom"
        type="source" 
        position={Position.Bottom} 
        className="w-3 h-3 !bg-purple-500 transition-all duration-300 hover:scale-150 opacity-80 hover:opacity-100 cursor-pointer" 
        style={{ left: '50%', transform: 'translateX(-50%)' }}
        onClick={(e) => {
          e.stopPropagation();
          data.onHandleClick?.(data.originalData.id, 'bottom');
        }}
      />
      
      <Handle 
        id="left"
        type="source" 
        position={Position.Left} 
        className="w-3 h-3 !bg-purple-500 transition-all duration-300 hover:scale-150 opacity-80 hover:opacity-100 cursor-pointer" 
        style={{ top: '50%', transform: 'translateY(-50%)' }}
        onClick={(e) => {
          e.stopPropagation();
          data.onHandleClick?.(data.originalData.id, 'left');
        }}
      />
      
      <Handle 
        id="right"
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 !bg-purple-500 transition-all duration-300 hover:scale-150 opacity-80 hover:opacity-100 cursor-pointer" 
        style={{ top: '50%', transform: 'translateY(-50%)' }}
        onClick={(e) => {
          e.stopPropagation();
          data.onHandleClick?.(data.originalData.id, 'right');
        }}
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
    
    switch(type) {
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
    switch(type) {
      case 'topic':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => updateFormData('title', e.target.value)}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
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
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.category ? 'border-red-500' : 'border-gray-300'
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
                    className={`w-8 h-8 rounded-full border-2 ${
                      formData.color === color ? 'border-gray-800' : 'border-gray-300'
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
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.case_id ? 'border-red-500' : 'border-gray-300'
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
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.primary_diagnosis ? 'border-red-500' : 'border-gray-300'
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
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === key
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
const NodeSelector = ({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;

  const nodeTypes = [
    { type: 'topic', label: 'Psychiatric Topic', icon: Brain, color: 'bg-blue-600', description: 'Add a new psychiatric topic or disorder' },
    { type: 'literature', label: 'Literature', icon: BookOpen, color: 'bg-purple-600', description: 'Add research papers, articles, or references' },
    { type: 'case', label: 'Patient Case', icon: Users, color: 'bg-indigo-600', description: 'Add a new patient case study' },
    { type: 'task', label: 'Task', icon: CheckSquare, color: 'bg-amber-600', description: 'Add a task or to-do item' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-800">Add New Node</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-3">
          {nodeTypes.map(({ type, label, icon: Icon, color, description }) => (
            <button
              key={type}
              onClick={() => {
                onSelect(type);
                onClose();
              }}
              className="w-full flex items-center gap-4 p-4 rounded-lg border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
            >
              <div className={`${color} p-2 rounded-lg text-white`}>
                <Icon size={20} />
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-800">{label}</div>
                <div className="text-sm text-gray-500">{description}</div>
              </div>
            </button>
          ))}
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
const Dashboard = () => {
  const { fitView, setCenter, zoomTo, getViewport, addEdges } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [mindMapData, setMindMapData] = useState({ 
    topics: [], 
    cases: [], 
    tasks: [], 
    literature: [],
    connections: [] // Store complete React Flow edge objects for proper persistence
  });
  const [isEditing, setIsEditing] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [focusedCategory, setFocusedCategory] = useState(null);
  const [showNodeSelector, setShowNodeSelector] = useState(false);
  const [openSubpage, setOpenSubpage] = useState(null); // { type, data }
  const [subpageData, setSubpageData] = useState(null);
  const [isReactFlowReady, setIsReactFlowReady] = useState(false);
  const [hasAppliedInitialLayout, setHasAppliedInitialLayout] = useState(false);
  const [searchQuery, setSearchQuery] = useState(''); // Global search state
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [exportProgress, setExportProgress] = useState({ show: false, progress: 0, message: '' });
  
  // Toast notifications state
  const [toasts, setToasts] = useState([]);
  
  // Edge label editing state
  const [editingEdge, setEditingEdge] = useState(null);
  
  // Programmatic connection state
  const [startHandle, setStartHandle] = useState(null);

  // Helper function to add toast notifications
  const addToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now();
    const newToast = { id, message, type, duration };
    setToasts(prev => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Helper function to strip HTML tags from content for search
  const stripHtml = useCallback((html) => {
    if (!html || typeof html !== 'string') return '';
    
    // Check if it contains HTML tags
    if (!html.includes('<') || !html.includes('>')) {
      return html; // Already plain text
    }
    
    // Create a temporary div to parse HTML and extract text
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }, []);

  // Global search filtering logic
  const filteredNodeIds = useMemo(() => {
    if (!searchQuery.trim()) {
      return []; // Return empty array when no search query
    }

    const query = searchQuery.toLowerCase();
    const matchingIds = [];

    // Search through topics
    mindMapData.topics.forEach(topic => {
      const searchableText = [
        topic.title,
        stripHtml(topic.description), // Strip HTML from description
        topic.category,
        ...(topic.resources?.map(r => r.title) || [])
      ].join(' ').toLowerCase();
      
      if (searchableText.includes(query)) {
        matchingIds.push(`topic-${topic.id}`);
      }
    });

    // Search through literature
    mindMapData.literature?.forEach(lit => {
      const searchableText = [
        lit.title,
        lit.authors,
        lit.publication,
        stripHtml(lit.abstract), // Strip HTML from abstract
        stripHtml(lit.notes), // Strip HTML from notes
        lit.year?.toString()
      ].join(' ').toLowerCase();
      
      if (searchableText.includes(query)) {
        matchingIds.push(`literature-${lit.id}`);
      }
    });

    // Search through cases
    mindMapData.cases.forEach(caseItem => {
      const searchableText = [
        caseItem.case_id,
        caseItem.primary_diagnosis,
        stripHtml(caseItem.chief_complaint), // Strip HTML
        stripHtml(caseItem.history_present_illness), // Strip HTML
        stripHtml(caseItem.medical_history), // Strip HTML
        stripHtml(caseItem.assessment_plan), // Strip HTML
        stripHtml(caseItem.notes), // Strip HTML
        caseItem.age?.toString(),
        caseItem.gender,
        ...(caseItem.secondary_diagnoses || []),
        ...(caseItem.medications || [])
      ].join(' ').toLowerCase();
      
      if (searchableText.includes(query)) {
        matchingIds.push(`case-${caseItem.id}`);
      }
    });

    // Search through tasks
    mindMapData.tasks.forEach(task => {
      const searchableText = [
        task.title,
        stripHtml(task.description), // Strip HTML from description
        task.priority,
        task.status
      ].join(' ').toLowerCase();
      
      if (searchableText.includes(query)) {
        matchingIds.push(`task-${task.id}`);
      }
    });

    // Search through connection labels (NEW: Include edge labels in search)
    mindMapData.connections?.forEach(conn => {
      if (conn.label && conn.label.toLowerCase().includes(query)) {
        // Add both connected nodes to matching results
        const sourceNode = conn.source; // e.g., "topic-123"
        const targetNode = conn.target; // e.g., "case-456"
        
        if (!matchingIds.includes(sourceNode)) {
          matchingIds.push(sourceNode);
        }
        if (!matchingIds.includes(targetNode)) {
          matchingIds.push(targetNode);
        }
        
        console.log(`Found edge label match: "${conn.label}" connecting ${sourceNode} to ${targetNode}`);
      }
    });

    console.log(`Search "${query}" found ${matchingIds.length} matching nodes:`, matchingIds);
    return matchingIds;
  }, [searchQuery, mindMapData, stripHtml]);

  // Enhanced auto-save function with visual feedback
  const autoSaveMindMapData = useCallback((data) => {
    const onSaveStart = () => {
      setIsSaving(true);
    };
    
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

    // Save to localStorage (primary)
    localStorageUtils.save(data, onSaveStart, onSaveComplete);
    
    // Also save to backend (secondary, for persistence)
    saveToBackend(data);
  }, [addToast]);

  // Function to save data to the local backend
  const saveToBackend = useCallback(async (data) => {
    try {
      console.log('Saving data to local backend...');
      const response = await axios.put(`${API}/mindmap-data`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('Data successfully saved to backend:', response.data.message);
    } catch (error) {
      console.warn('Failed to save to backend (continuing with localStorage):', error);
      // Don't show error toast since localStorage is primary
    }
  }, [API]);

  // Function to clear the entire mind map
  const handleClearMap = useCallback(async () => {
    if (!window.confirm('Are you sure you want to clear the entire mind map? This action cannot be undone.')) {
      return;
    }

    try {
      // Clear all data
      const emptyData = { topics: [], cases: [], tasks: [], literature: [], connections: [] };
      setMindMapData(emptyData);
      setNodes([]);
      setEdges([]);
      
      // Save empty state to localStorage
      autoSaveMindMapData(emptyData);
      
      // Show success message
      addToast('Mind map cleared successfully', 'success');
      
      // Reset other states
      setSelectedNode(null);
      setOpenSubpage(null);
      setSubpageData(null);
      setFocusedCategory(null);
      
    } catch (error) {
      console.error('Error clearing mind map:', error);
      addToast('Failed to clear mind map', 'error');
    }
  }, [setMindMapData, setNodes, setEdges, autoSaveMindMapData, addToast]);

  // Modified handleNodesChange to trigger auto-save
  const handleNodesChange = useCallback((changes) => {
    onNodesChange(changes);
    
    // Auto-save when nodes are moved
    const moveChanges = changes.filter(change => change.type === 'position' && change.dragging === false);
    if (moveChanges.length > 0) {
      // Update mindMapData with new positions and trigger auto-save
      setTimeout(() => {
        const updatedData = { ...mindMapData };
        
        // Update positions in mindMapData
        nodes.forEach(node => {
          const [nodeType, nodeId] = node.id.split('-');
          const collection = nodeType === 'literature' ? 'literature' : nodeType + 's';
          
          if (updatedData[collection]) {
            const item = updatedData[collection].find(item => item.id === nodeId);
            if (item) {
              item.position = node.position;
            }
          }
        });
        
        setMindMapData(updatedData);
        autoSaveMindMapData(updatedData);
        console.log('Node positions auto-saved to localStorage');
      }, 100);
    }
  }, [onNodesChange, mindMapData, nodes, autoSaveMindMapData]);

  useEffect(() => {
    loadMindMapData();
  }, []);

  useEffect(() => {
    // Refresh nodes when edit mode changes
    if (mindMapData.topics.length > 0) {
      // Add longer delay to ensure auto-save and state updates complete
      setTimeout(() => {
        console.log('Mode switching - refreshing nodes with current mindMapData:');
        console.log('Literature connections:', mindMapData.literature?.map(lit => ({
          id: lit.id,
          title: lit.title,
          linked_topics: lit.linked_topics
        })));
        console.log('Case connections:', mindMapData.cases?.map(c => ({
          id: c.id,
          case_id: c.case_id,
          linked_topics: c.linked_topics
        })));
        console.log('Task connections:', mindMapData.tasks?.map(t => ({
          id: t.id,
          title: t.title,
          linked_case_id: t.linked_case_id,
          linked_topic_id: t.linked_topic_id
        })));
        
        convertDataToReactFlow(mindMapData, true); // Preserve positions when toggling edit mode
      }, 800); // Increased to 800ms to ensure localStorage save completes
    }
  }, [isEditing]);

  // Effect to apply initial layout when both React Flow and data are ready
  useEffect(() => {
    if (isReactFlowReady && mindMapData.topics.length > 0 && !hasAppliedInitialLayout && !loading) {
      // Only apply layout if nodes don't have saved positions
      const hasNodePositions = mindMapData.topics.some(topic => topic.position) ||
                               mindMapData.cases.some(caseItem => caseItem.position) ||
                               mindMapData.tasks.some(task => task.position) ||
                               (mindMapData.literature && mindMapData.literature.some(lit => lit.position));
      
      if (!hasNodePositions) {
        setTimeout(() => {
          console.log('Applying initial hierarchical layout from useEffect (no saved positions)...');
          applyLayout();
          setHasAppliedInitialLayout(true);
        }, 1000);
      } else {
        console.log('Skipping layout from useEffect - using saved positions');
        setHasAppliedInitialLayout(true);
      }
    }
  }, [isReactFlowReady, mindMapData, hasAppliedInitialLayout, loading]);

  // Effect to re-render nodes when search query changes
  useEffect(() => {
    if (mindMapData.topics.length > 0 || mindMapData.cases.length > 0 || 
        mindMapData.tasks.length > 0 || mindMapData.literature?.length > 0) {
      console.log('Search query changed, updating node visibility');
      convertDataToReactFlow(mindMapData, true); // Preserve positions
    }
  }, [searchQuery, filteredNodeIds]);

  const loadMindMapData = async () => {
    try {
      // First try to load from localStorage
      const localData = localStorageUtils.load();
      
      if (localData) {
        console.log('Loading data from localStorage');
        
        // Ensure connections array exists for backward compatibility
        if (!localData.connections) {
          localData.connections = [];
        }
        
        setMindMapData(localData);
        convertDataToReactFlow(localData);
        setLoading(false);
        
        // Only apply initial layout if nodes don't have saved positions
        const hasNodePositions = localData.topics.some(topic => topic.position) ||
                                 localData.cases.some(caseItem => caseItem.position) ||
                                 localData.tasks.some(task => task.position) ||
                                 (localData.literature && localData.literature.some(lit => lit.position));
        
        if (isReactFlowReady && !hasAppliedInitialLayout && !hasNodePositions &&
            (localData.topics.length > 0 || localData.cases.length > 0 || 
             localData.tasks.length > 0 || localData.literature?.length > 0)) {
          setTimeout(() => {
            console.log('Applying initial layout from localStorage (no saved positions)...');
            applyLayout();
            setHasAppliedInitialLayout(true);
          }, 100);
        } else if (hasNodePositions) {
          console.log('Skipping layout application - using saved node positions');
          setHasAppliedInitialLayout(true); // Mark as applied since we're using saved positions
        }
        
        // Optionally sync with backend in the background
        setTimeout(() => {
          syncWithBackend();
        }, 2000);
        
        return;
      }
      
      // Fallback to API if no localStorage data
      console.log('No localStorage data found, loading from API');
      const response = await axios.get(`${API}/mindmap-data`);
      
      // Ensure connections array exists for backend data too
      if (!response.data.connections) {
        response.data.connections = [];
      }
      
      setMindMapData(response.data);
      convertDataToReactFlow(response.data);
      setLoading(false);
      
      // Save initial data to localStorage
      autoSaveMindMapData(response.data);
      
      // Only apply initial layout if nodes don't have saved positions
      const hasNodePositions = response.data.topics.some(topic => topic.position) ||
                               response.data.cases.some(caseItem => caseItem.position) ||
                               response.data.tasks.some(task => task.position) ||
                               (response.data.literature && response.data.literature.some(lit => lit.position));
      
      if (isReactFlowReady && !hasAppliedInitialLayout && !hasNodePositions &&
          (response.data.topics.length > 0 || response.data.cases.length > 0 || 
           response.data.tasks.length > 0 || response.data.literature?.length > 0)) {
        // Apply layout immediately to prevent jumping
        console.log('Applying initial layout from API (no saved positions)...');
        setTimeout(() => {
          applyLayout();
          setHasAppliedInitialLayout(true);
        }, 100);
      } else if (hasNodePositions) {
        console.log('Skipping layout application - using saved node positions from API');
        setHasAppliedInitialLayout(true); // Mark as applied since we're using saved positions
      }
    } catch (error) {
      console.error('Error loading mind map data:', error);
      setLoading(false);
    }
  };

  // Background sync with backend (optional)
  const syncWithBackend = async () => {
    try {
      const response = await axios.get(`${API}/mindmap-data`);
      const backendData = response.data;
      
      // Simple comparison - in a real app you might want more sophisticated sync logic
      const localData = localStorageUtils.load();
      if (localData && JSON.stringify(localData) !== JSON.stringify(backendData)) {
        console.log('Backend data differs from localStorage, keeping localStorage version');
        // Optionally show a notification to user about data differences
      }
    } catch (error) {
      console.warn('Background sync with backend failed:', error);
    }
  };

  const onReactFlowInit = useCallback(() => {
    console.log('React Flow initialized');
    setIsReactFlowReady(true);
    
    // Only apply initial layout if data is loaded AND nodes don't have saved positions
    if (mindMapData.topics.length > 0 && !hasAppliedInitialLayout) {
      const hasNodePositions = mindMapData.topics.some(topic => topic.position) ||
                               mindMapData.cases.some(caseItem => caseItem.position) ||
                               mindMapData.tasks.some(task => task.position) ||
                               (mindMapData.literature && mindMapData.literature.some(lit => lit.position));
      
      if (!hasNodePositions) {
        setTimeout(() => {
          console.log('Applying initial layout after React Flow init (no saved positions)...');
          applyLayout();
          setHasAppliedInitialLayout(true);
        }, 100);
      } else {
        console.log('Skipping layout after React Flow init - using saved positions');
        setHasAppliedInitialLayout(true);
      }
    }
  }, [mindMapData, hasAppliedInitialLayout]);
  const deleteNode = async (nodeId, nodeType) => {
    try {
      console.log(`Deleting ${nodeType} with ID:`, nodeId);
      
      // Remove from React Flow visually
      setNodes((nds) => nds.filter(n => n.id !== `${nodeType}-${nodeId}`));
      setEdges((eds) => eds.filter(e => 
        !e.id.includes(`${nodeType}-${nodeId}`)
      ));
      
      // Update mindMapData and trigger auto-save
      setMindMapData(prevData => {
        const updatedData = { ...prevData };
        const collection = nodeType === 'literature' ? 'literature' : nodeType + 's';
        
        if (updatedData[collection]) {
          updatedData[collection] = updatedData[collection].filter(item => item.id !== nodeId);
        }
        
        // Also remove any connections involving this node
        if (updatedData.connections) {
          updatedData.connections = updatedData.connections.filter(conn => 
            !conn.source.includes(nodeId) && !conn.target.includes(nodeId)
          );
        }
        
        console.log(`Updated mindMapData after deleting ${nodeType}:`, updatedData);
        
        // Trigger auto-save to both localStorage and backend
        autoSaveMindMapData(updatedData);
        
        return updatedData;
      });
      
      // Show success message
      addToast(`${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)} deleted successfully`, 'success');
      
    } catch (error) {
      console.error('Error deleting node:', error);
      addToast(`Failed to delete ${nodeType}`, 'error');
    }
  };

  // Enhanced function to filter and center category nodes using fitView
  const filterAndCenterCategory = (category) => {
    // Filter nodes by category
    let categoryNodes = [];
    switch(category) {
      case 'topics':
        categoryNodes = nodes.filter(node => node.type === 'topic');
        break;
      case 'literature':
        categoryNodes = nodes.filter(node => node.type === 'literature');
        break;
      case 'cases':
        categoryNodes = nodes.filter(node => node.type === 'case');
        break;
      case 'tasks':
        categoryNodes = nodes.filter(node => node.type === 'task');
        break;
    }

    // Set focused category state
    setFocusedCategory(category);

    // Only center view if not in editing mode and we have nodes to show
    if (!isEditing && categoryNodes.length > 0) {
      // Small delay to ensure any state updates are processed
      setTimeout(() => {
        fitView({ 
          nodes: categoryNodes.map(node => ({ id: node.id })),
          duration: 800,
          padding: 0.2,
          minZoom: 0.5,
          maxZoom: 1.5
        });
      }, 300);
    }

    // Add toast notification for user feedback
    addToast(`Showing ${categoryNodes.length} ${category}`, 'info', 2000);
  };

  const arrangeNodesInCategory = (category) => {
    // Get current viewport information
    const viewport = getViewport();
    const { x, y, zoom } = viewport;
    
    // Calculate visible area based on current zoom and pan
    const viewportWidth = window.innerWidth - 320; // Subtract sidebar width
    const viewportHeight = window.innerHeight;
    
    // Convert screen coordinates to flow coordinates
    const visibleWidth = viewportWidth / zoom;
    const visibleHeight = viewportHeight / zoom;
    const centerX = -x / zoom;
    const centerY = -y / zoom;
    
    // Calculate arrangement area within visible bounds
    const padding = 50 / zoom; // Scale padding with zoom
    const arrangeWidth = visibleWidth - (padding * 2);
    
    const categoryNodeSpacing = Math.min(280, arrangeWidth / Math.max(1, nodes.filter(n => {
      switch(category) {
        case 'topics': return n.type === 'topic';
        case 'literature': return n.type === 'literature';
        case 'cases': return n.type === 'case';
        case 'tasks': return n.type === 'task';
        default: return false;
      }
    }).length));
    
    const baseY = centerY; // Use center of current view
    
    let arrangedNodes = [...nodes];
    let categoryNodes = [];
    
    // Filter nodes by category
    switch(category) {
      case 'topics':
        categoryNodes = arrangedNodes.filter(node => node.type === 'topic');
        break;
      case 'literature':
        categoryNodes = arrangedNodes.filter(node => node.type === 'literature');
        break;
      case 'cases':
        categoryNodes = arrangedNodes.filter(node => node.type === 'case');
        break;
      case 'tasks':
        categoryNodes = arrangedNodes.filter(node => node.type === 'task');
        break;
    }

    // Arrange selected category nodes horizontally within current view
    categoryNodes.forEach((node, index) => {
      const nodeIndex = arrangedNodes.findIndex(n => n.id === node.id);
      if (nodeIndex !== -1) {
        const totalWidth = Math.max(0, (categoryNodes.length - 1) * categoryNodeSpacing);
        const startX = centerX - totalWidth / 2;
        
        arrangedNodes[nodeIndex] = {
          ...arrangedNodes[nodeIndex],
          position: {
            x: startX + (index * categoryNodeSpacing),
            y: baseY
          }
        };
      }
    });

    setNodes(arrangedNodes);
    setFocusedCategory(category);

    // Gently adjust view to ensure all nodes are visible
    if (categoryNodes.length > 0) {
      setTimeout(() => {
        const totalWidth = Math.max(0, (categoryNodes.length - 1) * categoryNodeSpacing);
        const bounds = {
          x: centerX - totalWidth / 2 - 100,
          y: baseY - 100,
          width: totalWidth + 200,
          height: 200
        };
        
        // Only adjust view if nodes would be outside current viewport
        const nodesFitInView = bounds.width <= visibleWidth && 
                              bounds.x >= centerX - visibleWidth/2 && 
                              bounds.x + bounds.width <= centerX + visibleWidth/2;
        
        if (!nodesFitInView) {
          fitView({ 
            padding: 0.1, 
            duration: 800,
            nodes: categoryNodes.map(node => ({ id: node.id }))
          });
        }
      }, 100);
    }
  };

  const resetToMindMapView = () => {
    // Restore original positions
    convertDataToReactFlow(mindMapData);
    setFocusedCategory(null);
    
    // Fit all nodes in view
    setTimeout(() => {
      fitView({ duration: 800, padding: 0.1 });
    }, 100);
  };

  // Memoized function to convert data to React Flow format
  const convertDataToReactFlow = (data, preserveCurrentPositions = false) => {
    const flowNodes = [];
    const flowEdges = [];

    // Create a map of current node positions if preserving
    const currentPositions = {};
    if (preserveCurrentPositions && nodes.length > 0) {
      nodes.forEach(node => {
        currentPositions[node.id] = node.position;
      });
    }

    // Helper function to determine if a node should be dimmed based on search
    const getNodeStyle = (nodeId) => {
      if (!searchQuery.trim()) {
        return {}; // No search active, normal style
      }
      
      const isMatch = filteredNodeIds.includes(nodeId);
      if (isMatch) {
        return {}; // Matching node, normal style
      } else {
        return { 
          opacity: 0.2, // Dim non-matching nodes
        };
      }
    };

    // Convert topics to nodes
    data.topics.forEach(topic => {
      const nodeId = `topic-${topic.id}`;
      const currentPosition = currentPositions[nodeId];
      
      flowNodes.push({
        id: nodeId,
        type: 'topic',
        position: currentPosition || topic.position || { x: 0, y: 0 },
        style: getNodeStyle(nodeId), // Apply search highlighting
        data: {
          label: topic.title,
          category: topic.category,
          color: topic.color,
          flashcard_count: topic.flashcard_count,
          completed_flashcards: topic.completed_flashcards,
          originalData: topic,
          onDelete: () => deleteNode(topic.id, 'topic'), // Always available, not just in edit mode
          onHandleClick: handleNodeHandleClick // Add handle click handler
        }
      });
    });

    // Convert literature to nodes
    data.literature && data.literature.forEach(lit => {
      const nodeId = `literature-${lit.id}`;
      const currentPosition = currentPositions[nodeId];
      
      flowNodes.push({
        id: nodeId,
        type: 'literature',
        position: currentPosition || lit.position || { x: 0, y: 0 },
        style: getNodeStyle(nodeId), // Apply search highlighting
        data: {
          label: lit.title,
          authors: lit.authors,
          year: lit.year,
          originalData: lit,
          onDelete: () => deleteNode(lit.id, 'literature'), // Always available, not just in edit mode
          onHandleClick: handleNodeHandleClick // Add handle click handler
        }
      });
    });

    // Convert cases to nodes  
    data.cases.forEach(caseItem => {
      const nodeId = `case-${caseItem.id}`;
      const currentPosition = currentPositions[nodeId];
      
      flowNodes.push({
        id: nodeId,
        type: 'case',
        position: currentPosition || caseItem.position || { x: 0, y: 0 },
        style: getNodeStyle(nodeId), // Apply search highlighting
        data: {
          label: caseItem.case_id,
          diagnosis: caseItem.primary_diagnosis,
          age: caseItem.age,
          originalData: caseItem,
          onDelete: () => deleteNode(caseItem.id, 'case'), // Always available, not just in edit mode
          onHandleClick: handleNodeHandleClick // Add handle click handler
        }
      });
    });

    // Convert tasks to nodes
    data.tasks.forEach(task => {
      const nodeId = `task-${task.id}`;
      const currentPosition = currentPositions[nodeId];
      
      flowNodes.push({
        id: nodeId,
        type: 'task',
        position: currentPosition || task.position || { x: 0, y: 0 },
        style: getNodeStyle(nodeId), // Apply search highlighting
        data: {
          label: task.title,
          priority: task.priority,
          status: task.status,
          due_date: task.due_date,
          originalData: task,
          onDelete: () => deleteNode(task.id, 'task'), // Always available, not just in edit mode
          onHandleClick: handleNodeHandleClick // Add handle click handler
        }
      });
    });

    // CRITICAL: Reconstruct edges from stored connections with complete properties
    console.log('Reconstructing edges from stored connections:', data.connections?.length || 0);
    if (data.connections && data.connections.length > 0) {
      data.connections.forEach(connection => {
        console.log('Reconstructing edge:', connection);
        
        // Handle migration: Convert old handle IDs to new simplified format
        const migrateHandleId = (handleId) => {
          if (!handleId) return null;
          
          // Convert old format (source-bottom, target-top) to new format (bottom, top)
          if (handleId.startsWith('source-') || handleId.startsWith('target-')) {
            return handleId.split('-')[1]; // Extract the position part
          }
          
          // Already in new format
          return handleId;
        };
        
        // Ensure all critical properties are preserved
        const reconstructedEdge = {
          id: connection.id,
          source: connection.source,
          target: connection.target,
          sourceHandle: migrateHandleId(connection.sourceHandle), // CRITICAL: Migrate and preserve source handle
          targetHandle: migrateHandleId(connection.targetHandle), // CRITICAL: Migrate and preserve target handle
          type: connection.type || 'smoothstep',
          style: connection.style || { stroke: '#2563eb', strokeWidth: 3 }, // Changed to blue and thicker for better visibility
          label: connection.label || '', // NEW: Preserve edge label
          labelStyle: { fill: '#374151', fontWeight: 500 }, // Add label styling
          labelBgStyle: { fill: '#f9fafb', stroke: '#d1d5db', strokeWidth: 1 }, // Add label background
          labelBgPadding: [8, 4], // Add padding around label
          labelShowBg: true, // Show background for label
          labelBgBorderRadius: 4, // Rounded corners for label background
          animated: false,
          selectable: true,
          focusable: true,
          deletable: true
        };
        
        flowEdges.push(reconstructedEdge);
        console.log('Edge reconstructed successfully:', reconstructedEdge);
      });
    }

    console.log(`convertDataToReactFlow completed: ${flowNodes.length} nodes, ${flowEdges.length} edges`);
    setNodes(flowNodes);
    setEdges(flowEdges);
  };

  const onConnect = useCallback((params) => {
    console.log('Creating new connection with full edge data:', params);
    
    // Create a complete edge object with all React Flow properties
    const newEdge = {
      id: `${params.source}-${params.target}`, // Ensure unique ID
      source: params.source,
      target: params.target,
      sourceHandle: params.sourceHandle, // CRITICAL: Preserve source handle
      targetHandle: params.targetHandle, // CRITICAL: Preserve target handle
      type: 'smoothstep',
      style: { stroke: '#2563eb', strokeWidth: 3 }, // Changed to blue and thicker for better visibility
      label: '', // NEW: Add label property for edge labeling
      labelStyle: { fill: '#374151', fontWeight: 500 }, // Add label styling
      labelBgStyle: { fill: '#f9fafb', stroke: '#d1d5db', strokeWidth: 1 }, // Add label background
      labelBgPadding: [8, 4], // Add padding around label
      labelShowBg: true, // Show background for label
      labelBgBorderRadius: 4, // Rounded corners for label background
      animated: false,
      selectable: true,
      focusable: true,
      deletable: true
    };
    
    console.log('Complete edge object created:', newEdge);
    
    // Add edge to React Flow state immediately
    setEdges((eds) => addEdge(newEdge, eds));
    
    // CRITICAL FIX: Store the complete edge object in mindMapData.connections
    setMindMapData(prevData => {
      const newData = { ...prevData };
      
      // Ensure connections array exists (for backward compatibility)
      if (!newData.connections) {
        newData.connections = [];
      }
      
      // Check if connection already exists (prevent duplicates)
      const connectionExists = newData.connections.some(conn => 
        conn.source === newEdge.source && 
        conn.target === newEdge.target &&
        conn.sourceHandle === newEdge.sourceHandle &&
        conn.targetHandle === newEdge.targetHandle
      );
      
      if (!connectionExists) {
        // Add the complete edge object to connections array
        newData.connections = [...newData.connections, newEdge];
        
        console.log('Edge added to mindMapData.connections:', newEdge);
        console.log('Total connections now:', newData.connections.length);
        
        // Trigger immediate save to localStorage (no debounce for connections)
        try {
          const storageData = {
            version: '1.1',
            timestamp: new Date().toISOString(),
            data: newData
          };
          localStorage.setItem('pgy3_mindmap_data', JSON.stringify(storageData));
          console.log('Connection data immediately saved to localStorage');
        } catch (error) {
          console.error('Error immediately saving connection:', error);
        }
        
        // Also trigger the debounced auto-save
        autoSaveMindMapData(newData);
        addToast('Connection created and saved', 'success', 2000);
      } else {
        console.log('Connection already exists, skipping duplicate');
      }
      
      return newData;
    });
  }, [setEdges, setMindMapData, autoSaveMindMapData, addToast]);

  const onNodeClick = (event, node) => {
    setSelectedNode(node);
    console.log('Node clicked:', node);
  };

  // PERFORMANCE FIX: Optimized data loading from local state instead of API calls
  const loadSubpageData = useCallback(async (nodeType, nodeId) => {
    try {
      console.log('Loading subpage data for:', nodeType, nodeId);
      
      // Get data from local mindMapData state instead of API call
      let nodeData = null;
      
      switch (nodeType) {
        case 'topic':
          nodeData = mindMapData.topics.find(topic => topic.id === nodeId);
          break;
        case 'case':
          nodeData = mindMapData.cases.find(caseItem => caseItem.id === nodeId);
          break;
        case 'task':
          nodeData = mindMapData.tasks.find(task => task.id === nodeId);
          break;
        case 'literature':
          nodeData = mindMapData.literature?.find(lit => lit.id === nodeId);
          break;
        default:
          throw new Error(`Unknown node type: ${nodeType}`);
      }
      
      if (!nodeData) {
        throw new Error(`${nodeType} with ID ${nodeId} not found in local data`);
      }
      
      console.log('Successfully loaded subpage data from local state:', nodeData);
      
      // Update state asynchronously to prevent blocking
      requestAnimationFrame(() => {
        setSubpageData(nodeData);
      });
      
    } catch (error) {
      console.error('Error loading subpage data:', error);
      
      // Show user-friendly error message
      addToast(`Failed to load ${nodeType} data`, 'error', 4000);
      
      // Set error state to show fallback UI
      requestAnimationFrame(() => {
        setSubpageData({ error: `Failed to load ${nodeType} data: ${error.message}` });
      });
    }
  }, [mindMapData, addToast]);

  // PERFORMANCE FIX: Optimized node double-click handler with debouncing
  const onNodeDoubleClick = useCallback((event, node) => {
    console.log('=== DEBUGGING SUBPAGE OPENING ===');
    console.log('Double-clicking node:', node);
    console.log('Node ID:', node.id);
    console.log('Current openSubpage state:', openSubpage);
    
    // Prevent multiple rapid clicks that could cause performance issues
    if (openSubpage) {
      console.log('Subpage already open, ignoring click');
      return;
    }
    
    // Extract the node type and full ID
    const nodeType = node.id.split('-')[0];
    const nodeId = node.id.substring(nodeType.length + 1);
    console.log('Extracted nodeType:', nodeType, 'nodeId:', nodeId);
    
    // Validate that we have the required data
    if (!nodeType || !nodeId) {
      console.error('Invalid node data:', { nodeType, nodeId });
      addToast('Invalid node data', 'error');
      return;
    }
    
    // PERFORMANCE FIX: Open subpage immediately for better UX, load data asynchronously
    console.log('Setting openSubpage state...');
    setOpenSubpage({ type: nodeType, id: nodeId });
    setSubpageData(null); // Clear previous data immediately
    
    // Load data asynchronously to prevent blocking
    console.log('Triggering async data load...');
    requestAnimationFrame(() => {
      loadSubpageData(nodeType, nodeId);
    });
  }, [openSubpage, addToast, loadSubpageData]);

  // PERFORMANCE FIX: Optimized close handler with immediate state cleanup
  const closeSubpage = useCallback(() => {
    // Immediate cleanup for responsive UX
    setOpenSubpage(null);
    setSubpageData(null);
  }, []);

  // Edge double-click handler for deletion (no conflict with right-click)
  const onEdgeDoubleClick = useCallback((event, edge) => {
    console.log('Edge double-clicked:', edge);
    
    // Close any open modal first
    setEditingEdge(null);
    
    console.log('Deleting edge:', edge);
    
    // Remove edge from React Flow state
    setEdges((edges) => edges.filter((e) => e.id !== edge.id));
    
    // CRITICAL FIX: Remove the connection from mindMapData.connections array
    setMindMapData(prevData => {
      const newData = { ...prevData };
      
      // Ensure connections array exists
      if (!newData.connections) {
        newData.connections = [];
      }
      
      // Remove the connection from the connections array
      const initialLength = newData.connections.length;
      newData.connections = newData.connections.filter(conn => 
        conn.id !== edge.id
      );
      
      if (newData.connections.length !== initialLength) {
        console.log('Successfully removed connection from mindMapData.connections');
        autoSaveMindMapData(newData);
        addToast('Connection deleted and saved', 'success', 2000);
      } else {
        console.log('Connection not found in mindMapData.connections, but removed from visual state');
        addToast('Connection deleted', 'success', 2000);
      }
      
      return newData;
    });
  }, [setEdges, setMindMapData, autoSaveMindMapData, addToast]);

  // Edge right-click handler for opening label editing modal (no conflict with double-click delete)
  const onEdgeContextMenu = useCallback((event, edge) => {
    event.preventDefault(); // Prevent browser context menu
    console.log('Edge right-clicked:', edge);
    setEditingEdge(edge);
  }, []);

  // Function to save edge label with improved state synchronization
  const saveEdgeLabel = useCallback((edgeId, newLabel) => {
    console.log('Saving edge label:', edgeId, newLabel);
    
    // Update mindMapData first, then React Flow edges in sequence
    setMindMapData(prevData => {
      const newData = { ...prevData };
      
      // Ensure connections array exists
      if (!newData.connections) {
        newData.connections = [];
      }
      
      // Find and update the connection
      newData.connections = newData.connections.map(conn => 
        conn.id === edgeId ? { ...conn, label: newLabel } : conn
      );
      
      console.log('Updated connection label in mindMapData');
      
      // Update React Flow edges immediately after mindMapData update
      requestAnimationFrame(() => {
        setEdges(prev => prev.map(edge => 
          edge.id === edgeId ? { ...edge, label: newLabel } : edge
        ));
        console.log('Updated edge label in React Flow state');
      });
      
      // Trigger auto-save
      autoSaveMindMapData(newData);
      addToast('Connection label updated', 'success', 2000);
      
      return newData;
    });
  }, [setMindMapData, setEdges, autoSaveMindMapData, addToast]);

  // Programmatic connection handler
  const handleNodeHandleClick = useCallback((nodeId, handleId) => {
    console.log('Handle clicked:', nodeId, handleId);
    
    if (!startHandle) {
      // Start a new connection
      setStartHandle({ nodeId, handleId });
      console.log('Connection started from:', nodeId, handleId);
      addToast('Connection started - click another handle to complete', 'info', 2000);
    } else {
      // Complete the connection
      const targetHandle = { nodeId, handleId };
      
      // Prevent self-connections
      if (startHandle.nodeId === targetHandle.nodeId) {
        console.log('Cannot connect node to itself');
        addToast('Cannot connect a node to itself', 'error', 2000);
        setStartHandle(null);
        return;
      }
      
      // Create new edge object
      const newEdge = {
        id: `edge-${Date.now()}`, // Unique ID
        source: startHandle.nodeId,
        target: targetHandle.nodeId,
        sourceHandle: startHandle.handleId,
        targetHandle: targetHandle.handleId,
        type: 'smoothstep',
        style: { stroke: '#2563eb', strokeWidth: 3 }, // Changed to blue and thicker for better visibility
        label: '',
        labelStyle: { fill: '#374151', fontWeight: 500 },
        labelBgStyle: { fill: '#f9fafb', stroke: '#d1d5db', strokeWidth: 1 },
        labelBgPadding: [8, 4],
        labelShowBg: true,
        labelBgBorderRadius: 4,
        animated: false,
        selectable: true,
        focusable: true,
        deletable: true
      };
      
      console.log('Creating connection:', newEdge);
      
      // Add edge to React Flow
      addEdges([newEdge]);
      
      // Update mindMapData and trigger auto-save
      setMindMapData(prevData => {
        const newData = { ...prevData };
        
        // Ensure connections array exists
        if (!newData.connections) {
          newData.connections = [];
        }
        
        // Add the new connection
        newData.connections = [...newData.connections, newEdge];
        
        // Trigger auto-save
        autoSaveMindMapData(newData);
        addToast('Connection created and saved', 'success', 2000);
        
        return newData;
      });
      
      // Reset connection state
      setStartHandle(null);
    }
  }, [startHandle, addEdges, setMindMapData, autoSaveMindMapData, addToast]);

  // Dagre layout configuration
  const getLayoutedElements = (nodes, edges, direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    
    const isHorizontal = direction === 'LR';
    
    // Configure layout with better spacing for mind map
    dagreGraph.setGraph({ 
      rankdir: direction, 
      nodesep: 80,      // Horizontal spacing between nodes
      ranksep: 120,     // Vertical spacing between ranks
      edgesep: 20,      // Spacing between edges
      marginx: 50,      // Margin around the graph
      marginy: 50
    });

    // Define node dimensions based on type
    const getNodeDimensions = (node) => {
      switch (node.type) {
        case 'topic':
          return { width: 240, height: 120 };
        case 'literature':
          return { width: 220, height: 110 };
        case 'case':
          return { width: 220, height: 110 };
        case 'task':
          return { width: 200, height: 100 };
        default:
          return { width: 220, height: 100 };
      }
    };

    // Add nodes to dagre graph
    nodes.forEach((node) => {
      const dimensions = getNodeDimensions(node);
      dagreGraph.setNode(node.id, dimensions);
    });

    // Add edges to dagre graph
    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    // Apply layout
    dagre.layout(dagreGraph);

    // Update node positions
    const layoutedNodes = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      const dimensions = getNodeDimensions(node);
      
      return {
        ...node,
        targetPosition: isHorizontal ? 'left' : 'top',
        sourcePosition: isHorizontal ? 'right' : 'bottom',
        position: {
          x: nodeWithPosition.x - dimensions.width / 2,
          y: nodeWithPosition.y - dimensions.height / 2,
        },
      };
    });

    return { nodes: layoutedNodes, edges };
  };

  const applyLayout = () => {
    // Edge case: No nodes to layout
    if (!nodes || nodes.length === 0) {
      console.log('No nodes to realign');
      return;
    }

    try {
      console.log(`Applying category-based column layout to ${nodes.length} nodes`);
      
      // Get current viewport information
      const viewport = getViewport();
      const { x, y, zoom } = viewport;
      
      // Calculate visible area center
      const viewportWidth = window.innerWidth - 320; // Subtract sidebar width
      const viewportHeight = window.innerHeight;
      
      // Convert screen coordinates to flow coordinates
      const centerX = -x / zoom + (viewportWidth / 2) / zoom;
      const centerY = -y / zoom + (viewportHeight / 2) / zoom;
      
      // Group nodes by category
      const nodesByCategory = {
        topics: nodes.filter(n => n.type === 'topic'),
        literature: nodes.filter(n => n.type === 'literature'),
        cases: nodes.filter(n => n.type === 'case'),
        tasks: nodes.filter(n => n.type === 'task')
      };
      
      // Calculate column layout
      const categories = Object.keys(nodesByCategory).filter(cat => nodesByCategory[cat].length > 0);
      const columnWidth = 300;
      const totalWidth = categories.length * columnWidth;
      const startX = centerX - totalWidth / 2;
      
      let layoutedNodes = [...nodes];
      
      categories.forEach((category, columnIndex) => {
        const categoryNodes = nodesByCategory[category];
        const columnX = startX + (columnIndex * columnWidth);
        
        // Arrange nodes vertically in the column
        const nodeSpacing = 150;
        const columnHeight = Math.max(0, (categoryNodes.length - 1) * nodeSpacing);
        const startY = centerY - columnHeight / 2;
        
        categoryNodes.forEach((node, nodeIndex) => {
          const layoutedNodeIndex = layoutedNodes.findIndex(n => n.id === node.id);
          if (layoutedNodeIndex !== -1) {
            layoutedNodes[layoutedNodeIndex] = {
              ...layoutedNodes[layoutedNodeIndex],
              position: {
                x: columnX,
                y: startY + (nodeIndex * nodeSpacing)
              }
            };
          }
        });
      });

      // Update node positions with smooth transition
      setNodes(layoutedNodes);

      // Auto-save positions
      setTimeout(() => {
        console.log('Auto-saving realigned positions...');
        // Update mindMapData with new positions
        setMindMapData(prevData => {
          const newData = { ...prevData };
          layoutedNodes.forEach(node => {
            const [nodeType, nodeId] = node.id.split('-');
            const collection = nodeType === 'literature' ? 'literature' : nodeType + 's';
            if (newData[collection]) {
              const item = newData[collection].find(item => item.id === nodeId);
              if (item) {
                item.position = node.position;
              }
            }
          });
          autoSaveMindMapData(newData);
          return newData;
        });
      }, 200);

      // Adjust viewport to show all realigned nodes
      setTimeout(() => {
        try {
          fitView({ 
            duration: 1000, 
            padding: 0.25,
            includeHiddenNodes: false,
            minZoom: 0.5,
            maxZoom: 1.5
          });
          console.log('Viewport adjusted to center realigned nodes');
        } catch (error) {
          console.error('Error adjusting viewport:', error);
        }
      }, 500);

      console.log('Category-based column layout applied successfully');
      addToast('Nodes arranged by category', 'success', 2000);
      
    } catch (error) {
      console.error('Error applying layout:', error);
      addToast('Layout failed', 'error', 3000);
    }
  };

  const initSampleData = async () => {
    try {
      await axios.post(`${API}/init-sample-data`);
      loadMindMapData();
    } catch (error) {
      console.error('Error initializing sample data:', error);
    }
  };

  const saveLayout = async () => {
    try {
      // Update positions in backend
      const updates = nodes.map(node => {
        const [nodeType, nodeId] = node.id.split('-');
        return {
          type: nodeType,
          id: nodeId,
          position: node.position
        };
      });

      console.log('Saving layout:', updates);
      setIsEditing(false);
      
      // Refresh data after a small delay to ensure state is updated
      setTimeout(() => {
        convertDataToReactFlow(mindMapData);
      }, 100);
    } catch (error) {
      console.error('Error saving layout:', error);
    }
  };

  const addNewNode = async (nodeType) => {
    try {
      // Find a free position in the center of the current view
      const findFreePosition = () => {
        const existingPositions = nodes.map(node => node.position);
        
        // Get current viewport information
        const viewport = getViewport();
        const { x, y, zoom } = viewport;
        
        // Calculate visible area center
        const viewportWidth = window.innerWidth - 320; // Subtract sidebar width
        const viewportHeight = window.innerHeight;
        
        // Convert screen coordinates to flow coordinates
        const centerX = -x / zoom + (viewportWidth / 2) / zoom;
        const centerY = -y / zoom + (viewportHeight / 2) / zoom;
        
        // Try positions in a spiral pattern around the center
        const spiralRadius = 150;
        const maxAttempts = 20;
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          const angle = (attempt * 2 * Math.PI) / 8; // 8 positions per ring
          const radius = spiralRadius * (1 + Math.floor(attempt / 8));
          
          const testPosition = {
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius
          };
          
          const tooClose = existingPositions.some(pos => 
            Math.abs(pos.x - testPosition.x) < 250 && 
            Math.abs(pos.y - testPosition.y) < 150
          );
          
          if (!tooClose) {
            return testPosition;
          }
        }
        
        // Fallback to center position with random offset
        return { 
          x: centerX + (Math.random() - 0.5) * 200, 
          y: centerY + (Math.random() - 0.5) * 200 
        };
      };

      const newPosition = findFreePosition();
      
      // Generate unique ID using uuid-like approach
      const generateId = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };
      
      const newId = generateId();
      const now = new Date();
      
      // Create new node data based on type
      let newNodeData = {
        id: newId,
        position: newPosition,
        created_at: now,
        updated_at: now
      };
      
      switch(nodeType) {
        case 'topic':
          newNodeData = {
            ...newNodeData,
            title: 'New Topic',
            description: 'New topic description',
            category: 'New Category',
            color: '#3B82F6',
            flashcard_count: 0,
            completed_flashcards: 0,
            resources: []
          };
          break;
        case 'case':
          newNodeData = {
            ...newNodeData,
            case_id: `CASE-${Date.now()}`,
            encounter_date: now,
            primary_diagnosis: 'New Diagnosis',
            secondary_diagnoses: [],
            age: null,
            gender: null,
            chief_complaint: 'New complaint',
            history_present_illness: null,
            medical_history: null,
            medications: [],
            mental_status_exam: null,
            assessment_plan: null,
            notes: null,
            status: 'active',
            linked_topics: []
          };
          break;
        case 'task':
          newNodeData = {
            ...newNodeData,
            title: 'New Task',
            description: 'New task description',
            status: 'pending',
            priority: 'medium',
            due_date: null,
            linked_case_id: null,
            linked_topic_id: null
          };
          break;
        case 'literature':
          newNodeData = {
            ...newNodeData,
            title: 'New Literature',
            authors: 'New Author',
            publication: 'New Publication',
            year: new Date().getFullYear(),
            doi: null,
            abstract: null,
            notes: null,
            linked_topics: []
          };
          break;
        default:
          throw new Error(`Unknown node type: ${nodeType}`);
      }

      console.log('Creating new node:', nodeType, newNodeData);
      
      // Create React Flow node
      const newNode = {
        id: `${nodeType}-${newNodeData.id}`,
        type: nodeType,
        position: newPosition,
        data: {
          label: nodeType === 'case' ? newNodeData.case_id : newNodeData.title,
          ...(nodeType === 'topic' && { 
            category: newNodeData.category, 
            color: newNodeData.color,
            flashcard_count: newNodeData.flashcard_count || 0,
            completed_flashcards: newNodeData.completed_flashcards || 0
          }),
          ...(nodeType === 'case' && { 
            diagnosis: newNodeData.primary_diagnosis,
            age: newNodeData.age
          }),
          ...(nodeType === 'task' && { 
            priority: newNodeData.priority,
            status: newNodeData.status,
            due_date: newNodeData.due_date
          }),
          ...(nodeType === 'literature' && { 
            authors: newNodeData.authors,
            year: newNodeData.year
          }),
          originalData: newNodeData,
          onDelete: () => deleteNode(newNodeData.id, nodeType) // Always available, not just in edit mode
        }
      };

      // Add to existing nodes array
      setNodes((nds) => [...nds, newNode]);
      
      // Update mindMapData state to include the new node
      setMindMapData(prevData => {
        const collectionName = nodeType === 'literature' ? 'literature' : nodeType + 's';
        const updatedData = {
          ...prevData,
          [collectionName]: [
            ...prevData[collectionName],
            newNodeData
          ]
        };
        
        console.log('Updated mindMapData with new node:', updatedData);
        
        // Trigger auto-save to both localStorage and backend
        autoSaveMindMapData(updatedData);
        
        return updatedData;
      });
      
      addToast(`New ${nodeType} created successfully`, 'success', 2000);
      
    } catch (error) {
      console.error('Error adding new node:', error);
      addToast(`Failed to create new ${nodeType}`, 'error', 3000);
    }
  };

  // Enhanced CSV Export functionality with progress tracking
  const handleExportPatientCases = async () => {
    try {
      setIsExportingCSV(true);
      setExportProgress({ show: true, progress: 0, message: 'Initializing export...' });
      
      if (!mindMapData.cases || mindMapData.cases.length === 0) {
        addToast('No patient cases found to export.', 'error');
        return;
      }
      
      console.log('Exporting', mindMapData.cases.length, 'patient cases...');
      addToast('Starting export...', 'info', 2000);
      
      // Generate CSV content with progress tracking
      const csvContent = csvUtils.generatePatientCasesCSV(mindMapData.cases, (progress, message) => {
        setExportProgress({ show: true, progress, message });
      });
      
      if (!csvContent) {
        addToast('Error generating CSV content.', 'error');
        return;
      }
      
      // Generate filename with current date and time
      const currentDate = new Date().toISOString().split('T')[0];
      const currentTime = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
      const filename = `patient_cases_${currentDate}_${currentTime}.csv`;
      
      setExportProgress({ show: true, progress: 95, message: 'Downloading file...' });
      
      // Download the CSV file
      csvUtils.downloadCSV(csvContent, filename);
      
      console.log(`Successfully exported ${mindMapData.cases.length} patient cases to ${filename}`);
      
      // Show enhanced success feedback with statistics
      const summary = csvUtils.generateCasesSummary(mindMapData.cases);
      const successMessage = `Successfully exported ${mindMapData.cases.length} patient cases! 
        Primary diagnoses: ${Object.keys(summary.diagnoses).length}`;
      
      setTimeout(() => {
        addToast(successMessage, 'success', 5000);
        setExportProgress({ show: true, progress: 100, message: 'Export complete!' });
        
        // Hide progress after delay
        setTimeout(() => {
          setExportProgress({ show: false, progress: 0, message: '' });
        }, 2000);
      }, 500);
      
    } catch (error) {
      console.error('Error exporting patient cases:', error);
      addToast('Error exporting patient cases. Please try again.', 'error');
      setExportProgress({ show: false, progress: 0, message: '' });
    } finally {
      setTimeout(() => {
        setIsExportingCSV(false);
      }, 2000);
    }
  };

  // PERFORMANCE FIX: Memoize ReactFlow event handlers to prevent re-renders
  const reactFlowEventHandlers = useMemo(() => ({
    onNodesChange: handleNodesChange,
    onEdgesChange: onEdgesChange,
    onConnect: onConnect,
    onNodeClick: onNodeClick,
    onNodeDoubleClick: onNodeDoubleClick,
    onInit: onReactFlowInit
  }), [handleNodesChange, onEdgesChange, onConnect, onNodeClick, onNodeDoubleClick, onReactFlowInit]);

  // PERFORMANCE FIX: Memoize ReactFlow props to prevent unnecessary re-renders
  const reactFlowProps = useMemo(() => ({
    nodes,
    edges,
    nodeTypes,
    fitView: true,
    nodesDraggable: true,
    nodesConnectable: isEditing,
    edgesReconnectable: isEditing,
    edgesFocusable: isEditing,
    elementsSelectable: true,
    className: "bg-gradient-to-br from-slate-50 to-slate-100",
    defaultEdgeOptions: {
      type: 'smoothstep',
      style: { strokeWidth: 2, stroke: '#6B7280' },
      markerEnd: {
        type: 'arrowclosed',
        width: 15,
        height: 15,
        color: '#6B7280',
      }
    }
  }), [nodes, edges, nodeTypes, isEditing]);





  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar */}
      <div className="w-80 bg-gradient-to-b from-slate-800 to-slate-900 text-white p-6 shadow-2xl">
        <div className="mb-8">
          <div className="text-3xl font-thin tracking-wide text-white mb-1">PGY-3</div>
          <div className="text-3xl font-bold tracking-wide text-white">HQ</div>
          <div className="text-sm text-slate-300 mt-2">Psychiatry Resident Dashboard</div>
        </div>

        {/* Global Search */}
        <div className="mb-6">
          <div className="relative">
            <Search 
              size={18} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" 
            />
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-700 bg-opacity-50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
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
            <div className="mt-2 text-xs text-slate-400">
              Search active - non-matching nodes are dimmed
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div 
            onClick={() => openSubpage ? closeSubpage() : filterAndCenterCategory('topics')}
            className={`bg-slate-700 bg-opacity-50 rounded-full px-4 py-2 text-sm hover:bg-slate-600 transition-colors cursor-pointer flex items-center gap-2 ${
              focusedCategory === 'topics' ? 'ring-2 ring-teal-400 bg-slate-600' : ''
            }`}
          >
            <Brain size={16} />
            Topics ({mindMapData.topics.length})
          </div>
          <div 
            onClick={() => openSubpage ? closeSubpage() : filterAndCenterCategory('literature')}
            className={`bg-slate-700 bg-opacity-50 rounded-full px-4 py-2 text-sm hover:bg-slate-600 transition-colors cursor-pointer flex items-center gap-2 ${
              focusedCategory === 'literature' ? 'ring-2 ring-teal-400 bg-slate-600' : ''
            }`}
          >
            <BookOpen size={16} />
            Literature ({mindMapData.literature?.length || 0})
          </div>
          <div 
            onClick={() => openSubpage ? closeSubpage() : filterAndCenterCategory('cases')}
            className={`bg-slate-700 bg-opacity-50 rounded-full px-4 py-2 text-sm hover:bg-slate-600 transition-colors cursor-pointer flex items-center gap-2 ${
              focusedCategory === 'cases' ? 'ring-2 ring-teal-400 bg-slate-600' : ''
            }`}
          >
            <Users size={16} />
            Cases ({mindMapData.cases.length})
          </div>
          <div 
            onClick={() => openSubpage ? closeSubpage() : filterAndCenterCategory('tasks')}
            className={`bg-slate-700 bg-opacity-50 rounded-full px-4 py-2 text-sm hover:bg-slate-600 transition-colors cursor-pointer flex items-center gap-2 ${
              focusedCategory === 'tasks' ? 'ring-2 ring-teal-400 bg-slate-600' : ''
            }`}
          >
            <CheckSquare size={16} />
            Tasks ({mindMapData.tasks.length})
          </div>
          
          {focusedCategory && !openSubpage && (
            <button
              onClick={resetToMindMapView}
              className="w-full bg-teal-600 bg-opacity-50 rounded-full px-4 py-2 text-sm hover:bg-teal-700 transition-colors cursor-pointer flex items-center gap-2 justify-center"
            >
              <Target size={16} />
              Reset View
            </button>
          )}
        </div>

        {/* Mind Map Controls */}
        <div className="mt-8 space-y-3">
          <div className="text-sm font-semibold text-slate-300 mb-3">Mind Map Controls</div>
          
          <LoadingButton
            onClick={applyLayout}
            icon={Shuffle}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm"
          >
            Realign Nodes
          </LoadingButton>

          <LoadingButton
            onClick={handleExportPatientCases}
            loading={isExportingCSV}
            disabled={mindMapData.cases.length === 0}
            icon={isExportingCSV ? Loader2 : Download}
            className={`w-full text-white px-4 py-2 rounded-md text-sm ${
              mindMapData.cases.length === 0
                ? 'bg-gray-500 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isExportingCSV ? 'Exporting...' : `Export Patient Cases (${mindMapData.cases.length})`}
          </LoadingButton>
          
          <LoadingButton
            onClick={() => {
              const newEditMode = !isEditing;
              setIsEditing(newEditMode);
              convertDataToReactFlow(mindMapData, true);
              addToast(newEditMode ? 'Edit mode enabled' : 'Edit mode disabled', 'info', 2000);
            }}
            icon={isEditing ? Save : Edit3}
            className={`w-full px-4 py-2 rounded-md text-sm ${
              isEditing 
                ? 'bg-teal-600 hover:bg-teal-700 text-white' 
                : 'bg-slate-600 hover:bg-slate-500 text-white'
            }`}
          >
            {isEditing ? 'Exit Edit Mode' : 'Edit Mind Map'}
          </LoadingButton>

          {/* Add New Node button - always available */}
          <button
            onClick={() => setShowNodeSelector(true)}
            className="w-full flex items-center gap-2 px-4 py-2 rounded-md text-sm bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            Add New Node
          </button>

          {isEditing && (
            <>
              <LoadingButton
                onClick={handleClearMap}
                icon={Trash2}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm"
              >
                Clear Entire Map
              </LoadingButton>

              <div className="text-xs text-slate-400 mt-4">
                <div className="mb-2">Hierarchy:</div>
                <div className="space-y-1">
                  <div>• Topics → Literature</div>
                  <div>• Topics → Cases</div>
                  <div>• Cases → Tasks</div>
                </div>
                <div className="mt-3 text-xs text-slate-300">
                  💡 Node positions auto-save when moved
                </div>
              </div>
            </>
          )}

          {/* Enhanced Auto-save status indicator */}
          <div className="mt-4 p-3 bg-slate-700 bg-opacity-30 rounded-lg border border-slate-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                {isSaving ? (
                  <>
                    <Loader2 size={12} className="animate-spin text-purple-400" />
                    <span className="text-purple-400">Saving...</span>
                  </>
                ) : lastSaved ? (
                  <>
                    <CheckCircle2 size={12} className="text-green-400" />
                    <span className="text-green-400">Auto-saved</span>
                  </>
                ) : (
                  <>
                    <Cloud size={12} className="text-slate-400" />
                    <span>Ready</span>
                  </>
                )}
              </div>
              {lastSaved && (
                <div className="text-xs text-slate-400">
                  {lastSaved.toLocaleTimeString()}
                </div>
              )}
            </div>
            
            {/* Storage info */}
            <div className="mt-2 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <Eye size={10} />
                <span>Local storage active</span>
              </div>
            </div>
          </div>
        </div>

        {mindMapData.topics.length === 0 && (
          <div className="mt-8 p-4 bg-slate-700 bg-opacity-50 rounded-lg">
            <p className="text-sm text-slate-300 mb-3">
              No data found. Initialize with sample data to get started.
            </p>
            <button
              onClick={initSampleData}
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md text-sm transition-colors"
            >
              Initialize Sample Data
            </button>
          </div>
        )}

        {selectedNode && !openSubpage && (
          <div className="mt-8 p-4 bg-slate-700 bg-opacity-50 rounded-lg border border-teal-500">
            <h3 className="font-semibold mb-2 text-teal-300">Selected Node</h3>
            <p className="text-sm text-slate-300 capitalize">
              <span className="font-medium">{selectedNode.type}</span>: {selectedNode.data.label}
            </p>
            <button
              onClick={() => {
                const nodeType = selectedNode.id.split('-')[0];
                const nodeId = selectedNode.id.substring(nodeType.length + 1); // Get everything after the first hyphen
                console.log('Opening subpage from sidebar for:', nodeType, nodeId);
                setOpenSubpage({ type: nodeType, id: nodeId });
                loadSubpageData(nodeType, nodeId);
              }}
              className="mt-3 text-xs text-teal-400 hover:text-teal-300 underline"
            >
              View Details →
            </button>
          </div>
        )}
      </div>

      {/* Main Mind Map Workspace */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          onEdgeContextMenu={onEdgeContextMenu} // NEW: Add edge right-click handler
          onEdgeDoubleClick={onEdgeDoubleClick}
          onInit={onReactFlowInit}
          nodeTypes={nodeTypes}
          onPaneClick={() => setStartHandle(null)} // Reset connection start on pane click
          fitView
          nodesDraggable={true}
          nodesConnectable={false} // Disable default drag connections
          edgesReconnectable={false} // Disable edge reconnection to avoid conflicts
          edgesFocusable={true} // Always allow edge interaction for labeling
          elementsSelectable={true}
          selectNodesOnDrag={false} // Improve connection creation experience
          deleteKeyCode={['Delete', 'Backspace']} // Allow deletion with keyboard
          multiSelectionKeyCode={['Control', 'Meta']} // Allow multi-selection
          className="bg-gradient-to-br from-slate-50 to-slate-100"
          defaultEdgeOptions={{
            type: 'smoothstep',
            style: { strokeWidth: 3, stroke: '#2563eb' }, // Changed to blue and thicker for better visibility
            markerEnd: {
              type: 'arrowclosed',
              width: 15,
              height: 15,
              color: '#2563eb', // Changed to blue for consistency
            },
            focusable: true,
            selectable: true,
            deletable: true
          }}
        >
          <Background color="#aaa" gap={16} />
          <Controls />
          <MiniMap 
            nodeColor={(node) => {
              switch (node.type) {
                case 'topic': return node.data.color || '#3B82F6';
                case 'case': return '#6B7280';
                case 'task': return '#F59E0B';
                case 'literature': return '#8B5CF6';
                default: return '#9CA3AF';
              }
            }}
            maskColor="rgba(0, 0, 0, 0.2)"
            className="bg-white rounded-lg shadow-lg border"
          />
          
          <Panel position="top-right" className="bg-white rounded-lg shadow-lg p-4 m-4">
            <div className="text-sm font-semibold text-gray-700 mb-2">Instructions</div>
            <div className="text-xs text-gray-500 space-y-1">
              <div>• Click to select nodes</div>
              <div>• Double-click nodes to view details</div>
              <div>• Hover and drag to reposition</div>
              <div>• Click connection handles to create connections</div>
              <div>• Right-click connections to edit labels</div>
              <div>• Double-click connections to delete</div>
              <div>• Click empty space to cancel connection</div>
              <div>• Use "Realign Nodes" for auto layout</div>
              <div>• Zoom with mouse wheel</div>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Subpage Window */}
      {openSubpage && (
        <SubpageWindow 
          type={openSubpage.type}
          data={subpageData}
          onClose={closeSubpage}
          setMindMapData={setMindMapData}
          loadMindMapData={loadMindMapData}
          onAutoSave={autoSaveMindMapData}
          addToast={addToast}
        />
      )}

      {/* Node Selector Modal */}
      <NodeSelector
        isOpen={showNodeSelector}
        onClose={() => setShowNodeSelector(false)}
        onSelect={addNewNode}
      />

      {/* Toast Notifications */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
          duration={toast.duration}
        />
      ))}

      {/* Export Progress Modal */}
      {exportProgress.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mb-4">
                <Loader2 size={40} className="mx-auto text-blue-600 animate-spin" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Exporting Patient Cases</h3>
              <p className="text-sm text-gray-600 mb-4">{exportProgress.message}</p>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${exportProgress.progress}%` }}
                />
              </div>
              
              <div className="text-sm font-medium text-blue-600">
                {Math.round(exportProgress.progress)}% Complete
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edge Label Modal - Only render when needed for performance */}
      {editingEdge && (
        <EdgeLabelModal 
          edge={editingEdge}
          isOpen={true}
          onClose={() => setEditingEdge(null)}
          onSave={saveEdgeLabel}
        />
      )}

      {/* Enhanced Auto-save Indicator */}
      {isSaving && (
        <div className="fixed bottom-4 left-4 z-40">
          <div className="bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm font-medium">Saving...</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Main App Component
function App() {
  return (
    <ReactFlowProvider>
      <Dashboard />
    </ReactFlowProvider>
  );
}

export default App;