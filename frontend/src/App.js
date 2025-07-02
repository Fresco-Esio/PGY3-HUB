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
  Heart,
  Bookmark
} from 'lucide-react';

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
      {/* Enhanced Connection Handles - Multiple handles for flexible connections */}
      {/* Top handles */}
      <Handle 
        id="target-top"
        type="target" 
        position={Position.Top} 
        className="w-3 h-3 !bg-white border-2 border-current transition-all duration-300 hover:scale-150 opacity-60 hover:opacity-100" 
        style={{ left: '50%', transform: 'translateX(-50%)' }}
      />
      
      {/* Bottom handles */}
      <Handle 
        id="source-bottom"
        type="source" 
        position={Position.Bottom} 
        className="w-3 h-3 !bg-white border-2 border-current transition-all duration-300 hover:scale-150 opacity-60 hover:opacity-100" 
        style={{ left: '50%', transform: 'translateX(-50%)' }}
      />
      
      {/* Left handles */}
      <Handle 
        id="target-left"
        type="target" 
        position={Position.Left} 
        className="w-3 h-3 !bg-white border-2 border-current transition-all duration-300 hover:scale-150 opacity-60 hover:opacity-100" 
        style={{ top: '30%', transform: 'translateY(-50%)' }}
      />
      <Handle 
        id="source-left"
        type="source" 
        position={Position.Left} 
        className="w-3 h-3 !bg-white border-2 border-current transition-all duration-300 hover:scale-150 opacity-60 hover:opacity-100" 
        style={{ top: '70%', transform: 'translateY(-50%)' }}
      />
      
      {/* Right handles */}
      <Handle 
        id="target-right"
        type="target" 
        position={Position.Right} 
        className="w-3 h-3 !bg-white border-2 border-current transition-all duration-300 hover:scale-150 opacity-60 hover:opacity-100" 
        style={{ top: '30%', transform: 'translateY(-50%)' }}
      />
      <Handle 
        id="source-right"
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 !bg-white border-2 border-current transition-all duration-300 hover:scale-150 opacity-60 hover:opacity-100" 
        style={{ top: '70%', transform: 'translateY(-50%)' }}
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
            className="ml-auto p-1 hover:bg-white hover:bg-opacity-20 rounded transition-all duration-200 hover:scale-110 opacity-0 group-hover:opacity-100"
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
      {/* Enhanced Connection Handles - Multiple handles for flexible connections */}
      {/* Top handles */}
      <Handle 
        id="target-top"
        type="target" 
        position={Position.Top} 
        className="w-3 h-3 !bg-blue-500 transition-all duration-300 hover:scale-150 opacity-60 hover:opacity-100" 
        style={{ left: '50%', transform: 'translateX(-50%)' }}
      />
      
      {/* Bottom handles */}
      <Handle 
        id="source-bottom"
        type="source" 
        position={Position.Bottom} 
        className="w-3 h-3 !bg-blue-500 transition-all duration-300 hover:scale-150 opacity-60 hover:opacity-100" 
        style={{ left: '50%', transform: 'translateX(-50%)' }}
      />
      
      {/* Left handles */}
      <Handle 
        id="target-left"
        type="target" 
        position={Position.Left} 
        className="w-3 h-3 !bg-blue-500 transition-all duration-300 hover:scale-150 opacity-60 hover:opacity-100" 
        style={{ top: '30%', transform: 'translateY(-50%)' }}
      />
      <Handle 
        id="source-left"
        type="source" 
        position={Position.Left} 
        className="w-3 h-3 !bg-blue-500 transition-all duration-300 hover:scale-150 opacity-60 hover:opacity-100" 
        style={{ top: '70%', transform: 'translateY(-50%)' }}
      />
      
      {/* Right handles */}
      <Handle 
        id="target-right"
        type="target" 
        position={Position.Right} 
        className="w-3 h-3 !bg-blue-500 transition-all duration-300 hover:scale-150 opacity-60 hover:opacity-100" 
        style={{ top: '30%', transform: 'translateY(-50%)' }}
      />
      <Handle 
        id="source-right"
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 !bg-blue-500 transition-all duration-300 hover:scale-150 opacity-60 hover:opacity-100" 
        style={{ top: '70%', transform: 'translateY(-50%)' }}
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
            className="ml-auto p-1 hover:bg-gray-200 rounded transition-all duration-200 hover:scale-110 opacity-0 group-hover:opacity-100"
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
      {/* Enhanced Connection Handles - Multiple handles for flexible connections */}
      {/* Top handles */}
      <Handle 
        id="target-top"
        type="target" 
        position={Position.Top} 
        className="w-3 h-3 !bg-white transition-all duration-300 hover:scale-150 opacity-60 hover:opacity-100" 
        style={{ left: '50%', transform: 'translateX(-50%)' }}
      />
      
      {/* Bottom handles */}
      <Handle 
        id="source-bottom"
        type="source" 
        position={Position.Bottom} 
        className="w-3 h-3 !bg-white transition-all duration-300 hover:scale-150 opacity-60 hover:opacity-100" 
        style={{ left: '50%', transform: 'translateX(-50%)' }}
      />
      
      {/* Left handles */}
      <Handle 
        id="target-left"
        type="target" 
        position={Position.Left} 
        className="w-3 h-3 !bg-white transition-all duration-300 hover:scale-150 opacity-60 hover:opacity-100" 
        style={{ top: '30%', transform: 'translateY(-50%)' }}
      />
      <Handle 
        id="source-left"
        type="source" 
        position={Position.Left} 
        className="w-3 h-3 !bg-white transition-all duration-300 hover:scale-150 opacity-60 hover:opacity-100" 
        style={{ top: '70%', transform: 'translateY(-50%)' }}
      />
      
      {/* Right handles */}
      <Handle 
        id="target-right"
        type="target" 
        position={Position.Right} 
        className="w-3 h-3 !bg-white transition-all duration-300 hover:scale-150 opacity-60 hover:opacity-100" 
        style={{ top: '30%', transform: 'translateY(-50%)' }}
      />
      <Handle 
        id="source-right"
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 !bg-white transition-all duration-300 hover:scale-150 opacity-60 hover:opacity-100" 
        style={{ top: '70%', transform: 'translateY(-50%)' }}
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
            className="ml-auto p-1 hover:bg-white hover:bg-opacity-20 rounded transition-all duration-200 hover:scale-110 opacity-0 group-hover:opacity-100"
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
      {/* Enhanced Connection Handles - Multiple handles for flexible connections */}
      {/* Top handles */}
      <Handle 
        id="target-top"
        type="target" 
        position={Position.Top} 
        className="w-3 h-3 !bg-purple-500 transition-all duration-300 hover:scale-150 opacity-60 hover:opacity-100" 
        style={{ left: '50%', transform: 'translateX(-50%)' }}
      />
      
      {/* Bottom handles */}
      <Handle 
        id="source-bottom"
        type="source" 
        position={Position.Bottom} 
        className="w-3 h-3 !bg-purple-500 transition-all duration-300 hover:scale-150 opacity-60 hover:opacity-100" 
        style={{ left: '50%', transform: 'translateX(-50%)' }}
      />
      
      {/* Left handles */}
      <Handle 
        id="target-left"
        type="target" 
        position={Position.Left} 
        className="w-3 h-3 !bg-purple-500 transition-all duration-300 hover:scale-150 opacity-60 hover:opacity-100" 
        style={{ top: '30%', transform: 'translateY(-50%)' }}
      />
      <Handle 
        id="source-left"
        type="source" 
        position={Position.Left} 
        className="w-3 h-3 !bg-purple-500 transition-all duration-300 hover:scale-150 opacity-60 hover:opacity-100" 
        style={{ top: '70%', transform: 'translateY(-50%)' }}
      />
      
      {/* Right handles */}
      <Handle 
        id="target-right"
        type="target" 
        position={Position.Right} 
        className="w-3 h-3 !bg-purple-500 transition-all duration-300 hover:scale-150 opacity-60 hover:opacity-100" 
        style={{ top: '30%', transform: 'translateY(-50%)' }}
      />
      <Handle 
        id="source-right"
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 !bg-purple-500 transition-all duration-300 hover:scale-150 opacity-60 hover:opacity-100" 
        style={{ top: '70%', transform: 'translateY(-50%)' }}
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
            className="ml-auto p-1 hover:bg-purple-200 rounded transition-all duration-200 hover:scale-110 opacity-0 group-hover:opacity-100"
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
const SubpageWindow = React.memo(({ type, data, onClose, setMindMapData, loadMindMapData, onAutoSave }) => {
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
    if (isLoading) return; // Prevent multiple simultaneous saves
    
    setIsLoading(true);
    try {
      const endpoint = type === 'literature' ? 'literature' : `${type}s`;
      const response = await axios.put(`${API}/${endpoint}/${data.id}`, editData);
      setIsEditing(false);
      setOriginalData(editData);
      
      // PERFORMANCE FIX: Optimized state update to prevent full re-render
      const updatedData = response.data;
      setMindMapData(prevData => {
        const newData = { ...prevData };
        if (type === 'literature') {
          newData.literature = newData.literature.map(item => 
            item.id === data.id ? updatedData : item
          );
        } else {
          const key = type + 's';
          newData[key] = newData[key].map(item => 
            item.id === data.id ? updatedData : item
          );
        }
        
        // Trigger auto-save asynchronously to prevent blocking
        if (onAutoSave) {
          setTimeout(() => onAutoSave(newData), 0);
        }
        
        return newData;
      });
      
      // PERFORMANCE FIX: Use RequestAnimationFrame for smooth UI updates
      requestAnimationFrame(() => {
        setTimeout(() => {
          loadMindMapData();
        }, 50); // Reduced delay for more responsive feel
      });
      
    } catch (error) {
      console.error('Error saving data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [type, data.id, editData, setMindMapData, onAutoSave, loadMindMapData, isLoading]);

  // PERFORMANCE FIX: Memoize cancel handler
  const handleCancel = useCallback(() => {
    setEditData(originalData);
    setIsEditing(false);
  }, [originalData]);

  // PERFORMANCE FIX: Memoize delete handler
  const handleDelete = useCallback(async () => {
    if (isLoading || !window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    
    setIsLoading(true);
    try {
      const endpoint = type === 'literature' ? 'literature' : `${type}s`;
      await axios.delete(`${API}/${endpoint}/${data.id}`);
      
      // PERFORMANCE FIX: Optimized state update
      setMindMapData(prevData => {
        const newData = { ...prevData };
        if (type === 'literature') {
          newData.literature = newData.literature.filter(item => item.id !== data.id);
        } else {
          const key = type + 's';
          newData[key] = newData[key].filter(item => item.id !== data.id);
        }
        
        // Trigger auto-save asynchronously
        if (onAutoSave) {
          setTimeout(() => onAutoSave(newData), 0);
        }
        
        return newData;
      });
      
      // PERFORMANCE FIX: Close subpage immediately for better UX
      onClose();
      
      // PERFORMANCE FIX: Refresh nodes asynchronously
      requestAnimationFrame(() => {
        setTimeout(() => {
          loadMindMapData();
        }, 50);
      });
      
    } catch (error) {
      console.error('Error deleting data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [type, data.id, setMindMapData, onAutoSave, onClose, loadMindMapData, isLoading]);

  // PERFORMANCE FIX: Early return with loading state for better UX
  if (!data) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-40 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-2xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <Loader2 size={24} className="animate-spin text-blue-600" />
            <span className="ml-2 text-gray-500">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  // PERFORMANCE FIX: Memoized optimized field renderer with reduced re-renders
  const renderEditableField = useCallback((label, field, type = 'text', options = {}) => {
    if (!editData) return null;
    
    const fieldValue = editData[field] || '';
    
    if (isEditing) {
      if (type === 'textarea') {
        return (
          <div key={field}>
            <h3 className="font-semibold text-gray-800 mb-2">{label}</h3>
            <textarea
              value={fieldValue}
              onChange={(e) => updateField(field, e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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
        return (
          <div key={field}>
            <h3 className="font-semibold text-gray-800 mb-2">{label}</h3>
            <input
              type={type}
              value={fieldValue}
              onChange={(e) => updateField(field, e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
          </div>
        );
      }
    } else {
      return (
        <div key={field}>
          <h3 className="font-semibold text-gray-800 mb-2">{label}</h3>
          <p className="text-gray-600">{fieldValue || `No ${label.toLowerCase()} available.`}</p>
        </div>
      );
    }
  }, [editData, isEditing, updateField]);

  // PERFORMANCE FIX: Memoized content renderer to prevent expensive re-calculations
  const renderContent = useMemo(() => {
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
  }, [type, editData, renderEditableField, flashcardProgress]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden animate-in fade-in duration-300">
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
              className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
              disabled={isLoading}
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-160px)]">
          {renderContent}
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

// Enhanced Main Dashboard Component with improved visual effects
const Dashboard = () => {
  const { fitView, setCenter, zoomTo, getViewport } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [mindMapData, setMindMapData] = useState({ topics: [], cases: [], tasks: [], literature: [] });
  const [isEditing, setIsEditing] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [focusedCategory, setFocusedCategory] = useState(null);
  const [showNodeSelector, setShowNodeSelector] = useState(false);
  const [openSubpage, setOpenSubpage] = useState(null); // { type, data }
  const [subpageData, setSubpageData] = useState(null);
  const [isReactFlowReady, setIsReactFlowReady] = useState(false);
  const [hasAppliedInitialLayout, setHasAppliedInitialLayout] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [exportProgress, setExportProgress] = useState({ show: false, progress: 0, message: '' });
  
  // Toast notifications state
  const [toasts, setToasts] = useState([]);

  // Helper function to add toast notifications
  const addToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now();
    const newToast = { id, message, type, duration };
    setToasts(prev => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

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

    localStorageUtils.save(data, onSaveStart, onSaveComplete);
  }, [addToast]);

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
      convertDataToReactFlow(mindMapData, true); // Preserve positions when toggling edit mode
    }
  }, [isEditing]);

  // Effect to apply initial layout when both React Flow and data are ready
  useEffect(() => {
    if (isReactFlowReady && mindMapData.topics.length > 0 && !hasAppliedInitialLayout && !loading) {
      setTimeout(() => {
        console.log('Applying initial hierarchical layout from useEffect...');
        applyLayout();
        setHasAppliedInitialLayout(true);
      }, 1000);
    }
  }, [isReactFlowReady, mindMapData, hasAppliedInitialLayout, loading]);

  const loadMindMapData = async () => {
    try {
      // First try to load from localStorage
      const localData = localStorageUtils.load();
      
      if (localData) {
        console.log('Loading data from localStorage');
        setMindMapData(localData);
        convertDataToReactFlow(localData);
        setLoading(false);
        
        // Apply initial layout if React Flow is ready and data has nodes
        if (isReactFlowReady && !hasAppliedInitialLayout && 
            (localData.topics.length > 0 || localData.cases.length > 0 || 
             localData.tasks.length > 0 || localData.literature?.length > 0)) {
          setTimeout(() => {
            console.log('Applying initial hierarchical layout from localStorage...');
            applyLayout();
            setHasAppliedInitialLayout(true);
          }, 1000);
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
      setMindMapData(response.data);
      convertDataToReactFlow(response.data);
      setLoading(false);
      
      // Save initial data to localStorage
      autoSaveMindMapData(response.data);
      
      // Apply initial layout if React Flow is ready and data has nodes
      if (isReactFlowReady && !hasAppliedInitialLayout && 
          (response.data.topics.length > 0 || response.data.cases.length > 0 || 
           response.data.tasks.length > 0 || response.data.literature?.length > 0)) {
        setTimeout(() => {
          console.log('Applying initial hierarchical layout from API...');
          applyLayout();
          setHasAppliedInitialLayout(true);
        }, 1000);
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
    
    // Apply initial layout if data is already loaded
    if (mindMapData.topics.length > 0 && !hasAppliedInitialLayout) {
      setTimeout(() => {
        console.log('Applying initial hierarchical layout after React Flow init...');
        applyLayout();
        setHasAppliedInitialLayout(true);
      }, 1000);
    }
  }, [mindMapData, hasAppliedInitialLayout]);
  const deleteNode = async (nodeId, nodeType) => {
    try {
      await axios.delete(`${API}/${nodeType}s/${nodeId}`);
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
        
        // Trigger auto-save
        autoSaveMindMapData(updatedData);
        
        return updatedData;
      });
      
    } catch (error) {
      console.error('Error deleting node:', error);
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

    // Convert topics to nodes
    data.topics.forEach(topic => {
      const nodeId = `topic-${topic.id}`;
      const currentPosition = currentPositions[nodeId];
      
      flowNodes.push({
        id: nodeId,
        type: 'topic',
        position: currentPosition || topic.position || { x: 0, y: 0 },
        data: {
          label: topic.title,
          category: topic.category,
          color: topic.color,
          flashcard_count: topic.flashcard_count,
          completed_flashcards: topic.completed_flashcards,
          originalData: topic,
          onDelete: isEditing ? () => deleteNode(topic.id, 'topic') : undefined
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
        data: {
          label: lit.title,
          authors: lit.authors,
          year: lit.year,
          originalData: lit,
          onDelete: isEditing ? () => deleteNode(lit.id, 'literature') : undefined
        }
      });

      // Create edges from literature to linked topics
      lit.linked_topics.forEach(topicId => {
        flowEdges.push({
          id: `literature-${lit.id}-topic-${topicId}`,
          source: `topic-${topicId}`,
          target: `literature-${lit.id}`,
          type: 'smoothstep',
          style: { stroke: '#8B5CF6', strokeWidth: 2, strokeDasharray: '4,4' }
        });
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
        data: {
          label: caseItem.case_id,
          diagnosis: caseItem.primary_diagnosis,
          age: caseItem.age,
          originalData: caseItem,
          onDelete: isEditing ? () => deleteNode(caseItem.id, 'case') : undefined
        }
      });

      // Create edges from topics to cases (hierarchy: Topic → Case)
      caseItem.linked_topics.forEach(topicId => {
        flowEdges.push({
          id: `topic-${topicId}-case-${caseItem.id}`,
          source: `topic-${topicId}`,
          target: `case-${caseItem.id}`,
          type: 'smoothstep',
          style: { stroke: '#3B82F6', strokeWidth: 3 }
        });
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
        data: {
          label: task.title,
          priority: task.priority,
          status: task.status,
          due_date: task.due_date,
          originalData: task,
          onDelete: isEditing ? () => deleteNode(task.id, 'task') : undefined
        }
      });

      // Create edges following hierarchy: Case → Task or Topic → Task
      if (task.linked_case_id) {
        flowEdges.push({
          id: `case-${task.linked_case_id}-task-${task.id}`,
          source: `case-${task.linked_case_id}`,
          target: `task-${task.id}`,
          type: 'smoothstep',
          style: { stroke: '#F59E0B', strokeWidth: 2 }
        });
      } else if (task.linked_topic_id) {
        flowEdges.push({
          id: `topic-${task.linked_topic_id}-task-${task.id}`,
          source: `topic-${task.linked_topic_id}`,
          target: `task-${task.id}`,
          type: 'smoothstep',
          style: { stroke: '#F59E0B', strokeWidth: 2 }
        });
      }
    });

    setNodes(flowNodes);
    setEdges(flowEdges);
  };

  const onConnect = useCallback((params) => {
      const newEdge = {
        ...params,
        type: 'smoothstep',
        style: { stroke: '#6B7280', strokeWidth: 2 }
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const onNodeClick = (event, node) => {
    setSelectedNode(node);
    console.log('Node clicked:', node);
  };

  // PERFORMANCE FIX: Optimized node double-click handler with debouncing
  const onNodeDoubleClick = useCallback((event, node) => {
    console.log('Double-clicking node:', node);
    
    // Prevent multiple rapid clicks that could cause performance issues
    if (openSubpage) return;
    
    // Extract the node type and full ID
    const nodeType = node.id.split('-')[0];
    const nodeId = node.id.substring(nodeType.length + 1);
    console.log('Extracted nodeType:', nodeType, 'nodeId:', nodeId);
    
    // PERFORMANCE FIX: Open subpage immediately for better UX, load data asynchronously
    setOpenSubpage({ type: nodeType, id: nodeId });
    setSubpageData(null); // Clear previous data immediately
    
    // Load data asynchronously to prevent blocking
    requestAnimationFrame(() => {
      loadSubpageData(nodeType, nodeId);
    });
  }, [openSubpage]);

  // PERFORMANCE FIX: Optimized async data loading with error handling and timeout
  const loadSubpageData = useCallback(async (nodeType, nodeId) => {
    try {
      console.log('Loading subpage data for:', nodeType, nodeId);
      const endpoint = nodeType === 'literature' ? 'literature' : `${nodeType}s`;
      console.log('API endpoint:', `${API}/${endpoint}/${nodeId}`);
      
      // PERFORMANCE FIX: Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await axios.get(`${API}/${endpoint}/${nodeId}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // PERFORMANCE FIX: Update state asynchronously to prevent blocking
      requestAnimationFrame(() => {
        setSubpageData(response.data);
      });
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('Request timed out for:', nodeType, nodeId);
        addToast('Loading timed out. Please try again.', 'error');
      } else {
        console.error('Error loading subpage data:', error);
        addToast('Error loading data. Please try again.', 'error');
      }
      
      // Set empty data to prevent infinite loading
      setSubpageData(null);
    }
  }, [addToast]);

  // PERFORMANCE FIX: Optimized close handler with immediate state cleanup
  const closeSubpage = useCallback(() => {
    // Immediate cleanup for responsive UX
    setOpenSubpage(null);
    setSubpageData(null);
  }, []);

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
      console.log(`Applying hierarchical layout to ${nodes.length} nodes and ${edges.length} edges`);
      
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        nodes,
        edges,
        'TB' // Top to Bottom hierarchical layout
      );

      // Update node positions with smooth transition
      setNodes([...layoutedNodes]);
      setEdges([...layoutedEdges]);

      // Auto-save positions to backend
      setTimeout(() => {
        console.log('Auto-saving realigned positions...');
        // The handleNodesChange will trigger auto-save
      }, 200);

      // Adjust viewport to show all realigned nodes with increased delay
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
      }, 500); // Increased delay to 500ms

      console.log('Layout applied successfully');
      
    } catch (error) {
      console.error('Error applying layout:', error);
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
      // Find a free position that doesn't overlap with existing nodes
      const findFreePosition = () => {
        const existingPositions = nodes.map(node => node.position);
        const gridSize = 300; // Spacing between potential positions
        
        // Try positions in a grid pattern
        for (let y = -200; y < 800; y += gridSize) {
          for (let x = -400; x < 1200; x += gridSize) {
            const testPosition = { x, y };
            const tooClose = existingPositions.some(pos => 
              Math.abs(pos.x - testPosition.x) < 250 && 
              Math.abs(pos.y - testPosition.y) < 150
            );
            
            if (!tooClose) {
              return testPosition;
            }
          }
        }
        
        // Fallback to a random position if no free grid position found
        return { 
          x: Math.random() * 600 - 300, 
          y: Math.random() * 400 - 200 
        };
      };

      const newPosition = findFreePosition();
      
      let newData = {};
      switch(nodeType) {
        case 'topic':
          newData = {
            title: 'New Topic',
            description: 'New topic description',
            category: 'New Category',
            color: '#3B82F6'
          };
          break;
        case 'case':
          newData = {
            case_id: `CASE-${Date.now()}`,
            encounter_date: new Date().toISOString(),
            primary_diagnosis: 'New Diagnosis',
            chief_complaint: 'New complaint',
            linked_topics: []
          };
          break;
        case 'task':
          newData = {
            title: 'New Task',
            description: 'New task description',
            priority: 'medium',
            status: 'pending'
          };
          break;
        case 'literature':
          newData = {
            title: 'New Literature',
            authors: 'New Author',
            publication: 'New Publication',
            year: new Date().getFullYear(),
            linked_topics: []
          };
          break;
      }

      // Set position
      newData.position = newPosition;

      const response = await axios.post(`${API}/${nodeType === 'literature' ? 'literature' : nodeType + 's'}`, newData);
      const newNodeData = response.data;
      
      // Add the new node to existing nodes without resetting positions
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
          onDelete: isEditing ? () => deleteNode(newNodeData.id, nodeType) : undefined
        }
      };

      // Add to existing nodes array instead of reloading all data
      setNodes((nds) => [...nds, newNode]);
      
      // Update mindMapData state to include the new node
      setMindMapData(prevData => {
        const updatedData = {
          ...prevData,
          [nodeType === 'literature' ? 'literature' : nodeType + 's']: [
            ...prevData[nodeType === 'literature' ? 'literature' : nodeType + 's'],
            newNodeData
          ]
        };
        
        // Trigger auto-save
        autoSaveMindMapData(updatedData);
        
        return updatedData;
      });
      
    } catch (error) {
      console.error('Error adding new node:', error);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-2xl text-gray-600">Loading PGY-3 HQ...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar */}
      <div className="w-80 bg-gradient-to-b from-slate-800 to-slate-900 text-white p-6 shadow-2xl">
        <div className="mb-8">
          <div className="text-3xl font-thin tracking-wide text-white mb-1">PGY-3</div>
          <div className="text-3xl font-bold tracking-wide text-white">HQ</div>
          <div className="text-sm text-slate-300 mt-2">Psychiatry Resident Dashboard</div>
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

          {isEditing && (
            <>
              <button
                onClick={() => setShowNodeSelector(true)}
                className="w-full flex items-center gap-2 px-4 py-2 rounded-md text-sm bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} />
                Add New Node
              </button>

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
          onInit={onReactFlowInit}
          nodeTypes={nodeTypes}
          fitView
          nodesDraggable={true}
          nodesConnectable={isEditing}
          edgesReconnectable={isEditing}
          edgesFocusable={isEditing}
          elementsSelectable={true}
          className="bg-gradient-to-br from-slate-50 to-slate-100"
          defaultEdgeOptions={{
            type: 'smoothstep',
            style: { strokeWidth: 2, stroke: '#6B7280' },
            markerEnd: {
              type: 'arrowclosed',
              width: 15,
              height: 15,
              color: '#6B7280',
            }
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
          />
          
          <Panel position="top-right" className="bg-white rounded-lg shadow-lg p-4 m-4">
            <div className="text-sm font-semibold text-gray-700 mb-2">Instructions</div>
            <div className="text-xs text-gray-500 space-y-1">
              <div>• Click to select nodes</div>
              <div>• Double-click to view details</div>
              <div>• Hover and drag to reposition</div>
              <div>• {isEditing ? 'Connect nodes by dragging handles' : 'Edit mode: create connections'}</div>
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